---
summary: 了解 Application 类，以及如何访问环境、状态，并生成项目文件的 URL 和路径。
---

# 应用 (Application)

[Application](https://github.com/adonisjs/application/blob/main/src/application.ts) 类负责将 AdonisJS 应用程序的各个部分连接在一起。你可以使用此类来了解应用程序运行的环境、获取应用程序的当前状态，或生成指向特定目录的路径。

另请参阅：[应用程序生命周期](./application_lifecycle.md)

## 环境

环境是指应用程序的运行环境。应用程序总是在以下已知环境之一中启动。

- `web` 环境是指为 HTTP 服务器启动的进程。

- `console` 环境是指除 REPL 命令之外的 Ace 命令。

- `repl` 环境是指使用 `node ace repl` 命令启动的进程。

- 最后，`test` 环境是指使用 `node ace test` 命令启动的进程。

你可以使用 `getEnvironment` 方法访问应用程序环境。

```ts
import app from '@adonisjs/core/services/app'

console.log(app.getEnvironment())
```

你也可以在应用程序启动之前切换应用程序环境。REPL 命令就是一个很好的例子。

`node ace repl` 命令在 `console` 环境中启动应用程序，但该命令在内部会在显示 REPL 提示符之前将环境切换到 `repl`。

```ts
if (!app.isBooted) {
	app.setEnvironment('repl')
}
```

## Node 环境

你可以使用 `nodeEnvironment` 属性访问 Node.js 环境。该值是对 `NODE_ENV` 环境变量的引用。但是，该值经过进一步规范化以保持一致。

```ts
import app from '@adonisjs/core/services/app'

console.log(app.nodeEnvironment)
```

| NODE_ENV | 规范化为 |
|----------|---------------|
| dev      | development   |
| develop  | development   |
| stage    | staging       |
| prod     | production    |
| testing  | test          |

此外，你可以使用以下属性作为简写来了解当前环境。

- `inProduction`: 检查应用程序是否在生产环境中运行。
- `inDev`: 检查应用程序是否在开发环境中运行。
- `inTest`: 检查应用程序是否在测试环境中运行。

```ts
import app from '@adonisjs/core/services/app'

// 是否在生产环境
app.inProduction
app.nodeEnvironment === 'production'

// 是否在开发环境
app.inDev
app.nodeEnvironment === 'development'

// 是否在测试环境
app.inTest
app.nodeEnvironment === 'test'
```

## 状态

状态是指应用程序的当前状态。你可以访问的框架功能很大程度上取决于应用程序的当前状态。例如，在应用程序处于 `booted` 状态之前，你无法访问 [容器绑定](./dependency_injection.md#container-bindings) 或 [容器服务](./container_services.md)。

应用程序总是处于以下已知状态之一。

- `created`: 这是应用程序的默认状态。

- `initiated`: 在此状态下，我们解析/验证环境变量并处理 `adonisrc.ts` 文件。

- `booted`: 应用程序服务提供者在此状态下被注册并启动。

- `ready`: ready 状态在不同环境之间有所不同。例如，在 `web` 环境中，ready 状态意味着应用程序已准备好接受新的 HTTP 请求。

- `terminated`: 应用程序已终止，进程将很快退出。在 `web` 环境中，应用程序将不再接受新的 HTTP 请求。

```ts
import app from '@adonisjs/core/services/app'

console.log(app.getState())
```

你也可以使用以下简写属性来了解应用程序是否处于给定状态。

```ts
import app from '@adonisjs/core/services/app'

// 应用已启动
app.isBooted
app.getState() !== 'created' && app.getState() !== 'initiated'

// 应用已就绪
app.isReady
app.getState() === 'ready'

// 正在尝试优雅地终止应用
app.isTerminating

// 应用已终止
app.isTerminated
app.getState() === 'terminated'
```

## 监听进程信号

你可以使用 `app.listen` 或 `app.listenOnce` 方法监听 [POSIX 信号](https://man7.org/linux/man-pages/man7/signal.7.html)。在底层，我们向 Node.js `process` 对象注册监听器。

```ts
import app from '@adonisjs/core/services/app'

// 监听 SIGTERM 信号
app.listen('SIGTERM', () => {
})

// 监听一次 SIGTERM 信号
app.listenOnce('SIGTERM', () => {
})
```

有时，你可能希望有条件地注册监听器。例如，在 pm2 环境中运行时监听 `SIGINT` 信号。

你可以使用 `listenIf` 或 `listenOnceIf` 方法有条件地注册监听器。只有当第一个参数的值为真时，才会注册监听器。

```ts
import app from '@adonisjs/core/services/app'

app.listenIf(app.managedByPm2, 'SIGTERM', () => {
})

app.listenOnceIf(app.managedByPm2, 'SIGTERM', () => {
})
```

## 通知父进程

如果你的应用程序作为子进程启动，你可以使用 `app.notify` 方法向父进程发送消息。在底层，我们使用 `process.send` 方法。

```ts
import app from '@adonisjs/core/services/app'

app.notify('ready')

app.notify({
  isReady: true,
  port: 3333,
  host: 'localhost'
})
```

## 生成 URL 和项目文件路径

我们要强烈建议使用以下辅助函数，而不是自行构建绝对 URL 或项目文件路径。

### makeURL

make URL 方法返回项目根目录内给定文件或目录的文件 URL。例如，你可以在导入文件时生成 URL。

```ts
import app from '@adonisjs/core/services/app'

const files = [
  './tests/welcome.spec.ts',
  './tests/maths.spec.ts'
]

await Promise.all(files.map((file) => {
  return import(app.makeURL(file).href)
}))
```

### makePath

`makePath` 方法返回项目根目录内给定文件或目录的绝对路径。

```ts
import app from '@adonisjs/core/services/app'

app.makePath('app/middleware/auth.ts')
```

### configPath

返回项目 config 目录内文件的路径。

```ts
app.configPath('shield.ts')
// /project_root/config/shield.ts

app.configPath()
// /project_root/config
```

### publicPath

返回项目 public 目录内文件的路径。

```ts
app.publicPath('style.css')
// /project_root/public/style.css

app.publicPath()
// /project_root/public
```

### providersPath

返回 provider 目录内文件的路径。

```ts
app.providersPath('app_provider')
// /project_root/providers/app_provider.ts

app.providersPath()
// /project_root/providers
```

### factoriesPath

返回数据库 factories 目录内文件的路径。

```ts
app.factoriesPath('user.ts')
// /project_root/database/factories/user.ts

app.factoriesPath()
// /project_root/database/factories
```

### migrationsPath

返回数据库 migrations 目录内文件的路径。

```ts
app.migrationsPath('user.ts')
// /project_root/database/migrations/user.ts

app.migrationsPath()
// /project_root/database/migrations
```

### seedersPath

返回数据库 seeders 目录内文件的路径。

```ts
app.seedersPath('user.ts')
// /project_root/database/seeders/users.ts

app.seedersPath()
// /project_root/database/seeders
```

### languageFilesPath

返回 languages 目录内文件的路径。

```ts
app.languageFilesPath('en/messages.json')
// /project_root/resources/lang/en/messages.json

app.languageFilesPath()
// /project_root/resources/lang
```

### viewsPath

返回 views 目录内文件的路径。

```ts
app.viewsPath('welcome.edge')
// /project_root/resources/views/welcome.edge

app.viewsPath()
// /project_root/resources/views
```

### startPath

返回 start 目录内文件的路径。

```ts
app.startPath('routes.ts')
// /project_root/start/routes.ts

app.startPath()
// /project_root/start
```

### tmpPath

返回项目根目录内 `tmp` 目录中文件的路径。

```ts
app.tmpPath('logs/mail.txt')
// /project_root/tmp/logs/mail.txt

app.tmpPath()
// /project_root/tmp
```

### httpControllersPath

返回 HTTP controllers 目录内文件的路径。

```ts
app.httpControllersPath('users_controller.ts')
// /project_root/app/controllers/users_controller.ts

app.httpControllersPath()
// /project_root/app/controllers
```

### modelsPath

返回 model 目录内文件的路径。

```ts
app.modelsPath('user.ts')
// /project_root/app/models/user.ts

app.modelsPath()
// /project_root/app/models
```

### servicesPath

返回 services 目录内文件的路径。

```ts
app.servicesPath('user.ts')
// /project_root/app/services/user.ts

app.servicesPath()
// /project_root/app/services
```

### exceptionsPath

返回 exceptions 目录内文件的路径。

```ts
app.exceptionsPath('handler.ts')
// /project_root/app/exceptions/handler.ts

app.exceptionsPath()
// /project_root/app/exceptions
```

### mailsPath

返回 mails 目录内文件的路径。

```ts
app.mailsPath('verify_email.ts')
// /project_root/app/mails/verify_email.ts

app.mailsPath()
// /project_root/app/mails
```

### middlewarePath

返回 middleware 目录内文件的路径。

```ts
app.middlewarePath('auth.ts')
// /project_root/app/middleware/auth.ts

app.middlewarePath()
// /project_root/app/middleware
```

### policiesPath

返回 policies 目录内文件的路径。

```ts
app.policiesPath('posts.ts')
// /project_root/app/polices/posts.ts

app.policiesPath()
// /project_root/app/polices
```

### validatorsPath

返回 validators 目录内文件的路径。

```ts
app.validatorsPath('create_user.ts')
// /project_root/app/validators/create_user.ts

app.validatorsPath()
// /project_root/app/validators/create_user.ts
```

### commandsPath

返回 commands 目录内文件的路径。

```ts
app.commandsPath('greet.ts')
// /project_root/commands/greet.ts

app.commandsPath()
// /project_root/commands
```

### eventsPath

返回 events 目录内文件的路径。

```ts
app.eventsPath('user_created.ts')
// /project_root/app/events/user_created.ts

app.eventsPath()
// /project_root/app/events
```

### listenersPath

返回 listeners 目录内文件的路径。

```ts
app.listenersPath('send_invoice.ts')
// /project_root/app/listeners/send_invoice.ts

app.listenersPath()
// /project_root/app/listeners
```

## 生成器

生成器用于为不同的实体创建类名和文件名。例如，你可以使用 `generators.controllerFileName` 方法生成控制器的文件名。

```ts
import app from '@adonisjs/core/services/app'

app.generators.controllerFileName('user')
// 输出 - users_controller.ts

app.generators.controllerName('user')
// 输出 - UsersController
```

请 [参考 `generators.ts` 源代码](https://github.com/adonisjs/application/blob/main/src/generators.ts) 查看可用生成器的列表。
