import { Block } from './Block';

function isEqual(lhs: string, rhs: string): boolean {
  return lhs === rhs;
}

export class Route {
  private _pathname: string;
  private _blockClass: new (...args: undefined[]) => Block;
  private _block: Block | null;
  private _props: Record<string, unknown>;

  constructor(pathname: string, view: new (...args: undefined[]) => Block, props: Record<string, unknown>) {
    this._pathname = pathname;
    this._blockClass = view;
    this._block = null;
    this._props = props;
  }

  navigate(pathname: string): void {
    if (this.match(pathname)) {
      this._pathname = pathname;
      this.render();
    }
  }

  leave(): void {
    if (this._block) {
      this._block.hide();
      this._block = null;
    }
  }

  match(pathname: string): boolean {
    return isEqual(pathname, this._pathname);
  }

  render(): void {
    if (!this._block) {
      this._block = new this._blockClass();
      this.renderBlock();
    } else {
      this._block.show();
    }
  }

  forceRender(): void {
    if (this._block) {
      this._block.hide();
    }
      this._block = new this._blockClass();
      this.renderBlock();
  }

  private renderBlock(): void {
    const root = document.querySelector(this._props['rootQuery'] as string);
    if (!root) {
      throw new Error(`Root not found: ${this._props['rootQuery']}`);
    }
    
    root.innerHTML = '';
    root.appendChild(this._block!.getContent());
    this._block!.dispatchComponentDidMount();
  }
}

export class Router {
  private static __instance: Router;
  private routes: Route[] = [];
  private _currentRoute: Route | null = null;
  private _rootQuery: string | undefined;
  private _isNavigating: boolean = false;

  constructor(rootQuery: string) {
    if (Router.__instance) {
      return Router.__instance;
    }

    this.routes = [];
    this._currentRoute = null;
    this._rootQuery = rootQuery;
    this._isNavigating = false;

    Router.__instance = this;
  }

  use(pathname: string, block: new (...args: any[]) => Block): Router {
    const route = new Route(pathname, block, { rootQuery: this._rootQuery });
    this.routes.push(route);
    return this;
  }

  start(): void {
    window.onpopstate = (event: PopStateEvent) => {
      const target = event.currentTarget as Window;
      this._onRoute(target.location.pathname);
    };

    this._onRoute(window.location.pathname);
  }

  go(pathname: string): void {
    console.log(`🔄 Router.go() to ${pathname}`);
    console.log(`📍 Current path: ${window.location.pathname}`);
    if (this._isNavigating) {
      console.log('⚠️ Already navigating, skipping');
      return;
    }

    this._isNavigating = true;
    console.log(`🔄 Router.go() to ${pathname}`);

    const cleanPathname = pathname.replace('.html', '');
    const currentPath = window.location.pathname.replace('.html', '');
    
    // Проверяем, не пытаемся ли перейти на ту же страницу
    if (currentPath === cleanPathname && this._currentRoute) {
      console.log('⚠️ Same route, forcing re-render');
      window.history.pushState({}, '', pathname);
      this._currentRoute.forceRender();
      setTimeout(() => {
        this._isNavigating = false;
      }, 300);
      return;
    }

    window.history.pushState({}, '', pathname);
    this._onRoute(pathname);

    setTimeout(() => {
      this._isNavigating = false;
    }, 50);
  }

  private _onRoute(pathname: string): void {
    console.log(`📍 Router._onRoute() for ${pathname}`);

    const cleanPathname = pathname.replace('.html', '');
    const route = this.getRoute(cleanPathname);

    if (!route) {
      console.log(`❌ No route for ${cleanPathname}`);
      this.go('/404.html');
      return;
    }

    try {
      if (this._currentRoute) {
        console.log('👋 Leaving current route');
        this._currentRoute.leave();
      }
  
      this._currentRoute = route;
      route.render();
    } catch (error) {
      console.error('❌ Error rendering route:', error);
      this.go('/500.html');
    }

    setTimeout(() => {
      this._isNavigating = false;
    }, 300);
  }

  back(): void {
    window.history.back();
  }

  forward(): void {
    window.history.forward();
  }

  getRoute(pathname: string): Route | undefined {
    return this.routes.find(route => route.match(pathname));
  }
}
