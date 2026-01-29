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
import { MainPage } from './pages/MainPage/MainPage';
import { RegistrationPage } from './pages/registration/RegistrationPage';
import { Router } from './core/Router';

console.log("MyMate messenger loaded!");

const componentStyles = `
  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--color-text);
  }

  .form-input {
    width: 100%;
    padding: 12px;
    border: 2px solid #98a8af;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    transition: border-color 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .form-buttons {
    display: flex;
    gap: 15px;
    margin-top: 30px;
    justify-content: center;
  }

  .button {
    padding: var(--spacing-sm);
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-md);
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    min-width: 150px;
  }

  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(106, 17, 203, 0.3);
  }

  .button-primary {
    background: var(--gradient-button);
    color: white;
  }

  .button-secondary {
    background: white;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
  }

  .button-secondary:hover {
    background: var(--color-hover);
  }
`;
// Добавляем стили в документ
const styleElement = document.createElement('style');
styleElement.textContent = componentStyles;
document.head.appendChild(styleElement);

function initApp(): void {
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html') {
    // Показываем главную страницу (Handlebars уже загрузил ее)
    return;
  }

  // Очищаем контейнер
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '';
    
    // Загружаем соответствующую страницу
    if (path.includes('registration')) {
      const page = new RegistrationPage();
      app.appendChild(page.getContent());
    } else {
      // 404 страница
      app.innerHTML = `
        <main class="container">
          <div class="header">
            <h1>404</h1>
            <p>Страница не найдена</p>
          </div>
          <a href="/" class="button button-primary">На главную</a>
        </main>
      `;
    }
  }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initApp);

// Обработка навигации
window.addEventListener('popstate', initApp);

// Перехват кликов по ссылкам
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest('a');
  
  if (link && link.href) {
    const url = new URL(link.href);
    
    // Если ссылка ведет на тот же домен
    if (url.origin === window.location.origin) {
      e.preventDefault();
      window.history.pushState({}, '', url.pathname);
      initApp();
    }
  }
});


// Инициализируем роутер при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('MyMate messenger started!');
  
  // Проверяем, есть ли уже контент (статические страницы)
  const hasStaticContent = document.querySelector('main.container') !== null;
  
  if (!hasStaticContent) {
    // Если это пустая страница, инициализируем роутер
    const router = new Router();
    
    // Регистрируем маршруты
    router
      .use('/registration', () => new RegistrationPage())
      .use('/registration.html', () => new RegistrationPage());
    
    // Создаем контейнер для компонентов
    if (!document.getElementById('app')) {
      const appDiv = document.createElement('div');
      appDiv.id = 'app';
      document.body.appendChild(appDiv);
    }
    
    // Загружаем текущий маршрут
    router.go(window.location.pathname);
  }
});


// const menuItems = [
//   { title: 'Авторизация', url: '/src/pages/authorization/authorization.html' },
//   { title: 'Регистрация', url: '/src/pages/registration/registration.html' },
//   { title: 'Главная', url: '/src/pages/home/home.html' },
//   { title: 'Профиль', url: '/src/pages/profile/profile.html' },
//   { title: '404', url: '/src/pages/404/404.html' },
//   { title: '500', url: '/src/pages/500/500.html' },
// ];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  console.log('MyMate messenger started!');
  
  // Определяем текущую страницу
  const currentPage = window.location.pathname;
  console.log('Current page:', currentPage);
  
  // Если это страница регистрации, загружаем компонент
  if (currentPage.includes('registration')) {
    console.log('Loading RegistrationPage component...');
    
    // Очищаем body (убираем статический контент если есть)
    document.body.innerHTML = '';
    
    // Добавляем скрипт
    document.body.appendChild(document.createElement('script')).type = 'module';
    
    // Создаем страницу регистрации
    const registrationPage = new RegistrationPage();
    
    // Рендерим
    document.body.appendChild(registrationPage.getContent());
    
    // Добавляем скрипт в конец
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/src/main.ts';
    document.body.appendChild(script);
  }
  
  // Обработка кликов по ссылкам
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href) {
      e.preventDefault();
      const url = new URL(link.href);
      
      // Если ссылка ведет на статическую страницу с .html
      if (url.pathname.includes('.html')) {
        window.location.href = url.pathname;
      } else {
        // Для компонентных страниц
        this.handleComponentNavigation(url.pathname);
      }
    }
  });
});

  // Создаем главную страницу
  // const mainPage = new MainPage({
  //   title: 'MyMate',
  //   menuItems
  // });
  
  // Рендерим в контейнер
//   const app = document.getElementById('app');
//   if (app) {
//     app.appendChild(mainPage.getContent());
//     mainPage.dispatchComponentDidMount();
//   }
// });

// Инициализация приложения
// document.addEventListener('DOMContentLoaded', () => {
//   console.log("MyMate messenger started!");
  
//   // Обработка отправки сообщения
//   const messageForm = document.getElementById('message-form') as HTMLFormElement | null;
//   if (messageForm) {
//     messageForm.addEventListener('submit', (e: Event) => {
//       e.preventDefault();
//       const messageInput = document.getElementById('message') as HTMLInputElement | null;
//       if (messageInput) {
//         const message = messageInput.value.trim();
        
//         if (message) {
//           console.log('Отправка сообщения:', message);
//           messageInput.value = '';
          
//           // Здесь можно добавить логику отправки сообщения
//           // Например, добавить новое сообщение в чат
//           addMessageToChat(message, true);
//         }
//       }
//     });
//   }
  
//   // Обработка кликов по чатам
//   const chatItems = document.querySelectorAll('.chat-item');
//   chatItems.forEach((item: Element) => {
//     item.addEventListener('click', function(this: HTMLElement) {
//       const chatId = this.dataset["chatId"];
//       console.log('Выбран чат:', chatId);
      
//       // Убираем активный класс у всех чатов
//       chatItems.forEach(chat => chat.classList.remove('chat-item--active'));
//       // Добавляем активный класс текущему чату
//       this.classList.add('chat-item--active');
      
//       // Обновляем заголовок чата
//       const chatName = this.querySelector('.chat-item__name')?.textContent;
//       if (chatName) {
//         updateChatHeader(chatName);
//       }
//     });
//   });
  
//   // Обработка поиска
//   const searchInput = document.querySelector('.search-input__field') as HTMLInputElement | null;
//   if (searchInput) {
//     searchInput.addEventListener('input', (e: Event) => {
//       const target = e.target as HTMLInputElement;
//       filterChats(target.value.toLowerCase());
//     });
//   }
// });

// // Функция для добавления сообщения в чат
// function addMessageToChat(text: string, isMine: boolean = true): void {
//   const messagesContainer = document.querySelector('.messages-wrapper');
//   if (!messagesContainer) return;
  
//   const messageId = Date.now().toString();
//   const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
//   const messageDiv = document.createElement('div');
//   messageDiv.className = `message ${isMine ? 'message--mine' : 'message--theirs'}`;
//   messageDiv.dataset["messageId"] = messageId;
  
//   messageDiv.innerHTML = `
//     ${isMine ? '' : `
//       <div class="message__avatar">
//         <div class="message__avatar-placeholder">A</div>
//       </div>
//     `}
    
//     <div class="message__content">
//       ${isMine ? '' : '<div class="message__sender">Анна</div>'}
      
//       <div class="message__bubble">
//         <div class="message__text">${text}</div>
//         <div class="message__meta">
//           <span class="message__time">${time}</span>
//           ${isMine ? '<span class="message__status message__status--sent">✓</span>' : ''}
//         </div>
//       </div>
//     </div>
//   `;
  
//   messagesContainer.prepend(messageDiv);
// }

// // Функция для фильтрации чатов
// function filterChats(searchTerm: string): void {
//   const chatItems = document.querySelectorAll('.chat-item');
  
//   chatItems.forEach(item => {
//     const name = item.querySelector('.chat-item__name')?.textContent?.toLowerCase() || '';
//     const lastMessage = item.querySelector('.chat-item__last-message')?.textContent?.toLowerCase() || '';
    
//     if (name.includes(searchTerm) || lastMessage.includes(searchTerm)) {
//       (item as HTMLElement).style.display = '';
//     } else {
//       (item as HTMLElement).style.display = 'none';
//     }
//   });
// }

// // Функция для обновления заголовка чата
// function updateChatHeader(name: string): void {
//   const chatTitle = document.querySelector('.chat-title');
//   if (chatTitle) {
//     chatTitle.textContent = name;
//   }
// }

function handleComponentNavigation(path: string): void {
  console.log('Navigating to:', path);
  
  // Очищаем текущий контент
  document.body.innerHTML = '';
  
  // В зависимости от пути создаем соответствующую страницу
  if (path.includes('registration')) {
    const registrationPage = new RegistrationPage();
    document.body.appendChild(registrationPage.getContent());
  } else {
    // Для других страций показываем заглушку
    const fallback = document.createElement('div');
    fallback.className = 'container';
    fallback.innerHTML = `
      <div class="header">
        <h1>Страница в разработке</h1>
        <p>Эта страница использует компонентный подход</p>
        <a href="/">Вернуться на главную</a>
      </div>
    `;
    document.body.appendChild(fallback);
  }
}
