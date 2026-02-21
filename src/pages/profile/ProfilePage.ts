import { Block } from '../../core/Block';
import { Validator } from '../../utils/Validator';
import { AuthAPI, ProfileResponse } from '../../api/AuthAPI';
import { compile } from 'handlebars';
import templateSource from './profile.hbs';
import { router } from '../../main';
import { ProfileForm } from '../../components/forms/ProfileForm';

interface FormData {
  first_name: string;
  second_name: string;
  display_name: string;
  login: string;
  email: string;
  phone: string;
  oldPassword?: string;
  newPassword?: string;
}

export class ProfilePage extends Block {
  private isEditMode: boolean = false;
  private validationTimeouts: Record<string, NodeJS.Timeout> = {};
  private isLoading: boolean = false;
  private profileForm: ProfileForm | null = null;
  private userData: ProfileResponse | null = null;
  private isInitialized: boolean = false;

  constructor() {
    const tempForm = new ProfileForm({
      id: 'profile-form',
      className: 'profile-form',
      isEditMode: false,
      firstName: '',
      secondName: '',
      displayName: '',
      login: '',
      email: '',
      phone: '',
      avatarInitials: '--',
      fullName: '',
      onSubmit: () => {
        console.log('📞 ProfileForm onSubmit callback called');
        this.onSubmit();
      },
      onCancel: () => {
        console.log('📞 ProfileForm onCancel callback called');
        this.toggleEditMode();
      },
      onAvatarChange: (file: File) => {
        console.log('📞 ProfileForm onAvatarChange callback called', file.name);
        this.handleAvatarChange(file);
      }
    });

    console.log('📦 tempForm created:', !!tempForm);

    super('div', {
      children: {
        profileForm: tempForm
      }, 
      events: {
        click: (e: Event) => {
          const target = e.target as HTMLElement;
          console.log('🖱️ Click on:', target.id, target.className);

          if (target.id === 'back-home') {
            e.preventDefault();
            e.stopPropagation();
            console.log('🏠 Back home clicked from constructor');
            router.go('/messenger');
          }

          if (target.classList.contains('component-button--link')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🏠 Back home clicked by class');
            router.go('/messenger');
          }
        }
      }
    });

    this.profileForm = tempForm;
    console.log('✅ this.profileForm set:', !!this.profileForm);

    console.log('🔧 ProfilePage constructor');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('🔄 ProfilePage initialize started');
    await this.loadUserData();
    console.log('✅ User data loaded:', this.userData);
    this.updateProfileForm();
    this.isInitialized = true;
    console.log('✅ Initialize completed');
  }

  private updateProfileForm(): void {
    if (!this.userData) return;

    const firstName = this.userData.first_name || '';
    const secondName = this.userData.second_name || '';
    const displayName = this.userData.display_name || '';
    const fullName = `${firstName} ${secondName}`;
    const avatarInitials = (firstName[0] || 'И') + (secondName[0] || 'И');

    console.log('📝 Updating ProfileForm with data:', {
      firstName,
      secondName,
      displayName,
      login: this.userData.login,
      email: this.userData.email,
      phone: this.userData.phone
    });

    // const children = this.getChildren();
    // const profileForm = children['profileForm'] as ProfileForm;

    if (!this.profileForm) {
      console.log('⚠️ this.profileForm is null, trying to get from children');
      const children = this.getChildren();
      const formFromChildren = children['profileForm'] as ProfileForm;
      if (formFromChildren) {
        console.log('✅ Found form in children, saving reference');
        this.profileForm = formFromChildren;
      }
    }

    if (this.profileForm) {
      console.log('✅ Found existing ProfileForm, updating...');
      // Обновляем данные существующей формы
      this.profileForm.updateData({
        isEditMode: this.isEditMode,
        firstName,
        secondName,
        displayName,
        login: this.userData.login || '',
        email: this.userData.email || '',
        phone: this.userData.phone || '',
        avatar: this.userData.avatar,
        avatarInitials,
        fullName,
      });
      console.log('✅ ProfileForm updated');
    } else {
      console.log('❌ ProfileForm not found in children');
    }
  }

  private async loadUserData(): Promise<void> {
    try {
      this.userData = await AuthAPI.getCurrentUser();
      if (!this.userData) {
        console.log('❌ No user data, redirecting to login');
        router.go('/');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      router.go('/');
    }
  }

  private onSubmit(): void {
    console.log('📝 onSubmit called, isEditMode:', this.isEditMode);
    if (this.isEditMode) {
      this.saveProfile();
    } else {
      this.toggleEditMode();
    }
  }

  private toggleEditMode(): void {
    console.log('🔄 toggleEditMode called, current mode:', this.isEditMode);
    this.isEditMode = !this.isEditMode;
    console.log('🔄 New mode:', this.isEditMode);

    const children = this.getChildren();
    const profileForm = children['profileForm'] as ProfileForm;

    if (profileForm) {
      console.log('✅ Updating ProfileForm with isEditMode:', this.isEditMode);
      profileForm.updateData({ isEditMode: this.isEditMode });
    } else {
      console.log('❌ ProfileForm not found in children');
    }

    // this.updateProfileForm();
    // this.forceUpdate();
    if (this.isEditMode) {
      this.setupEditMode();
    }
  }

  private setupEditMode(): void {
    setTimeout(() => {
      const content = this.getContent();
      const firstInput = content.querySelector('input') as HTMLInputElement;
      if (firstInput) {
        console.log('🎯 Focusing first input');
        firstInput.focus();
      }
    }, 100);
  }

  private async saveProfile(): Promise<void> {
    console.log('💾 saveProfile called, current isLoading:', this.isLoading);
    console.log('📋 this.profileForm reference:', !!this.profileForm);

    if (!this.profileForm) {
      console.log('⏳ No form reference, checking children...');
      const children = this.getChildren();
      console.log('👥 Children keys:', Object.keys(children));
      const formFromChildren = children['profileForm'] as ProfileForm;
      if (formFromChildren) {
        console.log('✅ Found form in children, using it');
        this.profileForm = formFromChildren;
      } else {
        console.log('❌ Form not found in children either');
        return;
      }
      return;
    }

    const data = this.profileForm.getValues() as unknown as FormData;
    console.log('📋 Raw form data:', data);

    const isChangingPassword = data.oldPassword || data.newPassword;
    console.log('🔑 Changing password:', isChangingPassword);

    // Валидация
    console.log('🔍 Running validation...');
    const errors = Validator.validateForm(data, 'profile');
    console.log('✅ Validation errors:', errors);
    
    if (Object.keys(errors).length > 0) {
      console.log('❌ Validation failed');
      this.showAllErrors(errors);
      const firstErrorField = Object.keys(errors)[0];
      const input = this.getContent().querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
      if (input) input.focus();
      return;
    }

    try {
      console.log('🔄 Setting loading state...');
      this.setLoading(true);
      
      const updateData = {
        first_name: data.first_name,
        second_name: data.second_name,
        display_name: data.display_name,
        login: data.login,
        email: data.email,
        phone: data.phone
      };

      console.log('📤 Sending update to API:', updateData);
      const updatedUser = await AuthAPI.updateProfile(updateData);
      console.log('✅ User updated successfully:', updatedUser);

      this.userData = updatedUser;

      if (isChangingPassword && data.oldPassword && data.newPassword) {
        console.log('🔐 Changing password...');
        try {
          await AuthAPI.changePassword(data.oldPassword, data.newPassword);
          console.log('✅ Password changed successfully');
          this.showMessage('Профиль и пароль успешно обновлены', 'success');
        } catch (error) {
          console.error('❌ Password change failed:', error);
          this.showMessage('Профиль обновлен, но не удалось сменить пароль', 'error');
        }
      } else {
        console.log('🎉 Profile updated without password change');
        this.showMessage('Профиль успешно обновлен!', 'success');
      }

      console.log('🔄 Updating form with new data...');
      // const children = this.getChildren();
      // const profileForm = children['profileForm'] as ProfileForm;
      if (this.profileForm) {
        this.profileForm.updateData({
          isEditMode: false,
          firstName: updatedUser.first_name || '',
          secondName: updatedUser.second_name || '',
          displayName: updatedUser.display_name || '',
          login: updatedUser.login || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          avatar: updatedUser.avatar,
          fullName: `${updatedUser.first_name || ''} ${updatedUser.second_name || ''}`.trim()
        });
        console.log('✅ Form updated');
      }

      this.isEditMode = false;
      console.log('✅ Edit mode disabled');

      // this.toggleEditMode();
      
    } catch (error) {
      console.error('Profile update error:', error);
      this.showMessage('Ошибка обновления профиля', 'error');
    } finally {
      console.log('🔄 Clearing loading state');
      this.setLoading(false);
    }
  }

  private async handleAvatarChange(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.showMessage('Пожалуйста, выберите изображение', 'error');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      this.showMessage('Изображение должно быть меньше 2MB', 'error');
      return;
    }
    
    try {
      this.setLoading(true);
      const updatedUser = await AuthAPI.updateAvatar(file);
      this.userData = updatedUser;

      const children = this.getChildren();
      const profileForm = children['profileForm'] as ProfileForm;
      if (profileForm) {
        profileForm.updateAvatar(updatedUser.avatar);
      }
      this.showMessage('Аватар обновлен!', 'success');
    } catch (error) {
      console.error('Avatar upload error:', error);
      this.showMessage('Ошибка при загрузке аватара', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  private validateOnBlur(fieldName: string, value: string): void {
    if (fieldName === 'oldPassword' || fieldName === 'newPassword') {
      const content = this.getContent();
      const oldPassword = (content.querySelector('#oldPassword') as HTMLInputElement)?.value || '';
      const newPassword = (content.querySelector('#newPassword') as HTMLInputElement)?.value || '';
      
      if (!oldPassword && !newPassword) return;
    }
    
    if (this.validationTimeouts[fieldName]) {
      clearTimeout(this.validationTimeouts[fieldName]);
    }
    
    this.validationTimeouts[fieldName] = setTimeout(() => {
      const error = Validator.validateField(fieldName, value, 'profile');
      this.showFieldError(fieldName, error || '');
    }, 300);
  }

  private showFieldError(fieldName: string, message: string): void {
    const content = this.getContent();
    const input = content.querySelector(`[name="${fieldName}"]`);
    const formGroup = input?.closest('.form-group');
    
    if (formGroup && input && message) {
      const oldError = formGroup.querySelector('.field-error');
      if (oldError) oldError.remove();
      
      input.classList.add('has-error');
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = message;
      formGroup.appendChild(errorDiv);
    } else if (formGroup && input) {
      input.classList.remove('has-error');
      input.classList.add('is-valid');
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

  private showMessage(text: string, type: 'success' | 'error'): void {
    const content = this.getContent();
    const oldMessage = content.querySelector('.profile-message');
    if (oldMessage) oldMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `profile-message profile-message--${type}`;
    messageDiv.textContent = text;
    messageDiv.style.cssText = `
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      text-align: center;
      font-weight: 500;
      ${type === 'success' 
        ? 'background-color: rgba(46, 204, 113, 0.1); color: #2ecc71; border: 1px solid #2ecc71;'
        : 'background-color: rgba(255, 71, 87, 0.1); color: #ff4757; border: 1px solid #ff4757;'
      }
    `;
    
    const form = content.querySelector('form');
    if (form) {
      form.parentNode?.insertBefore(messageDiv, form);
    }
    
    setTimeout(() => messageDiv.remove(), 5000);
  }

  private setLoading(loading: boolean): void {
    console.log('🔄 setLoading called with:', loading, 'current:', this.isLoading);
    this.isLoading = loading;

    const children = this.getChildren();
    const profileForm = children['profileForm'] as ProfileForm;

    if (profileForm) {
      profileForm.setLoading(loading);
    }
  }

  // private forceUpdate(): void {
  //   console.log('🔄 Force update called, profileForm exists:', !!this.profileForm);
  //   console.log('📋 Current children before update:', Object.keys(this.getChildren()));
  //   const content = this.getContent();
  //   if (content) {
  //     if (this.profileForm) {
  //       // Убеждаемся, что profileForm есть в children
  //       this.setProps({
  //         children: {
  //           profileForm: this.profileForm
  //         }
  //       });
  //       console.log('📋 Children after setProps:', Object.keys(this.getChildren()));
  //     }
  //     content.innerHTML = this.render();
  //     console.log('📋 Children after setting innerHTML:', Object.keys(this.getChildren()));
  //     this._replacePlaceholders();
  //     this._addEvents();
  //   }
  // }

  public override render(): string {
    console.log('🎨 ProfilePage render, isInitialized:', this.isInitialized, 'profileForm:', !!this.profileForm);
    const template = compile(templateSource);
    const children = this.getChildren();
    const context: Record<string, string> = {};
    
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });

    console.log('📝 Rendering with context keys:', Object.keys(context));
    console.log('📝 Children keys from getChildren():', Object.keys(children));
    const result = template(context);
    console.log('✅ Render result:', result);

    return result;
  }

  public override show(): void {
    console.log('👁️ Showing ProfilePage');
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }
  }

  public override hide(): void {
    console.log('👋 Hiding ProfilePage');
    const content = this.getContent();
    if (content) {
      content.style.display = 'none';
    }
  }

  protected override componentDidMount(): void {
    console.log('🚀 ProfilePage mounted');
    
    // Добавляем обработчики для валидации
    const content = this.getContent();

    content.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'back-home' || target.closest('#back-home')) {
        e.preventDefault();
        console.log('🏠 Back home clicked');
        router.go('/messenger');
      }
    });

    const inputs = content.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        const target = e.target as HTMLInputElement;
        this.validateOnBlur(target.name, target.value);
      });
      input.addEventListener('focus', () => {
        const formGroup = input.closest('.form-group');
        const error = formGroup?.querySelector('.field-error');
        if (error) error.remove();
        input.classList.remove('has-error', 'is-valid');
      });
    });

    // Обработчик для кнопки "На главную"
    const backButton = content.querySelector('#back-home');
    if (backButton) {
      backButton.addEventListener('click', (e) => {
        e.preventDefault();
        router.go('/messenger');
      });
    }
  }
}
