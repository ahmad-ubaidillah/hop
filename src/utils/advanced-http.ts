/**
 * Advanced HTTP Features for Hop Framework
 * Priority 15: Multipart, SSE, Webhooks
 */

export interface MultipartFile {
  fieldName: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface MultipartData {
  fields: Record<string, string>;
  files: MultipartFile[];
}

export interface SSEEvent {
  event: string;
  data: any;
  id?: string;
  retry?: number;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
}

export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: any;
  signature?: string;
}

/**
 * Multipart Form Handler
 */
export class MultipartHandler {
  /**
   * Create multipart form data
   */
  static createFormData(fields: Record<string, string>, files: MultipartFile[]): FormData {
    const formData = new FormData();

    // Add fields
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }

    // Add files
    for (const file of files) {
      const blob = new Blob([file.buffer], { type: file.mimeType });
      formData.append(file.fieldName, blob, file.fileName);
    }

    return formData;
  }

  /**
   * Parse multipart response
   */
  static parseMultipart(response: any): MultipartData {
    // Simplified implementation
    return {
      fields: response.fields || {},
      files: response.files || [],
    };
  }

  /**
   * Upload file
   */
  static async uploadFile(
    url: string,
    file: MultipartFile,
    additionalFields?: Record<string, string>
  ): Promise<Response> {
    const formData = this.createFormData(additionalFields || {}, [file]);

    return fetch(url, {
      method: 'POST',
      body: formData,
    });
  }
}

/**
 * Server-Sent Events Handler
 */
export class SSEHandler {
  private eventSource: any = null;
  private listeners: Map<string, (data: any) => void> = new Map();
  private messageHistory: SSEEvent[] = [];

  /**
   * Connect to SSE endpoint
   */
  connect(url: string): void {
    // Use any to avoid EventSource type issues in Node.js/Bun environments
    this.eventSource = new (globalThis.EventSource as any)(url);

    this.eventSource.onmessage = (event: any) => {
      const sseEvent: SSEEvent = {
        event: 'message',
        data: event.data,
      };
      
      this.messageHistory.push(sseEvent);
      this.emit('message', event.data);
    };

    this.eventSource.onerror = (error: any) => {
      this.emit('error', error);
    };
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (this.eventSource) {
      this.eventSource.addEventListener(event, (e: any) => callback(e.data));
    }
    this.listeners.set(event, callback);
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  /**
   * Get message history
   */
  getHistory(): SSEEvent[] {
    return this.messageHistory;
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
    this.messageHistory = [];
  }
}

/**
 * Webhook Handler
 */
export class WebhookHandler {
  private webhooks: Map<string, WebhookConfig> = new Map();

  /**
   * Register webhook
   */
  registerWebhook(config: WebhookConfig): void {
    this.webhooks.set(config.url, config);
  }

  /**
   * Unregister webhook
   */
  unregisterWebhook(url: string): void {
    this.webhooks.delete(url);
  }

  /**
   * Trigger webhook
   */
  async trigger(event: string, data: any): Promise<void> {
    for (const [url, config] of this.webhooks) {
      if (config.events.includes(event) || config.events.includes('*')) {
        const payload: WebhookPayload = {
          event,
          timestamp: Date.now(),
          data,
        };

        // Add signature if secret is configured
        if (config.secret) {
          payload.signature = this.generateSignature(payload, config.secret);
        }

        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(payload.signature ? { 'X-Webhook-Signature': payload.signature } : {}),
          },
          body: JSON.stringify(payload),
        });
      }
    }
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: WebhookPayload, secret: string, signature: string): boolean {
    const expected = this.generateSignature(payload, secret);
    return expected === signature;
  }

  /**
   * Create webhook server endpoint
   */
  createEndpoint(path: string): (req: any) => Promise<WebhookPayload> {
    return async (req: any): Promise<WebhookPayload> => {
      const body = req.body;
      
      // Verify signature if secret is configured
      const webhook = this.webhooks.get(path);
      if (webhook?.secret && body.signature) {
        const isValid = this.verifySignature(body, webhook.secret, body.signature);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      return body;
    };
  }
}

/**
 * Streaming Response Handler
 */
export class StreamingHandler {
  /**
   * Read streaming response
   */
  static async *readStream(response: Response): AsyncGenerator<string, void, unknown> {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Collect stream to string
   */
  static async collectStream(response: Response): Promise<string> {
    let result = '';
    
    for await (const chunk of this.readStream(response)) {
      result += chunk;
    }
    
    return result;
  }
}

/**
 * Create multipart handler
 */
export function createMultipartHandler(): typeof MultipartHandler {
  return MultipartHandler;
}

/**
 * Create SSE handler
 */
export function createSSEHandler(): SSEHandler {
  return new SSEHandler();
}

/**
 * Create webhook handler
 */
export function createWebhookHandler(): WebhookHandler {
  return new WebhookHandler();
}
