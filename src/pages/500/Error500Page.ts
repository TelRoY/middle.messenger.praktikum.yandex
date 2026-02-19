import { Block } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './error500.hbs';
import { router } from '../../main';
import { Button } from '../../components/buttons/Button';

export class Error500Page extends Block {
  constructor() {
    const backButton = new Button({
      type: 'button',
      variant: 'primary',
      text: 'Вернуться на главную',
      className: 'error-button',
      onClick: () => router.go('/messenger')
    });

    super('div', {
      children: {
        backButton
      }
    });
  }

  public override render(): string {
    const template = compile(templateSource);
    const children = this.getChildren();
    const context: Record<string, string> = {};
    
    Object.keys(children).forEach(key => {
      context[key] = `<div data-id="${key}"></div>`;
    });

    return template(context);
  }

  public override show(): void {
    console.log('👁️ Showing Error500Page');
    const content = this.getContent();
    if (content) {
      content.style.display = 'block';
    }
  }

  public override hide(): void {
    console.log('👋 Hiding Error500Page');
    const content = this.getContent();
    if (content) {
      content.style.display = 'none';
    }
  }
}
