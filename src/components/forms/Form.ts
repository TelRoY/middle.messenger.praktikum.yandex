import { Block, Props } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './Form.hbs';

export class Form extends Block {
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
    // Передаем все props в базовый класс
    super('form', {
      ...restProps,
      children,
      // ...props,
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
      id: this.props['id'] as string || '',
      className: this.props['className'] as string || ''
    };
    
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });
    
    return template(context);
  }
}
