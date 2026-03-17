/**
 * Visual Regression Testing for Hop Framework
 * Priority 5: Screenshot comparison, baseline management
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotConfig {
  baselineDir: string;
  diffDir: string;
  threshold?: number;
  format?: 'png' | 'jpeg' | 'webp';
}

export interface ScreenshotComparison {
  match: boolean;
  diffRatio: number;
  diffPixels: number;
  baselinePath: string;
  screenshotPath: string;
  diffPath?: string;
}

export interface BaselineImage {
  path: string;
  hash: string;
  timestamp: number;
}

/**
 * Visual Regression Tester
 */
export class VisualRegressionTester {
  private config: ScreenshotConfig;
  private baseline: Map<string, BaselineImage> = new Map();

  constructor(config: ScreenshotConfig) {
    this.config = {
      threshold: 0.1,
      format: 'png',
      ...config,
    };

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Ensure baseline and diff directories exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.config.baselineDir)) {
      fs.mkdirSync(this.config.baselineDir, { recursive: true });
    }
    if (!fs.existsSync(this.config.diffDir)) {
      fs.mkdirSync(this.config.diffDir, { recursive: true });
    }
  }

  /**
   * Take screenshot and compare with baseline
   */
  async compare(
    name: string,
    getScreenshot: () => Promise<Buffer>
  ): Promise<ScreenshotComparison> {
    const baselinePath = this.getBaselinePath(name);
    const screenshotPath = this.getScreenshotPath(name);
    const diffPath = this.getDiffPath(name);

    // Get current screenshot
    const screenshot = await getScreenshot();
    const screenshotHash = this.hashBuffer(screenshot);

    // Check if baseline exists
    if (!fs.existsSync(baselinePath)) {
      // Create baseline
      fs.writeFileSync(baselinePath, screenshot);
      this.baseline.set(name, {
        path: baselinePath,
        hash: screenshotHash,
        timestamp: Date.now(),
      });

      return {
        match: true,
        diffRatio: 0,
        diffPixels: 0,
        baselinePath,
        screenshotPath,
      };
    }

    // Load baseline
    const baselineBuffer = fs.readFileSync(baselinePath);
    
    // Compare screenshots
    const comparison = this.compareBuffers(baselineBuffer, screenshot);
    
    const result: ScreenshotComparison = {
      match: comparison.diffRatio <= (this.config.threshold || 0.1),
      diffRatio: comparison.diffRatio,
      diffPixels: comparison.diffPixels,
      baselinePath,
      screenshotPath,
    };

    // Save screenshot and diff if not matching
    if (!result.match) {
      fs.writeFileSync(screenshotPath, screenshot);
      
      // Generate diff (simplified - in production use pixelmatch or similar)
      const diffBuffer = this.generateDiff(baselineBuffer, screenshot);
      fs.writeFileSync(diffPath, diffBuffer);
      result.diffPath = diffPath;
    }

    return result;
  }

  /**
   * Update baseline
   */
  async updateBaseline(name: string, getScreenshot: () => Promise<Buffer>): Promise<void> {
    const baselinePath = this.getBaselinePath(name);
    const screenshot = await getScreenshot();
    fs.writeFileSync(baselinePath, screenshot);
    
    this.baseline.set(name, {
      path: baselinePath,
      hash: this.hashBuffer(screenshot),
      timestamp: Date.now(),
    });
  }

  /**
   * Update all baselines
   */
  async updateAllBaselines(getScreenshots: () => Promise<Record<string, Buffer>>): Promise<void> {
    const screenshots = await getScreenshots();
    for (const [name, screenshot] of Object.entries(screenshots)) {
      await this.updateBaseline(name, async () => screenshot);
    }
  }

  /**
   * Delete baseline
   */
  deleteBaseline(name: string): void {
    const baselinePath = this.getBaselinePath(name);
    if (fs.existsSync(baselinePath)) {
      fs.unlinkSync(baselinePath);
    }
    this.baseline.delete(name);
  }

  /**
   * Get baseline path
   */
  private getBaselinePath(name: string): string {
    return path.join(this.config.baselineDir, `${name}.${this.config.format}`);
  }

  /**
   * Get screenshot path
   */
  private getScreenshotPath(name: string): string {
    return path.join(this.config.diffDir, `${name}_actual.${this.config.format}`);
  }

  /**
   * Get diff path
   */
  private getDiffPath(name: string): string {
    return path.join(this.config.diffDir, `${name}_diff.${this.config.format}`);
  }

  /**
   * Simple hash function for buffers
   */
  private hashBuffer(buffer: Buffer): string {
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
      hash = ((hash << 5) - hash) + buffer[i];
      hash |= 0;
    }
    return hash.toString(16);
  }

  /**
   * Compare two buffers (simplified pixel comparison)
   */
  private compareBuffers(baseline: Buffer, screenshot: Buffer): { diffRatio: number; diffPixels: number } {
    if (baseline.length !== screenshot.length) {
      return {
        diffRatio: 1,
        diffPixels: Math.abs(baseline.length - screenshot.length),
      };
    }

    let diffPixels = 0;
    const totalPixels = screenshot.length;
    
    for (let i = 0; i < totalPixels; i++) {
      if (baseline[i] !== screenshot[i]) {
        diffPixels++;
      }
    }

    return {
      diffRatio: diffPixels / totalPixels,
      diffPixels,
    };
  }

  /**
   * Generate diff image (simplified)
   */
  private generateDiff(baseline: Buffer, screenshot: Buffer): Buffer {
    // In production, use a proper image diff library like pixelmatch
    // This is a simplified version
    return screenshot;
  }

  /**
   * Get report
   */
  getReport(): { total: number; passed: number; failed: number; baselines: string[] } {
    const baselines = fs.readdirSync(this.config.baselineDir);
    return {
      total: this.baseline.size,
      passed: 0,
      failed: 0,
      baselines,
    };
  }
}

/**
 * Create visual regression tester
 */
export function createVisualRegressionTester(config: ScreenshotConfig): VisualRegressionTester {
  return new VisualRegressionTester(config);
}
