import * as assert from 'assert';
import * as vscode from 'vscode';
import { LinkerExtension } from '../../extension';

suite('CodeLens Configuration Tests', () => {
  let extension: LinkerExtension;

  setup(() => {
    extension = new LinkerExtension();
  });

  teardown(() => {
    extension.dispose();
  });

  test('Should respect rule-specific showCodeLens when global is disabled', async () => {
    // Mock global configuration with CodeLens disabled
    const mockConfig = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'enableCodeLens') return false;
        return defaultValue;
      }
    };

    // Mock workspace configuration
    Object.defineProperty(vscode.workspace, 'getConfiguration', {
      value: () => mockConfig,
      configurable: true
    });

    // Mock document with rule that has showCodeLens: true
    const mockDocument = {
      fileName: 'test.ts',
      getText: () => 'github.com/example/repo',
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
      lineCount: 1,
      uri: vscode.Uri.file('test.ts')
    };

    // Mock link matcher to return a match with showCodeLens: true
    const mockMatch = {
      config: {
        name: 'GitHub Repository',
        type: 'url' as const,
        target: 'https://github.com/example/repo',
        patterns: [],
        showCodeLens: true // Rule-specific setting
      },
      pattern: { type: 'text' as const, value: 'github.com/example/repo' },
      range: { start: 0, end: 20 },
      text: 'github.com/example/repo'
    };

    // Mock the link matcher
    extension['linkMatcher'] = {
      findMatches: () => [mockMatch]
    } as any;

    // Test that CodeLens is provided even when global setting is false
    const codeLenses = extension['provideCodeLenses'](mockDocument as any);
    
    // Should return CodeLens because rule-specific setting overrides global
    assert.strictEqual(codeLenses.length, 1);
    assert.strictEqual(codeLenses[0].command?.title, '🔗 GitHub Repository');
  });

  test('Should use global setting when rule does not specify showCodeLens', async () => {
    // Mock global configuration with CodeLens enabled
    const mockConfig = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'enableCodeLens') return true;
        return defaultValue;
      }
    };

    // Mock workspace configuration
    Object.defineProperty(vscode.workspace, 'getConfiguration', {
      value: () => mockConfig,
      configurable: true
    });

    // Mock document
    const mockDocument = {
      fileName: 'test.ts',
      getText: () => 'github.com/example/repo',
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
      lineCount: 1,
      uri: vscode.Uri.file('test.ts')
    };

    // Mock link matcher to return a match without showCodeLens
    const mockMatch = {
      config: {
        name: 'GitHub Repository',
        type: 'url' as const,
        target: 'https://github.com/example/repo',
        patterns: []
        // No showCodeLens property - should use global setting
      },
      pattern: { type: 'text' as const, value: 'github.com/example/repo' },
      range: { start: 0, end: 20 },
      text: 'github.com/example/repo'
    };

    // Mock the link matcher
    extension['linkMatcher'] = {
      findMatches: () => [mockMatch]
    } as any;

    // Test that CodeLens is provided when global setting is true
    const codeLenses = extension['provideCodeLenses'](mockDocument as any);
    
    // Should return CodeLens because global setting is true
    assert.strictEqual(codeLenses.length, 1);
    assert.strictEqual(codeLenses[0].command?.title, '🔗 GitHub Repository');
  });

  test('Should not show CodeLens when both global and rule settings are false', async () => {
    // Mock global configuration with CodeLens disabled
    const mockConfig = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'enableCodeLens') return false;
        return defaultValue;
      }
    };

    // Mock workspace configuration
    Object.defineProperty(vscode.workspace, 'getConfiguration', {
      value: () => mockConfig,
      configurable: true
    });

    // Mock document
    const mockDocument = {
      fileName: 'test.ts',
      getText: () => 'github.com/example/repo',
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
      lineCount: 1,
      uri: vscode.Uri.file('test.ts')
    };

    // Mock link matcher to return a match with showCodeLens: false
    const mockMatch = {
      config: {
        name: 'GitHub Repository',
        type: 'url' as const,
        target: 'https://github.com/example/repo',
        patterns: [],
        showCodeLens: false // Rule-specific setting
      },
      pattern: { type: 'text' as const, value: 'github.com/example/repo' },
      range: { start: 0, end: 20 },
      text: 'github.com/example/repo'
    };

    // Mock the link matcher
    extension['linkMatcher'] = {
      findMatches: () => [mockMatch]
    } as any;

    // Test that no CodeLens is provided
    const codeLenses = extension['provideCodeLenses'](mockDocument as any);
    
    // Should not return CodeLens because both settings are false
    assert.strictEqual(codeLenses.length, 0);
  });
});
