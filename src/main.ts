import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/validation.css";
import "../style.css";
import "./pages/messenger/messenger.css";
import "./components/forms/form.css";
import "./components/buttons/button.css";
import "./components/chat/ChatItem/ChatItem.css";
import "./components/chat/Message/Message.css";
import "./components/chat/MessageInput/MessageInput.css";
import "./components/ui/SearchInput.css";
import "./components/ui/DropDownMenu.css";

import Handlebars from 'handlebars';
import { Router } from './core/Router';
import { RegistrationPage } from './pages/registration/RegistrationPage';
import { AuthorizationPage } from './pages/authorization/AuthorizationPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MessengerPage } from "./pages/messenger/MessengerPage";
import store from './store/Store'
import { apiClient } from "./utils/HTTPClient";

apiClient.get('/ping')
  .then(() => console.log('✅ API connection works'))
  .catch(err => console.error('❌ API connection failed:', err));

Handlebars.registerHelper('eq', function(arg1, arg2) {
  return arg1 === arg2;
});

console.log("MyMate messenger loaded!");

export const router = new Router('#app');

// Проверяем авторизацию при загрузке
store.initAuth().then(() => {
  const currentPath = window.location.pathname;
  const user = store.getState().user;

  // Защита роутов
  if (user) {
    if (currentPath === '/' || currentPath === '/sign-up') {
      router.go('/messenger');
    }
  } else {
    if (currentPath !== '/' && currentPath !== '/sign-up') {
      router.go('/');
    }
  }
});

router
  .use('/', AuthorizationPage)
  .use('/sign-up', RegistrationPage)
  .use('/settings', ProfilePage)
  .use('/messenger', MessengerPage)
  .use('/404.html', AuthorizationPage) // Заглушка
  .use('/500.html', AuthorizationPage); // Заглушка

function initApp(): void {
  router.start();
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
