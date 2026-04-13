export class GrpcClient {
    host;
    port;
    packageName;
    serviceName;
    proto = null;
    loaded = false;
    constructor(options) {
        this.host = options.host;
        this.port = options.port;
        this.packageName = options.package || '';
        this.serviceName = options.service || '';
    }
    async loadProto(protoPath) {
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
        }
        catch (error) {
            console.warn('⚠️ Proto file loading requires @grpc/proto-loader');
            this.loaded = false;
        }
    }
    async call(request, context) {
        const { credentials, loadPackageDefinition } = await import('@grpc/grpc-js');
        let service = null;
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
            method.call(request.message, metadata, (error, response) => {
                if (error) {
                    resolve({
                        data: null,
                        status: 'error',
                        error: error.message,
                    });
                }
                else {
                    resolve({
                        data: response,
                        status: 'ok',
                    });
                }
                client.close();
            });
        });
    }
    getAddress() {
        return `${this.host}:${this.port}`;
    }
}
export class GrpcMockServer {
    server = null;
    port;
    handlers = new Map();
    constructor(port = 50051) {
        this.port = port;
    }
    async start() {
        const { Server } = await import('@grpc/grpc-js');
        this.server = new Server();
        this.server.bindAsync(`0.0.0.0:${this.port}`, (await import('@grpc/grpc-js')).ServerCredentials.createInsecure(), () => {
            this.server.start();
            console.log(`🚀 gRPC mock server started on port ${this.port}`);
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.tryShutdown(() => {
                    console.log('🛑 gRPC mock server stopped');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    addHandler(method, handler) {
        this.handlers.set(method, handler);
        console.log(`   Added handler: ${method}`);
    }
    getPort() {
        return this.port;
    }
}
export async function runGrpcTest(request, context) {
    const client = new GrpcClient({
        host: request.host,
        port: request.port,
        package: request.package,
        service: request.service,
    });
    const response = await client.call({ method: request.method, message: request.message }, context);
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
