import { Block, Props } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './Button.hbs';

interface ButtonProps extends Props {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  text: string;
  onClick?: (e: Event) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export class Button extends Block {
  constructor(props: ButtonProps) {
    super('div', {
      ...props,
      events: {
        click: (e: Event) => {
          if (props.onClick && !props.disabled) { 
            props.onClick(e);
          }
        }
      }
    });
  }

  protected override render(): string {
    const template = compile(templateSource);
    return template({
      ...this.props,
      className: this.props['className'] || '',
      disabled: this.props['disabled'] ? 'disabled' : ''
    });
  }
}
