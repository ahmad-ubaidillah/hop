// Load Testing Configuration for Hop Framework
// Run with: bun run examples/load-testing/load-test.ts

interface LoadTestConfig {
  targetUrl: string;
  virtualUsers: number;
  duration: number; // seconds
  rampUp: number; // seconds
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  weight: number;
  body?: Record<string, unknown>;
}

const config: LoadTestConfig = {
  targetUrl: process.env.LOAD_TEST_URL || 'https://api.example.com',
  virtualUsers: 50,
  duration: 60,
  rampUp: 10,
  scenarios: [
    {
      name: 'Get Users',
      path: '/api/users',
      method: 'GET',
      weight: 40
    },
    {
      name: 'Get Products',
      path: '/api/products',
      method: 'GET',
      weight: 30
    },
    {
      name: 'Create Order',
      path: '/api/orders',
      method: 'POST',
      weight: 20,
      body: { customerId: 1, items: [] }
    },
    {
      name: 'Search',
      path: '/api/search',
      method: 'GET',
      weight: 10
    }
  ]
};

export async function runLoadTest(): Promise<void> {
  console.log('Starting load test...');
  console.log(`Target: ${config.targetUrl}`);
  console.log(`Virtual Users: ${config.virtualUsers}`);
  console.log(`Duration: ${config.duration}s`);
  console.log('');

  const startTime = Date.now();
  const results: LoadTestResult[] = [];
  let activeUsers = 0;

  // Simulate load test
  for (let i = 0; i < config.virtualUsers; i++) {
    activeUsers++;
    
    setTimeout(async () => {
      const scenario = getRandomScenario();
      const result = await executeScenario(scenario);
      results.push(result);
      
      activeUsers--;
    }, Math.random() * config.rampUp * 1000);
  }

  // Wait for completion
  await new Promise(resolve => setTimeout(resolve, config.duration * 1000 + 5000));

  // Generate report
  generateReport(results, Date.now() - startTime);
}

function getRandomScenario(): LoadTestScenario {
  const totalWeight = config.scenarios.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const scenario of config.scenarios) {
    random -= scenario.weight;
    if (random <= 0) return scenario;
  }
  
  return config.scenarios[0];
}

async function executeScenario(scenario: LoadTestScenario): Promise<LoadTestResult> {
  const start = Date.now();
  
  try {
    const response = await fetch(`${config.targetUrl}${scenario.path}`, {
      method: scenario.method,
      headers: { 'Content-Type': 'application/json' },
      body: scenario.body ? JSON.stringify(scenario.body) : undefined
    });
    
    return {
      scenario: scenario.name,
      status: response.status,
      duration: Date.now() - start,
      success: response.ok
    };
  } catch (error) {
    return {
      scenario: scenario.name,
      status: 0,
      duration: Date.now() - start,
      success: false,
      error: String(error)
    };
  }
}

interface LoadTestResult {
  scenario: string;
  status: number;
  duration: number;
  success: boolean;
  error?: string;
}

function generateReport(results: LoadTestResult[], totalTime: number): void {
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  
  console.log('\n=== Load Test Results ===');
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((successful / results.length) * 100).toFixed(2)}%`);
  console.log(`\nResponse Times:`);
  console.log(`  Min: ${durations[0]}ms`);
  console.log(`  Max: ${durations[durations.length - 1]}ms`);
  console.log(`  Avg: ${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)}ms`);
  console.log(`  P50: ${durations[Math.floor(durations.length * 0.5)]}ms`);
  console.log(`  P95: ${durations[Math.floor(durations.length * 0.95)]}ms`);
  console.log(`  P99: ${durations[Math.floor(durations.length * 0.99)]}ms`);
  console.log(`\nThroughput: ${(results.length / (totalTime / 1000)).toFixed(2)} req/s`);
}

// Run if called directly
runLoadTest().catch(console.error);
