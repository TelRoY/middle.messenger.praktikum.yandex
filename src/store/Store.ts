import { EventBus } from '../core/EventBus';
import { User } from '../models/User';
import { Chat, ChatMessage } from '../models/Chat';
import { AuthAPI, RegistrationRequest, ProfileUpdateRequest } from '../api/AuthAPI';
import { ChatsAPI } from '../api/ChatsAPI';

interface State {
  user: User | null;
  chats: Chat[];
  currentChat: {
    id: number | null;
    messages: ChatMessage[];
    token: string | null;
  };
  isLoading: boolean;
  error: string | null;
}

export enum StoreEvents {
  UPDATED = 'updated'
}

class Store extends EventBus {
  private state: State = {
    user: null,
    chats: [],
    currentChat: {
      id: null,
      messages: [],
      token: null
    },
    isLoading: false,
    error: null
  };

  constructor() {
    super();
  }

  public getState(): State {
    return this.state;
  }

  public setState(nextState: Partial<State>): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...nextState };
    this.emit(StoreEvents.UPDATED, prevState, this.state);
  }

  // Auth actions
  public async initAuth(): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      const user = await AuthAPI.getCurrentUser();
      this.setState({ user, isLoading: false });
    } catch (error) {
      this.setState({ user: null, isLoading: false, error: (error as Error).message });
    }
  }

  public async login(login: string, password: string): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await AuthAPI.login({ login, password });
      const user = await AuthAPI.getCurrentUser();
      this.setState({ user, isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async register(data: RegistrationRequest): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await AuthAPI.register(data);
      await this.login(data.login, data.password);
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async logout(): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await AuthAPI.logout();
      this.setState({ user: null, chats: [], currentChat: { id: null, messages: [], token: null }, isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async updateUser(data: ProfileUpdateRequest): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      const user = await AuthAPI.updateProfile(data);
      this.setState({ user, isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async updateAvatar(file: File): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      const user = await AuthAPI.updateAvatar(file);
      this.setState({ user, isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await AuthAPI.changePassword(oldPassword, newPassword);
      this.setState({ isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  // Chats actions
  public async loadChats(): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      const chats = await ChatsAPI.getChats();
      this.setState({ chats, isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async createChat(title: string): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await ChatsAPI.createChat({ title });
      await this.loadChats();
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async deleteChat(chatId: number): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await ChatsAPI.deleteChat(chatId);
      if (this.state.currentChat.id === chatId) {
        this.setState({ currentChat: { id: null, messages: [], token: null } });
      }
      await this.loadChats();
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async selectChat(chatId: number): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      const token = await ChatsAPI.getToken(chatId);
      const messages = await ChatsAPI.getChatMessages(chatId);
      this.setState({ 
        currentChat: { id: chatId, messages, token },
        isLoading: false 
      });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async addUserToChat(userId: number, chatId: number): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await ChatsAPI.addUserToChat({ users: [userId], chatId });
      this.setState({ isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public async removeUserFromChat(userId: number, chatId: number): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await ChatsAPI.deleteUserFromChat({ users: [userId], chatId });
      this.setState({ isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  }

  public addMessage(chatId: number, message: ChatMessage): void {
    if (this.state.currentChat.id === chatId) {
      this.setState({
        currentChat: {
          ...this.state.currentChat,
          messages: [...this.state.currentChat.messages, message]
        }
      });
    }
  }
}

export default new Store();
