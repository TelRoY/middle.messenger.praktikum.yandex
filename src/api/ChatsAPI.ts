import { apiClient } from '../utils/HTTPClient';
import { Chat, ChatDTO, ChatMessage, MessageDTO, AddUserToChatData, DeleteUserFromChatData, CreateChatData } from '../models/Chat';
import { UserDTO } from '../models/User';

export interface ErrorResponse {
  reason: string;
}

export class ChatsAPI {
  static async getChats(): Promise<Chat[]> {
    const response = await apiClient.get<ChatDTO[] | ErrorResponse>('/chats');
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка получения списка чатов');
    }
    
    const chats = response.data as ChatDTO[];
    return chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      avatar: chat.avatar,
      unread_count: chat.unread_count,
      last_message: chat.last_message,
      created_by: chat.created_by
    }));
  }

  static async createChat(data: CreateChatData): Promise<{ id: number }> {
    const requestData = data as unknown as Record<string, unknown>;
    const response = await apiClient.post<{ id: number } | ErrorResponse>(
      '/chats',
      requestData
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка создания чата');
    }
    
    return response.data as { id: number };
  }

  static async deleteChat(chatId: number): Promise<void> {
    const response = await apiClient.delete<ErrorResponse>(
      '/chats',
      { data: { chatId } as Record<string, unknown> }
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка удаления чата');
    }
  }

  static async getToken(chatId: number): Promise<string> {
    const response = await apiClient.post<{ token: string } | ErrorResponse>(
      `/chats/token/${chatId}`,
      {}
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка получения токена');
    }
    
    return (response.data as { token: string }).token;
  }

  static async getChatMessages(chatId: number): Promise<ChatMessage[]> {
    const response = await apiClient.get<MessageDTO[] | ErrorResponse>(
      `/chats/${chatId}/messages`
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка получения сообщений');
    }
    
    const messages = response.data as MessageDTO[];
    return messages.map(msg => ({
      id: msg.id,
      user_id: msg.user_id,
      chat_id: msg.chat_id,
      type: msg.type,
      time: msg.time,
      content: msg.content,
      is_read: msg.is_read,
      file: msg.file
    }));
  }

  static async addUserToChat(data: AddUserToChatData): Promise<void> {
    const requestData = data as unknown as Record<string, unknown>;
    const response = await apiClient.put<ErrorResponse>(
      '/chats/users',
      requestData
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка добавления пользователя');
    }
  }

  static async deleteUserFromChat(data: DeleteUserFromChatData): Promise<void> {
    const requestData = data as unknown as Record<string, unknown>;
    const response = await apiClient.delete<ErrorResponse>(
      '/chats/users',
      { data: requestData }
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка удаления пользователя');
    }
  }

  static async getChatUsers(chatId: number): Promise<UserDTO[]> {
    const response = await apiClient.get<UserDTO[] | ErrorResponse>(
      `/chats/${chatId}/users`
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка получения пользователей чата');
    }
    
    return response.data as UserDTO[];
  }

  static async uploadChatAvatar(chatId: number, file: File): Promise<Chat> {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('chatId', chatId.toString());

    const response = await apiClient.put<ChatDTO | ErrorResponse>(
      '/chats/avatar',
      formData
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка загрузки аватара');
    }
    
    const chat = response.data as ChatDTO;
    return {
      id: chat.id,
      title: chat.title,
      avatar: chat.avatar,
      unread_count: chat.unread_count,
      last_message: chat.last_message,
      created_by: chat.created_by
    };
  }
}
