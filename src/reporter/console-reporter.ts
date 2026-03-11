import type { Feature, TestResult } from '../types/index.js';

export class ConsoleReporter {
  /**
   * Print parsed features to console
   */
  printFeatures(features: Feature[]): void {
    for (const feature of features) {
      console.log(`📁 ${feature.name}`);
      
      if (feature.description) {
        console.log(`   ${feature.description}`);
      }
      
      if (feature.tags.length > 0) {
        console.log(`   Tags: @${feature.tags.join(' @')}`);
      }
      
      console.log('');
      
      for (const scenario of feature.scenarios) {
        const outline = scenario.outline ? ' (Outline)' : '';
        console.log(`   📝 ${scenario.name}${outline}`);
        
        if (scenario.tags.length > 0) {
          console.log(`      Tags: @${scenario.tags.join(' @')}`);
        }
        
        for (const step of scenario.steps) {
          console.log(`      ${step.keyword} ${step.text}`);
        }
        
        if (scenario.examples && scenario.examples.length > 0) {
          for (const example of scenario.examples) {
            console.log(`      Examples:`);
            console.log(`        | ${example.table.headers.join(' | ')} |`);
            for (const row of example.table.rows) {
              console.log(`        | ${row.join(' | ')} |`);
            }
          }
        }
        
        console.log('');
      }
      
      console.log('');
    }
  }
  
  /**
   * Print test results to console
   */
  printResults(results: TestResult[]): void {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log('═══════════════════════════════════════════════════');
    console.log('                    TEST RESULTS');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`  Total:   ${results.length}`);
    console.log(`  ✅ Passed:  ${passed}`);
    console.log(`  ❌ Failed:  ${failed}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ⏱️  Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('');
    
    // Print failed tests
    const failedTests = results.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('                    FAILED TESTS');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      
      for (const result of failedTests) {
        console.log(`❌ ${result.featureName} - ${result.scenarioName}`);
        console.log(`   Duration: ${result.duration}ms`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        
        // Find the failed step
        const failedStep = result.steps.find(s => s.status === 'failed');
        if (failedStep) {
          console.log(`   Failed at: ${failedStep.step.keyword} ${failedStep.step.text}`);
          if (failedStep.error) {
            console.log(`   Step Error: ${failedStep.error}`);
          }
        }
        console.log('');
      }
    }
    
    // Print passed tests summary
    if (passed > 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('                    PASSED TESTS');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      
      for (const result of results.filter(r => r.status === 'passed').slice(0, 20)) {
        console.log(`✅ ${result.featureName} - ${result.scenarioName} (${result.duration}ms)`);
      }
      
      if (passed > 20) {
        console.log(`... and ${passed - 20} more`);
      }
      
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════');
  }
  
  /**
   * Print a progress bar
   */
  private printProgress(current: number, total: number): void {
    const width = 40;
    const percent = current / total;
    const filled = Math.floor(width * percent);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r[${bar}] ${current}/${total} (${Math.round(percent * 100)}%)`);
  }
}
