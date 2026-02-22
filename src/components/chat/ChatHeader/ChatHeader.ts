import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './ChatHeader.hbs';

export interface ChatHeaderProps extends Props {
  title: string;
  avatar: string;
  status: string;
}

export class ChatHeader extends Block {
  constructor(props: ChatHeaderProps) {
    console.log('🏗️ ChatHeader constructor called with props:', props);
    super('div', props);
  }

  public override render(): string {
    console.log('🎨 ChatHeader rendering with props:', {
      title: this.props['title'],
      avatar: this.props['avatar'],
      status: this.props['status']
    });

    const template = compile(templateSource);
    const result = template(this.props);

    console.log('✅ ChatHeader HTML:', result);
    console.log('✅ Title in HTML:', result.includes(this.props['title'] as string));
    return result;
    // return template(this.props);
  }
}
