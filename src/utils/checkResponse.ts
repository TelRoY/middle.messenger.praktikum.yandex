import { HTTPResponse } from './HTTPClient';

export interface ErrorResponse {
  reason: string;
  errors?: Record<string, string>;
}

export function checkResponse<T>(response: HTTPResponse<T | ErrorResponse>): T {
  if (!response.ok) {
    const error = response.data as ErrorResponse;
    throw new Error(error.reason || 'Неизвестная ошибка');
  }
  return response.data as T;
}

export function checkResponseWithNull<T>(response: HTTPResponse<T | ErrorResponse>): T | null {
  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    const error = response.data as ErrorResponse;
    throw new Error(error.reason || 'Неизвестная ошибка');
  }
  return response.data as T;
}
