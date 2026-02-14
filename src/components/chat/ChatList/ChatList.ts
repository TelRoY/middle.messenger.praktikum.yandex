import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './ChatList.hbs';

export class ChatList extends Block {
  constructor(props: Props) {
    super('div', {
      ...props
    });
  }

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();
    
    const context: Record<string, any> = {
      items: []
    };
    
    // Передаем детей как массив
    if (children['items'] && Array.isArray(children['items'])) {
      context['items'] = children['items'].map((_, index) => `<div data-id="items[${index}]"></div>`);
    }
    
    return template(context);
  }
}
