import { api } from '../utils/apiRequest';
// import { checkResponse, ErrorResponse } from '../utils/checkResponse';
import { Chat, ChatDTO, ChatMessage, MessageDTO, AddUserToChatData, DeleteUserFromChatData, CreateChatData } from '../models/Chat';
import { UserDTO } from '../models/User';

export class ChatsAPI {
  static async getChats(): Promise<Chat[]> {
    // const response = await apiClient.get<ChatDTO[] | ErrorResponse>('/chats');   
    // const chats = response.data as ChatDTO[];
    const chats = await api.get<ChatDTO[]>('/chats');

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
    return api.post<{ id: number }>('/chats', data);
    // const requestData = data as unknown as Record<string, unknown>;
    // const response = await apiClient.post<{ id: number } | ErrorResponse>(
    //   '/chats',
    //   requestData
    // );
    
    // return checkResponse<{ id: number }>(response);
  }

  static async deleteChat(chatId: number): Promise<void> {
    await api.delete<void>('/chats', { chatId });
    // const response = await apiClient.delete<ErrorResponse>(
    //   '/chats',
    //   { data: { chatId } as Record<string, unknown> }
    // );

    // checkResponse<void>(response);
  }

  static async getToken(chatId: number): Promise<string> {
    const response = await api.post<{ token: string }>(`/chats/token/${chatId}`, {});
    return response.token;
    // const response = await apiClient.post<{ token: string } | ErrorResponse>(
    //   `/chats/token/${chatId}`,
    //   {}
    // );
    // const data = checkResponse<{ token: string }>(response);

    // return data.token;
  }

  static async getChatMessages(chatId: number): Promise<ChatMessage[]> {
    // const response = await apiClient.get<MessageDTO[] | ErrorResponse>(
    //   `/chats/${chatId}/messages`
    // );
    // const messages = checkResponse<MessageDTO[]>(response);
    const messages = await api.get<MessageDTO[]>(`/chats/${chatId}/messages`);

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
    await api.put<void>('/chats/users', data);
    // const requestData = data as unknown as Record<string, unknown>;
    // const response = await apiClient.put<ErrorResponse>(
    //   '/chats/users',
    //   requestData
    // );
    
    // checkResponse<void>(response);
  }

  static async deleteUserFromChat(data: DeleteUserFromChatData): Promise<void> {
    await api.delete<void>('/chats/users', data);
    // const requestData = data as unknown as Record<string, unknown>;
    // const response = await apiClient.delete<ErrorResponse>(
    //   '/chats/users',
    //   { data: requestData }
    // );

    // checkResponse<void>(response);
  }

  static async getChatUsers(chatId: number): Promise<UserDTO[]> {
    return api.get<UserDTO[]>(`/chats/${chatId}/users`);
    // const response = await apiClient.get<UserDTO[] | ErrorResponse>(
    //   `/chats/${chatId}/users`
    // );
    
    // return checkResponse<UserDTO[]>(response);
  }

  static async uploadChatAvatar(chatId: number, file: File): Promise<Chat> {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('chatId', chatId.toString());

    const chat = await api.put<ChatDTO>('/chats/avatar', formData);
    // const response = await apiClient.put<ChatDTO | ErrorResponse>(
    //   '/chats/avatar',
    //   formData
    // );
    
    // const chat = checkResponse<ChatDTO>(response);
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
