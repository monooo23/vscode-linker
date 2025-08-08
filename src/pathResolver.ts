import * as vscode from 'vscode';
import * as path from 'path';
import { getConfig } from './config';

export class PathResolver {
  private config = getConfig();

  /**
   * Resolve path with prefix indicators
   * @param filePath The file path that may contain prefixes
   * @param currentDocumentPath The path of the current document
   * @returns Resolved absolute path
   */
  public resolvePathWithPrefix(filePath: string, currentDocumentPath?: string): string {
    // If it's already an absolute path, return as is
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    // Get current document path if not provided
    if (!currentDocumentPath) {
      const activeEditor = vscode.window.activeTextEditor;
      currentDocumentPath = activeEditor?.document.fileName;
    }

    // Check for configured path prefixes
    for (const [prefix, config] of Object.entries(this.config.pathPrefixes)) {
      if (filePath.startsWith(prefix)) {
        return this.resolveByBase(filePath.substring(prefix.length), config.base, currentDocumentPath);
      }
    }

    // No prefix - relative to workspace root (existing behavior)
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      return path.join(workspaceFolder.uri.fsPath, filePath);
    }

    // Fallback to current directory if no workspace
    if (currentDocumentPath) {
      return path.join(path.dirname(currentDocumentPath), filePath);
    }

    return filePath;
  }

  /**
   * Resolve path based on the specified base type
   * @param relativePath The relative path after removing prefix
   * @param base The base type: workspace, current, parent, or child
   * @param currentDocumentPath The current document path
   * @returns Resolved absolute path
   */
  private resolveByBase(relativePath: string, base: string, currentDocumentPath?: string): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    switch (base) {
      case 'workspace':
        if (workspaceFolder) {
          return path.join(workspaceFolder.uri.fsPath, relativePath);
        }
        break;

      case 'current':
        if (currentDocumentPath) {
          const currentDir = path.dirname(currentDocumentPath);
          return path.join(currentDir, relativePath);
        }
        break;

      case 'parent':
        if (currentDocumentPath) {
          const currentDir = path.dirname(currentDocumentPath);
          const parentDir = path.dirname(currentDir);
          return path.join(parentDir, relativePath);
        }
        break;

      case 'child':
        if (currentDocumentPath) {
          const currentDir = path.dirname(currentDocumentPath);
          return path.join(currentDir, relativePath);
        }
        break;
    }

    // Fallback to workspace root
    if (workspaceFolder) {
      return path.join(workspaceFolder.uri.fsPath, relativePath);
    }

    return relativePath;
  }

  /**
   * Check if a path has a configured prefix
   * @param filePath The file path to check
   * @returns True if the path has a configured prefix
   */
  public hasPrefix(filePath: string): boolean {
    return Object.keys(this.config.pathPrefixes).some(prefix => filePath.startsWith(prefix));
  }

  /**
   * Get all available path prefixes
   * @returns Array of prefix strings
   */
  public getAvailablePrefixes(): string[] {
    return Object.keys(this.config.pathPrefixes);
  }

  /**
   * Get prefix description
   * @param prefix The prefix to get description for
   * @returns Description of the prefix
   */
  public getPrefixDescription(prefix: string): string | undefined {
    return this.config.pathPrefixes[prefix]?.description;
  }
}
