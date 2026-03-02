import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './ChatList.hbs';

interface ChatListProps extends Props {
  items?: Block[];
}

export class ChatList extends Block {
  private items: Block[] = [];

  constructor(props: ChatListProps) {
    const safeProps = {
      ...props,
      items: props.items || []
    };

    super('div', safeProps) 

    this.items = props.items || [];
  }

  public setItems(items: Block[]): void {
    
    this.items = items || [];

    this.setProps({ 
      children: {
        items: this.items
      }
    });

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
    
    const template = compile(templateSource);
    
    const itemsLength = this.items?.length || 0;
    
    const context: Record<string, any> = {
      items: []
    };

    if (itemsLength > 0) {
      context['items'] = this.items.map((_, index) => {
        return `<div data-id="items[${index}]"></div>`;
      });
    }

    const result = template(context);
    return result;
  }

  public override _replacePlaceholders(): void {
    if (!this._element) return;

    const itemsLength = this.items?.length || 0;
    
    if (itemsLength === 0) return;

    this.items.forEach((item, index) => {
      const placeholder = this._element!.querySelector(`[data-id="items[${index}]"]`);
      if (placeholder) {
        placeholder.replaceWith(item.getContent());
      }
    });
  }
}
