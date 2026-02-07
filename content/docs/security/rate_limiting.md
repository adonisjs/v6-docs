---
summary: 使用 @adonisjs/limiter 软件包实施速率限制，保护您的 Web 应用程序或 API 服务器免受滥用。
---

# 速率限制 (Rate limiting)

AdonisJS 提供了一个官方软件包，用于在您的 Web 应用程序或 API 服务器中实施速率限制。速率限制器提供 `redis`、`mysql`、`postgresql`、`sqlite` 和 `memory` 作为存储选项，并能够[创建自定义存储提供程序](#creating-a-custom-storage-provider)。

`@adonisjs/limiter` 软件包构建在 [node-rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible) 软件包之上，该软件包提供了最快的速率限制 API 之一，并使用原子增量来避免竞争条件。

## 安装

使用以下命令安装并配置该软件包：

```sh
node ace add @adonisjs/limiter
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/limiter` 软件包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。
    ```ts
    {
      providers: [
        // ...其他提供者
        () => import('@adonisjs/limiter/limiter_provider')
      ]
    }
    ```

3. 创建 `config/limiter.ts` 文件。

4. 创建 `start/limiter.ts` 文件。此文件用于定义 HTTP 节流中间件。

5. 在 `start/env.ts` 文件中定义以下环境变量及其验证。
   ```ts
   LIMITER_STORE=redis
   ```

6. 如果使用 `database` 存储，可选择为 `rate_limits` 表创建数据库迁移。

:::

## 配置
速率限制器的配置存储在 `config/limiter.ts` 文件中。

另请参阅：[速率限制器配置存根](https://github.com/adonisjs/limiter/blob/2.x/stubs/config/limiter.stub)

```ts
import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),

  stores: {
    redis: stores.redis({}),

    database: stores.database({
      tableName: 'rate_limits'
    }),

    memory: stores.memory({}),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
```

<dl>

<dt>

default

</dt>

<dd>

用于应用速率限制的 `default` 存储。该存储在同一配置文件下的 `stores` 对象中定义。

</dd>

<dt>

stores

</dt>

<dd>

您计划在应用程序中使用的存储集合。我们建议始终配置 `memory` 存储，以便在测试期间使用。

</dd>

</dl>

---

### 环境变量
默认限制器使用 `LIMITER_STORE` 环境变量定义，因此，您可以在不同的环境中切换不同的存储。例如，在测试期间使用 `memory` 存储，在开发和生产环境中使用 `redis` 存储。

此外，必须验证环境变量以允许预配置的存储之一。验证在 `start/env.ts` 文件中使用 `Env.schema.enum` 规则定义。

```ts
{
  LIMITER_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),
}
```

### 共享选项
以下是所有捆绑存储共享的选项列表。

<dl>


<dt>

keyPrefix

</dt>

<dd>

定义存储在数据库存储中的键的前缀。数据库存储会忽略 `keyPrefix`，因为可以使用不同的数据库表来隔离数据。

</dd>

<dt>

execEvenly

</dt>

<dd>

`execEvenly` 选项在限制请求时添加延迟，以便所有请求在提供的持续时间结束时耗尽。

例如，如果您允许用户进行 **10 次请求/分钟**，所有请求将具有人为延迟，以便第 10 个请求在 1 分钟结束时完成。阅读 `rate-limiter-flexible` 仓库上的 [平滑流量峰值](https://github.com/animir/node-rate-limiter-flexible/wiki/Smooth-out-traffic-peaks) 文章以了解有关 `execEvenly` 选项的更多信息。

</dd>

<dt>

inMemoryBlockOnConsumed

</dt>

<dd>

定义在消耗完请求后应在内存中阻止键的请求数。例如，您允许用户进行 **10 次请求/分钟**，并且他们在前 10 秒内消耗了所有请求。

但是，他们继续向服务器发出请求，因此，速率限制器必须在拒绝请求之前检查数据库。

为了减少数据库的负载，您可以定义请求数，之后我们将停止查询数据库并在内存中阻止该键。

```ts
{
  duration: '1 minute',
  requests: 10,

  /**
   * 在 12 次请求后，在内存中阻止该键
   * 并停止咨询数据库。
   */
  inMemoryBlockOnConsumed: 12,
}
```

</dd>

<dt>

inMemoryBlockDuration

</dt>

<dd>

在内存中阻止键的持续时间。此选项将减少数据库的负载，因为后端存储将首先检查内存以查看键是否被阻止。

```ts
{
  inMemoryBlockDuration: '1 min'
}
```

</dd>

</dl>

---


### Redis 存储
`redis` 存储与 `@adonisjs/redis` 软件包具有对等依赖关系；因此，在使用 redis 存储之前，必须配置此软件包。

以下是 redis 存储接受的选项列表（以及共享选项）。

```ts
{
  redis: stores.redis({
    connectionName: 'main',
    rejectIfRedisNotReady: false,
  }),
}
```

<dl>

<dt>

connectionName

</dt>

<dd>

`connectionName` 属性引用 `config/redis.ts` 文件中定义的连接。我们建议为限制器使用单独的 redis 数据库。

</dd>

<dt>

rejectIfRedisNotReady

</dt>

<dd>

当 Redis 连接的状态不是 `ready` 时，拒绝速率限制请求。

</dd>

</dl>

---

### 数据库存储
`database` 存储与 `@adonisjs/lucid` 软件包具有对等依赖关系，因此，在使用数据库存储之前，必须配置此软件包。

以下是数据库存储接受的选项列表（以及共享选项）。

:::note

只有 MySQL、PostgreSQL 和 SQLite 数据库可以与数据库存储一起使用。

:::

```ts
{
  database: stores.database({
    connectionName: 'mysql',
    dbName: 'my_app',
    tableName: 'rate_limits',
    schemaName: 'public',
    clearExpiredByTimeout: false,
  }),
}
```

<dl>

<dt>

connectionName

</dt>

<dd>

引用 `config/database.ts` 文件中定义的数据库连接。如果未定义，我们将使用默认数据库连接。

</dd>

<dt>

dbName

</dt>

<dd>

用于进行 SQL 查询的数据库。我们尝试从 `config/database.ts` 文件中定义的连接配置推断 `dbName` 的值。但是，如果使用连接字符串，则必须通过此属性提供数据库名称。

</dd>

<dt>

tableName

</dt>

<dd>

用于存储速率限制的数据库表。

</dd>

<dt>

schemaName

</dt>

<dd>

用于进行 SQL 查询的模式（仅限 PostgreSQL）。

</dd>

<dt>

clearExpiredByTimeout

</dt>

<dd>

启用后，数据库存储将每 5 分钟清除一次过期键。请注意，只有过期超过 1 小时的键才会被清除。

</dd>

</dl>


## HTTP 请求节流
配置限制器后，您可以使用 `limiter.define` 方法创建 HTTP 节流中间件。`limiter` 服务是使用 `config/limiter.ts` 文件中定义的配置创建的 [LimiterManager](https://github.com/adonisjs/limiter/blob/2.x/src/limiter_manager.ts) 类的单例实例。

如果您打开 `start/limiter.ts` 文件，您将找到一个预定义的全局节流中间件，您可以将其应用于路由或路由组。同样，您可以在应用程序中根据需要创建任意数量的节流中间件。

在以下示例中，全局节流中间件允许用户根据其 IP 地址进行 **10 次请求/分钟**。

```ts
// title: start/limiter.ts
import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})
```

您可以按如下方式将 `throttle` 中间件应用于路由。

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'
// highlight-start
import { throttle } from '#start/limiter'
// highlight-end

router
  .get('/', () => {})
  // highlight-start
  .use(throttle)
  // highlight-end
```

### 动态速率限制

让我们创建另一个中间件来保护 API 端点。这次，我们将根据请求的身份验证状态应用动态速率限制。

```ts
// title: start/limiter.ts
export const apiThrottle = limiter.define('api', (ctx) => {
  /**
   * 允许已登录用户通过其用户 ID 进行 100 次请求
   */
  if (ctx.auth.user) {
    return limiter
      .allowRequests(100)
      .every('1 minute')
      .usingKey(`user_${ctx.auth.user.id}`)
  }

  /**
   * 允许访客用户通过 ip 地址进行 10 次请求
   */
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`)
})
```

```ts
// title: start/routes.ts
import { apiThrottle } from '#start/limiter'

router
  .get('/api/repos/:id/stats', [RepoStatusController])
  .use(apiThrottle)
```

### 切换后端存储
您可以使用 `store` 方法在节流中间件中使用特定的后端存储。例如：

```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  .store('redis')
  // highlight-end
```


### 使用自定义键
默认情况下，请求受用户 IP 地址的速率限制。但是，您可以使用 `usingKey` 方法指定自定义键。

```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  .usingKey(`user_${ctx.auth.user.id}`)
  // highlight-end
```

### 阻止用户
如果用户在耗尽配额后继续发出请求，您可以使用 `blockFor` 方法在指定的持续时间内阻止该用户。该方法接受秒数或时间表达式。

```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  /**
   * 如果他们在一分钟内发送超过 10 个请求，
   * 将被阻止 30 分钟
   */
  .blockFor('30 mins')
  // highlight-end
```

## 处理 ThrottleException
当用户在指定的时间范围内耗尽所有请求时，节流中间件会抛出 [E_TOO_MANY_REQUESTS](../references/exceptions.md#e_too_many_requests) 异常。该异常将使用以下内容协商规则自动转换为 HTTP 响应。

- 带有 `Accept=application/json` 头的 HTTP 请求将收到一个错误消息数组。每个数组元素将是一个具有 message 属性的对象。

- 带有 `Accept=application/vnd.api+json` 头的 HTTP 请求将收到按照 JSON API 规范格式化的错误消息数组。

- 所有其他请求将收到纯文本响应消息。但是，您可以使用[状态页](../basics/exception_handling.md#status-pages)为限制器错误显示自定义错误页面。

您也可以在[全局异常处理器](../basics/exception_handling.md#handling-exceptions)中自行处理错误。

```ts
import { errors } from '@adonisjs/limiter'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_TOO_MANY_REQUESTS) {
      const message = error.getResponseMessage(ctx)
      const headers = error.getDefaultHeaders()

      Object.keys(headers).forEach((header) => {
        ctx.response.header(header, headers[header])
      })

      return ctx.response.status(error.status).send(message)
    }
    // highlight-end

    return super.handle(error, ctx)
  }
}
```

### 自定义错误消息
您可以不全局处理异常，而是使用 `limitExceeded` 钩子自定义错误消息、状态和响应头。

```ts
import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    // highlight-start
    .limitExceeded((error) => {
      error
        .setStatus(400)
        .setMessage('Cannot process request. Try again later')
    })
    // highlight-end
})
```

### 对错误消息使用翻译
如果您已配置 [@adonisjs/i18n](../digging_deeper/i18n.md) 软件包，则可以使用 `errors.E_TOO_MANY_REQUESTS` 键定义错误消息的翻译。例如：

```json
// title: resources/lang/fr/errors.json
{
  "E_TOO_MANY_REQUESTS": "Trop de demandes"
}
```

最后，您可以使用 `error.t` 方法定义自定义翻译键。

```ts
limitExceeded((error) => {
  error.t('errors.rate_limited', {
    limit: error.response.limit,
    remaining: error.response.remaining,
  })
})
```

## 直接使用
除了限制 HTTP 请求外，您还可以使用限制器在应用程序的其他部分应用速率限制。例如，如果用户多次提供无效凭据，则在登录期间阻止用户。或者限制用户可以运行的并发作业数量。

### 创建限制器

在对操作应用速率限制之前，必须使用 `limiter.use` 方法获取 [Limiter](https://github.com/adonisjs/limiter/blob/2.x/src/limiter.ts) 类的实例。`use` 方法接受后端存储的名称和以下速率限制选项。

- `requests`: 在给定持续时间内允许的请求数。
- `duration`: 秒数或[时间表达式](../references/helpers.md#seconds)字符串。
- `block (optional)`: 耗尽所有请求后阻止键的持续时间。
- `inMemoryBlockOnConsumed (optional)`: 参见[共享选项](#shared-options)
- `inMemoryBlockDuration (optional)`: 参见[共享选项](#shared-options)

```ts
import limiter from '@adonisjs/limiter/services/main'

const reportsLimiter = limiter.use('redis', {
  requests: 1,
  duration: '1 hour'
})
```

如果要使用默认存储，请省略第一个参数。例如：

```ts
const reportsLimiter = limiter.use({
  requests: 1,
  duration: '1 hour'
})
```

### 对操作应用速率限制

创建限制器实例后，可以使用 `attempt` 方法对操作应用速率限制。
该方法接受以下参数。

- 用于速率限制的唯一键。
- 在所有尝试耗尽之前要执行的回调函数。

`attempt` 方法返回回调函数的结果（如果已执行）。否则，它返回 `undefined`。

```ts
const key = 'user_1_reports'

/**
 * 尝试为给定键运行操作。
 * 结果将是回调函数的返回值，
 * 或者如果未执行回调，则为 undefined。
 */
const executed = reportsLimiter.attempt(key, async () => {
  await generateReport()
  return true
})

/**
 * 通知用户他们已超出限制
 */
if (!executed) {
  const availableIn = await reportsLimiter.availableIn(key)
  return `Too many requests. Try after ${availableIn} seconds`
}

return 'Report generated'
```

### 防止过多的登录失败
直接使用的另一个示例是禁止 IP 地址在登录表单上进行多次无效尝试。

在以下示例中，我们使用 `limiter.penalize` 方法，只要用户提供无效凭据就消耗一个请求，并在所有尝试耗尽后将其阻止 20 分钟。

`limiter.penalize` 方法接受以下参数。

- 用于速率限制的唯一键。
- 要执行的回调函数。如果函数抛出错误，将消耗一个请求。

`penalize` 方法返回回调函数的结果或 `ThrottleException` 的实例。您可以使用该异常来查找直到下一次尝试的剩余持续时间。

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'

export default class SessionController {
  async store({ request, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'passwords'])

    /**
     * 创建限制器
     */
    const loginLimiter = limiter.use({
      requests: 5,
      duration: '1 min',
      blockDuration: '20 mins'
    })

    /**
     * 使用 IP 地址 + 电子邮件组合。这确保如果
     * 攻击者滥用电子邮件，我们不会阻止实际
     * 用户登录，而只惩罚攻击者
     * IP 地址。
     */
    const key = `login_${request.ip()}_${email}`

    /**
     * 将 User.verifyCredentials 包装在 "penalize" 方法中，
     * 以便我们为每个无效凭据错误消耗一个请求
     */
    const [error, user] = await loginLimiter.penalize(key, () => {
      return User.verifyCredentials(email, password)
    })

    /**
     * 在 ThrottleException 上，使用自定义错误消息重定向用户
     */
    if (error) {
      session.flashAll()
      session.flashErrors({
        E_TOO_MANY_REQUESTS: `Too many login requests. Try again after ${error.response.availableIn} seconds`
      })
      return response.redirect().back()
    }

    /**
     * 否则，登录用户
     */
  }
}
```

## 手动消耗请求
除了 `attempt` 和 `penalize` 方法外，您还可以直接与限制器交互以检查剩余请求并手动消耗它们。

在以下示例中，我们使用 `remaining` 方法检查给定键是否消耗了所有请求。否则，使用 `increment` 方法消耗一个请求。

```ts
import limiter from '@adonisjs/limiter/services/main'

const requestsLimiter = limiter.use({
  requests: 10,
  duration: '1 minute'
})

// highlight-start
if (await requestsLimiter.remaining('unique_key') > 0) {
  await requestsLimiter.increment('unique_key')
  await performAction()
} else {
  return 'Too many requests'
}
// highlight-end
```

在上面的示例中，您可能会在调用 `remaining` 和 `increment` 方法之间遇到竞争条件。因此，您可能希望改用 `consume` 方法。`consume` 方法将增加请求计数，并在所有请求都已消耗时抛出异常。

```ts
import { errors } from '@adonisjs/limiter'

try {
  await requestsLimiter.consume('unique_key')
  await performAction()
} catch (error) {
  if (error instanceof errors.E_TOO_MANY_REQUESTS) {
    return 'Too many requests'
  }
}
```

## 阻止键
除了消耗请求外，如果用户在耗尽所有尝试后继续发出请求，您还可以将键阻止更长时间。

当您使用 `blockDuration` 选项创建限制器实例时，`consume`、`attempt` 和 `penalize` 方法会自动执行阻止。例如：

```ts
import limiter from '@adonisjs/limiter/services/main'

const requestsLimiter = limiter.use({
  requests: 10,
  duration: '1 minute',
  // highlight-start
  blockDuration: '30 mins'
  // highlight-end
})

/**
 * 用户在一分钟内可以进行 10 次请求。但是，如果
 * 他们发送第 11 个请求，我们将把该键阻止 30 分钟。
 */
await requestLimiter.consume('a_unique_key')

/**
 * 与 consume 行为相同
 */
await requestLimiter.attempt('a_unique_key', () => {
})

/**
 * 允许 10 次失败，然后将该键阻止 30 分钟。
 */
await requestLimiter.penalize('a_unique_key', () => {
})
```

最后，您可以使用 `block` 方法将键阻止给定的持续时间。

```ts
const requestsLimiter = limiter.use({
  requests: 10,
  duration: '1 minute',
})

await requestsLimiter.block('a_unique_key', '30 mins')
```

## 重置尝试
您可以使用以下方法之一来减少请求数或从存储中删除整个键。

`decrement` 方法将请求计数减少 1，`delete` 方法删除键。请注意，`decrement` 方法不是原子的，当并发性过高时可能会将请求计数设置为 `-1`。

```ts
// title: Decrement requests count
import limiter from '@adonisjs/limiter/services/main'

const jobsLimiter = limiter.use({
  requests: 2,
  duration: '5 mins',
})

await jobsLimiter.attempt('unique_key', async () => {
  await processJob()

  /**
   * 完成作业处理后减少已消耗的请求。
   * 这将允许其他工作进程使用该插槽。
   */
  // highlight-start
  await jobsLimiter.decrement('unique_key')
  // highlight-end
})
```

```ts
// title: Delete key
import limiter from '@adonisjs/limiter/services/main'

const requestsLimiter = limiter.use({
  requests: 2,
  duration: '5 mins',
})

await requestsLimiter.delete('unique_key')
```

## 测试
如果您使用单个（即默认）存储进行速率限制，您可能希望在测试期间通过在 `.env.test` 文件中定义 `LIMITER_STORE` 环境变量来切换到 `memory` 存储。

```dotenv
// title: .env.test
LIMITER_STORE=memory
```

您可以使用 `limiter.clear` 方法在测试之间清除速率限制存储。`clear` 方法接受存储名称数组并刷新数据库。

使用 Redis 时，建议为速率限制器使用单独的数据库。否则，`clear` 方法将刷新整个 DB，这可能会影响应用程序的其他部分。

```ts
import limiter from '@adonisjs/limiter/services/main'

test.group('Reports', (group) => {
  // highlight-start
  group.each.setup(() => {
    return () => limiter.clear(['redis', 'memory'])
  })
  // highlight-end
})
```

或者，您可以不带任何参数调用 `clear` 方法，所有配置的存储都将被清除。

```ts
test.group('Reports', (group) => {
  group.each.setup(() => {
    // highlight-start
    return () => limiter.clear()
    // highlight-end
  })
})
```

## 创建自定义存储提供程序
自定义存储提供程序必须实现 [LimiterStoreContract](https://github.com/adonisjs/limiter/blob/2.x/src/types.ts#L163) 接口并定义以下属性/方法。

您可以在任何文件/文件夹中编写实现。不需要服务提供者来创建自定义存储。

```ts
import string from '@adonisjs/core/helpers/string'
import { LimiterResponse } from '@adonisjs/limiter'
import {
  LimiterStoreContract,
  LimiterConsumptionOptions
} from '@adonisjs/limiter/types'

/**
 * 您希望接受的一组自定义选项。
 */
export type MongoDbLimiterConfig = {
  client: MongoDBConnection
}

export class MongoDbLimiterStore implements LimiterStoreContract {
  readonly name = 'mongodb'
  declare readonly requests: number
  declare readonly duration: number
  declare readonly blockDuration: number

  constructor(public config: MongoDbLimiterConfig & LimiterConsumptionOptions) {
    this.request = this.config.requests
    this.duration = string.seconds.parse(this.config.duration)
    this.blockDuration = string.seconds.parse(this.config.blockDuration)
  }

  /**
   * 为给定键消耗一个请求。当所有请求都已
   * 消耗时，此方法应抛出错误。
   */
  async consume(key: string | number): Promise<LimiterResponse> {
  }

  /**
   * 为给定键消耗一个请求，但在所有请求都已消耗时
   * 不抛出错误。
   */
  async increment(key: string | number): Promise<LimiterResponse> {}

  /**
   * 奖励给定键一个请求。如果可能，不要将
   * 请求计数设置为负值。
   */
  async decrement(key: string | number): Promise<LimiterResponse> {}

  /**
   * 将键阻止指定的持续时间。
   */
  async block(
    key: string | number,
    duration: string | number
  ): Promise<LimiterResponse> {}

  /**
   * 设置给定键的已消耗请求数。如果没有提供
   * 显式持续时间，则应从配置推断持续时间。
   */
  async set(
    key: string | number,
    requests: number,
    duration?: string | number
  ): Promise<LimiterResponse> {}

  /**
   * 从存储中删除键
   */
  async delete(key: string | number): Promise<boolean> {}

  /**
   * 从数据库中刷新所有键
   */
  async clear(): Promise<void> {}

  /**
   * 获取给定键的限制器响应。如果键不存在，
   * 则返回 `null`。
   */
  async get(key: string | number): Promise<LimiterResponse | null> {}
}
```

### 定义配置助手

编写实现后，必须创建一个配置助手以在 `config/limiter.ts` 文件中使用提供程序。配置助手应返回一个 `LimiterManagerStoreFactory` 函数。

您可以在 `MongoDbLimiterStore` 实现的同一文件中编写以下函数。

```ts
import { LimiterManagerStoreFactory } from '@adonisjs/limiter/types'

/**
 * 用于在配置文件中使用 mongoDb 存储的配置助手
 */
export function mongoDbStore(config: MongoDbLimiterConfig) {
  const storeFactory: LimiterManagerStoreFactory = (runtimeOptions) => {
    return new MongoDbLimiterStore({
      ...config,
      ...runtimeOptions
    })
  }
}
```

### 使用配置助手

完成后，您可以按如下方式使用 `mongoDbStore` 助手。

```ts
// title: config/limiter.ts
import env from '#start/env'
// highlight-start
import { mongoDbStore } from 'my-custom-package'
// highlight-end
import { defineConfig } from '@adonisjs/limiter'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),

  stores: {
    // highlight-start
    mongodb: mongoDbStore({
      client: mongoDb // create mongoDb client
    })
    // highlight-end
  },
})
```

### 包装 rate-limiter-flexible 驱动程序
如果您计划包装 [node-rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible?tab=readme-ov-file#docs-and-examples) 软件包中的现有驱动程序，则可以使用 [RateLimiterBridge](https://github.com/adonisjs/limiter/blob/2.x/src/stores/bridge.ts) 进行实现。

这次让我们使用桥重新实现相同的 `MongoDbLimiterStore`。

```ts
import { RateLimiterBridge } from '@adonisjs/limiter'
import { RateLimiterMongo } from 'rate-limiter-flexible'

export class MongoDbLimiterStore extends RateLimiterBridge {
  readonly name = 'mongodb'

  constructor(public config: MongoDbLimiterConfig & LimiterConsumptionOptions) {
    super(
      new RateLimiterMongo({
        storeClient: config.client,
        points: config.requests,
        duration: string.seconds.parse(config.duration),
        blockDuration: string.seconds.parse(this.config.blockDuration)
        // ... provide other options as well
      })
    )
  }

  /**
   * 自行实现 clear 方法。理想情况下，使用
   * config.client 发出删除查询
   */
  async clear() {}
}
```
