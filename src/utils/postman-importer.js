/**
 * Postman Collection Importer
 * Converts Postman collections to Hop Framework feature files
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
export class PostmanImporter {
    collection;
    outputDir;
    constructor(collectionPath, outputDir = 'features') {
        this.collection = JSON.parse(readFileSync(collectionPath, 'utf-8'));
        this.outputDir = outputDir;
    }
    /**
     * Convert Postman collection to feature files
     */
    convert() {
        const files = [];
        const featureName = this.collection.info.name.replace(/[^a-zA-Z0-9]/g, ' ');
        let featureContent = `Feature: ${featureName}\n`;
        if (this.collection.info.description) {
            featureContent += `  ${this.collection.info.description}\n`;
        }
        featureContent += '\n';
        // Process items
        for (const item of this.collection.item) {
            const content = this.processItem(item, 0);
            if (content) {
                featureContent += content + '\n';
            }
        }
        // Write feature file
        const fileName = `${this.collection.info.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.feature`;
        const filePath = resolve(this.outputDir, fileName);
        writeFileSync(filePath, featureContent);
        files.push(filePath);
        return files;
    }
    processItem(item, indent) {
        const prefix = '  '.repeat(indent);
        let content = '';
        // Handle folders
        if (item.item) {
            content += `${prefix}# Folder: ${item.name}\n`;
            for (const subItem of item.item) {
                content += this.processItem(subItem, indent);
            }
            return content;
        }
        // Handle requests
        if (item.request) {
            const request = item.request;
            content += `\n${prefix}@api\n`;
            content += `${prefix}Scenario: ${item.name}\n`;
            // URL handling
            let url = '';
            if (typeof request.url === 'string') {
                url = request.url;
            }
            else {
                url = request.url.raw;
            }
            // Variables substitution
            if (this.collection.variable) {
                for (const variable of this.collection.variable) {
                    url = url.replace(new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g'), variable.value);
                }
            }
            // Background for URL
            content += `${prefix}  Given url '${url}'\n`;
            // Headers
            if (request.header) {
                for (const header of request.header) {
                    content += `${prefix}  And header ${header.key} = '${header.value}'\n`;
                }
            }
            // Auth
            if (request.auth) {
                if (request.auth.type === 'bearer' && request.auth.bearer) {
                    const token = request.auth.bearer.find(b => b.key === 'token');
                    if (token) {
                        content += `${prefix}  And header Authorization = 'Bearer ${token.value}'\n`;
                    }
                }
            }
            // Body
            if (request.body) {
                if (request.body.mode === 'raw' && request.body.raw) {
                    content += `${prefix}  And request ${request.body.raw}\n`;
                }
            }
            // Method
            const method = request.method.toUpperCase();
            content += `${prefix}  When method ${method}\n`;
            // Status assertion
            content += `${prefix}  Then status 200\n`;
        }
        return content;
    }
    /**
     * Create step definitions for Postman collection
     */
    generateSteps() {
        let steps = `// Auto-generated step definitions from Postman collection
import { Given, When, Then } from 'hop-framework';

`;
        const uniqueMethods = new Set();
        for (const item of this.collection.item) {
            if (item.request) {
                const method = item.request.method.toUpperCase();
                uniqueMethods.add(method);
            }
        }
        for (const method of uniqueMethods) {
            steps += `
Given('I make a ${method} request to {string}', async ({ request }, path: string) => {
  request.method = '${method}';
  request.url = path;
});

`;
        }
        steps += `
Given('I add header {string} with value {string}', async ({ request }, key: string, value: string) => {
  request.headers[key] = value;
});

Given('I set request body:', async ({ context }, body: string) => {
  context.requestBody = JSON.parse(body);
});
`;
        return steps;
    }
}
// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage: postman-importer <collection.json> [output-dir]');
        process.exit(1);
    }
    const importer = new PostmanImporter(args[0], args[1]);
    const files = importer.convert();
    console.log(`Generated ${files.length} feature file(s):`);
    files.forEach(f => console.log(`  - ${f}`));
    const stepsFile = resolve(args[1] || 'features', 'postman-steps.ts');
    writeFileSync(stepsFile, importer.generateSteps());
    console.log(`Generated step definitions: ${stepsFile}`);
}
