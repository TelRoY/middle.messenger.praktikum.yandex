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
import { UserManagementForm } from '../../components/forms/UserManagementForm/UserManagementForm';
import { BASE_URL } from '../../utils/HTTPClient';
import { WebSocketTransport } from '../../utils/WebSocket';
import store, { StoreEvents } from '../../store/Store';
import { ChatMessage } from '../../models/Chat';
import { User } from '../../models/User';

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
  private chatHeader: ChatHeader;
  private chatList: ChatList;
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
  private currentUserAvatar: string = '';

  constructor() {
    
    const chatHeader = new ChatHeader({
      title: 'Выберите чат',
      avatar: '',
      status: ''
    });

    const chatList = new ChatList({
      items: []
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
        createChatModal,
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

    this.chatHeader = chatHeader;
    this.chatList = chatList;
    this.messageList = messageList;
    this.messageInput = messageInput;
    this.createChatForm = createChatForm;
    this.createChatModal = createChatModal;
    this.chats = [];
    
    const user = store.getState().user;

    if (user && user.id) {
      this.currentUserId = user.id;
      this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
      this.currentUserAvatar = user.avatar;
    }

    const storedChats = store.getState().chats;
    if (storedChats && storedChats.length > 0) {
      this.chats = storedChats.map(chat => ({
        id: chat.id,
        name: chat.title,
        avatar: chat.avatar || (chat.title?.[0] || 'Ч'),
        lastMessage: chat.last_message?.content || 'Нет сообщений',
        time: chat.last_message ? new Date(chat.last_message.time).toLocaleTimeString() : '',
        unreadCount: chat.unread_count || 0
      }));
      this.updateChatList();
    }
    
    store.on(StoreEvents.UPDATED, this.handleStoreUpdate.bind(this));
  }

  private handleStoreUpdate(prevState: any, nextState: any): void {
    console.log('📦 Store updated:', {
      prevChat: prevState.currentChat?.id,
      nextChat: nextState.currentChat?.id,
      currentChatId: this.currentChatId
    });

    if (nextState.user && (!prevState.user || nextState.user.avatar !== prevState.user.avatar)) {
      this.currentUserId = nextState.user.id;
      this.currentUserInitials = (nextState.user.first_name?.[0] || 'И') + (nextState.user.second_name?.[0] || 'И');
      this.currentUserAvatar = nextState.user.avatar;
      this.forceUpdate();
    }

    if (nextState.user && !this.currentUserId) {
      this.currentUserId = nextState.user.id;
      this.currentUserInitials = (nextState.user.first_name?.[0] || 'И') + (nextState.user.second_name?.[0] || 'И');
      this.loadChats();
    }

    if (nextState.currentChat.id !== prevState.currentChat.id) {
      console.log('🔄 Chat changed to', nextState.currentChat.id);

      if (nextState.currentChat.id) {
        const currentChat = this.chats.find(c => c.id === nextState.currentChat.id);
        if (currentChat) {
          console.log('📋 Updating chat header for:', currentChat.name);
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

          this.forceUpdateChatHeader(
            currentChat.name, 
            currentChat.avatar, 
            nextState.currentChat.messages?.length > 0 ? 'Online' : 'New chat'
          );

          console.log('✅ ChatHeader updated from store');
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
      this.chatList.setItems([]);
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

    const selectedChat = this.chats.find(c => c.id === chatId);
    if (!selectedChat) {
      console.error('❌ Chat not found:', chatId);
      return;
    }

    console.log('✅ Selected chat:', selectedChat.name);
    this.currentChatId = chatId;
    
    const token = await ChatsAPI.getToken(chatId);

    let messages: ChatMessage[] = [];
    try {
      messages = await ChatsAPI.getChatMessages(chatId);
    } catch {
      messages = [];
    }

    store.setCurrentChat(chatId, messages, token);

    console.log('📋 Creating new ChatHeader with title:', selectedChat.name);
    
    const newChatHeader = new ChatHeader({
      title: selectedChat.name,
      avatar: selectedChat.avatar,
      status: messages.length > 0 ? 'Online' : 'New chat'
    });

    this.chatHeader = newChatHeader;

    console.log('👥 Children before update:', Object.keys(this.getChildren()));

    this.setProps({
      children: {
        ...this.getChildren(),
        chatHeader: this.chatHeader
      }
    });
    console.log('👥 Children after update:', Object.keys(this.getChildren()));

    console.log('✅ ChatHeader updated');

    this.forceUpdateChatHeader(selectedChat.name, selectedChat.avatar, messages.length > 0 ? 'Online' : 'New chat');

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
      case 'manage-user':
        this.openUserManagementModal();
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
      case 'delete-chat':
        this.handleDeleteChat();
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
          this.currentUserAvatar = user.avatar;
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

      const processedChats = await Promise.all(
        chatsData
          .filter(chat => chat != null)
          .map(async (chat) => {
            let chatName = chat.title;
            let chatAvatar = chat.avatar;
            if (!chat.avatar) {
              try {
                const users = await ChatsAPI.getChatUsers(chat.id);
                const otherUser = users.find(u => u.id !== this.currentUserId);
                if (otherUser) {
                  chatName = `${otherUser.first_name} ${otherUser.second_name}`;
                  chatAvatar = otherUser.avatar;
                }
              } catch (error) {
                console.error('Failed to get chat users:', error);
              }
            }

            const fullAvatar = chatAvatar 
              ? (chatAvatar.startsWith('http') ? chatAvatar : `${BASE_URL}/resources${chatAvatar}`)
              : (chatName[0] || 'Ч');
            return {
              id: chat.id,
              name: chatName,
              avatar: fullAvatar,
              lastMessage: chat.last_message?.content || 'Нет сообщений',
              time: chat.last_message ? new Date(chat.last_message.time).toLocaleTimeString() : '',
              unreadCount: chat.unread_count || 0
            };
          })
        );
      
      this.chats = processedChats;
      store.setState({ chats: chatsData });
      this.updateChatList();

      if (this.currentChatId && !this.chats.some(c => c.id === this.currentChatId)) {
        this.currentChatId = null;
        
        const newChatHeader = new ChatHeader({
          title: 'Выберите чат',
          avatar: '',
          status: ''
        });
        
        this.chatHeader = newChatHeader;
        
        this.setProps({
          children: {
            ...this.getChildren(),
            chatHeader: this.chatHeader
          }
        });
  
        this.updateMessagesList([]);
      }

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
    
    try{
      let chatTitle = title;
      let userForChat: User | null = null;

      if (userLogin && userLogin.trim()) {
        const users = await AuthAPI.searchUsers(userLogin);
        if (users.length > 0 && users[0]) {
          userForChat = users[0];
          chatTitle = `${userForChat.first_name} ${userForChat.second_name}`;
        }
      }
      const result = await ChatsAPI.createChat({ title: chatTitle });
      console.log('✅ Chat created:', result);
      if (userForChat) {
        await ChatsAPI.addUserToChat({
          users: [userForChat.id],
          chatId: result.id
        });
      }

      this.createChatModal.close();
      this.createChatForm.reset();
    
      await this.loadChats();
    } catch (error) {
      console.error('❌ Failed to create chat:', error);
    }
  }

  private async handleDeleteChat(): Promise<void> {
    if (!this.currentChatId) {
      alert('Чат не выбран');
      return;
    }
  
    const confirmDelete = confirm('Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.');
    if (!confirmDelete) return;
  
    try {
      console.log('🗑️ Deleting chat', this.currentChatId);
      
      await ChatsAPI.deleteChat(this.currentChatId);
      
      this.chats = this.chats.filter(chat => chat.id !== this.currentChatId);
      
      this.currentChatId = null;
      
      const newChatHeader = new ChatHeader({
        title: 'Выберите чат',
        avatar: '',
        status: ''
      });
      
      this.chatHeader = newChatHeader;
      
      this.setProps({
        children: {
          ...this.getChildren(),
          chatHeader: this.chatHeader
        }
      });
  
      this.updateMessagesList([]);
      
      this.updateChatList();
      
      if (this.wsTransport) {
        this.wsTransport.close();
        this.wsTransport = null;
      }
      
      alert('Чат успешно удален');
      
    } catch (error) {
      console.error('❌ Failed to delete chat:', error);
      alert('Ошибка при удалении чата');
    }
  }
  private async openUserManagementModal(): Promise<void> {
    if (!this.currentChatId) return;
  
    const form = new UserManagementForm({
      id: 'user-management-form',
      chatId: this.currentChatId,
      currentUserId: this.currentUserId,
      onAddUser: async (userId: number) => {
        try {
          await ChatsAPI.addUserToChat({
            users: [userId],
            chatId: this.currentChatId!
          });
          
          const updatedUsers = await ChatsAPI.getChatUsers(this.currentChatId!);
          form.updateUsers(updatedUsers);
          
          alert('Пользователь добавлен');
        } catch (error) {
          alert('Ошибка: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
        }
      },
      onRemoveUser: async (userId: number) => {
        if (confirm('Удалить пользователя из чата?')) {
          try {
            await ChatsAPI.deleteUserFromChat({
              users: [userId],
              chatId: this.currentChatId!
            });
            
            const updatedUsers = await ChatsAPI.getChatUsers(this.currentChatId!);
            form.updateUsers(updatedUsers);
            
            alert('Пользователь удален');
          } catch (error) {
            alert('Ошибка: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
          }
        }
      },
      onClose: () => {
        document.getElementById('user-management-modal')?.remove();
      }
    });
  
    const modal = document.createElement('div');
    modal.id = 'user-management-modal';
    modal.className = 'modal modal--open';
    
    const overlay = document.createElement('div');
    overlay.className = 'modal__overlay';
    
    const content = document.createElement('div');
    content.className = 'modal__content';
    
    const header = document.createElement('div');
    header.className = 'modal__header';
    header.innerHTML = `
      <h3 class="modal__title">Управление участниками</h3>
      <button class="modal__close" data-action="close">&times;</button>
    `;
    
    const body = document.createElement('div');
    body.className = 'modal__body';
    body.appendChild(form.getContent());
    
    content.appendChild(header);
    content.appendChild(body);
    modal.appendChild(overlay);
    modal.appendChild(content);
    
    document.body.appendChild(modal);
  
    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('modal__overlay') || 
          target.closest('[data-action="close"]')) {
        modal.remove();
      }
    });
  }

  private forceUpdateChatHeader(title: string, avatar: string, status: string): void {
    console.log('🔄 Force updating chat header with title:', title);
    
    const content = this.getContent();
    const headerElement = content.querySelector('.chat-header');
    
    if (headerElement) {
      const newChatHeader = new ChatHeader({ title, avatar, status });
      const newHeaderHtml = newChatHeader.render();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newHeaderHtml;
      const newHeaderElement = tempDiv.firstElementChild;

      if (newHeaderElement) {
        headerElement.replaceWith(newHeaderElement);

        this._removeEvents();
        this._addEvents();
      }
    }
  }

  private forceUpdate(): void {
    const content = this.getContent();
    if (content) {
      content.innerHTML = this.render();
      this._replacePlaceholders();
      this._addEvents();
    }
  }

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();

    let avatarUrl = '';
    if (this.currentUserAvatar) {
      avatarUrl = this.currentUserAvatar.startsWith('http') 
        ? this.currentUserAvatar 
        : `${BASE_URL}/resources${this.currentUserAvatar}`;
    }

    const context: Record<string, string> = {
      userInitials: this.currentUserInitials,
      userAvatar: avatarUrl
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
