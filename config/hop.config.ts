// Hop Configuration File

export default {
  // Path to features directory
  features: './features',
  
  // Path to custom steps directory
  steps: './steps',
  
  // Path to reports directory
  reports: './reports',
  
  // Output formats
  format: ['html', 'junit'],
  
  // Test timeout in milliseconds
  timeout: 30000,
  
  // Number of retries for failed tests
  retry: 2,
  
  // Number of parallel workers
  parallel: 4,
  
  // Tag filtering
  tags: {
    include: [],
    exclude: ['@manual', '@wip']
  },
  
  // Default headers for all requests
  headers: {
    'User-Agent': 'Hop/1.0'
  },
  
  // Environment-specific configuration
  environments: {
    test: {
      baseUrl: 'https://jsonplaceholder.typicode.com'
    },
    staging: {
      baseUrl: 'https://staging.api.example.com'
    },
    prod: {
      baseUrl: 'https://api.example.com'
    }
  }
}
