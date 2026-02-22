import { Block } from '../../core/Block';
import { AuthAPI } from '../../api/AuthAPI';
import { compile } from 'handlebars';
import { router } from '../../main';
import { ChatsAPI } from '../../api/ChatsAPI';

import { ChatList } from '../../components/chat/ChatList/ChatList';
import { ChatItem, ChatItemProps } from '../../components/chat/ChatItem/ChatItem';
import { ChatHeader } from '../../components/chat/ChatHeader/ChatHeader';
import { MessageList } from '../../components/chat/MessageList/MessageList';
import { Message as MessageComponent } from '../../components/chat/Message/Message';
import { MessageInput } from '../../components/chat/MessageInput/MessageInput';
import { Modal } from '../../components/modal/Modal';
import { CreateChatForm } from '../../components/forms/CreateChatForm/CreateChatForm';

import { WebSocketTransport } from '../../utils/WebSocket';
import store, { StoreEvents } from '../../store/Store';
import { ChatMessage } from '../../models/Chat';

import templateSource from './messenger.hbs';

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  active?: boolean;
}

export class MessengerPage extends Block {
  private chatList: ChatList;
  private chatHeader: ChatHeader;
  private messageList: MessageList;
  private messageInput: MessageInput;
  private createChatModal: Modal;
  private createChatForm: CreateChatForm;
  private currentChatId: number | null = null;
  private chats: Chat[] = [];
  private messages: Record<number, ChatMessage[]> = {};
  private wsTransport: WebSocketTransport | null = null;
  private currentUserId: number = 0;
  private currentUserInitials: string = '';
  private isLoadingChats: boolean = false;

  constructor() {

    const chatList = new ChatList({
      items: []
    });
    
    const chatHeader = new ChatHeader({
      title: 'Выберите чат',
      avatar: '',
      status: ''
    });

    const messageList = new MessageList({ 
      messages: [] 
    });

    const messageInput = new MessageInput({
      placeholder: 'Введите сообщение...',
      onSubmit: (message: string) => this.sendMessage(message)
    });

    const createChatForm = new CreateChatForm({
      id: 'create-chat-form',
      onSubmit: (title: string, userLogin?: string) => this.handleCreateChat(title, userLogin),
      onCancel: () => this.createChatModal.close()
    });

    const createChatModal = new Modal({
      id: 'create-chat-modal',
      title: 'Создать новый чат',
      isOpen: false,
      onClose: () => this.createChatModal.close(),
      children: {
        body: createChatForm
      }
    });

    super('div', {
      children: {
        chatList,
        chatHeader,
        messageList,
        messageInput,
        createChatModal
      },
      events: {
        click: (e: Event) => {
          const target = e.target as HTMLElement;
          
          const dropdownButton = target.closest('.dropdown-menu__button');
          if (dropdownButton) {
            e.preventDefault();
            const menu = dropdownButton.nextElementSibling as HTMLElement;
            if (menu) {
              menu.classList.toggle('visible');
            }
            return;
          }

          const menuItem = target.closest('.dropdown-menu__item');
          if (menuItem) {
            e.preventDefault();
            const action = menuItem.getAttribute('data-action');
            this.handleMenuAction(action);
            
            const menu = menuItem.closest('.dropdown-menu__list');
            if (menu) {
              menu.classList.remove('visible');
            }
            return;
          }

          const link = target.closest('a');
          if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
              router.go(href);
            }
          }
        }
      }
    });

    this.chatList = chatList;
    this.chatHeader = chatHeader;
    this.messageList = messageList;
    this.messageInput = messageInput;
    this.createChatForm = createChatForm;
    this.createChatModal = createChatModal;
    this.chats = [];
    
    const user = store.getState().user;

    if (user && user.id) {
      this.currentUserId = user.id;
      this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
    } else {
      console.error('❌ No user found in store');
    }
    
    store.on(StoreEvents.UPDATED, this.handleStoreUpdate.bind(this));
  }

  private handleStoreUpdate(prevState: any, nextState: any): void {

    if (nextState.user && !this.currentUserId) {
      this.currentUserId = nextState.user.id;
      this.currentUserInitials = (nextState.user.first_name?.[0] || 'И') + (nextState.user.second_name?.[0] || 'И');
      this.loadChats();
    }

    if (nextState.currentChat.id !== prevState.currentChat.id) {
      if (nextState.currentChat.id) {
        const currentChat = this.chats.find(c => c.id === nextState.currentChat.id);
        if (currentChat) {
          const newChatHeader = new ChatHeader({
            title: currentChat.name,
            avatar: currentChat.avatar,
            status: nextState.currentChat.messages?.length > 0 ? 'Online' : 'New chat'
          });
          
          this.chatHeader = newChatHeader;
          
          this.setProps({
            children: {
              ...this.getChildren(),
              chatHeader: this.chatHeader
            }
          });
        }
      }
      this.connectToChat(nextState.currentChat.id, nextState.currentChat.token);
    }
    
    if (nextState.currentChat.messages !== prevState.currentChat.messages) {
      this.updateMessagesList(nextState.currentChat.messages);
    }
  }

  private async connectToChat(chatId: number, token: string): Promise<void> {
    
    if (!chatId || !token || !this.currentUserId) {
      if (!this.currentUserId) {
        const user = store.getState().user;
        if (user) {
          this.currentUserId = user.id;
          this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
          
          if (this.currentUserId) {
            this.connectToChat(chatId, token);
          }
        }
      }
      return;
    }
    
    if (this.wsTransport) {
      this.wsTransport.close();
      this.wsTransport = null;
    }
    this.wsTransport = new WebSocketTransport(this.currentUserId, chatId, token);
  
    this.wsTransport.onStatus((status) => {
      if (status === 'connected') {
        this.wsTransport?.getOldMessages(0);
      }
    });
    
    this.wsTransport.connect();
  }

  private updateMessagesList(messages: ChatMessage[]): void {

    if (!messages || messages.length === 0) {
      this.messageList.setMessages([]);
      return;
    }

    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const messageItems = sortedMessages.map(msg => {
      const type = msg.user_id === this.currentUserId ? 'mine' : 'theirs';
      const sender = msg.user_id !== this.currentUserId ? 
        this.chats.find(c => c.id === msg.chat_id)?.name || null : null;
      const avatar = sender ? this.chats.find(c => c.id === msg.chat_id)?.avatar || null : null;

      return new MessageComponent({
        id: msg.id,
        type,
        text: msg.content,
        time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: msg.is_read ? 'read' : 'delivered',
        sender,
        avatar
      });
    });
  
    this.messageList.setMessages(messageItems);
  
    setTimeout(() => {
      this.messageList.scrollToBottom();
    }, 0);
  }

  private updateChatList(): void {
    
    if (!this.chats || this.chats.length === 0) {
      this.chatList.setProps({ items: [] });
      return;
    }

    const chatItems: ChatItem[] = [];

    this.chats.forEach(chat => {
      if (!chat) return;
      
      const props: ChatItemProps = {
        id: chat.id,
        name: chat.name,
        avatar: chat.avatar,
        time: chat.time,
        lastMessage: chat.lastMessage,
        active: chat.id === this.currentChatId,
        onClick: (id: number) => this.switchChat(id)
      };
      
      if (chat.unreadCount && chat.unreadCount > 0) {
        props.unreadCount = chat.unreadCount;
      }
      
      chatItems.push(new ChatItem(props));
    });
  
    this.chatList.setItems(chatItems);
  }

  private async switchChat(chatId: number): Promise<void> {
    
    if (!chatId) {
      return;
    }

    if (!this.currentUserId) {
      const user = store.getState().user;
      if (user && user.id) {
        this.currentUserId = user.id;
        this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
      } else {
        setTimeout(() => {
          if (!this.currentUserId) {
            const retryUser = store.getState().user;
            if (retryUser) {
              this.currentUserId = retryUser.id;
              this.switchChat(chatId);
            }
          }
        }, 1000);
        return;
      }
    }

    if (chatId === this.currentChatId) {
      return;
    }
    
    const chatExists = this.chats?.some(chat => chat.id === chatId);
    if (!chatExists) {
      return;
    }
    this.currentChatId = chatId;
    
    const token = await ChatsAPI.getToken(chatId);

    let messages: ChatMessage[] = [];
    try {
      messages = await ChatsAPI.getChatMessages(chatId);
    } catch {
      messages = [];
    }
    store.setCurrentChat(chatId, messages, token);
    
    const currentChat = this.chats.find(c => c.id === chatId)!;
    
    if (!currentChat) {
      return;
    }

    const newChatHeader = new ChatHeader({
      title: currentChat.name,
      avatar: currentChat.avatar,
      status: messages.length > 0 ? 'Online' : 'New chat'
    });
    
    this.chatHeader = newChatHeader;
    
    this.setProps({
      children: {
        ...this.getChildren(),
        chatHeader: this.chatHeader
      }
    });

    this.updateMessagesList(messages);
    this.connectToChat(chatId, token);
  }

  private sendMessage(message: string): void {
    if (!message.trim()) return;
    
    if (this.wsTransport && this.wsTransport.isActive()) {
      this.wsTransport.sendMessage(message);
      this.messageInput.clear();
    }
  }

  private handleMenuAction(action: string | null): void {
    switch (action) {
      case 'new-chat':
        this.createChatModal.open();
        break;
      case 'settings':
        router.go('/settings');
        break;
      case 'clear':
        if (this.currentChatId && confirm('Очистить историю сообщений?')) {
          this.messages[this.currentChatId] = [];
          this.updateMessagesList([]);
        }
        break;
      case 'logout':
        this.handleLogout();
        break;
    }
  }

  private async loadChats(): Promise<void> {
    
    if (this.isLoadingChats) {
      return;
    }

    try {
      this.isLoadingChats = true;
      
      if (!this.currentUserId) {
        const user = store.getState().user;
        if (user && user.id) {
          this.currentUserId = user.id;
          this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
        } else {
          this.isLoadingChats = false;
          if (!this.userCheckStarted) {
            this.startUserCheck();
          }
          return;
        }
      }

      const chatsData = await ChatsAPI.getChats();
      
      if (!chatsData) {
        return;
      }

      const processedChats = chatsData
        .filter(chat => chat != null)
        .map(chat => ({
          id: chat.id,
          name: chat.title || 'Без названия',
          avatar: chat.avatar || (chat.title?.[0] || 'Ч'),
          lastMessage: chat.last_message?.content || 'Нет сообщений',
          time: chat.last_message ? new Date(chat.last_message.time).toLocaleTimeString() : '',
          unreadCount: chat.unread_count || 0
        }));
      
      this.chats = processedChats;
      this.updateChatList();

      if (this.chats && this.chats.length > 0 && !this.currentChatId && this.currentUserId) {
        const firstChat = this.chats[0];
        if (firstChat && firstChat.id) {
          await this.switchChat(firstChat.id);
        } else {
          this.updateMessagesList([]);
        }
      } else {
        this.updateMessagesList([]);
      }
    } catch {
      this.updateMessagesList([]);
    } finally {
      this.isLoadingChats = false;
    }
  }

  private userCheckStarted: boolean = false;

  private startUserCheck(): void {
    if (this.userCheckStarted) return;
    this.userCheckStarted = true;
    
    const checkInterval = setInterval(() => {
      const user = store.getState().user;
      
      if (user && user.id) {
        this.currentUserId = user.id;
        this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
        
        clearInterval(checkInterval);
        this.userCheckStarted = false;
        this.loadChats();
      }
    }, 500);
    
    setTimeout(() => {
      if (this.userCheckStarted) {
        clearInterval(checkInterval);
        this.userCheckStarted = false;
      }
    }, 10000);
  }

  private async handleLogout(): Promise<void> {
    
    try {
      if (confirm('Вы действительно хотите выйти?')) {
        await AuthAPI.logout();
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        
        store.setState({
          user: null,
          chats: [],
          currentChat: {
            id: null,
            messages: [],
            token: null
          }
        });
        router.go('/');
      }
    } catch {
      alert('Ошибка при выходе из системы');
    }
  }

  private async handleCreateChat(title: string, userLogin?: string): Promise<void> {
    const result = await ChatsAPI.createChat({ title });
    if (userLogin && userLogin.trim()) {
      const users = await AuthAPI.searchUsers(userLogin);
      if (users.length > 0) {
        const user = users[0];
        if (user) {
          await ChatsAPI.addUserToChat({
            users: [user.id],
            chatId: result.id
          });
        }
      }
    }
    this.createChatModal.close();
    this.createChatForm.reset();
    
    await this.loadChats();
  }

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();
    const context: Record<string, string> = {
      userInitials: this.currentUserInitials
    };
    
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });
    return template(context);
  }

  public override show(): void {
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }

    document.body.classList.add('messenger-mode');
    
    setTimeout(() => {
      this.messageList.scrollToBottom();
    }, 100);
  }

  public override hide(): void {
    const content = this.getContent();
    if (content) {
      content.style.display = 'none';
    }

    document.body.classList.remove('messenger-mode');
    
    if (this.wsTransport) {
      this.wsTransport.close();
      this.wsTransport = null;
    }
  }

  protected override componentDidMount(): void {
    this.loadChats();
    
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-menu')) {
        document.querySelectorAll('.dropdown-menu__list.visible').forEach(menu => {
          menu.classList.remove('visible');
        });
      }
    });
  }
}
