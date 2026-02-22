import { apiClient, HTTPMethod, HTTPRequestData } from './HTTPClient';
import { ErrorResponse } from './checkResponse';

export interface RequestOptions {
  method?: HTTPMethod;
  data?: HTTPRequestData;
  params?: Record<string, string | number | boolean>;
  withAuth?: boolean;
}

export async function apiRequest<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = HTTPMethod.GET, data, params } = options;
  
    
    const requestOptions: Parameters<typeof apiClient.request>[1] = { method, data };
    
    if (params) {
        requestOptions.params = params;
    }

    const response = await apiClient.request<T | ErrorResponse>(url, requestOptions);

    if (!response.ok) {
        const error = response.data as ErrorResponse;
        throw new Error(error.reason || `Ошибка запроса: ${response.status}`);
    }

    return response.data as T;
  }

// Специальные методы для разных типов запросов
export const api = {
  get: <T>(url: string, params?: Record<string, string | number | boolean>) =>
    apiRequest<T>(url, { method: HTTPMethod.GET, ...(params && { params }) }),

  post: <T>(url: string, data?: HTTPRequestData) =>
    apiRequest<T>(url, { method: HTTPMethod.POST, ...(data && { data }) }),

  put: <T>(url: string, data?: HTTPRequestData) =>
    apiRequest<T>(url, { method: HTTPMethod.PUT, ...(data && { data }) }),

  delete: <T>(url: string, data?: HTTPRequestData) =>
    apiRequest<T>(url, { method: HTTPMethod.DELETE, ...(data && { data }) }),

  patch: <T>(url: string, data?: HTTPRequestData) =>
    apiRequest<T>(url, { method: HTTPMethod.PATCH, ...(data && { data }) }),
};
