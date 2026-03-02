import { Block, Props } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './RegistrationForm.hbs';

export class RegistrationForm extends Block {
  constructor(props: Props) {
    const events = {
      submit: (e: Event) => {
        e.preventDefault();
        if (props['onSubmit']) {
          (props['onSubmit'] as (e: Event) => void)(e);
        }
      }
    };

    const { children, ...restProps } = props;

    super('form', {
      ...restProps,
      children,
      events
    });
  }

  get formData(): FormData {
    const content = this.getContent();
    return new FormData(content as HTMLFormElement);
  }

  get formValues(): Record<string, string> {
    const formData = this.formData;
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    return data;
  }  

  reset(): void {
    const content = this.getContent();
    (content as HTMLFormElement).reset();
  }

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();
    
    const context: Record<string, string> = {
      id: this.props['id'] as string || 'registration-form',
      className: this.props['className'] as string || 'registration-form'
    };
    
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });
    const result = template(context);
  
    return result;
  }
}
