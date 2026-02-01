import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/validation.css";
import "./styles/css.d.ts";
import "../style.css";
import "./pages/home/home.css";
import "./components/forms/form.css";
import "./components/buttons/button.css";
import "./components/chat/ChatItem.css";
import "./components/chat/Message.css";
import "./components/chat/MessageInput.css";
import "./components/ui/SearchInput.css";
import "./components/ui/DropDownMenu.css";
import { Block } from './core/Block';
import { RegistrationPage } from './pages/registration/RegistrationPage';
import { AuthorizationPage } from './pages/authorization/AuthorizationPage';
import { ProfilePage } from './pages/profile/ProfilePage';

console.log("MyMate messenger loaded!");

// Функция для рендеринга компонентов
function render(query: string, block: Block): HTMLElement {
  const root = document.querySelector(query);
  if (!root) {
    throw new Error(`Root not found: ${query}`);
  }
  root.appendChild(block.getContent());
  block.dispatchComponentDidMount();
  return root as HTMLElement;
}

// Очистка статического контента
function clearStaticContent(): void {
  const staticContent = document.querySelector('main.container');
  if (staticContent) {
    staticContent.remove();
  }

  const staticScript = document.querySelector('script[src="src/main.ts"]');
  if (staticScript) {
    staticScript.remove();
  }
}

// Главная функция инициализации приложения
function initApp(): void {
  const path = window.location.pathname;
  console.log('Current path:', path);
  clearStaticContent();
  
  // Определяем, является ли путь статической страницей
  const isStaticPage = path.includes('.html') && !path.includes('index.html');

    if (isStaticPage) {
    console.log('Loading static page:', path);
    loadStaticPage(path);
    return;
  }

  // Если это статическая страница (обрабатывается Handlebars)
  if ((path === '/' || path === '/index.html' || path.includes('.html')) && 
      document.querySelector('main.container') !== null) {
    console.log('Static page loaded by Handlebars');
    initStaticPageEvents();
    return;
  }
  
  // Если нет контейнера для SPA, создаем его
  if (!document.getElementById('app')) {
    const appDiv = document.createElement('div');
    appDiv.id = 'app';
    document.body.appendChild(appDiv);
  }
  
  // Очищаем контейнер SPA
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '';
    
    // Загружаем соответствующую SPA страницу
    if (path.includes('registration')) {
      console.log('Loading RegistrationPage');
      const page = new RegistrationPage();
      app.appendChild(page.getContent());
      page.dispatchComponentDidMount();
    } else if (path.includes('authorization')) {
    console.log('Loading AuthorizationPage');
    const page = new AuthorizationPage();
    app.appendChild(page.getContent());
    page.dispatchComponentDidMount();
    } else if (path.includes('profile')) {
    console.log('Loading ProfilePage');
    const page = new ProfilePage();
    app.appendChild(page.getContent());
    page.dispatchComponentDidMount();
    } else if (path === '/' || path === '/index.html') {
      // Главная страница
      console.log('Loading Main page');
      app.innerHTML = `
        <main class="container">
          <div class="header">
            <h1>MyMate</h1>
            <p>Добро пожаловать в новейший, современный, безопасный и быстрый мессенджер!</p>
          </div>
          <nav class="main">
            <ul class="feature-list">
              <li class="feature-item">
                <a href="/authorization" class="feature-link">Авторизация</a>
              </li>
              <li class="feature-item">
                <a href="/registration" class="feature-link">Регистрация</a>
              </li>
              <li class="feature-item">
                <a href="/home.html" class="feature-link">Главная</a>
              </li>
              <li class="feature-item">
                <a href="/profile" class="feature-link">Профиль</a>
              </li>
              <li class="feature-item">
                <a href="/404.html" class="feature-link">404</a>
              </li>
              <li class="feature-item">
                <a href="/500.html" class="feature-link">500</a>
              </li>
            </ul>
          </nav>
        </main>
      `;
    } 
  }
}

// Функция загрузки статических страниц
async function loadStaticPage(path: string): Promise<void> {
  try {
    // Определяем путь к файлу
    let filePath = path;
    if (!path.startsWith('/src/pages/')) {
      // Преобразуем путь /profile.html в /src/pages/profile/profile.html
      const pageName = path.replace('.html', '').replace('/', '');
      filePath = `/src/pages/${pageName}/${pageName}.html`;
    }
    
    const response = await fetch(filePath);
    
    if (!response.ok) {
      // Если страница не найдена, перенаправляем на 404
      if (response.status === 404) {
        window.history.pushState({}, '', '/404.html');
        loadStaticPage('/404.html');
        return;
      }
      throw new Error(`Failed to load page: ${response.status}`);
    }
    
    const html = await response.text();
    const app = document.getElementById('app');
    
    if (app) {
      app.innerHTML = html;
      
      // Инициализируем события для загруженной страницы
      setTimeout(() => initStaticPageEvents(), 100);
    }
    
  } catch (error) {
    console.error('Error loading static page:', error);
    
    // При ошибке загрузки перенаправляем на 500
    window.history.pushState({}, '', '/500.html');
    loadStaticPage('/500.html');
  }
}

// Инициализация событий для статических страниц (чаты и т.д.)
function initStaticPageEvents(): void {
  console.log('Initializing static page events');
  
  // Обработка отправки сообщения
  const messageForm = document.getElementById('message-form');
  if (messageForm) {
    messageForm.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      const messageInput = document.getElementById('message') as HTMLInputElement;
      if (messageInput) {
        const message = messageInput.value.trim();
        
        if (message) {
          console.log('Отправка сообщения:', message);
          messageInput.value = '';
          addMessageToChat(message, true);
        }
      }
    });
  }
  
  // Обработка кликов по чатам
  const chatItems = document.querySelectorAll('.chat-item');
  if (chatItems.length > 0) {
    chatItems.forEach((item: Element) => {
      item.addEventListener('click', function(this: HTMLElement) {
        // Правильный доступ к dataset через строковый индекс
        const chatId = this.dataset['chatId'];
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
  }
  
  // Обработка поиска
  const searchInput = document.querySelector('.search-input__field');
  if (searchInput) {
    searchInput.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      filterChats(target.value.toLowerCase());
    });
  }
}

// Вспомогательные функции для чата
function addMessageToChat(text: string, isMine: boolean = true): void {
  const messagesContainer = document.querySelector('.messages-wrapper');
  if (!messagesContainer) return;
  
  const messageId = Date.now().toString();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isMine ? 'message--mine' : 'message--theirs'}`;
  // Правильный доступ к dataset через setAttribute или строковый индекс
  messageDiv.setAttribute('data-message-id', messageId);
  
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

function updateChatHeader(name: string): void {
  const chatTitle = document.querySelector('.chat-title');
  if (chatTitle) {
    chatTitle.textContent = name;
  }
}

// Перехват кликов по ссылкам для SPA навигации
function setupSPANavigation(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href) {
      const url = new URL(link.href);
      
      // Если ссылка ведет на тот же домен
      if (url.origin === window.location.origin) {
        e.preventDefault(); // Всегда предотвращаем поведение по умолчанию
        window.history.pushState({}, '', url.pathname);
        initApp();
      }
    }
  });
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('MyMate messenger started!');
  
  // Настраиваем SPA навигацию
  setupSPANavigation();
  
  // Инициализируем приложение
  initApp();
  
  // Обработка навигации через браузерные кнопки
  window.addEventListener('popstate', initApp);
});

// Экспортируем функцию render для использования в других модулях
export { render };
