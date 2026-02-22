import { apiClient, HTTPClient } from '../utils/HTTPClient';
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

export interface ErrorResponse {
  reason: string;
  errors?: Record<string, string> | undefined;
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
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка авторизации');
    }
    
    return response.data as LoginResponse;
  }

  static async register(data: RegistrationRequest): Promise<RegistrationResponse> {
    
    const requestData = registrationRequestToRecord(data);

    const response = await fetch('https://ya-praktikum.tech/api/v2/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestData)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.reason || 'Ошибка регистрации');
    }

    return responseData;
  }

  static async logout(): Promise<void> {

    try {
      const client = new HTTPClient('https://ya-praktikum.tech/api/v2');
      const response = await client.post<ErrorResponse>('/auth/logout', {});
    
      if (!response.ok) {
        if (response.status !== 401) {
          const error = response.data as ErrorResponse;
          throw new Error(error.reason || 'Ошибка при выходе');
        }
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
      const client = new HTTPClient('https://ya-praktikum.tech/api/v2');
      const response = await client.get<ProfileResponse | ErrorResponse>('/auth/user');

      if (!response.ok) {
        return null;
      }

      return response.data as ProfileResponse;
    } catch {
      throw null;
    }
  }

  static async updateProfile(data: ProfileUpdateRequest): Promise<ProfileResponse> {
    const requestData = profileUpdateRequestToRecord(data);
    
    const response = await apiClient.put<ProfileResponse | ErrorResponse>(
      '/user/profile',
      requestData
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка обновления профиля');
    }
    
    return response.data as ProfileResponse;
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const requestData = changePasswordToRecord(oldPassword, newPassword);
    
    const response = await apiClient.put<ErrorResponse>(
      '/user/password',
      requestData
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка смены пароля');
    }
  }

  static async updateAvatar(avatar: File): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append('avatar', avatar);

    const response = await apiClient.put<ProfileResponse | ErrorResponse>(
      '/user/profile/avatar',
      formData,
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка обновления аватара');
    }
    
    return response.data as ProfileResponse;
  }

  static async searchUsers(login: string): Promise<User[]> {
    const response = await apiClient.post<User[] | ErrorResponse>(
      '/user/search',
      { login }
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка поиска пользователей');
    }
    const users = response.data as User[];
    return users;
  }
}
