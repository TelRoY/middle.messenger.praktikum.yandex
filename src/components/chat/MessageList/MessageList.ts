import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './MessageList.hbs';

export interface MessageListProps extends Props {
  messages?: Block[];
}

export class MessageList extends Block {
  private _messages: Block[] = [];

  constructor(props: MessageListProps = {}) {
    
    const safeProps = {
      ...props,
      messages: props.messages || []
    };
    super('div', safeProps);

    this._messages = props.messages || [];
  }

  public setMessages(messages: Block[]): void {
    this._messages = messages || [];
    this.setProps({ messages: this._messages });
    this.forceUpdate();
  }

  private forceUpdate(): void {
    const content = this.getContent();
    if (content) {
      content.innerHTML = this.render();
      this._replacePlaceholders();
      this._addEvents();
    }
  }

  public override render(): string {
    const messagesCount = this._messages?.length || 0;

    const template = compile(templateSource);
    
    const context: Record<string, any> = {
      messages: []
    };

    if (messagesCount > 0) {
      context['messages'] = this._messages.map((_, index) => {
        return `<div data-id="messages[${index}]"></div>`;
      });
    }

    return template(context);
  }

  public override _replacePlaceholders(): void {
    if (!this._element) return;

    const messagesCount = this._messages?.length || 0;
    
    if (messagesCount === 0) return;

    this._messages.forEach((message, index) => {
      const placeholder = this._element!.querySelector(`[data-id="messages[${index}]"]`);
      if (placeholder) {
        placeholder.replaceWith(message.getContent());
      }
    });
  }

  scrollToBottom(): void {
    const content = this.getContent();
    const container = content.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
