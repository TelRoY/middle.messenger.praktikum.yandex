import { api } from '../utils/apiRequest';
import { HTTPClient } from '../utils/HTTPClient';
import { checkResponse, ErrorResponse } from '../utils/checkResponse';
import { User } from '../models/User';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse extends User {
  id: number;
  first_name: string;
  second_name: string;
  display_name: string;
  login: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface RegistrationRequest {
  first_name: string;
  second_name: string;
  login: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegistrationResponse {
  id: number;
}

export interface ProfileUpdateRequest {
  first_name?: string | undefined;
  second_name?: string | undefined;
  display_name?: string | undefined;
  login?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface ProfileResponse extends User {
  id: number;
  first_name: string;
  second_name: string;
  display_name: string;
  login: string;
  email: string;
  phone: string;
  avatar: string;
}

function loginRequestToRecord(data: LoginRequest): Record<string, string> {
  return {
    login: data.login,
    password: data.password
  };
}

function registrationRequestToRecord(data: RegistrationRequest): Record<string, string> {
  return {
    first_name: data.first_name,
    second_name: data.second_name,
    login: data.login,
    email: data.email,
    password: data.password,
    phone: data.phone
  };
}

function changePasswordToRecord(oldPassword: string, newPassword: string): Record<string, string> {
  return {
    oldPassword,
    newPassword
  };
}

function profileUpdateRequestToRecord(data: ProfileUpdateRequest): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (data.first_name !== undefined) result['first_name'] = data.first_name;
  if (data.second_name !== undefined) result['second_name'] = data.second_name;
  if (data.display_name !== undefined) result['display_name'] = data.display_name;
  if (data.login !== undefined) result['login'] = data.login;
  if (data.email !== undefined) result['email'] = data.email;
  if (data.phone !== undefined) result['phone'] = data.phone;
  
  return result;
}

export class AuthAPI {
  static async login(data: LoginRequest): Promise<LoginResponse> {
    await this.logout();
    

    const requestData = loginRequestToRecord(data);
    const client = new HTTPClient('https://ya-praktikum.tech/api/v2');
    const response = await client.post<LoginResponse | ErrorResponse>(
      '/auth/signin',
      requestData
    );
    
    return checkResponse<LoginResponse>(response);
  }

  static async register(data: RegistrationRequest): Promise<RegistrationResponse> {
    
    const requestData = registrationRequestToRecord(data);
    return api.post<RegistrationResponse>('/auth/signup', requestData);
  }

  static async logout(): Promise<void> {
    try {
      const client = new HTTPClient('https://ya-praktikum.tech/api/v2');
      const response = await client.post<ErrorResponse>('/auth/logout', {});
    
      if (!response.ok && response.status !== 401) {
        const error = response.data as ErrorResponse;
        throw new Error(error.reason || 'Ошибка при выходе');
      }
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=; expires=" + new Date().toUTCString() + "; path=/");
      });
    }
  }

  static async getCurrentUser(): Promise<ProfileResponse | null> {
    try {
      return await api.get<ProfileResponse>('/auth/user');
    } catch {
      return null;
    }
  }

  static async updateProfile(data: ProfileUpdateRequest): Promise<ProfileResponse> {
    const requestData = profileUpdateRequestToRecord(data);
    return api.put<ProfileResponse>('/user/profile', requestData);
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const requestData = changePasswordToRecord(oldPassword, newPassword);
    await api.put<void>('/user/password', requestData);
  }

  static async updateAvatar(avatar: File): Promise<ProfileResponse> {
    console.log('🖼️ Updating avatar, file:', avatar.name, avatar.size);

    const formData = new FormData();
    formData.append('avatar', avatar);
    try {
      const response = await api.put<ProfileResponse>('/user/profile/avatar', formData);
      console.log('✅ Avatar updated successfully, response:', response);
      console.log('🖼️ Avatar URL from response:', response.avatar);
      return response;
    } catch (error) {
      console.error('❌ Failed to update avatar:', error);
      throw error;
    }
    // return api.put<ProfileResponse>('/user/profile/avatar', formData);
  }

  static async searchUsers(login: string): Promise<User[]> {
    return api.post<User[]>('/user/search', { login });
  }
}
