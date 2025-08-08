import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { PathResolver } from '../../pathResolver';

suite('Path Prefix Tests', () => {
  let pathResolver: PathResolver;
  let mockWorkspaceFolder: vscode.WorkspaceFolder;
  let mockDocumentPath: string;

  setup(() => {
    pathResolver = new PathResolver();
    
    // Mock workspace folder
    mockWorkspaceFolder = {
      uri: vscode.Uri.file('/workspace/root'),
      name: 'test-workspace',
      index: 0
    };

    // Mock document path
    mockDocumentPath = '/workspace/root/src/components/Button.tsx';

    // Mock vscode.workspace.workspaceFolders
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      get: () => [mockWorkspaceFolder],
      configurable: true
    });
  });

  teardown(() => {
    // Restore original workspaceFolders
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      get: () => undefined,
      configurable: true
    });
  });

  test('Should resolve workspace root prefix (#:)', () => {
    const result = pathResolver.resolvePathWithPrefix('#:package.json', mockDocumentPath);
    const expected = path.join(mockWorkspaceFolder.uri.fsPath, 'package.json');
    assert.strictEqual(result, expected);
  });

  test('Should resolve current directory prefix (~:)', () => {
    const result = pathResolver.resolvePathWithPrefix('~:helper.ts', mockDocumentPath);
    const expected = path.join(path.dirname(mockDocumentPath), 'helper.ts');
    assert.strictEqual(result, expected);
  });

  test('Should resolve parent directory prefix (<:)', () => {
    const result = pathResolver.resolvePathWithPrefix('<:../utils.ts', mockDocumentPath);
    const currentDir = path.dirname(mockDocumentPath);
    const parentDir = path.dirname(currentDir);
    const expected = path.join(parentDir, '../utils.ts');
    assert.strictEqual(result, expected);
  });

  test('Should resolve child directory prefix (>:)', () => {
    const result = pathResolver.resolvePathWithPrefix('>:components/Modal.tsx', mockDocumentPath);
    const currentDir = path.dirname(mockDocumentPath);
    const expected = path.join(currentDir, 'components/Modal.tsx');
    assert.strictEqual(result, expected);
  });

  test('Should detect path prefixes correctly', () => {
    assert.strictEqual(pathResolver.hasPrefix('#:file.ts'), true);
    assert.strictEqual(pathResolver.hasPrefix('~:file.ts'), true);
    assert.strictEqual(pathResolver.hasPrefix('<:file.ts'), true);
    assert.strictEqual(pathResolver.hasPrefix('>:file.ts'), true);
    assert.strictEqual(pathResolver.hasPrefix('./file.ts'), false);
    assert.strictEqual(pathResolver.hasPrefix('file.ts'), false);
  });

  test('Should get available prefixes', () => {
    const prefixes = pathResolver.getAvailablePrefixes();
    assert.deepStrictEqual(prefixes, ['#:', '~:', '<:', '>:']);
  });

  test('Should get prefix descriptions', () => {
    assert.strictEqual(pathResolver.getPrefixDescription('#:'), 'Relative to workspace root');
    assert.strictEqual(pathResolver.getPrefixDescription('~:'), 'Relative to current file directory');
    assert.strictEqual(pathResolver.getPrefixDescription('<:'), 'Relative to parent of current file directory');
    assert.strictEqual(pathResolver.getPrefixDescription('>:'), 'Relative to child directory of current file directory');
  });

  test('Should handle absolute paths without modification', () => {
    const absolutePath = '/absolute/path/file.ts';
    const result = pathResolver.resolvePathWithPrefix(absolutePath, mockDocumentPath);
    assert.strictEqual(result, absolutePath);
  });

  test('Should fallback to workspace root for non-prefixed paths', () => {
    const result = pathResolver.resolvePathWithPrefix('config.json', mockDocumentPath);
    const expected = path.join(mockWorkspaceFolder.uri.fsPath, 'config.json');
    assert.strictEqual(result, expected);
  });
});
