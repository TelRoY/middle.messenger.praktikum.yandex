import { Block } from '../../core/Block';
import { Validator } from '../../utils/Validator';
// import { AuthAPI } from '../../api/AuthAPI';
import { compile } from 'handlebars';
import templateSource from './authorization.hbs';
import { router } from '../../main';
import { Button } from '../../components/buttons/Button';
import { Input } from '../../components/Input/Input';
import { Form } from '../../components/forms/Form';
import store from '../../store/Store';

export class AuthorizationPage extends Block {
  private validationTimeout?: NodeJS.Timeout;
  private isLoading: boolean = false;
  private loginInput: Input;
  private passwordInput: Input;
  private form: Form;

  constructor() {
    const loginInput = new Input({
      type: 'text',
      name: 'login',
      placeholder: 'Введите логин или email',
      required: true,
      autocomplete: 'username',
      className: 'form-input',
      id: 'login',
      label: 'Логин'
    });

    const passwordInput = new Input({
      type: 'password',
      name: 'password',
      placeholder: 'Введите пароль',
      required: true,
      minlength: 6,
      autocomplete: 'current-password',
      className: 'form-input',
      id: 'password',
      label: 'Пароль'
    });

    const submitButton = new Button({
      type: 'submit',
      variant: 'primary',
      text: 'Авторизация',
      className: 'component-button component-button--authorization'
    });

    const registrationButton = new Button({
      type: 'button',
      variant: 'secondary',
      text: 'Регистрация',
      className: 'component-button component-button--registration',
      id: 'registration-btn'
    });

    const form = new Form({
      id: 'login-form',
      className: 'auth-form',
      onSubmit: () => this.onSubmit(),
      children: {
        loginInput,
        passwordInput,
        submitButton,
        registrationButton
      }
    });

    super('div', {
      children: {
        form: form
      },
      events: {
        click: (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.closest('#registration-btn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 Registration button clicked, navigating to /sign-up');
            router.go('/sign-up');
          }
        }
      }
    });

    this.loginInput = loginInput;
    this.passwordInput = passwordInput;
    this.form = form;
  }

  private resetForm(): void {
    if (this.form) {
      this.form.reset();
    }
  }

  private async onSubmit(): Promise<void> {
    if (this.isLoading) return;
    
    const data = {
      login: this.loginInput.value.trim(),
      password: this.passwordInput.value.trim()
    };
    
    // ВАЛИДАЦИЯ НА SUBMIT
    const errors = Validator.validateForm(data, 'authorization');
    
    if (Object.keys(errors).length === 0) {
      await this.attemptLogin(data);
    } else {
      this.showAllErrors(errors);
    }
  }

  // Валидация на blur
  private validateOnBlur(fieldName: string, value: string): void {
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
    
    this.validationTimeout = setTimeout(() => {
      const error = Validator.validateField(fieldName, value, 'authorization');
      
      if (error) {
        this.showFieldError(fieldName, error);
      } else if (value.trim()) {
        this.clearFieldError(fieldName);
      }
    }, 300);
  }

  private showFieldError(fieldName: string, message: string): void {
    const content = this.getContent();
    const formGroup = content.querySelector(`[name="${fieldName}"]`)?.closest('.form-group');
    
    if (formGroup) {
      // Удаляем предыдущую ошибку
      const oldError = formGroup.querySelector('.field-error');
      if (oldError) {
        oldError.remove();
      }
      
      const input = formGroup.querySelector('input');
      if (input) {
        input.classList.add('has-error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
      }
    }
  }

  private clearFieldError(fieldName: string): void {
    const content = this.getContent();
    const formGroup = content.querySelector(`[name="${fieldName}"]`)?.closest('.form-group');
    
    if (formGroup) {
      const error = formGroup.querySelector('.field-error');
      if (error) {
        error.remove();
      }
      
      const input = formGroup.querySelector('input');
      if (input) {
        input.classList.remove('has-error');
        input.classList.remove('is-valid');
      }
    }
  }


   private showAllErrors(errors: Record<string, string>): void {
    // Очищаем глобальные ошибки
    this.clearGlobalError();
    
    // Очищаем все полевые ошибки
    Object.keys(errors).forEach(field => this.clearFieldError(field));
    
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
      
      await store.login(data['login'].toString().trim(), data['password'].toString().trim());
      const user = store.getState().user;
      console.log('👤 User after login from store:', user);

      // const userData = await AuthAPI.login({
      //   login: data['login'].toString().trim(),
      //   password: data['password'].toString().trim()
      // });
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        this.showSuccessMessage('Вход выполнен успешно!');
        this.resetForm(); 
      
        setTimeout(() => {
          router.go('/messenger');
        }, 2000);
      } else {
        throw new Error('Не удалось получить данные пользователя');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      let errorMessage = 'Ошибка при входе. Проверьте данные и попробуйте снова.';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
        // if (error.message.includes('User already in system')) {
        //   errorMessage = 'Вы уже вошли в систему. Попробуйте выйти и войти снова.';
        //   try {
        //     await AuthAPI.logout();
        //     // Повторяем попытку входа
        //     await this.attemptLogin(data);
        //     return;
        //   } catch (logoutError) {
        //     console.error('Logout failed:', logoutError);
        //   } 
        // } else {
        //     errorMessage = error.message || errorMessage;
        //   }
        // }
      // } else if (typeof error === 'string') {
      //   errorMessage = error;
      // } else if (error && typeof error === 'object' && 'message' in error) {
      //   errorMessage = String((error as any).message);
      // }
      
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

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();
    const context: Record<string, string> = {};
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });
    return template(context);
  }

  public override show(): void {
    console.log('👁️ Showing AuthorizationPage');
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }
    // super.show();
  }

  public override hide(): void {
    console.log('👋 Hiding AuthorizationPage');
    const content = this.getContent();
    if (content) {
      content.style.display = 'none';
    }
    // super.hide();
  }
      

  protected override componentDidMount(): void {
    const content = this.getContent();
    const loginInput = content.querySelector('#login') as HTMLInputElement;
    if (loginInput) {
      loginInput.addEventListener('blur', (e) => {
        this.validateOnBlur('login', (e.target as HTMLInputElement).value);
      });
      loginInput.addEventListener('focus', () => this.clearFieldError('login'));
      setTimeout(() => loginInput.focus(), 100);
    }
    const passwordInput = content.querySelector('#password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.addEventListener('blur', (e) => {
        this.validateOnBlur('password', (e.target as HTMLInputElement).value);
      });
      passwordInput.addEventListener('focus', () => this.clearFieldError('password'));
    }
  }
}
