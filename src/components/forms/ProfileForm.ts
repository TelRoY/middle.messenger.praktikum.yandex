import { Block, Props } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './ProfileForm.hbs';

export interface ProfileFormProps extends Props {
  id?: string;
  className?: string;
  isEditMode?: boolean;
  firstName: string;
  secondName: string;
  displayName: string;
  login: string;
  email: string;
  phone: string;
  avatar?: string;
  avatarInitials: string;
  fullName: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  onAvatarChange?: (file: File) => void;
}

export class ProfileForm extends Block {
  constructor(props: ProfileFormProps) {
    console.log('🏗️ ProfileForm constructor called with props:', props);

    const events: Record<string, EventListener> = {
      submit: (e: Event) => {
        e.preventDefault();
        if (props.onSubmit) {
          props.onSubmit();
        }
      },
      click: (e: Event) => {
        const target = e.target as HTMLElement;
        
        if (target.id === 'cancel-edit' || target.closest('#cancel-edit')) {
          e.preventDefault();
          if (props.onCancel) {
            props.onCancel();
          }
          return;
        }

         if (target.classList.contains('avatar-upload-btn') || target.closest('.avatar-upload-btn')) {
            e.preventDefault();
            e.stopPropagation(); 

            console.log('🖱️ Avatar upload button clicked');

            const content = this.getContent();
            const fileInput = content.querySelector('#avatar-input') as HTMLInputElement;
            if (fileInput) {
              console.log('📁 Triggering file input click');
              fileInput.click();
            } else {
              console.log('File input not found');
            }
            return;
          }
        },
        change: (e: Event) => {
          const target = e.target as HTMLInputElement;
          console.log('📁 Change event on input:', target.id, target.files?.length);

          if (target.id === 'avatar-input' && target.files && target.files[0]) {
            console.log('📁 File selected:', target.files[0].name, target.files[0].type, target.files[0].size);
            
            if (props.onAvatarChange) {
              props.onAvatarChange(target.files[0]);
            }
            target.value = '';
          }
        }
      };
    super('div', {
      ...props,
      events
    });
    console.log('📋 ProfileForm events registered');
  }

  public updateData(data: Partial<ProfileFormProps>): void {

    const hasChanges = Object.keys(data).some(key => 
      this.props[key] !== data[key as keyof ProfileFormProps]
    );
    if (!hasChanges) {
      return;
    }

    Object.assign(this.props, data);
    const content = this.getContent();
    if (content) {
      content.innerHTML = this.render();
      this._removeEvents();
      this._addEvents();
    }
  }

  public override render(): string {

    const template = compile(templateSource);
    const context = {
      id: this.props['id'] as string || 'profile-form',
      className: this.props['className'] as string || 'profile-form',
      isEditMode: this.props['isEditMode'] as boolean || false,
      firstName: this.props['firstName'] as string || '',
      secondName: this.props['secondName'] as string || '',
      displayName: this.props['displayName'] as string || '',
      login: this.props['login'] as string || '',
      email: this.props['email'] as string || '',
      phone: this.props['phone'] as string || '',
      avatar: this.props['avatar'] as string,
      avatarInitials: this.props['avatarInitials'] as string || 'ИИ',
      fullName: this.props['fullName'] as string || 'Иван Иванов'
    };
    return template(context);
  }

  public getFormData(): FormData {
    const content = this.getContent();
    const form = content.querySelector('form') as HTMLFormElement;
    return new FormData(form);
  }

  public getValues(): Record<string, string> {
    const formData = this.getFormData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    return data;
  }

  public setLoading(loading: boolean): void {

    const content = this.getContent();
    const submitButton = content.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      if (loading) {
        submitButton.disabled = true;
        submitButton.textContent = this.props['isEditMode'] ? 'Сохранение...' : 'Загрузка...';
        submitButton.classList.add('loading');
      } else {
        submitButton.disabled = false;
        submitButton.textContent = this.props['isEditMode'] ? 'Сохранить изменения' : 'Редактировать профиль';
        submitButton.classList.remove('loading');
      }
    }
  }
  public updateAvatarWithFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      const content = this.getContent();
      if (!content) return;
      
      const avatarContainer = content.querySelector('.avatar-container');
      if (!avatarContainer) return;
      
      avatarContainer.innerHTML = `
        <img src="${dataUrl}" alt="Аватар" class="avatar-img" style="width: 100%; height: 100%; object-fit: cover;">
        ${this.props['isEditMode'] ? '<div class="avatar-upload-btn"><span>Изменить фото</span></div>' : ''}
        <input type="file" id="avatar-input" name="avatar" accept="image/*" style="display: none;">
      `;
    };
    reader.readAsDataURL(file);
  }
}
