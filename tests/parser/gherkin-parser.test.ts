import { describe, test, expect, beforeEach } from 'bun:test';
import { GherkinParser } from '../../src/parser/gherkin-parser';

describe('GherkinParser', () => {
  let parser: GherkinParser;

  beforeEach(() => {
    parser = new GherkinParser();
  });

  describe('parse', () => {
    test('should parse a simple feature', async () => {
      const gherkin = `
Feature: Login Feature
  As a user
  I want to login
  So that I can access my account

  Scenario: Successful login
    Given the user is on the login page
    When the user enters valid credentials
    Then the user should be logged in
`;
      const feature = await parser.parse(gherkin, 'test.feature');
      
      expect(feature.name).toBe('Login Feature');
      expect(feature.description).toContain('As a user');
      expect(feature.scenarios).toHaveLength(1);
      expect(feature.scenarios[0].name).toBe('Successful login');
      expect(feature.scenarios[0].steps).toHaveLength(3);
    });

    test('should parse feature with tags', async () => {
      const gherkin = `
@login @smoke
Feature: Login Feature
  Scenario: Login test
    Given the user is on the login page
`;
      const feature = await parser.parse(gherkin, 'test.feature');
      
      expect(feature.tags).toContain('login');
      expect(feature.tags).toContain('smoke');
    });

    test('should parse scenario with background', async () => {
      const gherkin = `
Feature: Shopping Cart
  Background:
    Given the user is logged in
    And the cart is empty

  Scenario: Add item to cart
    When the user adds an item to cart
    Then the cart should have 1 item
`;
      const feature = await parser.parse(gherkin, 'test.feature');
      
      expect(feature.background).toBeDefined();
      expect(feature.background?.steps).toHaveLength(2);
      expect(feature.scenarios[0].name).toBe('Add item to cart');
    });

    test('should parse scenario outline with examples', async () => {
      const gherkin = `
Feature: Login with multiple users
  Scenario Outline: Login with <username>
    Given the user enters username "<username>" and password "<password>"
    Then login should be <result>

    Examples:
      | username | password | result |
      | admin    | admin123 | success |
      | user1    | pass123  | success |
`;
      const feature = await parser.parse(gherkin, 'test.feature');
      
      // Scenario outline should be detected
      expect(feature.scenarios[0].outline).toBe(true);
      expect(feature.scenarios[0].examples).toBeDefined();
      expect(feature.scenarios[0].examples![0].table.headers).toEqual(['username', 'password', 'result']);
    });

    test('should parse Rule keyword (Gherkin 20+)', async () => {
      const gherkin = `
Feature: Account Management

  Rule: Password Management
    Scenario: Change password
      Given the user is logged in
      When the user changes password
      Then password should be changed

  Rule: Profile Management
    Scenario: Update profile
      Given the user is logged in
      When the user updates profile
      Then profile should be updated
`;
      const feature = await parser.parse(gherkin, 'test.feature');
      
      expect(feature.rules).toBeDefined();
      expect(feature.rules).toHaveLength(2);
      expect(feature.rules![0].name).toBe('Password Management');
      expect(feature.scenarios).toHaveLength(2);
    });

    test('should throw error for invalid Gherkin', async () => {
      const gherkin = `
This is not a valid Gherkin document
`;
      // Should throw an error - check for either error message
      await expect(parser.parse(gherkin, 'test.feature')).rejects.toThrow();
    });

    test('should parse DocString', async () => {
      const gherkin = `
Feature: API Testing
  Scenario: Create user with JSON body
    Given the request body is
      """
      {
        "name": "John",
        "email": "john@example.com"
      }
      """
    When the user sends POST request
    Then the response status should be 201
`;
      const feature = await parser.parse(gherkin, 'test.feature');
      
      const step = feature.scenarios[0].steps[0];
      expect(step.docString).toBeDefined();
      expect(step.docString).toContain('"name": "John"');
    });

    test('should parse data table', async () => {
      const gherkin = `
Feature: User Management
  Scenario: Add multiple users
    Given the following users exist:
      | name  | email            |
      | John  | john@example.com |
      | Jane  | jane@example.com |
`;
      const feature = await parser.parse(gherkin, 'test.feature');
      
      const step = feature.scenarios[0].steps[0];
      expect(step.dataTable).toBeDefined();
      expect(step.dataTable?.rows).toHaveLength(2);
      expect(step.dataTable?.headers).toEqual(['name', 'email']);
    });
  });

  describe('discoverFeatures', () => {
    test('should discover feature files from path', async () => {
      const features = await parser.discoverFeatures('./features');
      
      expect(Array.isArray(features)).toBe(true);
    });
  });
});
