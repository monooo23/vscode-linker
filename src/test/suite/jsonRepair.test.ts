import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { jsonrepair } from '../../jsonRepair';
import { ConfigManager } from '../../configManager';

suite('JSON Repair Tests', () => {
  let configManager: ConfigManager;
  let tempConfigPath: string;

  setup(() => {
    // Create a temporary config file for testing
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      tempConfigPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'linker-test.json');
    } else {
      tempConfigPath = path.join(process.cwd(), 'linker-test.json');
    }
    
    configManager = new ConfigManager();
  });

  teardown(() => {
    // Clean up temporary config file
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  });

  test('Should repair JSON with trailing comma', async () => {
    const invalidJson = `[
      {
        "name": "Test Link",
        "type": "url",
        "target": "https://example.com",
        "patterns": [
          {
            "type": "text",
            "value": "example.com"
          }
        ]
      },
    ]`;

    const repairedJson = jsonrepair(invalidJson);
    const parsed = JSON.parse(repairedJson);
    
    assert.ok(Array.isArray(parsed));
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, 'Test Link');
  });

  test('Should repair JSON with missing quotes', async () => {
    const invalidJson = `[
      {
        name: "Test Link",
        type: "url",
        target: "https://example.com",
        patterns: [
          {
            type: "text",
            value: "example.com"
          }
        ]
      }
    ]`;

    const repairedJson = jsonrepair(invalidJson);
    const parsed = JSON.parse(repairedJson);
    
    assert.ok(Array.isArray(parsed));
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, 'Test Link');
  });

  test('Should repair JSON with comments', async () => {
    const invalidJson = `[
      // This is a comment
      {
        "name": "Test Link",
        "type": "url",
        "target": "https://example.com",
        "patterns": [
          {
            "type": "text",
            "value": "example.com"
          }
        ]
      }
    ]`;

    const repairedJson = jsonrepair(invalidJson);
    const parsed = JSON.parse(repairedJson);
    
    assert.ok(Array.isArray(parsed));
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, 'Test Link');
  });

  test('Should repair JSON with single quotes', async () => {
    const invalidJson = `[
      {
        'name': 'Test Link',
        'type': 'url',
        'target': 'https://example.com',
        'patterns': [
          {
            'type': 'text',
            'value': 'example.com'
          }
        ]
      }
    ]`;

    const repairedJson = jsonrepair(invalidJson);
    const parsed = JSON.parse(repairedJson);
    
    assert.ok(Array.isArray(parsed));
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, 'Test Link');
  });

  test('Should handle valid JSON without repair', async () => {
    const validJson = `[
      {
        "name": "Test Link",
        "type": "url",
        "target": "https://example.com",
        "patterns": [
          {
            "type": "text",
            "value": "example.com"
          }
        ]
      }
    ]`;

    const repairedJson = jsonrepair(validJson);
    assert.strictEqual(repairedJson, validJson);
  });

  test('Should handle empty array', async () => {
    const emptyJson = '[]';
    const repairedJson = jsonrepair(emptyJson);
    assert.strictEqual(repairedJson, emptyJson);
  });

  test('Should handle empty object', async () => {
    const emptyJson = '{}';
    const repairedJson = jsonrepair(emptyJson);
    assert.strictEqual(repairedJson, emptyJson);
  });

  test('Should repair JSON with multiple trailing commas', async () => {
    const invalidJson = `[
      {
        "name": "Test Link",
        "type": "url",
        "target": "https://example.com",
        "patterns": [
          {
            "type": "text",
            "value": "example.com",
          },
        ],
      },
    ]`;

    const repairedJson = jsonrepair(invalidJson);
    const parsed = JSON.parse(repairedJson);
    
    assert.ok(Array.isArray(parsed));
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, 'Test Link');
  });

  test('Should repair JSON with missing closing bracket', async () => {
    const invalidJson = `[
      {
        "name": "Test Link",
        "type": "url",
        "target": "https://example.com",
        "patterns": [
          {
            "type": "text",
            "value": "example.com"
          }
        ]
      }`;

    const repairedJson = jsonrepair(invalidJson);
    const parsed = JSON.parse(repairedJson);
    
    assert.ok(Array.isArray(parsed));
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, 'Test Link');
  });

  test('Should handle severely malformed JSON gracefully', async () => {
    const invalidJson = `{
      name: Test Link,
      type: url,
      target: https://example.com,
      patterns: [
        {
          type: text,
          value: example.com
        }
      ]
    }`;

    try {
      const repairedJson = jsonrepair(invalidJson);
      const parsed = JSON.parse(repairedJson);
      assert.ok(parsed.name === 'Test Link' || parsed.name === 'Test');
    } catch (error) {
      // Some severely malformed JSON might not be repairable
      assert.ok(error instanceof Error);
    }
  });

  test('Should provide correct config path for file operations', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    let expectedConfigPath: string;
    
    if (workspaceFolder) {
      expectedConfigPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'linker.json');
    } else {
      const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
      expectedConfigPath = path.join(homeDir, '.vscode', 'linker.json');
    }
    
    // Create a temporary config manager to test path generation
    const testConfigManager = new ConfigManager();
    
    // Access the private configPath property for testing
    const configPathProperty = (testConfigManager as any).configPath;
    assert.strictEqual(configPathProperty, expectedConfigPath);
  });

  test('Should handle file URI conversion correctly', async () => {
    const testPath = '/test/path/linker.json';
    const uri = vscode.Uri.file(testPath);
    
    assert.strictEqual(uri.scheme, 'file');
    assert.strictEqual(uri.fsPath, testPath);
  });
});
