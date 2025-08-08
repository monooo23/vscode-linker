# Linker Variables Reference

Linker supports most VS Code variables for dynamic link generation. Our variable system is compatible with the [VS Code Variables Reference](https://code.visualstudio.com/docs/editor/variables-reference) and extends it with additional features.

## Overview

Linker implements its own variable resolution system that maintains full compatibility with VS Code's official variable syntax. This allows us to provide additional features while ensuring your existing VS Code knowledge applies seamlessly.

## Workspace Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `${workspaceFolder}` | Workspace root directory path | `/Users/user/projects/my-app` |
| `${workspaceFolderBasename}` | Workspace folder name | `my-app` |

**Usage Example:**
```json
{
  "name": "Project Documentation",
  "type": "file",
  "target": "${workspaceFolder}/docs/${workspaceFolderBasename}-guide.md",
  "patterns": [
    {
      "type": "text",
      "value": "project-docs"
    }
  ]
}
```

## File Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `${file}` | Current file full path | `/Users/user/projects/my-app/src/components/Button.tsx` |
| `${fileBasename}` | Current file name (without path) | `Button.tsx` |
| `${fileDirname}` | Current file directory path | `/Users/user/projects/my-app/src/components` |
| `${fileExtname}` | Current file extension | `.tsx` |
| `${relativeFile}` | File path relative to workspace | `src/components/Button.tsx` |
| `${relativeFileDirname}` | File directory relative to workspace | `src/components` |

**Usage Example:**
```json
{
  "name": "Test File",
  "type": "file",
  "target": "${fileDirname}/tests/${fileBasename}.test.${fileExtname}",
  "patterns": [
    {
      "type": "text",
      "value": "test-file"
    }
  ]
}
```

## Editor Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `${lineNumber}` | Current line number (1-based) | `42` |
| `${selectedText}` | Currently selected text | `selected content` |

**Usage Example:**
```json
{
  "name": "Error Log",
  "type": "file",
  "target": "${workspaceFolder}/error-log.md:${lineNumber}",
  "patterns": [
    {
      "type": "text",
      "value": "log-error"
    }
  ]
}
```

## System Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `${cwd}` | Current working directory | `/Users/user/projects/my-app` |
| `${userHome}` | User home directory | `/Users/user` |
| `${appName}` | VS Code application name | `Code` |
| `${appRoot}` | VS Code application root | `/Applications/Visual Studio Code.app/Contents/Resources/app` |
| `${execPath}` | VS Code executable path | `/Applications/Visual Studio Code.app/Contents/MacOS/Electron` |

**Usage Example:**
```json
{
  "name": "User Snippets",
  "type": "file",
  "target": "${userHome}/.vscode/snippets/${fileBasename}.json",
  "patterns": [
    {
      "type": "text",
      "value": "snippet"
    }
  ]
}
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `${env:VAR_NAME}` | Environment variable value | `production` |

**Usage Example:**
```json
{
  "name": "API Documentation",
  "type": "url",
  "target": "https://${env:API_HOST}/docs/${1}",
  "patterns": [
    {
      "type": "regex",
      "value": "api/(\\w+)",
      "highlightGroup": 1
    }
  ]
}
```

## Linker Extension Variables

### Regex Capture Groups

| Variable | Description | Example |
|----------|-------------|---------|
| `${1}`, `${2}`, ... | Regex capture groups from pattern matching | `users`, `docs` |

**Usage Example:**
```json
{
  "name": "Component File",
  "type": "file",
  "target": "${workspaceFolder}/src/components/${1}/${2}.tsx",
  "patterns": [
    {
      "type": "regex",
      "value": "import\\s+\\w+\\s+from\\s+['\"]\\./components/(\\w+)/(\\w+)['\"]",
      "highlightGroup": 1
    }
  ]
}
```

### Path Prefixes

| Prefix | Description | Example |
|--------|-------------|---------|
| `#:` | Relative to workspace root | `#:package.json` |
| `~:` | Relative to current file directory | `~:helper.ts` |
| `<:` | Relative to parent of current file directory | `<:../utils.ts` |
| `>:` | Relative to child directory of current file directory | `>:components/Button.tsx` |

**Usage Example:**
```typescript
// In src/components/Button.tsx
// @link [#package](#:package.json)
// @link [#helper](~:helper.ts)
// @link [#parent](<:../utils.ts)
// @link [#child](>:Modal.tsx)
```

## Complex Examples

### Combining Multiple Variables

```json
{
  "name": "Complex Link",
  "type": "file",
  "target": "${workspaceFolder}/docs/${relativeFileDirname}/${fileBasename}-${lineNumber}.md",
  "patterns": [
    {
      "type": "text",
      "value": "complex-link"
    }
  ]
}
```

This would generate a path like: `/workspace/root/docs/src/components/Button-42.md`

### Environment-Specific Links

```json
{
  "name": "Environment API",
  "type": "url",
  "target": "https://${env:API_HOST}/api/${env:API_VERSION}/${1}",
  "patterns": [
    {
      "type": "regex",
      "value": "api/(\\w+)",
      "highlightGroup": 1
    }
  ]
}
```

### Dynamic Test File Generation

```json
{
  "name": "Test File",
  "type": "file",
  "target": "${fileDirname}/__tests__/${fileBasename}.test.${fileExtname}",
  "patterns": [
    {
      "type": "text",
      "value": "test",
      "fileExtensions": [".js", ".ts", ".jsx", ".tsx"]
    }
  ]
}
```

## Compatibility Notes

- **VS Code Compatibility**: All variables use the same `${variable}` syntax as VS Code
- **Independent Implementation**: Linker implements its own variable resolution for better control
- **Extended Features**: Additional features like regex capture groups and path prefixes
- **Error Handling**: Undefined variables are preserved as-is in the output
- **Performance**: Variable resolution is optimized for link generation

## Related Documentation

- [VS Code Variables Reference](https://code.visualstudio.com/docs/editor/variables-reference) - Official VS Code variable documentation
- [Linker Configuration Guide](../README.md#configuration-examples) - Configuration examples
- [Path Prefixes Guide](../examples/path-prefix-symbols.md) - Path prefix usage guide
- [CodeLens Configuration](../README.md#codelens-configuration-priority) - CodeLens configuration priority and examples
