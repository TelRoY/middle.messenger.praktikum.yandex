import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './CreateChatForm.hbs';

export interface CreateChatFormProps extends Props {
  id?: string;
  onSubmit?: (title: string, userLogin?: string) => void;
  onCancel?: () => void;
}

export class CreateChatForm extends Block {
  constructor(props: CreateChatFormProps) {
    super('div', {
      ...props,
      events: {
        submit: (e: Event) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const title = formData.get('title') as string;
          const login = formData.get('login') as string;
          
          if (props.onSubmit) {
            props.onSubmit(title, login || undefined);
          }
        },
        click: (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-action="cancel"]')) {
            e.preventDefault();
            if (props.onCancel) {
              props.onCancel();
            }
          }
        }
      }
    });
  }

  public override render(): string {
    const template = compile(templateSource);
    return template({
      id: this.props['id'] || 'create-chat-form'
    });
  }

  public reset(): void {
    const content = this.getContent();
    const form = content.querySelector('form') as HTMLFormElement;
    if (form) {
      form.reset();
    }
  }
}
