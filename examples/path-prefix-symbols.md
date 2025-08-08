# 路径前缀符号设计说明

## 符号选择理由

我们选择了以下符号来表示不同的相对路径基准，这些符号非常直观：

### 📁 `#:` - 项目根目录
- `#` 代表"根"或"主要"，类似于 Git 中的 `#` 表示主分支
- 例如：`#:package.json` → 项目根目录下的 package.json

### 📂 `~:` - 当前文件目录
- `~` 在 Unix 系统中表示用户主目录，这里扩展为"当前目录"
- 例如：`~:helper.ts` → 当前文件同目录下的 helper.ts

### ⬆️ `<:` - 上级目录
- `<` 符号直观地表示"向上"或"父级"
- 例如：`<:../utils.ts` → 当前文件上级目录下的 utils.ts

### ⬇️ `>:` - 下级目录
- `>` 符号直观地表示"向下"或"子级"
- 例如：`>:components/Button.tsx` → 当前文件下级目录中的组件

## 文件系统层级关系

```
项目根目录 (#:)
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

## 使用示例

```typescript
// 在 src/components/Button.tsx 文件中：

// 引用项目根目录的文件
// @link [#package](#:package.json)
// @link [#readme](#:README.md)

// 引用当前目录的文件
// @link [#helper](~:helper.ts)
// @link [#utils](~:utils/index.ts)

// 引用上级目录的文件
// @link [#parent](<:../parent.ts)
// @link [#shared](<:../shared/utils.ts)

// 引用下级目录的文件
// @link [#modal](>:Modal.tsx)
// @link [#service](>:services/api.ts)
```

## 符号的直观性

这些符号的选择基于以下原则：

1. **视觉直观性**：`<` 和 `>` 符号直接对应文件系统的层级关系
2. **语义清晰性**：每个符号都有明确的含义和用途
3. **易于记忆**：符号与功能直接关联，容易记住
4. **避免冲突**：选择的符号不会与常见的文件路径字符冲突

这种设计让开发者能够一眼就看出路径的基准位置，大大提高了代码的可读性和维护性！
