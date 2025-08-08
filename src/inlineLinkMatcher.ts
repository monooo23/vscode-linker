import * as vscode from 'vscode';
import * as path from 'path';
import { InlineLinkMatch } from './types';
import { PathResolver } from './pathResolver';

export class InlineLinkMatcher {
  private linkPattern: RegExp;
  private pathResolver: PathResolver;

  constructor(pattern?: string) {
    this.pathResolver = new PathResolver();
    // Use default pattern or user-provided pattern
    const defaultPattern = "@link\\s+\\[#(?<anchor>.+?)\\]\\((?<link>.+?)\\)";
    const userPattern = pattern || this.getDefaultPattern();
    
    try {
      this.linkPattern = new RegExp(userPattern, 'g');
      this.validatePattern(this.linkPattern);
    } catch (error) {
      console.warn(`Invalid inline link pattern: ${userPattern}, using default pattern`);
      this.linkPattern = new RegExp(defaultPattern, 'g');
    }
  }

  private getDefaultPattern(): string {
    const config = vscode.workspace.getConfiguration('linker');
    return config.get<string>('inlineLinkPattern', "@link\\s+\\[#(?<anchor>.+?)\\]\\((?<link>.+?)\\)");
  }

  private validatePattern(pattern: RegExp): void {
    // Check if required named groups are included
    const patternStr = pattern.source;
    if (!patternStr.includes('(?<anchor>') || !patternStr.includes('(?<link>')) {
      throw new Error('Inline link pattern must include named groups "anchor" and "link"');
    }
  }



  public findInlineMatches(document: vscode.TextDocument): InlineLinkMatch[] {
    const matches: InlineLinkMatch[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    // Calculate start offset for each line
    const lineOffsets: number[] = [];
    let currentOffset = 0;
    for (const line of lines) {
      lineOffsets.push(currentOffset);
      currentOffset += line.length + 1; // +1 for newline character
    }

    // First handle @link in multi-line comments
    const multiLineMatches = this.findMultiLineCommentLinks(text, lines, lineOffsets);
    matches.push(...multiLineMatches);

    // Then handle @link in single-line comments
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i];
      const nextLine = lines[i + 1];
      
      // Check if current line contains @link format comment
      const linkMatches = this.findSingleLineLinkComments(currentLine, i, lineOffsets);
      
      for (const linkMatch of linkMatches) {
        // Find matching anchor text in next line
        const codeMatches = this.findAnchorInCode(nextLine, i + 1, linkMatch.anchor, lineOffsets);
        
        for (const codeMatch of codeMatches) {
          // Resolve path prefixes for file links
          let resolvedHref = linkMatch.href;
          if (this.pathResolver.hasPrefix(linkMatch.href) || 
              linkMatch.href.startsWith('./') || linkMatch.href.startsWith('../')) {
            resolvedHref = this.pathResolver.resolvePathWithPrefix(linkMatch.href, document.fileName);
          }
          
          matches.push({
            anchor: linkMatch.anchor,
            href: resolvedHref,
            commentRange: linkMatch.range,
            codeRange: codeMatch.range,
            commentText: linkMatch.commentText,
            codeText: codeMatch.text,
            lineNumber: i + 2 // Code line number (starting from 1)
          });
        }
      }
    }

    return matches;
  }

  private findMultiLineCommentLinks(text: string, lines: string[], lineOffsets: number[]): InlineLinkMatch[] {
    const matches: InlineLinkMatch[] = [];
    
    // Match multi-line comments /* ... */
    const multiLineCommentPattern = /\/\*[\s\S]*?\*\//g;
    let commentMatch;
    
    while ((commentMatch = multiLineCommentPattern.exec(text)) !== null) {
      const commentText = commentMatch[0];
      const commentStart = commentMatch.index;
      const commentEnd = commentStart + commentText.length;
      
      // Find @link format in multi-line comments
      let linkMatch;
      
      while ((linkMatch = this.linkPattern.exec(commentText)) !== null) {
        const anchor = linkMatch.groups?.anchor || '';
        const href = linkMatch.groups?.link || '';
        const linkStartInComment = linkMatch.index;
        const linkEndInComment = linkStartInComment + linkMatch[0].length;
        
        // Calculate position in entire document
        const linkStart = commentStart + linkStartInComment;
        const linkEnd = commentStart + linkEndInComment;
        
        // Find the next line after comment ends
        const commentEndLine = this.findLineNumber(commentEnd, lineOffsets);
        if (commentEndLine < lines.length - 1) {
          const nextLine = lines[commentEndLine + 1];
          const codeMatches = this.findAnchorInCode(nextLine, commentEndLine + 1, anchor, lineOffsets);
          
          for (const codeMatch of codeMatches) {
            // Resolve path prefixes for file links
            let resolvedHref = href;
            if (this.pathResolver.hasPrefix(href) || 
                href.startsWith('./') || href.startsWith('../')) {
              // Get document path from workspace
              const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
              const documentPath = workspaceFolder ? path.join(workspaceFolder.uri.fsPath, 'temp') : '';
              resolvedHref = this.pathResolver.resolvePathWithPrefix(href, documentPath);
            }
            
            matches.push({
              anchor,
              href: resolvedHref,
              commentRange: {
                start: linkStart,
                end: linkEnd
              },
              codeRange: codeMatch.range,
              commentText: linkMatch[0],
              codeText: codeMatch.text,
              lineNumber: commentEndLine + 2
            });
          }
        }
      }
    }
    
    return matches;
  }

  private findSingleLineLinkComments(line: string, lineIndex: number, lineOffsets: number[]): Array<{
    anchor: string;
    href: string;
    range: { start: number; end: number };
    commentText: string;
  }> {
    const matches: Array<{
      anchor: string;
      href: string;
      range: { start: number; end: number };
      commentText: string;
    }> = [];

    // Use configurable regex to match @link format
    let match;

    while ((match = this.linkPattern.exec(line)) !== null) {
      // Ensure match is in comment
      if (this.isInComment(line, match.index)) {
        const anchor = match.groups?.anchor || '';
        const href = match.groups?.link || '';
        const startOffset = lineOffsets[lineIndex];
        
        matches.push({
          anchor,
          href,
          range: {
            start: startOffset + match.index,
            end: startOffset + match.index + match[0].length
          },
          commentText: match[0]
        });
      }
    }

    return matches;
  }

  private findAnchorInCode(line: string, lineIndex: number, anchor: string, lineOffsets: number[]): Array<{
    range: { start: number; end: number };
    text: string;
  }> {
    const matches: Array<{
      range: { start: number; end: number };
      text: string;
    }> = [];

    // Find anchor text in code line
    // Use word boundaries to ensure exact match
    const anchorPattern = new RegExp(`\\b${this.escapeRegex(anchor)}\\b`, 'g');
    let match;

    while ((match = anchorPattern.exec(line)) !== null) {
      const startOffset = lineOffsets[lineIndex];
      matches.push({
        range: {
          start: startOffset + match.index,
          end: startOffset + match.index + match[0].length
        },
        text: match[0]
      });
    }

    return matches;
  }

  private isInComment(line: string, index: number): boolean {
    // Check if in single-line comment
    const beforeText = line.substring(0, index);
    
    // Check // comment
    const singleLineCommentIndex = beforeText.lastIndexOf('//');
    if (singleLineCommentIndex !== -1) {
      // Ensure there are no string quotes after //
      const afterComment = line.substring(singleLineCommentIndex + 2);
      const beforeHash = afterComment.substring(0, index - singleLineCommentIndex - 2);
      if (!this.hasUnclosedString(beforeHash)) {
        return true;
      }
    }

    // Check /* */ comment
    const multiLineCommentStart = beforeText.lastIndexOf('/*');
    if (multiLineCommentStart !== -1) {
      const afterStart = line.substring(multiLineCommentStart + 2);
      const multiLineCommentEnd = afterStart.indexOf('*/');
      if (multiLineCommentEnd === -1 || multiLineCommentEnd > index - multiLineCommentStart - 2) {
        return true;
      }
    }

    return false;
  }

  private hasUnclosedString(text: string): boolean {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      }
    }

    return inSingleQuote || inDoubleQuote;
  }

  private findLineNumber(offset: number, lineOffsets: number[]): number {
    for (let i = lineOffsets.length - 1; i >= 0; i--) {
      if (offset >= lineOffsets[i]) {
        return i;
      }
    }
    return 0;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public findInlineMatchAtPosition(document: vscode.TextDocument, position: vscode.Position): InlineLinkMatch | undefined {
    const matches = this.findInlineMatches(document);
    const offset = document.offsetAt(position);

    return matches.find(match => 
      (offset >= match.commentRange.start && offset <= match.commentRange.end) ||
      (offset >= match.codeRange.start && offset <= match.codeRange.end)
    );
  }

  public getInlineMatchesInRange(document: vscode.TextDocument, range: vscode.Range): InlineLinkMatch[] {
    const matches = this.findInlineMatches(document);
    const startOffset = document.offsetAt(range.start);
    const endOffset = document.offsetAt(range.end);

    return matches.filter(match => 
      (match.commentRange.start >= startOffset && match.commentRange.end <= endOffset) ||
      (match.codeRange.start >= startOffset && match.codeRange.end <= endOffset)
    );
  }
} 