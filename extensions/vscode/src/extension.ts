import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let terminal: vscode.Terminal | null = null;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('gherkin');

  const hopConfig = vscode.workspace.getConfiguration('hop');

  context.subscriptions.push(
    vscode.commands.registerCommand('hop.runFeature', runFeature),
    vscode.commands.registerCommand('hop.runScenario', runScenario),
    vscode.commands.registerCommand('hop.generateSteps', generateSteps),
    vscode.commands.registerCommand('hop.record', startRecord),
    vscode.commands.registerCommand('hop.openReport', openReport),
    vscode.commands.registerCommand('hop.gotoStepDefinition', gotoStepDefinition)
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'gherkin', scheme: 'file' },
      new GherkinCompletionProvider(),
      ' ', ':', "'", '"'
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { language: 'gherkin' },
      new GherkinDefinitionProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: 'gherkin' },
      new GherkinSemanticTokensProvider(),
      GherkinSemanticTokensProvider.legend
    )
  );

  vscode.workspace.onDidSaveTextDocument((doc) => {
    if (doc.languageId === 'gherkin') {
      validateFeatureFile(doc);
    }
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.languageId === 'gherkin') {
      validateFeatureFile(editor.document);
    }
  });
}

async function runFeature() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const filePath = editor.document.uri.fsPath;
  await runHop(['test', filePath]);
}

async function runScenario() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const selection = editor.selection;
  const line = selection.start.line;
  const text = document.lineAt(line).text;

  const scenarioMatch = text.match(/Scenario:\s*(.+)/);
  if (scenarioMatch) {
    const scenarioName = scenarioMatch[1].trim();
    await runHop(['test', document.uri.fsPath, '--tags', `@${scenarioName.replace(/\s+/g, '-')}`]);
  } else {
    vscode.window.showInformationMessage('No scenario found at cursor');
  }
}

async function generateSteps() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  await runHop(['test', '--snippet']);
}

async function startRecord() {
  const port = vscode.window.createTerminal('Hop Recorder');
  port.sendText('hop record');
  port.show();
}

async function openReport() {
  await runHop(['report']);
}

async function gotoStepDefinition() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const position = editor.selection.start;
  const line = document.lineAt(position.line).text;

  const stepMatch = line.match(/(Given|When|Then|And|But)\s+(.+)/);
  if (!stepMatch) return;

  const stepText = stepMatch[2].trim();
  const stepsPath = vscode.workspace.getConfiguration('hop').get<string>('stepsPath') || './steps';

  const files = await vscode.workspace.findFiles(new vscode.RelativePattern(stepsPath, '**/*.ts'));

  for (const file of files) {
    const content = await vscode.workspace.openTextDocument(file);
    if (content.getText().includes(stepText)) {
      const loc = content.getText().indexOf(stepText);
      const pos = content.positionAt(loc);
      await vscode.window.showTextDocument(file, { selection: new vscode.Range(pos, pos) });
      return;
    }
  }

  vscode.window.showInformationMessage(`Step definition not found for: ${stepText}`);
}

async function runHop(args: string[]) {
  if (!terminal) {
    terminal = vscode.window.createTerminal('Hop');
  }

  terminal.sendText(`hop ${args.join(' ')}`);
  terminal.show();
}

function validateFeatureFile(document: vscode.TextDocument) {
  const text = document.getText();
  const diagnostics: vscode.Diagnostic[] = [];

  const lines = text.split('\n');
  let inScenario = false;
  let hasBackground = false;
  let scenarioCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.match(/^Background:/i)) {
      if (hasBackground) {
        diagnostics.push(createDiagnostic(i, 'Only one Background allowed per feature'));
      }
      hasBackground = true;
      inScenario = false;
    }

    if (line.match(/^Scenario( Outline)?:/i)) {
      inScenario = true;
      scenarioCount++;
    }

    if (inScenario && (line.match(/^Given/i) || line.match(/^When/i) || line.match(/^Then/i))) {
      const nextLines = lines.slice(i + 1).slice(0, 10);
      const hasAssertion = nextLines.some(l => l.match(/^(Then|And)\b/i) && l.match(/should|expect|assert|verify/i));
      
      if (!hasAssertion) {
        const keywords = ['Given', 'When', 'Then'];
        const currentKeyword = keywords.find(k => line.match(new RegExp(`^${k}\\b`, 'i')));
        if (currentKeyword !== 'Then') {
          diagnostics.push(createDiagnostic(i, 'Scenario should have a Then step for assertion'));
        }
      }
    }
  }

  if (scenarioCount === 0) {
    diagnostics.push(createDiagnostic(0, 'Feature must have at least one scenario'));
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

function createDiagnostic(line: number, message: string): vscode.Diagnostic {
  const range = new vscode.Range(line, 0, line, 100);
  return new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
}

class GherkinCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    const stepTemplates = [
      { label: 'Given', detail: 'Given user navigates to \'${1:url}\'', insertText: "Given user navigates to '$1'" },
      { label: 'When', detail: 'When user clicks \'${1:selector}\'', insertText: "When user clicks '$1'" },
      { label: 'Then', detail: 'Then user should see element', insertText: "Then user should see element '$1'" },
      { label: 'And', detail: 'And user types into', insertText: "And user types '$1' into '$2'" },
      { label: 'Given (API)', detail: 'Given url', insertText: "Given url '$1'" },
      { label: 'Given (API)', detail: 'Given path', insertText: "Given path '$1'" },
      { label: 'Given (API)', detail: 'Given header', insertText: "Given header '$1' = '$2'" },
      { label: 'When (API)', detail: 'When method GET', insertText: 'When method GET' },
      { label: 'When (API)', detail: 'When method POST', insertText: 'When method POST' },
      { label: 'Then (API)', detail: 'Then status 200', insertText: 'Then status 200' },
      { label: 'Then (API)', detail: 'And match response', insertText: 'And match response' },
      { label: 'Given (DB)', detail: 'Given connect to database', insertText: "Given connect to database '$1'" },
      { label: 'When (DB)', detail: 'When execute query', insertText: "When execute '$1'" },
      { label: 'Then (DB)', detail: 'Then match rows', insertText: 'Then match rows[0].$1 == $2' },
    ];

    for (const template of stepTemplates) {
      const item = new vscode.CompletionItem(template.label, vscode.CompletionItemKind.Snippet);
      item.detail = template.detail;
      item.insertText = new vscode.SnippetString(template.insertText);
      item.insertTextFormat = vscode.InsertTextFormat.Snippet;
      items.push(item);
    }

    return items;
  }
}

class GherkinDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Location> {
    return null;
  }
}

export class GherkinSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  static legend = new vscode.SemanticTokensLegend([
    'keyword', 'string', 'comment', 'variable', 'tag'
  ]);

  provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SemanticTokens> {
    const builder = new vscode.SemanticTokensBuilder();
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tokens = this.tokenizeLine(line, i);
      for (const token of tokens) {
        builder.push(token.line, token.startChar, token.length, token.tokenType);
      }
    }

    return builder.build();
  }

  private tokenizeLine(line: string, lineIndex: number): { line: number; startChar: number; length: number; tokenType: number }[] {
    const tokens: { line: number; startChar: number; length: number; tokenType: number }[] = [];
    
    if (line.match(/^(Feature|Background|Scenario|Examples):/i)) {
      const match = line.match(/^(Feature|Background|Scenario|Examples):/);
      if (match) {
        tokens.push({
          line: lineIndex,
          startChar: line.indexOf(match[0]),
          length: match[0].length,
          tokenType: 0
        });
      }
    }

    if (line.match(/^(Given|When|Then|And|But)\b/i)) {
      const match = line.match(/^(Given|When|Then|And|But)\b/i);
      if (match) {
        tokens.push({
          line: lineIndex,
          startChar: line.indexOf(match[0]),
          length: match[0].length,
          tokenType: 0
        });
      }
    }

    const tagMatches = line.match(/@[^\s]+/g);
    if (tagMatches) {
      for (const tag of tagMatches) {
        tokens.push({
          line: lineIndex,
          startChar: line.indexOf(tag),
          length: tag.length,
          tokenType: 4
        });
      }
    }

    return tokens;
  }
}