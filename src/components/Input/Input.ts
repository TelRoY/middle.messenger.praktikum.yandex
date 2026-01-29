import { Block } from '../../core/Block';

interface InputProps {
  id: string;
  label: string;
  placeholder?: string;
  value?: string;
  type?: string;
  required?: boolean;
  events?: {
    input?: (e: Event) => void;
    blur?: (e: Event) => void;
  };
}

export class Input extends Block<InputProps> {
  constructor(props: InputProps) {
    super({
      type: 'text',
      required: false,
      ...props
    });
  }

  protected addEventListeners(): void {
    const input = this.getContent().querySelector('input');
    if (input && this.props.events) {
      if (this.props.events.input) {
        input.addEventListener('input', this.props.events.input);
      }
      if (this.props.events.blur) {
        input.addEventListener('blur', this.props.events.blur);
      }
    }
  }

  public getValue(): string {
    const input = this.getContent().querySelector('input') as HTMLInputElement;
    return input?.value || '';
  }

  protected template(): string {
    const { id, label, placeholder, value, type, required } = this.props;
    
    return `
      <div class="form-group">
        <label for="${id}">${label}</label>
        <input
          type="${type}"
          id="${id}"
          name="${id}"
          class="form-input"
          ${placeholder ? `placeholder="${placeholder}"` : ''}
          ${value ? `value="${value}"` : ''}
          ${required ? 'required' : ''}
        />
      </div>
    `;
  }
}
