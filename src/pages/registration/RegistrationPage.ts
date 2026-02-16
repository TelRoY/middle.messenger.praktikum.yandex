import { Block } from '../../core/Block';
import { Validator } from '../../utils/Validator';
import { AuthAPI } from '../../api/AuthAPI';
import { compile } from 'handlebars';
import templateSource from './registration.hbs';
import { router } from '../../main';
import { Button } from '../../components/buttons/Button';
import { Input } from '../../components/Input/Input';
import { RegistrationForm } from '../../components/forms/RegistrationForm';

export class RegistrationPage extends Block {
  private validationTimeout?: NodeJS.Timeout;
  private isLoading: boolean = false;
  private firstNameInput: Input;
  private secondNameInput: Input;
  private loginInput: Input;
  private emailInput: Input;
  private passwordInput: Input;
  private phoneInput: Input;
  private form: RegistrationForm;

  constructor() {
     const firstNameInput = new Input({
      type: 'text',
      name: 'first_name',
      placeholder: 'Иван',
      required: true,
      className: 'form-input',
      id: 'first_name',
      label: 'Имя'
    });

    const secondNameInput = new Input({
      type: 'text',
      name: 'second_name',
      placeholder: 'Иванов',
      required: true,
      className: 'form-input',
      id: 'second_name',
      label: 'Фамилия'
    });

    const loginInput = new Input({
      type: 'text',
      name: 'login',
      placeholder: 'ivanivanov',
      required: true,
      minlength: 3,
      className: 'form-input',
      id: 'login',
      label: 'Логин'
    });

    const emailInput = new Input({
      type: 'email',
      name: 'email',
      placeholder: 'ivanivanov@yandex.ru',
      required: true,
      className: 'form-input',
      id: 'email',
      label: 'Электронная почта'
    });

    const passwordInput = new Input({
      type: 'password',
      name: 'password',
      placeholder: 'Минимум 6 символов',
      required: true,
      minlength: 6,
      className: 'form-input',
      id: 'password',
      label: 'Пароль'
    });

    const phoneInput = new Input({
      type: 'tel',
      name: 'phone',
      placeholder: '+7 (800) 555-35-35',
      required: true,
      className: 'form-input',
      id: 'phone',
      label: 'Телефон'
    });

    const submitButton = new Button({
      type: 'submit',
      variant: 'primary',
      text: 'Зарегистрироваться',
      className: 'component-button component-button--primary'
    });

    const loginButton = new Button({
      type: 'button',
      variant: 'secondary',
      text: 'Авторизация',
      className: 'component-button component-button--secondary',
      id: 'login-btn'
    });

    const form = new RegistrationForm({
      id: 'registration-form',
      className: 'registration-form',
      onSubmit: () => this.onSubmit(),
      children: {
        firstNameInput,
        secondNameInput,
        loginInput,
        emailInput,
        passwordInput,
        phoneInput,
        submitButton,
        loginButton
      }
    });

    super('div', {
      children: {
        form: form
      },
      events: {
        click: (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.closest('#login-btn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 Login button clicked, navigating to /');
            setTimeout(() => {
              router.go('/');
            }, 50);
            return;
          }
        
          const link = target.closest('a');
          if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
              router.go(href);
              return;
            }
          }
        },
      }
    });
    this.firstNameInput = firstNameInput;
    this.secondNameInput = secondNameInput;
    this.loginInput = loginInput;
    this.emailInput = emailInput;
    this.passwordInput = passwordInput;
    this.phoneInput = phoneInput;
    this.form = form;
  }

  private async onSubmit(): Promise<void> {
  if (this.isLoading) return;

  const data = {
    first_name: this.firstNameInput.value.trim(),
    second_name: this.secondNameInput.value.trim(),
    login: this.loginInput.value.trim(),
    email: this.emailInput.value.trim(),
    password: this.passwordInput.value.trim(),
    phone: this.phoneInput.value.trim()
  }
    
  // ВАЛИДАЦИЯ НА SUBMIT
  const errors = Validator.validateForm(data, 'registration');
  const errorKeys = Object.keys(errors);
    
  if (errorKeys.length === 0) {
    await this.attemptRegistration(data);
  } else {
    this.showAllErrors(errors);
    
    // Фокусируемся на первом поле с ошибкой
    const firstErrorField = errorKeys[0];
    if (firstErrorField) { // Проверяем, что поле существует
      const input = this.getInputByName(firstErrorField);
      if (input) {
        input.value = '';
        const content = this.getContent();
        const domInput = content.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
        if (domInput) {
          domInput.focus();
        }
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

  private clearGlobalError(): void {
    const content = this.getContent();
    const oldError = content.querySelector('.global-error');
    if (oldError) {
      oldError.remove();
    }
  }

  private getInputByName(name: string): Input | undefined {
    const inputs: Record<string, Input> = {
      first_name: this.firstNameInput,
      second_name: this.secondNameInput,
      login: this.loginInput,
      email: this.emailInput,
      password: this.passwordInput,
      phone: this.phoneInput
    };
    return inputs[name];
  }

  private resetForm(): void {
    if (this.form) {
      this.form.reset();
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
          router.go('/messenger');
        }, 3000);
        
      } catch (loginError) {
        console.error('❌ Auto-login failed:', loginError);
        this.showSuccess('Регистрация успешна! Теперь войдите в систему.');
        
        setTimeout(() => {
          router.go('/'); // Переход на страницу авторизации
        }, 3000);
      }
      
      this.resetForm();
      
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
    console.log('👁️ Showing RegistrationPage');
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }
    // super.show();
  }

  public override hide(): void {
    console.log('👋 Hiding RegistrationPage');
    const content = this.getContent();
    if (content) {
      content.style.display = 'none';
    }
    // super.hide();
  }

  protected override componentDidMount(): void {
    console.log('🚀 RegistrationPage mounted');
    const content = this.getContent();
    console.log('📄 RegistrationPage content length:', content.innerHTML.length);
    console.log('📄 RegistrationPage content full:', content.innerHTML);
    console.log('📄 RegistrationPage content:', content.innerHTML.substring(0, 200) + '...');
    
    // Добавляем обработчики событий для валидации
    const firstNameInput = content.querySelector('#first_name') as HTMLInputElement;
    if (firstNameInput) {
      firstNameInput.addEventListener('blur', (e) => {
        this.validateOnBlur('first_name', (e.target as HTMLInputElement).value);
      });
      firstNameInput.addEventListener('focus', () => this.clearFieldError('first_name'));
    }
    
    const secondNameInput = content.querySelector('#second_name') as HTMLInputElement;
    if (secondNameInput) {
      secondNameInput.addEventListener('blur', (e) => {
        this.validateOnBlur('second_name', (e.target as HTMLInputElement).value);
      });
      secondNameInput.addEventListener('focus', () => this.clearFieldError('second_name'));
    }
    
    const loginInput = content.querySelector('#login') as HTMLInputElement;
    if (loginInput) {
      loginInput.addEventListener('blur', (e) => {
        this.validateOnBlur('login', (e.target as HTMLInputElement).value);
      });
      loginInput.addEventListener('focus', () => this.clearFieldError('login'));
    }
    
    const emailInput = content.querySelector('#email') as HTMLInputElement;
    if (emailInput) {
      emailInput.addEventListener('blur', (e) => {
        this.validateOnBlur('email', (e.target as HTMLInputElement).value);
      });
      emailInput.addEventListener('focus', () => this.clearFieldError('email'));
    }
    
    const passwordInput = content.querySelector('#password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.addEventListener('blur', (e) => {
        this.validateOnBlur('password', (e.target as HTMLInputElement).value);
      });
      passwordInput.addEventListener('focus', () => this.clearFieldError('password'));
    }
    
    const phoneInput = content.querySelector('#phone') as HTMLInputElement;
    if (phoneInput) {
      phoneInput.addEventListener('blur', (e) => {
        this.validateOnBlur('phone', (e.target as HTMLInputElement).value);
      });
      phoneInput.addEventListener('focus', () => this.clearFieldError('phone'));
    }
    
    // Автофокус на первое поле
    setTimeout(() => firstNameInput?.focus(), 100);
  }
}
