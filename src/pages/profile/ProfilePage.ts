import { Block } from '../../core/Block';
import { Validator } from '../../utils/Validator';
import { AuthAPI } from '../../api/AuthAPI';

export class ProfilePage extends Block {
  private isEditMode: boolean = false;
  private originalData: Record<string, any>;
  private escapeHandler?: ((e: KeyboardEvent) => void) | undefined;
  private validationTimeouts: Record<string, NodeJS.Timeout> = {};
  private isLoading: boolean = false;

  constructor() {
    super('div', {
      events: {
        submit: (e: Event) => {
          e.preventDefault();
          this.onSubmit();
        },
        change: (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.id === 'avatar-input') {
            this.handleAvatarChange(target);
          }
        }
      }
    });

    // Инициализируем данные профиля
    this.originalData = this.loadProfileData();
  }

  private async loadProfileData(): Promise<Record<string, any>> {
    try {
      // Загружаем данные из localStorage или с сервера
      const savedData = localStorage.getItem('user');
      if (savedData) {
        return JSON.parse(savedData);
      }
      const userData = await AuthAPI.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;

    } catch (error) {
      console.error('Error loading profile data:', error);
    }
    
    // Данные по умолчанию
    return {
      first_name: 'Иван',
      second_name: 'Иванов',
      display_name: 'ivan95',
      login: 'ivanivanov',
      email: 'ivanivanov@yandex.ru',
      phone: '+7 (800) 555-35-35',
      avatar: ''
    };
  }

  private getDefaultData(): Record<string, any> {
    return {
      first_name: 'Иван',
      second_name: 'Иванов',
      display_name: 'ivan95',
      login: 'ivanivanov',
      email: 'ivanivanov@yandex.ru',
      phone: '+7 (800) 555-35-35',
      avatar: ''
    };
  }

  private saveProfileData(data: Record<string, any>): void {
    try {
      localStorage.setItem('userProfile', JSON.stringify(data));
      this.originalData = { ...data };
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  }

  private onSubmit(): void {
    if (this.isEditMode) {
      this.saveProfile();
    } else {
      this.toggleEditMode();
    }
  }

  private async saveProfile(): Promise<void> {
    if (this.isLoading) return;
    const content = this.getContent();
    const form = content.querySelector('#profile-form') as HTMLFormElement;
    
    if (form) {
      const formData = new FormData(form);
      const data: Record<string, any> = {};
      
      // Собираем данные из формы
      formData.forEach((value, key) => {
        data[key] = value.toString().trim();
      });

      const isChangingPassword = data['oldPassword'] || data['newPassword'];

      // ВАЛИДАЦИЯ НА SUBMIT
      const errors = Validator.validateForm(data, 'profile');
      
      if (Object.keys(errors).length === 0) {
        console.log('Profile data to save:', data);
        try {
          this.setLoading(true);
          
          const updateData: any = {
            first_name: data['first_name'],
            second_name: data['second_name'],
            display_name: data['display_name'],
            login: data['login'],
            email: data['email'],
            phone: data['phone']
          };

          const updatedUser = await AuthAPI.updateProfile(updateData);
          this.originalData = updatedUser;
          this.showMessage('Профиль успешно обновлен', 'success');
          if (isChangingPassword) {
            try {
              await AuthAPI.changePassword(data['oldPassword'], data['newPassword']);
            } catch (passwordError) {
              console.error('Password change failed:', passwordError);
              this.showMessage('Профиль обновлен, но не удалось сменить пароль', 'error');
            }
          }

          this.saveProfileData(data);
          this.updateProfileDisplay(data);
          this.toggleEditMode();
          this.showMessage('Профиль успешно обновлен!', 'success');
        } catch (error) {
          console.error('Profile update error:', error);
          this.showMessage('Ошибка обновления профиля', 'error');
          
        } finally {
          this.setLoading(false);
        }
      } else {
        this.showAllErrors(errors);
        
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
    // Особенная логика для полей пароля
    if (fieldName === 'oldPassword' || fieldName === 'newPassword') {
      const content = this.getContent();
      const oldPassword = (content.querySelector('#oldPassword') as HTMLInputElement)?.value || '';
      const newPassword = (content.querySelector('#newPassword') as HTMLInputElement)?.value || '';
      
      // Если оба поля пустые - не валидируем
      if (!oldPassword && !newPassword) {
        return;
      }
    }
    
    // Очищаем предыдущий таймер для этого поля
    if (this.validationTimeouts[fieldName]) {
      clearTimeout(this.validationTimeouts[fieldName]);
    }
    
    this.validationTimeouts[fieldName] = setTimeout(() => {
      const error = Validator.validateField(fieldName, value, 'profile');
      
      const content = this.getContent();
      const input = content.querySelector(`[name="${fieldName}"]`);
      const formGroup = input?.closest('.form-group');
      
      if (formGroup) {
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
    
    content.querySelectorAll('.field-error').forEach(el => el.remove());
    content.querySelectorAll('.has-error, .is-valid').forEach(el => {
      el.classList.remove('has-error', 'is-valid');
    });
    
    Object.entries(errors).forEach(([field, message]) => {
      this.showFieldError(field, message);
    });
  }

  private toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    
    // Очищаем обработчик Escape при выходе из режима редактирования
    if (!this.isEditMode && this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = undefined;
    }
    
    // Обновляем отображение
    this.forceUpdate();
    
    if (this.isEditMode) {
      this.setupEditMode();
    } else {
      this.setupViewMode();
    }
  }

  private setupEditMode(): void {
    const content = this.getContent();
    
    // Автофокус на первом поле
    const firstInput = content.querySelector('input') as HTMLInputElement;
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
    
    // Добавляем обработчик Escape
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isEditMode) {
        this.toggleEditMode();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    // Настраиваем валидацию на blur в режиме редактирования
    content.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('blur', (e) => {
        const target = e.target as HTMLInputElement;
        this.validateOnBlur(target.name, target.value);
      });
      
      input.addEventListener('focus', () => {
        const formGroup = input.closest('.form-group');
        const error = formGroup?.querySelector('.field-error');
        if (error) {
          error.remove();
          input.classList.remove('has-error');
        }
        input.classList.remove('is-valid');
      });
    });
  }

  private setupViewMode(): void {
    const content = this.getContent();
    
    // Очищаем поля пароля
    const oldPasswordInput = content.querySelector('#oldPassword') as HTMLInputElement;
    const newPasswordInput = content.querySelector('#newPassword') as HTMLInputElement;
    
    if (oldPasswordInput) oldPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
  }

  private forceUpdate(): void {
    const content = this.getContent();
    content.innerHTML = this.render();
    this.componentDidMount();
  }

  private async handleAvatarChange(input: HTMLInputElement): Promise<void> {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        this.showMessage('Пожалуйста, выберите изображение', 'error');
        return;
      }
      
      // Проверяем размер файла (максимум 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.showMessage('Изображение должно быть меньше 2MB', 'error');
        return;
      }
      
       try {
        this.setLoading(true);
        
        const updatedUser = await AuthAPI.updateAvatar(file);
        
        this.saveProfileData(updatedUser);
        
        const avatarImg = this.getContent().querySelector('.avatar-img') as HTMLImageElement;
        const avatarPlaceholder = this.getContent().querySelector('.avatar-placeholder') as HTMLElement;
        
        if (avatarImg) {
          avatarImg.src = updatedUser.avatar;
          avatarImg.style.display = 'block';
          if (avatarPlaceholder) {
            avatarPlaceholder.style.display = 'none';
          }
        }
        
        this.showMessage('Аватар обновлен!', 'success');
        
      } catch (error) {
        console.error('Avatar upload error:', error);
        this.showMessage('Ошибка при загрузке аватара', 'error');
        
      } finally {
        this.setLoading(false);
      }
    }
  }

  private updateProfileDisplay(data: Record<string, any>): void {
    const content = this.getContent();
    
    // Обновляем имя в заголовке
    const profileName = content.querySelector('.profile-name');
    if (profileName) {
        const firstName = data['first_name'] || 'Иван';
        const secondName = data['second_name'] || 'Иванов';
        profileName.textContent = `${firstName} ${secondName}`;
    }
    
    // Обновляем никнейм
    const profileDisplayName = content.querySelector('.profile-display-name');
    if (profileDisplayName) {
        const displayName = data['display_name'] || 'ivan95';
        profileDisplayName.textContent = `@${displayName}`;
    }
    
    // Обновляем поля формы
    const fields = ['first_name', 'second_name', 'display_name', 'login', 'email', 'phone'];
    fields.forEach(field => {
      const input = content.querySelector(`[name="${field}"]`) as HTMLInputElement;
      if (input) {
        input.value = data[field] || '';
      }
    });
    
    // Обновляем аватар
    if (data['avatar']) {
      const avatarImg = content.querySelector('.avatar-img') as HTMLImageElement;
      const avatarPlaceholder = content.querySelector('.avatar-placeholder') as HTMLElement;
      
      if (avatarImg) {
        avatarImg.src = data['avatar'];
        avatarImg.style.display = 'block';
        if (avatarPlaceholder) {
          avatarPlaceholder.style.display = 'none';
        }
      }
    }
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    const content = this.getContent();
    
    // Удаляем предыдущее сообщение
    const oldMessage = content.querySelector('.profile-message');
    if (oldMessage) {
      oldMessage.remove();
    }
    
    // Создаем новое сообщение
    const messageDiv = document.createElement('div');
    messageDiv.className = `profile-message profile-message--${type}`;
    messageDiv.textContent = text;
    messageDiv.style.padding = '12px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.marginBottom = '16px';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.fontWeight = '500';
    
    if (type === 'success') {
      messageDiv.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
      messageDiv.style.color = '#2ecc71';
      messageDiv.style.border = '1px solid #2ecc71';
    } else {
      messageDiv.style.backgroundColor = 'rgba(255, 71, 87, 0.1)';
      messageDiv.style.color = '#ff4757';
      messageDiv.style.border = '1px solid #ff4757';
    }
    
    // Вставляем сообщение перед формой
    const form = content.querySelector('#profile-form');
    if (form) {
      form.parentNode?.insertBefore(messageDiv, form);
    }
    
    // Автоматически скрываем сообщение через 5 секунд
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    const content = this.getContent();
    const submitButton = content.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    if (submitButton) {
      if (loading) {
        submitButton.disabled = true;
        submitButton.textContent = this.isEditMode ? 'Сохранение...' : 'Загрузка...';
        submitButton.classList.add('loading');
      } else {
        submitButton.disabled = false;
        submitButton.textContent = this.isEditMode ? 'Сохранить изменения' : 'Редактировать профиль';
        submitButton.classList.remove('loading');
      }
    }
  }

  protected override render(): string {
    const data = this.originalData || this.getDefaultData();
    const { 
      first_name = 'Иван', 
      second_name = 'Иванов', 
      display_name = 'ivan95',
      login = 'ivanivanov',
      email = 'ivanivanov@yandex.ru',
      phone = '+7 (800) 555-35-35',
      avatar = ''
    } = data;

    const isAvatarSet = !!avatar;
    const firstNameInitial = first_name && first_name.length > 0 ? first_name[0] : 'И';
    const secondNameInitial = second_name && second_name.length > 0 ? second_name[0] : 'И';

    return `
      <main class="container">
        <div class="header">
          <div class="avatar-section">
            <div class="avatar-container">
              ${isAvatarSet ? 
                `<img src="${avatar}" alt="Аватар" class="avatar-img">` : 
                `<div class="avatar-placeholder">${firstNameInitial}${secondNameInitial}</div>`
              }
              ${this.isEditMode ? `
                <label for="avatar-input" class="avatar-upload-btn">
                  <span>Изменить фото</span>
                  <input type="file" id="avatar-input" name="avatar" accept="image/*" style="display: none;">
                </label>
              ` : ''}
            </div>
          </div>
          
          <div class="profile-info">
            <h1 class="profile-name">${first_name} ${second_name}</h1>
            <p class="profile-display-name">@${display_name}</p>
          </div>
        </div>

        <form id="profile-form" class="profile-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="first_name" class="form-label">Имя</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                class="form-input ${this.isEditMode ? '' : 'form-input--readonly'}"
                value="${first_name}"
                placeholder="Иван"
                ${this.isEditMode ? '' : 'readonly'}
              />
            </div>

            <div class="form-group">
              <label for="second_name" class="form-label">Фамилия</label>
              <input
                type="text"
                id="second_name"
                name="second_name"
                class="form-input ${this.isEditMode ? '' : 'form-input--readonly'}"
                value="${second_name}"
                placeholder="Иванов"
                ${this.isEditMode ? '' : 'readonly'}
              />
            </div>

            <div class="form-group">
              <label for="display_name" class="form-label">Никнэйм</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                class="form-input ${this.isEditMode ? '' : 'form-input--readonly'}"
                value="${display_name}"
                placeholder="ivan95"
                ${this.isEditMode ? '' : 'readonly'}
              />
            </div>

            <div class="form-group">
              <label for="login" class="form-label">Логин</label>
              <input
                type="text"
                id="login"
                name="login"
                class="form-input ${this.isEditMode ? '' : 'form-input--readonly'}"
                value="${login}"
                placeholder="ivanivanov"
                ${this.isEditMode ? '' : 'readonly'}
              />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Электронная почта</label>
              <input
                type="email"
                id="email"
                name="email"
                class="form-input ${this.isEditMode ? '' : 'form-input--readonly'}"
                value="${email}"
                placeholder="ivanivanov@yandex.ru"
                ${this.isEditMode ? '' : 'readonly'}
              />
            </div>

            <div class="form-group">
              <label for="phone" class="form-label">Телефон</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                class="form-input ${this.isEditMode ? '' : 'form-input--readonly'}"
                value="${phone}"
                placeholder="+7 (800) 555-35-35"
                ${this.isEditMode ? '' : 'readonly'}
              />
            </div>

            ${this.isEditMode ? `
              <div class="form-group password-section">
                <h3 class="section-title">Смена пароля</h3>
                
                <div class="form-group">
                  <label for="oldPassword" class="form-label">Старый пароль</label>
                  <input
                    type="password"
                    id="oldPassword"
                    name="oldPassword"
                    class="form-input"
                    placeholder="Введите старый пароль"
                  />
                </div>

                <div class="form-group">
                  <label for="newPassword" class="form-label">Новый пароль</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    class="form-input"
                    placeholder="Введите новый пароль"
                    minlength="6"
                  />

                </div>
              </div>
            ` : ''}
          </div>

          <div class="profile-actions">
            <button type="submit" class="component-button ${this.isEditMode ? 'component-button--primary' : 'component-button--secondary'}">
              ${this.isEditMode ? 'Сохранить изменения' : 'Редактировать профиль'}
            </button>
            
            ${this.isEditMode ? `
              <button type="button" id="cancel-edit" class="component-button component-button--secondary">
                Отмена
              </button>
            ` : ''}
            
            <button type="button" id="back-home" class="component-button component-button--link">
              На главную
            </button>
          </div>
        </form>
      </main>
    `;
  }

  protected override componentDidMount(): void {
    const content = this.getContent();
    
    // Кнопка "На главную"
    const backHomeBtn = content.querySelector('#back-home');
    if (backHomeBtn) {
      backHomeBtn.addEventListener('click', () => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }
    
    // Кнопка "Отмена" (в режиме редактирования)
    const cancelEditBtn = content.querySelector('#cancel-edit');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        this.toggleEditMode();
      });
    }
    
    // Кнопка загрузки аватара
    const avatarUploadLabel = content.querySelector('.avatar-upload-btn');
    if (avatarUploadLabel) {
      avatarUploadLabel.addEventListener('click', (e) => {
        e.preventDefault();
        const fileInput = content.querySelector('#avatar-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
        }
      });
    }

    if (this.isEditMode) {
      content.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', (e) => {
          const target = e.target as HTMLInputElement;
          this.validateOnBlur(target.name, target.value);
        });
        
        input.addEventListener('focus', () => {
          const formGroup = input.closest('.form-group');
          const error = formGroup?.querySelector('.field-error');
          if (error) {
            error.remove();
            input.classList.remove('has-error');
          }
          input.classList.remove('is-valid');
        });
      });
    }
  }
}