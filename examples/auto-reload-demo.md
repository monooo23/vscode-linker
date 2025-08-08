# Auto-Reload Configuration Demo

This demo shows how Linker automatically reloads configuration when you modify the `linker.json` file.

## Setup

1. Create a `.vscode/linker.json` file in your workspace:

```json
[
  {
    "name": "GitHub Repository",
    "type": "url",
    "target": "https://github.com/example/repo",
    "patterns": [
      {
        "type": "text",
        "value": "github.com/example/repo"
      }
    ]
  }
]
```

2. Create a test file (e.g., `test.js`) with the following content:

```javascript
// This text should become clickable: github.com/example/repo
console.log("Testing linker configuration");
```

## Testing Auto-Reload

### Step 1: Verify Initial Configuration
- Open `test.js`
- You should see `github.com/example/repo` highlighted and clickable
- Hover over it to see the link information

### Step 2: Modify Configuration
- Open `.vscode/linker.json`
- Add a new link rule:

```json
[
  {
    "name": "GitHub Repository",
    "type": "url",
    "target": "https://github.com/example/repo",
    "patterns": [
      {
        "type": "text",
        "value": "github.com/example/repo"
      }
    ]
  },
  {
    "name": "Documentation",
    "type": "url",
    "target": "https://docs.example.com",
    "patterns": [
      {
        "type": "text",
        "value": "docs.example.com"
      }
    ]
  }
]
```

### Step 3: Test Auto-Reload
- Save the `linker.json` file
- You should see a notification: "Linker configuration updated automatically"
- Add `docs.example.com` to your `test.js` file
- The new text should immediately become clickable without any manual reload

### Step 4: Test Error Handling
- Introduce a JSON syntax error in `linker.json`:

```json
[
  {
    "name": "Invalid Config",
    "type": "url",
    "target": "https://example.com",
    "patterns": [
      {
        "type": "text",
        "value": "example.com"
      }
    ]
  }
  // Missing closing bracket - this will cause an error
]
```

- Save the file
- You should see an error notification and the configuration will be cleared
- Fix the JSON and save again - the configuration should reload automatically

## Expected Behavior

✅ **Automatic Reload**: Configuration changes take effect immediately when you save `linker.json`

✅ **Visual Feedback**: Notification appears when configuration is updated

✅ **Error Handling**: Invalid JSON is handled gracefully with error messages

✅ **File Operations**: Handles file creation, modification, and deletion

✅ **No Manual Action Required**: No need to restart VS Code or run commands

## Troubleshooting

If auto-reload is not working:

1. **Check File Location**: Ensure `linker.json` is in `.vscode/` directory
2. **Check File Permissions**: Ensure the file is writable
3. **Check VS Code Output**: Look for any error messages in the Output panel
4. **Manual Reload**: Use "Reload Link Configuration" command as fallback

## Technical Details

The auto-reload feature works through:

1. **File System Watcher**: Monitors `linker.json` for changes
2. **Event System**: Notifies extension components when config changes
3. **Automatic Updates**: Updates LinkMatcher and refreshes UI
4. **Error Recovery**: Handles invalid configurations gracefully

This ensures a smooth development experience where configuration changes are immediately reflected in your editor.
