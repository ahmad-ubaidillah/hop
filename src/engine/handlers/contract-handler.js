import { ContractTester, createContractTester } from '../../validation/contract-tester.js';
export class ContractHandler {
    static testers = new Map();
    canHandle(text) {
        return text.match(/^(Given|When|Then|And|But)?\s*contract/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*publish contract/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*verify contract/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*mock provider/i) !== null;
    }
    async handle(text, step, context, executor) {
        const createInteraction = text.match(/^.*contract add (interaction|request)/i);
        const publishContract = text.match(/^.*publish contract/i);
        const verifyContract = text.match(/^.*verify contract/i);
        const mockProvider = text.match(/^.*mock provider response/i);
        if (createInteraction) {
            this.handleAddInteraction(text, context);
            return;
        }
        if (publishContract) {
            await this.handlePublishContract(text, context);
            return;
        }
        if (verifyContract) {
            await this.handleVerifyContract(text, context, executor);
            return;
        }
        if (mockProvider) {
            this.handleMockProvider(text, context);
            return;
        }
    }
    handleAddInteraction(text, context) {
        const methodMatch = text.match(/method (\w+)/i);
        const pathMatch = text.match(/path ['"]([^'"]+)['"]/i);
        const statusMatch = text.match(/status (\d+)/i);
        const bodyMatch = text.match(/response\s*(\{[\s\S]*\})/i);
        if (!methodMatch || !pathMatch || !statusMatch) {
            throw new Error('Contract interaction requires: method, path, status');
        }
        const testName = context.variables['__contract_name__'] || 'default';
        if (!ContractHandler.testers.has(testName)) {
            ContractHandler.testers.set(testName, createContractTester());
        }
        const tester = ContractHandler.testers.get(testName);
        tester.addInteraction({
            description: `Interaction: ${pathMatch[1]}`,
            provider: 'test-provider',
            consumer: 'test-consumer',
            request: {
                method: methodMatch[1].toUpperCase(),
                path: pathMatch[1],
            },
            response: {
                status: parseInt(statusMatch[1]),
                body: bodyMatch ? JSON.parse(bodyMatch[1]) : undefined,
            },
        });
        context.variables['__current_contract__'] = tester;
    }
    async handlePublishContract(text, context) {
        const brokerMatch = text.match(/broker ['"]([^'"]+)['"]/i);
        const consumerMatch = text.match(/consumer ['"]([^'"]+)['"]/i);
        const providerMatch = text.match(/provider ['"]([^'"]+)['"]/i);
        if (!brokerMatch || !consumerMatch || !providerMatch) {
            throw new Error('Publish contract requires: broker, consumer, provider');
        }
        const testName = context.variables['__contract_name__'] || 'default';
        const tester = ContractHandler.testers.get(testName);
        if (!tester) {
            throw new Error('No contract interactions found. Add interactions first.');
        }
        const pactJson = tester.generatePactJson();
        await tester.publishToBroker({
            brokerUrl: brokerMatch[1],
            consumer: consumerMatch[1],
            provider: providerMatch[1],
        }, pactJson);
        console.log(`📤 Contract published to ${brokerMatch[1]}`);
    }
    async handleVerifyContract(text, context, executor) {
        const httpClient = executor.getHttpClient();
        const tester = context.variables['__current_contract__'];
        if (!tester) {
            throw new Error('No contract to verify. Add contract interactions first.');
        }
        const results = await tester.verifyContract(httpClient, context);
        tester.printResults();
        const failed = results.filter((r) => !r.passed);
        if (failed.length > 0) {
            throw new Error(`Contract verification failed: ${failed.length} interaction(s) failed`);
        }
    }
    handleMockProvider(text, context) {
        const statusMatch = text.match(/status (\d+)/i);
        const bodyMatch = text.match(/response\s*(\{[\s\S]*\})/i);
        if (!statusMatch) {
            throw new Error('Mock provider requires status code');
        }
        context.variables['__mock_provider_status__'] = parseInt(statusMatch[1]);
        context.variables['__mock_provider_body__'] = bodyMatch ? JSON.parse(bodyMatch[1]) : null;
        console.log(`🎭 Provider mocked: status=${statusMatch[1]}`);
    }
    static getTester(name) {
        return ContractHandler.testers.get(name);
    }
    static clearTesters() {
        ContractHandler.testers.clear();
    }
}
