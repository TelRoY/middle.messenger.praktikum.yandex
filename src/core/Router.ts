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
    }
  }

  match(pathname: string): boolean {
    return isEqual(pathname, this._pathname);
  }

  render(): void {
    if (!this._block) {
      this._block = new this._blockClass();
      this.renderBlock();
      return;
    }

    this._block.show();
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
  private history = window.history;
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

  private _onRoute(pathname: string): void {
    if (this._isNavigating) {
      return;
    }

    this._isNavigating = true;

    try {
      // Удаляем .html из пути если есть
      const cleanPathname = pathname.replace('.html', '');
    
      const route = this.getRoute(cleanPathname);
      if (!route) {
        // Если маршрут не найден, показываем 404
        this.go('/404.html');
        return;
      }

      if (this._currentRoute && this._currentRoute !== route) {
        this._currentRoute.leave();
      }

      this._currentRoute = route;
      route.render();
    } finally {
      setTimeout(() => {
        this._isNavigating = false;
      }, 50);
    }
  }

  go(pathname: string): void {
    this.history.pushState({}, '', pathname);
    this._onRoute(pathname);
  }

  back(): void {
    this.history.back();
  }

  forward(): void {
    this.history.forward();
  }

  getRoute(pathname: string): Route | undefined {
    const cleanPathname = pathname.replace('.html', '');
    return this.routes.find(route => route.match(cleanPathname));
  }
}
