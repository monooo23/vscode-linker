import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { runSimpleTests } from './simple-runner';

export function run(): Promise<void> {
  console.log('Starting tests...');
  
  // First run simple tests
  try {
    runSimpleTests();
  } catch (error) {
    console.error('Simple tests failed:', error);
    return Promise.reject(error);
  }

  // The folder containing the Extension Manifest package.json
  // Passed to `--extensionDevelopmentPath`
  const extensionDevelopmentPath = path.resolve(__dirname, '../../');

  // The path to test runner
  // Passed to --extensionTestsPath
  const extensionTestsPath = path.resolve(__dirname, './suite/index');

  console.log('Starting VS Code extension tests...');
  console.log('Extension development path:', extensionDevelopmentPath);
  console.log('Extension tests path:', extensionTestsPath);

  // Download VS Code, unzip it and run the integration test
  return runTests({ 
    extensionDevelopmentPath, 
    extensionTestsPath,
    launchArgs: ['--disable-extensions', '--disable-gpu']
  }).then(() => {
    console.log('Tests completed successfully');
  }).catch((error) => {
    console.error('Tests failed:', error);
    throw error;
  });
} 