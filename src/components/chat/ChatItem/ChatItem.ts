import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './ChatItem.hbs';
import { BASE_URL } from '../../../utils/HTTPClient';

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

    let avatar = this.props['avatar'] as string;
    let isImageAvatar = false;
    if (avatar && typeof avatar === 'string') {
      if (avatar.startsWith('/')) {
        avatar = `${BASE_URL}/resources${avatar}`;
      }
      
      isImageAvatar = avatar.startsWith('http') || avatar.startsWith('data:image');
    }
    
    return template({
      ...this.props,
      avatar,
      isImageAvatar
    });
  }
}
