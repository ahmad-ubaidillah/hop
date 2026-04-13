import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
const defaultOptions = {
    threshold: 0.1,
    antialiasingThreshold: 0,
    antialiasingPadding: 2,
    diffDir: 'reports/visual-diff',
};
export class VisualRegression {
    options;
    constructor(options = {}) {
        this.options = { ...defaultOptions, ...options };
    }
    async compareScreenshots(actualBuffer, baselinePath, diffPath) {
        const { width, height, data: actualData } = this.decodePng(actualBuffer);
        const baselineExists = existsSync(baselinePath);
        if (!baselineExists) {
            await this.ensureDir(dirname(baselinePath));
            await writeFile(baselinePath, actualBuffer);
            return {
                passed: true,
                diffRatio: 0,
                diffPixels: 0,
                totalPixels: width * height,
                error: 'Baseline created',
            };
        }
        const baselineBuffer = await readFile(baselinePath);
        const { data: baselineData } = this.decodePng(baselineBuffer);
        if (baselineData.length !== actualData.length) {
            return {
                passed: false,
                diffRatio: 1,
                diffPixels: width * height,
                totalPixels: width * height,
                error: `Image dimensions mismatch: baseline ${width}x${height}`,
            };
        }
        let diffPixels = 0;
        const totalPixels = width * height;
        for (let i = 0; i < actualData.length; i += 4) {
            if (this.isAntialiased(actualData, i, width))
                continue;
            const actualR = actualData[i];
            const actualG = actualData[i + 1];
            const actualB = actualData[i + 2];
            const baselineR = baselineData[i];
            const baselineG = baselineData[i + 1];
            const baselineB = baselineData[i + 2];
            if (this.isIgnoredColor(actualR, actualG, actualB))
                continue;
            const diff = this.colorDistance(actualR, actualG, actualB, baselineR, baselineG, baselineB);
            if (diff > this.options.threshold * 255) {
                diffPixels++;
                if (actualData[i + 3] !== undefined) {
                    actualData[i] = 255;
                    actualData[i + 1] = 0;
                    actualData[i + 2] = 255;
                }
            }
        }
        const diffRatio = diffPixels / totalPixels;
        const passed = diffRatio <= this.options.threshold;
        if (!passed && diffPath) {
            await this.ensureDir(dirname(diffPath));
            await writeFile(diffPath, this.encodePng(width, height, actualData));
        }
        return {
            passed,
            diffRatio,
            diffPixels,
            totalPixels,
            diffPath: !passed ? diffPath : undefined,
        };
    }
    decodePng(buffer) {
        const signature = buffer.slice(0, 8);
        if (signature[0] !== 0x89 || signature[1] !== 0x50 || signature[2] !== 0x4E || signature[3] !== 0x47) {
            return { width: 1920, height: 1080, data: new Uint8Array(buffer) };
        }
        let offset = 8;
        let width = 0;
        let height = 0;
        let data = null;
        while (offset < buffer.length) {
            const length = buffer.readUInt32BE(offset);
            const type = buffer.slice(offset + 4, offset + 8).toString();
            if (type === 'IHDR') {
                width = buffer.readUInt32BE(offset + 8);
                height = buffer.readUInt32BE(offset + 12);
            }
            else if (type === 'IDAT') {
                const chunkData = buffer.slice(offset + 8, offset + 8 + length);
                if (!data) {
                    data = new Uint8Array(chunkData);
                }
                else {
                    const newData = new Uint8Array(data.length + chunkData.length);
                    newData.set(data);
                    newData.set(chunkData, data.length);
                    data = newData;
                }
            }
            else if (type === 'IEND') {
                break;
            }
            offset += 12 + length;
        }
        return { width: width || 1920, height: height || 1080, data: data || new Uint8Array(buffer) };
    }
    encodePng(width, height, data) {
        return Buffer.from(data);
    }
    colorDistance(r1, g1, b1, r2, g2, b2) {
        const rMean = (r1 + r2) / 2;
        const r = r1 - r2;
        const g = g1 - g2;
        const b = b1 - b2;
        return Math.sqrt((2 + rMean / 256) * r * r + 4 * g * g + (2 + (255 - rMean) / 256) * b * b) / 4;
    }
    isAntialiased(data, index, width) {
        if (this.options.antialiasingThreshold === 0)
            return false;
        const neighbors = [
            index - 4, index + 4,
            index - width * 4, index + width * 4,
            index - width * 4 - 4, index - width * 4 + 4,
            index + width * 4 - 4, index + width * 4 + 4,
        ];
        let differentColors = 0;
        const current = [data[index], data[index + 1], data[index + 2]];
        for (const neighbor of neighbors) {
            if (neighbor < 0 || neighbor >= data.length)
                continue;
            const neighborColor = [data[neighbor], data[neighbor + 1], data[neighbor + 2]];
            if (this.colorDistance(current[0], current[1], current[2], neighborColor[0], neighborColor[1], neighborColor[2]) > this.options.antialiasingThreshold * 255) {
                differentColors++;
            }
        }
        return differentColors >= 2;
    }
    isIgnoredColor(r, g, b) {
        if (!this.options.ignoreColors)
            return false;
        return this.options.ignoreColors.some(color => color.r === r && color.g === g && color.b === b);
    }
    async ensureDir(dir) {
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
    }
    async updateBaseline(baselinePath, newBaselineBuffer) {
        await this.ensureDir(dirname(baselinePath));
        await writeFile(baselinePath, newBaselineBuffer);
    }
    async deleteBaseline(baselinePath) {
        try {
            const { unlink } = await import('fs/promises');
            await unlink(baselinePath);
        }
        catch { }
    }
}
export function createVisualRegression(options) {
    return new VisualRegression(options);
}
