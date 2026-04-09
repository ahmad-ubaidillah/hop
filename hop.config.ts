import { defineConfig } from 'hop';

export default defineConfig({
  testDir: './tests',
  
  gherkinPatterns: [
    '**/*.feature',
    '**/features/**/*.feature'
  ],
  
  specPatterns: [
    '**/*.spec.ts',
    '**/*.spec.js',
    '**/*.test.ts',
    '**/*.test.js'
  ],
  
  stepsDir: './steps',
  
  timeout: 30000,
  
  retries: {
    openMode: 0,
    runMode: 2
  },
  
  browser: {
    type: 'chromium',
    headless: true,
    viewport: {
      width: 1280,
      height: 720
    }
  },
  
  video: 'on-failure',
  screenshotOnFailure: true,
  
  reporters: [
    'list',
    'json',
    'html'
  ],
  
  baseUrl: 'https://demo.playwright.dev',
  
  env: {
    API_URL: 'https://api.example.com',
    ADMIN_USER: 'admin',
    ADMIN_PASS: 'secret'
  },
  
  devices: [
    'iPhone 12',
    'iPad Pro 11',
    'Pixel 5'
  ]
});