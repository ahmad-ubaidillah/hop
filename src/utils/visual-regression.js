/**
 * Visual Regression Testing for Hop Framework
 * Priority 5: Screenshot comparison, baseline management
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Visual Regression Tester
 */
export class VisualRegressionTester {
    config;
    baseline = new Map();
    constructor(config) {
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
    ensureDirectories() {
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
    async compare(name, getScreenshot) {
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
        const result = {
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
    async updateBaseline(name, getScreenshot) {
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
    async updateAllBaselines(getScreenshots) {
        const screenshots = await getScreenshots();
        for (const [name, screenshot] of Object.entries(screenshots)) {
            await this.updateBaseline(name, async () => screenshot);
        }
    }
    /**
     * Delete baseline
     */
    deleteBaseline(name) {
        const baselinePath = this.getBaselinePath(name);
        if (fs.existsSync(baselinePath)) {
            fs.unlinkSync(baselinePath);
        }
        this.baseline.delete(name);
    }
    /**
     * Get baseline path
     */
    getBaselinePath(name) {
        return path.join(this.config.baselineDir, `${name}.${this.config.format}`);
    }
    /**
     * Get screenshot path
     */
    getScreenshotPath(name) {
        return path.join(this.config.diffDir, `${name}_actual.${this.config.format}`);
    }
    /**
     * Get diff path
     */
    getDiffPath(name) {
        return path.join(this.config.diffDir, `${name}_diff.${this.config.format}`);
    }
    /**
     * Simple hash function for buffers
     */
    hashBuffer(buffer) {
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
    compareBuffers(baseline, screenshot) {
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
    generateDiff(baseline, screenshot) {
        // In production, use a proper image diff library like pixelmatch
        // This is a simplified version
        return screenshot;
    }
    /**
     * Get report
     */
    getReport() {
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
export function createVisualRegressionTester(config) {
    return new VisualRegressionTester(config);
}
