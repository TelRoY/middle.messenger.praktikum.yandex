import { Block, Props } from '../../../core/Block';
import { compile } from 'handlebars';
import templateSource from './ChatHeader.hbs';
import { BASE_URL } from '../../../utils/HTTPClient';

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

    let avatar = this.props['avatar'] as string;
    let isImageAvatar = false;

    console.log('🎨 ChatHeader rendering with avatar:', avatar);

    if (avatar && typeof avatar === 'string') {
      if (avatar.startsWith('/')) {
        avatar = `${BASE_URL}/resources${avatar}`
      }

      isImageAvatar = avatar.startsWith('https') || avatar.startsWith('data:image');
      console.log('🖼️ isImageAvatar:', isImageAvatar, 'avatar:', avatar);
    }

    const context = {
      title: this.props['title'],
      avatar: avatar,
      status: this.props['status'],
      isImageAvatar
    };

    console.log('📦 ChatHeader context:', context);
    return template(context);
  }
}
