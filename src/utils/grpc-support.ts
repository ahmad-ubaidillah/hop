/**
 * gRPC Testing Support for Hop Framework
 */

// Declare optional dependencies
// eslint-disable-next-line @typescript-eslint/no-require-imports
const requireGrpc = () => {
  try {
    return require('@grpc/grpc-js');
  } catch {
    throw new Error('@grpc/grpc-js is not installed. Install it with: npm install @grpc/grpc-js');
  }
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const requireProtoLoader = () => {
  try {
    return require('@grpc/proto-loader');
  } catch {
    throw new Error('@grpc/proto-loader is not installed. Install it with: npm install @grpc/proto-loader');
  }
};

// Get grpc types at module level (will be any if not installed)
const grpc: any = typeof require !== 'undefined' ? requireGrpc() : {};
const protoLoader: any = typeof require !== 'undefined' ? requireProtoLoader() : {};

export interface GrpcConfig {
  host: string;
  port: number;
  protoPath: string;
  packageName?: string;
  serviceName?: string;
  credentials?: 'secure' | 'insecure';
  metadata?: any;
}

export interface GrpcRequest {
  method: string;
  message?: any;
  metadata?: any;
}

export interface GrpcResponse {
  data: any;
  metadata?: any;
}

export interface ProtoDefinition {
  package: string;
  service: string;
  methods: ProtoMethod[];
}

export interface ProtoMethod {
  name: string;
  requestType: string;
  responseType: string;
  requestStream: boolean;
  responseStream: boolean;
}

export class GrpcClient {
  private client: any;
  private proto: any;
  private packageName: string;
  private serviceName: string;
  private credentials: any;

  constructor(config: GrpcConfig) {
    this.packageName = config.packageName || '';
    this.serviceName = config.serviceName || '';
    
    // Load proto file
    const protoLoaderModule = requireProtoLoader();
    const packageDefinition = protoLoaderModule.loadSync(config.protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    
    const grpcModule = requireGrpc();
    this.proto = grpcModule.loadPackageDefinition(packageDefinition);
    
    // Get service
    let service: any = this.proto;
    if (this.packageName) {
      service = service[this.packageName];
    }
    if (this.serviceName) {
      service = service[this.serviceName];
    }
    
    // Create credentials
    this.credentials = config.credentials === 'insecure'
      ? grpcModule.ChannelCredentials.createInsecure()
      : grpcModule.ChannelCredentials.createSsl();
    
    // Create client
    const address = `${config.host}:${config.port}`;
    this.client = new service(address, this.credentials, config.metadata);
  }

  /**
   * Call a unary method
   */
  call(methodName: string, message?: any, metadata?: any): Promise<GrpcResponse> {
    return new Promise((resolve, reject) => {
      const method = this.client[methodName];
      
      if (!method) {
        reject(new Error(`Method ${methodName} not found`));
        return;
      }
      
      const callMetadata = metadata || new (requireGrpc()).Metadata();
      
      method(message || {}, callMetadata, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve({ data: response });
        }
      });
    });
  }

  /**
   * Call a server streaming method
   */
  async *stream(methodName: string, message?: any, metadata?: any): AsyncGenerator<any, void, unknown> {
    const method = this.client[methodName];
    
    if (!method) {
      throw new Error(`Method ${methodName} not found`);
    }
    
    const callMetadata = metadata || new (requireGrpc()).Metadata();
    const stream = method(message || {}, callMetadata);
    
    // Use a promise-based approach to yield streaming results
    const yieldNext = (): Promise<{ done: boolean; value: any }> => {
      return new Promise((resolve) => {
        stream.on('data', (data: any) => {
          resolve({ done: false, value: data });
        });
        
        stream.on('end', () => {
          resolve({ done: true, value: undefined });
        });
        
        stream.on('error', (error: any) => {
          resolve({ done: true, value: undefined });
        });
      });
    };
    
    while (true) {
      const result = await yieldNext();
      if (result.done) break;
      yield result.value;
    }
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
    }
  }

  /**
   * Get client instance
   */
  getClient(): any {
    return this.client;
  }
}

export class GrpcServer {
  private server: any;
  private proto: any;
  private port: number;
  private packageName: string;
  private serviceName: string;

  constructor(protoPath: string, packageName?: string, serviceName?: string) {
    const grpcModule = requireGrpc();
    this.server = new grpcModule.Server();
    this.packageName = packageName || '';
    this.serviceName = serviceName || '';
    this.port = 0;
    
    // Load proto
    const protoLoaderModule = requireProtoLoader();
    const packageDefinition = protoLoaderModule.loadSync(protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    
    this.proto = grpcModule.loadPackageDefinition(packageDefinition);
  }

  /**
   * Add a service implementation
   */
  addService(impl: Record<string, Function>): void {
    let service: any = this.proto;
    
    if (this.packageName) {
      service = service[this.packageName];
    }
    if (this.serviceName) {
      service = service[this.serviceName];
    }
    
    this.server.addService(service.service, impl);
  }

  /**
   * Start the server
   */
  async start(port: number = 50051): Promise<number> {
    const grpcModule = requireGrpc();
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        `0.0.0.0:${port}`,
        grpcModule.ServerCredentials.createInsecure(),
        (err: any, port: number) => {
          if (err) {
            reject(err);
          } else {
            this.port = port;
            this.server.start();
            resolve(port);
          }
        }
      );
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
        resolve();
      });
    });
  }

  /**
   * Get the port
   */
  getPort(): number {
    return this.port;
  }
}

/**
 * Parse proto file and extract definitions
 */
export function parseProtoFile(protoPath: string): ProtoDefinition[] {
  const fs = require('fs');
  const content = fs.readFileSync(protoPath, 'utf-8');
  const definitions: ProtoDefinition[] = [];
  
  // Simple regex-based parsing (for basic proto files)
  const packageMatch = content.match(/package\s+(\w+)\s*;/);
  const packageName = packageMatch ? packageMatch[1] : '';
  
  // Find service definitions
  const serviceRegex = /service\s+(\w+)\s*\{([^}]*)\}/g;
  let serviceMatch;
  
  while ((serviceMatch = serviceRegex.exec(content)) !== null) {
    const serviceName = serviceMatch[1];
    const serviceContent = serviceMatch[2];
    const methods: ProtoMethod[] = [];
    
    // Find method definitions within service
    const methodRegex = /rpc\s+(\w+)\s*\(\s*(\w+)\s*\)\s*returns\s*\(\s*(\w+)\s*\)/g;
    let methodMatch;
    
    while ((methodMatch = methodRegex.exec(serviceContent)) !== null) {
      methods.push({
        name: methodMatch[1],
        requestType: methodMatch[2],
        responseType: methodMatch[3],
        requestStream: serviceContent.includes(`stream ${methodMatch[2]}`),
        responseStream: serviceContent.includes(`returns (stream ${methodMatch[3]})`),
      });
    }
    
    definitions.push({
      package: packageName,
      service: serviceName,
      methods,
    });
  }
  
  return definitions;
}

/**
 * Generate gRPC test steps
 */
export function generateGrpcTests(protoPath: string): string {
  const definitions = parseProtoFile(protoPath);
  const lines: string[] = [];
  
  for (const def of definitions) {
    lines.push(`Feature: ${def.service} gRPC Tests`);
    lines.push('');
    
    for (const method of def.methods) {
      const scenarioName = method.requestStream || method.responseStream
        ? `Stream ${method.name}`
        : `Call ${method.name}`;
      
      lines.push(`  Scenario: ${scenarioName}`);
      lines.push(`    Given I have gRPC service "${def.package}.${def.service}"`);
      lines.push(`    And I set gRPC method "${method.name}"`);
      
      if (!method.requestStream) {
        lines.push(`    And I set gRPC request to ${JSON.stringify({})} \`\`\``);
      }
      
      lines.push(`    When I call gRPC`);
      lines.push(`    Then gRPC status should be OK`);
      lines.push(`    And gRPC response should not be empty`);
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Create gRPC client
 */
export function createGrpcClient(config: GrpcConfig): GrpcClient {
  return new GrpcClient(config);
}

/**
 * Create gRPC server
 */
export function createGrpcServer(
  protoPath: string,
  packageName?: string,
  serviceName?: string
): GrpcServer {
  return new GrpcServer(protoPath, packageName, serviceName);
}
