import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LinkConfig, WorkspaceConfig } from './types';

// Event emitter for configuration changes
const configChangeEmitter = new vscode.EventEmitter<LinkConfig[]>();

export class ConfigManager {
  private configPath: string;
  private config: LinkConfig[] = [];
  private workspaceConfig: WorkspaceConfig;
  private fileWatcher?: vscode.FileSystemWatcher;

  // Event for configuration changes
  public readonly onConfigChanged = configChangeEmitter.event;

  constructor() {
    this.workspaceConfig = this.getDefaultWorkspaceConfig();
    this.configPath = this.workspaceConfig.configPath;
    this.setupFileWatcher();
  }

  private getDefaultWorkspaceConfig(): WorkspaceConfig {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    let defaultConfigPath: string;
    
    if (workspaceFolder) {
      defaultConfigPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'linker.json');
    } else {
      // Fallback to user's home directory if no workspace is open
      const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
      defaultConfigPath = path.join(homeDir, '.vscode', 'linker.json');
    }

    return {
      configPath: defaultConfigPath,
      enabled: true,
      autoReload: true,
      debug: false
    };
  }

  private setupFileWatcher(): void {
    if (this.workspaceConfig.autoReload && this.configPath) {
      this.fileWatcher = vscode.workspace.createFileSystemWatcher(this.configPath);
      this.fileWatcher.onDidChange(async () => {
        await this.reloadConfig();
        configChangeEmitter.fire(this.config);
      });
      this.fileWatcher.onDidCreate(async () => {
        await this.reloadConfig();
        configChangeEmitter.fire(this.config);
      });
      this.fileWatcher.onDidDelete(() => {
        this.config = [];
        configChangeEmitter.fire(this.config);
        vscode.window.showInformationMessage('Linker configuration file deleted. Links disabled.');
      });
    }
  }

  public async loadConfig(): Promise<LinkConfig[]> {
    try {
      if (!fs.existsSync(this.configPath)) {
        // Don't auto-create config file, just return empty array
        return [];
      }

      const configContent = fs.readFileSync(this.configPath, 'utf8').trim();
      
      // Handle empty file
      if (!configContent) {
        vscode.window.showWarningMessage('Linker configuration file is empty. No links will be active.');
        return [];
      }

      let parsedConfig;
      try {
        parsedConfig = JSON.parse(configContent);
      } catch (parseError) {
        vscode.window.showErrorMessage(`Invalid JSON format in linker configuration file: ${parseError}`);
        return [];
      }

      // Handle configuration format
      if (Array.isArray(parsedConfig)) {
        // Old format: pure array
        this.config = parsedConfig;
      } else if (parsedConfig.links && Array.isArray(parsedConfig.links)) {
        // New format: contains links
        this.config = parsedConfig.links || [];
      } else {
        vscode.window.showWarningMessage('Invalid configuration format. Expected array or object with "links" property.');
        return [];
      }

      try {
        this.validateConfig();
      } catch (validationError) {
        vscode.window.showWarningMessage(`Configuration validation failed: ${validationError}`);
        return [];
      }
      
      if (this.workspaceConfig.debug) {
        console.log(`Loaded ${this.config.length} link configurations`);
      }

      return this.config;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load linker configuration: ${error}`);
      return [];
    }
  }

  public async createDefaultConfig(): Promise<void> {
    const defaultConfig = [
      {
        name: 'GitHub Repository',
        type: 'url' as const,
        target: 'https://github.com/example/repo',
        patterns: [
          {
            type: 'text',
            value: 'github.com/example/repo',
            caseSensitive: false
          }
        ],
        description: 'Example GitHub repository link'
      },
      {
        name: 'Config File',
        type: 'file' as const,
        target: '${workspaceFolder}/config.json',
        patterns: [
          {
            type: 'text',
            value: 'config.json',
            fileExtensions: ['.js', '.ts', '.json']
          }
        ],
        description: 'Link to configuration file'
      }
    ];

    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    vscode.window.showInformationMessage('Created default linker configuration file');
  }

  private validateConfig(): void {
    for (const link of this.config) {
      if (!link.name || !link.type || !link.target || !link.patterns) {
        throw new Error(`Invalid link configuration: missing required fields in "${link.name || 'unnamed'}"`);
      }

      if (!['url', 'file'].includes(link.type)) {
        throw new Error(`Invalid link type: ${link.type} in "${link.name}"`);
      }

      if (!Array.isArray(link.patterns) || link.patterns.length === 0) {
        throw new Error(`No patterns defined for link "${link.name}"`);
      }

      for (const pattern of link.patterns) {
        if (!pattern.type || !pattern.value) {
          throw new Error(`Invalid pattern in link "${link.name}"`);
        }

        if (!['text', 'regex', 'line'].includes(pattern.type)) {
          throw new Error(`Invalid pattern type: ${pattern.type} in "${link.name}"`);
        }
      }
    }
  }



  public async reloadConfig(): Promise<LinkConfig[]> {
    const config = await this.loadConfig();
    configChangeEmitter.fire(this.config);
    return config;
  }

  public getConfig(): LinkConfig[] {
    return this.config;
  }

  public getWorkspaceConfig(): WorkspaceConfig {
    return this.workspaceConfig;
  }

  public async updateWorkspaceConfig(newConfig: Partial<WorkspaceConfig>): Promise<void> {
    this.workspaceConfig = { ...this.workspaceConfig, ...newConfig };
    
    if (newConfig.configPath && newConfig.configPath !== this.configPath) {
      this.configPath = newConfig.configPath;
      this.setupFileWatcher();
    }

    if (newConfig.autoReload !== undefined) {
      this.setupFileWatcher();
    }
  }

  public dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
  }
} 