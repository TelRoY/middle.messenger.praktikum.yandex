import { ChatMessage } from '../models/Chat';
import store from '../store/Store';

export type MessageHandler = (message: ChatMessage) => void;
export type StatusHandler = (status: string) => void;

export class WebSocketTransport {
  private socket: WebSocket | null = null;
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private userId: number;
  private chatId: number;
  private token: string;
  private messageHandlers: MessageHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(userId: number, chatId: number, token: string) {
    this.userId = userId;
    this.chatId = chatId;
    this.token = token;
  }

  public onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  public onStatus(handler: StatusHandler): void {
    this.statusHandlers.push(handler);
  }

  public connect(): void {
    const url = `wss://ya-praktikum.tech/ws/chats/${this.userId}/${this.chatId}/${this.token}`;
    console.log(`🔌 Connecting to WebSocket: ${url}`);
    this.socket = new WebSocket(url);

    this.socket.addEventListener('open', this.handleOpen.bind(this));
    this.socket.addEventListener('close', this.handleClose.bind(this));
    this.socket.addEventListener('message', this.handleMessage.bind(this));
    this.socket.addEventListener('error', this.handleError.bind(this));
  }

  private handleOpen(): void {
    console.log('✅ WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.notifyStatus('connected');

    // Пинг каждые 30 секунд для поддержания соединения
    this.startPing();

    // Запрашиваем последние сообщения
    this.getOldMessages(0);
  }

  private handleClose(event: CloseEvent): void {
    console.log('🔌 WebSocket closed', event);
    this.isConnected = false;
    this.stopPing();

    if (event.wasClean) {
      console.log('✅ Connection closed cleanly');
      this.notifyStatus('closed');
    } else {
      console.log('❌ Connection died');
      this.notifyStatus('error');
      
      // Пытаемся переподключиться
      this.attemptReconnect();
    }
  }

  private handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);
    console.log('📨 WebSocket message:', data);

    // Обработка разных типов сообщений
    if (Array.isArray(data)) {
      // Пришли старые сообщения
      const messages = data.map((msg: any) => this.formatMessage(msg));
      store.addMessages(this.chatId, messages);
    } else if (data.type === 'pong') {
      // Ответ на ping - игнорируем
      return;
    } else if (data.type === 'user connected') {
      // Пользователь подключился
      this.notifyStatus(`user ${data.content} connected`);
    } else {
      // Новое сообщение
      const message = this.formatMessage(data);
      store.addMessage(this.chatId, message);
      
      // Уведомляем подписчиков
      this.messageHandlers.forEach(handler => handler(message));
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error', error);
    console.error('❌ WebSocket readyState:', this.socket?.readyState);
    console.error('❌ WebSocket url:', this.socket?.url);
    this.notifyStatus('error');
  }

  private formatMessage(msg: any): ChatMessage {
    return {
      id: msg.id,
      user_id: msg.user_id,
      chat_id: msg.chat_id,
      type: msg.type,
      time: msg.time,
      content: msg.content,
      is_read: msg.is_read,
      file: msg.file
    };
  }

  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
        console.log('📤 Ping sent');
      }
    }, 30000); // Каждые 30 секунд
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnect attempts reached');
      this.notifyStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.notifyStatus(`reconnecting (${this.reconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  public sendMessage(content: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        content,
        type: 'message'
      };
      this.socket.send(JSON.stringify(message));
      console.log('📤 Message sent:', message);
    } else {
      console.error('❌ Cannot send message: WebSocket not connected');
    }
  }

  public getOldMessages(offset: number = 0): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        content: offset.toString(),
        type: 'get old'
      }));
      console.log(`📤 Requesting old messages with offset ${offset}`);
    }
  }

  public close(): void {
    console.log('🔌 Closing WebSocket connection');
    this.stopPing();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
  }

  public isActive(): boolean {
    return this.isConnected;
  }

  private notifyStatus(status: string): void {
    this.statusHandlers.forEach(handler => handler(status));
  }
}
