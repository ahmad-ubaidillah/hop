import { describe, test, expect, beforeEach } from 'bun:test';
import { DataTableParser } from '../../src/parser/data-table-parser';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('DataTableParser', () => {
  const testDir = '/tmp/hop-test-datatable';

  beforeEach(async () => {
    try {
      await mkdir(testDir, { recursive: true });
    } catch {}
  });

  describe('parseCsvContent', () => {
    test('should parse simple CSV content', () => {
      const content = `name,email,age
John,john@example.com,30
Jane,jane@example.com,25`;
      
      const result = DataTableParser.parseCsvContent(content);
      
      expect(result.headers).toEqual(['name', 'email', 'age']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['John', 'john@example.com', '30']);
      expect(result.rows[1]).toEqual(['Jane', 'jane@example.com', '25']);
    });

    test('should parse CSV with semicolon delimiter', () => {
      const content = `name;email;age
John;john@example.com;30
Jane;jane@example.com;25`;
      
      const result = DataTableParser.parseCsvContent(content);
      
      expect(result.headers).toEqual(['name', 'email', 'age']);
      expect(result.rows).toHaveLength(2);
    });

    test('should handle quoted values', () => {
      const content = `name,description
"John Doe","A person with, comma"`;
      
      const result = DataTableParser.parseCsvContent(content);
      
      expect(result.headers).toEqual(['name', 'description']);
      expect(result.rows[0][0]).toBe('John Doe');
      expect(result.rows[0][1]).toBe('A person with, comma');
    });

    test('should handle empty content', () => {
      const result = DataTableParser.parseCsvContent('');
      
      // Empty content returns empty string as header (parser behavior)
      expect(result.headers.length).toBeLessThanOrEqual(1);
      expect(result.rows).toEqual([]);
    });

    test('should handle single row (headers only)', () => {
      const content = 'name,email,age';
      
      const result = DataTableParser.parseCsvContent(content);
      
      expect(result.headers).toEqual(['name', 'email', 'age']);
      expect(result.rows).toEqual([]);
    });

    test('should skip empty lines', () => {
      const content = `name,email

John,john@example.com

Jane,jane@example.com`;
      
      const result = DataTableParser.parseCsvContent(content);
      
      expect(result.rows).toHaveLength(2);
    });

    test('should handle Windows line endings (CRLF)', () => {
      const content = 'name,email\r\nJohn,john@example.com\r\n';
      
      const result = DataTableParser.parseCsvContent(content);
      
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows).toHaveLength(1);
    });

    test('should trim whitespace from values', () => {
      const content = `name, email, age
  John  ,  john@example.com  ,  30  `;
      
      const result = DataTableParser.parseCsvContent(content);
      
      expect(result.headers).toEqual(['name', 'email', 'age']);
      expect(result.rows[0]).toEqual(['John', 'john@example.com', '30']);
    });
  });

  describe('parseCsvFile', () => {
    test('should read and parse CSV file', async () => {
      const csvPath = join(testDir, 'test.csv');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(csvPath, `name,email
John,john@example.com`);
      
      const result = await DataTableParser.parseCsvFile('test.csv', featurePath);
      
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows).toHaveLength(1);
    });

    test('should throw error for non-existent file', async () => {
      const featurePath = join(testDir, 'test.feature');
      
      await expect(
        DataTableParser.parseCsvFile('nonexistent.csv', featurePath)
      ).rejects.toThrow();
    });
  });

  describe('read', () => {
    test('should read and parse JSON file', async () => {
      const jsonPath = join(testDir, 'test.json');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(jsonPath, JSON.stringify({ name: 'test', value: 123 }));
      
      const result = await DataTableParser.read('test.json', featurePath);
      
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    test('should read and parse JSON array', async () => {
      const jsonPath = join(testDir, 'array.json');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(jsonPath, JSON.stringify([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ]));
      
      const result = await DataTableParser.read('array.json', featurePath);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    test('should read and parse CSV file', async () => {
      const csvPath = join(testDir, 'test.csv');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(csvPath, `name,email
John,john@example.com`);
      
      const result = await DataTableParser.read('test.csv', featurePath);
      
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows).toHaveLength(1);
    });

    test('should read text file as string', async () => {
      const txtPath = join(testDir, 'test.txt');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(txtPath, 'Hello World');
      
      const result = await DataTableParser.read('test.txt', featurePath);
      
      expect(result).toBe('Hello World');
    });

    test('should read YAML file as text', async () => {
      const yamlPath = join(testDir, 'test.yaml');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(yamlPath, 'name: test\nvalue: 123');
      
      const result = await DataTableParser.read('test.yaml', featurePath);
      
      expect(typeof result).toBe('string');
      expect(result).toContain('name: test');
    });

    test('should throw error for non-existent file', async () => {
      await expect(
        DataTableParser.read('nonexistent.json', testDir)
      ).rejects.toThrow();
    });

    test('should work without featureFilePath (use CWD)', async () => {
      const jsonPath = join(process.cwd(), 'test-read.json');
      
      try {
        await writeFile(jsonPath, JSON.stringify({ test: true }));
        
        const result = await DataTableParser.read('test-read.json');
        
        expect(result).toEqual({ test: true });
      } finally {
        await rm(jsonPath).catch(() => {});
      }
    });
  });

  describe('parseDataFile', () => {
    test('should parse JSON array into DataTable', async () => {
      const jsonPath = join(testDir, 'data.json');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(jsonPath, JSON.stringify([
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' }
      ]));
      
      const result = await DataTableParser.parseDataFile('data.json', featurePath);
      
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['John', 'john@example.com']);
    });

    test('should handle empty JSON array', async () => {
      const jsonPath = join(testDir, 'empty.json');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(jsonPath, '[]');
      
      const result = await DataTableParser.parseDataFile('empty.json', featurePath);
      
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    test('should handle JSON objects with missing values', async () => {
      const jsonPath = join(testDir, 'partial.json');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(jsonPath, JSON.stringify([
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane' } // missing email
      ]));
      
      const result = await DataTableParser.parseDataFile('partial.json', featurePath);
      
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows[1]).toEqual(['Jane', '']);
    });

    test('should return DataTable from CSV directly', async () => {
      const csvPath = join(testDir, 'data.csv');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(csvPath, `name,email
John,john@example.com`);
      
      const result = await DataTableParser.parseDataFile('data.csv', featurePath);
      
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows).toHaveLength(1);
    });

    test('should throw for unsupported format', async () => {
      const txtPath = join(testDir, 'data.txt');
      const featurePath = join(testDir, 'test.feature');
      
      await writeFile(txtPath, 'just text');
      
      await expect(
        DataTableParser.parseDataFile('data.txt', featurePath)
      ).rejects.toThrow('Unsupported data file format');
    });
  });
});
