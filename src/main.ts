
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/validation.css";
import "../style.css";
import "./pages/home/home.css";//убрать
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


Handlebars.registerHelper('eq', function(this: undefined, arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

console.log("MyMate messenger loaded!");

export const router = new Router('#app');

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
