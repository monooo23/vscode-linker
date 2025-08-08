import * as vscode from 'vscode';
import { LinkConfig, LinkPattern, LinkMatch } from './types';

export class LinkMatcher {
  private config: LinkConfig[] = [];

  constructor(config: LinkConfig[]) {
    this.config = config;
  }

  public updateConfig(config: LinkConfig[]): void {
    this.config = config;
  }

  public findMatches(document: vscode.TextDocument): LinkMatch[] {
    const matches: LinkMatch[] = [];
    const text = document.getText();
    const fileExtension = this.getFileExtension(document.fileName);

    for (const linkConfig of this.config) {
      for (const pattern of linkConfig.patterns) {
        // Check file extension filtering
        if (pattern.fileExtensions && !pattern.fileExtensions.includes(fileExtension)) {
          continue;
        }

        const patternMatches = this.findPatternMatches(text, pattern, linkConfig);
        matches.push(...patternMatches);
      }
    }

    return matches;
  }

  private findPatternMatches(text: string, pattern: LinkPattern, config: LinkConfig): LinkMatch[] {
    const matches: LinkMatch[] = [];

    switch (pattern.type) {
      case 'text':
        matches.push(...this.findTextMatches(text, pattern, config));
        break;
      case 'regex':
        matches.push(...this.findRegexMatches(text, pattern, config));
        break;
      case 'line':
        matches.push(...this.findLineMatches(text, pattern, config));
        break;
    }

    return matches;
  }

  private findTextMatches(text: string, pattern: LinkPattern, config: LinkConfig): LinkMatch[] {
    const matches: LinkMatch[] = [];
    const searchText = pattern.caseSensitive ? pattern.value : pattern.value.toLowerCase();
    const documentText = pattern.caseSensitive ? text : text.toLowerCase();
    
    let index = 0;
    while (true) {
      const foundIndex = documentText.indexOf(searchText, index);
      if (foundIndex === -1) break;

      // Check context
      if (this.matchesContext(text, pattern, foundIndex)) {
        matches.push({
          config,
          pattern,
          range: {
            start: foundIndex,
            end: foundIndex + pattern.value.length
          },
          text: text.substring(foundIndex, foundIndex + pattern.value.length)
        });
      }

      index = foundIndex + 1;
    }

    return matches;
  }

  private findRegexMatches(text: string, pattern: LinkPattern, config: LinkConfig): LinkMatch[] {
    const matches: LinkMatch[] = [];
    
    try {
      const flags = pattern.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern.value, flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (this.matchesContext(text, pattern, match.index)) {
          // Determine highlight range
          let highlightStart = match.index;
          let highlightEnd = match.index + match[0].length;
          let highlightText = match[0];

          // If specific capture group is specified for highlighting
          if (pattern.highlightGroup !== undefined && pattern.highlightGroup > 0 && match[pattern.highlightGroup]) {
            // Calculate capture group position
            const groupStart = match.index + match[0].indexOf(match[pattern.highlightGroup]);
            const groupEnd = groupStart + match[pattern.highlightGroup].length;
            
            highlightStart = groupStart;
            highlightEnd = groupEnd;
            highlightText = match[pattern.highlightGroup];
          }

          matches.push({
            config,
            pattern,
            range: {
              start: highlightStart,
              end: highlightEnd
            },
            text: highlightText,
            fullMatch: match[0],
            regexGroups: match.slice()
          });
        }
      }
    } catch (error) {
      console.error(`Invalid regex pattern: ${pattern.value}`, error);
    }

    return matches;
  }

  private findLineMatches(text: string, pattern: LinkPattern, config: LinkConfig): LinkMatch[] {
    const matches: LinkMatch[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      if (line.includes(pattern.value)) {
        const lineStart = text.indexOf(line);
        const valueIndex = line.indexOf(pattern.value);
        
        if (this.matchesContext(text, pattern, lineStart + valueIndex)) {
          matches.push({
            config,
            pattern,
            range: {
              start: lineStart + valueIndex,
              end: lineStart + valueIndex + pattern.value.length
            },
            text: pattern.value
          });
        }
      }
    }

    return matches;
  }

  private matchesContext(text: string, pattern: LinkPattern, matchIndex: number): boolean {
    if (!pattern.context) {
      return true;
    }

    const { before, after } = pattern.context;

    // Check preceding context
    if (before) {
      const beforeText = text.substring(Math.max(0, matchIndex - before.length), matchIndex);
      if (beforeText !== before) {
        return false;
      }
    }

    // Check following context
    if (after) {
      const afterText = text.substring(matchIndex + pattern.value.length, matchIndex + pattern.value.length + after.length);
      if (afterText !== after) {
        return false;
      }
    }

    return true;
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  public findMatchAtPosition(document: vscode.TextDocument, position: vscode.Position): LinkMatch | undefined {
    const matches = this.findMatches(document);
    const offset = document.offsetAt(position);

    return matches.find(match => 
      offset >= match.range.start && offset <= match.range.end
    );
  }

  public getMatchesInRange(document: vscode.TextDocument, range: vscode.Range): LinkMatch[] {
    const matches = this.findMatches(document);
    const startOffset = document.offsetAt(range.start);
    const endOffset = document.offsetAt(range.end);

    return matches.filter(match => 
      match.range.start >= startOffset && match.range.end <= endOffset
    );
  }
} 