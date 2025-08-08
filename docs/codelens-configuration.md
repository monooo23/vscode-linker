# CodeLens Configuration Guide

CodeLens provides clickable information above matched text in your code, showing the link name and allowing quick navigation. This guide explains how to configure CodeLens behavior in Linker.

## Overview

Linker supports two levels of CodeLens configuration:

1. **Global Configuration** - VS Code settings that apply to all rules
2. **Rule-Specific Configuration** - Individual rule settings that can override global configuration

## Configuration Priority

CodeLens visibility follows a clear priority order:

### 1. Rule-Specific Setting (Highest Priority)
When a rule in `linker.json` has a `showCodeLens` property, it takes precedence over the global setting.

### 2. Global Setting (Fallback)
When a rule doesn't specify `showCodeLens`, the global `linker.enableCodeLens` setting is used.

## Configuration Options

### Global Configuration (VS Code Settings)

```json
{
  "linker.enableCodeLens": false
}
```

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Default CodeLens setting for rules that don't specify `showCodeLens`

### Rule-Specific Configuration (linker.json)

```json
{
  "name": "Example Rule",
  "type": "url",
  "target": "https://example.com",
  "patterns": [...],
  "showCodeLens": true  // Override global setting
}
```

- **Type**: `boolean` (optional)
- **Description**: Whether to show CodeLens for this specific rule

## Configuration Scenarios

| Global Setting | Rule Setting | Result | Description |
|----------------|---------------|---------|-------------|
| `false` | `true` | ✅ Show CodeLens | Rule setting overrides global |
| `false` | `false` | ❌ Hide CodeLens | Both settings agree |
| `false` | `undefined` | ❌ Hide CodeLens | Use global setting as fallback |
| `true` | `true` | ✅ Show CodeLens | Both settings agree |
| `true` | `false` | ❌ Hide CodeLens | Rule setting overrides global |
| `true` | `undefined` | ✅ Show CodeLens | Use global setting as fallback |

## Examples

### Example 1: Mixed Configuration

```json
// VS Code settings.json
{
  "linker.enableCodeLens": false  // Global default: hide CodeLens
}

// .vscode/linker.json
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
    ],
    "showCodeLens": true  // ✅ WILL show CodeLens (overrides global)
  },
  {
    "name": "Configuration File",
    "type": "file", 
    "target": "${workspaceFolder}/package.json",
    "patterns": [
      {
        "type": "text",
        "value": "package.json"
      }
    ],
    "showCodeLens": false  // ❌ Will NOT show CodeLens
  },
  {
    "name": "README File",
    "type": "file",
    "target": "${workspaceFolder}/README.md", 
    "patterns": [
      {
        "type": "text",
        "value": "README.md"
      }
    ]
    // No showCodeLens property - ❌ Will NOT show CodeLens (uses global)
  }
]
```

**Result**: Only the "GitHub Repository" rule will display CodeLens.

### Example 2: Global Enable with Selective Disable

```json
// VS Code settings.json
{
  "linker.enableCodeLens": true  // Global default: show CodeLens
}

// .vscode/linker.json
[
  {
    "name": "GitHub Repository",
    "type": "url",
    "target": "https://github.com/example/repo",
    "patterns": [...]
    // No showCodeLens - ✅ WILL show CodeLens (uses global)
  },
  {
    "name": "Internal File",
    "type": "file",
    "target": "./internal/config.ts",
    "patterns": [...],
    "showCodeLens": false  // ❌ Will NOT show CodeLens (overrides global)
  }
]
```

**Result**: "GitHub Repository" shows CodeLens, "Internal File" does not.

### Example 3: All Rules Use Global Setting

```json
// VS Code settings.json
{
  "linker.enableCodeLens": true  // Global default: show CodeLens
}

// .vscode/linker.json
[
  {
    "name": "GitHub Repository",
    "type": "url",
    "target": "https://github.com/example/repo",
    "patterns": [...]
    // No showCodeLens - ✅ WILL show CodeLens (uses global)
  },
  {
    "name": "Documentation",
    "type": "url", 
    "target": "https://docs.example.com",
    "patterns": [...]
    // No showCodeLens - ✅ WILL show CodeLens (uses global)
  }
]
```

**Result**: All rules show CodeLens because they all use the global setting.

## CodeLens Display

When CodeLens is enabled for a rule, it displays:

```
🔗 Rule Name
```

- **Icon**: Based on link type (🌐 for URLs, 📁 for files, or custom icon)
- **Text**: The rule name from the configuration
- **Click Action**: Opens the link when clicked

## Best Practices

### 1. Use Global Setting for Consistency
Set `linker.enableCodeLens` to your preferred default, then only override specific rules that need different behavior.

### 2. Be Selective with Rule-Specific Settings
Only use `showCodeLens` in rules where CodeLens provides clear value. Too many CodeLens can clutter the editor.

### 3. Consider Performance
CodeLens requires additional processing. If you have many rules, consider keeping global setting disabled and only enabling for important rules.

### 4. Use Descriptive Names
Since CodeLens shows the rule name, use clear, descriptive names that users will understand.

## Troubleshooting

### CodeLens Not Showing

1. **Check Global Setting**: Ensure `linker.enableCodeLens` is set correctly in VS Code settings
2. **Check Rule Setting**: Verify the rule has `showCodeLens: true` or no `showCodeLens` property
3. **Reload Configuration**: Run "Reload Link Configuration" command
4. **Check VS Code CodeLens Setting**: Ensure VS Code's `editor.codeLens` setting is enabled

### CodeLens Showing When Not Expected

1. **Check Rule Setting**: Verify the rule has `showCodeLens: false`
2. **Check Global Setting**: Ensure `linker.enableCodeLens` is set to `false`
3. **Reload Configuration**: Run "Reload Link Configuration" command

## Related Documentation

- [Main Configuration Guide](../README.md#extension-settings) - General extension configuration
- [Variables Reference](variables-reference.md) - Dynamic variable substitution
- [Path Prefixes Guide](../examples/path-prefix-symbols.md) - Path resolution prefixes
