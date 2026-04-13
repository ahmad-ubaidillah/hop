import type { TestContext } from '../types/index.js';

export interface GrpcOptions {
  host: string;
  port: number;
  protoPath?: string;
  package?: string;
  service?: string;
  tls?: boolean;
}

export interface GrpcRequest {
  method: string;
  message?: any;
  metadata?: Record<string, string>;
}

export interface GrpcResponse {
  data: any;
  status: 'ok' | 'error';
  metadata?: Record<string, string>;
  error?: string;
}

export class GrpcClient {
  private host: string;
  private port: number;
  private packageName: string;
  private serviceName: string;
  private proto: any = null;
  private loaded = false;

  constructor(options: GrpcOptions) {
    this.host = options.host;
    this.port = options.port;
    this.packageName = options.package || '';
    this.serviceName = options.service || '';
  }

  async loadProto(protoPath: string): Promise<void> {
    try {
      const { loadSync } = await import('@grpc/proto-loader');
      this.proto = loadSync(protoPath, {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      this.loaded = true;
    } catch (error) {
      console.warn('⚠️ Proto file loading requires @grpc/proto-loader');
      this.loaded = false;
    }
  }

  async call(request: GrpcRequest, context: TestContext): Promise<GrpcResponse> {
    const { credentials, loadPackageDefinition } = await import('@grpc/grpc-js');

    let service: any = null;

    if (this.loaded && this.proto) {
      const packageDef = loadPackageDefinition(this.proto);
      if (this.packageName && this.serviceName) {
        service = packageDef[this.packageName]?.[this.serviceName];
      }
    }

    if (!service) {
      return {
        data: null,
        status: 'error',
        error: 'gRPC service not available. Install @grpc/grpc-js and @grpc/proto-loader.',
      };
    }

    const address = `${this.host}:${this.port}`;
    const client = new service(address, credentials.createInsecure());

    const grpcModule = await import('@grpc/grpc-js');
    const Metadata = grpcModule.Metadata;
    
    return new Promise((resolve) => {
      const metadata = new Metadata();
      if (request.metadata) {
        for (const [key, value] of Object.entries(request.metadata)) {
          metadata.add(key, value);
        }
      }

      const method = client[request.method];

      if (!method) {
        resolve({
          data: null,
          status: 'error',
          error: `Method '${request.method}' not found in service`,
        });
        return;
      }

      method.call(request.message, metadata, (error: any, response: any) => {
        if (error) {
          resolve({
            data: null,
            status: 'error',
            error: error.message,
          });
        } else {
          resolve({
            data: response,
            status: 'ok',
          });
        }

        client.close();
      });
    });
  }

  getAddress(): string {
    return `${this.host}:${this.port}`;
  }
}

export class GrpcMockServer {
  private server: any = null;
  private port: number;
  private handlers: Map<string, (req: any) => any> = new Map();

  constructor(port: number = 50051) {
    this.port = port;
  }

  async start(): Promise<void> {
    const { Server } = await import('@grpc/grpc-js');
    this.server = new Server();

    this.server.bindAsync(
      `0.0.0.0:${this.port}`,
      (await import('@grpc/grpc-js')).ServerCredentials.createInsecure(),
      () => {
        this.server.start();
        console.log(`🚀 gRPC mock server started on port ${this.port}`);
      }
    );
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.tryShutdown(() => {
          console.log('🛑 gRPC mock server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  addHandler(method: string, handler: (req: any) => any): void {
    this.handlers.set(method, handler);
    console.log(`   Added handler: ${method}`);
  }

  getPort(): number {
    return this.port;
  }
}

export interface GrpcTestRequest {
  host: string;
  port: number;
  package?: string;
  service: string;
  method: string;
  message?: any;
  expectedStatus?: string;
  expectedData?: any;
}

export async function runGrpcTest(
  request: GrpcTestRequest,
  context: TestContext
): Promise<{ passed: boolean; actual?: any; expected?: any; error?: string }> {
  const client = new GrpcClient({
    host: request.host,
    port: request.port,
    package: request.package,
    service: request.service,
  });

  const response = await client.call(
    { method: request.method, message: request.message },
    context
  );

  if (response.status === 'error') {
    return { passed: false, error: response.error };
  }

  if (request.expectedStatus && response.status !== request.expectedStatus) {
    return {
      passed: false,
      actual: response.status,
      expected: request.expectedStatus,
      error: `Status mismatch`,
    };
  }

  if (request.expectedData) {
    for (const key of Object.keys(request.expectedData)) {
      const actual = response.data[key];
      const expected = request.expectedData[key];
      if (actual !== expected) {
        return {
          passed: false,
          actual: { [key]: actual },
          expected: { [key]: expected },
          error: `Field '${key}' mismatch`,
        };
      }
    }
  }

  return { passed: true, actual: response.data };
}