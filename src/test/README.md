# Linker Extension Tests

This directory contains comprehensive tests for the Linker VS Code extension.

## Test Structure

### Unit Tests

- **`configManager.test.ts`** - Tests for configuration management
  - Configuration loading and validation
  - File system watching
  - Workspace configuration updates
  - Error handling for invalid configurations

- **`linkMatcher.test.ts`** - Tests for pattern matching functionality
  - Text pattern matching
  - Regex pattern matching with capture groups
  - Line-based matching
  - File extension filtering
  - Context matching
  - Position-based matching

- **`inlineLinkMatcher.test.ts`** - Tests for inline link detection
  - Markdown-style link parsing
  - Custom pattern support
  - Multiple capture groups
  - Error handling for malformed links

- **`linkHandler.test.ts`** - Tests for link handling and opening
  - URL link opening
  - File link navigation
  - Line and column positioning
  - Variable substitution
  - Error handling for invalid links

- **`decoratorManager.test.ts`** - Tests for visual decoration management
  - Decoration type creation
  - Range highlighting
  - Multiple decorations
  - Cleanup and disposal

### Integration Tests

- **`integration.test.ts`** - End-to-end integration tests
  - Extension activation and deactivation
  - Configuration loading and reloading
  - Command execution
  - Provider registration (hover, CodeLens, document links)
  - Workspace configuration changes

### Test Configuration

- **`test-config.json`** - Sample configuration for testing
  - Various link types (URL, file)
  - Different pattern types (text, regex, line)
  - File extension filtering examples
  - Context matching examples

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run compile
   ```

### Running All Tests

```bash
npm test
```

### Running Specific Test Files

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run specific test file
npm run test -- --grep "ConfigManager"
```

### Running Tests in VS Code

1. Open the project in VS Code
2. Go to the Testing panel (Ctrl+Shift+P → "Testing: Focus on Test Explorer View")
3. Click the play button to run all tests
4. Or click on individual test files to run specific tests

## Test Coverage

The tests cover the following areas:

### Configuration Management
- ✅ Loading valid JSON configurations
- ✅ Handling invalid JSON formats
- ✅ File system watching for configuration changes
- ✅ Workspace configuration updates
- ✅ Error handling and validation

### Pattern Matching
- ✅ Text-based pattern matching
- ✅ Regular expression pattern matching
- ✅ Line-based pattern matching
- ✅ File extension filtering
- ✅ Context-based matching
- ✅ Case sensitivity options
- ✅ Capture group highlighting

### Link Handling
- ✅ URL link opening
- ✅ File link navigation
- ✅ Line and column positioning
- ✅ Variable substitution in targets
- ✅ Workspace variable resolution
- ✅ Error handling for invalid links

### Visual Feedback
- ✅ Decoration creation and management
- ✅ Range highlighting
- ✅ Multiple decoration types
- ✅ Cleanup and disposal

### Integration Features
- ✅ Extension activation/deactivation
- ✅ Command registration and execution
- ✅ Provider registration (hover, CodeLens, document links)
- ✅ Event handling
- ✅ Configuration reloading

## Test Utilities

### Mock Objects

The tests use mock objects for:
- VS Code API components (window, workspace, commands)
- File system operations
- Extension context
- Text documents and editors

### Test Helpers

- Temporary file and directory creation
- Configuration file setup
- Mock document creation
- Async operation handling

## Writing New Tests

### Unit Test Structure

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { YourClass } from '../../yourClass';

suite('YourClass Test Suite', () => {
  let instance: YourClass;

  setup(() => {
    // Setup test environment
    instance = new YourClass();
  });

  teardown(() => {
    // Cleanup after tests
    instance.dispose();
  });

  test('Should do something', async () => {
    // Test implementation
    const result = await instance.doSomething();
    assert.strictEqual(result, expectedValue);
  });
});
```

### Integration Test Structure

```typescript
suite('Integration Test Suite', () => {
  let extension: LinkerExtension;
  let tempDir: string;

  setup(async () => {
    // Setup temporary environment
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
    extension = new LinkerExtension();
  });

  teardown(async () => {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    extension.dispose();
  });

  test('Should work end-to-end', async () => {
    // Test complete workflow
    await extension.activate(mockContext);
    // ... test steps
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up resources in teardown
3. **Mocking**: Use mocks for external dependencies
4. **Async Handling**: Properly handle async operations with await
5. **Error Testing**: Test both success and error scenarios
6. **Edge Cases**: Test boundary conditions and edge cases

## Debugging Tests

### VS Code Debugging

1. Set breakpoints in test files
2. Go to Run and Debug panel
3. Select "Extension Tests" configuration
4. Press F5 to start debugging

### Console Output

Tests log to the console. Check the Debug Console in VS Code for:
- Test execution progress
- Error messages
- Debug information

### Common Issues

1. **Timeout Errors**: Increase timeout in Mocha configuration
2. **File System Errors**: Ensure proper cleanup in teardown
3. **Mock Issues**: Verify mock objects are properly configured
4. **Async Errors**: Ensure all async operations are properly awaited

## Continuous Integration

Tests are automatically run in CI/CD pipelines:
- On pull requests
- On main branch commits
- Before releases

The CI environment includes:
- Node.js 20+
- VS Code Extension Test Environment
- All supported platforms (Windows, macOS, Linux)
