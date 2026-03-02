import { Block } from '../../core/Block';
import { Validator } from '../../utils/Validator';
import { AuthAPI, ProfileResponse } from '../../api/AuthAPI';
import { compile } from 'handlebars';
import { router } from '../../main';
import { BASE_URL } from '../../utils/HTTPClient';

import { ProfileForm } from '../../components/forms/ProfileForm';

import templateSource from './profile.hbs';

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
  private profileForm: ProfileForm | null = null;
  private userData: ProfileResponse | null = null;

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
        this.onSubmit();
      },
      onCancel: () => {
        this.toggleEditMode();
      },
      onAvatarChange: (file: File) => {
        this.handleAvatarChange(file);
      }
    });

    super('div', {
      children: {
        profileForm: tempForm
      }, 
      events: {
        click: (e: Event) => {
          const target = e.target as HTMLElement;

          if (target.classList.contains('button--home')) {
            e.preventDefault();
            e.stopPropagation();
            router.go('/messenger');
          }
        }
      }
    });

    this.profileForm = tempForm;

    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadUserData();
    this.updateProfileForm();
  }

  private updateProfileForm(): void {
    if (!this.userData) return;

    const firstName = this.userData.first_name || '';
    const secondName = this.userData.second_name || '';
    const displayName = this.userData.display_name || '';
    const fullName = `${firstName} ${secondName}`;
    const avatarInitials = (firstName[0] || 'И') + (secondName[0] || 'И');

    if (!this.profileForm) {
      const children = this.getChildren();
      const formFromChildren = children['profileForm'] as ProfileForm;
      if (formFromChildren) {
        this.profileForm = formFromChildren;
      }
    }

    if (this.profileForm) {
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
    }
  }

  private async loadUserData(): Promise<void> {
    this.userData = await AuthAPI.getCurrentUser();
    if (!this.userData) {
      router.go('/');
    }
  }

  private onSubmit(): void {
    if (this.isEditMode) {
      this.saveProfile();
    } else {
      this.toggleEditMode();
    }
  }

  private toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;

    const children = this.getChildren();
    const profileForm = children['profileForm'] as ProfileForm;

    if (profileForm) {
      profileForm.updateData({ isEditMode: this.isEditMode });
    }
    if (this.isEditMode) {
      this.setupEditMode();
    }
  }

  private setupEditMode(): void {
    setTimeout(() => {
      const content = this.getContent();
      const firstInput = content.querySelector('input') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  private async saveProfile(): Promise<void> {

    if (!this.profileForm) {
      const children = this.getChildren();
      const formFromChildren = children['profileForm'] as ProfileForm;
      if (formFromChildren) {
        this.profileForm = formFromChildren;
      }
      return;
    }

    const data = this.profileForm.getValues() as unknown as FormData;

    const isChangingPassword = data.oldPassword || data.newPassword;

    const errors = Validator.validateForm(data, 'profile');
    
    if (Object.keys(errors).length > 0) {
      this.showAllErrors(errors);
      const firstErrorField = Object.keys(errors)[0];
      const input = this.getContent().querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
      if (input) input.focus();
      return;
    }

    try {
      this.setLoading(true);
      
      const updateData = {
        first_name: data.first_name,
        second_name: data.second_name,
        display_name: data.display_name,
        login: data.login,
        email: data.email,
        phone: data.phone
      };

      const updatedUser = await AuthAPI.updateProfile(updateData);

      this.userData = updatedUser;

      if (isChangingPassword && data.oldPassword && data.newPassword) {
        try {
          await AuthAPI.changePassword(data.oldPassword, data.newPassword);
          this.showMessage('Профиль и пароль успешно обновлены', 'success');
        } catch {
          this.showMessage('Профиль обновлен, но не удалось сменить пароль', 'error');
        }
      } else {
        this.showMessage('Профиль успешно обновлен!', 'success');
      }

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
      }

      this.isEditMode = false;
      
    } catch {
      this.showMessage('Ошибка обновления профиля', 'error');
    } finally {
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

      const avatarUrl = `${BASE_URL}/resources${updatedUser.avatar}`;
    
      const children = this.getChildren();
      const profileForm = children['profileForm'] as ProfileForm;
      if (profileForm) {        
        profileForm.updateAvatar(avatarUrl);
      }
      this.showMessage('Аватар обновлен!', 'success');
    } catch {
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

    const children = this.getChildren();
    const profileForm = children['profileForm'] as ProfileForm;

    if (profileForm) {
      profileForm.setLoading(loading);
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
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }
  }

  public override hide(): void {
    const content = this.getContent();
    if (content) {
      content.style.display = 'none';
    }
  }

  protected override componentDidMount(): void {
    
    const content = this.getContent();

    content.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'back-home' || target.closest('#back-home')) {
        e.preventDefault();
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

    const backButton = content.querySelector('#back-home');
    if (backButton) {
      backButton.addEventListener('click', (e) => {
        e.preventDefault();
        router.go('/messenger');
      });
    }
  }
}
