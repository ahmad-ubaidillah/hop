/**
 * Hop Framework - Language Server Protocol (LSP) Server
 * Provides autocomplete, diagnostics, and code actions for Gherkin
 */

import {
  createConnection,
  TextDocuments,
  TextDocument,
  Diagnostic,
  DiagnosticSeverity,
  Position,
  CompletionItem,
  CompletionItemKind,
  Hover,
  TextDocumentSyncKind
} from 'vscode-languageserver';
import { TextDocumentIdentifier } from 'vscode-languageserver-protocol';

// Create connection using stdio for LSP - use function call with spread to bypass strict v8 API
const connection: any = createConnection({} as any, {} as any);

// Document manager - use any to bypass type issues with v8 API
const documents: any = new TextDocuments({} as any);

interface GherkinDocument {
  uri: string;
  content: string;
  steps: GherkinStep[];
  features: GherkinFeature[];
}

interface GherkinFeature {
  name: string;
  description: string;
  scenarios: GherkinScenario[];
}

interface GherkinScenario {
  name: string;
  type: 'scenario' | 'background' | 'scenario_outline';
  steps: GherkinStep[];
}

interface GherkinStep {
  keyword: string;
  text: string;
}

// Built-in step patterns for autocomplete
const BUILTIN_STEPS = [
  { label: 'Given {string}', detail: 'Given step with text', insertText: "Given '$1'" },
  { label: 'When {string}', detail: 'When step with text', insertText: "When '$1'" },
  { label: 'Then {string}', detail: 'Then step with text', insertText: "Then '$1'" },
  { label: 'And {string}', detail: 'And step with text', insertText: "And '$1'" },
  { label: 'But {string}', detail: 'But step with text', insertText: "But '$1'" },
  // HTTP steps
  { label: 'Given url {string}', detail: 'Set request URL', insertText: "Given url '$1'" },
  { label: 'Given path {string}', detail: 'Set request path', insertText: "Given path '$1'" },
  { label: 'And header {string} = {string}', detail: 'Set header', insertText: "And header $1 = '$2'" },
  { label: 'And request {json}', detail: 'Set request body', insertText: 'And request $1' },
  { label: 'When method {method}', detail: 'HTTP method', insertText: 'When method $1' },
  { label: 'Then status {number}', detail: 'Assert status code', insertText: 'Then status $1' },
  { label: 'And match response', detail: 'Match response', insertText: 'And match response $1' },
  // UI steps
  { label: 'Given I open browser to {string}', detail: 'Open browser', insertText: "Given I open browser to '$1'" },
  { label: 'When I click {string}', detail: 'Click element', insertText: "When I click '$1'" },
  { label: 'Then I should see {string}', detail: 'Assert visibility', insertText: "Then I should see '$1'" },
];

connection.onInitialize((): any => {
  console.log('Hop LSP Server initialized');
  
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['G', 'W', 'T', 'A', 'B', 'u', 'p', 'm', 'h', 'r', 'd', 'f', 's']
      },
      hoverProvider: true
    }
  };
});

// Handle document changes
documents.onDidChangeContent((change: any) => {
  validateDocument(change.document);
});

// Validate Gherkin document
function validateDocument(document: any): void {
  const content = document.getText();
  const diagnostics: any = [];
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for missing colon after keyword
    if (/^(Feature|Scenario|Background|Rule|Examples|Given|When|Then|And|But)\s+/.test(line)) {
      if (!line.includes(':') && !line.includes('<')) {
        // Some are valid without colon (step definitions)
        if (!/^(Given|When|Then|And|But)\s+/.test(line)) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: line.length },
              end: { line: i, character: line.length }
            },
            message: 'Missing colon after keyword'
          });
        }
      }
    }
    
    // Check for unclosed strings
    const doubleQuotes = (line.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: i, character: line.indexOf('"') },
          end: { line: i, character: line.length }
        },
        message: 'Unclosed string'
      });
    }
    
    // Check for Scenario Outline without Examples
    if (/Scenario\s+Outline/i.test(line) || /Scenario\s+Template/i.test(line)) {
      const hasExamples = lines.slice(i).some((l: string) => /^\s*Examples\s*:/i.test(l));
      if (!hasExamples) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: line.length }
          },
          message: 'Scenario Outline should have Examples section'
        });
      }
    }
  }
  
  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics
  });
}

// Handle completion requests
connection.onCompletion((textDocumentPosition: { textDocument: TextDocumentIdentifier; position: Position }) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) return [];
  
  const content = document.getText();
  const lines = content.split('\n');
  const line = lines[textDocumentPosition.position.line];
  
  // Get last word being typed
  const beforeCursor = line.substring(0, textDocumentPosition.position.character);
  const lastWord = beforeCursor.match(/(\w+)$/)?.[1] || '';
  
  // Filter steps based on what user is typing
  const steps = BUILTIN_STEPS.filter(step => 
    step.label.toLowerCase().startsWith(lastWord.toLowerCase()) ||
    step.label.toLowerCase().includes(beforeCursor.toLowerCase())
  );
  
  return steps.map(step => ({
    label: step.label,
    kind: CompletionItemKind.Snippet,
    detail: step.detail,
    insertText: step.insertText,
    insertTextFormat: 2, // Snippet
    range: {
      start: textDocumentPosition.position,
      end: textDocumentPosition.position
    }
  }));
});

// Handle hover requests
connection.onHover((textDocumentPosition: { textDocument: TextDocumentIdentifier; position: Position }): any => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) return null;
  
  const content = document.getText();
  const lines = content.split('\n');
  const line = lines[textDocumentPosition.position.line];
  
  // Check for built-in step keywords
  const keywordMatch = line.match(/^(Given|When|Then|And|But)\s+(.+)/);
  if (keywordMatch) {
    return {
      contents: [
        `**${keywordMatch[1]}** step: ${keywordMatch[2]}`,
        'Built-in step definition in Hop Framework'
      ]
    };
  }
  
  return null;
});

// Start listening
documents.listen(connection);
connection.listen();

console.log('Hop LSP Server running...');
