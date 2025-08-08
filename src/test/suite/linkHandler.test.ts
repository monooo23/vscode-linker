import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { LinkHandler } from '../../linkHandler';
import { LinkMatch } from '../../types';

suite('LinkHandler Test Suite', () => {
  let linkHandler: LinkHandler;
  let tempDir: string;

  setup(() => {
    linkHandler = new LinkHandler();
    
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linker-test-'));
  });

  teardown(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('Should open URL links', async () => {
    const mockOpenExternal = vscode.env.openExternal;
    let openedUrl: string | undefined;
    
    // Mock the openExternal function
    (vscode.env as unknown as { openExternal: (uri: vscode.Uri) => Thenable<boolean> }).openExternal = async (uri: vscode.Uri) => {
      openedUrl = uri.toString();
      return true;
    };

    const linkMatch: LinkMatch = {
      config: {
        name: 'Test URL',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.strictEqual(openedUrl, 'https://example.com/');
    
    // Restore original function
    (vscode.env as unknown as { openExternal: (uri: vscode.Uri) => Thenable<boolean> }).openExternal = mockOpenExternal;
  });

  test('Should open file links with absolute paths', async () => {
    // Create a test file
    const testFilePath = path.join(tempDir, 'testfile.txt');
    fs.writeFileSync(testFilePath, 'Test content');
    
    const linkMatch: LinkMatch = {
      config: {
        name: 'Test File',
        type: 'file',
        target: testFilePath,
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockOpenTextDocument = vscode.workspace.openTextDocument;
    const mockShowTextDocument = vscode.window.showTextDocument;
    let openedUri: vscode.Uri | undefined;
    
    // Mock the openTextDocument function
    (vscode.workspace as unknown as { openTextDocument: (uri: vscode.Uri) => Thenable<vscode.TextDocument> }).openTextDocument = async (uri: vscode.Uri) => {
      openedUri = uri;
      return {} as vscode.TextDocument;
    };

    // Mock the showTextDocument function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = async (documentOrUri: vscode.TextDocument | vscode.Uri) => {
      return {} as vscode.TextEditor;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.strictEqual(openedUri!.fsPath, testFilePath);
    
    // Restore original functions
    (vscode.workspace as unknown as { openTextDocument: (uri: vscode.Uri) => Thenable<vscode.TextDocument> }).openTextDocument = mockOpenTextDocument;
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = mockShowTextDocument;
  });

  test('Should open file links with relative paths', async () => {
    // Create a test file
    const testFilePath = path.join(tempDir, 'testfile.txt');
    fs.writeFileSync(testFilePath, 'Test content');
    
    const linkMatch: LinkMatch = {
      config: {
        name: 'Test File',
        type: 'file',
        target: './testfile.txt',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockOpenTextDocument = vscode.workspace.openTextDocument;
    const mockShowTextDocument = vscode.window.showTextDocument;
    let openedUri: vscode.Uri | undefined;
    
    // Mock the openTextDocument function
    (vscode.workspace as unknown as { openTextDocument: (uri: vscode.Uri) => Thenable<vscode.TextDocument> }).openTextDocument = async (uri: vscode.Uri) => {
      openedUri = uri;
      return {} as vscode.TextDocument;
    };

    // Mock the showTextDocument function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = async (documentOrUri: vscode.TextDocument | vscode.Uri) => {
      return {} as vscode.TextEditor;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.strictEqual(openedUri!.fsPath, testFilePath);
    
    // Restore original functions
    (vscode.workspace as unknown as { openTextDocument: (uri: vscode.Uri) => Thenable<vscode.TextDocument> }).openTextDocument = mockOpenTextDocument;
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = mockShowTextDocument;
  });

  test('Should handle file links with line numbers', async () => {
    // Create a test file
    const testFilePath = path.join(tempDir, 'testfile.txt');
    fs.writeFileSync(testFilePath, 'line1\nline2\nline3');
    
    const linkMatch: LinkMatch = {
      config: {
        name: 'Test File with Line',
        type: 'file',
        target: './testfile.txt:2',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockShowTextDocument = vscode.window.showTextDocument;
    let openedUri: vscode.Uri | undefined;
    let openedOptions: vscode.TextDocumentShowOptions | undefined;
    
    // Mock the showTextDocument function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = async (documentOrUri: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => {
      if (documentOrUri instanceof vscode.Uri) {
        openedUri = documentOrUri;
      }
      openedOptions = options;
      return {} as vscode.TextEditor;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.strictEqual(openedUri!.fsPath, testFilePath);
    assert.ok(openedOptions);
    
    // Restore original function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = mockShowTextDocument;
  });

  test('Should handle file links with line and column numbers', async () => {
    // Create a test file
    const testFilePath = path.join(tempDir, 'testfile.txt');
    fs.writeFileSync(testFilePath, 'line1\nline2\nline3');
    
    const linkMatch: LinkMatch = {
      config: {
        name: 'Test File with Line and Column',
        type: 'file',
        target: './testfile.txt:2:3',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockShowTextDocument = vscode.window.showTextDocument;
    let openedUri: vscode.Uri | undefined;
    let openedOptions: vscode.TextDocumentShowOptions | undefined;
    
    // Mock the showTextDocument function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = async (documentOrUri: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => {
      if (documentOrUri instanceof vscode.Uri) {
        openedUri = documentOrUri;
      }
      openedOptions = options;
      return {} as vscode.TextEditor;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.strictEqual(openedUri!.fsPath, testFilePath);
    assert.ok(openedOptions);
    
    // Restore original function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = mockShowTextDocument;
  });

  test('Should handle non-existent files gracefully', async () => {
    const linkMatch: LinkMatch = {
      config: {
        name: 'Non-existent File',
        type: 'file',
        target: './nonexistent.txt',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockShowErrorMessage = vscode.window.showErrorMessage;
    let errorMessage: string | undefined;
    
    // Mock the showErrorMessage function
    (vscode.window as unknown as { showErrorMessage: (message: string) => Thenable<string | undefined> }).showErrorMessage = async (message: string) => {
      errorMessage = message;
      return undefined;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.ok(errorMessage);
    assert.ok(errorMessage.includes('File not found'));
    
    // Restore original function
    (vscode.window as unknown as { showErrorMessage: (message: string) => Thenable<string | undefined> }).showErrorMessage = mockShowErrorMessage;
  });

  test('Should handle invalid URLs gracefully', async () => {
    const linkMatch: LinkMatch = {
      config: {
        name: 'Invalid URL',
        type: 'url',
        target: 'invalid-url',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockShowErrorMessage = vscode.window.showErrorMessage;
    let errorMessage: string | undefined;
    
    // Mock the showErrorMessage function
    (vscode.window as unknown as { showErrorMessage: (message: string) => Thenable<string | undefined> }).showErrorMessage = async (message: string) => {
      errorMessage = message;
      return undefined;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.ok(errorMessage);
    assert.ok(errorMessage.includes('Invalid URL'));
    
    // Restore original function
    (vscode.window as unknown as { showErrorMessage: (message: string) => Thenable<string | undefined> }).showErrorMessage = mockShowErrorMessage;
  });

  test('Should handle variable substitution in targets', async () => {
    const linkMatch: LinkMatch = {
      config: {
        name: 'Variable Substitution',
        type: 'url',
        target: 'https://example.com/docs/${text}',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test',
      fullMatch: 'test'
    };

    const mockOpenExternal = vscode.env.openExternal;
    let openedUrl: string | undefined;
    
    // Mock the openExternal function
    (vscode.env as unknown as { openExternal: (uri: vscode.Uri) => Thenable<boolean> }).openExternal = async (uri: vscode.Uri) => {
      openedUrl = uri.toString();
      return true;
    };

    await linkHandler.handleLink(linkMatch);
    
    // The ${text} variable is not supported, so it should remain as-is
    assert.strictEqual(openedUrl, 'https://example.com/docs/%24%7Btext%7D');
    
    // Restore original function
    (vscode.env as unknown as { openExternal: (uri: vscode.Uri) => Thenable<boolean> }).openExternal = mockOpenExternal;
  });

  test('Should handle regex capture group substitution', async () => {
    const linkMatch: LinkMatch = {
      config: {
        name: 'Regex Substitution',
        type: 'url',
        target: 'https://example.com/docs/${1}',
        patterns: [{ type: 'regex', value: 'function\\s+([a-zA-Z_][a-zA-Z0-9_]*)' }]
      },
      pattern: { type: 'regex', value: 'function\\s+([a-zA-Z_][a-zA-Z0-9_]*)' },
      range: { start: 0, end: 13 },
      text: 'test',
      fullMatch: 'function test',
      regexGroups: ['function test', 'test']
    };

    const mockOpenExternal = vscode.env.openExternal;
    let openedUrl: string | undefined;
    
    // Mock the openExternal function
    (vscode.env as unknown as { openExternal: (uri: vscode.Uri) => Thenable<boolean> }).openExternal = async (uri: vscode.Uri) => {
      openedUrl = uri.toString();
      return true;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.strictEqual(openedUrl, 'https://example.com/docs/test');
    
    // Restore original function
    (vscode.env as unknown as { openExternal: (uri: vscode.Uri) => Thenable<boolean> }).openExternal = mockOpenExternal;
  });

  test('Should handle file paths with workspace variables', async () => {
    // Create a test file in workspace
    const workspaceFile = path.join(tempDir, 'workspace', 'test.txt');
    fs.mkdirSync(path.dirname(workspaceFile), { recursive: true });
    fs.writeFileSync(workspaceFile, 'Workspace content');
    
    const linkMatch: LinkMatch = {
      config: {
        name: 'Workspace File',
        type: 'file',
        target: '${workspaceFolder}/workspace/test.txt',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockShowTextDocument = vscode.window.showTextDocument;
    let openedUri: vscode.Uri | undefined;
    
    // Mock the showTextDocument function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = async (documentOrUri: vscode.TextDocument | vscode.Uri) => {
      if (documentOrUri instanceof vscode.Uri) {
        openedUri = documentOrUri;
      }
      return {} as vscode.TextEditor;
    };

    // Mock workspace folder
    const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: [{
        uri: vscode.Uri.file(tempDir),
        name: 'test-workspace',
        index: 0
      }],
      writable: true
    });

    await linkHandler.handleLink(linkMatch);
    
    assert.strictEqual(openedUri!.fsPath, workspaceFile);
    
    // Restore original functions
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = mockShowTextDocument;
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: originalWorkspaceFolders,
      writable: true
    });
  });

  test('Should handle file paths with current file directory', async () => {
    // Create a test file relative to current document
    const relativeFile = path.join(tempDir, 'relative', 'test.txt');
    fs.mkdirSync(path.dirname(relativeFile), { recursive: true });
    fs.writeFileSync(relativeFile, 'Relative content');
    
    const linkMatch: LinkMatch = {
      config: {
        name: 'Relative File',
        type: 'file',
        target: '${fileDirname}/relative/test.txt',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockShowTextDocument = vscode.window.showTextDocument;
    let openedUri: vscode.Uri | undefined;
    
    // Mock the showTextDocument function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = async (documentOrUri: vscode.TextDocument | vscode.Uri) => {
      if (documentOrUri instanceof vscode.Uri) {
        openedUri = documentOrUri;
      }
      return {} as vscode.TextEditor;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.strictEqual(openedUri!.fsPath, relativeFile);
    
    // Restore original function
    (vscode.window as unknown as { showTextDocument: (document: vscode.TextDocument | vscode.Uri, options?: vscode.TextDocumentShowOptions) => Thenable<vscode.TextEditor> }).showTextDocument = mockShowTextDocument;
  });

  test('Should handle unsupported link types gracefully', async () => {
    const linkMatch: LinkMatch = {
      config: {
        name: 'Unsupported Type',
        type: 'unsupported' as 'url' | 'file',
        target: 'some-target',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 0, end: 4 },
      text: 'test'
    };

    const mockShowErrorMessage = vscode.window.showErrorMessage;
    let errorMessage: string | undefined;
    
    // Mock the showErrorMessage function
    (vscode.window as unknown as { showErrorMessage: (message: string) => Thenable<string | undefined> }).showErrorMessage = async (message: string) => {
      errorMessage = message;
      return undefined;
    };

    await linkHandler.handleLink(linkMatch);
    
    assert.ok(errorMessage);
    assert.ok(errorMessage.includes('Unknown link type'));
    
    // Restore original function
    (vscode.window as unknown as { showErrorMessage: (message: string) => Thenable<string | undefined> }).showErrorMessage = mockShowErrorMessage;
  });
});
