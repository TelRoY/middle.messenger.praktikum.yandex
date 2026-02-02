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
    // initStaticPageEvents();
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
      render('#app', page);
      // app.appendChild(page.getContent());
      // page.dispatchComponentDidMount();
    } else if (path.includes('authorization')) {
    console.log('Loading AuthorizationPage');
    const page = new AuthorizationPage();
    render('#app', page);
    // app.appendChild(page.getContent());
    // page.dispatchComponentDidMount();
    } else if (path.includes('profile')) {
    console.log('Loading ProfilePage');
    const page = new ProfilePage();
    render('#app', page);
    // app.appendChild(page.getContent());
    // page.dispatchComponentDidMount();
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
      // setTimeout(() => initStaticPageEvents(), 100);
    }
    
  } catch (error) {
    console.error('Error loading static page:', error);
    
    // При ошибке загрузки перенаправляем на 500
    window.history.pushState({}, '', '/500.html');
    loadStaticPage('/500.html');
  }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('MyMate messenger started!');
  
  // Инициализируем приложение
  initApp();
  
  // Обработка навигации через браузерные кнопки
  window.addEventListener('popstate', initApp);
});

// Экспортируем функцию render для использования в других модулях
export { render };
