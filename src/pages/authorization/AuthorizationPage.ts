import { Block } from '../../core/Block';
import { Validator } from '../../utils/Validator';
import { AuthAPI } from '../../api/AuthAPI';

export class AuthorizationPage extends Block {
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
          
          // Кнопка "Регистрация"
          if (target.id === 'registration-btn' || target.closest('#registration-btn')) {
            window.history.pushState({}, '', '/registration');
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
    const form = content.querySelector('#login-form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      // ВАЛИДАЦИЯ НА SUBMIT
      const errors = Validator.validateForm(data, 'authorization');
      
      if (Object.keys(errors).length === 0) {
        await this.attemptLogin(data);
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
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
    
    this.validationTimeout = setTimeout(() => {
      const error = Validator.validateField(fieldName, value, 'authorization');
      
      const content = this.getContent();
      const input = content.querySelector(`[name="${fieldName}"]`);
      const formGroup = input?.closest('.form-group');
      
      if (formGroup) {
        // Удаляем предыдущую ошибку
        const oldError = formGroup.querySelector('.field-error');
        if (oldError) {
          oldError.remove();
        }
        
        input?.classList.remove('has-error');
        input?.classList.remove('is-valid');
        
        if (error) {
          this.showFieldError(fieldName, error);
        } else if (value.trim()) {
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
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = message;
      
      formGroup.appendChild(errorDiv);
      input.classList.add('has-error');
    }
  }

  private showAllErrors(errors: Record<string, string>): void {
    const content = this.getContent();
    
    // Очищаем глобальные ошибки
    this.clearGlobalError();
    
    // Очищаем все полевые ошибки
    content.querySelectorAll('.field-error').forEach(el => el.remove());
    content.querySelectorAll('.has-error, .is-valid').forEach(el => {
      el.classList.remove('has-error', 'is-valid');
    });
    
    // Показываем новые ошибки
    Object.entries(errors).forEach(([field, message]) => {
      this.showFieldError(field, message);
    });
  }

  private showGlobalError(message: string): void {
    const content = this.getContent();
    
    // Сначала очищаем старую ошибку
    this.clearGlobalError();
    
    if (!message) return; // Не показываем пустое сообщение
    
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
    
    const form = content.querySelector('#login-form');
    if (form) {
      form.prepend(errorDiv);
    }
  }

  private clearGlobalError(): void {
    const content = this.getContent();
    const oldError = content.querySelector('.global-error');
    if (oldError) {
      oldError.remove();
    }
  }

  private showSuccessMessage(message: string): void {
    const content = this.getContent();
    
    // Очищаем предыдущие сообщения
    this.clearGlobalError();
    content.querySelectorAll('.success-message').forEach(el => el.remove());
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    const successElement = successDiv as HTMLElement;
    successElement.style.color = '#2ecc71';
    successElement.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
    successElement.style.padding = '12px';
    successElement.style.borderRadius = '8px';
    successElement.style.marginBottom = '16px';
    successElement.style.textAlign = 'center';
    
    const form = content.querySelector('#login-form');
    if (form) {
      form.prepend(successDiv);
    }
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  }

  private async attemptLogin(data: Record<string, any>): Promise<void> {
    try {
      this.setLoading(true);
      
      // Очищаем все ошибки перед попыткой входа
      this.clearGlobalError();
      this.showAllErrors({});
      
      const userData = await AuthAPI.login({
        login: data['login'].toString().trim(),
        password: data['password'].toString().trim()
      });
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      
      this.showSuccessMessage('Вход выполнен успешно!');
      
      setTimeout(() => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      let errorMessage = 'Ошибка при входе. Проверьте данные и попробуйте снова.';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
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
        submitButton.textContent = 'Выполняется вход...';
        submitButton.classList.add('loading');
      } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Авторизация';
        submitButton.classList.remove('loading');
      }
    }
  }

  protected override render(): string {
    return `
      <main class="container">
        <div class="header">
          <h1>MyMate</h1>
          <p>Войдите в свой аккаунт, чтобы продолжить</p>
        </div>

        <div class="main">
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="login" class="form-label">Логин</label>
              <input
                type="text"
                id="login"
                name="login"
                class="form-input"
                placeholder="Введите логин или email"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input"
                placeholder="Введите пароль"
                required
                minlength="6"
                autocomplete="current-password"
              />
            </div>

            <div class="form-buttons login-buttons">
              <button type="submit" class="component-button component-button--primary component-button--authorization">
                Авторизация
              </button>
              
              <button type="button" id="registration-btn" class="component-button component-button--secondary component-button--registration">
                Регистрация
              </button>
            </div>
          </form>
        </div>
      </main>
    `;
  }

  protected override componentDidMount(): void {
    const content = this.getContent();
    const loginInput = content.querySelector('#login') as HTMLInputElement;
    if (loginInput) {
      setTimeout(() => loginInput.focus(), 100);
    }
  }
}
