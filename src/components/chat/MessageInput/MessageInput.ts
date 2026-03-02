import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './MessageInput.hbs';

export interface MessageInputProps extends Props {
  placeholder?: string;
  value?: string;
  onSubmit?: (message: string) => void;
}

export class MessageInput extends Block {
  constructor(props: MessageInputProps) {
    super('div', {
      ...props,
      events: {
        submit: (e: Event) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const input = form.querySelector('input') as HTMLInputElement;
          if (input.value.trim() && props.onSubmit) {
            props.onSubmit(input.value.trim());
            input.value = '';
          }
        }
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

  clear(): void {
    const content = this.getContent();
    const input = content.querySelector('input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  public override render(): string {
    const template = compile(templateSource);
    return template({
      placeholder: this.props['placeholder'] || 'Введите сообщение...',
      value: this.props['value'] || ''
    });
  }
}
