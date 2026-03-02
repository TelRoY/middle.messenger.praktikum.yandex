import { Block, Props } from '../../core/Block';
import { compile } from 'handlebars';
import { BASE_URL } from '../../utils/HTTPClient';
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

            const content = this.getContent();
            const fileInput = content.querySelector('#avatar-input') as HTMLInputElement;
            if (fileInput) {
              fileInput.click();
            }
            return;
          }
        },
        change: (e: Event) => {
          const target = e.target as HTMLInputElement;

          if (target.id === 'avatar-input' && target.files && target.files[0]) {            
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
  }

  public updateData(data: Partial<ProfileFormProps>): void {

    if (data.avatar && typeof data.avatar === 'string' && data.avatar.startsWith('/')) {
      data.avatar = `${BASE_URL}/resources${data.avatar}`;
    }

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

  public updateAvatar(avatarUrl: string): void {    
    this.setProps({ avatar: avatarUrl });
    
    const content = this.getContent();
    if (content) {
      content.innerHTML = this.render();
      this._removeEvents();
      this._addEvents();
      
      const img = content.querySelector('.avatar-img') as HTMLImageElement;
      if (img) {
        img.onload = () => {};
        img.onerror = (e) => {
          console.error('❌ Avatar image failed to load:', e);
          console.error('❌ Failed URL:', img.src);
        };
      }
    }
  }
}
