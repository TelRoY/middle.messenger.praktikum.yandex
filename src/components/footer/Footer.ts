import { Block } from '../../core/Block';

export class Footer extends Block {
  protected template(): string {
    return `
      <div class="footer">
        <p>
          Нажимая "Авторизация" или "Регистрация", вы соглашаетесь с
          <a href="#">Условиями использования</a> и
          <a href="#">Политикой конфиденциальности</a>
        </p>
      </div>
    `;
  }
}
