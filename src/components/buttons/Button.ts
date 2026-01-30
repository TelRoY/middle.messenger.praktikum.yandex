import { Block } from '../../core/Block';

interface ButtonProps {
  text: string;
  // type?: 'button' | 'submit' | 'reset';
  // href?: string;
  // variant?: string;
  // className?: string;
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

  // protected addEventListeners(): void {
  //   const button = this.getContent().querySelector('button');
  //   if (button && this.props.onClick) {
  //     button.addEventListener('click', this.props.onClick);
  //   }
  // }

  // protected template(): string {
  //   const { text, type, variant, className = '' } = this.props;
    
  //   return `
  //     <button 
  //       type="${type}" 
  //       class="button button-${variant} ${className}"
  //     >
  //       ${text}
  //     </button>
  //   `;
  // }
// }
