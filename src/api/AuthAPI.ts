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

// Вспомогательные функции для безопасного преобразования
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
    console.log('📝 Login form submitted with data:', data);

    try {
      await this.logout();
      console.log('✅ Previous session cleared');
    } catch {
      console.log('ℹ️ No active session to clear');
    }

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
    try {
      console.log('📤 Sending registration request to:', '/auth/signup', data);
      const requestData = registrationRequestToRecord(data);
      
      console.log('📤 Sending registration request to:', '/auth/signup', requestData);
      const response = await fetch('https://ya-praktikum.tech/api/v2/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();
      console.log('📥 Registration response:', { status: response.status, data: responseData });

      if (!response.ok) {
        throw new Error(responseData.reason || 'Ошибка регистрации');
      }

      return responseData;

      // const response = await apiClient.post<RegistrationResponse | ErrorResponse>(
      //   '/auth/signup',
      //   requestData
      // );
      
      // console.log('📥 Registration response:', response);
    
      // if (!response.ok) {
      //   const error = response.data as ErrorResponse;
      //   throw new Error(error.reason || 'Ошибка регистрации');
      // }
    
      // return response.data as RegistrationResponse;
    } catch (error) {
      console.error('❌ Registration error details:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    console.log('👋 Logging out');
    const client = new HTTPClient('https://ya-praktikum.tech/api/v2');
    const response = await client.post<ErrorResponse>('/auth/logout', {});
    
    if (!response.ok) {
      const error = response.data as ErrorResponse;
      throw new Error(error.reason || 'Ошибка при выходе');
    }
    console.log('✅ Logout successful');
  }

  static async getCurrentUser(): Promise<ProfileResponse | null> {
    try {
      const client = new HTTPClient('https://ya-praktikum.tech/api/v2');
      const response = await client.get<ProfileResponse | ErrorResponse>('/auth/user');

      if (!response.ok) {
        return null;
      }

      return response.data as ProfileResponse;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  //   const response = await apiClient.get<ProfileResponse | ErrorResponse>(
  //     '/auth/user'
  //   );
    
  //   if (!response.ok) {
  //     const error = response.data as ErrorResponse;
  //     throw new Error(error.reason || 'Ошибка получения данных пользователя');
  //   }
    
  //   return response.data as ProfileResponse;
  // }

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
}
