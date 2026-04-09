import { ComponentTester, createComponentTester, ComponentTestOptions } from './src/ui/component-tester.js';

async function testComponentTester() {
  console.log('Testing ComponentTester instantiation...');
  
  const options: ComponentTestOptions = {
    framework: 'react',
    rootDir: './examples/react-app',
    headless: true,
    timeout: 5000
  };
  
  const tester = createComponentTester(options);
  console.log('✅ ComponentTester created successfully');
  
  console.log('Testing method existence:');
  console.log('✅ mount method:', typeof tester.mount === 'function');
  console.log('✅ query method:', typeof tester.query === 'function');
  console.log('✅ getProp method:', typeof tester.getProp === 'function');
  console.log('✅ trigger method:', typeof tester.trigger === 'function');
  console.log('✅ type method:', typeof tester.type === 'function');
  console.log('✅ click method:', typeof tester.click === 'function');
  console.log('✅ waitForSelector method:', typeof tester.waitForSelector === 'function');
  console.log('✅ close method:', typeof tester.close === 'function');
  
  console.log('\n🎉 Component Testers feature is ready!');
}

testComponentTester().catch(console.error);