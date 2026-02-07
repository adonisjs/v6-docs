---
summary: 了解 AdonisJS 在安装过程中创建的重要文件和文件夹。
---

# 目录结构

在本指南中，我们将带你了解 AdonisJS 在安装过程中创建的重要文件和文件夹。

我们提供了一个精心设计的默认目录结构，有助于保持项目整洁且易于重构。当然，你也可以完全自由地进行调整，设计出最适合你的团队和项目的目录结构。

## `adonisrc.ts` 文件

`adonisrc.ts` 文件用于配置工作区和应用的一些运行时设置。

在这个文件中，你可以注册提供者（providers）、定义命令别名，或者指定要复制到生产构建中的文件。

参考：[AdonisRC 文件参考指南](../concepts/adonisrc_file.md)

## `tsconfig.json` 文件

`tsconfig.json` 文件存储了应用的 TypeScript 配置。你可以根据项目或团队的需求随意修改此文件。

为了确保 AdonisJS 内部正常工作，以下配置选项是必须的。

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "isolatedModules": true,
    "declaration": false,
    "outDir": "./build",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true
  }
}
``` 

## 子路径导入 (Sub-path imports)

AdonisJS 使用 Node.js 的 [子路径导入 (sub-path imports)](https://nodejs.org/dist/latest-v19.x/docs/api/packages.html#subpath-imports) 功能来定义导入别名。

`package.json` 文件中预配置了以下导入别名。你可以随意添加新别名或编辑现有别名。

```json
// title: package.json
{
  "imports": {
    "#controllers/*": "./app/controllers/*.js",
    "#exceptions/*": "./app/exceptions/*.js",
    "#models/*": "./app/models/*.js",
    "#mails/*": "./app/mails/*.js",
    "#services/*": "./app/services/*.js",
    "#listeners/*": "./app/listeners/*.js",
    "#events/*": "./app/events/*.js",
    "#middleware/*": "./app/middleware/*.js",
    "#validators/*": "./app/validators/*.js",
    "#providers/*": "./app/providers/*.js",
    "#policies/*": "./app/policies/*.js",
    "#abilities/*": "./app/abilities/*.js",
    "#database/*": "./database/*.js",
    "#tests/*": "./tests/*.js",
    "#start/*": "./start/*.js",
    "#config/*": "./config/*.js"
  }
}
```

## `bin` 目录

`bin` 目录包含在特定环境中加载应用的入口文件。例如：

- `bin/server.ts` 文件在 Web 环境中启动应用以监听 HTTP 请求。
- `bin/console.ts` 文件启动 Ace 命令行并执行命令。
- `bin/test.ts` 文件启动应用以运行测试。

## `ace.js` 文件

`ace` 文件启动应用的本地命令行框架。因此，每次运行 ace 命令时，都会经过此文件。

你会注意到 ace 文件的扩展名是 `.js`。这是因为我们希望使用 `node` 二进制文件直接运行此文件，而无需编译。

## `app` 目录

`app` 目录用于组织应用的领域逻辑代码。例如，控制器、模型、服务等都位于 `app` 目录中。

你可以随意创建其他目录来更好地组织应用代码。

```
├── app
│  └── controllers
│  └── exceptions
│  └── middleware
│  └── models
│  └── validators
```


## `resources` 目录

`resources` 目录包含 Edge 模板以及前端代码的源文件。换句话说，应用的表现层代码都位于 `resources` 目录中。

```
├── resources
│  └── views
│  └── js
│  └── css
│  └── fonts
│  └── images
```

## `start` 目录

`start` 目录包含在应用启动生命周期中需要导入的文件。例如，注册路由和定义事件监听器的文件应位于 `start` 目录中。

```
├── start
│  ├── env.ts
│  ├── kernel.ts
│  ├── routes.ts
│  ├── validator.ts
│  ├── events.ts
```

AdonisJS 不会自动导入 `start` 目录中的文件。它仅作为一个约定来对相似的文件进行分组。

我们建议阅读 [预加载文件](../concepts/adonisrc_file.md#preloads) 和 [应用启动生命周期](../concepts/application_lifecycle.md) 文档，以更好地理解哪些文件应放在 `start` 目录中。

## `public` 目录

`public` 目录存放静态资源，如 CSS 文件、图片、字体或前端 JavaScript 文件。

不要混淆 `public` 目录和 `resources` 目录。resources 目录包含前端应用的源代码，而 public 目录包含编译后的输出。

使用 Vite 时，你应该将前端资源存储在 `resources/<SUB_DIR>` 目录中，并让 Vite 编译器在 `public` 目录中生成输出。

另一方面，如果你不使用 Vite，可以直接在 `public` 目录中创建文件，并通过文件名访问它们。例如，可以通过 `http://localhost:3333/style.css` URL 访问 `./public/style.css` 文件。

## `database` 目录

`database` 目录包含数据库迁移（migrations）和填充（seeders）文件。

```
├── database
│  └── migrations
│  └── seeders
```


## `commands` 目录

[Ace 命令](../ace/introduction.md) 存储在 `commands` 目录中。你可以通过运行 `node ace make:command` 在此文件夹中创建命令。


## `config` 目录

`config` 目录包含应用的运行时配置文件。

框架的核心和其他安装的包都会从这个目录读取配置文件。你也可以将应用本地的配置存储在此目录中。

了解更多关于 [配置管理](./configuration.md) 的信息。

```
├── config
│  ├── app.ts
│  ├── bodyparser.ts
│  ├── cors.ts
│  ├── database.ts
│  ├── drive.ts
│  ├── hash.ts
│  ├── logger.ts
│  ├── session.ts
│  ├── static.ts
```


## `types` 目录

`types` 目录是应用中使用的 TypeScript 接口或类型的存放地。

默认情况下该目录是空的，但你可以在 `types` 目录中创建文件和文件夹来定义自定义类型和接口。

```
├── types
│  ├── events.ts
│  ├── container.ts
```

## `providers` 目录

`providers` 目录用于存储应用使用的 [服务提供者 (Service Providers)](../concepts/service_providers.md)。你可以使用 `node ace make:provider` 命令创建新的提供者。

了解更多关于 [服务提供者](../concepts/service_providers.md) 的信息。

```
├── providers
│  └── app_provider.ts
│  └── http_server_provider.ts
```

## `tmp` 目录

应用生成的临时文件存储在 `tmp` 目录中。例如，这些文件可能是用户上传的文件（在开发期间生成）或写入磁盘的日志。

`tmp` 目录必须被 `.gitignore` 规则忽略，也不应将其复制到生产服务器。

## `tests` 目录

`tests` 目录用于组织应用测试。此外，还会为 `unit`（单元测试）和 `functional`（功能测试）创建子目录。

参考：[测试](../testing/introduction.md)

```
├── tests
│  ├── bootstrap.ts
│  └── functional
│  └── regression
│  └── unit
```
