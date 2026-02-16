export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export type HTTPRequestData = Record<string, unknown> | string | FormData | null;

export interface HTTPRequestOptions {
  method?: HTTPMethod;
  headers?: Record<string, string> | undefined;
  data?: HTTPRequestData | undefined;
  timeout?: number | undefined;
  withCredentials?: boolean | undefined;
  params?: Record<string, string | number | boolean> | undefined;
}

export interface HTTPResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

function queryStringify(data: Record<string, string | number | boolean>): string {
  if (!data) return '';
  
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export class HTTPClient {
  private baseURL: string;

  constructor(baseURL: string = 'https://ya-praktikum.tech/api/v2') {
    this.baseURL = baseURL;
    console.log('🚀 HTTPClient created with baseURL:', this.baseURL);
  }

  async request<T = unknown>(
    url: string,
    options: HTTPRequestOptions = {}
  ): Promise<HTTPResponse<T>> {
    // console.log('📨 HTTP Request:', {
    //   method: options.method || 'GET',
    //   url: url,
    //   data: options.data,
    //   headers: options.headers
    // });
    const { method = HTTPMethod.GET, data, headers = {}, timeout = 5000, params } = options;
    let fullUrl = `${this.baseURL}${url}`;
    if (params) {
      fullUrl += `?${queryStringify(params)}`;
    }
    console.log(`🌐 Full URL: ${fullUrl}`);
    console.log(`📨 HTTP Request: ${method} ${fullUrl}`, { data, headers, baseURL: this.baseURL });
    
    const requestHeaders: Record<string, string> = {
      ...headers
    };

    if (!(data instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include',
      mode: 'cors'
    };

    if (data) {
      fetchOptions.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      fetch(fullUrl, { ...fetchOptions, signal: controller.signal })
        .then(async (response) => {
          clearTimeout(timeoutId);
          
          let responseData;
          const contentType = response.headers.get('Content-Type');
          
          if (contentType?.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          console.log(`📥 HTTP Response: ${method} ${fullUrl}`, {
            status: response.status,
            ok: response.ok,
            data: responseData
          });

          const result: HTTPResponse<T> = {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: responseData,
            headers: Object.fromEntries(response.headers.entries())
          };

          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);

          console.error(`❌ HTTP Error: ${method} ${fullUrl}`, error);
          
          if (error.name === 'AbortError') {
            reject(new Error(`Request timeout after ${timeout}ms`));
          } else {
            reject(error);
          }
        });
    });
  }

  //   // Имитация задержки сети
  //   await new Promise(resolve => setTimeout(resolve, 300));
    
  //   // Генерируем моковые данные в зависимости от URL
  //   const mockData = this.generateMockData(url, options.data);
    
  //   const response: HTTPResponse<T> = {
  //     ok: true,
  //     status: 200,
  //     statusText: 'OK',
  //     data: mockData as T,
  //     headers: { 'content-type': 'application/json' }
  //   };
    
  //   console.log('✅ HTTP Response:', response);
  //   return response;
  // }

  // private generateMockData(url: string, data?: HTTPRequestData): unknown {
  //   console.log(`🔧 Generating mock data for: ${url}`);
    
  //   switch (url) {
  //     case '/auth/signin':
  //       console.log('🔐 Login attempt with data:', data);
  //       const loginData = data as Record<string, string>;
  //       return {
  //         id: 1,
  //         first_name: 'Иван',
  //         second_name: 'Иванов',
  //         display_name: 'ivan95',
  //         login: loginData?.["login"] || 'testuser',
  //         email: 'test@example.com',
  //         phone: '+7 (800) 555-35-35',
  //         avatar: ''
  //       };

  //     case '/auth/signup':
  //       console.log('📝 Registration attempt with data:', data);
  //       return { id: 1 };

  //     case '/auth/user':
  //       console.log('👤 Getting current user data');
  //       return {
  //         id: 1,
  //         first_name: 'Иван',
  //         second_name: 'Иванов',
  //         display_name: 'ivan95',
  //         login: 'ivanivanov',
  //         email: 'ivanivanov@yandex.ru',
  //         phone: '+7 (800) 555-35-35',
  //         avatar: ''
  //       };

  //     case '/user/profile':
  //       console.log('🔄 Updating profile with data:', data);
  //       const profileData = data as Record<string, string>;
  //       return {
  //         id: 1,
  //         first_name: profileData?.["first_name"] || 'Иван',
  //         second_name: profileData?.["second_name"] || 'Иванов',
  //         display_name: profileData?.["display_name"] || 'ivan95',
  //         login: profileData?.["login"] || 'ivanivanov',
  //         email: profileData?.["email"] || 'ivanivanov@yandex.ru',
  //         phone: profileData?.["phone"] || '+7 (800) 555-35-35',
  //         avatar: ''
  //       };

  //     case '/user/password':
  //       console.log('🔒 Changing password:', data);
  //       return {};

  //     case '/user/profile/avatar':
  //       console.log('🖼️ Updating avatar:', data instanceof FormData ? 'FormData received' : data);
  //       return {
  //         id: 1,
  //         first_name: 'Иван',
  //         second_name: 'Иванов',
  //         display_name: 'ivan95',
  //         login: 'ivanivanov',
  //         email: 'ivanivanov@yandex.ru',
  //         phone: '+7 (800) 555-35-35',
  //         avatar: 'https://example.com/avatar.jpg'
  //       };

  //     case '/auth/logout':
  //       console.log('👋 Logout');
  //       return {};

  //     default:
  //       console.log(`❓ Unknown endpoint: ${url}`, data);
  //       return {};
  //   }
  // }

  get<T = unknown>(
    url: string,
    params?: Record<string, string | number | boolean>,
    options?: Omit<HTTPRequestOptions, 'method' | 'data' | 'params'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.GET,
      params
    });
  }

  post<T = unknown>(
    url: string,
    data?: HTTPRequestData,
    options?: Omit<HTTPRequestOptions, 'method' | 'data'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.POST,
      data
    });
  }

  put<T = unknown>(
    url: string,
    data?: HTTPRequestData,
    options?: Omit<HTTPRequestOptions, 'method' | 'data'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.PUT,
      data
    });
  }

  delete<T = unknown>(
    url: string,
    options?: { data?: Record<string, unknown> } & Omit<HTTPRequestOptions, 'method' | 'data'>
  ): Promise<HTTPResponse<T>> {
    // const { data, ...rest } = options || {};
    return this.request<T>(url, {
      // ...rest,
      ...options,
      method: HTTPMethod.DELETE,
      // data
    });
  }

  patch<T = unknown>(
    url: string,
    data?: HTTPRequestData,
    options?: Omit<HTTPRequestOptions, 'method' | 'data'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.PATCH,
      data
    });
  }
}

export const apiClient = new HTTPClient('https://ya-praktikum.tech/api/v2');
