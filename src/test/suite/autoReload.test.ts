import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../../configManager';
import { LinkerExtension } from '../../extension';

suite('Auto Reload Tests', () => {
  let configManager: ConfigManager;
  let extension: LinkerExtension;
  let tempConfigPath: string;
  let originalWorkspaceFolders: readonly vscode.WorkspaceFolder[] | undefined;

  setup(async () => {
    // Mock workspace folder
    const mockWorkspaceFolder: vscode.WorkspaceFolder = {
      uri: vscode.Uri.file('/mock/workspace'),
      name: 'mock-workspace',
      index: 0
    };

    // Store original and set mock
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      get: () => [mockWorkspaceFolder],
      configurable: true
    });

    // Create temp config path
    tempConfigPath = path.join('/mock/workspace', '.vscode', 'linker.json');
    
    // Ensure directory exists
    const configDir = path.dirname(tempConfigPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Create initial config
    const initialConfig = [
      {
        name: 'Test Link',
        type: 'url' as const,
        target: 'https://example.com',
        patterns: [
          {
            type: 'text',
            value: 'example.com'
          }
        ]
      }
    ];

    fs.writeFileSync(tempConfigPath, JSON.stringify(initialConfig, null, 2));

    // Initialize managers
    configManager = new ConfigManager();
    extension = new LinkerExtension();
  });

  teardown(async () => {
    // Restore original workspace folders
    if (originalWorkspaceFolders !== undefined) {
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        get: () => originalWorkspaceFolders,
        configurable: true
      });
    }

    // Clean up temp file
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }

    // Dispose managers
    configManager.dispose();
    extension.dispose();
  });

  test('Should automatically reload config when file changes', async () => {
    // Load initial config
    const initialConfig = await configManager.loadConfig();
    assert.strictEqual(initialConfig.length, 1);
    assert.strictEqual(initialConfig[0].name, 'Test Link');

    // Create a promise that resolves when config changes
    let configChanged = false;
    const configChangePromise = new Promise<void>((resolve) => {
      configManager.onConfigChanged(() => {
        configChanged = true;
        resolve();
      });
    });

    // Modify the config file
    const updatedConfig = [
      {
        name: 'Updated Link',
        type: 'url' as const,
        target: 'https://updated.com',
        patterns: [
          {
            type: 'text',
            value: 'updated.com'
          }
        ]
      },
      {
        name: 'New Link',
        type: 'file' as const,
        target: '${workspaceFolder}/newfile.txt',
        patterns: [
          {
            type: 'text',
            value: 'newfile.txt'
          }
        ]
      }
    ];

    fs.writeFileSync(tempConfigPath, JSON.stringify(updatedConfig, null, 2));

    // Wait for config change event
    await configChangePromise;

    // Verify config was updated
    assert.strictEqual(configChanged, true);
    
    const finalConfig = configManager.getConfig();
    assert.strictEqual(finalConfig.length, 2);
    assert.strictEqual(finalConfig[0].name, 'Updated Link');
    assert.strictEqual(finalConfig[1].name, 'New Link');
  });

  test('Should handle config file deletion', async () => {
    // Load initial config
    const initialConfig = await configManager.loadConfig();
    assert.strictEqual(initialConfig.length, 1);

    // Create a promise that resolves when config changes
    let configChanged = false;
    const configChangePromise = new Promise<void>((resolve) => {
      configManager.onConfigChanged(() => {
        configChanged = true;
        resolve();
      });
    });

    // Delete the config file
    fs.unlinkSync(tempConfigPath);

    // Wait for config change event
    await configChangePromise;

    // Verify config was cleared
    assert.strictEqual(configChanged, true);
    
    const finalConfig = configManager.getConfig();
    assert.strictEqual(finalConfig.length, 0);
  });

  test('Should handle invalid JSON gracefully', async () => {
    // Load initial config
    const initialConfig = await configManager.loadConfig();
    assert.strictEqual(initialConfig.length, 1);

    // Create a promise that resolves when config changes
    let configChanged = false;
    const configChangePromise = new Promise<void>((resolve) => {
      configManager.onConfigChanged(() => {
        configChanged = true;
        resolve();
      });
    });

    // Write invalid JSON
    fs.writeFileSync(tempConfigPath, '{ invalid json }');

    // Wait for config change event
    await configChangePromise;

    // Verify config was cleared due to invalid JSON
    assert.strictEqual(configChanged, true);
    
    const finalConfig = configManager.getConfig();
    assert.strictEqual(finalConfig.length, 0);
  });

  test('Should handle empty config file', async () => {
    // Load initial config
    const initialConfig = await configManager.loadConfig();
    assert.strictEqual(initialConfig.length, 1);

    // Create a promise that resolves when config changes
    let configChanged = false;
    const configChangePromise = new Promise<void>((resolve) => {
      configManager.onConfigChanged(() => {
        configChanged = true;
        resolve();
      });
    });

    // Write empty file
    fs.writeFileSync(tempConfigPath, '');

    // Wait for config change event
    await configChangePromise;

    // Verify config was cleared due to empty file
    assert.strictEqual(configChanged, true);
    
    const finalConfig = configManager.getConfig();
    assert.strictEqual(finalConfig.length, 0);
  });
});
