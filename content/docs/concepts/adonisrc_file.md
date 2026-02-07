---
summary: '`adonisrc.ts` 文件用于配置应用程序的工作区设置。'
---

# AdonisRC 文件

`adonisrc.ts` 文件用于配置应用程序的工作区设置。在此文件中，你可以[注册提供者](#providers)、定义[命令别名](#commandsaliases)、指定要[复制到](#metafiles)生产构建的文件等等。

:::warning

`adonisrc.ts` 文件会被 AdonisJS 应用程序以外的工具导入。因此，你不得在此文件中编写任何特定于应用程序的代码或特定于环境的条件。

:::

该文件包含运行应用程序所需的最低配置。但是，你可以通过运行 `node ace inspect:rcfile` 命令查看完整的文件内容。

```sh
node ace inspect:rcfile
```

你可以使用 `app` 服务访问解析后的 RCFile 内容。

```ts
import app from '@adonisjs/core/services/app'

console.log(app.rcFile)
```

## typescript

`typescript` 属性通知框架和 Ace 命令你的应用程序使用 TypeScript。目前，此值始终设置为 `true`。但是，我们稍后将允许使用 JavaScript 编写应用程序。

## directories

脚手架命令使用的一组目录及其路径。如果你决定重命名特定目录，请更新 `directories` 对象中的新路径以通知脚手架命令。

```ts
{
  directories: {
    config: 'config',
    commands: 'commands',
    contracts: 'contracts',
    public: 'public',
    providers: 'providers',
    languageFiles: 'resources/lang',
    migrations: 'database/migrations',
    seeders: 'database/seeders',
    factories: 'database/factories',
    views: 'resources/views',
    start: 'start',
    tmp: 'tmp',
    tests: 'tests',
    httpControllers: 'app/controllers',
    models: 'app/models',
    services: 'app/services',
    exceptions: 'app/exceptions',
    mails: 'app/mails',
    middleware: 'app/middleware',
    policies: 'app/policies',
    validators: 'app/validators',
    events: 'app/events',
    listeners: 'app/listeners',
    stubs: 'stubs',
  }
}
```

## preloads

在启动应用程序时导入的文件数组。这些文件在启动服务提供者后立即导入。

你可以定义导入文件的环境。有效选项包括：

- `web` 环境是指为 HTTP 服务器启动的进程。
- `console` 环境是指除 `repl` 命令以外的 Ace 命令。
- `repl` 环境是指使用 `node ace repl` 命令启动的进程。
- 最后，`test` 环境是指为运行测试启动的进程。


:::note

你可以使用 `node ace make:preload` 命令创建并注册 preload 文件。


:::


```ts
{
  preloads: [
    () => import('./start/view.js')
  ]
}
```

```ts
{
  preloads: [
    {
      file: () => import('./start/view.js'),
      environment: [
        'web',
        'console',
        'test'
      ]
    },
  ]
}
```

## metaFiles

`metaFiles` 数组是你希望在创建生产构建时复制到 `build` 文件夹的文件集合。

这些是非 TypeScript/JavaScript 文件，必须存在于生产构建中才能使你的应用程序正常工作。例如，Edge 模板、i18n 语言文件等。

- `pattern`: 查找匹配文件的 [glob 模式](https://github.com/sindresorhus/globby#globbing-patterns)。
- `reloadServer`: 当匹配文件更改时重新加载开发服务器。

```ts
{
  metaFiles: [
    {
      pattern: 'public/**',
      reloadServer: false
    },
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false
    }
  ]
}
```

## commands

用于从已安装的包延迟导入 ace 命令的函数数组。你的应用程序命令将自动导入，因此你无需显式注册它们。

另请参阅：[创建 ace 命令](../ace/creating_commands.md)

```ts
{
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands')
  ]
}
```

## commandsAliases

命令别名的键值对。这通常是为了帮助你为难以键入或记忆的命令创建好记的别名。

另请参阅：[创建命令别名](../ace/introduction.md#creating-command-aliases)

```ts
{
  commandsAliases: {
    migrate: 'migration:run'
  }
}
```

你还可以为同一命令定义多个别名。

```ts
{
  commandsAliases: {
    migrate: 'migration:run',
    up: 'migration:run'
  }
}
```

## tests

`tests` 对象注册测试套件和测试运行器的一些全局设置。

另请参阅：[测试简介](../testing/introduction.md)

```ts
{
  tests: {
    timeout: 2000,
    forceExit: false,
    suites: [
      {
        name: 'functional',
        files: [
          'tests/functional/**/*.spec.ts'
        ],
        timeout: 30000
      }
    ]
  }
}
```

- `timeout`: 定义所有测试的默认超时时间。
- `forceExit`: 测试完成后立即强制退出应用程序进程。通常，执行优雅退出是一个好习惯。
- `suite.name`: 测试套件的唯一名称。
- `suite.files`: 用于导入测试文件的 glob 模式数组。
- `suite.timeout`: 套件内所有测试的默认超时时间。

## providers

在应用程序启动阶段加载的服务提供者数组。

默认情况下，提供者在所有环境中加载。但是，你也可以定义显式的环境数组来导入提供者。

- `web` 环境是指为 HTTP 服务器启动的进程。
- `console` 环境是指除 `repl` 命令以外的 Ace 命令。
- `repl` 环境是指使用 `node ace repl` 命令启动的进程。
- 最后，`test` 环境是指为运行测试启动的进程。

:::note
提供者按照在 `providers` 数组中注册的顺序加载。
:::

另请参阅：[服务提供者](./service_providers.md)

```ts
{
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/http_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('./providers/app_provider.js'),
  ]
}
```

```ts
{
  providers: [
    {
      file: () => import('./providers/app_provider.js'),
      environment: [
        'web',
        'console',
        'test'
      ]
    },
    {
      file: () => import('@adonisjs/core/providers/http_provider'),
      environment: [
        'web'
      ]
    },
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/app_provider')
  ]
}
```

## assetsBundler

`serve` 和 `build` 命令尝试检测应用程序使用的资产捆绑器以编译前端资产。

通过搜索 `vite.config.js` 文件来检测 [vite](https://vitejs.dev)，通过搜索 `webpack.config.js` 文件来检测 [Webpack encore](https://github.com/symfony/webpack-encore)。

但是，如果你使用不同的资产捆绑器，可以在 `adonisrc.ts` 文件中按如下方式配置。

```ts
{
  assetsBundler: {
    name: 'vite',
    devServer: {
      command: 'vite',
      args: []
    },
    build: {
      command: 'vite',
      args: ["build"]
    },
  }
}
```

- `name` - 你使用的资产捆绑器的名称。它是显示目的所必需的。
- `devServer.*` - 启动开发服务器的命令及其参数。
- `build.*` - 创建生产构建的命令及其参数。
