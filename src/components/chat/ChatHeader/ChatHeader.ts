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
    super('div', props);
  }

  public override render(): string {
    const template = compile(templateSource);
    return template(this.props);
  }
}
