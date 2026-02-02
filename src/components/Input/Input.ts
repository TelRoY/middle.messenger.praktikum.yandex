import { Block, Props } from '../../core/Block';

interface InputProps extends Props {
  id: string;
  label: string;
  placeholder?: string;
  value?: string;
  type?: string;
  required?: boolean;
  events?: {
    input?: (e: Event) => void;
    blur?: (e: Event) => void;
    focus?: (e: Event) => void;
    change?: (e: Event) => void;
  };
}

export class Input extends Block {

  constructor(props: InputProps) {
    const { events: propsEvents = {}, ...restProps } = props;
    const events: Record<string, EventListener> = {};

    if (propsEvents.input) {
      events['input'] = (e: Event) => this.handleInput(e, propsEvents.input!);
    }
    if (propsEvents.blur) {
      events['blur'] = (e: Event) => this.handleBlur(e, propsEvents.blur!);
    }
    if (propsEvents.focus) {
      events['focus'] = (e: Event) => this.handleFocus(e, propsEvents.focus!);
    }
    if (propsEvents.change) {
      events['change'] = (e: Event) => this.handleChange(e, propsEvents.change!);
    }

    super('div', {
      ...restProps,
      events
    });
  }

  public getValue(): string {
    const element = this.element;
    if (!element) {
      return '';
    }
    const input = element.querySelector('input') as HTMLInputElement;
    return input?.value || '';
  }

  public setValue(value: string): void {
    const element = this.element;
    if (!element) {
      return;
    }
    const input = element.querySelector('input') as HTMLInputElement;
    if (input) {
      input.value = value;
    }
  }

  protected override render(): string {
    const { id, label, placeholder, value, type, required } = this.props as InputProps;
    
    return `
      <div class="form-group">
        <label for="${id}" class="form-label">${label}</label>
        <input
          type="${type || 'text'}"
          id="${id}"
          name="${id}"
          class="form-input"
          ${placeholder ? `placeholder="${placeholder}"` : ''}
          ${value !== undefined ? `value="${value}"` : ''}
          ${required ? 'required' : ''}
        />
      </div>
    `;
  }

  private handleInput(event: Event, externalHandler?: (e: Event) => void): void {
    console.log('Input changed:', (event.target as HTMLInputElement).value);
    if (externalHandler) {
      externalHandler(event);
    }
  }

  private handleBlur(event: Event, externalHandler?: (e: Event) => void): void {
    console.log('Input blurred');
    if (externalHandler) {
      externalHandler(event);
    }
  }

  private handleFocus(event: Event, externalHandler?: (e: Event) => void): void {
    console.log('Input focused');
    if (externalHandler) {
      externalHandler(event);
    }
  }

  private handleChange(event: Event, externalHandler?: (e: Event) => void): void {
    console.log('Input changed (change event)');
    if (externalHandler) {
      externalHandler(event);
    }
  }
}
