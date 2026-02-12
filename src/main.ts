import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/validation.css";
import "../style.css";
import "./pages/home/home.css";
import "./components/forms/form.css";
import "./components/buttons/button.css";
import "./components/chat/ChatItem.css";
import "./components/chat/Message.css";
import "./components/chat/MessageInput.css";
import "./components/ui/SearchInput.css";
import "./components/ui/DropDownMenu.css";

import { Router } from './core/Router';
import { RegistrationPage } from './pages/registration/RegistrationPage';
import { AuthorizationPage } from './pages/authorization/AuthorizationPage';
import { ProfilePage } from './pages/profile/ProfilePage';

console.log("MyMate messenger loaded!");

export const router = new Router('#app');

router
  .use('/', AuthorizationPage)
  .use('/sign-up', RegistrationPage)
  .use('/settings', ProfilePage)
  .use('/messenger', AuthorizationPage) // Заглушка
  .use('/404.html', AuthorizationPage) // Заглушка
  .use('/500.html', AuthorizationPage); // Заглушка

function initApp(): void {
  router.start();
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
