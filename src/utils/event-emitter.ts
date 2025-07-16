type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  public on(eventName: string, callback: EventCallback): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(callback);
  }

  public off(eventName: string, callback: EventCallback): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  public emit(eventName: string, ...args: any[]): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  public removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }
}
