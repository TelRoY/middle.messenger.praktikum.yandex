/// <reference types="mocha" />
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { Block } from './Block';
import { Router, Route } from './Router';

class MockPage extends Block {
  constructor(text: string = 'Mock Page') {
    super('div', { text });
  }

  override render(): string {
    return `<div>${this.props['text']}</div>`;
  }
}

class AuthorizationPage extends MockPage {
  constructor() {
    super('Authorization Page');
  }
}

class RegistrationPage extends MockPage {
  constructor() {
    super('Registration Page');
  }
}

class MessengerPage extends MockPage {
  constructor() {
    super('Messenger Page');
  }
}

class Error404Page extends MockPage {
  constructor() {
    super('404 Not Found');
  }
}

describe('Router', () => {
  let router: Router;
  let root: HTMLDivElement;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
      url: 'http://localhost'
    });
    global.window = dom.window as any;
    global.document = dom.window.document;
    
    root = document.querySelector('#app') as HTMLDivElement;
    
    router = new Router('#app');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    (Router as any).__instance = null;
  });

  describe('use()', () => {
    it('should register routes', () => {
      router.use('/', AuthorizationPage).use('/sign-up', RegistrationPage);
    
      expect(router['routes']).to.have.lengthOf(2);
      expect(router.getRoute('/')).to.not.equal(undefined);
      expect(router.getRoute('/sign-up')).to.not.equal(undefined);
    });
  });

  describe('go()', () => {
    it('should change window location', () => {
      router.use('/', AuthorizationPage);
      router.start();
      router.go('/');
      
      expect(global.window.location.pathname).to.equal('/');
    });

    it('should redirect to 404 for unknown routes', (done) => {
      router.use('/404', Error404Page);
      router.start();
      
      router.go('/unknown-route');
      setTimeout(() => {
        const content = root.querySelector('div')?.textContent;
        expect(content).to.include('404 Not Found');
        done();
      }, 50);
    });
  });

  describe('back() and forward()', () => {
    it('should navigate back in history', async () => {
      router.use('/', AuthorizationPage).use('/sign-up', RegistrationPage);
      router.start();
      
      router.go('/sign-up');
      setTimeout(() => {
        expect(global.window.location.pathname).to.equal('/sign-up');
        
        router.back();
        setTimeout(() => {
          expect(global.window.location.pathname).to.equal('/');
        }, 100);
      }, 50);
    });
  });

  describe('Route class', () => {
    it('should match correct pathname', () => {
      const route = new Route('/test', MessengerPage, { rootQuery: '#app' });
      
      expect(route.match('/test')).to.equal(true);
      expect(route.match('/other')).to.be.equal(false);
    });

    it('should render block on navigate', () => {
      const route = new Route('/test', MessengerPage, { rootQuery: '#app' });
      
      route.navigate('/test');
      setTimeout(() => {
        const content = root.querySelector('div')?.textContent;
        expect(content).to.include('Messenger Page');
      }, 50);
    });
  });
});
