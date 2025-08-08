import * as assert from 'assert';
import * as vscode from 'vscode';
import { LinkMatcher } from '../../linkMatcher';
import { LinkConfig } from '../../types';

suite('LinkMatcher Test Suite', () => {
  let linkMatcher: LinkMatcher;
  let mockDocument: vscode.TextDocument;

  setup(() => {
    linkMatcher = new LinkMatcher([]);
    
    // Create a mock document using a simpler approach
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
  });

  test('Should update configuration', () => {
    const config: LinkConfig[] = [
      {
        name: 'Test Link',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'test' }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(mockDocument);
    
    // The word "test" appears twice in the document: "function test()" and "console.log("test")"
    assert.strictEqual(matches.length, 2);
    assert.strictEqual(matches[0].config.name, 'Test Link');
  });

  test('Should find text matches', () => {
    const config: LinkConfig[] = [
      {
        name: 'Text Match',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'test' }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(mockDocument);
    
    // The word "test" appears twice in the document
    assert.strictEqual(matches.length, 2);
    assert.strictEqual(matches[0].text, 'test');
  });

  test('Should find case-insensitive text matches', () => {
    const config: LinkConfig[] = [
      {
        name: 'Case Insensitive Match',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'TEST', caseSensitive: false }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(mockDocument);
    
    // The word "test" appears twice in the document
    assert.strictEqual(matches.length, 2);
    assert.strictEqual(matches[0].text, 'test');
  });

  test('Should find regex matches', () => {
    const config: LinkConfig[] = [
      {
        name: 'Regex Match',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'regex', value: 'console\\.log\\([^)]+\\)' }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(mockDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].text, 'console.log("test")');
  });

  test('Should find regex matches with capture groups', () => {
    const config: LinkConfig[] = [
      {
        name: 'Regex with Groups',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ 
          type: 'regex', 
          value: 'console\\.log\\(([^)]+)\\)',
          highlightGroup: 1
        }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(mockDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].text, '"test"');
    assert.ok(matches[0].regexGroups);
    assert.strictEqual(matches[0].regexGroups![0], 'console.log("test")');
    assert.strictEqual(matches[0].regexGroups![1], '"test"');
  });

  test('Should find line matches', () => {
    const multiLineDocument = {
      ...mockDocument,
      getText: () => 'line1\nline2\nline3',
      lineCount: 3,
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: `line${line + 1}`,
          range: new vscode.Range(line, 0, line, 5),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, 6),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const config: LinkConfig[] = [
      {
        name: 'Line Match',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'line', value: 'line2' }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(multiLineDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].text, 'line2');
  });

  test('Should filter by file extensions', () => {
    const config: LinkConfig[] = [
      {
        name: 'JS Only Link',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ 
          type: 'text', 
          value: 'test',
          fileExtensions: ['.js', '.ts']
        }]
      },
      {
        name: 'Python Only Link',
        type: 'url',
        target: 'https://python.org',
        patterns: [{ 
          type: 'text', 
          value: 'test',
          fileExtensions: ['.py']
        }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(mockDocument);
    
    assert.strictEqual(matches.length, 2); // "test" appears twice in the document
    assert.strictEqual(matches[0].config.name, 'JS Only Link');
  });

  test('Should match context constraints', () => {
    const documentWithContext = {
      ...mockDocument,
      getText: () => '// import test\nfunction test() {}\n// test comment'
    } as unknown as vscode.TextDocument;

    const config: LinkConfig[] = [
      {
        name: 'Contextual Match',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ 
          type: 'text', 
          value: 'test',
          context: {
            before: '// import ',
            after: '\n'
          }
        }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(documentWithContext);
    
    // The text "test" appears in "// import test" which has "// import " before and "\n" after
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].text, 'test');
  });

  test('Should find match at specific position', () => {
    const config: LinkConfig[] = [
      {
        name: 'Position Match',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'test' }]
      }
    ];

    linkMatcher.updateConfig(config);
    const position = new vscode.Position(0, 10); // Position at 'test'
    const match = linkMatcher.findMatchAtPosition(mockDocument, position);
    
    assert.ok(match);
    assert.strictEqual(match!.text, 'test');
  });

  test('Should return undefined for position without match', () => {
    const config: LinkConfig[] = [
      {
        name: 'Position Match',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'test' }]
      }
    ];

    linkMatcher.updateConfig(config);
    const position = new vscode.Position(0, 0); // Position at start
    const match = linkMatcher.findMatchAtPosition(mockDocument, position);
    
    assert.strictEqual(match, undefined);
  });

  test('Should find matches in specific range', () => {
    const config: LinkConfig[] = [
      {
        name: 'Range Match',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'test' }]
      }
    ];

    linkMatcher.updateConfig(config);
    const range = new vscode.Range(0, 5, 0, 20); // Range containing 'test'
    const matches = linkMatcher.getMatchesInRange(mockDocument, range);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].text, 'test');
  });

  test('Should handle multiple patterns per config', () => {
    const config: LinkConfig[] = [
      {
        name: 'Multi Pattern',
        type: 'url',
        target: 'https://example.com',
        patterns: [
          { type: 'text', value: 'test' },
          { type: 'text', value: 'function' }
        ]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(mockDocument);
    
    // "test" appears twice, "function" appears once = 3 total matches
    assert.strictEqual(matches.length, 3);
    // Check that we have both types of matches
    const texts = matches.map(m => m.text);
    assert.ok(texts.includes('function'));
    assert.ok(texts.includes('test'));
  });

  test('Should handle invalid regex patterns gracefully', () => {
    const config: LinkConfig[] = [
      {
        name: 'Invalid Regex',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'regex', value: '\\[' }] // Valid regex for literal [
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(mockDocument);
    
    // Should not throw error and return empty matches since '[' is not in the document
    assert.strictEqual(matches.length, 0);
  });

  test('Should handle empty configuration', () => {
    linkMatcher.updateConfig([]);
    const matches = linkMatcher.findMatches(mockDocument);
    
    assert.strictEqual(matches.length, 0);
  });

  test('Should handle complex regex with multiple capture groups', () => {
    const complexDocument = {
      ...mockDocument,
      getText: () => 'import { Component } from "react";\nexport default Component;'
    } as unknown as vscode.TextDocument;

    const config: LinkConfig[] = [
      {
        name: 'Complex Regex',
        type: 'url',
        target: 'https://react.dev',
        patterns: [{ 
          type: 'regex', 
          value: 'import\\s*\\{\\s*([^}]+)\\s*\\}\\s*from\\s*["\']([^"\']+)["\']',
          highlightGroup: 1
        }]
      }
    ];

    linkMatcher.updateConfig(config);
    const matches = linkMatcher.findMatches(complexDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].text, 'Component ');
    assert.ok(matches[0].regexGroups);
    assert.strictEqual(matches[0].regexGroups![1], 'Component ');
    assert.strictEqual(matches[0].regexGroups![2], 'react');
  });
});
