import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './ChatItem.hbs';

export interface ChatItemProps extends Props {
  id: number;
  name: string;
  avatar: string;
  time: string;
  lastMessage: string;
  unreadCount?: number;
  active?: boolean;
  onClick?: (id: number) => void;
}

export class ChatItem extends Block {
  constructor(props: ChatItemProps) {
    super('li', {
      ...props,
      events: {
        click: () => {
          if (props.onClick) {
            props.onClick(props.id);
          }
        }
      }
    });
  }

  public override render(): string {
    const template = compile(templateSource);

    const isImageAvatar = this.props['avatar'] && (
      typeof this.props['avatar'] === 'string' && 
      (this.props['avatar'].startsWith('http') || 
       this.props['avatar'].startsWith('data:image') ||
       this.props['avatar'].startsWith('/'))
    );

    return template({
      ...this.props,
      isImageAvatar
    });
  }
}
