import { mkdir, writeFile } from 'fs/promises';

export class HopInitializer {
  /**
   * Initialize a new Hop project
   */
  async init(projectName: string): Promise<void> {
    console.log(`Initializing Hop project: ${projectName}`);
    
    // Create directory structure
    const dirs = [
      projectName,
      `${projectName}/features`,
      `${projectName}/steps`,
      `${projectName}/hooks`,
      `${projectName}/config`,
      `${projectName}/reports`,
    ];
    
    for (const dir of dirs) {
      await mkdir(dir, { recursive: true });
      console.log(`Created: ${dir}/`);
    }
    
    // Create package.json
    const packageJson = {
      name: projectName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        test: 'hop test',
        'hop': 'hop'
      },
      dependencies: {
        hop: '^1.0.0'
      }
    };
    
    await writeFile(
      `${projectName}/package.json`,
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );
    console.log(`Created: ${projectName}/package.json`);
    
    // Create .gitignore
    const gitignore = `node_modules/
reports/
.env
*.log
`;
    
    await writeFile(`${projectName}/.gitignore`, gitignore, 'utf-8');
    console.log(`Created: ${projectName}/.gitignore`);
    
    // Create .env.example
    const envExample = `# Environment variables
BASE_URL=https://api.example.com
API_KEY=your-api-key-here
`;
    
    await writeFile(`${projectName}/.env.example`, envExample, 'utf-8');
    console.log(`Created: ${projectName}/.env.example`);
    
    // Create sample feature file
    const sampleFeature = `Feature: Sample API Test

  Background:
    Given url '\${BASE_URL}'
    And header Content-Type = 'application/json'

  Scenario: Get User Details
    Given path '/users/1'
    When method GET
    Then status 200
    And match response == { id: '#number', name: '#string', email: '#email' }

  Scenario: Create New User
    Given path '/users'
    And request { name: 'Test User', email: 'test@example.com' }
    When method POST
    Then status 201
    And match response == { id: '#number', name: 'Test User' }
`;
    
    await writeFile(`${projectName}/features/sample.feature`, sampleFeature, 'utf-8');
    console.log(`Created: ${projectName}/features/sample.feature`);
    
    // Create hop.config.ts
    const configFile = `// hop.config.ts
export default {
  features: './features',
  steps: './steps',
  reports: './reports',
  format: ['html', 'junit'],
  timeout: 30000,
  retry: 2,
  parallel: 4,
  tags: {
    include: [],
    exclude: ['@manual']
  },
  headers: {
    'User-Agent': 'Hop/1.0'
  }
}
`;
    
    await writeFile(`${projectName}/config/hop.config.ts`, configFile, 'utf-8');
    console.log(`Created: ${projectName}/config/hop.config.ts`);
    
    // Create custom steps template
    const customSteps = `// steps/custom-steps.ts
// Define custom step definitions here

export default {
  // Example: Custom step
  // 'Given I am logged in as user {string}': async (step, context) => {
  //   const username = step.text.match(/user '(.+)'/)?.[1];
  //   // Implement your step logic
  // }
}
`;
    
    await writeFile(`${projectName}/steps/custom-steps.ts`, customSteps, 'utf-8');
    console.log(`Created: ${projectName}/steps/custom-steps.ts`);
    
    console.log('');
    console.log('✅ Project initialized successfully!');
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npm test');
    console.log('');
  }
}
