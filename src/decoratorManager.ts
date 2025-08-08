import * as vscode from 'vscode';
import { LinkMatch, InlineLinkMatch } from './types';

export class DecoratorManager {
  private linkDecorationType: vscode.TextEditorDecorationType;
  private hoverDecorationType: vscode.TextEditorDecorationType;
  private activeEditor?: vscode.TextEditor;

  constructor() {
    // Create link decorator
    this.linkDecorationType = vscode.window.createTextEditorDecorationType({
      textDecoration: 'underline',
      cursor: 'pointer'
    });

    // Create hover decorator
    this.hoverDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: '#0066cc20',
      border: '1px solid #0066cc',
      borderRadius: '2px'
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
      this.activeEditor = editor;
    });

    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(event => {
      if (this.activeEditor && event.document === this.activeEditor.document) {
        // Reapply decorations when document changes
        this.updateDecorations(this.activeEditor, []);
      }
    });
  }

  public updateDecorations(editor: vscode.TextEditor, matches: LinkMatch[], inlineMatches: InlineLinkMatch[] = []): void {
    if (!editor) return;

    const ranges: vscode.Range[] = [];
    const hoverRanges: vscode.Range[] = [];

    // Handle regular link matches
    for (const match of matches) {
      const startPos = editor.document.positionAt(match.range.start);
      const endPos = editor.document.positionAt(match.range.end);
      const range = new vscode.Range(startPos, endPos);

      ranges.push(range);
    }

    // Handle inline link matches
    for (const match of inlineMatches) {
      // Only decorate the anchor in code section, not comment section
      const codeStartPos = editor.document.positionAt(match.codeRange.start);
      const codeEndPos = editor.document.positionAt(match.codeRange.end);
      const codeRange = new vscode.Range(codeStartPos, codeEndPos);
      ranges.push(codeRange);
    }

    // Apply decorations
    editor.setDecorations(this.linkDecorationType, ranges);
    editor.setDecorations(this.hoverDecorationType, hoverRanges);
  }

  public clearDecorations(editor?: vscode.TextEditor): void {
    const targetEditor = editor || this.activeEditor;
    if (targetEditor) {
      targetEditor.setDecorations(this.linkDecorationType, []);
      targetEditor.setDecorations(this.hoverDecorationType, []);
    }
  }

  public highlightMatch(editor: vscode.TextEditor, match: LinkMatch): void {
    const startPos = editor.document.positionAt(match.range.start);
    const endPos = editor.document.positionAt(match.range.end);
    const range = new vscode.Range(startPos, endPos);

    // Temporarily highlight matched text
    editor.setDecorations(this.hoverDecorationType, [range]);

    // Clear highlight after 3 seconds
    setTimeout(() => {
      editor.setDecorations(this.hoverDecorationType, []);
    }, 3000);
  }

  public highlightInlineMatch(editor: vscode.TextEditor, match: InlineLinkMatch): void {
    // Only highlight the anchor in code section, not comment section
    const codeStartPos = editor.document.positionAt(match.codeRange.start);
    const codeEndPos = editor.document.positionAt(match.codeRange.end);
    const codeRange = new vscode.Range(codeStartPos, codeEndPos);

    // Temporarily highlight matched text
    editor.setDecorations(this.hoverDecorationType, [codeRange]);

    // Clear highlight after 3 seconds
    setTimeout(() => {
      editor.setDecorations(this.hoverDecorationType, []);
    }, 3000);
  }

  public dispose(): void {
    this.linkDecorationType.dispose();
    this.hoverDecorationType.dispose();
  }
} 