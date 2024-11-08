# `eslint.config.js` 文件详解

从 ESLint 8 开始，官方推荐使用 `eslint.config.js` 文件来配置 ESLint，而不再使用 `.eslintrc.js`。`eslint.config.js` 为 ES 模块配置文件格式，支持 `import` 和 `export` 语法，同时增强了与其他工具集成的灵活性。

## 1. `eslint.config.js` 文件格式

与 `.eslintrc.js` 文件不同，`eslint.config.js` 文件是 **ESM 格式** 的 JavaScript 文件，且必须通过 `export default` 导出配置对象。

### 示例配置

```javascript
export default {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

## 2. 配置项详解

### `env` - 环境

- **作用**: 指定代码运行的环境，从而为 ESLint 预定义全局变量。
- **示例**:
  ```javascript
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true
  }
  ```
- **常用选项**:
  - `browser`: 浏览器环境（`window`、`document` 等全局变量）
  - `node`: Node.js 环境（`global`、`process` 等全局变量）
  - `es6`: 启用 ES6 特性（会自动启用 `ecmaVersion: 6`）
  - `jest`: 支持 Jest 测试框架

### `extends` - 继承配置

- **作用**: 从已有的 ESLint 配置中继承规则。
- **示例**:
  ```javascript
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ]
  ```
- **常用选项**:
  - `eslint:recommended`: ESLint 官方推荐规则
  - `plugin:@typescript-eslint/recommended`: TypeScript 官方推荐规则
  - `plugin:react/recommended`: React 官方推荐规则

### `parser` - 解析器

- **作用**: 指定 ESLint 使用的解析器，默认为 `espree`。
- **示例**:
  ```javascript
  parser: '@typescript-eslint/parser';
  ```
- **常用解析器**:
  - `@typescript-eslint/parser`: 解析 TypeScript 代码
  - `babel-eslint`: 使用 Babel 解析器

### `parserOptions` - 解析器选项

- **作用**: 配置 JavaScript 语言特性和模块类型。
- **示例**:
  ```javascript
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  }
  ```
- **选项说明**:
  - `ecmaVersion`: ECMAScript 版本，如 `5`、`6`、`2020`、`2021`。
  - `sourceType`: 指定模块类型，`script` 或 `module`。
  - `ecmaFeatures`: 额外的语言特性，如 `jsx`。

### `plugins` - 插件

- **作用**: 添加 ESLint 插件，用于扩展规则。
- **示例**:
  ```javascript
  plugins: ['@typescript-eslint', 'react'];
  ```
- **说明**: 使用插件后需要在 `rules` 中启用相关规则。

### `rules` - 自定义规则

- **作用**: 开启、关闭或修改 ESLint 规则的行为。
- **示例**:
  ```javascript
  rules: {
    "no-console": "warn",
    "no-debugger": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
  ```
- **规则值**:
  - `"off"` 或 `0`: 关闭规则
  - `"warn"` 或 `1`: 触发警告
  - `"error"` 或 `2`: 触发错误

## 3. ESLint 忽略文件

- **`.eslintignore` 文件**: 用于指定 ESLint 忽略检查的文件和目录。
- **示例**:
  ```
  node_modules/
  dist/
  *.min.js
  ```

## 4. 使用 ESLint 脚本

在 `package.json` 中添加脚本：

```json
"scripts": {
  "lint": "eslint . --ext .js,.ts,.tsx",
  "lint:fix": "eslint . --ext .js,.ts,.tsx --fix"
}
```

- **运行 ESLint**:
  ```bash
  npm run lint
  ```
- **自动修复问题**:
  ```bash
  npm run lint:fix
  ```

## 5. 常用 ESLint 插件及扩展

- **@typescript-eslint**: 用于 TypeScript 的 ESLint 规则。
- **eslint-plugin-react**: 用于 React 的 ESLint 规则。
- **eslint-plugin-vue**: 用于 Vue.js 的 ESLint 规则。
- **prettier**: 代码格式化工具，可与 ESLint 集成。

## 6. 常见问题

### 如何解决与 Prettier 的冲突？

- 使用 `eslint-config-prettier` 关闭 ESLint 中与 Prettier 冲突的规则：
  ```javascript
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended"
  ]
  ```

### 如何在 VSCode 中自动修复？

- 安装 **ESLint 插件**，并在设置中启用 `Format on Save`。

## 7. 完整的 `eslint.config.js` 示例

```javascript
export default {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

## 总结

ESLint 是 JavaScript 和 TypeScript 项目中常用的静态代码分析工具，掌握 `eslint.config.js` 文件的配置能够帮助开发者提高代码质量和一致性。
