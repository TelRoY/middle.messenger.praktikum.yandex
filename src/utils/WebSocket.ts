import { ChatMessage } from '../models/Chat';
import store from '../store/Store';

export class WebSocketTransport {
  private socket: WebSocket | null = null;
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private userId: number;
  private chatId: number;
  private token: string;

  constructor(userId: number, chatId: number, token: string) {
    this.userId = userId;
    this.chatId = chatId;
    this.token = token;
  }

  public connect(): void {
    const url = `wss://ya-praktikum.tech/ws/chats/${this.userId}/${this.chatId}/${this.token}`;
    this.socket = new WebSocket(url);

    this.socket.addEventListener('open', this.handleOpen.bind(this));
    this.socket.addEventListener('close', this.handleClose.bind(this));
    this.socket.addEventListener('message', this.handleMessage.bind(this));
    this.socket.addEventListener('error', this.handleError.bind(this));
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    
    // Пинг каждые 30 секунд для поддержания соединения
    this.pingInterval = window.setInterval(() => {
      this.socket?.send(JSON.stringify({ type: 'ping' }));
    }, 30000);

    // Запрашиваем последние сообщения
    this.getOldMessages();
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed', event);
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Пытаемся переподключиться через 3 секунды
    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, 3000);
  }

  private handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);

    if (data.type === 'pong') {
      return;
    }

    if (Array.isArray(data)) {
      // Пришли старые сообщения
      const messages = data.map((msg: any) => ({
        id: msg.id,
        user_id: msg.user_id,
        chat_id: msg.chat_id,
        type: msg.type,
        time: msg.time,
        content: msg.content,
        is_read: msg.is_read,
        file: msg.file
      }));
      
      store.setState({
        currentChat: {
          ...store.getState().currentChat,
          messages
        }
      });
    } else {
      // Новое сообщение
      const message: ChatMessage = {
        id: data.id,
        user_id: data.user_id,
        chat_id: data.chat_id,
        type: data.type,
        time: data.time,
        content: data.content,
        is_read: data.is_read,
        file: data.file
      };
      
      store.addMessage(this.chatId, message);
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error', error);
  }

  public sendMessage(content: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        content,
        type: 'message'
      }));
    }
  }

  public getOldMessages(offset: number = 0): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        content: offset.toString(),
        type: 'get old'
      }));
    }
  }

  public close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
