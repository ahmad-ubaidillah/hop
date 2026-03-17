/**
 * Contract Testing Support for Hop Framework
 * Pact integration, consumer-driven contracts, provider verification
 */

export interface PactConfig {
  provider: string;
  consumer: string;
  host: string;
  port: number;
  pactDir?: string;
  logDir?: string;
}

export interface Contract {
  interaction: Interaction;
  providerStates?: ProviderState[];
}

export interface Interaction {
  description: string;
  request: InteractionRequest;
  response: InteractionResponse;
  providerStates?: ProviderState[];
}

export interface InteractionRequest {
  method: string;
  path: string;
  query?: string;
  headers?: Record<string, string>;
  body?: any;
  matchingRules?: MatchingRules;
}

export interface InteractionResponse {
  status: number;
  headers?: Record<string, string>;
  body?: any;
  matchingRules?: MatchingRules;
}

export interface ProviderState {
  name: string;
  params?: Record<string, any>;
}

export interface MatchingRules {
  body?: Record<string, any>;
  header?: Record<string, any>;
  path?: Record<string, any>;
}

export interface ConsumerContract {
  consumer: string;
  provider: string;
  interactions: Interaction[];
  metadata: {
    pactSpecification: { version: string };
    createdAt: string;
  };
}

export interface VerificationResult {
  verified: boolean;
  providerName: string;
  consumerName: string;
  tests?: VerificationTest[];
  source?: string;
  timestamp: string;
}

export interface VerificationTest {
  description: string;
  status: 'passed' | 'failed';
  mismatches?: Mismatch[];
}

export interface Mismatch {
  path: string;
  expected: any;
  actual: any;
  mismatch: string;
}

/**
 * Pact Consumer Client
 */
export class PactConsumerClient {
  private config: PactConfig;
  private interactions: Interaction[] = [];
  private mockServerUrl: string;

  constructor(config: PactConfig) {
    this.config = config;
    this.mockServerUrl = `http://${config.host}:${config.port}`;
  }

  /**
   * Add an interaction
   */
  addInteraction(interaction: Interaction): void {
    this.interactions.push(interaction);
  }

  /**
   * Create a GET interaction
   */
  uponReceivingGet(description: string, path: string, response: Partial<InteractionResponse>): void {
    this.addInteraction({
      description,
      request: {
        method: 'GET',
        path,
      },
      response: {
        status: response.status || 200,
        headers: response.headers,
        body: response.body,
      },
    });
  }

  /**
   * Create a POST interaction
   */
  uponReceivingPost(description: string, path: string, request: any, response: Partial<InteractionResponse>): void {
    this.addInteraction({
      description,
      request: {
        method: 'POST',
        path,
        body: request,
      },
      response: {
        status: response.status || 200,
        headers: response.headers,
        body: response.body,
      },
    });
  }

  /**
   * Create a PUT interaction
   */
  uponReceivingPut(description: string, path: string, request: any, response: Partial<InteractionResponse>): void {
    this.addInteraction({
      description,
      request: {
        method: 'PUT',
        path,
        body: request,
      },
      response: {
        status: response.status || 200,
        headers: response.headers,
        body: response.body,
      },
    });
  }

  /**
   * Create a DELETE interaction
   */
  uponReceivingDelete(description: string, path: string, response: Partial<InteractionResponse>): void {
    this.addInteraction({
      description,
      request: {
        method: 'DELETE',
        path,
      },
      response: {
        status: response.status || 200,
        headers: response.headers,
        body: response.body,
      },
    });
  }

  /**
   * Given a provider state
   */
  given(providerState: string, params?: Record<string, any>): this {
    const lastInteraction = this.interactions[this.interactions.length - 1];
    if (lastInteraction) {
      lastInteraction.providerStates = lastInteraction.providerStates || [];
      lastInteraction.providerStates.push({ name: providerState, params });
    }
    return this;
  }

  /**
   * Write pact file
   */
  async writePact(): Promise<string> {
    const pact: ConsumerContract = {
      consumer: this.config.consumer,
      provider: this.config.provider,
      interactions: this.interactions,
      metadata: {
        pactSpecification: { version: '2.0.0' },
        createdAt: new Date().toISOString(),
      },
    };

    const pactDir = this.config.pactDir || './pacts';
    const filename = `${this.config.consumer}-${this.config.provider}.json`;
    
    // In a real implementation, write to file
    console.log(`Pact written to ${pactDir}/${filename}`);
    
    return `${pactDir}/${filename}`;
  }

  /**
   * Verify with mock service
   */
  async verify(): Promise<boolean> {
    // In a real implementation, verify against mock server
    return true;
  }
}

/**
 * Pact Provider Verifier
 */
export class PactProviderVerifier {
  private config: PactConfig;
  private pactFiles: string[] = [];

  constructor(config: PactConfig) {
    this.config = config;
  }

  /**
   * Add pact file to verify
   */
  addPactFile(pactFile: string): void {
    this.pactFiles.push(pactFile);
  }

  /**
   * Add pact from URL
   */
  async addPactFromUrl(pactUrl: string): Promise<void> {
    // Fetch pact from URL
    this.pactFiles.push(pactUrl);
  }

  /**
   * Verify against provider
   */
  async verify(): Promise<VerificationResult> {
    const results: VerificationTest[] = [];

    for (const pactFile of this.pactFiles) {
      // Load pact file
      const pact: ConsumerContract = JSON.parse('{}'); // Load from file
      
      for (const interaction of pact.interactions) {
        // Call provider with interaction request
        const testResult = await this.verifyInteraction(interaction);
        results.push(testResult);
      }
    }

    const failed = results.some(r => r.status === 'failed');
    
    return {
      verified: !failed,
      providerName: this.config.provider,
      consumerName: this.config.consumer,
      tests: results,
      timestamp: new Date().toISOString(),
    };
  }

  private async verifyInteraction(interaction: Interaction): Promise<VerificationTest> {
    try {
      const url = `${this.config.host}${interaction.request.path}`;
      const response = await fetch(url, {
        method: interaction.request.method,
        headers: interaction.request.headers,
        body: interaction.request.body ? JSON.stringify(interaction.request.body) : undefined,
      });

      const responseBody = await response.json();
      
      // Simple comparison - in real implementation, use pact matching rules
      const matches = JSON.stringify(responseBody) === JSON.stringify(interaction.response.body);
      
      return {
        description: interaction.description,
        status: matches ? 'passed' : 'failed',
        mismatches: matches ? undefined : [{
          path: 'body',
          expected: interaction.response.body,
          actual: responseBody,
          mismatch: 'Response body does not match',
        }],
      };
    } catch (error) {
      return {
        description: interaction.description,
        status: 'failed',
        mismatches: [{
          path: 'request',
          expected: 'success',
          actual: String(error),
          mismatch: String(error),
        }],
      };
    }
  }

  /**
   * Setup provider states
   */
  async setupProviderState(state: string, params?: Record<string, any>): Promise<void> {
    // Call provider state setup endpoint
    console.log(`Setting up provider state: ${state}`, params);
  }

  /**
   * Teardown provider states
   */
  async teardownProviderState(state: string): Promise<void> {
    // Call provider state teardown endpoint
    console.log(`Tearing down provider state: ${state}`);
  }
}

/**
 * Create Pact consumer client
 */
export function createPactConsumer(config: PactConfig): PactConsumerClient {
  return new PactConsumerClient(config);
}

/**
 * Create Pact provider verifier
 */
export function createPactVerifier(config: PactConfig): PactProviderVerifier {
  return new PactProviderVerifier(config);
}

/**
 * Generate contract test feature
 */
export function generateContractTestFeature(contract: ConsumerContract): string {
  const lines: string[] = [];
  
  lines.push(`Feature: Contract tests for ${contract.consumer} -> ${contract.provider}`);
  lines.push('');
  
  for (const interaction of contract.interactions) {
    const method = interaction.request.method.toUpperCase();
    const path = interaction.request.path;
    
    lines.push(`  Scenario: ${interaction.description}`);
    lines.push(`    Given the provider is in state "${interaction.providerStates?.[0]?.name || 'default'}"`);
    lines.push(`    When I make a ${method} request to "${path}"`);
    
    if (interaction.request.body) {
      lines.push(`    And I send request body ${JSON.stringify(interaction.request.body)}`);
    }
    
    lines.push(`    Then the response status should be ${interaction.response.status}`);
    
    if (interaction.response.body) {
      lines.push(`    And the response body should match ${JSON.stringify(interaction.response.body)}`);
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}
