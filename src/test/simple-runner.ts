import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

// Simple test runner for basic functionality
export function runSimpleTests(): void {
  console.log('Running simple tests...');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Basic assertion
  try {
    assert.strictEqual(1 + 1, 2);
    console.log('✓ Basic assertion test passed');
    passed++;
  } catch (error) {
    console.log('✗ Basic assertion test failed:', error);
    failed++;
  }

  // Test 2: File system operations
  try {
    const testDir = path.join(__dirname, '..');
    assert.ok(fs.existsSync(testDir));
    console.log('✓ File system test passed');
    passed++;
  } catch (error) {
    console.log('✗ File system test failed:', error);
    failed++;
  }

  // Test 3: Path operations
  try {
    const testPath = path.join('test', 'file.js');
    assert.strictEqual(path.basename(testPath), 'file.js');
    console.log('✓ Path operations test passed');
    passed++;
  } catch (error) {
    console.log('✗ Path operations test failed:', error);
    failed++;
  }

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    throw new Error(`${failed} tests failed`);
  }
  
  console.log('All simple tests passed!');
}
