import { Block, Props } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './RegistrationForm.hbs';

export class RegistrationForm extends Block {
  constructor(props: Props) {
    console.log('🔥 RegistrationForm constructor started');
    console.log('📦 RegistrationForm props keys:', Object.keys(props));
    console.log('👶 RegistrationForm children in props:', props['children'] ? Object.keys(props['children'] as Record<string, any>) : 'no children');
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
      // ...props,
      events
    });
    console.log('✅ RegistrationForm constructor finished');
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
    console.log('🎨 RegistrationForm render started');
    const template = compile(templateSource);
    const children = this.getChildren();
    console.log('📋 RegistrationForm children keys:', Object.keys(children));
    
    const context: Record<string, string> = {
      id: this.props['id'] as string || 'registration-form',
      className: this.props['className'] as string || 'registration-form'
    };
    
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });
    console.log('🔧 RegistrationForm context keys:', Object.keys(context));
    console.log('🔧 RegistrationForm context keys:', Object.keys(context));
    const result = template(context);
    console.log('📝 RegistrationForm template result length:', result.length);
    console.log('📝 RegistrationForm template result preview:', result.substring(0, 200) + '...');
    console.log('📝 RegistrationForm template result full:', result); // Добавляем полный вывод
  
    return result;
  }
}
