import { Block } from '../../core/Block';

export class RegistrationPage extends Block {
  constructor() {
    super({});
  }

  private onSubmit(): void {
    const form = this.getContent().querySelector('form');
    if (form) {
      const formData = new FormData(form as HTMLFormElement);
      const data = Object.fromEntries(formData);
      console.log('Registration data:', data);
      alert('Регистрация отправлена! Данные в консоли.');
    }
  }

  private onGoHome(): void {
    window.location.href = '/';
  }

  protected template(): string {
    return `
      <main class="container">
        <div class="header">
          <h1>Регистрация</h1>
        </div>

        <form class="registration-form">
          <div class="form-group">
            <label for="first_name">Имя</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              class="form-input"
              placeholder="Иван"
            />
          </div>

          <div class="form-group">
            <label for="second_name">Фамилия</label>
            <input
              type="text"
              id="second_name"
              name="second_name"
              class="form-input"
              placeholder="Иванов"
            />
          </div>

          <div class="form-group">
            <label for="login">Логин</label>
            <input
              type="text"
              id="login"
              name="login"
              class="form-input"
              placeholder="ivanivanov"
            />
          </div>

          <div class="form-group">
            <label for="email">Электронная почта</label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-input"
              placeholder="ivanivanov@yandex.ru"
            />
          </div>

          <div class="form-group">
            <label for="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="phone">Телефон</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              class="form-input"
              placeholder="+7 (800) 555-35-35"
            />
          </div>

          <div class="form-buttons">
            <button 
              type="button" 
              class="button button-primary" 
              id="submitBtn"
            >
              Регистрация
            </button>
            <button 
              type="button" 
              class="button button-secondary" 
              id="homeBtn"
            >
              На главную
            </button>
          </div>
        </form>
      </main>
    `;
  }

  protected addEventListeners(): void {
    const submitBtn = this.getContent().querySelector('#submitBtn');
    const homeBtn = this.getContent().querySelector('#homeBtn');

    if (submitBtn) {
      submitBtn.addEventListener('click', this.onSubmit.bind(this));
    }

    if (homeBtn) {
      homeBtn.addEventListener('click', this.onGoHome.bind(this));
    }
  }
}
