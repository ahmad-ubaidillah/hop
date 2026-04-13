#!/usr/bin/env bun
/**
 * create-hop - Project creation wizard
 * Interactive setup for new Hop projects
 */

import * as p from '@clack/prompts';
import color from 'picocolors';
import { mkdir, writeFile, stat, readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';

const HOP_VERSION = '1.0.0';
const HOP_LOGO = `
${color.cyan('██╗  ██╗ ██████╗')} ${color.magenta('██╗  ██╗███████╗██████╗ ')}
${color.cyan('██║  ██║██╔═══██╗')} ${color.magenta('██║ ██╔╝██╔════╝██╔══██╗')}
${color.cyan('███████║██║   ██║')} ${color.magenta('█████╔╝ █████╗  ██████╔╝')}
${color.cyan('██╔══██║██║   ██║')} ${color.magenta('██╔═██╗ ██╔══╝  ██╔══██╗')}
${color.cyan('██║  ██║╚██████╔╝')} ${color.magenta('██║  ██╗███████╗██║  ██║')}
${color.cyan('╚═╝  ╚═╝ ╚═════╝ ')} ${color.magenta('╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝')}
`;

export async function createProject(projectName: string): Promise<void> {
  console.log(HOP_LOGO);
  console.log(color.dim(`  High-Performance BDD Automation Testing Framework v${HOP_VERSION}`));
  console.log('');

  const projectPath = join(process.cwd(), projectName);

  // Check if directory exists
  if (existsSync(projectPath)) {
    console.log(color.red(`❌ Directory "${projectName}" already exists!`));
    process.exit(1);
  }

  const s = p.spinner();

  // ========================================
  // STEP 1: Project Setup
  // ========================================
  console.log(color.cyan('┌') + color.cyan('──────────────────────────────────────'));
  console.log(color.cyan('│') + color.bold('  🎯 Project Configuration'));
  console.log(color.cyan('└') + color.cyan('──────────────────────────────────────'));
  console.log('');

  const config = await p.group(
    {
      projectType: () =>
        p.select({
          message: 'What type of testing do you want to do?',
          options: [
            { value: 'api', label: '🌐 API Testing', hint: 'REST/GraphQL API automation' },
            { value: 'e2e', label: '🖥️ E2E/UI Testing', hint: 'Browser automation with Playwright' },
            { value: 'full', label: '🚀 Full Stack (API + E2E)', hint: 'Complete testing solution' },
            { value: 'load', label: '⚡ Load Testing', hint: 'Performance testing with K6' },
          ],
          initialValue: 'api',
        }),
      language: () =>
        p.select({
          message: 'Which language do you prefer?',
          options: [
            { value: 'ts', label: 'TypeScript', hint: 'Recommended for better IDE support' },
            { value: 'js', label: 'JavaScript', hint: 'Simpler setup, no types' },
          ],
          initialValue: 'ts',
        }),
      framework: () =>
        p.select({
          message: 'Which test runner do you want to use?',
          options: [
            { value: 'bun', label: '⚡ Bun (Fast)', hint: 'Blazing fast test execution' },
            { value: 'vitest', label: '🧪 Vitest', hint: 'Vite-native test runner' },
            { value: 'node', label: '📦 Node.js', hint: 'Standard Node.js setup' },
          ],
          initialValue: 'bun',
        }),
      installDeps: () =>
        p.confirm({
          message: 'Install dependencies?',
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        console.log(color.red('\n❌ Setup cancelled.'));
        process.exit(0);
      },
    }
  );

  console.log('');
  console.log(color.cyan('┌') + color.cyan('──────────────────────────────────────'));
  console.log(color.cyan('│') + color.bold('  📁 Creating Project Structure'));
  console.log(color.cyan('└') + color.cyan('──────────────────────────────────────'));
  console.log('');

  s.start('Creating directories...');

  // Create folder structure - Cypress-like clean structure
  const dirs = [
    projectName,
    `${projectName}/hop`,
    `${projectName}/hop/e2e`,
    `${projectName}/hop/fixtures`,
    `${projectName}/hop/support`,
  ];

  if (config.projectType === 'e2e' || config.projectType === 'full') {
    dirs.push(`${projectName}/hop/screenshots`);
    dirs.push(`${projectName}/hop/videos`);
  }

  for (const dir of dirs) {
    await mkdir(join(process.cwd(), dir), { recursive: true });
  }

  s.stop('Directories created');

  // ========================================
  // STEP 2: Create Configuration Files
  // ========================================
  s.start('Creating configuration files...');

  // hop.config.ts
  const hopConfig = `// Hop Configuration
// https://github.com/ahmad-ubaidillah/hop

export default {
  // Feature files location
  features: './hop/e2e/**/*.feature',
  
  // Custom step definitions
  steps: './hop/support/steps.${config.language}',
  
  // Hooks
  hooks: './hop/support/hooks.${config.language}',
  
  // Fixtures
  fixtures: './hop/fixtures',
  
  // Reports output
  reports: './hop/reports',
  
  // Output formats
  format: ['console', 'html'],
  
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
  
  // Screenshots configuration (for E2E)
  screenshots: {
    enabled: true,
    onFailure: true,
    path: './hop/screenshots',
  },
  
  // Logging
  logging: {
    verbose: false,
    debug: false,
  },
};
`;

  await writeFile(join(projectPath, 'hop.config.ts'), hopConfig);

  // package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: `Hop BDD tests for ${projectName}`,
    type: 'module',
    scripts: {
      'hop': 'hop',
      'hop:open': 'hop open',
      'hop:run': 'hop test',
      'hop:report': 'hop report',
      test: 'hop test',
    },
    devDependencies: {
      'hop-framework': `^${HOP_VERSION}`,
    },
  };

  if (config.language === 'ts') {
    packageJson.devDependencies['typescript'] = '^5.3.0';
    packageJson.devDependencies['@types/node'] = '^20.0.0';
  }

  if (config.projectType === 'e2e' || config.projectType === 'full') {
    packageJson.devDependencies['playwright'] = '^1.40.0';
  }

  await writeFile(
    join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  s.stop('Configuration files created');

  // ========================================
  // STEP 3: Create Support Files
  // ========================================
  s.start('Creating support files...');

  // hooks.ts
  const hooksFile = `// Hop Hooks
// Run code before/after tests

import { BeforeAll, AfterAll, Before, After } from 'hop-framework';

// Runs once before all tests
BeforeAll(async () => {
  console.log('🚀 Starting test suite...');
});

// Runs once after all tests
AfterAll(async () => {
  console.log('✅ Test suite completed!');
});

// Runs before each scenario
Before(async (context) => {
  // Setup test context
  context.startTime = Date.now();
});

// Runs after each scenario
After(async (context, result) => {
  const duration = Date.now() - context.startTime;
  console.log(\`  ⏱️ Duration: \${duration}ms\`);
});
`;

  await writeFile(
    join(projectPath, 'hop', 'support', `hooks.${config.language}`),
    hooksFile
  );

  // steps.ts - Custom step definitions
  const stepsFile = `// Hop Custom Step Definitions
// Define your custom steps here

import { Given, When, Then } from 'hop-framework';

// ========================================
// URL & Path Steps
// ========================================

Given('url {string}', (url) => {
  // Set base URL
  console.log('Setting base URL:', url);
});

Given('path {string}', (path) => {
  // Set endpoint path
  console.log('Setting path:', path);
});

// ========================================
// HTTP Method Steps
// ========================================

When('method GET', async () => {
  // Perform GET request
  console.log('Performing GET request');
});

When('method POST', async () => {
  // Perform POST request
  console.log('Performing POST request');
});

When('method PUT', async () => {
  // Perform PUT request
  console.log('Performing PUT request');
});

When('method DELETE', async () => {
  // Perform DELETE request
  console.log('Performing DELETE request');
});

// ========================================
// Response Validation Steps
// ========================================

Then('status {int}', (status) => {
  // Validate response status code
  console.log('Validating status:', status);
});

Then('match response contains {string}', (key) => {
  // Validate response contains key
  console.log('Checking for key:', key);
});

// Add your custom steps below...
`;

  await writeFile(
    join(projectPath, 'hop', 'support', `steps.${config.language}`),
    stepsFile
  );

  s.stop('Support files created');

  // ========================================
  // STEP 4: Create Example Fixtures
  // ========================================
  s.start('Creating example fixtures...');

  // example.json fixture
  const fixtureData = {
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    },
    product: {
      id: 101,
      name: 'Test Product',
      price: 99.99,
    },
  };

  await writeFile(
    join(projectPath, 'hop', 'fixtures', 'example.json'),
    JSON.stringify(fixtureData, null, 2)
  );

  // users.json for data-driven testing
  const usersFixture = [
    { id: 1, name: 'User 1', email: 'user1@test.com' },
    { id: 2, name: 'User 2', email: 'user2@test.com' },
    { id: 3, name: 'User 3', email: 'user3@test.com' },
  ];

  await writeFile(
    join(projectPath, 'hop', 'fixtures', 'users.json'),
    JSON.stringify(usersFixture, null, 2)
  );

  s.stop('Example fixtures created');

  // ========================================
  // STEP 5: Create Example Features
  // ========================================
  s.start('Creating example feature files...');

  // API Testing example
  if (config.projectType === 'api' || config.projectType === 'full') {
    const apiFeature = `# API Testing Example
# This example uses JSONPlaceholder (https://jsonplaceholder.typicode.com)

Feature: API Testing - Posts API

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  @api @smoke
  Scenario: Get all posts
    Given path '/posts'
    When method GET
    Then status 200
    And match response is array
    And response time < 1000ms

  @api @smoke
  Scenario: Get single post by ID
    Given path '/posts/1'
    When method GET
    Then status 200
    And match response.id == 1
    And match response.title == #string
    And match response.body == #string

  @api @crud
  Scenario: Create a new post
    Given path '/posts'
    And request
      """
      {
        "title": "Test Post",
        "body": "This is a test post body",
        "userId": 1
      }
      """
    When method POST
    Then status 201
    And match response.title == 'Test Post'
    And match response.id == #number

  @api @crud
  Scenario: Update an existing post
    Given path '/posts/1'
    And request
      """
      {
        "id": 1,
        "title": "Updated Title",
        "body": "Updated body content",
        "userId": 1
      }
      """
    When method PUT
    Then status 200
    And match response.title == 'Updated Title'

  @api @crud
  Scenario: Delete a post
    Given path '/posts/1'
    When method DELETE
    Then status 200

  @api @validation
  Scenario Outline: Get post with different IDs
    Given path '/posts/<id>'
    When method GET
    Then status <status>
    
    Examples:
      | id | status |
      | 1  | 200    |
      | 2  | 200    |
      | 99 | 200    |

  @api @performance
  Scenario: Check API response time
    Given path '/posts'
    When method GET
    Then status 200
    And response time < 500ms
`;

    await writeFile(join(projectPath, 'hop', 'e2e', 'api-posts.feature'), apiFeature);

    // Users API example
    const usersFeature = `# Users API Testing Example

Feature: API Testing - Users API

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  @api @smoke
  Scenario: Get all users
    Given path '/users'
    When method GET
    Then status 200
    And match response is array
    And match response[0].name == #string
    And match response[0].email == #email

  @api @smoke
  Scenario: Get user by ID
    Given path '/users/1'
    When method GET
    Then status 200
    And match response contains 'name'
    And match response contains 'email'
    And match response contains 'phone'
    And match response.company.name == #string

  @api @data-driven
  Scenario Outline: Validate user emails
    Given path '/users/<id>'
    When method GET
    Then status 200
    And match response.email == #email
    
    Examples:
      | id |
      | 1  |
      | 2  |
      | 3  |
      | 5  |
`;

    await writeFile(join(projectPath, 'hop', 'e2e', 'api-users.feature'), usersFeature);
  }

  // E2E/UI Testing example
  if (config.projectType === 'e2e' || config.projectType === 'full') {
    const e2eFeature = `# E2E/UI Testing Example
# Uses SauceDemo (https://www.saucedemo.com)

Feature: E2E Testing - Login Flow

  Background:
    Given I open browser 'chromium'
    And I navigate to 'https://www.saucedemo.com'

  @ui @login @smoke
  Scenario: Successful login with valid credentials
    When I fill '#user-name' with 'standard_user'
    And I fill '#password' with 'secret_sauce'
    And I click '#login-button'
    Then I should see '.inventory_list'
    And URL should contain '/inventory.html'
    And I take screenshot 'login-success'

  @ui @login
  Scenario: Login fails with invalid credentials
    When I fill '#user-name' with 'invalid_user'
    And I fill '#password' with 'wrong_password'
    And I click '#login-button'
    Then I should see '.error-message-container'
    And I should see text 'Epic sadface'

  @ui @login @data-driven
  Scenario Outline: Login with different users
    When I fill '#user-name' with '<username>'
    And I fill '#password' with '<password>'
    And I click '#login-button'
    Then I should <result>
    
    Examples:
      | username        | password     | result              |
      | standard_user   | secret_sauce | see '.inventory_list' |
      | locked_out_user | secret_sauce | see '.error-message'  |

Feature: E2E Testing - Shopping Cart

  Background:
    Given I open browser 'chromium'
    And I navigate to 'https://www.saucedemo.com'
    And I login as 'standard_user'

  @ui @cart @smoke
  Scenario: Add item to cart
    When I click '[data-test="add-to-cart-sauce-labs-backpack"]'
    Then cart badge should show '1'
    And I click '.shopping_cart_link'
    Then I should see '.cart_item'

  @ui @cart
  Scenario: Remove item from cart
    Given I add 'Sauce Labs Backpack' to cart
    When I click '.shopping_cart_link'
    And I click '[data-test="remove-sauce-labs-backpack"]'
    Then cart should be empty
`;

    await writeFile(join(projectPath, 'hop', 'e2e', 'ui-login.feature'), e2eFeature);
  }

  // Load Testing example
  if (config.projectType === 'load') {
    const loadFeature = `# Load Testing Example
# Run with: hop test --tags @load

Feature: Load Testing - API Performance

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And concurrency 10
    And duration '30s'
    And ramp up '5s'

  @load @api
  Scenario: Load test GET /posts
    Given path '/posts'
    When load test GET '/posts'
    Then average response time < 500ms
    And error rate < 1%
    And throughput > 50 req/s
    And print performance metrics

  @load @api
  Scenario: Load test POST /posts
    Given path '/posts'
    And request
      """
      {
        "title": "Load Test",
        "body": "Testing under load",
        "userId": 1
      }
      """
    When load test POST '/posts'
    Then average response time < 600ms
    And error rate < 2%
    And SLA response time met
    And SLA availability met
`;

    await writeFile(join(projectPath, 'hop', 'e2e', 'load-test.feature'), loadFeature);
  }

  s.stop('Example feature files created');

  // ========================================
  // STEP 6: Create Additional Files
  // ========================================
  s.start('Creating additional files...');

  // .gitignore
  const gitignore = `# Dependencies
node_modules/

# Hop
hop/reports/
hop/screenshots/
hop/videos/

# Environment
.env
.env.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Build
dist/
`;

  await writeFile(join(projectPath, '.gitignore'), gitignore);

  // .env.example
  const envExample = `# Environment Variables
# Copy this file to .env and fill in your values

# API Configuration
BASE_URL=https://api.example.com
API_KEY=your-api-key-here

# Authentication
AUTH_TOKEN=your-auth-token

# Test Users
TEST_USERNAME=testuser
TEST_PASSWORD=testpass123

# Browser (for E2E)
BROWSER=chromium
HEADLESS=true
`;

  await writeFile(join(projectPath, '.env.example'), envExample);

  // tsconfig.json for TypeScript projects
  if (config.language === 'ts') {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        outDir: './dist',
        rootDir: '.',
      },
      include: ['hop/**/*', 'hop.config.ts'],
      exclude: ['node_modules', 'dist'],
    };

    await writeFile(
      join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
  }

  // README.md
  const readme = `# ${projectName}

BDD automation testing with Hop Framework.

## Getting Started

### Open Hop GUI
\`\`\`bash
npx hop open
\`\`\`

### Run Tests
\`\`\`bash
npx hop test
\`\`\`

### Run Specific Tests
\`\`\`bash
# By tag
npx hop test --tags @smoke

# By file
npx hop test hop/e2e/api-posts.feature
\`\`\`

### View Reports
\`\`\`bash
npx hop report
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── hop/
│   ├── e2e/              # Feature files
│   │   ├── api-posts.feature
│   │   └── ui-login.feature
│   ├── fixtures/         # Test data
│   │   └── example.json
│   ├── support/          # Step definitions & hooks
│   │   ├── steps.ts
│   │   └── hooks.ts
│   ├── screenshots/      # Screenshots (auto-generated)
│   └── reports/          # Test reports (auto-generated)
├── hop.config.ts         # Configuration
└── package.json
\`\`\`

## Documentation

- [Hop Documentation](https://github.com/ahmad-ubaidillah/hop)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/)
- [Best Practices](https://github.com/ahmad-ubaidillah/hop/wiki)

## License

MIT
`;

  await writeFile(join(projectPath, 'README.md'), readme);

  s.stop('Additional files created');

  // ========================================
  // STEP 7: Install Dependencies
  // ========================================
  if (config.installDeps) {
    console.log('');
    s.start('Installing dependencies...');

    try {
      process.chdir(projectPath);

      if (config.framework === 'bun') {
        execSync('bun install', { stdio: 'inherit' });
      } else {
        execSync('npm install', { stdio: 'inherit' });
      }

      s.stop('Dependencies installed');
    } catch (error) {
      s.stop('Failed to install dependencies');
      console.log(color.yellow('\n⚠️  Could not install dependencies automatically.'));
      console.log(color.yellow('   Please run manually: npm install'));
    }
  }

  // ========================================
  // FINAL: Success Message
  // ========================================
  console.log('');
  console.log(color.green('┌') + color.green('──────────────────────────────────────'));
  console.log(color.green('│') + color.bold('  ✅ Project Created Successfully!'));
  console.log(color.green('└') + color.green('──────────────────────────────────────'));
  console.log('');
  console.log(color.dim('  Project: ') + color.cyan(projectName));
  console.log(color.dim('  Type: ') + color.cyan(config.projectType.toUpperCase()));
  console.log(color.dim('  Language: ') + color.cyan(config.language.toUpperCase()));
  console.log('');
  console.log(color.bold('  Next Steps:'));
  console.log('');
  console.log(color.dim('  1.') + ' cd ' + projectName);
  if (!config.installDeps) {
    console.log(color.dim('  2.') + ' npm install');
  }
  console.log(color.dim('  ' + (config.installDeps ? '2' : '3') + '.') + ' ' + color.magenta('npx hop open') + color.dim('  (Open GUI)'));
  console.log(color.dim('  ' + (config.installDeps ? '3' : '4') + '.') + ' ' + color.magenta('npx hop test') + color.dim('   (Run tests)'));
  console.log('');
  console.log(color.dim('  ─────────────────────────────────'));
  console.log(color.dim('  Documentation: ') + color.cyan('https://github.com/ahmad-ubaidillah/hop'));
  console.log('');
}

