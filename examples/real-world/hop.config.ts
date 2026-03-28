// Hop Configuration for Real-World Examples
export default {
  // Feature files location
  features: './examples/real-world/*.feature',
  
  // Custom step definitions
  steps: './examples/real-world/steps/*.ts',
  
  // Output directory for reports
  reports: './reports',
  
  // Report formats
  format: ['console', 'html', 'json'],
  
  // Test timeout (30 seconds)
  timeout: 30000,
  
  // Retry failed tests
  retry: 0,
  
  // Parallel execution
  parallel: 1,
  
  // Tag filtering
  tags: {
    include: [],
    exclude: ['@skip', '@wip'],
  },
  
  // Default headers for all requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Environment-specific configurations
  environments: {
    dev: {
      baseUrl: 'https://jsonplaceholder.typicode.com',
    },
    staging: {
      baseUrl: 'https://staging-api.example.com',
    },
    prod: {
      baseUrl: 'https://api.example.com',
    },
  },
  
  // Performance testing configuration
  performance: {
    concurrency: 10,
    duration: '30s',
    rampUp: '5s',
    thinkTime: '100ms',
    thresholds: {
      responseTime: 500,
      errorRate: 0.01,
    },
  },
  
  // Screenshot configuration
  screenshots: {
    enabled: true,
    onFailure: true,
    path: './reports/screenshots',
  },
  
  // Logging configuration
  logging: {
    verbose: false,
    debug: false,
    logRequests: true,
    logResponses: true,
  },
};
