import { Block } from '../core/Block';
import store, { StoreEvents } from '../store/Store';
import { router } from '../main';

export function withAuth(Component: typeof Block) {
  return class WithAuth extends Component {
    constructor(props: any) {
      super({
        ...props,
        user: store.getState().user
      });

      store.on(StoreEvents.UPDATED, this.handleStoreUpdate.bind(this));
      
      // Проверяем авторизацию
      if (!store.getState().user) {
        router.go('/');
      }
    }

    private handleStoreUpdate(_prevState: any, nextState: any): void {
      if (!nextState.user) {
        router.go('/');
      }
      
      this.setProps({
        user: nextState.user
      });
    }
  };
}
