# Linker Documentation

Welcome to the Linker extension documentation! This directory contains detailed guides and references for using the Linker VS Code extension.

## 📚 Documentation Index

### Core Documentation
- **[Main README](../README.md)** - Complete extension overview and quick start guide
- **[Variables Reference](variables-reference.md)** - Complete guide to all supported variables
- **[CodeLens Configuration](codelens-configuration.md)** - Detailed CodeLens configuration guide

### Examples and Demos
- **[Path Prefix Demo](../examples/path-prefix-demo.ts)** - Examples of using path prefixes
- **[Path Prefix Symbols](../examples/path-prefix-symbols.md)** - Explanation of path prefix design
- **[Variable Support Demo](../examples/variable-support-demo.json)** - Configuration examples for all variables
- **[CodeLens Config Demo](../examples/codeLens-config-demo.json)** - CodeLens configuration examples
- **[Auto-Reload Demo](../examples/auto-reload-demo.md)** - Auto-reload configuration demonstration
- **[JSON Repair Demo](../examples/json-repair-demo.md)** - JSON auto-repair feature demonstration
- **[JSON Repair Examples](../examples/json-repair-demo.json)** - Examples of JSON syntax errors that can be auto-repaired


### Development
- **[Test Summary](../TEST_SUMMARY.md)** - Current test status and development progress

## 🚀 Quick Links

### VS Code Official Documentation
- [VS Code Variables Reference](https://code.visualstudio.com/docs/editor/variables-reference) - Official variable documentation
- [VS Code Extension API](https://code.visualstudio.com/api) - Extension development guide
- [VS Code Extension Development](https://code.visualstudio.com/docs/extensions/overview) - Getting started with extensions

### Key Features
- **Variable Support**: Compatible with VS Code variables + extended features
- **Path Prefixes**: Intuitive path resolution with `#:`, `~:`, `<:`, `>:` prefixes
- **Inline Links**: `@link [#anchor](href)` format for direct code linking
- **Regex Capture Groups**: Dynamic link generation with pattern matching
- **File Navigation**: Smart file detection and line/column positioning
- **Flexible CodeLens**: Rule-specific CodeLens settings override global configuration
- **JSON Auto-Repair**: Automatically fixes common JSON syntax errors in configuration files

## 📖 Getting Started

1. **Install the Extension** - Available on VS Code Marketplace
2. **Create Configuration** - Set up `.vscode/linker.json` in your project
3. **Add Inline Links** - Use `@link [#anchor](href)` in your comments
4. **Configure Variables** - Use VS Code variables for dynamic links
5. **Use Path Prefixes** - Specify relative paths with intuitive prefixes

## 🔧 Configuration

### Basic Configuration
```json
[
  {
    "name": "Example Link",
    "type": "url",
    "target": "https://example.com/${1}",
    "patterns": [
      {
        "type": "regex",
        "value": "example/(\\w+)",
        "highlightGroup": 1
      }
    ]
  }
]
```

### Inline Links
```typescript
// @link [#example](https://example.com)
// @link [#config](#:package.json)
// @link [#helper](~:helper.ts)
```

## 🎯 Use Cases

- **Documentation Links**: Connect code to external docs
- **File Navigation**: Quick jump to related files
- **API References**: Link to API documentation
- **Issue Tracking**: Connect to GitHub issues/Jira tickets
- **Design Systems**: Link to design tokens or components
- **Testing**: Connect to test files or test documentation

---

**Need help?** Check the [main README](../README.md) for comprehensive guides and examples!
