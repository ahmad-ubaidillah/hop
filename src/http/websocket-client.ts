/**
 * WebSocket client for Hop testing framework
 */

export interface WebSocketMessage {
  data: any;
  type: string;
  timestamp: number;
}

export interface WebSocketOptions {
  protocols?: string | string[];
  headers?: Record<string, string>;
}

export class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private messages: WebSocketMessage[] = [];
  private connected: boolean = false;
  private options: WebSocketOptions;
  
  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.options = options;
  }
  
  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.options.protocols);
        
        this.ws.onopen = () => {
          this.connected = true;
          resolve();
        };
        
        this.ws.onerror = (error) => {
          reject(new Error(`WebSocket connection error: ${error}`));
        };
        
        this.ws.onmessage = (event) => {
          this.messages.push({
            data: event.data,
            type: event.type,
            timestamp: Date.now(),
          });
        };
        
        this.ws.onclose = () => {
          this.connected = false;
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Send message to WebSocket server
   */
  send(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(message);
  }
  
  /**
   * Send JSON message
   */
  sendJson(data: Record<string, any>): void {
    this.send(JSON.stringify(data));
  }
  
  /**
   * Close WebSocket connection
   */
  close(code: number = 1000, reason: string = ''): void {
    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
      this.connected = false;
    }
  }
  
  /**
   * Get all received messages
   */
  getMessages(): WebSocketMessage[] {
    return this.messages;
  }
  
  /**
   * Get the last message
   */
  getLastMessage(): WebSocketMessage | null {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }
  
  /**
   * Get messages by type
   */
  getMessagesByType(type: string): WebSocketMessage[] {
    return this.messages.filter(m => m.type === type);
  }
  
  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Wait for a specific message
   */
  async waitForMessage(predicate: (message: WebSocketMessage) => boolean, timeout: number = 5000): Promise<WebSocketMessage> {
    // Check existing messages first
    const existing = this.messages.find(predicate);
    if (existing) {
      return existing;
    }
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        const message = this.messages.find(predicate);
        if (message) {
          clearInterval(checkInterval);
          resolve(message);
        }
        
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Timeout waiting for message after ${timeout}ms`));
        }
      }, 100);
    });
  }
  
  /**
   * Wait for a specific number of messages
   */
  async waitForMessageCount(count: number, timeout: number = 5000): Promise<void> {
    if (this.messages.length >= count) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (this.messages.length >= count) {
          clearInterval(checkInterval);
          resolve();
        }
        
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Timeout waiting for ${count} messages after ${timeout}ms`));
        }
      }, 100);
    });
  }
  
  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messages = [];
  }
  
  /**
   * Get ready state
   */
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
  
  /**
   * Get ready state as string
   */
  getReadyStateString(): string {
    const states: Record<number, string> = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED',
    };
    return states[this.getReadyState()] || 'UNKNOWN';
  }
}
