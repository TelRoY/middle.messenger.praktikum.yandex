import { Block } from '../../core/Block';
import { compile } from 'handlebars';
import templateSource from './Footer.hbs';

export class Footer extends Block {
  constructor() {
    super('footer', {});
  }

  protected override render(): string {
    const template = compile(templateSource);
    return template({});
  }
}
