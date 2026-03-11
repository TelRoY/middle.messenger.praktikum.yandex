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

describe('Router', () => {
  let router: Router;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
      url: 'http://localhost'
    });
    global.window = dom.window as any;
    global.document = dom.window.document;
        
    router = new Router('#app');
  });

  afterEach(() => {
    document.body.innerHTML = '';
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

      router.go('/sign-up');
      expect(global.window.location.pathname).to.equal('/sign-up');
    });
  });

  describe('Route', () => {
    let route: Route;

    beforeEach(() => {
      route = new Route('/messenger', MessengerPage, { rootQuery: '#app' });
    });

    describe('match', () => {

      it('should return true for correct pathname', () => {
        const result = route.match('/messenger');
        expect(result).to.equal(true);
      });

      it('should return false for uncorrect pathname', () => {
        const result = route.match('/');
        expect(result).to.equal(false);
      });
    })

    describe('render', () => {

      beforeEach(() => {
        const root = document.createElement('div');
        root.id = 'app';
        document.body.appendChild(root);
      });

      afterEach(() => {
        document.body.innerHTML = '';
      })

      it('should create block and put it in DOM', () => {
        route.render();

        const root = document.querySelector('#app');
        expect(root?.children.length).to.equal(1);
      });

      it('should NOT create new block when called again', () => {
        let count = 0;
        class CountBlock extends MockPage {
          constructor() {
            super();
            count++;
          }
        }

        const testRoute = new Route('/test', CountBlock, {
          rootQuery: '#app'
        });

        testRoute.render();
        testRoute.render();

        expect(count).to.equal(1);
      });
    })
  });
})
