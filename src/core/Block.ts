import { EventBus } from './EventBus';

export type Props = Record<string, any>;

export class Block {
  private eventBus: EventBus;
  protected props: Props;
  private element: HTMLElement | null = null;

  constructor(props: Props = {}) {
    this.eventBus = new EventBus();
    this.props = this.makePropsProxy(props);
    
    this.registerEvents();
    this.eventBus.emit('init');
  }

  private registerEvents(): void {
    this.eventBus.on('init', this.init.bind(this));
    this.eventBus.on('render', this.render.bind(this));
  }

  private init(): void {
    this.eventBus.emit('render');
  }

  private makePropsProxy(props: Props): Props {
    const self = this;

    return new Proxy(props, {
      get(target: Props, prop: string) {
        const value = target[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target: Props, prop: string, value: unknown) {
        const oldTarget = { ...target };
        target[prop] = value;
        self.eventBus.emit('render');
        return true;
      },
      deleteProperty() {
        throw new Error('Нет доступа');
      }
    });
  }

  private render(): void {
    const newElement = this.compile();
    
    if (this.element && newElement) {
      this.element.replaceWith(newElement);
    }
    
    this.element = newElement;
    this.addEventListeners();
  }

  protected compile(): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = this.template();
    return div.firstElementChild as HTMLElement;
  }

  protected addEventListeners(): void {
    // Переопределяется в дочерних классах
  }

  protected template(): string {
    return '';
  }

  public getContent(): HTMLElement {
    if (!this.element) {
      throw new Error('Элемент не создан');
    }
    return this.element;
  }
}