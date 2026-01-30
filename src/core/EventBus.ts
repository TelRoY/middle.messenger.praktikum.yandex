type Listener<T extends any[] = any[]> = (...args: T) => void;

export class EventBus {
  private listeners: Record<string, Listener[]> = {};

  on<T extends any[]>(event: string, callback: Listener<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback as Listener);
  }

  off<T extends any[]>(event: string, callback: Listener<T>): void {
    if (!this.listeners[event]) {
      throw new Error(`Нет события: ${event}`);
    }

    this.listeners[event] = this.listeners[event].filter(
      listener => listener !== callback
    );
  }

  emit<T extends any[]>(event: string, ...args: T): void {
    if (!this.listeners[event]) {
      throw new Error(`Нет события: ${event}`);
    }

    this.listeners[event].forEach(listener => {
      listener(...args);
    });
  }
}
