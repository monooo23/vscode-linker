# Linker

A powerful VSCode extension that transforms your code into an interactive navigation hub. Create clickable links in your code that connect to external documentation, internal files, or any web resource through simple JSON configuration.

## ✨ Features

### 🔗 Multiple Link Types

- **URL Links**: Jump to external websites, documentation, or APIs
- **File Links**: Navigate to files within your project with line/column precision

### 🎯 Flexible Matching Rules

- **Text Matching**: Exact text matching for precise control
- **Regex Matching**: Pattern matching using regular expressions
- **Line Matching**: Match content on specific lines

### ⚙️ Two Configuration Methods

- **Global Configuration**: Define link rules through JSON files
- **Inline Links**: Use `@link [#anchor](href)` format directly in comments
  - Customize the pattern in VSCode settings via `linker.inlineLinkPattern`

### 🧠 Smart Link Parsing

- Automatically detect matches in code
- Support line number positioning in file paths (e.g., `file.md:6:4`)
- Support [VS Code variables](https://code.visualstudio.com/docs/editor/variables-reference) and environment variables
- Variable substitution with regex capture groups
- Custom path prefixes for flexible file navigation

## 🚀 Quick Start

### 1. Install the Extension

Install Linker from the VSCode extension marketplace.

### 2. Create Configuration

Create `.vscode/linker.json` in your project root:

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
    ],
    "description": "Open GitHub repository",
    "showCodeLens": true
  },
  {
    "name": "Error Documentation",
    "type": "file",
    "target": "./docs/errors.md:${1}",
    "patterns": [
      {
        "type": "line",
        "value": "101",
        "context": {
          "before": "E",
          "after": ":"
        }
      }
    ],
    "description": "Link to error documentation"
  }
]
```

### 3. Start Linking!

Your code will automatically show clickable links. Hover to preview, Ctrl+Click to navigate!

**Examples**: 
- Any occurrence of `github.com/example/repo` in your code will become clickable and link to the GitHub repository
- Any occurrence of `E101:` will become clickable and link to line 101 in `./docs/errors.md`

**🔄 Configuration Reload**: The extension automatically reloads configuration when you save the `.vscode/linker.json` file. If changes don't take effect, you can manually run the **"Reload Link Configuration"** command from the command palette (Ctrl+Shift+P).

## 📝 Configuration Examples

### External Documentation Links

```json
{
  "name": "React Documentation",
  "type": "url",
  "target": "https://reactjs.org/docs/${1}.html",
  "patterns": [
    {
      "type": "regex",
      "value": "React\\.(\\w+)",
      "caseSensitive": false,
      "highlightGroup": 1
    }
  ],
  "description": "Open React documentation"
}
```

**🎯 Precision Highlighting**: The `highlightGroup: 1` parameter ensures only the captured group `(\\w+)` is highlighted, not the entire `React.Component` match.

### Internal File Navigation

```json
{
  "name": "Component File",
  "type": "file",
  "target": "./src/components/${1}.tsx",
  "patterns": [
    {
      "type": "regex",
      "value": "import\\s+\\w+\\s+from\\s+['\"]\\./components/(\\w+)['\"]",
      "caseSensitive": false,
      "highlightGroup": 1
    }
  ],
  "description": "Open component file"
}
```

### API Documentation

```json
{
  "name": "API Documentation",
  "type": "url",
  "target": "https://api.example.com/docs/${1}",
  "patterns": [
    {
      "type": "regex",
      "value": "api\\.example\\.com/([a-zA-Z0-9_-]+)",
      "caseSensitive": false,
      "highlightGroup": 1
    }
  ],
  "description": "Open API documentation"
}
```

### Inline Links in Comments

Define links in comments and make code text clickable:

```javascript
// Define a link for the "react" text in the next line
// @link [#react](https://reactjs.org/docs)
const framework = "react"; // "react" becomes clickable

// Define a link for the "Button" text in the next line
/**
 * @link [#Button](#:src/components/Button.tsx)
 */
const component = "Button"; // "Button" becomes clickable

// Define a link for the "API" text in the next line
// @link [#API](https://api.example.com/docs)
const endpoint = "API"; // "API" becomes clickable
```

**💡 How it works**:

- Links are defined in comments using `@link [#anchor](href)` format
- The `anchor` text must exactly match the code text in the next line
- Only the code text becomes clickable, not the comment
- You can customize the pattern in VSCode settings via `linker.inlineLinkPattern`

#### Path Prefixes for File Links

For file paths in inline links, you can use path prefixes to specify the relative base directory. This is a Linker extension feature that provides more intuitive path resolution:

- `#:` - Relative to workspace root
- `~:` - Relative to current file directory  
- `<:` - Relative to parent of current file directory
- `>:` - Relative to child directory of current file directory

**Examples**:

```javascript
// Workspace root relative
// @link [#config](#:package.json)
// @link [#readme](#:README.md)

// Current directory relative
// @link [#helper](~:helper.ts)
// @link [#types](~:types/index.ts)

// Parent directory relative
// @link [#parent](<:../parent.ts)
// @link [#shared](<:../shared/utils.ts)

// Child directory relative
// @link [#component](>:components/Button.tsx)
// @link [#service](>:services/api.ts)
```

## 🎯 Advanced Features

### Line Number Navigation

Navigate to specific lines and columns in files:

```json
{
  "name": "Error Reference",
  "type": "file",
  "target": "./src/utils/errors.ts:${1}:${2}",
  "patterns": [
    {
      "type": "regex",
      "value": "ERROR_(\\d+):(\\d+)",
      "highlightGroup": 0
    }
  ]
}
```

**Example**: `ERROR_101:5` → jumps to line 101, column 5 in `errors.ts`

### Environment Variable Support

Use environment variables in your link targets:

```json
{
  "name": "Staging API",
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

### Workspace Variable Substitution

Reference workspace and file information:

```json
{
  "name": "Related Test File",
  "type": "file",
  "target": "${workspaceFolder}/tests/${fileBasename}.test.js",
  "patterns": [
    {
      "type": "text",
      "value": "test",
      "fileExtensions": [".js", ".ts"]
    }
  ]
}
```

### Supported Variables

Linker supports most VS Code variables for dynamic link generation. Our variable system is compatible with the [VS Code Variables Reference](https://code.visualstudio.com/docs/editor/variables-reference) and extends it with additional features.

#### Workspace Variables
- `${workspaceFolder}` - Workspace root directory path
- `${workspaceFolderBasename}` - Workspace folder name

#### File Variables
- `${file}` - Current file full path
- `${fileBasename}` - Current file name (without path)
- `${fileDirname}` - Current file directory path
- `${fileExtname}` - Current file extension
- `${relativeFile}` - File path relative to workspace
- `${relativeFileDirname}` - File directory relative to workspace

#### Editor Variables
- `${lineNumber}` - Current line number (1-based)
- `${selectedText}` - Currently selected text

#### System Variables
- `${cwd}` - Current working directory
- `${userHome}` - User home directory
- `${appName}` - VS Code application name
- `${appRoot}` - VS Code application root
- `${execPath}` - VS Code executable path

#### Environment Variables
- `${env:VAR_NAME}` - Environment variable value

#### Regex Capture Groups (Linker Extension)
- `${1}`, `${2}`, ... - Regex capture groups from pattern matching

#### Path Prefixes (Linker Extension)
- `#:` - Relative to workspace root
- `~:` - Relative to current file directory
- `<:` - Relative to parent of current file directory
- `>:` - Relative to child directory of current file directory

**💡 Note**: While Linker implements its own variable resolution system, it maintains full compatibility with VS Code's official variable syntax. This allows us to provide additional features like regex capture groups and path prefixes while ensuring your existing VS Code knowledge applies seamlessly.

### File Extension Filtering

Apply links only to specific file types:

```json
{
  "name": "CSS Framework",
  "type": "url",
  "target": "https://tailwindcss.com/docs/${1}",
  "patterns": [
    {
      "type": "regex",
      "value": "class\\s*=\\s*['\"]([^'\"]*\\b(bg-|text-|p-|m-)[^'\"]*)['\"]",
      "fileExtensions": [".html", ".jsx", ".tsx", ".vue"],
      "highlightGroup": 1
    }
  ]
}
```

### Multi-Pattern Matching

Combine multiple patterns for complex scenarios:

```json
{
  "name": "GitHub Issues",
  "type": "url",
  "target": "https://github.com/example/repo/issues/${1}",
  "patterns": [
    {
      "type": "regex",
      "value": "#(\\d+)",
      "context": {
        "before": "fixes|closes|resolves",
        "after": ""
      }
    },
    {
      "type": "regex",
      "value": "issue\\s+#(\\d+)",
      "highlightGroup": 1
    }
  ]
}
```

## ⚙️ Configuration Reference

### Global Configuration Fields

| Field          | Type    | Description               |
| -------------- | ------- | ------------------------- |
| `name`         | string  | Link display name         |
| `type`         | string  | Link type (`url`, `file`) |
| `target`       | string  | Target URL or file path   |
| `patterns`     | array   | Array of matching rules   |
| `description`  | string  | Optional description      |
| `showCodeLens` | boolean | Show CodeLens (optional)  |

### Matching Rule Types

| Type    | Description            | Example                                 |
| ------- | ---------------------- | --------------------------------------- |
| `text`  | Exact text matching    | `"value": "github.com/example"`         |
| `regex` | Regular expression     | `"value": "api\\.example\\.com/(\\w+)"` |
| `line`  | Line-specific matching | `"value": "5"`                          |

### Line Matching Examples

Line matching allows you to create links for specific line numbers in your code. This is useful for referencing documentation, error codes, or specific sections.

#### Basic Line Matching

```json
{
  "name": "Line Reference",
  "type": "url",
  "target": "https://docs.example.com/line-${1}",
  "patterns": [
    {
      "type": "line",
      "value": "5"
    }
  ],
  "description": "Link to documentation for line 5"
}
```

#### Line Number with Context

```json
{
  "name": "Error Code Reference",
  "type": "file",
  "target": "./docs/errors.md:${1}",
  "patterns": [
    {
      "type": "line",
      "value": "101",
      "context": {
        "before": "ERROR_",
        "after": ":"
      }
    }
  ],
  "description": "Link to error documentation"
}
```

**Example Usage**:
```javascript
// Line 5 will be clickable and link to documentation
const config = {
  // Line 5 content
  port: 3000
};

// ERROR_101: will be clickable and link to error docs
const errorCode = "ERROR_101: Invalid input";
```

#### Multiple Line References

```json
{
  "name": "Multi-Line Reference",
  "type": "url",
  "target": "https://api.example.com/endpoint/${1}",
  "patterns": [
    {
      "type": "line",
      "value": "10"
    },
    {
      "type": "line", 
      "value": "20"
    },
    {
      "type": "line",
      "value": "30"
    }
  ],
  "description": "Link to API documentation for specific lines"
}
```

#### Line Matching with File Extension Filtering

```json
{
  "name": "Test Line Reference",
  "type": "file",
    "target": "./tests/${fileBasename}.test.js:${1}",
  "patterns": [
    {
      "type": "line",
      "value": "15",
      "fileExtensions": [".js", ".ts"]
    }
  ],
  "description": "Link to corresponding test line"
}
```

### Advanced Pattern Options

```json
{
  "type": "regex",
  "value": "pattern",
  "fileExtensions": [".js", ".ts"], // File type filtering
  "caseSensitive": false, // Case sensitivity
  "highlightGroup": 1, // Highlight specific group
  "context": {
    // Context matching
    "before": "import",
    "after": "from"
  }
}
```

### 🎯 Highlight Group Examples

The `highlightGroup` parameter solves a common regex highlighting problem:

| Pattern                           | Text                            | `highlightGroup: 0`             | `highlightGroup: 1` | Result                          |
| --------------------------------- | ------------------------------- | ------------------------------- | ------------------- | ------------------------------- |
| `React\.(\w+)`                    | `React.Component`               | `React.Component`               | `Component`         | Only component name highlighted |
| `api\.example\.com/(\w+)`         | `api.example.com/users`         | `api.example.com/users`         | `users`             | Only endpoint highlighted       |
| `import.*from\s+['"]([^'"]+)['"]` | `import Button from './Button'` | `import Button from './Button'` | `./Button`          | Only path highlighted           |

### 🎯 Context Matching Examples

The `context` parameter with `before` and `after` ensures matches only occur in specific contexts:

```json
{
  "name": "React Import Links",
  "type": "url",
  "target": "https://reactjs.org/docs/${1}.html",
  "patterns": [
    {
      "type": "regex",
      "value": "(\\w+)",
      "context": {
        "before": "import\\s+",
        "after": "\\s+from\\s+['\"]react['\"]"
      }
    }
  ]
}
```

**Example Usage**:

- ✅ **Matches**: `import useState from 'react'` → highlights `useState`
- ✅ **Matches**: `import { useEffect } from 'react'` → highlights `useEffect`
- ❌ **No Match**: `const useState = 'react'` → no highlight (wrong context)

### 🔍 More Context Examples

**1. Function Call Context**:

```json
{
  "type": "regex",
  "value": "(\\w+)",
  "context": {
    "before": "console\\.log\\(",
    "after": "\\)"
  }
}
```

**2. Variable Declaration Context**:

```json
{
  "type": "regex",
  "value": "(\\w+)",
  "context": {
    "before": "const\\s+",
    "after": "\\s*="
  }
}
```

### 📋 Real-World Line Matching Use Cases

#### 1. Error Code Documentation

Create links for error codes that reference specific documentation lines:

```json
{
  "name": "Error Documentation",
  "type": "file",
  "target": "./docs/errors.md:${1}",
  "patterns": [
    {
      "type": "line",
      "value": "101",
      "context": {
        "before": "E",
        "after": ":"
      }
    },
    {
      "type": "line",
      "value": "102", 
      "context": {
        "before": "E",
        "after": ":"
      }
    }
  ],
  "description": "Link to error documentation"
}
```

**Usage in code**:
```javascript
// E101: will link to line 101 in errors.md
throw new Error("E101: Invalid input");

// E102: will link to line 102 in errors.md  
throw new Error("E102: Missing parameter");
```

#### 2. API Version Reference

Link API version numbers to specific documentation sections:

```json
{
  "name": "API Version Docs",
  "type": "url",
  "target": "https://api.example.com/v${1}/docs",
  "patterns": [
    {
      "type": "line",
      "value": "1",
      "context": {
        "before": "api/v",
        "after": "/"
      }
    },
    {
      "type": "line",
      "value": "2",
      "context": {
        "before": "api/v", 
        "after": "/"
      }
    }
  ],
  "description": "Link to API version documentation"
}
```

**Usage in code**:
```javascript
// api/v1/ will link to v1 docs
const apiUrl = "api/v1/users";

// api/v2/ will link to v2 docs
const apiUrl = "api/v2/users";
```

#### 3. Configuration Line Reference

Link configuration values to their documentation:

```json
{
  "name": "Config Documentation",
  "type": "file",
  "target": "./docs/config.md:${1}",
  "patterns": [
    {
      "type": "line",
      "value": "5",
      "fileExtensions": [".json", ".yaml", ".yml"]
    },
    {
      "type": "line",
      "value": "10",
      "fileExtensions": [".json", ".yaml", ".yml"]
    }
  ],
  "description": "Link to configuration documentation"
}
```

**Usage in config files**:
```json
{
  "port": 3000,        // Line 5 - links to port config docs
  "database": {
    "host": "localhost" // Line 10 - links to database config docs
  }
}
```

```json
{
  "type": "regex",
  "value": "(\\w+)",
  "context": {
    "before": "const\\s+",
    "after": "\\s*="
  }
}
```

**3. API Call Context**:

```json
{
  "type": "regex",
  "value": "(\\w+)",
  "context": {
    "before": "fetch\\(['\"]",
    "after": "['\"]\\)"
  }
}
```

### 💡 Context Matching Tips

**Why Use Context?**

- **Precision**: Avoid false positives by limiting matches to specific contexts
- **Clarity**: Make it clear when and where links should appear
- **Performance**: Reduce unnecessary processing by filtering matches early

**Best Practices**:

- Use `before` and `after` together for maximum precision
- Test your patterns with various code scenarios
- Consider edge cases where your pattern might match unexpectedly
- Use regex escaping for special characters (e.g., `\\.` for literal dot)

## 🎮 Usage

### Navigation Methods

1. **Auto-detection**: Links appear automatically in your code
2. **Hover preview**: Mouse hover shows link information
3. **Click navigation**: Ctrl+Click (Mac: Cmd+Click) to navigate
4. **Keyboard shortcut**: Ctrl+Shift+L (Mac: Cmd+Shift+L)

### Variable Substitution

Link targets support dynamic variables. See [VS Code Variables Reference](https://code.visualstudio.com/docs/editor/variables-reference) for complete documentation.

| Variable | Description | Type |
|----------|-------------|------|
| `${workspaceFolder}` | Project root directory | Workspace |
| `${workspaceFolderBasename}` | Workspace folder name | Workspace |
| `${file}` | Current file full path | File |
| `${fileBasename}` | Current file name (without path) | File |
| `${fileDirname}` | Current file directory path | File |
| `${fileExtname}` | Current file extension | File |
| `${relativeFile}` | File path relative to workspace | File |
| `${relativeFileDirname}` | File directory relative to workspace | File |
| `${lineNumber}` | Current line number (1-based) | Editor |
| `${selectedText}` | Currently selected text | Editor |
| `${cwd}` | Current working directory | System |
| `${userHome}` | User home directory | System |
| `${env:VAR_NAME}` | Environment variable value | Environment |
| `${1}`, `${2}`, ... | Regex capture groups | Linker Extension |
| `#:`, `~:`, `<:`, `>:` | Path prefixes | Linker Extension |

## 🔧 Extension Settings

Configure Linker behavior in VSCode settings:

```json
{
  "linker.enabled": true, // Enable/disable extension
  "linker.enableHover": true, // Show hover tooltips
  "linker.enableDecorations": true, // Show link underlines
  "linker.enableInlineLinks": true, // Enable inline links
  "linker.enableCodeLens": false, // Default CodeLens setting (can be overridden per rule)
  "linker.inlineLinkPattern": "@link\\s+\\[#(?<anchor>.+?)\\]\\((?<link>.+?)\\)" // Customize inline link format
}
```

### CodeLens Configuration Priority

CodeLens visibility follows this priority order:

1. **Rule-specific setting** (`showCodeLens` in `linker.json`) - Highest priority
2. **Global setting** (`linker.enableCodeLens` in VS Code settings) - Fallback

**Examples:**
```json
// linker.json - Rule overrides global setting
{
  "name": "GitHub Repository",
  "showCodeLens": true,  // This rule will show CodeLens regardless of global setting
  "patterns": [...]
}

// VS Code settings - Global fallback
{
  "linker.enableCodeLens": false  // Only applies to rules without showCodeLens property
}
```

#### Configuration Scenarios

| Global Setting | Rule Setting | Result | Description |
|----------------|---------------|---------|-------------|
| `false` | `true` | ✅ Show CodeLens | Rule setting overrides global |
| `false` | `false` | ❌ Hide CodeLens | Both settings agree |
| `false` | `undefined` | ❌ Hide CodeLens | Use global setting as fallback |
| `true` | `true` | ✅ Show CodeLens | Both settings agree |
| `true` | `false` | ❌ Hide CodeLens | Rule setting overrides global |
| `true` | `undefined` | ✅ Show CodeLens | Use global setting as fallback |

#### Real-World Example

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
    "showCodeLens": true  // ✅ This rule WILL show CodeLens (overrides global)
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
    "showCodeLens": false  // ❌ This rule will NOT show CodeLens
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
    // No showCodeLens property - ❌ Will NOT show CodeLens (uses global setting)
  }
]
```

**Result**: Only the "GitHub Repository" rule will display CodeLens, even though the global setting is `false`.

## 📁 Supported File Types

- **Web Development**: JavaScript, TypeScript, JSX, TSX, HTML, CSS
- **Backend**: Python, Java, C/C++, Go, Rust, PHP, Ruby, C#
- **Configuration**: JSON, YAML, TOML, XML
- **Documentation**: Markdown, RST, AsciiDoc
- **And more**: Any text-based file format

## 🎯 Use Cases

- **Documentation Links**: Connect code to external docs
- **File Navigation**: Quick jump to related files
- **API References**: Link to API documentation
- **Issue Tracking**: Connect to GitHub issues/Jira tickets
- **Design Systems**: Link to design tokens or components
- **Testing**: Connect to test files or test documentation

## 📚 Additional Resources

### VS Code Official Documentation
- [VS Code Variables Reference](https://code.visualstudio.com/docs/editor/variables-reference) - Complete list of supported variables
- [VS Code Extension API](https://code.visualstudio.com/api) - Extension development guide
- [VS Code Extension Development](https://code.visualstudio.com/docs/extensions/overview) - Getting started with extensions
- [VS Code Extension Marketplace](https://marketplace.visualstudio.com/) - Browse and install extensions

### Linker Extension Features
- **Variable Compatibility**: Linker maintains full compatibility with VS Code's official variable syntax
- **Extended Functionality**: Additional features like regex capture groups and path prefixes
- **Custom Implementation**: Independent variable resolution system for better control and extensibility
- **[Complete Variables Reference](docs/variables-reference.md)** - Detailed documentation of all supported variables

---

**Transform your code into an interactive experience with Linker!** 🚀
