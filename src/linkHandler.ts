import * as vscode from 'vscode';
import * as path from 'path';
import { LinkConfig, LinkMatch } from './types';
import { isTextFile } from './config';
import { PathResolver } from './pathResolver';

export class LinkHandler {
  private workspaceFolder?: vscode.WorkspaceFolder;
  private pathResolver: PathResolver;

  constructor() {
    this.workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    this.pathResolver = new PathResolver();
  }

  public async handleLink(match: LinkMatch): Promise<void> {
    const { config } = match;
    
    try {
      switch (config.type) {
        case 'url':
          await this.handleUrlLink(config, match);
          break;
        case 'file':
          await this.handleFileLink(config, match);
          break;

        default:
          throw new Error(`Unknown link type: ${config.type}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open link: ${error}`);
    }
  }

  private async handleUrlLink(config: LinkConfig, match?: LinkMatch): Promise<void> {
    const url = this.resolveVariables(config.target, match);
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }

    await vscode.env.openExternal(vscode.Uri.parse(url));
    vscode.window.showInformationMessage(`Opened URL: ${url}`);
  }

  private async handleFileLink(config: LinkConfig, match: LinkMatch): Promise<void> {
    let filePath = this.resolveVariables(config.target, match);
    
    // Handle path prefixes for inline links
    filePath = this.pathResolver.resolvePathWithPrefix(filePath);
    
    // Handle relative path (fallback for non-prefixed paths)
    if (!path.isAbsolute(filePath)) {
      if (this.workspaceFolder) {
        filePath = path.join(this.workspaceFolder.uri.fsPath, filePath);
      } else {
        throw new Error('No workspace folder found for relative path');
      }
    }

    // Check if file exists
    const fileUri = vscode.Uri.file(filePath);
    try {
      await vscode.workspace.fs.stat(fileUri);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check file extension to determine if it's a text file
    const isTextFileResult = isTextFile(filePath);

    if (isTextFileResult) {
      // Text file: open in current editor
      const document = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(document, {
        viewColumn: vscode.ViewColumn.Active, // Open in current column
        preserveFocus: false // Switch to newly opened file
      });

      // Try to jump to specific line (if line number info is in configuration)
      await this.tryJumpToLine(editor, match);
    } else {
      // Non-text file: open with system default application
      await vscode.env.openExternal(fileUri);
      vscode.window.showInformationMessage(`Opened file with system default application: ${filePath}`);
    }
  }



  private async tryJumpToLine(editor: vscode.TextEditor, match: LinkMatch): Promise<void> {
    // Try to extract line number from matched text
    const lineNumber = this.extractLineNumber(match.text);
    
    if (lineNumber !== null) {
      const position = new vscode.Position(lineNumber - 1, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    }
  }

  private extractLineNumber(text: string): number | null {
    // Try to extract line number from text
    const lineMatch = text.match(/:(\d+)/);
    if (lineMatch) {
      return parseInt(lineMatch[1], 10);
    }
    return null;
  }

  private resolveVariables(target: string, match?: LinkMatch): string {
    let resolved = target;

    // Replace workspace variables
    if (this.workspaceFolder) {
      resolved = resolved.replace(/\${workspaceFolder}/g, this.workspaceFolder.uri.fsPath);
      resolved = resolved.replace(/\${workspaceFolderBasename}/g, this.workspaceFolder.name);
    }

    // Replace environment variables
    resolved = resolved.replace(/\${env:([^}]+)}/g, (match, envVar) => {
      return process.env[envVar] || match;
    });

    // Replace current file path variables
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const fileName = activeEditor.document.fileName;
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      
      resolved = resolved.replace(/\${file}/g, fileName);
      resolved = resolved.replace(/\${fileBasename}/g, path.basename(fileName));
      resolved = resolved.replace(/\${fileDirname}/g, path.dirname(fileName));
      resolved = resolved.replace(/\${fileExtname}/g, path.extname(fileName));
      
      // Relative file paths
      if (workspaceFolder) {
        const relativeFile = path.relative(workspaceFolder.uri.fsPath, fileName);
        const relativeFileDirname = path.dirname(relativeFile);
        
        resolved = resolved.replace(/\${relativeFile}/g, relativeFile);
        resolved = resolved.replace(/\${relativeFileDirname}/g, relativeFileDirname);
      }
      
      // Line number
      const lineNumber = activeEditor.selection.active.line + 1;
      resolved = resolved.replace(/\${lineNumber}/g, lineNumber.toString());
      
      // Selected text
      const selectedText = activeEditor.document.getText(activeEditor.selection);
      if (selectedText) {
        resolved = resolved.replace(/\${selectedText}/g, selectedText);
      }
    }

    // Replace VS Code specific variables
    resolved = resolved.replace(/\${cwd}/g, process.cwd());
    resolved = resolved.replace(/\${userHome}/g, process.env.HOME || process.env.USERPROFILE || '');
    resolved = resolved.replace(/\${appName}/g, 'Code');
    resolved = resolved.replace(/\${appRoot}/g, vscode.env.appRoot);
    resolved = resolved.replace(/\${execPath}/g, process.execPath);

    // Replace regex capture groups
    if (match && match.pattern.type === 'regex' && match.regexGroups) {
      // Use saved capture group information
      resolved = resolved.replace(/\$\{(\d+)\}/g, (matchStr, groupIndex) => {
        const index = parseInt(groupIndex, 10);
        return match.regexGroups[index] || matchStr;
      });
    }

    return resolved;
  }

  public async showLinkMenu(matches: LinkMatch[]): Promise<LinkMatch | undefined> {
    if (matches.length === 0) {
      return undefined;
    }

    if (matches.length === 1) {
      return matches[0];
    }

    // Show menu for multiple matches
    const items = matches.map(match => ({
      label: match.config.name,
      description: match.config.description || match.config.target,
      detail: match.text,
      match
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a link to open'
    });

    return selected?.match;
  }

  public async previewLink(match: LinkMatch): Promise<void> {
    const { config } = match;
    
    let previewText = '';
    
    switch (config.type) {
      case 'url':
        previewText = `URL: ${this.resolveVariables(config.target, match)}`;
        break;
      case 'file':
        previewText = `File: ${this.resolveVariables(config.target, match)}`;
        break;

    }

    vscode.window.showInformationMessage(previewText);
  }
} 