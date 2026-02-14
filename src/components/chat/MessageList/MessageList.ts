import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './MessageList.hbs';

export interface MessageListProps extends Props {
  messages: Block[];
}

export class MessageList extends Block {
  constructor(props: Props) {
    super('div', {
      ...props,
      messages: props['messages']
    });
  }

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();
    
    const context: Record<string, any> = {
      messages: []
    };
    
    if (children['messages'] && Array.isArray(children['messages'])) {
      context['messages'] = children['messages'].map((_, index) => `<div data-id="messages[${index}]"></div>`);
    }
    
    return template(context);
  }

  scrollToBottom(): void {
    const content = this.getContent();
    const container = content.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
