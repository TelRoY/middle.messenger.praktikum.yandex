import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/validation.css";
import "../style.css";
import "./pages/messenger/messenger.css";
import "./pages/profile/profile.css";
import "./components/forms/form.css";
import "./components/buttons/button.css";
import "./components/chat/ChatItem/ChatItem.css";
import "./components/chat/Message/Message.css";
import "./components/chat/MessageInput/MessageInput.css";
import "./components/ui/SearchInput.css";
import "./components/ui/DropDownMenu.css";
import "./styles/error.css";

import Handlebars from 'handlebars';
import { Router } from './core/Router';
import { RegistrationPage } from './pages/registration/RegistrationPage';
import { AuthorizationPage } from './pages/authorization/AuthorizationPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MessengerPage } from "./pages/messenger/MessengerPage";
import { Error404Page } from './pages/404/Error404Page';
import { Error500Page } from './pages/500/Error500Page';
import store from './store/Store'

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
  .use('/404.html', Error404Page) 
  .use('/500.html', Error500Page); 

function initApp(): void {
  router.start();
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
