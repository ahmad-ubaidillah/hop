/**
 * k6 Script Generator for Hop BDD Framework
 * Transpiles Gherkin scenarios to k6 load test scripts
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Feature, Scenario, Step } from '../types/index.js';
import { GherkinParser } from '../parser/gherkin-parser.js';

export interface K6GeneratorOptions {
  vus?: number;
  duration?: string;
  rampUp?: string;
  rampDown?: string;
}

export class K6Generator {
  private parser: GherkinParser;
  
  constructor() {
    this.parser = new GherkinParser();
  }
  
  /**
   * Generate k6 script from feature files
   */
  async generate(featuresPath: string, outputPath: string, options: K6GeneratorOptions = {}): Promise<void> {
    const {
      vus = 10,
      duration = '30s',
      rampUp = '10s',
      rampDown = '10s'
    } = options;
    
    // Discover and parse feature files
    const featureFiles = await this.parser.discoverFeatures(featuresPath);
    const features = await this.parser.parseFeatures(featureFiles);
    
    // Generate k6 script
    const k6Script = this.generateK6Script(features, { vus, duration, rampUp, rampDown });
    
    // Write to file
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, k6Script, 'utf-8');
    console.log(`✅ k6 script generated: ${outputPath}`);
    console.log(`   VUs: ${vus}, Duration: ${duration}`);
  }
  
  /**
   * Generate k6 script from features
   */
  private generateK6Script(features: Feature[], options: { vus: number; duration: string; rampUp: string; rampDown: string }): string {
    const { vus, duration, rampUp, rampDown } = options;
    
    // Extract HTTP calls from scenarios
    const httpCalls = this.extractHttpCalls(features);
    
    // Generate k6 script
    const script = `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Export options
export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '${rampUp}', target: ${vus} },
        { duration: '${duration}', target: ${vus} },
        { duration: '${rampDown}', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

// Default function
export default function() {
${this.generateRequests(httpCalls)}
}

// Helper functions
${this.generateHelperFunctions(httpCalls)}
`;
    
    return script;
  }
  
  /**
   * Extract HTTP calls from features
   */
  private extractHttpCalls(features: Feature[]): HttpCall[] {
    const calls: HttpCall[] = [];
    
    for (const feature of features) {
      for (const scenario of feature.scenarios) {
        const scenarioCalls = this.extractScenarioHttpCalls(scenario, feature.name);
        calls.push(...scenarioCalls);
      }
    }
    
    return calls;
  }
  
  /**
   * Extract HTTP calls from a scenario
   */
  private extractScenarioHttpCalls(scenario: Scenario, featureName: string): HttpCall[] {
    const calls: HttpCall[] = [];
    let currentUrl = '';
    let currentHeaders: Record<string, string> = {};
    let currentBody: any = null;
    let stepIndex = 0;
    
    for (const step of scenario.steps) {
      stepIndex++;
      const text = step.text;
      
      // Extract URL
      const urlMatch = text.match(/url ['"](.+)['"]/i);
      if (urlMatch) {
        currentUrl = urlMatch[1];
        continue;
      }
      
      // Extract path
      const pathMatch = text.match(/path ['"](.+)['"]/i);
      if (pathMatch) {
        currentUrl = currentUrl + pathMatch[1];
        continue;
      }
      
      // Extract header
      const headerMatch = text.match(/header (.+) = ['"](.+)['"]/i);
      if (headerMatch) {
        currentHeaders[headerMatch[1]] = headerMatch[2];
        continue;
      }
      
      // Extract request body
      const requestMatch = text.match(/request\s+(\{[\s\S]*\})/i);
      if (requestMatch) {
        try {
          currentBody = JSON.parse(requestMatch[1]);
        } catch {
          currentBody = requestMatch[1];
        }
        continue;
      }
      
      // Extract method and add HTTP call
      const methodMatch = text.match(/method (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/i);
      if (methodMatch) {
        const method = methodMatch[1].toUpperCase();
        
        calls.push({
          featureName,
          scenarioName: scenario.name,
          stepIndex,
          method,
          url: currentUrl,
          headers: { ...currentHeaders },
          body: currentBody,
        });
        
        // Reset for next call
        currentBody = null;
      }
    }
    
    return calls;
  }
  
  /**
   * Generate k6 request code
   */
  private generateRequests(calls: HttpCall[]): string {
    if (calls.length === 0) {
      return '  // No HTTP calls found in scenarios';
    }
    
    const requestCode: string[] = [];
    
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const callVar = `res${i}`;
      
      // Generate params
      let params = '';
      if (Object.keys(call.headers).length > 0) {
        params += `,\n    headers: ${JSON.stringify(call.headers)}`;
      }
      if (call.body) {
        params += `,\n    body: JSON.stringify(${JSON.stringify(call.body)})`;
      }
      
      requestCode.push(`
  // ${call.scenarioName}
  const ${callVar} = http.${call.method.toLowerCase()}('${call.url}'${params});
  
  check(${callVar}, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(${callVar}.status !== 200);
  
  sleep(1);`);
    }
    
    return requestCode.join('\n');
  }
  
  /**
   * Generate helper functions
   */
  private generateHelperFunctions(calls: HttpCall[]): string {
    // Extract unique URLs
    const uniqueUrls = [...new Set(calls.map(c => c.url))];
    
    if (uniqueUrls.length === 0) {
      return '';
    }
    
    const functions = [];
    
    // Generate base URL function if there are relative paths
    const hasRelativePaths = uniqueUrls.some(url => url.startsWith('/'));
    if (hasRelativePaths) {
      functions.push(`
function getBaseUrl() {
  return __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';
}`);
    }
    
    return functions.join('\n');
  }
}

interface HttpCall {
  featureName: string;
  scenarioName: string;
  stepIndex: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: any;
}
