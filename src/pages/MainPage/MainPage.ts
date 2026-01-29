import { Block } from '../../core/Block';
import { Button } from '../../components/buttons/Button';
import { Footer } from '../../components/footer/Footer';

interface MainPageProps {
  title: string;
  menuItems: Array<{ title: string; url: string }>;
}

export class MainPage extends Block<MainPageProps> {
  private menuButtons: Button[] = [];

  constructor(props: MainPageProps) {
    super(props);
  }

  protected init(): void {
    // Создаем кнопки для меню
    this.menuButtons = this.props.menuItems.map(item => 
      new Button({
        text: item.title,
        href: item.url,
        variant: 'link',
        className: 'feature-link'
      })
    );

    // Создаем футер
    this.children.footer = new Footer({});
  }

  protected template(): string {
    // Создаем HTML для кнопок меню
    const menuItemsHTML = this.menuButtons
      .map(button => {
        const content = button.getContent();
        return `<li class="feature-item">${content.outerHTML}</li>`;
      })
      .join('');

    return `
      <main class="container">
        <div class="header">
          <h1>${this.props.title}</h1>
          <p>
            Добро пожаловать в новейший, современный, безопасный и быстрый
            мессенджер!
          </p>
        </div>

        <nav class="main">
          <ul class="feature-list">
            ${menuItemsHTML}
          </ul>
        </nav>

        <div class="footer">
          <p>
            Нажимая "Авторизация" или "Регистрация", вы соглашаетесь с
            <a href="#">Условиями использования</a> и
            <a href="#">Политикой конфиденциальности</a>
          </p>
        </div>
      </main>
    `;
  }
}
