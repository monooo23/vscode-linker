import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigManager } from './configManager';
import { LinkMatcher } from './linkMatcher';
import { InlineLinkMatcher } from './inlineLinkMatcher';
import { LinkHandler } from './linkHandler';
import { DecoratorManager } from './decoratorManager';
import { LinkMatch, InlineLinkMatch } from './types';
import { getTextFileExtensions, isTextFile, getDefaultIcon } from './config';

export class LinkerExtension {
  private configManager: ConfigManager;
  private linkMatcher: LinkMatcher;
  private inlineLinkMatcher: InlineLinkMatcher;
  private linkHandler: LinkHandler;
  private decoratorManager: DecoratorManager;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.configManager = new ConfigManager();
    this.linkMatcher = new LinkMatcher([]);

    // Get inline link regex configuration
    const linkerConfig = vscode.workspace.getConfiguration('linker');
    const inlineLinkPattern = linkerConfig.get<string>('inlineLinkPattern');
    this.inlineLinkMatcher = new InlineLinkMatcher(inlineLinkPattern);

    this.linkHandler = new LinkHandler();
    this.decoratorManager = new DecoratorManager();
  }

  public async activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('Linker extension is now active!');

    // Load configuration
    await this.loadConfiguration();

    // Setup configuration change listener
    this.setupConfigChangeListener();

    // Register commands
    this.registerCommands(context);

    // Setup event listeners
    this.setupEventListeners();

    // Initialize current editor
    this.updateCurrentEditor();
  }

  private async loadConfiguration(): Promise<void> {
    const config = await this.configManager.loadConfig();
    this.linkMatcher.updateConfig(config);
  }

  private setupConfigChangeListener(): void {
    this.configManager.onConfigChanged((config) => {
      this.linkMatcher.updateConfig(config);
      this.updateCurrentEditor();
      vscode.window.showInformationMessage('Linker configuration updated automatically');
    });
  }

  private registerCommands(context: vscode.ExtensionContext): void {
    // Register open link command
    const openLinkCommand = vscode.commands.registerCommand('linker.openLink', async () => {
      await this.handleOpenLink();
    });
    context.subscriptions.push(openLinkCommand);

    // Register configure links command
    const configureLinksCommand = vscode.commands.registerCommand('linker.configureLinks', async () => {
      await this.handleConfigureLinks();
    });
    context.subscriptions.push(configureLinksCommand);

    // Register reload config command
    const reloadConfigCommand = vscode.commands.registerCommand('linker.reloadConfig', async () => {
      await this.handleReloadConfig();
    });
    context.subscriptions.push(reloadConfigCommand);
  }

  private setupEventListeners(): void {
    // Listen for editor changes
    const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
      this.updateCurrentEditor();
    });
    this.disposables.push(editorChangeDisposable);

    // Listen for document changes
    const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
      this.updateCurrentEditor();
    });
    this.disposables.push(documentChangeDisposable);

    // Listen for mouse hover
    const hoverDisposable = vscode.languages.registerHoverProvider('*', {
      provideHover: (document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) => {
        return this.provideHover(document, position);
      }
    });
    this.disposables.push(hoverDisposable);

    // Listen for mouse clicks - CodeLens functionality (controlled by configuration)
    const clickDisposable = vscode.languages.registerCodeLensProvider('*', {
      provideCodeLenses: (document: vscode.TextDocument, token: vscode.CancellationToken) => {
        return this.provideCodeLenses(document);
      }
    });
    this.disposables.push(clickDisposable);

    // Register Link Provider - Support Command+click navigation
    const linkDisposable = vscode.languages.registerDocumentLinkProvider('*', {
      provideDocumentLinks: (document: vscode.TextDocument, token: vscode.CancellationToken) => {
        const links: vscode.DocumentLink[] = [];

        // Handle regular links
        const matches = this.linkMatcher.findMatches(document);
        for (const match of matches) {
          const { config } = match;
          const resolvedTarget = this.resolveTarget(config.target, document, match);

          const range = new vscode.Range(
            document.positionAt(match.range.start),
            document.positionAt(match.range.end)
          );

          const documentLink = this.createDocumentLink(range, resolvedTarget, document);
          if (documentLink) {
            links.push(documentLink);
          }
        }

        // Handle inline links
        const linkerConfig = vscode.workspace.getConfiguration('linker');
        const enableInlineLinks = linkerConfig.get<boolean>('enableInlineLinks', true);

        if (enableInlineLinks) {
          const inlineMatches = this.inlineLinkMatcher.findInlineMatches(document);
          for (const match of inlineMatches) {
            const range = new vscode.Range(
              document.positionAt(match.codeRange.start),
              document.positionAt(match.codeRange.end)
            );

            const documentLink = this.createDocumentLink(range, match.href, document);
            if (documentLink) {
              links.push(documentLink);
            }
          }
        }

        return links;
      }
    });
    this.disposables.push(linkDisposable);
  }

  private updateCurrentEditor(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Check if decorations are enabled in configuration
    const linkerConfig = vscode.workspace.getConfiguration('linker');
    const enableDecorations = linkerConfig.get<boolean>('enableDecorations', true);
    const enableInlineLinks = linkerConfig.get<boolean>('enableInlineLinks', true);

    const matches = this.linkMatcher.findMatches(editor.document);
    const inlineMatches = enableInlineLinks ? this.inlineLinkMatcher.findInlineMatches(editor.document) : [];

    if (enableDecorations) {
      this.decoratorManager.updateDecorations(editor, matches, inlineMatches);
    } else {
      this.decoratorManager.clearDecorations(editor);
    }
  }

  private async handleOpenLink(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const position = editor.selection.active;

    // First check regular links
    const match = this.linkMatcher.findMatchAtPosition(editor.document, position);
    if (match) {
      await this.linkHandler.handleLink(match);
      return;
    }

    // Then check inline links
    const linkerConfig = vscode.workspace.getConfiguration('linker');
    const enableInlineLinks = linkerConfig.get<boolean>('enableInlineLinks', true);

    if (enableInlineLinks) {
      const inlineMatch = this.inlineLinkMatcher.findInlineMatchAtPosition(editor.document, position);
      if (inlineMatch) {
        // Directly handle inline links
        const href = inlineMatch.href;

        try {
          if (href.startsWith('http://') || href.startsWith('https://')) {
            // URL link
            await vscode.env.openExternal(vscode.Uri.parse(href));
          } else if (href.startsWith('./') || href.startsWith('../') || href.startsWith('/')) {
            // File link
            let filePath = href;
            if (!path.isAbsolute(filePath)) {
              const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
              if (workspaceFolder) {
                filePath = path.join(workspaceFolder.uri.fsPath, filePath);
              }
            }

            let lineNumber = 0;
            if (href.includes(':')) {
              const parts = href.split(':');
              filePath = parts[0];
              lineNumber = parseInt(parts[1], 10) - 1;
            }

            const document = await vscode.workspace.openTextDocument(filePath);
            const position = new vscode.Position(lineNumber, 0);
            await vscode.window.showTextDocument(document, { selection: new vscode.Range(position, position) });
          } else {
            // Unsupported command link type
            vscode.window.showWarningMessage(`Unsupported link type: ${href}. Only file and URL links are supported.`);
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to open inline link: ${error}`);
        }
        return;
      }
    }

    vscode.window.showInformationMessage('No link found at current position');
  }

  private async handleConfigureLinks(): Promise<void> {
    const configPath = this.configManager.getWorkspaceConfig().configPath;

    try {
      // Check if config file exists
      if (!fs.existsSync(configPath)) {
        // Ask user if they want to create the config file
        const createConfig = await vscode.window.showInformationMessage(
          'No linker configuration file found. Would you like to create one?',
          'Yes', 'No'
        );

        if (createConfig === 'Yes') {
          await this.configManager.createDefaultConfig();
        } else {
          return;
        }
      }

      const document = await vscode.workspace.openTextDocument(configPath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open configuration file: ${error}`);
    }
  }

  private async handleReloadConfig(): Promise<void> {
    await this.loadConfiguration();
    this.updateCurrentEditor();
    vscode.window.showInformationMessage('Linker configuration reloaded');
  }

  private provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    // Check if hover tooltips are enabled in configuration
    const linkerConfig = vscode.workspace.getConfiguration('linker');
    const enableHover = linkerConfig.get<boolean>('enableHover', true);
    const enableInlineLinks = linkerConfig.get<boolean>('enableInlineLinks', true);

    if (!enableHover) {
      return undefined;
    }

    // First check regular links
    const match = this.linkMatcher.findMatchAtPosition(document, position);
    if (match) {
      const { config } = match;
      const contents = new vscode.MarkdownString();

      // Resolved target link
      const resolvedTarget = this.resolveTarget(config.target, document, match);

      // Display simplified information: name and target address
      config.name && contents.appendMarkdown(`**${config.name}**\n\n`);
      contents.appendMarkdown(`\`${resolvedTarget}\``);

      return new vscode.Hover(contents);
    }

    // Then check inline links
    if (enableInlineLinks) {
      const inlineMatch = this.inlineLinkMatcher.findInlineMatchAtPosition(document, position);
      if (inlineMatch) {
        // Check if mouse position is in code section (anchor), not comment section
        const positionOffset = document.offsetAt(position);
        if (positionOffset >= inlineMatch.codeRange.start && positionOffset <= inlineMatch.codeRange.end) {
          const contents = new vscode.MarkdownString();

          // Only display link address
          contents.appendMarkdown(`\`${inlineMatch.href}\``);

          return new vscode.Hover(contents);
        }
      }
    }

    return undefined;
  }

  private resolveTarget(target: string, document: vscode.TextDocument, match?: LinkMatch): string {
    let resolved = target;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    // Replace workspace variables
    if (workspaceFolder) {
      resolved = resolved.replace(/\${workspaceFolder}/g, workspaceFolder.uri.fsPath);
    }

    // Replace environment variables
    resolved = resolved.replace(/\${env:([^}]+)}/g, (match, envVar) => {
      return process.env[envVar] || match;
    });

    // Replace current file path
    resolved = resolved.replace(/\${file}/g, document.fileName);
    resolved = resolved.replace(/\${fileBasename}/g, path.basename(document.fileName));
    resolved = resolved.replace(/\${fileDirname}/g, path.dirname(document.fileName));

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

  private provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    // Get global CodeLens configuration
    const linkerConfig = vscode.workspace.getConfiguration('linker');
    const globalEnableCodeLens = linkerConfig.get<boolean>('enableCodeLens', false);

    const matches = this.linkMatcher.findMatches(document);
    const codeLenses: vscode.CodeLens[] = [];

    for (const match of matches) {
      // Check CodeLens configuration for each rule
      let showCodeLens: boolean;
      
      if (match.config.showCodeLens !== undefined) {
        // Use rule-specific configuration if defined
        showCodeLens = match.config.showCodeLens;
      } else {
        // Use global configuration as fallback
        showCodeLens = globalEnableCodeLens;
      }

      if (!showCodeLens) {
        continue;
      }

      const startPos = document.positionAt(match.range.start);
      const endPos = document.positionAt(match.range.end);
      const range = new vscode.Range(startPos, endPos);

      // Select icon based on link type
      let icon = match.config.icon || getDefaultIcon(match.config.type);

      const codeLens = new vscode.CodeLens(range, {
        title: `${icon} ${match.config.name}`,
        command: 'linker.openLink',
        arguments: []
      });

      codeLenses.push(codeLens);
    }

    return codeLenses;
  }

  // Public method: Create document link
  private createDocumentLink(range: vscode.Range, href: string, document: vscode.TextDocument): vscode.DocumentLink | undefined {
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return new vscode.DocumentLink(range, vscode.Uri.parse(href));
      } else if (href.startsWith('./') || href.startsWith('../') || href.startsWith('/')) {
        return this.createFileDocumentLink(range, href);
      }
    } catch (error) {
      console.warn(`Failed to create document link for ${href}:`, error);
    }
    return undefined;
  }

  // Public method: Create file document link
  private createFileDocumentLink(range: vscode.Range, filePath: string): vscode.DocumentLink {
    let actualPath = filePath;
    let lineNumber = 0;
    let columnNumber = 0;

    // Parse line and column numbers
    if (filePath.includes(':')) {
      const parts = filePath.split(':');
      if (parts.length >= 3) {
        actualPath = parts[0];
        lineNumber = parseInt(parts[1], 10);
        columnNumber = parseInt(parts[2], 10);
      } else if (parts.length === 2) {
        actualPath = parts[0];
        lineNumber = parseInt(parts[1], 10);
      }
    }

    // Parse relative path
    if (!path.isAbsolute(actualPath)) {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        actualPath = path.join(workspaceFolder.uri.fsPath, actualPath);
      }
    }

    // Create URI
    const uri = vscode.Uri.file(actualPath);
    if (lineNumber > 0) {
      const uriWithLine = uri.with({ fragment: `L${lineNumber}${columnNumber > 0 ? `,${columnNumber}` : ''}` });
      return new vscode.DocumentLink(range, uriWithLine);
    } else {
      return new vscode.DocumentLink(range, uri);
    }
  }


  public dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.configManager.dispose();
    this.decoratorManager.dispose();
  }
}

// Extension activation function
export function activate(context: vscode.ExtensionContext): void {
  const extension = new LinkerExtension();
  extension.activate(context);

  context.subscriptions.push({
    dispose: () => extension.dispose()
  });
}

// Extension deactivation function
export function deactivate(): void {
  // Cleanup work is done here
} 