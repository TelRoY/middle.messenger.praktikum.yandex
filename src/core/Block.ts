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

  public _element: HTMLElement | null = null;
  private _meta: {
    tagName: string;
    props: Props;
  };
  protected props: Props;
  private eventBus: () => EventBus;
  protected children: Record<string, Block> = {};

  constructor(tagName: string = 'div', propsAndChildren: Props = {}) {
    const { children, props } = this._extractChildren(propsAndChildren);
    const eventBus = new EventBus();
    
    this._meta = {
      tagName,
      props: props || {}
    };

    this.props = this._makePropsProxy(props || {});
    this.children = children || {};
    this.eventBus = () => eventBus;

    this._registerEvents(eventBus);
    eventBus.emit(Block.EVENTS.INIT);
  }

  private _extractChildren(propsAndChildren: Props): { children: Record<string, Block>, props: Props } {
  const children: Record<string, Block> = {};
  const props: Props = {};

  console.log('Block._extractChildren input keys:', Object.keys(propsAndChildren));

  if (propsAndChildren['children'] && typeof propsAndChildren['children'] === 'object') {
    const childrenObj = propsAndChildren['children'] as Record<string, any>;
    Object.entries(childrenObj).forEach(([key, value]) => {
      if (value instanceof Block) {
        children[key] = value;
      }
    });
    delete propsAndChildren['children'];
  }

  Object.entries(propsAndChildren).forEach(([key, value]) => {
    if (value instanceof Block) {
      children[key] = value;
    } else if (key !== 'children') { 
      props[key] = value;
    }
  });

  return { children, props };
}

  public getChildren(): Record<string, Block> {
    return this.children;
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
    Object.values(this.children).forEach(child => {
      child.dispatchComponentDidMount();
    });
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

      this._replacePlaceholders();

      this._addEvents();
    }
  }

  public _replacePlaceholders(): void {
    if (!this._element) {
      return;
    }
    const element = this._element;
    Object.entries(this.children).forEach(([key, child]) => {
      const placeholder = element.querySelector(`[data-id="${key}"]`);
      if (placeholder) {
        placeholder.replaceWith(child.getContent());
      } else {
        const allPlaceholders = element.querySelectorAll('[data-id]');
        Array.from(allPlaceholders).map(el => el.getAttribute('data-id'));
      }
    });
  }
  
  protected render(): string {
    return '';
  }

  public getContent(): HTMLElement {
    if (!this._element) {
      throw new Error('Элемент не создан');
    }
    return this._element;
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
    return document.createElement(tagName);
  }

  public show(): void {
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }
    Object.values(this.children).forEach(child => {
      child.show();
    });
  } 

  public hide(): void {
    const content = this.getContent();
    if (content) {
    content.style.display = 'none';
    }
    Object.values(this.children).forEach(child => {
      child.hide();
    });
  }

  public _addEvents() {
    const { events = {} } = this.props;
    Object.keys(events).forEach(eventName => {
      if (events[eventName] !== undefined) {
        this.element?.addEventListener(eventName, events[eventName]);
      }
    });
  }


  public _removeEvents() {
    const { events = {} } = this.props;
    Object.keys(events).forEach(eventName => {
      if (events[eventName] !== undefined) {
        this._element?.removeEventListener(eventName, events[eventName]);
      }
    });
  }
}
