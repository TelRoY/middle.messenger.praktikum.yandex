export class Router {
    private static instance: Router;
    private routes: { [path: string]: () => Block } = {};
    private currentComponent: Block | null = null;
  
    constructor() {
      if (Router.instance) {
        return Router.instance;
      }
      
      Router.instance = this;
      this.init();
    }
  
    private init(): void {
      window.addEventListener('popstate', () => {
        this.onRouteChange();
      });
  
      // Обработка кликов по ссылкам
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        
        if (link && link.href) {
          e.preventDefault();
          const path = new URL(link.href).pathname;
          this.go(path);
        }
      });
  
      this.onRouteChange();
    }
  
    public use(path: string, component: () => Block): Router {
      this.routes[path] = component;
      return this;
    }
  
    public go(path: string): void {
      window.history.pushState({}, '', path);
      this.onRouteChange();
    }
  
    public back(): void {
      window.history.back();
    }
  
    public forward(): void {
      window.history.forward();
    }
  
    private onRouteChange(): void {
      const path = window.location.pathname;
      
      // Если это статическая страница (html), оставляем как есть
      if (path.endsWith('.html')) {
        return;
      }
  
      const route = this.routes[path];
      
      if (route) {
        if (this.currentComponent) {
          // Удаляем предыдущий компонент
          const app = document.getElementById('app');
          if (app && app.firstChild) {
            app.removeChild(app.firstChild);
          }
        }
  
        this.currentComponent = route();
        const app = document.getElementById('app');
        
        if (app) {
          app.appendChild(this.currentComponent.getContent());
        }
      }
    }
  }
  