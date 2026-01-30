import { apiClient } from '../utils/HTTPClient';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
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
  first_name?: string;
  second_name?: string;
  display_name?: string;
  login?: string;
  email?: string;
  phone?: string;
}

export interface ProfileResponse {
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
  errors?: Record<string, string>;
}

export class AuthAPI {
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse | ErrorResponse>(
      '/auth/signin',
      data
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка авторизации');
    }
    
    return response.data as LoginResponse;
  }

  static async register(data: RegistrationRequest): Promise<RegistrationResponse> {
    const response = await apiClient.post<RegistrationResponse | ErrorResponse>(
      '/auth/signup',
      data
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка регистрации');
    }
    
    return response.data as RegistrationResponse;
  }

  static async logout(): Promise<void> {
    const response = await apiClient.post('/auth/logout');
    
    if (!response.ok) {
      throw new Error('Ошибка при выходе');
    }
  }

  static async getCurrentUser(): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse | ErrorResponse>(
      '/auth/user'
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка получения данных пользователя');
    }
    
    return response.data as ProfileResponse;
  }

  static async updateProfile(data: ProfileUpdateRequest): Promise<ProfileResponse> {
    const response = await apiClient.put<ProfileResponse | ErrorResponse>(
      '/user/profile',
      data
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка обновления профиля');
    }
    
    return response.data as ProfileResponse;
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.put<ErrorResponse>(
      '/user/password',
      { oldPassword, newPassword }
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
      {
        headers: {}
      }
    );
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка обновления аватара');
    }
    
    return response.data as ProfileResponse;
  }
}
