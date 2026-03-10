/// <reference types="mocha" />
import { expect } from 'chai';
import { HTTPClient, HTTPMethod } from './HTTPClient';

describe('HTTPClient', () => {
  let client: HTTPClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new HTTPClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('constructor', () => {
    it('should create instance with default base URL', () => {
      const client = new HTTPClient();
      expect(client).to.be.instanceOf(HTTPClient);
    });

    it('should create instance with custom base URL', () => {
      const customUrl = 'https://custom-api.com';
      const client = new HTTPClient(customUrl);
      expect(client).to.be.instanceOf(HTTPClient);
    });
  });

  describe('queryStringify', () => {
    it('should handle GET requests with params', async () => {
      let calledUrl = '';
      
      global.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        calledUrl = input.toString();
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      const client = new HTTPClient('https://api.com');
      await client.get('/users', { page: 1, limit: 10 });

      expect(calledUrl).to.include('page=1');
      expect(calledUrl).to.include('limit=10');
    });
  });

  describe('HTTP methods', () => {
    it('should make GET request', async () => {
      let calledMethod = '';
      
      global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        calledMethod = init?.method || 'GET';
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      await client.get('/users');
      expect(calledMethod).to.equal(HTTPMethod.GET);
    });

    it('should make POST request', async () => {
      let calledMethod = '';
      
      global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        calledMethod = init?.method || 'GET';
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      await client.post('/users', { name: 'John' });
      expect(calledMethod).to.equal(HTTPMethod.POST);
    });

    it('should make PUT request', async () => {
      let calledMethod = '';
      
      global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        calledMethod = init?.method || 'GET';
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      await client.put('/users/1', { name: 'John' });
      expect(calledMethod).to.equal(HTTPMethod.PUT);
    });

    it('should make DELETE request', async () => {
      let calledMethod = '';
      
      global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        calledMethod = init?.method || 'GET';
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      await client.delete('/users/1');
      expect(calledMethod).to.equal(HTTPMethod.DELETE);
    });
  });

  describe('request headers', () => {
    it('should set Content-Type to application/json for JSON data', async () => {
      let contentType = '';
      
      global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>;
        contentType = headers?.['Content-Type'] || '';
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      await client.post('/users', { name: 'John' });
      expect(contentType).to.equal('application/json');
    });

    it('should not set Content-Type for FormData', async () => {
      let contentType: string | undefined = '';
      const formData = new FormData();
      
      global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>;
        contentType = headers?.['Content-Type'];
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      await client.post('/users', formData);
      expect(contentType).to.be.undefined;
    });

    it('should include custom headers', async () => {
      let headers: Record<string, string> = {};
      
      global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        headers = (init?.headers as Record<string, string>) || {};
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      await client.get('/users', undefined, {
        headers: { 'X-Custom-Header': 'test' }
      });

      expect(headers['X-Custom-Header']).to.equal('test');
    });
  });

  describe('response handling', () => {
    it('should return successful response with data', async () => {
      const responseData = { id: 1, name: 'John' };
      
      global.fetch = ((_input: RequestInfo | URL) => {
        return Promise.resolve(new Response(JSON.stringify(responseData), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      const response = await client.get('/users/1');
      
      expect(response.ok).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.statusText).to.equal('OK');
      expect(response.data).to.deep.equal(responseData);
    });

    it('should return error response', async () => {
      global.fetch = ((_input: RequestInfo | URL) => {
        return Promise.resolve(new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      const response = await client.get('/users/999');
      
      expect(response.ok).to.be.false;
      expect(response.status).to.equal(404);
      expect(response.statusText).to.equal('Not Found');
    });

    it('should handle text response', async () => {
      const textData = 'Plain text response';
      
      global.fetch = ((_input: RequestInfo | URL) => {
        return Promise.resolve(new Response(textData, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        }));
      }) as typeof global.fetch;

      const response = await client.get('/text');
      
      expect(response.data).to.equal(textData);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      global.fetch = ((_input: RequestInfo | URL) => {
        return Promise.reject(new Error('Network error'));
      }) as typeof global.fetch;

      try {
        await client.get('/users');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.equal('Network error');
      }
    });

    it('should handle timeout', async () => {
      global.fetch = ((_input: RequestInfo | URL) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(new Response(JSON.stringify({}), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }, 100);
        });
      }) as typeof global.fetch;

      try {
        await client.request('/slow', { timeout: 10 });
        expect.fail('Should have thrown timeout error');
      } catch (error: any) {
        expect(error.message).to.include('timeout');
      }
    });
  });

  describe('base URL', () => {
    it('should prepend base URL to requests', async () => {
      let fullUrl = '';
      
      global.fetch = ((input: RequestInfo | URL, _init?: RequestInit) => {
        fullUrl = input.toString();
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      const customClient = new HTTPClient('https://api.example.com/v1');
      await customClient.get('/users');

      expect(fullUrl).to.equal('https://api.example.com/v1/users');
    });
  });

  describe('credentials', () => {
    it('should include credentials by default', async () => {
      let credentials = '';
      
      global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        credentials = init?.credentials || '';
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }) as typeof global.fetch;

      await client.get('/users');
      expect(credentials).to.equal('include');
    });
  });
});
