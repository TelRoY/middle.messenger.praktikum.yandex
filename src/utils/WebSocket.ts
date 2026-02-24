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
    this.socket = new WebSocket(url);

    this.socket.addEventListener('open', this.handleOpen.bind(this));
    this.socket.addEventListener('close', this.handleClose.bind(this));
    this.socket.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleOpen(): void {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.notifyStatus('connected');

    this.startPing();

    this.getOldMessages(0);
  }

  private handleClose(event: CloseEvent): void {
    this.isConnected = false;
    this.stopPing();

    if (event.wasClean) {
      this.notifyStatus('closed');
    } else {
      this.notifyStatus('error');
      
      this.attemptReconnect();
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (Array.isArray(data)) {
        const messages = data.map((msg: undefined) => this.formatMessage(msg));
        store.addMessages(this.chatId, messages);
        return;
      } 

      if (data.type === 'pong') {
        return;
      } 

      if (data.type === 'user connected') {
        this.notifyStatus(`user ${data.content} connected`);
        return;
      }
            
      const message = this.formatMessage(data);
      store.addMessage(this.chatId, message);
      this.messageHandlers.forEach(handler => handler(message));
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('Invalid JSON received:', event.data);
      } else if (error instanceof Error) {
        console.error('Error handling message:', error.message);
      } else {
        console.error('Unknown error:', error);
      }
    }
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
      }
    }, 30000); 
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
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
