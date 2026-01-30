import { Block } from '../../core/Block';

interface ButtonProps {
  text: string;
  onClick?: () => void;
}

export class Button extends Block<ButtonProps> {
  constructor(props: ButtonProps) {
    super('button', {
      ...props,
      events: {
        click: props.onClick || (() => {})
      }
    });
  }

  protected render(): string {
    return `<div>${this.props.text}</div>`;
  }
}

