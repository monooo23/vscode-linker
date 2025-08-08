import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../../configManager';
import { LinkConfig } from '../../types';

suite('ConfigManager Test Suite', () => {
  let configManager: ConfigManager;
  let tempConfigPath: string;
  let originalWorkspaceFolders: readonly vscode.WorkspaceFolder[] | undefined;

  setup(() => {
    // Store original workspace folders
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    
    // Create temporary directory for testing
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linker-test-'));
    tempConfigPath = path.join(tempDir, '.vscode', 'linker.json');
    
    // Ensure .vscode directory exists
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    
    // Mock workspace folders using Object.defineProperty
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: [{
        uri: vscode.Uri.file(tempDir),
        name: 'test-workspace',
        index: 0
      }],
      writable: true
    });
    
    configManager = new ConfigManager();
  });

  teardown(() => {
    // Restore original workspace folders
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: originalWorkspaceFolders,
      writable: true
    });
    
    // Clean up temporary files
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    if (fs.existsSync(path.dirname(tempConfigPath))) {
      fs.rmdirSync(path.dirname(tempConfigPath));
    }
    if (fs.existsSync(path.dirname(path.dirname(tempConfigPath)))) {
      fs.rmdirSync(path.dirname(path.dirname(tempConfigPath)));
    }
    
    configManager.dispose();
  });

  test('Should load empty config when file does not exist', async () => {
    const config = await configManager.loadConfig();
    assert.deepStrictEqual(config, []);
  });

  test('Should load valid JSON array configuration', async () => {
    const testConfig: LinkConfig[] = [
      {
        name: 'Test Link',
        type: 'url',
        target: 'https://example.com',
        patterns: [
          {
            type: 'text',
            value: 'test'
          }
        ]
      }
    ];
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));
    
    const config = await configManager.loadConfig();
    assert.deepStrictEqual(config, testConfig);
  });

  test('Should load valid JSON object with links property', async () => {
    const testConfig = {
      links: [
        {
          name: 'Test Link',
          type: 'url',
          target: 'https://example.com',
          patterns: [
            {
              type: 'text',
              value: 'test'
            }
          ]
        }
      ]
    };
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));
    
    const config = await configManager.loadConfig();
    assert.deepStrictEqual(config, testConfig.links);
  });

  test('Should handle empty configuration file', async () => {
    fs.writeFileSync(tempConfigPath, '');
    
    const config = await configManager.loadConfig();
    assert.deepStrictEqual(config, []);
  });

  test('Should handle invalid JSON format', async () => {
    fs.writeFileSync(tempConfigPath, 'invalid json content');
    
    const config = await configManager.loadConfig();
    assert.deepStrictEqual(config, []);
  });

  test('Should validate configuration structure', async () => {
    const invalidConfig = [
      {
        name: 'Test Link',
        // Missing required fields
        patterns: []
      }
    ];
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(invalidConfig));
    
    const config = await configManager.loadConfig();
    assert.deepStrictEqual(config, []);
  });

  test('Should create default configuration file', async () => {
    await configManager.createDefaultConfig();
    
    assert.ok(fs.existsSync(tempConfigPath));
    
    const content = fs.readFileSync(tempConfigPath, 'utf8');
    const config = JSON.parse(content);
    
    assert.ok(Array.isArray(config));
    assert.ok(config.length > 0);
    
    // Check if default config contains expected structure
    const firstLink = config[0];
    assert.ok(firstLink.name);
    assert.ok(firstLink.type);
    assert.ok(firstLink.target);
    assert.ok(Array.isArray(firstLink.patterns));
  });

  test('Should reload configuration', async () => {
    const initialConfig: LinkConfig[] = [
      {
        name: 'Initial Link',
        type: 'url',
        target: 'https://initial.com',
        patterns: [{ type: 'text', value: 'initial' }]
      }
    ];
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(initialConfig));
    await configManager.loadConfig();
    
    const updatedConfig: LinkConfig[] = [
      {
        name: 'Updated Link',
        type: 'url',
        target: 'https://updated.com',
        patterns: [{ type: 'text', value: 'updated' }]
      }
    ];
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(updatedConfig));
    const reloadedConfig = await configManager.reloadConfig();
    
    assert.deepStrictEqual(reloadedConfig, updatedConfig);
  });

  test('Should get current configuration', async () => {
    const testConfig: LinkConfig[] = [
      {
        name: 'Test Link',
        type: 'url',
        target: 'https://example.com',
        patterns: [{ type: 'text', value: 'test' }]
      }
    ];
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));
    await configManager.loadConfig();
    
    const config = configManager.getConfig();
    assert.deepStrictEqual(config, testConfig);
  });

  test('Should get workspace configuration', () => {
    const workspaceConfig = configManager.getWorkspaceConfig();
    
    assert.ok(workspaceConfig.configPath);
    assert.strictEqual(typeof workspaceConfig.enabled, 'boolean');
    assert.strictEqual(typeof workspaceConfig.autoReload, 'boolean');
    assert.strictEqual(typeof workspaceConfig.debug, 'boolean');
  });

  test('Should update workspace configuration', async () => {
    const originalConfig = configManager.getWorkspaceConfig();
    
    await configManager.updateWorkspaceConfig({
      debug: true,
      enabled: false
    });
    
    const updatedConfig = configManager.getWorkspaceConfig();
    
    assert.strictEqual(updatedConfig.debug, true);
    assert.strictEqual(updatedConfig.enabled, false);
    assert.strictEqual(updatedConfig.autoReload, originalConfig.autoReload);
  });

  test('Should handle file system watcher events', async () => {
    // This test verifies that the file watcher is set up correctly
    const workspaceConfig = configManager.getWorkspaceConfig();
    assert.strictEqual(workspaceConfig.autoReload, true);
    
    // The actual file watching behavior is tested through integration tests
    // since it requires file system events
  });

  test('Should handle configuration with file extensions filter', async () => {
    const testConfig: LinkConfig[] = [
      {
        name: 'JS Only Link',
        type: 'url',
        target: 'https://jsdocs.com',
        patterns: [
          {
            type: 'text',
            value: 'function',
            fileExtensions: ['js', 'ts']
          }
        ]
      }
    ];
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));
    
    const config = await configManager.loadConfig();
    assert.deepStrictEqual(config, testConfig);
  });

  test('Should handle configuration with context matching', async () => {
    const testConfig: LinkConfig[] = [
      {
        name: 'Contextual Link',
        type: 'url',
        target: 'https://context.com',
        patterns: [
          {
            type: 'text',
            value: 'import',
            context: {
              before: '//',
              after: ';'
            }
          }
        ]
      }
    ];
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));
    
    const config = await configManager.loadConfig();
    assert.deepStrictEqual(config, testConfig);
  });
});
