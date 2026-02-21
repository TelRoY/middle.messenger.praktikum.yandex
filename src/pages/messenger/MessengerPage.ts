import { Block } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './messenger.hbs';
import { router } from '../../main';
import { ChatList } from '../../components/chat/ChatList/ChatList';
import { ChatItem } from '../../components/chat/ChatItem/ChatItem';
import { ChatHeader } from '../../components/chat/ChatHeader/ChatHeader';
import { MessageList } from '../../components/chat/MessageList/MessageList';
import { Message as MessageComponent } from '../../components/chat/Message/Message';
import { MessageInput } from '../../components/chat/MessageInput/MessageInput';
import { AuthAPI } from '../../api/AuthAPI';
import store from '../../store/Store';

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  active?: boolean;
}

interface Message {
  id: number;
  type: 'mine' | 'theirs';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  sender?: string;
  avatar?: string;
}

const MOCK_CHATS: Chat[] = [
  {
    id: 1,
    name: 'Анна Петрова',
    avatar: 'А',
    lastMessage: 'Привет! Как дела?',
    time: '10:30',
    unreadCount: 3,
    active: true
  },
  {
    id: 2,
    name: 'Иван Сидоров',
    avatar: 'И',
    lastMessage: 'Завтра встретимся в 15:00',
    time: 'Вчера'
  },
  {
    id: 3,
    name: 'Рабочая группа',
    avatar: 'Р',
    lastMessage: 'Мария: Отправила финальный отчет',
    time: 'Пн',
    unreadCount: 12
  }
];

const MOCK_MESSAGES: Record<number, Message[]> = {
  1: [
    {
      id: 6,
      type: 'mine',
      text: 'Отлично! Давай в 11:00 у кафе на углу?',
      time: '10:45',
      status: 'read',
    },
    {
      id: 5,
      type: 'theirs',
      text: 'Да, я свободна завтра весь день',
      time: '10:40',
      sender: 'Анна',
      avatar: 'А'
    },
    {
      id: 4,
      type: 'mine',
      text: 'Привет! У тебя есть время на этой неделе?',
      time: '10:35',
      status: 'read',
    },
    {
      id: 3,
      type: 'theirs',
      text: 'Привет! Да, все хорошо, спасибо! Как твои дела?',
      time: '10:33',
      sender: 'Анна',
      avatar: 'А'
    }
  ]
};

export class MessengerPage extends Block {
  private chatList: ChatList;
  private chatHeader: ChatHeader;
  private messageList: MessageList;
  private messageInput: MessageInput;
  private currentChatId: number = 1;
  private chats: Chat[] = MOCK_CHATS;
  private messages: Record<number, Message[]> = MOCK_MESSAGES;

  constructor() {

    const initialMessages = MOCK_MESSAGES[1];
    if (!initialMessages) {
      throw new Error('Messages for chat 1 not found');
    }

    const currentChat = MOCK_CHATS.find(c => c.id === 1)!;
    if (!currentChat) {
      throw new Error('Chat 1 not found');
    }

    // Создаем компоненты чатов
    const chatItems = MOCK_CHATS.map(chat => 
      new ChatItem({
        ...chat,
        active: chat.id === 1,
        onClick: (id: number) => this.switchChat(id)
      })
    );

    const chatList = new ChatList({
      items: chatItems
    });
    
    const chatHeader = new ChatHeader({
      title: currentChat.name,
      avatar: currentChat.avatar,
      status: 'была в сети 5 минут назад'
    });

    const messageItems = initialMessages.map(msg => 
      new MessageComponent({
        ...msg
      })
    );

    const messageList = new MessageList({
      messages: messageItems
    });

    const messageInput = new MessageInput({
      placeholder: 'Введите сообщение...',
      onSubmit: (message: string) => this.sendMessage(message)
    });

    super('div', {
      children: {
        chatList,
        chatHeader,
        messageList,
        messageInput
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
  }

  private switchChat(chatId: number): void {
    if (chatId === this.currentChatId) return;
    
    this.currentChatId = chatId;
    
    // Обновляем активный чат в списке
    const chatItems = this.chats.map(chat => 
      new ChatItem({
        ...chat,
        active: chat.id === chatId,
        onClick: (id: number) => this.switchChat(id)
      })
    );
    
    // Обновляем заголовок
    const currentChat = this.chats.find(c => c.id === chatId)!;
    const newChatHeader = new ChatHeader({
      title: currentChat.name,
      avatar: currentChat.avatar,
      status: 'был(а) недавно'
    });
    const chatMessages = this.messages[chatId] || [];
    // Обновляем сообщения
    const messageItems = chatMessages.map(msg => 
      new MessageComponent({
        ...msg
      })
    );

    const newMessageList = new MessageList({
      messages: messageItems
    });

    this.chatList.setProps({ items: chatItems});
    this.chatHeader = newChatHeader;
    this.messageList = newMessageList;

    // Обновляем children
    this.setProps({
      children: {
        chatList: this.chatList,
        chatHeader: this.chatHeader,
        messageList: this.messageList,
        messageInput: this.messageInput
      }
    });

    // Скроллим к последнему сообщению
    setTimeout(() => {
      this.messageList.scrollToBottom();
    }, 0);
  }

  private sendMessage(message: string): void {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      type: 'mine',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    // Добавляем сообщение в список
    let chatMessages = this.messages[this.currentChatId];
    if (!chatMessages) {        
        chatMessages = [];
        this.messages[this.currentChatId] = chatMessages;
    }
    
    chatMessages.push(newMessage);

    // Обновляем список сообщений
    const messageItems = chatMessages.map(msg => 
      new MessageComponent({
        ...msg
      })
    );

    const newMessageList = new MessageList({
      messages: messageItems
    });

    this.messageList = newMessageList;

    this.setProps({
      children: {
        ...this.getChildren(),
        messageList: this.messageList
      }
    });

    // Скроллим к новому сообщению
    setTimeout(() => {
      this.messageList.scrollToBottom();
    }, 0);

    // Очищаем поле ввода
    this.messageInput.clear();

    // Обновляем последнее сообщение в чате
    this.updateLastMessage(this.currentChatId, message);
  }

  private updateLastMessage(chatId: number, message: string): void {
    const chat = this.chats.find(c => c.id === chatId);
    if (chat) {
      chat.lastMessage = message;
      chat.time = 'только что';
      
      // Обновляем список чатов
      const chatItems = this.chats.map(chat => 
        new ChatItem({
          ...chat,
          active: chat.id === this.currentChatId,
          onClick: (id: number) => this.switchChat(id)
        })
      );

      (this.chatList as any).setProps({ items: chatItems });

      this.setProps({
        children: {
          ...this.getChildren(),
          chatList: this.chatList
        }
      });
    }
  }

  private handleMenuAction(action: string | null): void {
    switch (action) {
      case 'new-chat':
        console.log('Создать новый чат');
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
        if (confirm('Очистить историю сообщений?')) {
          this.messages[this.currentChatId] = [];
          this.switchChat(this.currentChatId);
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
    try {
      // Здесь будет загрузка реальных чатов через API
      console.log('📥 Loading chats from API');
      // const chats = await ChatsAPI.getChats();
      // this.chats = chats;
      // this.updateChatList();
    } catch (error) {
      console.error('❌ Failed to load chats:', error);
    }
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

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();
    const context: Record<string, string> = {};
    
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });

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
  }

  protected override componentDidMount(): void {
    console.log('🚀 MessengerPage mounted');
    this.loadChats();
    // Добавляем обработчик для закрытия dropdown при клике вне
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
