import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './AddUserForm.hbs';
import { AuthAPI } from '../../../api/AuthAPI';
import { User } from '../../../models/User';

export interface AddUserFormProps extends Props {
  id?: string;
  chatId: number;
  currentUserId: number;
  onAddUser?: (userId: number) => void;
  onRemoveUser?: (userId: number) => void;
  onClose?: () => void;
}

export class AddUserForm extends Block {
  private searchResults: User[] = [];
  private isLoading: boolean = false;
  private loginInput: string = '';

  constructor(props: AddUserFormProps) {
    super('div', {
      ...props,
      events: {
        submit: (e: Event) => {
          e.preventDefault();
          this.handleSearch();
        },
        input: (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.id === 'user-login') {
            this.loginInput = target.value;
          }
        },
        click: (e: Event) => {
          const target = e.target as HTMLElement;
          
          if (target.closest('[data-action="add-user"]')) {
            const userId = target.closest('[data-user-id]')?.getAttribute('data-user-id');
            if (userId && props.onAddUser) {
              props.onAddUser(parseInt(userId));
              this.searchResults = [];
              this.loginInput = '';
              this.forceUpdate();
            }
          }
          
          if (target.closest('[data-action="close"]')) {
            if (props.onClose) {
              props.onClose();
            }
          }
        }
      }
    });
  }

  private async handleSearch(): Promise<void> {
    if (this.loginInput.length < 3) {
      alert('Введите минимум 3 символа');
      return;
    }

    this.isLoading = true;
    this.forceUpdate();

    try {
      const users = await AuthAPI.searchUsers(this.loginInput);
      this.searchResults = users;
    } catch (error) {
      console.error('Search failed:', error);
      this.searchResults = [];
    } finally {
      this.isLoading = false;
      this.forceUpdate();
    }
  }

  public forceUpdate(): void {
    const content = this.getContent();
    if (content) {
      content.innerHTML = this.render();
      this._addEvents();
    }
  }

  public override render(): string {
    const template = compile(templateSource);
    const props = this.props as AddUserFormProps;
    
    return template({
      id: props.id || 'add-user-form',
      searchResults: this.searchResults,
      isLoading: this.isLoading,
      loginInput: this.loginInput
    });
  }
}
