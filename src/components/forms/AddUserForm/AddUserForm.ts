import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './AddUserForm.hbs';
import { AuthAPI } from '../../../api/AuthAPI';
import { ChatsAPI } from '../../../api/ChatsAPI';
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
  private chatUsers: User[] = [];
  private isLoading: boolean = false;
  private searchTimeout: NodeJS.Timeout | null = null;
  private searchValue: string = '';

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
            this.searchValue = target.value;
            
            if (this.searchTimeout) {
              clearTimeout(this.searchTimeout);
            }
            
            this.searchTimeout = setTimeout(() => {
              if (this.searchValue.length >= 3) {
                this.handleSearch();
              } else {
                this.searchResults = [];
                this.forceUpdate();
              }
            }, 500);
          }
        },
        click: async (e: Event) => {
          const target = e.target as HTMLElement;
          console.log('🖱️ Click on:', target.className, target.tagName, target.getAttribute('data-action'));
                    
          const addButton = target.closest('[data-action="add-user"]');
          if (addButton) {
            e.preventDefault();
            e.stopPropagation();

            const userId = addButton.getAttribute('data-user-id');
            console.log('➕ Add user button clicked, userId:', userId);
            console.log('📞 onAddUser exists:', !!props.onAddUser);

            if (userId && props.onAddUser) {
              console.log('✅ Calling onAddUser now...');
              props.onAddUser(parseInt(userId));
              console.log('✅ onAddUser completed');
            } else {
              console.log('❌ onAddUser not available or userId missing');
            }
            return;
          }
  
          const removeButton = target.closest('[data-action="remove-user"]');
          if (removeButton) {
            e.preventDefault();
            e.stopPropagation();

            const userId = removeButton.getAttribute('data-user-id');
            console.log('➖ Remove user button clicked, userId:', userId);

            if (userId && props.onRemoveUser) {
              props.onRemoveUser(parseInt(userId));
            }
            return;
          }
  
          const closeButton = target.closest('[data-action="close"]');
          if (closeButton) {
            e.preventDefault();
            e.stopPropagation();

            if (props.onClose) {
              props.onClose();
            }
            return;
          }
        
          if (target.closest('[data-action="add-user"]')) {
            const userId = target.closest('[data-user-id]')?.getAttribute('data-user-id');
            if (userId && props.onAddUser) {
              props.onAddUser(parseInt(userId));
            }
          }
          
          if (target.closest('[data-action="remove-user"]')) {
            const userId = target.closest('[data-user-id]')?.getAttribute('data-user-id');
            if (userId && props.onRemoveUser) {
              props.onRemoveUser(parseInt(userId));
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

    this.loadChatUsers();
  }

  private async loadChatUsers(): Promise<void> {
    const props = this.props as AddUserFormProps;
    console.log('📋 Loading users for chat', props.chatId);
    
    try {
      const users = await ChatsAPI.getChatUsers(props.chatId);
      console.log('✅ Loaded users:', users);
      this.chatUsers = users;
      this.forceUpdate();
    } catch (error) {
      console.error('❌ Failed to load chat users:', error);
    }
  }

  private async handleSearch(): Promise<void> {
    console.log('🔍 Searching for:', this.searchValue);
    
    this.isLoading = true;
    this.forceUpdate();

    try {
      const users = await AuthAPI.searchUsers(this.searchValue);
      console.log('✅ Search results:', users);
      
      // Фильтруем пользователей, которые уже в чате
      this.searchResults = users.filter(user => 
        !this.chatUsers.some(chatUser => chatUser.id === user.id)
      );
    } catch (error) {
      console.error('❌ Search failed:', error);
      this.searchResults = [];
    } finally {
      this.isLoading = false;
      this.forceUpdate();
    }
  }

  // public addUser(user: User): void {
  //   this.chatUsers = [...this.chatUsers, user];
  //   this.searchResults = this.searchResults.filter(u => u.id !== user.id);
  //   this.forceUpdate();
  // }

  // public removeUser(userId: number): void {
  //   this.chatUsers = this.chatUsers.filter(u => u.id !== userId);
  //   this.forceUpdate();
  // }

  // public updateUsers(users: User[]): void {
  //   this.chatUsers = users;
  //   this.forceUpdate();
  // }

  public forceUpdate(): void {
    console.log('🔄 Force update, searchValue:', this.searchValue);
    const content = this.getContent();
    if (content) {
      content.innerHTML = this.render();
      this._addEvents();
      
      const input = content.querySelector('#user-login') as HTMLInputElement;
      if (input) {
        input.value = this.searchValue;
      }
    }
  }

  public override render(): string {
    const template = compile(templateSource);
    const props = this.props as AddUserFormProps;
    
    return template({
      id: props.id || 'add-user-form',
      searchResults: this.searchResults,
      chatUsers: this.chatUsers,
      currentUserId: props.currentUserId,
      isLoading: this.isLoading,
      searchValue: this.searchValue
    });
  }
}
