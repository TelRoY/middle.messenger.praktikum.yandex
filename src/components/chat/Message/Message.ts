import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './Message.hbs';

export interface MessageProps extends Props {
  id: number;
  type: 'mine' | 'theirs';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  sender?: string; 
  avatar?: string;
}

export class Message extends Block {
  constructor(props: MessageProps) {
    super('div', props);
  }

  public override render(): string {
    const template = compile(templateSource);
    return template(this.props);
  }
}
