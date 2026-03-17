/**
 * Message Queue Testing Support for Hop Framework
 * RabbitMQ and Kafka testing utilities
 */

// Declare optional dependencies
// eslint-disable-next-line @typescript-eslint/no-require-imports
const requireAmqp = () => {
  try {
    return require('amqplib');
  } catch {
    throw new Error('amqplib is not installed. Install it with: npm install amqplib');
  }
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const requireKafka = () => {
  try {
    return require('kafkajs');
  } catch {
    throw new Error('kafkajs is not installed. Install it with: npm install kafkajs');
  }
};

export interface MessageOptions {
  exchange?: string;
  queue?: string;
  routingKey?: string;
  persistent?: boolean;
  headers?: Record<string, string>;
  correlationId?: string;
  replyTo?: string;
}

export interface Message {
  payload: any;
  options: MessageOptions;
  timestamp: number;
}

export interface QueueConfig {
  type: 'rabbitmq' | 'kafka';
  host: string;
  port: number;
  username?: string;
  password?: string;
  vhost?: string;
  topic?: string;
}

/**
 * RabbitMQ Client
 */
export class RabbitMQClient {
  private connection: any = null;
  private channel: any = null;
  private url: string;

  constructor(config: Omit<QueueConfig, 'type' | 'topic'>) {
    const vhost = config.vhost || '/';
    this.url = `amqp://${config.username || 'guest'}:${config.password || 'guest'}@${config.host}:${config.port}/${vhost}`;
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      const amqp = requireAmqp();
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Publish message to exchange
   */
  async publish(exchange: string, routingKey: string, message: any, options?: MessageOptions): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    const content = Buffer.from(JSON.stringify(message));
    const properties: any = {
      persistent: options?.persistent ?? true,
      headers: options?.headers,
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
    };

    return this.channel.publish(exchange, routingKey, content, properties);
  }

  /**
   * Publish to queue directly
   */
  async sendToQueue(queue: string, message: any, options?: MessageOptions): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    const content = Buffer.from(JSON.stringify(message));
    const properties: any = {
      persistent: options?.persistent ?? true,
      headers: options?.headers,
    };

    return this.channel.sendToQueue(queue, content, properties);
  }

  /**
   * Consume messages from queue
   */
  async consume(
    queue: string,
    callback: (message: any, raw: any) => void,
    options?: { noAck?: boolean }
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    await this.channel.consume(queue, (raw: any) => {
      if (raw) {
        try {
          const message = JSON.parse(raw.content.toString());
          callback(message, raw);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      }
    }, { noAck: options?.noAck ?? true });
  }

  /**
   * Assert queue exists
   */
  async assertQueue(queue: string, options?: any): Promise<any> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }
    return this.channel.assertQueue(queue, options);
  }

  /**
   * Assert exchange exists
   */
  async assertExchange(exchange: string, type: string = 'direct'): Promise<any> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }
    return this.channel.assertExchange(exchange, type, { durable: true });
  }

  /**
   * Bind queue to exchange
   */
  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<any> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }
    return this.channel.bindQueue(queue, exchange, routingKey);
  }

  /**
   * Purge queue
   */
  async purgeQueue(queue: string): Promise<any> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }
    return this.channel.purgeQueue(queue);
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

/**
 * Kafka Client
 */
export class KafkaClient {
  private producer: any = null;
  private consumer: any = null;
  private client: any = null;
  private brokers: string[];

  constructor(config: QueueConfig) {
    this.brokers = [`${config.host}:${config.port}`];
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    try {
      const kafka = requireKafka();
      this.client = new kafka.Kafka({
        clientId: 'hop-framework',
        brokers: this.brokers,
      });
      
      this.producer = this.client.producer();
      await this.producer.connect();
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  /**
   * Publish message to topic
   */
  async send(topic: string, messages: any | any[], options?: { key?: string; partition?: number }): Promise<void> {
    if (!this.producer) {
      throw new Error('Not connected to Kafka');
    }

    const messagesArray = Array.isArray(messages) ? messages : [messages];
    
    await this.producer.send({
      topic,
      messages: messagesArray.map(msg => ({
        key: options?.key,
        value: JSON.stringify(msg),
        partition: options?.partition,
      })),
    });
  }

  /**
   * Create consumer
   */
  async createConsumer(groupId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to Kafka');
    }

    this.consumer = this.client.consumer({ groupId });
    await this.consumer.connect();
  }

  /**
   * Subscribe to topic
   */
  async subscribe(topic: string, fromBeginning: boolean = false): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not created');
    }

    await this.consumer.subscribe({ topic, fromBeginning });
  }

  /**
   * Consume messages
   */
  async consume(callback: (message: any) => void): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not created');
    }

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: any) => {
        try {
          const payload = JSON.parse(message.value?.toString() || '{}');
          callback({
            topic,
            partition,
            payload,
            offset: message.offset,
            timestamp: message.timestamp,
          });
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      },
    });
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
    if (this.consumer) {
      await this.consumer.disconnect();
    }
  }
}

/**
 * Create RabbitMQ client
 */
export function createRabbitMQClient(config: Omit<QueueConfig, 'type' | 'topic'>): RabbitMQClient {
  return new RabbitMQClient(config);
}

/**
 * Create Kafka client
 */
export function createKafkaClient(config: QueueConfig): KafkaClient {
  return new KafkaClient(config);
}

/**
 * Generate RabbitMQ test steps
 */
export function generateRabbitMQTests(): string {
  return `
Feature: RabbitMQ Message Queue Tests

  Background:
    Given I connect to RabbitMQ
    And I assert queue "test-queue"

  Scenario: Publish message to queue
    When I publish to queue "test-queue"
      | key       | value         |
      | test-key  | test-value    |
    Then message should be in queue "test-queue"

  Scenario: Consume message from queue
    Given queue "test-queue" has message
      | data       |
      | hello      |
    When I consume from queue "test-queue"
    Then I should receive message with "data" = "hello"

  Scenario: Test publish-subscribe
    Given I assert exchange "test-exchange" of type "fanout"
    And I bind queue "test-queue" to exchange "test-exchange"
    When I publish to exchange "test-exchange" with routing key "test"
      | message |
      | hello   |
    Then queue "test-queue" should have 1 message
`;
}

/**
 * Generate Kafka test steps
 */
export function generateKafkaTests(): string {
  return `
Feature: Kafka Message Queue Tests

  Background:
    Given I connect to Kafka

  Scenario: Publish message to topic
    When I publish to topic "test-topic"
      | key    | value       |
      | key1   | message-1   |
      | key2   | message-2   |
    Then Kafka should have 2 messages in topic "test-topic"

  Scenario: Consume from topic
    Given topic "test-topic" has messages
      | key  | value    |
      | k1   | hello    |
      | k2   | world    |
    And I create consumer with group "test-group"
    And I subscribe to topic "test-topic"
    When I consume messages
    Then I should receive 2 messages

  Scenario: Test message ordering
    Given I publish to topic "test-topic" with partition 0
      | order |
      | 1     |
      | 2     |
      | 3     |
    When I consume from topic "test-topic" partition 0
    Then messages should arrive in order 1, 2, 3
`;
}
