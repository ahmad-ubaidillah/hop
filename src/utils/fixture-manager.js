/**
 * Fixture Management System for Hop Framework
 * Priority 7: JSON/YAML fixture files, test data management
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Fixture Manager
 */
export class FixtureManager {
    config;
    loaded = new Map();
    constructor(config = {}) {
        this.config = {
            fixturesDir: config.fixturesDir || './fixtures',
            format: config.format || 'both',
            ...config,
        };
    }
    /**
     * Load fixture by name
     */
    load(name, overrides) {
        // Check cache first
        if (this.loaded.has(name) && !overrides) {
            return this.loaded.get(name)?.data;
        }
        const fixture = this.findAndLoad(name);
        if (!fixture) {
            throw new Error(`Fixture not found: ${name}`);
        }
        // Apply overrides
        let data = { ...fixture.data };
        if (overrides) {
            data = this.applyOverrides(data, overrides);
        }
        // Cache
        if (!overrides) {
            this.loaded.set(name, fixture);
        }
        return data;
    }
    /**
     * Load fixture asynchronously
     */
    async loadAsync(name, overrides) {
        return this.load(name, overrides);
    }
    /**
     * Find and load fixture file
     */
    findAndLoad(name) {
        const extensions = this.getExtensions();
        for (const ext of extensions) {
            const filePath = path.join(this.config.fixturesDir, `${name}${ext}`);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const data = this.parseContent(content, ext);
                return {
                    name,
                    data,
                    source: filePath,
                };
            }
        }
        return null;
    }
    /**
     * Get file extensions to try
     */
    getExtensions() {
        switch (this.config.format) {
            case 'json':
                return ['.json'];
            case 'yaml':
                return ['.yaml', '.yml'];
            case 'both':
            default:
                return ['.json', '.yaml', '.yml'];
        }
    }
    /**
     * Parse content based on extension
     */
    parseContent(content, ext) {
        switch (ext) {
            case '.json':
                return JSON.parse(content);
            case '.yaml':
            case '.yml':
                return this.parseYAML(content);
            default:
                return JSON.parse(content);
        }
    }
    /**
     * Simple YAML parser (for basic YAML)
     */
    parseYAML(content) {
        // Basic YAML parsing - in production use js-yaml
        const lines = content.split('\n');
        const result = {};
        let currentKey = '';
        let currentArray = [];
        let inArray = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            if (trimmed.startsWith('- ')) {
                inArray = true;
                currentArray.push(trimmed.substring(2).trim());
            }
            else {
                if (inArray && currentKey) {
                    result[currentKey] = currentArray;
                    currentArray = [];
                    inArray = false;
                }
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex > 0) {
                    currentKey = trimmed.substring(0, colonIndex).trim();
                    const value = trimmed.substring(colonIndex + 1).trim();
                    if (value) {
                        result[currentKey] = this.parseValue(value);
                    }
                }
            }
        }
        if (inArray && currentKey) {
            result[currentKey] = currentArray;
        }
        return result;
    }
    /**
     * Parse YAML value
     */
    parseValue(value) {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        if (value === 'null')
            return null;
        if (!isNaN(Number(value)))
            return Number(value);
        return value;
    }
    /**
     * Apply overrides to fixture
     */
    applyOverrides(data, overrides) {
        const result = { ...data };
        for (const [key, value] of Object.entries(overrides)) {
            if (value === null || value === undefined) {
                delete result[key];
            }
            else if (typeof value === 'object' && !Array.isArray(value) && result[key]) {
                result[key] = this.applyOverrides(result[key], value);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    /**
     * Load all fixtures from directory
     */
    loadAll() {
        const fixtures = new Map();
        const files = fs.readdirSync(this.config.fixturesDir);
        for (const file of files) {
            const name = path.basename(file, path.extname(file));
            try {
                fixtures.set(name, this.load(name));
            }
            catch (error) {
                console.warn(`Failed to load fixture ${name}:`, error);
            }
        }
        return fixtures;
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.loaded.clear();
    }
    /**
     * Get fixture source path
     */
    getSource(name) {
        const fixture = this.loaded.get(name);
        return fixture?.source || null;
    }
    /**
     * Create fixture
     */
    create(name, data, format = 'json') {
        const ext = format === 'yaml' ? '.yaml' : '.json';
        const filePath = path.join(this.config.fixturesDir, `${name}${ext}`);
        let content;
        if (format === 'yaml') {
            content = this.toYAML(data);
        }
        else {
            content = JSON.stringify(data, null, 2);
        }
        fs.writeFileSync(filePath, content);
        this.loaded.set(name, {
            name,
            data,
            source: filePath,
        });
    }
    /**
     * Convert to YAML
     */
    toYAML(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        let result = '';
        if (Array.isArray(obj)) {
            for (const item of obj) {
                if (typeof item === 'object') {
                    result += `${spaces}-\n${this.toYAML(item, indent + 1)}`;
                }
                else {
                    result += `${spaces}- ${item}\n`;
                }
            }
        }
        else if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object') {
                    result += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
                }
                else {
                    result += `${spaces}${key}: ${value}\n`;
                }
            }
        }
        return result;
    }
}
/**
 * Create fixture manager
 */
export function createFixtureManager(config) {
    return new FixtureManager(config);
}
/**
 * Fixture decorator
 */
export function fixture(name) {
    return function (target, propertyKey) {
        // Store fixture name for later loading
        Object.defineProperty(target, propertyKey, {
            get: function () {
                const manager = new FixtureManager();
                return manager.load(name);
            },
        });
    };
}
