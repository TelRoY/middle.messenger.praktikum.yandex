import { EventBus } from './EventBus';

export type Props = Record<string, unknown> & {
  events?: Record<string, EventListener>;
};

export abstract class Block {
  static EVENTS = {
    INIT: 'init',
    FLOW_CDM: 'flow:component-did-mount',
    FLOW_CDU: 'flow:component-did-update',
    FLOW_RENDER: 'flow:render'
  };

  private _element: HTMLElement | null = null;
  private _meta: {
    tagName: string;
    props: Props;
  };
  protected props: Props;
  private eventBus: () => EventBus;
  private _events: Map<string, EventListener> = new Map();

  constructor(tagName: string = 'div', props: Props = {}) {
    const eventBus = new EventBus();
    
    this._meta = {
      tagName,
      props
    };

    this.props = this._makePropsProxy(props);
    this.eventBus = () => eventBus;

    this._registerEvents(eventBus);
    eventBus.emit(Block.EVENTS.INIT);
  }

  private _registerEvents(eventBus: EventBus): void {
    eventBus.on(Block.EVENTS.INIT, this.init.bind(this));
    eventBus.on(Block.EVENTS.FLOW_CDM, this._componentDidMount.bind(this));
    eventBus.on(Block.EVENTS.FLOW_CDU, this._componentDidUpdate.bind(this));
    eventBus.on(Block.EVENTS.FLOW_RENDER, this._render.bind(this));
  }

  private _createResources(): void {
    const { tagName } = this._meta;
    this._element = this._createDocumentElement(tagName);
  }

  private init(): void {
    this._createResources();
    this.eventBus().emit(Block.EVENTS.FLOW_RENDER);
  }

  private _componentDidMount(): void {
    this.componentDidMount();
  }

  protected componentDidMount(): void {
  }

  public dispatchComponentDidMount(): void {
    this.eventBus().emit(Block.EVENTS.FLOW_CDM);
  }

  private _componentDidUpdate(oldProps: Props, newProps: Props): void {
    const response = this.componentDidUpdate(oldProps, newProps);
    if (!response) {
      return
    }
    this._render();
  }

  protected componentDidUpdate(oldProps: Props, newProps: Props): boolean {
    return JSON.stringify(oldProps) !== JSON.stringify(newProps);
  }

  public setProps = (nextProps: Props): void => {
    if (!nextProps) {
      return;
    }

    Object.assign(this.props, nextProps);
  };

  get element(): HTMLElement | null {
    return this._element;
  }

  private _render(): void {
    const block = this.render();
    
    if (this._element) {
      this._removeEvents();
      this._element.innerHTML = block;
      this._addEventListeners();
    }
  }
  
  protected render(): string {
    return '';
  }

  private getContent() {
    return this.element;
  }

  private _makePropsProxy(props: Props): Props {
    return new Proxy(props, {
      get: (target: Props, prop: string) => {
        const value = target[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set: (target: Props, prop: string, value: unknown) => {
        const oldTarget = { ...target };
        target[prop] = value;
        this.eventBus().emit(Block.EVENTS.FLOW_CDU, oldTarget, target);
        return true;
      },
      deleteProperty: () => {
        throw new Error('Нет доступа');
      }
    });
  }

  private _createDocumentElement(tagName: string): HTMLElement {
    // Можно сделать метод, который через фрагменты в цикле создаёт сразу несколько блоков
    return document.createElement(tagName);
  }

  public show(): void {
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }
  } 

  public hide(): void {
    const content = this.getContent();
    if (content) {
    content.style.display = 'none';
    }
  }

  private _addEventListeners(): void {
    const { events = {} } = this.props;
    Object.keys(events).forEach(eventName => {
      const handler = events[eventName];
      if (this._element && typeof handler === 'function') {
        this._element.addEventListener(eventName, handler);
        this._events.set(eventName, handler);
      }
    });
  }

  private _removeEvents(): void {
    if (!this._element) return;
    this._events.forEach((handler, eventName) => {
      this._element?.removeEventListener(eventName, handler);
    });
    this._events.clear();
  }
}
