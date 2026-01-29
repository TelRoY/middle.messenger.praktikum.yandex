import "./styles/variables.css";
import "./styles/global.css";
import "./styles/css.d.ts";
import "../style.css";
import "./pages/home/home.css";
import "./components/buttons/button.css";
import "./components/forms/form.css";
import "./components/chat/ChatItem.css";
import "./components/chat/Message.css";
import "./components/chat/MessageInput.css";
import "./components/ui/SearchInput.css";
import "./components/ui/DropdownMenu.css";

console.log("MyMate messenger loaded!");

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  console.log("MyMate messenger started!");
  
  // Обработка отправки сообщения
  const messageForm = document.getElementById('message-form') as HTMLFormElement | null;
  if (messageForm) {
    messageForm.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      const messageInput = document.getElementById('message') as HTMLInputElement | null;
      if (messageInput) {
        const message = messageInput.value.trim();
        
        if (message) {
          console.log('Отправка сообщения:', message);
          messageInput.value = '';
          
          // Здесь можно добавить логику отправки сообщения
          // Например, добавить новое сообщение в чат
          addMessageToChat(message, true);
        }
      }
    });
  }
  
  // Обработка кликов по чатам
  const chatItems = document.querySelectorAll('.chat-item');
  chatItems.forEach((item: Element) => {
    item.addEventListener('click', function(this: HTMLElement) {
      const chatId = this.dataset["chatId"];
      console.log('Выбран чат:', chatId);
      
      // Убираем активный класс у всех чатов
      chatItems.forEach(chat => chat.classList.remove('chat-item--active'));
      // Добавляем активный класс текущему чату
      this.classList.add('chat-item--active');
      
      // Обновляем заголовок чата
      const chatName = this.querySelector('.chat-item__name')?.textContent;
      if (chatName) {
        updateChatHeader(chatName);
      }
    });
  });
  
  // Обработка поиска
  const searchInput = document.querySelector('.search-input__field') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      filterChats(target.value.toLowerCase());
    });
  }
});

// Функция для добавления сообщения в чат
function addMessageToChat(text: string, isMine: boolean = true): void {
  const messagesContainer = document.querySelector('.messages-wrapper');
  if (!messagesContainer) return;
  
  const messageId = Date.now().toString();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isMine ? 'message--mine' : 'message--theirs'}`;
  messageDiv.dataset["messageId"] = messageId;
  
  messageDiv.innerHTML = `
    ${isMine ? '' : `
      <div class="message__avatar">
        <div class="message__avatar-placeholder">A</div>
      </div>
    `}
    
    <div class="message__content">
      ${isMine ? '' : '<div class="message__sender">Анна</div>'}
      
      <div class="message__bubble">
        <div class="message__text">${text}</div>
        <div class="message__meta">
          <span class="message__time">${time}</span>
          ${isMine ? '<span class="message__status message__status--sent">✓</span>' : ''}
        </div>
      </div>
    </div>
  `;
  
  messagesContainer.prepend(messageDiv);
}

// Функция для фильтрации чатов
function filterChats(searchTerm: string): void {
  const chatItems = document.querySelectorAll('.chat-item');
  
  chatItems.forEach(item => {
    const name = item.querySelector('.chat-item__name')?.textContent?.toLowerCase() || '';
    const lastMessage = item.querySelector('.chat-item__last-message')?.textContent?.toLowerCase() || '';
    
    if (name.includes(searchTerm) || lastMessage.includes(searchTerm)) {
      (item as HTMLElement).style.display = '';
    } else {
      (item as HTMLElement).style.display = 'none';
    }
  });
}

// Функция для обновления заголовка чата
function updateChatHeader(name: string): void {
  const chatTitle = document.querySelector('.chat-title');
  if (chatTitle) {
    chatTitle.textContent = name;
  }
}
