import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { LinkHandler } from '../../linkHandler';
import { LinkConfig, LinkMatch, LinkPattern } from '../../types';

suite('Variable Support Tests', () => {
  let linkHandler: LinkHandler;
  let mockWorkspaceFolder: vscode.WorkspaceFolder;
  let mockDocument: vscode.TextDocument;
  let mockEditor: vscode.TextEditor;

  setup(() => {
    linkHandler = new LinkHandler();
    
    // Mock workspace folder
    mockWorkspaceFolder = {
      uri: vscode.Uri.file('/workspace/root'),
      name: 'test-workspace',
      index: 0
    };

    // Mock document
    mockDocument = {
      fileName: '/workspace/root/src/components/Button.tsx',
      getText: () => 'test content',
      lineAt: () => ({
        text: 'test line',
        lineNumber: 0,
        range: new vscode.Range(0, 0, 0, 9),
        rangeIncludingLineBreak: new vscode.Range(0, 0, 0, 10),
        firstNonWhitespaceCharacterIndex: 0,
        isEmptyOrWhitespace: false
      }),
      positionAt: () => new vscode.Position(0, 0),
      offsetAt: () => 0,
      validatePosition: () => new vscode.Position(0, 0),
      validateRange: () => new vscode.Range(0, 0, 0, 0),
      getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 0),
      save: () => Promise.resolve(true),
      eol: vscode.EndOfLine.LF,
      languageId: 'typescript',
      version: 1,
      isDirty: false,
      isClosed: false,
      isUntitled: false,
      encoding: 'utf8',
      lineCount: 10,
      uri: vscode.Uri.file('/workspace/root/src/components/Button.tsx')
    };

    // Mock editor
    mockEditor = {
      document: mockDocument,
      selection: new vscode.Selection(5, 0, 5, 10), // Line 6, selected text
      selections: [new vscode.Selection(5, 0, 5, 10)],
      visibleRanges: [new vscode.Range(0, 0, 10, 0)],
      options: {},
      viewColumn: vscode.ViewColumn.One,
      edit: () => Promise.resolve(true),
      insertSnippet: () => Promise.resolve(true),
      setDecorations: () => {},
      revealRange: () => Promise.resolve(),
      show: () => Promise.resolve(),
      hide: () => Promise.resolve()
    };

    // Mock vscode.workspace.workspaceFolders
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      get: () => [mockWorkspaceFolder],
      configurable: true
    });

    // Mock vscode.window.activeTextEditor
    Object.defineProperty(vscode.window, 'activeTextEditor', {
      get: () => mockEditor,
      configurable: true
    });

    // Mock vscode.env.appRoot
    Object.defineProperty(vscode.env, 'appRoot', {
      get: () => '/Applications/Visual Studio Code.app/Contents/Resources/app',
      configurable: true
    });
  });

  teardown(() => {
    // Restore original properties
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      get: () => undefined,
      configurable: true
    });
    Object.defineProperty(vscode.window, 'activeTextEditor', {
      get: () => undefined,
      configurable: true
    });
  });

  test('Should resolve workspace variables', () => {
    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: '${workspaceFolder}/docs/${workspaceFolderBasename}.md',
      patterns: []
    };

    const result = linkHandler['resolveVariables'](config.target);
    const expected = '/workspace/root/docs/test-workspace.md';
    assert.strictEqual(result, expected);
  });

  test('Should resolve file path variables', () => {
    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: '${file} - ${fileBasename} - ${fileDirname} - ${fileExtname}',
      patterns: []
    };

    const result = linkHandler['resolveVariables'](config.target);
    const expected = '/workspace/root/src/components/Button.tsx - Button.tsx - /workspace/root/src/components - .tsx';
    assert.strictEqual(result, expected);
  });

  test('Should resolve relative file variables', () => {
    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: '${relativeFile} - ${relativeFileDirname}',
      patterns: []
    };

    const result = linkHandler['resolveVariables'](config.target);
    const expected = 'src/components/Button.tsx - src/components';
    assert.strictEqual(result, expected);
  });

  test('Should resolve line number variable', () => {
    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: 'line ${lineNumber}',
      patterns: []
    };

    const result = linkHandler['resolveVariables'](config.target);
    const expected = 'line 6'; // Line number is 1-based, selection is at line 5 (0-based)
    assert.strictEqual(result, expected);
  });

  test('Should resolve selected text variable', () => {
    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: 'selected: ${selectedText}',
      patterns: []
    };

    const result = linkHandler['resolveVariables'](config.target);
    const expected = 'selected: test content'; // Mock getText returns 'test content'
    assert.strictEqual(result, expected);
  });

  test('Should resolve VS Code specific variables', () => {
    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: '${cwd} - ${userHome} - ${appName} - ${appRoot}',
      patterns: []
    };

    const result = linkHandler['resolveVariables'](config.target);
    assert.strictEqual(result.includes(process.cwd()), true);
    assert.strictEqual(result.includes('Code'), true);
    assert.strictEqual(result.includes('/Applications/Visual Studio Code.app/Contents/Resources/app'), true);
  });

  test('Should resolve environment variables', () => {
    // Set a test environment variable
    process.env.TEST_VAR = 'test_value';

    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: '${env:TEST_VAR}',
      patterns: []
    };

    const result = linkHandler['resolveVariables'](config.target);
    assert.strictEqual(result, 'test_value');

    // Clean up
    delete process.env.TEST_VAR;
  });

  test('Should resolve regex capture groups', () => {
    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: 'https://api.example.com/${1}/docs/${2}',
      patterns: []
    };

    const match: LinkMatch = {
      config,
      pattern: {
        type: 'regex',
        value: 'api/(\\w+)/(\\w+)'
      } as LinkPattern,
      range: { start: 0, end: 10 },
      text: 'api/users/docs',
      regexGroups: ['api/users/docs', 'users', 'docs']
    };

    const result = linkHandler['resolveVariables'](config.target, match);
    const expected = 'https://api.example.com/users/docs/docs';
    assert.strictEqual(result, expected);
  });

  test('Should handle undefined variables gracefully', () => {
    const config: LinkConfig = {
      name: 'Test',
      type: 'url',
      target: '${undefinedVar}',
      patterns: []
    };

    const result = linkHandler['resolveVariables'](config.target);
    // Should return the original string if variable is not defined
    assert.strictEqual(result, '${undefinedVar}');
  });
});
