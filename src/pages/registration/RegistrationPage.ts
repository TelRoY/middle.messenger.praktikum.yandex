import { Block } from '../../core/Block';
import { Validator } from '../../utils/Validator';
import { AuthAPI } from '../../api/AuthAPI';

export class RegistrationPage extends Block {
  private validationTimeout?: NodeJS.Timeout;
  private isLoading: boolean = false;

  constructor() {
    super('div', {
      events: {
        submit: (e: Event) => {
          e.preventDefault();
          this.onSubmit();
        },
        click: (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.id === 'homeBtn' || target.closest('#homeBtn')) {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        },
        blur: (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.classList.contains('form-input')) {
            this.validateOnBlur(target.name, target.value);
          }
        },
        focus: (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.classList.contains('form-input')) {
            const formGroup = target.closest('.form-group');
            const error = formGroup?.querySelector('.field-error');
            if (error) {
              error.remove();
              target.classList.remove('has-error');
            }
            target.classList.remove('is-valid');
          }
        }
      }
    });
  }

  private async onSubmit(): Promise<void> {
    if (this.isLoading) return;
    const content = this.getContent();
    const form = content.querySelector('form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        data[key] = value.toString().trim();
      });;
      
      // ВАЛИДАЦИЯ НА SUBMIT
      const errors = Validator.validateForm(data, 'registration');
      
      if (Object.keys(errors).length === 0) {
        await this.attemptRegistration(data);
      } else {
        this.showAllErrors(errors);
        
        // Фокусируемся на первом поле с ошибкой
        const firstErrorField = Object.keys(errors)[0];
        const firstInput = content.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    }
  }

  // Валидация на blur
  private validateOnBlur(fieldName: string, value: string): void {
    // Очищаем предыдущий таймер
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
    
    // Запускаем валидацию с задержкой (debounce)
    this.validationTimeout = setTimeout(() => {
      const error = Validator.validateField(fieldName, value, 'registration');
      
      const content = this.getContent();
      const input = content.querySelector(`[name="${fieldName}"]`);
      const formGroup = input?.closest('.form-group');
      
      if (formGroup) {
        // Удаляем предыдущую ошибку
        const oldError = formGroup.querySelector('.field-error');
        if (oldError) {
          oldError.remove();
        }
        
        // Убираем класс ошибки
        input?.classList.remove('has-error');
        input?.classList.remove('is-valid');
        
        if (error) {
          // Показываем ошибку
          this.showFieldError(fieldName, error);
        } else if (value.trim()) {
          // Показываем успех если поле заполнено
          input?.classList.add('is-valid');
        }
      }
    }, 300);
  }

  private showFieldError(fieldName: string, message: string): void {
    const content = this.getContent();
    const input = content.querySelector(`[name="${fieldName}"]`);
    const formGroup = input?.closest('.form-group');
    
    if (formGroup && input) {
      // Создаем элемент ошибки
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = message;
      
      formGroup.appendChild(errorDiv);
      
      // Добавляем класс ошибки к инпуту
      input.classList.add('has-error');
    }
  }

  private showAllErrors(errors: Record<string, string>): void {
    const content = this.getContent();

    this.clearGlobalError();
    
    // Очищаем все старые ошибки
    content.querySelectorAll('.field-error').forEach(el => el.remove());
    
    // Убираем все классы ошибок
    content.querySelectorAll('.has-error, .is-valid').forEach(el => {
      el.classList.remove('has-error', 'is-valid');
    });
    
    // Показываем новые ошибки
    Object.entries(errors).forEach(([field, message]) => {
      this.showFieldError(field, message);
    });
  }

  private clearGlobalError(): void {
    const content = this.getContent();
    const oldError = content.querySelector('.global-error');
    if (oldError) {
      oldError.remove();
    }
  }

  private async attemptRegistration(data: Record<string, string>): Promise<void> {
    try {
      this.setLoading(true);
      
      this.showAllErrors({});
      
      const registrationData = {
        first_name: data['first_name'] || '',
        second_name: data['second_name'] || '',
        login: data['login'] || '',
        email: data['email'] || '',
        password: data['password'] || '',
        phone: data['phone'] || ''
      };

      const requiredFields = ['first_name', 'second_name', 'login', 'email', 'password', 'phone'];
      const missingFields = requiredFields.filter(field => !registrationData[field as keyof typeof registrationData]?.trim());
      
      if (missingFields.length > 0) {
        throw new Error('Все поля обязательны для заполнения');
      }
      
      await AuthAPI.register(registrationData);
      
      this.showSuccess('Регистрация успешно завершена!');
      
      try {
        const userData = await AuthAPI.login({
          login: registrationData.login,
          password: registrationData.password
        });
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        
        setTimeout(() => {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 3000);
        
      } catch {
        this.showSuccess('Регистрация успешна! Теперь войдите в систему.');
        
        setTimeout(() => {
          window.history.pushState({}, '', '/authorization');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 3000);
      }
      
      const form = this.getContent().querySelector('form') as HTMLFormElement;
      if (form) {
        form.reset();
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Ошибка регистрации';
      if (error instanceof Error) {
        if (error.message.includes('логин')) {
          errorMessage = 'Этот логин уже занят';
        } else if (error.message.includes('email')) {
          errorMessage = 'Этот email уже используется';
        } else if (error.message.includes('phone')) {
          errorMessage = 'Этот телефон уже используется';
        }
      }
      this.showGlobalError(errorMessage);
      
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    const content = this.getContent();
    const submitButton = content.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    if (submitButton) {
      if (loading) {
        submitButton.disabled = true;
        submitButton.textContent = 'Регистрация...';
        submitButton.classList.add('loading');
      } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Зарегистрироваться';
        submitButton.classList.remove('loading');
      }
    }
  }

  private showGlobalError(message: string): void {
    const content = this.getContent();
    
    this.clearGlobalError();
    
    if (!message) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'global-error';
    errorDiv.textContent = message;
    const errorElement = errorDiv as HTMLElement;
    errorElement.style.color = '#ff4757';
    errorElement.style.backgroundColor = 'rgba(255, 71, 87, 0.1)';
    errorElement.style.padding = '12px';
    errorElement.style.borderRadius = '8px';
    errorElement.style.marginBottom = '16px';
    errorElement.style.textAlign = 'center';
    
    const form = content.querySelector('form');
    if (form) {
      form.prepend(errorDiv);
    }
  }

  private showSuccess(message: string): void {
    const content = this.getContent();
    
    // Удаляем предыдущее сообщение
    const oldMessage = content.querySelector('.success-message');
    if (oldMessage) {
      oldMessage.remove();
    }
    
    // Создаем сообщение об успехе
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    const messageElement = messageDiv as HTMLElement;
    messageElement.style.padding = '12px';
    messageElement.style.borderRadius = '8px';
    messageElement.style.marginBottom = '16px';
    messageElement.style.textAlign = 'center';
    messageElement.style.fontWeight = '500';
    messageElement.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
    messageElement.style.color = '#2ecc71';
    messageElement.style.border = '1px solid #2ecc71';
    
    // Вставляем сообщение перед формой
    const form = content.querySelector('form');
    if (form) {
      form.parentNode?.insertBefore(messageDiv, form);
    }
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }

  protected override render(): string {
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
              required
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
              required
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
              required
              minlength="3"
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
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              class="form-input"
              placeholder="Минимум 6 символов"
              required
              minlength="6"
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
              required
            />
          </div>

          <div class="form-buttons">
            <button type="submit" class="component-button component-button--primary">
              Зарегистрироваться
            </button>
            <button type="button" class="component-button component-button--secondary" id="homeBtn">
              На главную
            </button>
          </div>
        </form>
      </main>
    `;
  }

  protected override componentDidMount(): void {
    const content = this.getContent();
    
    // Автофокус на первое поле
    const firstInput = content.querySelector('input') as HTMLInputElement;
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}
