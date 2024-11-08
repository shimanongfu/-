# `package.json` 文件详解

`package.json` 文件是 **Node.js 项目**中最重要的配置文件之一，包含了项目的基本信息、依赖项、脚本、配置等。它是 **npm**、**pnpm**、**Yarn** 等包管理工具使用的核心文件。

## 1. 基础信息

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "This is a sample project",
  "keywords": ["node", "project", "example"],
  "author": "Pillar <pillar@example.com>",
  "license": "MIT",
  "homepage": "https://github.com/pillar/my-project",
  "repository": {
    "type": "git",
    "url": "https://github.com/pillar/my-project.git"
  },
  "bugs": {
    "url": "https://github.com/pillar/my-project/issues"
  }
}
```

- **name**: 项目名称，必须是唯一的，且不能包含大写字母和空格。
- **version**: 项目版本号，遵循 [SemVer 版本规范](https://semver.org/)。
- **description**: 项目的简短描述。
- **keywords**: 关键词数组，用于帮助用户在 npm 上搜索到你的项目。
- **author**: 作者信息，可以是 `"name <email>"` 或 `"name <email> (url)"` 的格式。
- **license**: 开源协议，如 `MIT`、`Apache-2.0`、`GPL-3.0` 等。
- **homepage**: 项目的主页 URL。
- **repository**: 项目的代码仓库信息。
- **bugs**: 项目问题报告的链接。

## 2. 依赖项

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "~4.17.21"
  },
  "devDependencies": {
    "jest": "^29.6.0",
    "eslint": "^8.52.0"
  },
  "peerDependencies": {
    "react": ">=16.8.0 <19.0.0"
  },
  "optionalDependencies": {
    "fsevents": "^2.3.2"
  },
  "bundledDependencies": ["my-private-package"]
}
```

- **dependencies**: 生产环境依赖，会在 `npm install` 时自动安装。
- **devDependencies**: 开发环境依赖，通常用于测试、构建工具、代码规范工具等。
- **peerDependencies**: 运行时需要的同级依赖，通常用于插件或库。
- **optionalDependencies**: 可选依赖，如果安装失败不会影响其他依赖的安装。
- **bundledDependencies**: 打包时包含的依赖，常用于发布 npm 包时打包特定的模块。

### 版本号规则

- `^1.0.0`：安装 `1.x.x`，但不安装 `2.0.0` 及更高版本。
- `~1.0.0`：安装 `1.0.x`，但不安装 `1.1.0` 及更高版本。
- `1.0.0`：固定安装特定版本。

## 3. 脚本（Scripts）

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "build": "tsc",
    "lint": "eslint .",
    "postinstall": "echo 'Dependencies installed!'"
  }
}
```

- **scripts**: 定义可执行脚本，通过 `npm run <script-name>` 执行。
- **钩子脚本**: `prestart`、`postinstall` 等，可以在特定命令前后自动执行。

## 4. 配置选项

```json
{
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  },
  "os": ["darwin", "linux"],
  "cpu": ["x64", "arm64"]
}
```

- **engines**: 指定项目要求的 Node.js 和 npm 版本。
- **os**: 限制操作系统，如 `darwin`（macOS）、`linux` 等。
- **cpu**: 限制处理器架构。

## 5. 配置文件

```json
{
  "config": {
    "port": "3000",
    "env": "production"
  }
}
```

- **config**: 可通过 `process.env.npm_package_config_<key>` 访问，适合定义项目的自定义配置。

## 6. 其他字段

- **main**: 指定项目的入口文件，当项目被 `require` 时加载的模块。
- **exports**: 定义模块的导出路径，支持 ESM（ECMAScript Modules）。
- **type**: 设置为 `"module"` 启用 ESM 模块语法。
- **files**: 指定发布到 npm 时包含的文件或目录。
- **private**: 如果设置为 `true`，则阻止包被发布到 npm。

## 7. 示例：完整的 `package.json` 文件

```json
{
  "name": "my-node-project",
  "version": "1.0.0",
  "description": "A sample Node.js project",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "build": "tsc"
  },
  "keywords": ["node", "example", "project"],
  "author": "Pillar <pillar@example.com>",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.6.0",
    "eslint": "^8.52.0"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "config": {
    "port": "3000"
  }
}
```

## 总结

- `package.json` 是 Node.js 项目管理、依赖安装、自动化脚本和配置的核心文件。
- 它帮助开发者管理项目依赖、设置脚本命令、定义项目信息，以及配置运行环境。

掌握 `package.json` 的使用，可以显著提升 Node.js 项目的管理和维护效率。
