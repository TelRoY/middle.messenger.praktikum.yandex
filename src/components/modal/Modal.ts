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
    console.log('🔓 Opening modal:', this.props['id']);
    console.log('📦 Modal element before open:', this.getContent());
    document.body.style.overflow = 'hidden';
    this.setProps({ isOpen: true });
    const content = this.getContent();
    if (content) {
        content.classList.add('modal--open');
    }
    console.log('📦 Modal element after open:', this.getContent());
    console.log('📦 Modal in DOM:', document.getElementById(this.props['id'] as string));
  }

  public close(): void {
    console.log('🔒 Closing modal:', this.props['id']);
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
