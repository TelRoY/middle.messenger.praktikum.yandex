import { Block, Props } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './Input.hbs';

interface InputProps extends Props {
  type?: string;
  name: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  minlength?: number;
  maxlength?: number;
  pattern?: string;
  autocomplete?: string;
  className?: string;
  id?: string;
  onBlur?: (e: Event) => void;
  onFocus?: (e: Event) => void;
  onChange?: (e: Event) => void;
}

export class Input extends Block {
  constructor(props: InputProps) {
    super('div', {
      ...props,
      events: {
        blur: (e: Event) => props.onBlur && props.onBlur(e),
        focus: (e: Event) => props.onFocus && props.onFocus(e),
        input: (e: Event) => props.onChange && props.onChange(e)
      }
    });
  }

  get value(): string {
    const content = this.getContent();
    const input = content.querySelector('input') as HTMLInputElement;
    return input?.value || '';
  }

  set value(val: string) {
    const content = this.getContent();
    const input = content.querySelector('input') as HTMLInputElement;
    if (input) {
      input.value = val;
    }
  }

  public override render(): string {
    const template = compile(templateSource);
    return template({
      ...this.props,
      className: this.props['className'] || '',
      requiredAttr: this.props['required'] ? 'required' : '',
      minlengthAttr: this.props['minlength'] ? `minlength="${this.props['minlength']}"` : '',
      maxlengthAttr: this.props['maxlength'] ? `maxlength="${this.props['maxlength']}"` : ''
    });
  }
}
