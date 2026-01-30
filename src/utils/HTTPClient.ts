export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export interface HTTPRequestOptions {
  method?: HTTPMethod;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  params?: Record<string, string | number | boolean>;
}

export interface HTTPResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

export class HTTPClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(baseURL: string = '', options: {
    headers?: Record<string, string>;
    timeout?: number;
  } = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    this.defaultTimeout = options.timeout || 5000;
  }

  request<T = any>(
    url: string,
    options: HTTPRequestOptions = {}
  ): Promise<HTTPResponse<T>> {
    return new Promise((resolve, reject) => {
      const {
        method = HTTPMethod.GET,
        headers = {},
        data,
        params = {},
        timeout = this.defaultTimeout,
        withCredentials = true
      } = options;

      let fullUrl = this.baseURL + url;
      
      if (method === HTTPMethod.GET && Object.keys(params).length > 0) {
        const queryString = this.buildQueryString(params);
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
      }

      const xhr = new XMLHttpRequest();
      xhr.open(method, fullUrl, true);
      xhr.timeout = timeout;

      const requestHeaders = { ...this.defaultHeaders, ...headers };
      Object.entries(requestHeaders).forEach(([key, value]) => {
        if (value) {
          xhr.setRequestHeader(key, value);
        }
      });

      xhr.withCredentials = withCredentials;

      xhr.onload = () => {
        const responseHeaders: Record<string, string> = {};
        const headersString = xhr.getAllResponseHeaders();
        const headersArray = headersString.trim().split(/[\r\n]+/);
        
        headersArray.forEach(line => {
          const parts = line.split(': ');
          const header = parts.shift();
          const value = parts.join(': ');
          if (header) {
            responseHeaders[header.toLowerCase()] = value;
          }
        });

        let responseData: any;
        try {
          const contentType = xhr.getResponseHeader('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            responseData = JSON.parse(xhr.responseText);
          } else if (contentType && (
            contentType.includes('text/') || 
            contentType.includes('application/xml')
          )) {
            responseData = xhr.responseText;
          } else {
            responseData = xhr.response;
          }
        } catch {
          responseData = xhr.responseText;
        }

        const response: HTTPResponse<T> = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          data: responseData as T,
          headers: responseHeaders
        };

        resolve(response);
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred'));
      };

      xhr.ontimeout = () => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      };

      xhr.onabort = () => {
        reject(new Error('Request was aborted'));
      };

      try {
        if (data && method !== HTTPMethod.GET && method !== HTTPMethod.DELETE) {
          if (data instanceof FormData) {
            xhr.setRequestHeader('Content-Type', '');
            xhr.send(data);
          } else if (typeof data === 'string') {
            xhr.send(data);
          } else {
            xhr.send(JSON.stringify(data));
          }
        } else {
          xhr.send();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildQueryString(params: Record<string, string | number | boolean>): string {
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(String(value));
        return `${encodedKey}=${encodedValue}`;
      })
      .join('&');
  }

  get<T = any>(
    url: string,
    params?: Record<string, string | number | boolean>,
    options?: Omit<HTTPRequestOptions, 'method' | 'data' | 'params'>
  ): Promise<HTTPResponse<T>> {
    const requestOptions: HTTPRequestOptions = {
      ...options,
      method: HTTPMethod.GET
    };
    
    if (params) {
      requestOptions.params = params;
    }
    
    return this.request<T>(url, requestOptions);
  }

  post<T = any>(
    url: string,
    data?: any,
    options?: Omit<HTTPRequestOptions, 'method' | 'data'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.POST,
      data
    });
  }

  put<T = any>(
    url: string,
    data?: any,
    options?: Omit<HTTPRequestOptions, 'method' | 'data'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.PUT,
      data
    });
  }

  delete<T = any>(
    url: string,
    options?: Omit<HTTPRequestOptions, 'method' | 'data'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.DELETE
    });
  }

  patch<T = any>(
    url: string,
    data?: any,
    options?: Omit<HTTPRequestOptions, 'method' | 'data'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: HTTPMethod.PATCH,
      data
    });
  }

  uploadFile<T = any>(
    url: string,
    file: File,
    fieldName: string = 'file',
    additionalData: Record<string, any> = {}
  ): Promise<HTTPResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return this.request<T>(url, {
      method: HTTPMethod.POST,
      headers: {},
      data: formData
    });
  }

  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }
}

export const apiClient = new HTTPClient('https://api.your-messenger.com', {
  headers: {
    'Accept': 'application/json',
  },
  timeout: 10000
});
