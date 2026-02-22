import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/validation.css";

import "./pages/messenger/messenger.css";
import "./components/forms/form.css";
import "./components/buttons/button.css";
import "./components/chat/ChatItem/ChatItem.css";
import "./components/chat/Message/Message.css";
import "./components/chat/MessageInput/MessageInput.css";
import "./components/ui/SearchInput.css";
import "./components/ui/DropDownMenu.css";
import "./components/modal/modal.css";

import Handlebars from 'handlebars';
import { Router } from './core/Router';
import store, { StoreEvents } from './store/Store'

import { AuthorizationPage } from './pages/authorization/AuthorizationPage';
import { RegistrationPage } from './pages/registration/RegistrationPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MessengerPage } from "./pages/messenger/MessengerPage";
import { Error404Page } from './pages/404/Error404Page';
import { Error500Page } from './pages/500/Error500Page';

Handlebars.registerHelper('eq', function(arg1, arg2) {
  return arg1 === arg2;
});

export const router = new Router('#app');

// Проверка авторизации при загрузке
store.initAuth().then(() => {
  const currentPath = window.location.pathname;
  const user = store.getState().user;

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
  .use('/404', Error404Page) 
  .use('/500', Error500Page); 

function initApp(): void {
  router.start();
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
