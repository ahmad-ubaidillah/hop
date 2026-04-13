export class ContractTester {
    interactions = [];
    testResults = [];
    addInteraction(interaction) {
        this.interactions.push(interaction);
    }
    async verifyContract(httpClient, context) {
        this.testResults = [];
        for (const interaction of this.interactions) {
            try {
                const result = await this.verifyInteraction(httpClient, interaction, context);
                this.testResults.push(result);
            }
            catch (error) {
                this.testResults.push({
                    passed: false,
                    interaction: interaction.description,
                    expected: interaction.response,
                    actual: null,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        return this.testResults;
    }
    async verifyInteraction(httpClient, interaction, context) {
        const { method, path, headers, body, query } = interaction.request;
        const url = query ? `${path}?${query}` : path;
        const response = await httpClient.request(method, url, {
            headers: { ...headers },
            body,
        });
        const expectedStatus = interaction.response.status;
        const actualStatus = response.status;
        if (actualStatus !== expectedStatus) {
            return {
                passed: false,
                interaction: interaction.description,
                expected: interaction.response,
                actual: { status: actualStatus, body: response.body },
                error: `Status mismatch: expected ${expectedStatus}, got ${actualStatus}`,
            };
        }
        if (interaction.response.body) {
            this.validateBody(response.body, interaction.response.body, interaction.description);
        }
        return {
            passed: true,
            interaction: interaction.description,
            expected: interaction.response,
            actual: { status: actualStatus, body: response.body },
        };
    }
    validateBody(actual, expected, description) {
        if (typeof expected === 'object' && expected !== null) {
            for (const key of Object.keys(expected)) {
                if (!(key in actual)) {
                    throw new Error(`Missing key '${key}' in response for: ${description}`);
                }
                if (typeof expected[key] === 'object') {
                    this.validateBody(actual[key], expected[key], `${description}.${key}`);
                }
                else if (actual[key] !== expected[key]) {
                    throw new Error(`Value mismatch for '${key}': expected ${expected[key]}, got ${actual[key]}`);
                }
            }
        }
    }
    generatePactJson() {
        return JSON.stringify({
            provider: { name: 'hop-provider' },
            consumer: { name: 'hop-consumer' },
            interactions: this.interactions.map((i) => ({
                description: i.description,
                request: i.request,
                response: i.response,
            })),
        }, null, 2);
    }
    async publishToBroker(config, pactJson) {
        const response = await fetch(`${config.brokerUrl}/pacts/provider/${config.provider}/consumer/${config.consumer}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(config.auth
                    ? {
                        Authorization: `Basic ${Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64')}`,
                    }
                    : {}),
            },
            body: pactJson,
        });
        if (!response.ok) {
            throw new Error(`Failed to publish pact: ${response.status} ${response.statusText}`);
        }
    }
    getResults() {
        return this.testResults;
    }
    printResults() {
        console.log('\n═══════════════════════════════════════════════════');
        console.log('               CONTRACT TEST RESULTS');
        console.log('═══════════════════════════════════════════════════\n');
        for (const result of this.testResults) {
            if (result.passed) {
                console.log(`✅ ${result.interaction}`);
            }
            else {
                console.log(`❌ ${result.interaction}`);
                console.log(`   Error: ${result.error}`);
            }
        }
        const passed = this.testResults.filter((r) => r.passed).length;
        const failed = this.testResults.filter((r) => !r.passed).length;
        console.log(`\n  Passed: ${passed} | Failed: ${failed}`);
        console.log('═══════════════════════════════════════════════════\n');
    }
}
export function createContractTester() {
    return new ContractTester();
}
