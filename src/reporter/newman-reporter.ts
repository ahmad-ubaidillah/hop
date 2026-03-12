import type { TestResult, StepResult, TestContext } from '../types/index.js';
import { writeFile, mkdir, copyFile } from 'fs/promises';
import { join, basename } from 'path';
import { TestResultCollector } from '../engine/test-result-collector.js';
import { NewmanReportBuilder } from './formatters/newman-report-builder.js';

/**
 * NewmanReporter: Generates the Newman-style HTML report.
 */
export class NewmanReporter {
  private outputDir: string;

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
  }

  /**
   * Generate the Newman-style HTML report
   */
  async generate(results: TestResult[], collector: TestResultCollector): Promise<string> {
    const reportPath = this.outputDir;
    await mkdir(reportPath, { recursive: true });

    const mediaResults = await this.bundleMedia(results, reportPath);
    
    const timestamp = new Date().toISOString();
    const html = NewmanReportBuilder.buildHtmlReport(mediaResults, timestamp);
    const finalPath = join(reportPath, 'index.html');
    await writeFile(finalPath, html, 'utf-8');
    
    return finalPath;
  }

  /**
   * Copy screenshots and videos to the report directory
   */
  private async bundleMedia(results: TestResult[], reportDir: string): Promise<TestResult[]> {
    const assetsDir = join(reportDir, 'assets');
    await mkdir(assetsDir, { recursive: true });

    const bundledResults = [];
    for (const result of results) {
      const newResult = { ...result, steps: [...result.steps] };
      
      if (result.screenshotPath) {
        try {
          const name = basename(result.screenshotPath);
          const dest = join(assetsDir, name);
          await copyFile(result.screenshotPath, dest);
          newResult.screenshotPath = `assets/${name}`;
        } catch (e) {
          newResult.screenshotPath = undefined;
        }
      }

      if (result.videoPath) {
        try {
          const name = basename(result.videoPath);
          const dest = join(assetsDir, name);
          await copyFile(result.videoPath, dest);
          newResult.videoPath = `assets/${name}`;
        } catch (e) {
          newResult.videoPath = undefined;
        }
      }

      // Handle step-level media
      for (let i = 0; i < newResult.steps.length; i++) {
        const step = { ...newResult.steps[i] };
        if (step.screenshotPath) {
          try {
            const name = basename(step.screenshotPath);
            const dest = join(assetsDir, name);
            await copyFile(step.screenshotPath, dest);
            step.screenshotPath = `assets/${name}`;
          } catch (e) {
            step.screenshotPath = undefined;
          }
        }
        newResult.steps[i] = step;
      }
      
      bundledResults.push(newResult);
    }
    return bundledResults;
  }
}
