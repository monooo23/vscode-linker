# Path Prefix Symbols Design

## Symbol Selection Rationale

We have chosen the following symbols to represent different relative path baselines, which are very intuitive:

### 📁 `#:` - Project Root Directory
- `#` represents "root" or "main", similar to how `#` in Git represents the main branch
- Example: `#:package.json` → package.json in the project root directory

### 📂 `~:` - Current File Directory
- `~` in Unix systems represents the user home directory, here extended to mean "current directory"
- Example: `~:helper.ts` → helper.ts in the same directory as the current file

### ⬆️ `<:` - Parent Directory
- `<` symbol intuitively represents "up" or "parent"
- Example: `<:../utils.ts` → utils.ts in the parent directory of the current file

### ⬇️ `>:` - Child Directory
- `>` symbol intuitively represents "down" or "child"
- Example: `>:components/Button.tsx` → components in the child directory of the current file

## File System Hierarchy

```
Project Root Directory (#:)
├── package.json (#:package.json)
├── README.md (#:README.md)
├── src/
│   ├── components/
│   │   ├── Button.tsx (>:components/Button.tsx)
│   │   └── Modal.tsx (>:components/Modal.tsx)
│   ├── utils/
│   │   ├── helper.ts (~:helper.ts)
│   │   └── index.ts (~:utils/index.ts)
│   └── config.ts (~:config.ts)
└── docs/
    └── api.md (<:../docs/api.md)
```

## Usage Examples

```typescript
// In src/components/Button.tsx file:

// Reference files from project root directory
// @link [#package](#:package.json)
// @link [#readme](#:README.md)

// Reference files from current directory
// @link [#helper](~:helper.ts)
// @link [#utils](~:utils/index.ts)

// Reference files from parent directory
// @link [#parent](<:../parent.ts)
// @link [#shared](<:../shared/utils.ts)

// Reference files from child directory
// @link [#modal](>:Modal.tsx)
// @link [#service](>:services/api.ts)
```

## Symbol Intuitiveness

The selection of these symbols is based on the following principles:

1. **Visual Intuitiveness**: `<` and `>` symbols directly correspond to file system hierarchy relationships
2. **Semantic Clarity**: Each symbol has a clear meaning and purpose
3. **Easy to Remember**: Symbols are directly associated with their functions, making them easy to remember
4. **Conflict Avoidance**: The chosen symbols don't conflict with common file path characters

This design allows developers to immediately understand the baseline position of paths at a glance, greatly improving code readability and maintainability!
