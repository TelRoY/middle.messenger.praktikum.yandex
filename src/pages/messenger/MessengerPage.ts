import { Block } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './messenger.hbs';
import { router } from '../../main';
import { ChatList } from '../../components/chat/ChatList/ChatList';
import { ChatItem, ChatItemProps } from '../../components/chat/ChatItem/ChatItem';
import { ChatHeader } from '../../components/chat/ChatHeader/ChatHeader';
import { MessageList } from '../../components/chat/MessageList/MessageList';
import { Message as MessageComponent } from '../../components/chat/Message/Message';
import { MessageInput } from '../../components/chat/MessageInput/MessageInput';
import { AuthAPI } from '../../api/AuthAPI';
import { ChatsAPI } from '../../api/ChatsAPI';
import { WebSocketTransport } from '../../utils/WebSocket';
import store, { StoreEvents } from '../../store/Store';
import { ChatMessage } from '../../models/Chat';
import { Modal } from '../../components/modal/Modal';
import { CreateChatForm } from '../../components/forms/CreateChatForm/CreateChatForm';

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
    console.log('🏗️ MessengerPage constructor started');

    const storeState = store.getState();
    console.log('📦 Store state in constructor:', {
      user: storeState.user,
      userId: storeState.user?.id,
      chats: storeState.chats.length
    });

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
          
          // Обработка выпадающих меню
          const dropdownButton = target.closest('.dropdown-menu__button');
          if (dropdownButton) {
            e.preventDefault();
            const menu = dropdownButton.nextElementSibling as HTMLElement;
            if (menu) {
              menu.classList.toggle('visible');
            }
            return;
          }

          // Обработка пунктов меню
          const menuItem = target.closest('.dropdown-menu__item');
          if (menuItem) {
            e.preventDefault();
            const action = menuItem.getAttribute('data-action');
            this.handleMenuAction(action);
            
            // Закрываем меню
            const menu = menuItem.closest('.dropdown-menu__list');
            if (menu) {
              menu.classList.remove('visible');
            }
            return;
          }

          // Обработка ссылок
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
    // this.createChatForm = new CreateChatForm({
    //   id: 'create-chat-form',
    //   onSubmit: (title: string, userLogin?: string) => this.handleCreateChat(title, userLogin),
    //   onCancel: () => this.createChatModal.close()
    // });
    // this.createChatModal = new Modal({
    //   id: 'create-chat-modal',
    //   title: 'Создать новый чат',
    //   isOpen: false,
    //   onClose: () => this.createChatModal.close(),
    //   children: {
    //     body: this.createChatForm
    //   }
    // });
    // this.setProps({
    //   children: {
    //     ...this.getChildren(),
    //     createChatModal: this.createChatModal
    //   }
    // });
    
    const user = store.getState().user;
    console.log('👤 User from store:', user);

    if (user && user.id) {
      this.currentUserId = user.id;
      this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
      console.log('👤 Current user ID:', this.currentUserId);
    } else {
      console.error('❌ No user found in store');
      // Подписываемся на изменения store, чтобы получить пользователя позже
      // store.on(StoreEvents.UPDATED, (nextState: any) => {
      //   if (nextState.user && !this.currentUserId) {
      //     this.currentUserId = nextState.user.id;
      //     this.currentUserInitials = (nextState.user.first_name?.[0] || 'И') + (nextState.user.second_name?.[0] || 'И');
      //     console.log('👤 User ID updated from store:', this.currentUserId);
        
      //     // Перезагружаем чаты после получения пользователя
      //     this.loadChats();
      //   }
      // });
    }
    
    store.on(StoreEvents.UPDATED, this.handleStoreUpdate.bind(this));
  }

  private handleStoreUpdate(prevState: any, nextState: any): void {
    console.log('📦 Store updated:', { 
      prevUser: prevState.user?.id,
      nextUser: nextState.user?.id,
      currentUserId: this.currentUserId,
      prevChat: prevState.currentChat?.id,
      nextChat: nextState.currentChat?.id,
      prevMessages: prevState.currentChat?.messages?.length,
      nextMessages: nextState.currentChat?.messages?.length
    });

    // Если появился пользователь, а у нас его нет
    if (nextState.user && !this.currentUserId) {
      console.log('🔄 User found in store update, setting currentUserId');
      this.currentUserId = nextState.user.id;
      this.currentUserInitials = (nextState.user.first_name?.[0] || 'И') + (nextState.user.second_name?.[0] || 'И');
      console.log('✅ Current user ID now:', this.currentUserId);
    
      // Перезагружаем чаты
      this.loadChats();
    }

    // Если изменился текущий чат
    if (nextState.currentChat.id !== prevState.currentChat.id) {
      console.log('🔄 Chat changed from', prevState.currentChat.id, 'to', nextState.currentChat.id);
      this.connectToChat(nextState.currentChat.id, nextState.currentChat.token);
    }
    
    // Обновляем список сообщений
    if (nextState.currentChat.messages !== prevState.currentChat.messages) {
      console.log('🔄 Messages updated, count:', nextState.currentChat.messages?.length || 0);
      this.updateMessagesList(nextState.currentChat.messages);
    }
  }

  private async connectToChat(chatId: number, token: string): Promise<void> {
    console.log('🔌 connectToChat called with:', { chatId, token: !!token, userId: this.currentUserId });
    
    if (!chatId || !token || !this.currentUserId) {
      console.error('❌ Cannot connect to chat: missing data', { 
        chatId,
        token: !!token,
        userId: this.currentUserId
      });

      if (!this.currentUserId) {
        const user = store.getState().user;
        if (user) {
          console.log('🔄 Found user in store, updating currentUserId');
          this.currentUserId = user.id;
          this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
          
          // Пробуем снова
          if (this.currentUserId) {
            console.log('✅ Retrying connection with userId:', this.currentUserId);
            this.connectToChat(chatId, token);
          }
        }
      }
      return;
    }
    
    // Закрываем предыдущее соединение
    if (this.wsTransport) {
      console.log('🔌 Closing previous WebSocket connection');
      this.wsTransport.close();
      this.wsTransport = null;
    }
    
    console.log(`🔌 Connecting to chat ${chatId} with user ${this.currentUserId}`);
    
    // Создаем новое соединение
    try {
      this.wsTransport = new WebSocketTransport(this.currentUserId, chatId, token);
    
      // Подписываемся на сообщения
      this.wsTransport.onMessage((message) => {
        console.log('📨 New message:', message);
      });
    
      this.wsTransport.onStatus((status) => {
        console.log('📡 WebSocket status:', status);
        if (status === 'connected') {
          console.log('✅ WebSocket connected successfully');
          // Запрашиваем старые сообщения
          this.wsTransport?.getOldMessages(0);
        }
      });
    
      // Подключаемся
      this.wsTransport.connect();
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
    }
  }

  private updateMessagesList(messages: ChatMessage[]): void {
    console.log('🔄 Updating messages list with', messages?.length || 0, 'messages');

    if (!messages || messages.length === 0) {
      this.messageList.setMessages([]);
      return;
    }

    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  
    console.log('📊 Messages after sorting:', {
      first: sortedMessages[0]?.time,
      last: sortedMessages[sortedMessages.length - 1]?.time,
      count: sortedMessages.length
    });

    const messageItems = sortedMessages.map(msg => {
      const type = msg.user_id === this.currentUserId ? 'mine' : 'theirs';
      const sender = msg.user_id !== this.currentUserId ? 
        this.chats.find(c => c.id === msg.chat_id)?.name || null : null;
      const avatar = sender ? this.chats.find(c => c.id === msg.chat_id)?.avatar || null : null;

      console.log('📨 Creating message component:', {
        id: msg.id,
        type,
        text: msg.content.substring(0, 20),
        sender
      });

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

    console.log('📦 Created', messageItems.length, 'message items');
  
    this.messageList.setMessages(messageItems);

    // const newMessageList = new MessageList({
    //   messages: messageItems
    // });
  
    // this.messageList = newMessageList;
  
    // this.setProps({
    //   children: {
    //     ...this.getChildren(),
    //     messageList: this.messageList
    //   }
    // });

    // console.log('✅ Messages list updated');
  
    setTimeout(() => {
      this.messageList.scrollToBottom();
    }, 0);
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    // Можно реализовать уведомления
    console.log(`🔔 ${type}: ${message}`);
  }

  private forceUpdate(): void {
    console.log('🔄 Force update');
    const content = this.getContent();
    if (content) {
      content.innerHTML = this.render();
      this._replacePlaceholders();
      this._addEvents();
    }
  }

  private updateChatList(): void {
    console.log('🔄 Updating chat list with', this.chats.length, 'chats');
    console.log('📋 Current chats:', this.chats);
    
    if (!this.chats || this.chats.length === 0) {
      console.log('📭 No chats to display');
      this.chatList.setProps({ items: [] });
      return;
    }

    const chatItems: ChatItem[] = [];

    this.chats.forEach(chat => {
      if (!chat) return;
      
      console.log('🏗️ Creating ChatItem for:', chat.name, 'ID:', chat.id);
      
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

    // const chatItems = this.chats.map(chat => {
    //   console.log('🏗️ Creating ChatItem for:', chat.name, 'ID:', chat.id);

    //   if (!chat) return null;

    //   console.log('🏗️ Creating ChatItem for:', chat.name, 'ID:', chat.id);

    //   const props: ChatItemProps = {
    //     id: chat.id,
    //     name: chat.name,
    //     avatar: chat.avatar,
    //     time: chat.time,
    //     lastMessage: chat.lastMessage,
    //     active: chat.id === this.currentChatId,
    //     onClick: (id: number) => this.switchChat(id)
    //   };

    //   if (chat.unreadCount && chat.unreadCount > 0) {
    //     props.unreadCount = chat.unreadCount;
    //   }
      
    //   return new ChatItem(props);
    // });
  
    console.log('📦 Created', chatItems.length, 'chat items');
    this.chatList.setItems(chatItems);
    // if (chatItems.length > 0) {
    //   this.chatList.setItems(chatItems);
    // } else {
    //   this.chatList.setItems([]);
    // }
    
    // this.forceUpdate();
    // Принудительно обновляем
    // const content = this.chatList.getContent();
    // if (content) {
    //   content.innerHTML = this.chatList.render();
    //   this.chatList._replacePlaceholders();
    //   this.chatList._addEvents();
    // }
    
    console.log('✅ Chat list updated');
  }

  private async switchChat(chatId: number): Promise<void> {
    console.log('🔄 switchChat called with chatId:', chatId);
    console.log('📋 Current state:', {
      currentUserId: this.currentUserId,
      currentChatId: this.currentChatId,
      chatsCount: this.chats.length
    });

    if (!chatId) {
      console.error('❌ Invalid chat ID');
      return;
    }

    if (!this.currentUserId) {
      console.error('❌ No current user ID, cannot connect to chat');
      
      const user = store.getState().user;
      if (user && user.id) {
        console.log('✅ Found user in store, setting ID:', user.id);
        this.currentUserId = user.id;
        this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
      } else {
        console.error('❌ Still no user in store');
        this.showNotification('Ошибка: пользователь не авторизован', 'error');
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
      console.log('ℹ️ Already on chat', chatId);
      return;
    }
    
    const chatExists = this.chats?.some(chat => chat.id === chatId);
    if (!chatExists) {
      console.error('❌ Chat not found in list:', chatId);
      return;
    }

    console.log('🔄 Switching to chat', chatId, 'with user', this.currentUserId);
    this.currentChatId = chatId;
    
    try {
      // Получаем токен для чата
      console.log('🔑 Getting token for chat', chatId);
      const token = await ChatsAPI.getToken(chatId);
      console.log('✅ Token received:', token ? 'yes' : 'no');

      let messages: ChatMessage[] = [];
      try {
        // store.clearCurrentChat();
        // Пытаемся получить сообщения чата
        messages = await ChatsAPI.getChatMessages(chatId);
        // store.setCurrentChat(chatId, messages, token);
        console.log('📨 Loaded', messages.length, 'messages for chat', chatId);
      } catch (error) {
        // Если ошибка 404 - значит сообщений нет, это нормально
        console.log('ℹ️ No messages yet for chat', chatId, error);
        messages = [];
      }
      // Получаем сообщения чата
      // const messages = await ChatsAPI.getChatMessages(chatId);
      
      // Сохраняем в store
      store.setCurrentChat(chatId, messages, token);
      
      // Обновляем UI
      const currentChat = this.chats.find(c => c.id === chatId)!;
      
      if (!currentChat) {
        console.error('❌ Chat not found:', chatId);
        return;
      }

      const newChatHeader = new ChatHeader({
        title: currentChat.name,
        avatar: currentChat.avatar,
        status: messages.length > 0 ? 'Online' : 'New chat'
      });

      console.log('📋 New chat header created:', {
        title: currentChat.name,
        avatar: currentChat.avatar,
        status: messages.length > 0 ? 'Online' : 'New chat'
      });
      
      this.chatHeader = newChatHeader;
      
      console.log('🔄 Updating chat header in props');
      this.setProps({
        children: {
          ...this.getChildren(),
          chatHeader: this.chatHeader
        }
      });

      console.log('📦 Children after update:', Object.keys(this.getChildren()));

      // this.updateMessagesList(messages);

      console.log('🔌 Connecting to WebSocket for chat', chatId, 'with user', this.currentUserId);
      // this.connectToChat(chatId, token);

    } catch (error) {
      console.error('❌ Failed to switch chat:', error);
      this.showNotification('Ошибка загрузки чата', 'error');
    }
  }

  private sendMessage(message: string): void {
    if (!message.trim()) return;
    
    if (this.wsTransport && this.wsTransport.isActive()) {
      // Отправляем через WebSocket
      this.wsTransport.sendMessage(message);
      this.messageInput.clear();
    } else {
      console.error('❌ Cannot send message: WebSocket not connected');
      this.showNotification('Ошибка соединения', 'error');
    }
  }

  private handleMenuAction(action: string | null): void {
    switch (action) {
      case 'new-chat':
        console.log('🟢 Opening create chat modal');
        console.log('Modal exists:', !!this.createChatModal);
        
        this.createChatModal.open();
        break;
      case 'new-group':
        console.log('Создать группу');
        break;
      case 'archive':
        console.log('Архив чатов');
        break;
      case 'settings':
        router.go('/settings');
        break;
      case 'chat-info':
        console.log('Информация о чате');
        break;
      case 'media':
        console.log('Медиафайлы');
        break;
      case 'clear':
        if (this.currentChatId && confirm('Очистить историю сообщений?')) {
          this.messages[this.currentChatId] = [];
          this.updateMessagesList([]);
        }
        break;
      case 'leave':
        if (confirm('Покинуть чат?')) {
          console.log('Покинуть чат');
        }
        break;
      case 'logout':
        this.handleLogout();
        break;
    }
  }

  private async loadChats(): Promise<void> {
    
    if (this.isLoadingChats) {
      console.log('⏳ Already loading chats, skipping');
      return;
    }

    try {
      this.isLoadingChats = true;
      console.log('📥 Loading chats from API');
      console.log('👤 Current user ID before loading chats:', this.currentUserId);
      
      if (!this.currentUserId) {
        const user = store.getState().user;
        if (user && user.id) {
          console.log('✅ Found user in store, setting ID:', user.id);
          this.currentUserId = user.id;
          this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
        } else {
          console.log('⏳ User not ready yet, waiting...');
          this.isLoadingChats = false;
          if (!this.userCheckStarted) {
            this.startUserCheck();
          }
          return;
        }
      }

      const chatsData = await ChatsAPI.getChats();
      console.log('📦 Chats data from API:', chatsData);
      
      if (!chatsData) {
        console.log('❌ No chats data received');
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
      console.log('📋 Processed chats:', this.chats);
      this.updateChatList();
      this.forceUpdate();

      if (this.chats && this.chats.length > 0 && !this.currentChatId && this.currentUserId) {
        const firstChat = this.chats[0];
        if (firstChat && firstChat.id) {
          console.log('🔄 Auto-selecting first chat:', firstChat.id);
          await this.switchChat(firstChat.id);
        } else {
          console.log('⚠️ First chat is invalid');
          this.updateMessagesList([]);
        }
      } else {
        console.log('ℹ️ No chats to select or user not ready');
        this.updateMessagesList([]);
      }
      //   if (firstChat && firstChat.id) {
      //     console.log('🔄 Auto-selecting first chat:', firstChat.id);
      //     await this.switchChat(firstChat.id);
      //   }
      // } else if (!this.currentUserId) {
      //   console.log('⏳ Not auto-selecting chat - user not ready');
      // }
    } catch (error) {
      console.error('❌ Failed to load chats:', error);
      this.updateMessagesList([]);
      // this.chats = [];
    } finally {
      this.isLoadingChats = false;
    }
  }

  private userCheckStarted: boolean = false;

  private startUserCheck(): void {
    if (this.userCheckStarted) return;
    this.userCheckStarted = true;
    
    console.log('🔍 Starting user check interval');
    
    const checkInterval = setInterval(() => {
      const user = store.getState().user;
      console.log('⏰ Checking for user in store:', user?.id);
      
      if (user && user.id) {
        console.log('✅ User found in interval check:', user.id);
        this.currentUserId = user.id;
        this.currentUserInitials = (user.first_name?.[0] || 'И') + (user.second_name?.[0] || 'И');
        
        clearInterval(checkInterval);
        this.userCheckStarted = false;
        this.loadChats(); // Загружаем часы после получения пользователя
      }
    }, 500);
    
    // Очищаем интервал через 10 секунд, если пользователь так и не появился
    setTimeout(() => {
      if (this.userCheckStarted) {
        console.log('❌ User check timeout');
        clearInterval(checkInterval);
        this.userCheckStarted = false;
        this.showNotification('Ошибка авторизации', 'error');
      }
    }, 10000);
  }

  private async handleLogout(): Promise<void> {
    console.log('🚪 Logging out...');
    
    try {
      // Показываем подтверждение
      if (confirm('Вы действительно хотите выйти?')) {
        await AuthAPI.logout();
        
        // Очищаем localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        
        // Очищаем store
        store.setState({
          user: null,
          chats: [],
          currentChat: {
            id: null,
            messages: [],
            token: null
          }
        });
        
        console.log('✅ Logout successful, redirecting to login');
        
        // Перенаправляем на страницу авторизации
        router.go('/');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      alert('Ошибка при выходе из системы');
    }
  }

  private async handleCreateChat(title: string, userLogin?: string): Promise<void> {
    try {
      console.log('📝 Creating chat:', title);
      
      // Создаем чат
      const result = await ChatsAPI.createChat({ title });
      console.log('✅ Chat created:', result);
      
      // Если указан логин пользователя, ищем его и добавляем
      if (userLogin && userLogin.trim()) {
        try {
          // Ищем пользователя по логину
          const users = await AuthAPI.searchUsers(userLogin);
          console.log('👥 Found users:', users);

          if (users.length > 0) {
            const user = users[0];
            if (user) {
              console.log('👤 Adding user:', user.login, 'with id:', user.id);
              await ChatsAPI.addUserToChat({
                users: [user.id],
                chatId: result.id
              });
            }
            console.log('✅ User added to chat');
          } else {
            console.log('❌ User not found');
            this.showNotification('Пользователь не найден', 'error');
          }
        } catch (userError) {
          console.error('❌ Failed to add user:', userError);
          this.showNotification('Чат создан, но не удалось добавить пользователя', 'error');
        }
      }
      
      // Закрываем модальное окно
      this.createChatModal.close();
      this.createChatForm.reset();
      
      // Перезагружаем список чатов
      await this.loadChats();
      
      this.showNotification('Чат успешно создан!', 'success');
      
    } catch (error) {
      console.error('❌ Failed to create chat:', error);
      this.showNotification('Ошибка при создании чата', 'error');
    }
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

    console.log('📝 Children in render:', Object.keys(children));
    const result = template(context);
    console.log('✅ Render result includes modal:', result.includes('create-chat-modal'));

    return template(context);
  }

  public override show(): void {
    console.log('👁️ Showing MessengerPage');
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }

    document.body.classList.add('messenger-mode');
    
    // Скроллим к последнему сообщению
    setTimeout(() => {
      this.messageList.scrollToBottom();
    }, 100);
  }

  public override hide(): void {
    console.log('👋 Hiding MessengerPage');
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
    console.log('🚀 MessengerPage mounted');
    console.log('👤 Current user ID at mount:', this.currentUserId);

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
