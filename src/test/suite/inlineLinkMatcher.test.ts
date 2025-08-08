import * as assert from 'assert';
import * as vscode from 'vscode';
import { InlineLinkMatcher } from '../../inlineLinkMatcher';

suite('InlineLinkMatcher Test Suite', () => {
  let inlineLinkMatcher: InlineLinkMatcher;
  let mockDocument: vscode.TextDocument;

  setup(() => {
    // Default pattern for testing with named groups - using @link format
    const defaultPattern = '@link\\s+\\[#(?<anchor>[^\\]]+)\\]\\((?<link>[^)]+)\\)';
    inlineLinkMatcher = new InlineLinkMatcher(defaultPattern);
    
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
          text: line === 0 ? '// @link [#framework](https://example.com)' : 'function test() {}',
          range: new vscode.Range(line, 0, line, line === 0 ? 43 : 15),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, line === 0 ? 44 : 16),
          firstNonWhitespaceCharacterIndex: line === 0 ? 0 : 0,
          isEmptyOrWhitespace: false
        };
      },
      lineCount: 2,
      offsetAt: (position: vscode.Position) => position.line * 50 + position.character,
      positionAt: (offset: number) => new vscode.Position(Math.floor(offset / 50), offset % 50),
      getWordRangeAtPosition: (position: vscode.Position) => new vscode.Range(position, position),
      validateRange: (range: vscode.Range) => range,
      validatePosition: (position: vscode.Position) => position,
      getText: () => '// @link [#framework](https://example.com)\nfunction test() {}',
      encoding: 'utf8',
      eol: vscode.EndOfLine.LF
    } as unknown as vscode.TextDocument;
  });

  test('Should find inline links with default pattern', () => {
    const matches = inlineLinkMatcher.findInlineMatches(mockDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].anchor, 'framework');
    assert.strictEqual(matches[0].href, 'https://example.com');
    assert.strictEqual(matches[0].lineNumber, 0);
  });

  test('Should find multiple inline links', () => {
    const multiLinkDocument = {
      ...mockDocument,
      getText: () => '// @link [#link1](https://example1.com)\n// @link [#link2](https://example2.com)',
      lineCount: 2,
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: `// @link [#link${line + 1}](https://example${line + 1}.com)`,
          range: new vscode.Range(line, 0, line, 43),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, 44),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = inlineLinkMatcher.findInlineMatches(multiLinkDocument);
    
    assert.strictEqual(matches.length, 2);
    assert.strictEqual(matches[0].anchor, 'link1');
    assert.strictEqual(matches[0].href, 'https://example1.com');
    assert.strictEqual(matches[1].anchor, 'link2');
    assert.strictEqual(matches[1].href, 'https://example2.com');
  });

  test('Should handle custom pattern', () => {
    const customPattern = '\\{\\{(?<anchor>[^}]+)\\}\\}';
    const customMatcher = new InlineLinkMatcher(customPattern);
    
    const customDocument = {
      ...mockDocument,
      getText: () => '// {{custom link}}\nfunction test() {}',
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: line === 0 ? '// {{custom link}}' : 'function test() {}',
          range: new vscode.Range(line, 0, line, line === 0 ? 20 : 15),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, line === 0 ? 21 : 16),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = customMatcher.findInlineMatches(customDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].anchor, 'custom link');
    assert.strictEqual(matches[0].href, 'custom link');
  });

  test('Should handle pattern with multiple capture groups', () => {
    const multiGroupPattern = '@link\\s+\\[#(?<anchor>[^\\]]+)\\]\\((?<link>[^)]+)\\)\\s*\\|\\s*([^\\s]+)';
    const multiGroupMatcher = new InlineLinkMatcher(multiGroupPattern);
    
    const multiGroupDocument = {
      ...mockDocument,
      getText: () => '// @link [#link](https://example.com) | tooltip',
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: '// @link [#link](https://example.com) | tooltip',
          range: new vscode.Range(line, 0, line, 48),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, 49),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = multiGroupMatcher.findInlineMatches(multiGroupDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].anchor, 'link');
    assert.strictEqual(matches[0].href, 'https://example.com');
  });

  test('Should handle empty pattern', () => {
    const emptyMatcher = new InlineLinkMatcher('');
    const matches = emptyMatcher.findInlineMatches(mockDocument);
    
    assert.strictEqual(matches.length, 0);
  });

  test('Should handle invalid regex pattern', () => {
    const invalidMatcher = new InlineLinkMatcher('[');
    const matches = invalidMatcher.findInlineMatches(mockDocument);
    
    // Should not throw error and return empty matches
    assert.strictEqual(matches.length, 0);
  });

  test('Should handle document without matches', () => {
    const noMatchDocument = {
      ...mockDocument,
      getText: () => 'function test() {}\n// No links here',
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: line === 0 ? 'function test() {}' : '// No links here',
          range: new vscode.Range(line, 0, line, line === 0 ? 15 : 15),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, line === 0 ? 16 : 16),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = inlineLinkMatcher.findInlineMatches(noMatchDocument);
    
    assert.strictEqual(matches.length, 0);
  });

  test('Should handle malformed links gracefully', () => {
    const malformedDocument = {
      ...mockDocument,
      getText: () => '// @link [#incomplete link\n// @link [#](empty href)\n// @link [#no href]',
      lineCount: 3,
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: ['// @link [#incomplete link', '// @link [#](empty href)', '// @link [#no href]'][line],
          range: new vscode.Range(line, 0, line, 28),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, 29),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = inlineLinkMatcher.findInlineMatches(malformedDocument);
    
    // Should only match valid links
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].anchor, '');
    assert.strictEqual(matches[0].href, 'empty href');
  });

  test('Should handle links with special characters', () => {
    const specialCharDocument = {
      ...mockDocument,
      getText: () => '// @link [#special & chars](https://example.com/path?param=value&other=123)',
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: '// @link [#special & chars](https://example.com/path?param=value&other=123)',
          range: new vscode.Range(line, 0, line, 78),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, 79),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = inlineLinkMatcher.findInlineMatches(specialCharDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].anchor, 'special & chars');
    assert.strictEqual(matches[0].href, 'https://example.com/path?param=value&other=123');
  });

  test('Should handle multi-line links', () => {
    const multiLineDocument = {
      ...mockDocument,
      getText: () => '// [multi\n// line](https://example.com)',
      lineCount: 2,
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: line === 0 ? '// [multi' : '// line](https://example.com)',
          range: new vscode.Range(line, 0, line, line === 0 ? 10 : 30),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, line === 0 ? 11 : 31),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = inlineLinkMatcher.findInlineMatches(multiLineDocument);
    
    // Should not match multi-line links with default pattern
    assert.strictEqual(matches.length, 0);
  });

  test('Should handle pattern with escaped characters', () => {
    const escapedPattern = '@link\\s+\\[#(?<anchor>[^\\]]+)\\]\\((?<link>[^)]+)\\)';
    const escapedMatcher = new InlineLinkMatcher(escapedPattern);
    
    const escapedDocument = {
      ...mockDocument,
      getText: () => '// @link [#escaped](https://example.com)',
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: '// @link [#escaped](https://example.com)',
          range: new vscode.Range(line, 0, line, 43),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, 44),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = escapedMatcher.findInlineMatches(escapedDocument);
    
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].anchor, 'escaped');
    assert.strictEqual(matches[0].href, 'https://example.com');
  });

  test('Should handle pattern with optional groups', () => {
    const optionalPattern = '@link\\s+\\[#(?<anchor>[^\\]]+)\\]\\((?<link>[^)]+)\\)(?:\\s*\\|\\s*([^\\s]+))?';
    const optionalMatcher = new InlineLinkMatcher(optionalPattern);
    
    const optionalDocument = {
      ...mockDocument,
      getText: () => '// @link [#link1](https://example1.com)\n// @link [#link2](https://example2.com) | tooltip',
      lineCount: 2,
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber: line,
          text: line === 0 ? '// @link [#link1](https://example1.com)' : '// @link [#link2](https://example2.com) | tooltip',
          range: new vscode.Range(line, 0, line, line === 0 ? 43 : 53),
          rangeIncludingLineBreak: new vscode.Range(line, 0, line, line === 0 ? 44 : 54),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: false
        };
      }
    } as unknown as vscode.TextDocument;

    const matches = optionalMatcher.findInlineMatches(optionalDocument);
    
    assert.strictEqual(matches.length, 2);
    assert.strictEqual(matches[0].anchor, 'link1');
    assert.strictEqual(matches[0].href, 'https://example1.com');
    assert.strictEqual(matches[1].anchor, 'link2');
    assert.strictEqual(matches[1].href, 'https://example2.com');
  });
});
