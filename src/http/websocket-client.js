/**
 * WebSocket client for Hop testing framework
 */
export class WebSocketClient {
    url;
    ws = null;
    messages = [];
    connected = false;
    options;
    constructor(url, options = {}) {
        this.url = url;
        this.options = options;
    }
    /**
     * Connect to WebSocket server
     */
    async connect() {
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Send message to WebSocket server
     */
    send(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
    }
    /**
     * Send JSON message
     */
    sendJson(data) {
        this.send(JSON.stringify(data));
    }
    /**
     * Close WebSocket connection
     */
    close(code = 1000, reason = '') {
        if (this.ws) {
            this.ws.close(code, reason);
            this.ws = null;
            this.connected = false;
        }
    }
    /**
     * Get all received messages
     */
    getMessages() {
        return this.messages;
    }
    /**
     * Get the last message
     */
    getLastMessage() {
        return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
    }
    /**
     * Get messages by type
     */
    getMessagesByType(type) {
        return this.messages.filter(m => m.type === type);
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Wait for a specific message
     */
    async waitForMessage(predicate, timeout = 5000) {
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
    async waitForMessageCount(count, timeout = 5000) {
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
    clearMessages() {
        this.messages = [];
    }
    /**
     * Get ready state
     */
    getReadyState() {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }
    /**
     * Get ready state as string
     */
    getReadyStateString() {
        const states = {
            [WebSocket.CONNECTING]: 'CONNECTING',
            [WebSocket.OPEN]: 'OPEN',
            [WebSocket.CLOSING]: 'CLOSING',
            [WebSocket.CLOSED]: 'CLOSED',
        };
        return states[this.getReadyState()] || 'UNKNOWN';
    }
}
