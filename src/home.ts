// Типы для чатов
interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  isActive: boolean;
}

interface Message {
  id: string;
  text: string;
  time: string;
  isMine: boolean;
  isRead: boolean;
  name?: string;
  avatar?: string;
}

// Класс для управления чатом
class ChatManager {
  private currentChatId: string | null = null;
  private messages: Message[] = [];
  
  constructor() {
    this.initializeEventListeners();
  }
  
  private initializeEventListeners(): void {
    // Обработка отправки сообщения
    const messageForm = document.getElementById('message-form') as HTMLFormElement;
    if (messageForm) {
      messageForm.addEventListener('submit', this.handleMessageSubmit.bind(this));
    }
    
    // Обработка кликов по чатам
    document.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', this.handleChatSelect.bind(this));
    });
    
    // Обработка поиска
    const searchInput = document.querySelector('.search-input__field') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch.bind(this));
    }
  }
  
  private handleMessageSubmit(event: Event): void {
    event.preventDefault();
    
    const messageInput = document.getElementById('message') as HTMLInputElement;
    const messageText = messageInput.value.trim();
    
    if (messageText && this.currentChatId) {
      this.sendMessage(messageText);
      messageInput.value = '';
    }
  }
  
  private handleChatSelect(event: Event): void {
    const chatItem = (event.currentTarget as HTMLElement);
    const chatId = chatItem.dataset["chatId"];
    
    if (chatId) {
      this.selectChat(chatId);
    }
  }
  
  private handleSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value.toLowerCase();
    
    // Здесь будет логика фильтрации чатов
    console.log('Поиск:', searchTerm);
  }
  
  private selectChat(chatId: string): void {
    this.currentChatId = chatId;
    
    // Обновляем активный чат
    document.querySelectorAll('.chat-item').forEach(item => {
      item.classList.remove('chat-item--active');
    });
    
    const activeChat = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (activeChat) {
      activeChat.classList.add('chat-item--active');
    }
    
    // Загружаем сообщения для выбранного чата
    this.loadChatMessages(chatId);
  }
  
  private async loadChatMessages(chatId: string): Promise<void> {
    // Здесь будет логика загрузки сообщений с сервера
    console.log('Загрузка сообщений для чата:', chatId);
  }
  
  private sendMessage(text: string): void {
    if (!this.currentChatId) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      isRead: false
    };
    
    this.messages.push(newMessage);
    this.renderMessage(newMessage);
    
    // Здесь будет логика отправки на сервер
    console.log('Отправка сообщения на сервер:', newMessage);
  }
  
  private renderMessage(message: Message): void {
    const messagesContainer = document.querySelector('.messages-wrapper');
    if (!messagesContainer) return;
    
    // Здесь будет логика рендеринга сообщения
    console.log('Рендеринг сообщения:', message);
  }
}

// Инициализация при загрузке страницы
// document.addEventListener('DOMContentLoaded', () => {
//   const _chatManager = new ChatManager();
//   console.log('ChatManager инициализирован');
// });

export { ChatManager, type Chat, type Message };
