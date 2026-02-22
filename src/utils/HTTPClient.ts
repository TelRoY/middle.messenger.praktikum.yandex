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
  }

  async request<T = unknown>(
    url: string,
    options: HTTPRequestOptions = {}
  ): Promise<HTTPResponse<T>> {
    const { method = HTTPMethod.GET, data, headers = {}, timeout = 5000, params } = options;
    let fullUrl = `${this.baseURL}${url}`;
    if (params) {
      fullUrl += `?${queryStringify(params)}`;
    }
    
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
          
          if (error.name === 'AbortError') {
            reject(new Error(`Request timeout after ${timeout}ms`));
          } else {
            reject(error);
          }
        });
    });
  }

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
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.DELETE,
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
