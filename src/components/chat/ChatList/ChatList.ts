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
      items: props.items || [] // Если items нет, передаем пустой массив
    };

    super('div', safeProps) 

    this.items = props.items || [];
    console.log('🏗️ ChatList constructed with', this.items.length, 'items');
  }

  public setItems(items: Block[]): void {
    console.log('📋 ChatList.setItems called with', items.length, 'items');
    
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
    console.log('🎨 ChatList render, items length:', this.items?.length || 0);
    
    const template = compile(templateSource);
    
    const itemsLength = this.items?.length || 0;

    console.log('📦 ChatList has', itemsLength, 'items');
    
    const context: Record<string, any> = {
      items: []
    };

    if (itemsLength > 0) {
      context['items'] = this.items.map((_, index) => {
        return `<div data-id="items[${index}]"></div>`;
      });
    }

    const result = template(context);
    console.log('✅ ChatList render result length:', result.length);
    return result;
  }

    // const children = this.getChildren();

    // let items: Block[] = [];
    // if (children['items'] && Array.isArray(children['items'])) {
    //   items = children['items'] as Block[];
    // }
    // // const items = children['items'] as Block[] || [];
    // console.log('📦 ChatList has', items.length, 'items in children');

    // const context: Record<string, any> = {
    //   items: []
    // };

    // if (items.length > 0) {
    //   context['items'] = items.map((_, index) => {
    //     return `<div data-id="items[${index}]"></div>`;
    //   });
    // }
    
    // Передаем детей как массив
    // if (children && children['items'] && Array.isArray(children['items'])) {
    //   console.log('📦 ChatList has', children['items'].length, 'items in children');
      
    //   // Создаем плейсхолдеры для каждого элемента
    //   context['items'] = children['items'].map((_, index) => {
    //     return `<div data-id="items[${index}]"></div>`;
    //   });
    // } else {
    //   console.log('📭 ChatList has no items in children');
    //   console.log('Available children:', Object.keys(children));
    // }
    
  //   const result = template(context);
  //   console.log('✅ ChatList render result length:', result.length);
  //   return result;
  // }

  public override _replacePlaceholders(): void {
    if (!this._element) return;

    const itemsLength = this.items?.length || 0;
    console.log('🔍 Replacing placeholders for', itemsLength, 'items');
    
    if (itemsLength === 0) return;

    this.items.forEach((item, index) => {
      const placeholder = this._element!.querySelector(`[data-id="items[${index}]"]`);
      if (placeholder) {
        placeholder.replaceWith(item.getContent());
      } else {
        console.log(`❌ Placeholder not found for items[${index}]`);
      }
    });
  }
}
//     const children = this.getChildren();
//     let items: Block[] = [];
//     if (children['items'] && Array.isArray(children['items'])) {
//       items = children['items'] as Block[];
//     }
//     // const items = children['items'] as Block[] || [];
    
//     console.log('🔍 Replacing placeholders for', items.length, 'items');
    
//     items.forEach((item, index) => {
//       const placeholder = this._element!.querySelector(`[data-id="items[${index}]"]`);
//       if (placeholder) {
//         placeholder.replaceWith(item.getContent());
//       }
//     });
//   }
// }
