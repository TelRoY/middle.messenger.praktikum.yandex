import { UserDTO } from './User';

export interface Chat {
  id: number;
  title: string;
  avatar: string;
  unread_count: number;
  last_message: LastMessage | null;
  created_by: number;
}

export interface LastMessage {
  user: UserDTO;
  time: string;
  content: string;
}

export interface ChatDTO {
  id: number;
  title: string;
  avatar: string;
  unread_count: number;
  last_message: LastMessage | null;
  created_by: number;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  chat_id: number;
  type: string;
  time: string;
  content: string;
  is_read: boolean;
  file?: {
    id: number;
    user_id: number;
    path: string;
    filename: string;
    content_type: string;
    content_size: number;
    upload_date: string;
  } | undefined;
}

export interface MessageDTO {
  id: number;
  user_id: number;
  chat_id: number;
  type: string;
  time: string;
  content: string;
  is_read: boolean;
  file?: {
    id: number;
    user_id: number;
    path: string;
    filename: string;
    content_type: string;
    content_size: number;
    upload_date: string;
  } | undefined;
}

export interface ChatToken {
  token: string;
}

export interface AddUserToChatData {
  users: number[];
  chatId: number;
}

export interface DeleteUserFromChatData {
  users: number[];
  chatId: number;
}

export interface CreateChatData {
  title: string;
}
