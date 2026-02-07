---
summary: 如何创建和配置一个新的 AdonisJS 应用。
---

# 安装

在创建新应用之前，你应该确保你的电脑上已经安装了 Node.js 和 npm。**AdonisJS 需要 Node.js 20 或更高版本**。

你可以使用 [官方安装程序](https://nodejs.org/en/download/) 或 [Volta](https://docs.volta.sh/guide/getting-started) 来安装 Node.js。Volta 是一个跨平台的包管理器，可以在你的电脑上安装和运行多个 Node.js 版本。

```sh
// title: 验证 Node.js 版本
node -v
# v22.0.0
```

:::tip
**你更喜欢通过视频学习吗？** - 查看来自我们朋友 Adocasts 的 [Let's Learn AdonisJS 6](https://adocasts.com/series/lets-learn-adonisjs-6) 免费截屏视频系列。
:::


## 创建新应用

你可以使用 [npm init](https://docs.npmjs.com/cli/v7/commands/npm-init) 来创建一个新项目。这些命令将下载 [create-adonisjs](http://npmjs.com/create-adonisjs) 初始化包并开始安装过程。

你可以使用以下 CLI 标志之一来自定义初始项目输出。

- `--kit`: 为项目选择 [启动套件](#starter-kits)。你可以选择 **web**、**api**、**slim** 或 **inertia**。

- `--db`: 指定你选择的数据库方言。你可以选择 **sqlite**、**postgres**、**mysql** 或 **mssql**。

- `--git-init`: 初始化 git 仓库。默认为 `false`。

- `--auth-guard`: 指定你选择的身份验证守卫。你可以选择 **session**、**access_tokens** 或 **basic_auth**。

:::codegroup

```sh
// title: npm
npm init adonisjs@latest hello-world
```

:::

当使用 `npm init` 命令传递 CLI 标志时，请确保使用 [双破折号两次](https://stackoverflow.com/questions/43046885/what-does-do-when-running-an-npm-command)。否则，`npm init` 将不会把标志传递给 `create-adonisjs` 初始化包。例如：

```sh
# 创建一个项目并提示所有选项
npm init adonisjs@latest hello-world

# 创建一个带有 MySQL 的项目
npm init adonisjs@latest hello-world -- --db=mysql

# 创建一个带有 PostgreSQL 和 API 启动套件的项目
npm init adonisjs@latest hello-world -- --db=postgres --kit=api

# 创建一个带有 API 启动套件和 access tokens 守卫的项目
npm init adonisjs@latest hello-world -- --kit=api --auth-guard=access_tokens
```

## 启动套件

启动套件是使用 AdonisJS 创建应用程序的起点。它们带有 [自以为是的文件夹结构](./folder_structure.md)、预配置的 AdonisJS 包以及你在开发过程中需要的必要工具。


:::note

官方启动套件使用 ES 模块和 TypeScript。这种组合允许你使用现代 JavaScript 结构并利用静态类型安全。

:::

### Web 启动套件

Web 启动套件专为创建传统的服务器渲染 Web 应用程序而定制。不要让关键字 **“传统”** 让你灰心。如果你制作一个前端交互有限的 Web 应用程序，我们推荐这个启动套件。

使用 [Edge.js](https://edgejs.dev) 在服务器上渲染 HTML 的简单性将提高你的工作效率，因为你不必处理复杂的构建系统来渲染一些 HTML。

稍后，你可以使用 [Hotwire](https://hotwired.dev)、[HTMX](http://htmx.org) 或 [Unpoly](http://unpoly.com) 让你的应用程序像 SPA 一样导航，并使用 [Alpine.js](http://alpinejs.dev) 创建交互式小部件，如下拉菜单或模态框。

```sh
npm init adonisjs@latest -- -K=web

# 切换数据库方言
npm init adonisjs@latest -- -K=web --db=mysql
```

Web 启动套件带有以下包。

<table>
<thead>
<tr>
<th width="180px">包</th>
<th>描述</th>
</tr>
</thead>
<tbody><tr>
<td><code>@adonisjs/core</code></td>
<td>框架的核心，拥有创建后端应用程序时可能需要的基线功能。</td>
</tr>
<tr>
<td><code>edge.js</code></td>
<td>用于组合 HTML页面的 <a href="https://edgejs.dev">edge</a> 模板引擎。</td>
</tr>
<tr>
<td><code>@vinejs/vine</code></td>
<td><a href="https://vinejs.dev">VineJS</a> 是 Node.js 生态系统中最快的验证库之一。</td>
</tr>
<tr>
<td><code>@adonisjs/lucid</code></td>
<td>Lucid 是由 AdonisJS 核心团队维护的 SQL ORM。</td>
</tr>
<tr>
<td><code>@adonisjs/auth</code></td>
<td>框架的身份验证层。它被配置为使用会话 (session)。</td>
</tr>
<tr>
<td><code>@adonisjs/shield</code></td>
<td>一组安全原语，用于保护你的 Web 应用程序免受 <strong>CSRF</strong> 和 <strong>XSS</strong> 等攻击。</td>
</tr>
<tr>
<td><code>@adonisjs/static</code></td>
<td>用于从应用程序的 <code>/public</code> 目录提供静态资产的中间件。</td>
</tr>
<tr>
<td><code>vite</code></td>
<td><a href="https://vitejs.dev/">Vite</a> 用于编译前端资产。</td>
</tr>
</tbody></table>

---

### API 启动套件

API 启动套件专为创建 JSON API 服务器而定制。它是 `web` 启动套件的精简版本。如果你打算使用 React 或 Vue 构建前端应用程序，你可以使用 API 启动套件创建你的 AdonisJS 后端。

```sh
npm init adonisjs@latest -- -K=api

# 切换数据库方言
npm init adonisjs@latest -- -K=api --db=mysql
```

在这个启动套件中：

- 我们移除了对提供静态文件的支持。
- 不配置视图层和 vite。
- 关闭 XSS 和 CSRF 保护并启用 CORS 保护。
- 使用 ContentNegotiation 中间件以 JSON 格式发送 HTTP 响应。

API 启动套件配置为基于会话的身份验证。但是，如果你希望使用基于令牌的身份验证，你可以使用 `--auth-guard` 标志。

另请参阅：[我应该使用哪个身份验证守卫？](../authentication/introduction.md#choosing-an-auth-guard)

```sh
npm init adonisjs@latest -- -K=api --auth-guard=access_tokens
```

---

### Slim 启动套件

对于极简主义者，我们创建了一个 `slim` 启动套件。它仅带有框架的核心和默认文件夹结构。当你不需要 AdonisJS 的任何花哨功能时，可以使用它。

```sh
npm init adonisjs@latest -- -K=slim

# 切换数据库方言
npm init adonisjs@latest -- -K=slim --db=mysql
```

---

### Inertia 启动套件

[Inertia](https://inertiajs.com/) 是一种构建服务器驱动的单页应用程序的方法。你可以使用你最喜欢的前端框架（React、Vue、Solid、Svelte）来构建应用程序的前端。

你可以使用 `--adapter` 标志来选择你要使用的前端框架。可用的选项有 `react`、`vue`、`solid` 和 `svelte`。

你还可以使用 `--ssr` 和 `--no-ssr` 标志来打开或关闭服务器端渲染。

```sh
npm init adonisjs@latest -- -K=inertia

# React with server-side rendering
npm init adonisjs@latest -- -K=inertia --adapter=react --ssr

# Vue without server-side rendering
npm init adonisjs@latest -- -K=inertia --adapter=vue --no-ssr
```

---

### 自带启动套件

启动套件是托管在 GitHub、Bitbucket 或 GitLab 等 Git 仓库提供商上的预构建项目。你也可以创建自己的启动套件并按如下方式下载它们。

```sh
npm init adonisjs@latest -- -K="github_user/repo"

# 从 GitLab 下载
npm init adonisjs@latest -- -K="gitlab:user/repo"

# 从 Bitbucket 下载
npm init adonisjs@latest -- -K="bitbucket:user/repo"
```

你可以使用 `git` 模式通过 Git+SSH 身份验证下载私有仓库。

```sh
npm init adonisjs@latest -- -K="user/repo" --mode=git
```

最后，你可以指定标签、分支或提交。

```sh
# 分支
npm init adonisjs@latest -- -K="user/repo#develop"

# 标签
npm init adonisjs@latest -- -K="user/repo#v2.1.0"
```

## 启动开发服务器

一旦你创建了一个 AdonisJS 应用程序，你可以通过运行 `node ace serve` 命令来启动开发服务器。

Ace 是捆绑在框架核心内的命令行框架。`--hmr` 标志监视文件系统并对代码库的某些部分执行 [热模块替换 (HMR)](../concepts/hmr.md)。

```sh
node ace serve --hmr
```

开发服务器运行后，你可以访问 [http://localhost:3333](http://localhost:3333) 在浏览器中查看你的应用程序。

## 构建生产环境

由于 AdonisJS 应用程序是用 TypeScript 编写的，因此在生产环境中运行之前必须将其编译为 JavaScript。

你可以使用 `node ace build` 命令创建 JavaScript 输出。JavaScript 输出写入 `build` 目录。

配置 Vite 后，此命令还会使用 Vite 编译前端资产并将输出写入 `build/public` 文件夹。

另请参阅：[TypeScript 构建过程](../concepts/typescript_build_process.md)。

```sh
node ace build
```

## 配置开发环境

虽然 AdonisJS 负责构建最终用户应用程序，但你可能需要额外的工具来享受开发过程并在编码风格上保持一致性。

我们强烈建议你使用 **[ESLint](https://eslint.org/)** 来 lint 你的代码，并使用 **[Prettier](https://prettier.io)** 来重新格式化你的代码以保持一致性。

官方启动套件预配置了 ESLint 和 Prettier，并使用了 AdonisJS 核心团队的自以为是的预设。你可以在文档的 [工具配置](../concepts/tooling_config.md) 部分了解更多信息。

最后，我们建议你为代码编辑器安装 ESLint 和 Prettier 插件，以便在应用程序开发期间获得更紧密的反馈循环。此外，你可以使用以下命令从命令行 `lint` 和 `format` 你的代码。

```sh
# 运行 ESLint
npm run lint

# 运行 ESLint 并自动修复问题
npm run lint -- --fix

# 运行 prettier
npm run format
```

## VSCode 扩展

你可以在任何支持 TypeScript 的代码编辑器上开发 AdonisJS 应用程序。但是，我们为 VSCode 开发了几个扩展，以进一步增强开发体验。

- [**AdonisJS**](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension) - 直接从你的代码编辑器查看应用程序路由、运行 ace 命令、迁移数据库和阅读文档。

- [**Edge**](https://marketplace.visualstudio.com/items?itemName=AdonisJS.vscode-edge) - 通过支持语法高亮、自动完成和代码片段来增强你的开发工作流程。

- [**Japa**](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode) - 使用键盘快捷键在不离开代码编辑器的情况下运行测试，或者直接从活动侧边栏运行它们。
