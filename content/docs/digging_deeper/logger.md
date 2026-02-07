---
summary: 了解如何使用 AdonisJS 日志记录器将日志写入控制台、文件和外部服务。基于 Pino 构建，该日志记录器速度快并支持多个目标。
---

# 日志记录器 (Logger)

AdonisJS 拥有一个内置的日志记录器，支持将日志写入**文件**、**标准输出**和**外部日志服务**。在底层，我们使用 [pino](https://getpino.io/#/)。Pino 是 Node.js 生态系统中最快的日志库之一，它生成 [NDJSON 格式](https://github.com/ndjson/ndjson-spec) 的日志。

## 用法

首先，你可以导入 Logger 服务，以便从应用程序的任何位置写入日志。日志将写入 `stdout` 并显示在终端上。

```ts
import logger from '@adonisjs/core/services/logger'

logger.info('this is an info message')
logger.error({ err: error }, 'Something went wrong')
```

建议在 HTTP 请求期间使用 `ctx.logger` 属性。HTTP 上下文包含一个请求感知的日志记录器实例，它会将当前请求 ID 添加到每一条日志语句中。

```ts
import router from '@adonisjs/core/services/router'
import User from '#models/user'

router.get('/users/:id', async ({ logger, params }) => {
  logger.info('Fetching user by id %s', params.id)
  const user = await User.find(params.id)
})
```

## 配置

日志记录器的配置存储在 `config/logger.ts` 文件中。默认情况下，只配置了一个日志记录器。但是，如果你想在应用程序中使用多个日志记录器，你可以为它们定义配置。

```ts
// title: config/logger.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/core/logger'

export default defineConfig({
  default: 'app',
  
  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL', 'info')
    },
  }
})
```

<dl>
<dt>

default

<dt>

<dd>

`default` 属性是对同一文件中 `loggers` 对象下配置的日志记录器之一的引用。

除非你在使用日志 API 时选择了特定的日志记录器，否则将使用默认日志记录器写入日志。

</dd>

<dt>

loggers

<dt>

<dd>

`loggers` 对象是用于配置多个日志记录器的键值对。键是日志记录器的名称，值是 [pino](https://getpino.io/#/docs/api?id=options) 接受的配置对象。

</dd>
</dl>

## 传输目标 (Transport targets)

Pino 中的传输 (Transports) 扮演着至关重要的角色，因为它们将日志写入目的地。你可以在配置文件中配置 [多个目标](https://getpino.io/#/docs/api?id=transport-object)，Pino 将把日志投递给所有这些目标。每个目标还可以指定它希望接收的日志级别。

:::note

如果你没有在目标配置中定义 `level`，配置的目标将从父日志记录器继承它。

这种行为与 Pino 不同。在 Pino 中，目标不会从父日志记录器继承级别。

:::

```ts
{
  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL', 'info'),
      
      // highlight-start
      transport: {
        targets: [
          {
            target: 'pino/file',
            level: 'info',
            options: {
              destination: 1
            }
          },
          {
            target: 'pino-pretty',
            level: 'info',
            options: {}
          },
        ]
      }
      // highlight-end
    }
  }
}
```

<dl>
<dt>

File target (文件目标)

<dt>

<dd>

`pino/file` 目标将日志写入文件描述符。`destination = 1` 意味着将日志写入 `stdout` (这是 [文件描述符的标准 Unix 约定](https://en.wikipedia.org/wiki/File_descriptor))。

</dd>

<dt>

Pretty target (美化目标)

<dt>

<dd>

`pino-pretty` 目标使用 [pino-pretty npm 模块](http://npmjs.com/package/pino-pretty) 将日志美化输出到文件描述符。

</dd>
</dl>

## 条件性定义目标

根据代码运行的环境注册目标是很常见的。例如，在开发环境中使用 `pino-pretty` 目标，而在生产环境中使用 `pino/file` 目标。

如下所示，使用条件构造 `targets` 数组会使配置文件看起来不整洁。

```ts
import app from '@adonisjs/core/services/app'

loggers: {
  app: {
    transport: {
      targets: [
        ...(!app.inProduction
          ? [{ target: 'pino-pretty', level: 'info' }]
          : []
        ),
        ...(app.inProduction
          ? [{ target: 'pino/file', level: 'info' }]
          : []
        ),
      ]
    }
  } 
}
```

因此，你可以使用 `targets` 助手通过流畅的 API 定义条件数组项。我们在下面的示例中使用 `targets.pushIf` 方法表达相同的条件。

```ts
import { targets, defineConfig } from '@adonisjs/core/logger'

loggers: {
  app: {
    transport: {
      targets: targets()
       .pushIf(
         !app.inProduction,
         { target: 'pino-pretty', level: 'info' }
       )
       .pushIf(
         app.inProduction,
         { target: 'pino/file', level: 'info' }
       )
       .toArray()
    }
  } 
}
```

为了进一步简化代码，你可以使用 `targets.pretty` 和 `targets.file` 方法为 `pino/file` 和 `pino-pretty` 目标定义配置对象。

```ts
import { targets, defineConfig } from '@adonisjs/core/logger'

loggers: {
  app: {
    transport: {
      targets: targets()
       .pushIf(app.inDev, targets.pretty())
       .pushIf(app.inProduction, targets.file())
       .toArray()
    }
  }
}
```

## 使用多个日志记录器

AdonisJS 对配置多个日志记录器提供了一流的支持。日志记录器的唯一名称和配置定义在 `config/logger.ts` 文件中。

```ts
export default defineConfig({
  default: 'app',
  
  loggers: {
    // highlight-start
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL', 'info')
    },
    payments: {
      enabled: true,
      name: 'payments',
      level: env.get('LOG_LEVEL', 'info')
    },
    // highlight-start
  }
})
```

配置完成后，你可以使用 `logger.use` 方法访问命名日志记录器。

```ts
import logger from '@adonisjs/core/services/logger'

logger.use('payments')
logger.use('app')

// 获取默认日志记录器的实例
logger.use()
```

## 依赖注入

当使用依赖注入时，你可以对 `Logger` 类进行类型提示作为依赖项，IoC 容器将解析配置文件中定义的默认日志记录器的实例。

如果该类是在 HTTP 请求期间构造的，那么容器将注入请求感知的 Logger 实例。

```ts
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

// highlight-start
@inject()
// highlight-end
class UserService {
  // highlight-start
  constructor(protected logger: Logger) {}
  // highlight-end

  async find(userId: string | number) {
    this.logger.info('Fetching user by id %s', userId)
    const user = await User.find(userId)
  }
}
```

## 日志记录方法

Logger API 与 Pino 几乎完全相同，除了 AdonisJS 日志记录器不是 Event emitter 的实例（而 Pino 是）。除此之外，日志记录方法与 Pino 具有相同的 API。

```ts
import logger from '@adonisjs/core/services/logger'

logger.trace(config, 'using config')
logger.debug('user details: %o', { username: 'virk' })
logger.info('hello %s', 'world')
logger.warn('Unable to connect to database')
logger.error({ err: Error }, 'Something went wrong')
logger.fatal({ err: Error }, 'Something went wrong')
```

可以将额外的合并对象作为第一个参数传递。然后，该对象属性将添加到输出 JSON 中。

```ts
logger.info({ user: user }, 'Fetched user by id %s', user.id)
```

要显示错误，你可以 [使用 `err` 键](https://getpino.io/#/docs/api?id=serializers-object) 来指定错误值。

```ts
logger.error({ err: error }, 'Unable to lookup user')
```

## 条件性记录日志

日志记录器生成配置在配置文件中的级别及以上级别的日志。例如，如果级别设置为 `warn`，则 `info`、`debug` 和 `trace` 级别的日志将被忽略。

如果计算日志消息的数据很昂贵，你应该在计算数据之前检查给定的日志级别是否已启用。

```ts
import logger from '@adonisjs/core/services/logger'

if (logger.isLevelEnabled('debug')) {
  const data = await getLogData()
  logger.debug(data, 'Debug message')
}
```

你可以使用 `ifLevelEnabled` 方法表达相同的条件。该方法接受一个回调作为第二个参数，当指定的日志级别启用时执行该回调。

```ts
logger.ifLevelEnabled('debug', async () => {
  const data = await getLogData()
  logger.debug(data, 'Debug message')
})
```

## 子日志记录器 (Child logger)

子日志记录器是一个隔离的实例，它继承父日志记录器的配置和绑定。

可以使用 `logger.child` 方法创建子日志记录器的实例。该方法接受绑定作为第一个参数，可选的配置对象作为第二个参数。

```ts
import logger from '@adonisjs/core/services/logger'

const requestLogger = logger.child({ requestId: ctx.request.id() })
```

子日志记录器也可以在不同的日志级别下记录日志。

```ts
logger.child({}, { level: 'warn' })
```

## Pino 静态属性

`@adonisjs/core/logger` 模块导出了 [Pino 静态](https://getpino.io/#/docs/api?id=statics) 方法和属性。

```ts
import { 
  multistream,
  destination,
  transport,
  stdSerializers,
  stdTimeFunctions,
  symbols,
  pinoVersion
} from '@adonisjs/core/logger'
```

## 将日志写入文件

Pino 自带了一个 `pino/file` 目标，你可以用它来将日志写入文件。在目标选项中，你可以指定日志文件的目标路径。

```ts
app: {
  enabled: true,
  name: env.get('APP_NAME'),
  level: env.get('LOG_LEVEL', 'info')

  transport: {
    targets: targets()
      .push({
         transport: 'pino/file',
         level: 'info',
         options: {
           destination: '/var/log/apps/adonisjs.log'
         }
      })
      .toArray()
  }
}
```

### 日志轮转 (File rotation)

Pino 没有内置的文件轮转支持，因此，你要么必须使用像 [logrotate](https://getpino.io/#/docs/help?id=rotate) 这样的系统级工具，要么使用像 [pino-roll](https://github.com/feugy/pino-roll) 这样的第三方包。

```sh
npm i pino-roll
```

```ts
app: {
  enabled: true,
  name: env.get('APP_NAME'),
  level: env.get('LOG_LEVEL', 'info')

  transport: {
    targets: targets()
      // highlight-start
      .push({
        target: 'pino-roll',
        level: 'info',
        options: {
          file: '/var/log/apps/adonisjs.log',
          frequency: 'daily',
          mkdir: true
        }
      })
      // highlight-end
     .toArray()
  }
}
```

## 隐藏敏感值 (数据脱敏)

日志可能成为泄露敏感数据的源头。因此，建议观察你的日志并从输出中移除/隐藏敏感值。

在 Pino 中，你可以使用 `redact` 选项来隐藏/移除日志中的敏感键值对。在底层，使用了 [fast-redact](https://github.com/davidmarkclements/fast-redact) 包，你可以查阅其文档以查看可用的表达式。

```ts
// title: config/logger.ts
app: {
  enabled: true,
  name: env.get('APP_NAME'),
  level: env.get('LOG_LEVEL', 'info')

  // highlight-start
  redact: {
    paths: ['password', '*.password']
  }
  // highlight-end
}
```

```ts
import logger from '@adonisjs/core/services/logger'

const username = request.input('username')
const password = request.input('password')

logger.info({ username, password }, 'user signup')
// output: {"username":"virk","password":"[Redacted]","msg":"user signup"}
```

默认情况下，该值会被替换为 `[Redacted]` 占位符。你可以定义自定义占位符或移除键值对。

```ts
redact: {
  paths: ['password', '*.password'],
  censor: '[PRIVATE]'
}

// Remove property
redact: {
  paths: ['password', '*.password'],
  remove: true
}
```

### 使用 Secret 数据类型

脱敏的另一种替代方法是将敏感值包装在 Secret 类中。例如：

另请参阅：[Secret 类使用文档](../references/helpers.md#secret)

```ts
import { Secret } from '@adonisjs/core/helpers'

const username = request.input('username')
// delete-start
const password = request.input('password')
// delete-end
// insert-start
const password = new Secret(request.input('password'))
// insert-end

logger.info({ username, password }, 'user signup')
// output: {"username":"virk","password":"[redacted]","msg":"user signup"}
```
