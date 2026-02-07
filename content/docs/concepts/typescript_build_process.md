---
summary: 了解 AdonisJS 中的 TypeScript 构建流程
---

# TypeScript 构建流程

使用 TypeScript 编写的应用程序必须先编译为 JavaScript，然后才能在生产环境中运行。

编译 TypeScript 源文件可以使用许多不同的构建工具来执行。但是，在 AdonisJS 中，我们坚持使用最直接的方法，并使用以下经过时间考验的工具。

:::note

所有下面提到的工具都作为开发依赖项预安装在官方入门套件中。

:::

- **[TSC](https://www.typescriptlang.org/docs/handbook/compiler-options.html)** 是 TypeScript 的官方编译器。我们使用 TSC 执行类型检查并创建生产构建。

- **[TS Node Maintained](https://github.com/thetutlage/ts-node-maintained)** 是 TypeScript 的即时 (Just-in-Time) 编译器。它允许你执行 TypeScript 文件而无需将其编译为 JavaScript，并且被证明是用于开发的绝佳工具。

- **[SWC](https://swc.rs/)** 是用 Rust 编写的 TypeScript 编译器。我们在开发过程中将其与 TS Node 一起使用，以使 JIT 过程非常快。

| 工具 | 用途 | 类型检查 |
|-----------|---------------------------|---------------|
| `TSC` | 创建生产构建 | 是 |
| `TS Node` | 开发 | 否 |
| `SWC` | 开发 | 否 |

## 无需编译即可执行 TypeScript 文件

你可以使用 `ts-node-maintained/register/esm` 钩子在不编译的情况下执行 TypeScript 文件。例如，你可以通过运行以下命令来启动 HTTP 服务器。

```sh
node --import=ts-node-maintained/register/esm bin/server.js
```

- `--import`: import 标志允许你指定一个导出用于模块解析和加载的自定义钩子的模块。有关更多信息，请参阅 [Node.js 自定义钩子文档](https://nodejs.org/docs/latest-v22.x/api/module.html#customization-hooks)。

- `ts-node-maintained/register/esm`: `ts-node-maintained/register/esm` 脚本的路径，该脚本注册生命周期钩子以执行 TypeScript 源代码到 JavaScript 的即时编译。

- `bin/server.js`: AdonisJS HTTP 服务器入口点文件的路径。**另请参阅：[关于文件扩展名的说明](#a-note-on-file-extensions)**

你也可以对其他 TypeScript 文件重复此过程。例如：

```sh
// title: 运行测试
node --import=ts-node-maintained/register/esm bin/test.ts
```

```sh
// title: 运行 ace 命令
node --import=ts-node-maintained/register/esm bin/console.ts
```

```sh
// title: 运行其他 TypeScript 文件
node --import=ts-node-maintained/register/esm path/to/file.ts
```

### 关于文件扩展名的说明

你可能已经注意到我们到处都在使用 `.js` 文件扩展名，即使磁盘上的文件是用 `.ts` 文件扩展名保存的。

这是因为，对于 ES 模块，TypeScript 强制你在导入和运行脚本时使用 `.js` 扩展名。你可以在 [TypeScript 文档](https://www.typescriptlang.org/docs/handbook/modules/theory.html#typescript-imitates-the-hosts-module-resolution-but-with-types) 中了解此选择背后的理论。

:::tip

如果你使用的是 TypeScript 5.7 或更高版本，则可以使用 `.ts` 扩展名导入 TypeScript 文件。这得益于 [相对路径的路径重写](https://devblogs.microsoft.com/typescript/announcing-typescript-5-7-beta/#path-rewriting-for-relative-paths) 功能。

由于某些运行时允许你“就地”运行 TypeScript 代码并需要 `.ts` 扩展名，为了未来的兼容性，你可能更喜欢直接使用 `.ts` 扩展名。

:::

## 运行开发服务器

我们建议使用 `serve` 命令而不是直接运行 `bin/server.js` 文件，原因如下。

- 该命令包含一个文件监视器，并在文件更改时重新启动开发服务器。
- `serve` 命令会检测你的应用程序正在使用的前端资源打包器并启动其开发服务器。例如，如果你在项目根目录下有一个 `vite.config.js` 文件，`serve` 命令将启动 `vite` 开发服务器。

```sh
node ace serve --watch
```

你可以使用 `--assets-args` 命令行标志向 Vite 开发服务器传递参数。

```sh
node ace serve --watch --assets-args="--debug --base=/public"
```

你可以使用 `--no-assets` 标志来禁用 Vite 开发服务器。

```sh
node ace serve --watch --no-assets
```

### 向 Node.js 命令行传递选项

`serve` 命令将开发服务器 `(bin/server.ts 文件)` 作为子进程启动。如果你想向子进程传递 [node 参数](https://nodejs.org/api/cli.html#options)，可以在命令名称之前定义它们。

```sh
node ace --no-warnings --inspect serve --watch
```

## 创建生产构建

AdonisJS 应用程序的生产构建是使用 `node ace build` 命令创建的。`build` 命令执行以下操作以在 `./build` 目录内创建一个 [**独立 JavaScript 应用程序**](#what-is-a-standalone-build)。

- 删除现有的 `./build` 文件夹（如果有）。
- **从头开始**重写 `ace.js` 文件以删除 `ts-node/esm` 加载器。
- 使用 Vite 编译前端资源（如果已配置）。
- 使用 [`tsc`](https://www.typescriptlang.org/docs/handbook/compiler-options.html) 将 TypeScript 源代码编译为 JavaScript。
- 将在 [`metaFiles`](../concepts/adonisrc_file.md#metafiles) 数组下注册的非 TypeScript 文件复制到 `./build` 文件夹。
- 将 `package.json` 和 `package-lock.json/yarn.lock` 文件复制到 `./build` 文件夹。

:::warning
对 `ace.js` 文件的任何修改都将在构建过程中丢失，因为该文件是从头开始重写的。如果你想在 Ace 启动之前运行任何其他代码，你应该在 `bin/console.ts` 文件中执行此操作。
:::

这就完成了！

```sh
node ace build
```

构建创建完成后，你可以 `cd` 进入 `build` 文件夹，安装生产依赖项，然后运行你的应用程序。

```sh
cd build

# 安装生产依赖项
npm ci --omit=dev

# 运行服务器
node bin/server.js
```

你可以使用 `--assets-args` 命令行标志向 Vite 构建命令传递参数。

```sh
node ace build --assets-args="--debug --base=/public"
```

你可以使用 `--no-assets` 标志来避免编译前端资源。

```sh
node ace build --no-assets
```

### 什么是独立构建？

独立构建是指你的应用程序的 JavaScript 输出，你可以在没有原始 TypeScript 源代码的情况下运行它。

创建独立构建有助于减小你在生产服务器上部署的代码大小，因为你不必同时复制源文件和 JavaScript 输出。

创建生产构建后，你可以将 `./build` 复制到你的生产服务器，安装依赖项，定义环境变量，并运行应用程序。
