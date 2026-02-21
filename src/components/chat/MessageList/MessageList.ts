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
    console.log('🏗️ MessageList constructed with', this._messages.length, 'messages');
  }

  public setMessages(messages: Block[]): void {
    console.log('📋 MessageList.setMessages called with', messages?.length || 0, 'messages');
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
    console.log('🎨 MessageList render, messages count:', messagesCount);

    const template = compile(templateSource);
    // const children = this.getChildren();
    
    const context: Record<string, any> = {
      messages: []
    };
    
    // if (children['messages'] && Array.isArray(children['messages'])) {
    //   context['messages'] = children['messages'].map((_, index) => `<div data-id="messages[${index}]"></div>`);
    // }

    if (messagesCount > 0) {
      context['messages'] = this._messages.map((_, index) => {
        return `<div data-id="messages[${index}]"></div>`;
      });
    }

    console.log('✅ MessageList render result includes messages:', messagesCount > 0);
    return template(context);
  }

  public override _replacePlaceholders(): void {
    if (!this._element) return;

    const messagesCount = this._messages?.length || 0;
    
    console.log('🔍 Replacing placeholders for', messagesCount, 'messages');
    
    if (messagesCount === 0) return;

    this._messages.forEach((message, index) => {
      const placeholder = this._element!.querySelector(`[data-id="messages[${index}]"]`);
      if (placeholder) {
        placeholder.replaceWith(message.getContent());
      } else {
        console.log(`❌ Placeholder not found for messages[${index}]`);
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
