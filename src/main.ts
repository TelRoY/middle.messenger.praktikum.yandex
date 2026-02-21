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
import "./components/modal/modal.css";
import "./styles/error.css";

import Handlebars from 'handlebars';
import { Router } from './core/Router';
import { RegistrationPage } from './pages/registration/RegistrationPage';
import { AuthorizationPage } from './pages/authorization/AuthorizationPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MessengerPage } from "./pages/messenger/MessengerPage";
import { Error404Page } from './pages/404/Error404Page';
import { Error500Page } from './pages/500/Error500Page';
// import { ChatsAPI } from './api/ChatsAPI';
import store, { StoreEvents } from './store/Store'

Handlebars.registerHelper('eq', function(arg1, arg2) {
  return arg1 === arg2;
});

console.log("MyMate messenger loaded!");

export const router = new Router('#app');

// Проверяем авторизацию при загрузке
store.initAuth().then(() => {
  const currentPath = window.location.pathname;
  const user = store.getState().user;

  console.log('📦 Store after initAuth:', { 
    user: user?.id, 
    path: currentPath 
  });

  // Защита роутов
  if (user) {
    if (currentPath === '/' || currentPath === '/sign-up') {
      console.log('User authenticated, redirecting to messenger');
      router.go('/messenger');
    }
  } else {
    if (currentPath !== '/' && currentPath !== '/sign-up') {
      console.log('User not authenticated, redirecting to login');
      router.go('/');
    }
  }
});

store.on(StoreEvents.UPDATED, (prevState: any, nextState: any) => {
  console.log('Store updated:', nextState);
  
  // Если пользователь стал null (вышел), перенаправляем на /
  if (!nextState.user && prevState.user) {
    console.log('User logged out, redirecting to login');
    router.go('/');
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
