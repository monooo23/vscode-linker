# JSON Auto-Repair Demo

This demo shows how the Linker extension automatically fixes common JSON syntax errors in your `linker.json` configuration file.

## Setup

1. Create a `.vscode/linker.json` file in your project
2. Add some intentionally malformed JSON (see examples below)
3. Save the file and watch the extension automatically repair it

## Example 1: Trailing Commas

**Before (Invalid):**
```json
[
  {
    "name": "GitHub Repository",
    "type": "url",
    "target": "https://github.com/example/repo",
    "patterns": [
      {
        "type": "text",
        "value": "github.com/example/repo",
        "caseSensitive": false,
      },
    ],
  },
]
```

**After (Automatically Repaired):**
```json
[
  {
    "name": "GitHub Repository",
    "type": "url",
    "target": "https://github.com/example/repo",
    "patterns": [
      {
        "type": "text",
        "value": "github.com/example/repo",
        "caseSensitive": false
      }
    ]
  }
]
```

## Example 2: Missing Quotes

**Before (Invalid):**
```json
[
  {
    name: "Config File",
    type: "file",
    target: "${workspaceFolder}/config.json",
    patterns: [
      {
        type: "text",
        value: "config.json",
        fileExtensions: [".js", ".ts", ".json"]
      }
    ]
  }
]
```

**After (Automatically Repaired):**
```json
[
  {
    "name": "Config File",
    "type": "file",
    "target": "${workspaceFolder}/config.json",
    "patterns": [
      {
        "type": "text",
        "value": "config.json",
        "fileExtensions": [".js", ".ts", ".json"]
      }
    ]
  }
]
```

## Example 3: Comments and Single Quotes

**Before (Invalid):**
```json
[
  // This is a comment
  {
    'name': 'API Documentation',
    'type': 'url',
    'target': 'https://api.example.com/docs',
    'patterns': [
      {
        'type': 'regex',
        'value': 'api\\.example\\.com',
        'caseSensitive': false
      }
    ]
  }
]
```

**After (Automatically Repaired):**
```json
[
  {
    "name": "API Documentation",
    "type": "url",
    "target": "https://api.example.com/docs",
    "patterns": [
      {
        "type": "regex",
        "value": "api\\.example\\.com",
        "caseSensitive": false
      }
    ]
  }
]
```

## Example 4: Missing Brackets

**Before (Invalid):**
```json
[
  {
    "name": "Component File",
    "type": "file",
    "target": "${workspaceFolder}/src/components/Button.tsx",
    "patterns": [
      {
        "type": "text",
        "value": "Button",
        "fileExtensions": [".tsx", ".jsx"]
      }
    ]
  }
```

**After (Automatically Repaired):**
```json
[
  {
    "name": "Component File",
    "type": "file",
    "target": "${workspaceFolder}/src/components/Button.tsx",
    "patterns": [
      {
        "type": "text",
        "value": "Button",
        "fileExtensions": [".tsx", ".jsx"]
      }
    ]
  }
]
```

## What Happens When You Save

1. **Detection**: The extension detects JSON syntax errors
2. **Repair**: Automatically fixes the issues using `jsonrepair`
3. **Notification**: Shows a simple notification asking if you want to save the corrected format
4. **Save Option**: Click "Save" to save the repaired version to disk
5. **Loading**: Configuration is loaded with the repaired JSON
6. **Functionality**: All link functionality works normally

## Supported Repairs

- ✅ **Trailing Commas**: Removes extra commas at the end of arrays and objects
- ✅ **Missing Quotes**: Adds quotes around property names and string values
- ✅ **Comments**: Removes JavaScript-style comments (`//` and `/* */`)
- ✅ **Single Quotes**: Converts single quotes to double quotes
- ✅ **Missing Brackets**: Adds missing closing brackets and braces
- ✅ **Mixed Quotes**: Standardizes quote usage throughout the file
- ✅ **Unquoted Values**: Adds quotes around unquoted string values

## Benefits

- **No Configuration Failures**: Prevents the entire configuration from failing due to minor syntax errors
- **Better Developer Experience**: No need to manually fix JSON syntax issues
- **Immediate Feedback**: Clear notifications about what was repaired
- **Optional Persistence**: Choose whether to save the repaired version
- **Debug Information**: Detailed logging when debug mode is enabled

## Testing the Feature

1. Copy any of the "Before" examples above into your `.vscode/linker.json`
2. Save the file
3. Watch for the repair notification
4. Check that your links are working correctly
5. Optionally save the repaired version

This feature ensures that your Linker configuration remains functional even with common JSON formatting mistakes!
