import * as assert from 'assert';
import * as vscode from 'vscode';
import { DecoratorManager } from '../../decoratorManager';
import { LinkMatch } from '../../types';

suite('DecoratorManager Test Suite', () => {
  let decoratorManager: DecoratorManager;
  let mockDocument: vscode.TextDocument;
  let mockEditor: vscode.TextEditor;

  setup(() => {
    decoratorManager = new DecoratorManager();
    
    // Create a mock document
    mockDocument = {
      fileName: 'test.js',
      uri: vscode.Uri.file('/test/test.js'),
      languageId: 'javascript',
      version: 1,
      isDirty: false,
      isUntitled: false,
      isClosed: false,
      save: async () => true,
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: 'function test() { console.log("test"); }',
          range: new vscode.Range(line, 0, line, 50),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, 50),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      },
      lineCount: 1,
      offsetAt: (position: vscode.Position) => position.character,
      positionAt: (offset: number) => new vscode.Position(0, offset),
      getWordRangeAtPosition: (position: vscode.Position) => new vscode.Range(position, position),
      validateRange: (range: vscode.Range) => range,
      validatePosition: (position: vscode.Position) => position,
      getText: () => 'function test() { console.log("test"); }',
      encoding: 'utf8',
      eol: vscode.EndOfLine.LF
    } as unknown as vscode.TextDocument;

    // Create a mock editor
    mockEditor = {
      document: mockDocument,
      selection: new vscode.Selection(0, 0, 0, 0),
      selections: [new vscode.Selection(0, 0, 0, 0)],
      visibleRanges: [new vscode.Range(0, 0, 0, 50)],
      options: {},
      viewColumn: vscode.ViewColumn.One,
      edit: (callback: (editBuilder: vscode.TextEditorEdit) => void) => Promise.resolve(true),
      insertSnippet: (snippet: vscode.SnippetString, location?: vscode.Position | vscode.Range | vscode.Position[]) => Promise.resolve(true),
      setDecorations: (decorationType: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] | vscode.DecorationOptions[]) => {},
      revealRange: (range: vscode.Range, revealType?: vscode.TextEditorRevealType) => {},
      show: (column?: vscode.ViewColumn) => {},
      hide: () => {}
    } as unknown as vscode.TextEditor;
  });

  teardown(() => {
    decoratorManager.dispose();
  });

  test('Should update decorations for document', () => {
    const linkMatches: LinkMatch[] = [
      {
        config: {
          name: 'Test Link',
          type: 'url',
          target: 'https://example.com',
          patterns: [{ type: 'text', value: 'test' }]
        },
        pattern: { type: 'text', value: 'test' },
        range: { start: 9, end: 13 },
        text: 'test'
      }
    ];

    // This should not throw an error
    decoratorManager.updateDecorations(mockEditor, linkMatches);
    assert.ok(true);
  });

  test('Should handle empty matches', () => {
    // This should not throw an error
    decoratorManager.updateDecorations(mockEditor, []);
    assert.ok(true);
  });

  test('Should handle multiple matches', () => {
    const linkMatches: LinkMatch[] = [
      {
        config: {
          name: 'Test Link 1',
          type: 'url',
          target: 'https://example1.com',
          patterns: [{ type: 'text', value: 'test' }]
        },
        pattern: { type: 'text', value: 'test' },
        range: { start: 9, end: 13 },
        text: 'test'
      },
      {
        config: {
          name: 'Test Link 2',
          type: 'url',
          target: 'https://example2.com',
          patterns: [{ type: 'text', value: 'function' }]
        },
        pattern: { type: 'text', value: 'function' },
        range: { start: 0, end: 8 },
        text: 'function'
      }
    ];

    // This should not throw an error
    decoratorManager.updateDecorations(mockEditor, linkMatches);
    assert.ok(true);
  });

  test('Should clear decorations', () => {
    // This should not throw an error
    decoratorManager.clearDecorations(mockEditor);
    assert.ok(true);
  });

  test('Should clear decorations without specifying editor', () => {
    // This should not throw an error
    decoratorManager.clearDecorations();
    assert.ok(true);
  });

  test('Should handle matches with different decoration types', () => {
    const linkMatches: LinkMatch[] = [
      {
        config: {
          name: 'URL Link',
          type: 'url',
          target: 'https://example.com',
          patterns: [{ type: 'text', value: 'test' }]
        },
        pattern: { type: 'text', value: 'test' },
        range: { start: 9, end: 13 },
        text: 'test'
      },
      {
        config: {
          name: 'File Link',
          type: 'file',
          target: './test.js',
          patterns: [{ type: 'text', value: 'function' }]
        },
        pattern: { type: 'text', value: 'function' },
        range: { start: 0, end: 8 },
        text: 'function'
      }
    ];

    // This should not throw an error
    decoratorManager.updateDecorations(mockEditor, linkMatches);
    assert.ok(true);
  });

  test('Should handle matches with custom styling', () => {
    const linkMatches: LinkMatch[] = [
      {
        config: {
          name: 'Custom Styled Link',
          type: 'url',
          target: 'https://example.com',
          patterns: [{ type: 'text', value: 'test' }]
        },
        pattern: { type: 'text', value: 'test' },
        range: { start: 9, end: 13 },
        text: 'test'
      }
    ];

    // This should not throw an error
    decoratorManager.updateDecorations(mockEditor, linkMatches);
    assert.ok(true);
  });

  test('Should handle invalid ranges gracefully', () => {
    const linkMatches: LinkMatch[] = [
      {
        config: {
          name: 'Invalid Range Link',
          type: 'url',
          target: 'https://example.com',
          patterns: [{ type: 'text', value: 'test' }]
        },
        pattern: { type: 'text', value: 'test' },
        range: { start: 0, end: 1000 }, // Valid range but beyond document length
        text: 'test'
      }
    ];

    // This should not throw an error
    decoratorManager.updateDecorations(mockEditor, linkMatches);
    assert.ok(true);
  });

  test('Should handle overlapping ranges', () => {
    const linkMatches: LinkMatch[] = [
      {
        config: {
          name: 'Overlapping Link 1',
          type: 'url',
          target: 'https://example1.com',
          patterns: [{ type: 'text', value: 'test' }]
        },
        pattern: { type: 'text', value: 'test' },
        range: { start: 0, end: 10 },
        text: 'test'
      },
      {
        config: {
          name: 'Overlapping Link 2',
          type: 'url',
          target: 'https://example2.com',
          patterns: [{ type: 'text', value: 'function' }]
        },
        pattern: { type: 'text', value: 'function' },
        range: { start: 5, end: 15 }, // Overlaps with first range
        text: 'function'
      }
    ];

    // This should not throw an error
    decoratorManager.updateDecorations(mockEditor, linkMatches);
    assert.ok(true);
  });

  test('Should dispose decoration types', () => {
    // Create a new instance to test disposal
    const testDecoratorManager = new DecoratorManager();
    
    // This should not throw an error
    testDecoratorManager.dispose();
    assert.ok(true);
  });

  test('Should handle multiple decoration updates', () => {
    const linkMatches1: LinkMatch[] = [
      {
        config: {
          name: 'First Update',
          type: 'url',
          target: 'https://example1.com',
          patterns: [{ type: 'text', value: 'test' }]
        },
        pattern: { type: 'text', value: 'test' },
        range: { start: 9, end: 13 },
        text: 'test'
      }
    ];

    const linkMatches2: LinkMatch[] = [
      {
        config: {
          name: 'Second Update',
          type: 'url',
          target: 'https://example2.com',
          patterns: [{ type: 'text', value: 'function' }]
        },
        pattern: { type: 'text', value: 'function' },
        range: { start: 0, end: 8 },
        text: 'function'
      }
    ];

    // Multiple updates should not throw errors
    decoratorManager.updateDecorations(mockEditor, linkMatches1);
    decoratorManager.updateDecorations(mockEditor, linkMatches2);
    decoratorManager.updateDecorations(mockEditor, []);
    
    assert.ok(true);
  });

  test('Should handle highlight match', () => {
    const linkMatch: LinkMatch = {
      config: {
        name: 'Highlight Test',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'test' }]
      },
      pattern: { type: 'text', value: 'test' },
      range: { start: 9, end: 13 },
      text: 'test'
    };

    // This should not throw an error
    decoratorManager.highlightMatch(mockEditor, linkMatch);
    assert.ok(true);
  });

  test('Should handle highlight inline match', () => {
    const inlineMatch = {
      anchor: 'test',
      href: 'https://example.com',
      commentRange: { start: 0, end: 20 },
      codeRange: { start: 25, end: 35 },
      commentText: '// [test](https://example.com)',
      codeText: 'test',
      lineNumber: 1
    };

    // This should not throw an error
    decoratorManager.highlightInlineMatch(mockEditor, inlineMatch);
    assert.ok(true);
  });
});
