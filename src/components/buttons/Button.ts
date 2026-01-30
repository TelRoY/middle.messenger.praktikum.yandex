import { Block } from '../../core/Block';

interface ButtonProps {
  text: string;
  onClick?: () => void;
}

export class Button extends Block {
  constructor(props: ButtonProps) {
    super('button', {
      ...props,
      events: {
        click: props.onClick || (() => {})
      }
    });
  }

  protected override render(): string {
    return `<div>${this.props['text']}</div>`;
  }
}
