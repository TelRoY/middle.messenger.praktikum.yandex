import { Block, Props } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './Modal.hbs';

export interface ModalProps extends Props {
  id: string;
  title: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export class Modal extends Block {
  constructor(props: ModalProps) {
    super('div', {
      ...props,
      events: {
        click: (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('modal__overlay') || 
              target.classList.contains('modal__close') ||
              target.closest('[data-action="close"]')) {
            if (props.onClose) {
              props.onClose();
            }
          }
        }
      }
    });
  }

  public open(): void {
    document.body.style.overflow = 'hidden';
    this.setProps({ isOpen: true });
    const content = this.getContent();
    if (content) {
        content.classList.add('modal--open');
    }
  }

  public close(): void {
    document.body.style.overflow = '';
    this.setProps({ isOpen: false });
  }

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();
    const context: Record<string, any> = {
      id: this.props['id'],
      title: this.props['title'],
      isOpen: this.props['isOpen'] || false
    };
    
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });

    return template(context);
  }
}
