import { GrpcClient, runGrpcTest } from '../../http/grpc-client.js';
export class GrpcHandler {
    clients = new Map();
    canHandle(text) {
        return text.match(/^(Given|When|Then|And|But)?\s*grpc/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*start grpc/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*stop grpc/i) !== null;
    }
    async handle(text, step, context, executor) {
        const connectMatch = text.match(/^.*grpc connect to ['"]([^'"]+)['"]/i);
        const callMatch = text.match(/^.*grpc call method ['"]([^'"]+)['"]/i);
        const startMockMatch = text.match(/^.*start grpc mock server/i);
        const stopMatch = text.match(/^.*stop grpc mock server/i);
        if (connectMatch) {
            const hostMatch = text.match(/host ['"]([^'"]+)['"]/i);
            const portMatch = text.match(/port (\d+)/i);
            const packageMatch = text.match(/package ['"]([^'"]+)['"]/i);
            const serviceMatch = text.match(/service ['"]([^'"]+)['"]/i);
            if (!hostMatch || !portMatch) {
                throw new Error('gRPC connect requires host and port');
            }
            const client = new GrpcClient({
                host: hostMatch[1],
                port: parseInt(portMatch[1]),
                package: packageMatch?.[1],
                service: serviceMatch?.[1],
            });
            const clientName = `grpc-${Date.now()}`;
            this.clients.set(clientName, client);
            context.variables['__grpc_client'] = client;
            context.variables['__grpc_client_name'] = clientName;
            console.log(`🔌 Connected to gRPC: ${hostMatch[1]}:${portMatch[1]}`);
            return;
        }
        if (callMatch) {
            const methodMatch = text.match(/method ['"]([^'"]+)['"]/i);
            const messageMatch = text.match(/message (\{[\s\S]*\})/i);
            const expectedMatch = text.match(/expect (\{[\s\S]*\})/i);
            const client = context.variables['__grpc_client'];
            if (!client) {
                throw new Error('No gRPC client connected. Use "Given grpc connect to" first.');
            }
            const message = messageMatch ? JSON.parse(messageMatch[1]) : undefined;
            const expectedData = expectedMatch ? JSON.parse(expectedMatch[1]) : undefined;
            const result = await runGrpcTest({
                host: client.getAddress().split(':')[0],
                port: parseInt(client.getAddress().split(':')[1]),
                service: 'TestService',
                method: methodMatch?.[1] || 'TestMethod',
                message,
                expectedData,
            }, context);
            if (!result.passed) {
                throw new Error(`gRPC call failed: ${result.error || 'Assertion mismatch'}`);
            }
            context.variables['__grpc_response'] = result.actual;
            console.log(`📡 gRPC call: ${methodMatch?.[1]} - OK`);
            return;
        }
        if (startMockMatch) {
            const portMatch = text.match(/port (\d+)/i);
            const port = portMatch ? parseInt(portMatch[1]) : 50051;
            context.variables['__grpc_mock_port'] = port;
            console.log(`🎭 gRPC mock server configured on port ${port}`);
            return;
        }
        if (stopMatch) {
            context.variables['__grpc_client'] = undefined;
            console.log('🛑 gRPC client disconnected');
            return;
        }
    }
}
