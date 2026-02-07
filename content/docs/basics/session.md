---
summary: 使用 @adonisjs/session 包在 AdonisJS 应用程序中管理用户会话。
---

# 会话 (Session)

你可以使用 `@adonisjs/session` 包在 AdonisJS 应用程序中管理用户会话。会话包提供了一个统一的 API，用于跨不同的存储提供程序存储会话数据。

**以下是捆绑存储的列表。**

- `cookie`: 会话数据存储在加密的 cookie 中。Cookie 存储非常适合多服务器部署，因为数据存储在客户端。

- `file`: 会话数据保存在服务器上的文件中。如果使用负载均衡器实现粘性会话 (sticky sessions)，文件存储才能扩展到多服务器部署。

- `redis`: 会话数据存储在 Redis 数据库中。建议将 Redis 存储用于具有大量会话数据的应用程序，并且可以扩展到多服务器部署。

- `dynamodb`: 会话数据存储在 Amazon DynamoDB 表中。DynamoDB 存储适用于需要高度可扩展和分布式会话存储的应用程序，尤其是在基础架构构建在 AWS 上时。

- `database`: 会话数据使用 Lucid 存储在 SQL 数据库中。如果你已经在应用程序中使用 SQL 数据库，并且希望避免添加像 Redis 这样的额外依赖项，那么数据库存储是一个不错的选择。

- `memory`: 会话数据存储在全局内存存储中。内存存储用于测试期间。

除了内置的后端存储外，你还可以创建和 [注册自定义会话存储](#creating-a-custom-session-store)。

## 安装

使用以下命令安装并配置该包：

```sh
node ace add @adonisjs/session
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/session` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者和命令。

    ```ts
    {
      commands: [
        // ...other commands
        () => import('@adonisjs/session/commands')
      ],
      providers: [
        // ...other providers
        () => import('@adonisjs/session/session_provider')
      ]
    }
    ```

3. 创建 `config/session.ts` 文件。

4. 定义以下环境变量及其验证。

    ```dotenv
    SESSION_DRIVER=cookie
    ```

5. 在 `start/kernel.ts` 文件中注册以下中间件。

    ```ts
    router.use([
      () => import('@adonisjs/session/session_middleware')
    ])
    ```

:::

## 配置

会话包的配置存储在 `config/session.ts` 文件中。

另请参阅：[Session config stub](https://github.com/adonisjs/session/blob/main/stubs/config/session.stub)

```ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  age: '2h',
  enabled: true,
  cookieName: 'adonis-session',
  clearWithBrowser: false,

  cookie: {
    path: '/',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },

  store: env.get('SESSION_DRIVER'),
  stores: {
    cookie: stores.cookie(),
  }
})
```

<dl>

<dt>

  enabled

</dt>

<dd>

临时启用或禁用中间件，而不将其从中间件堆栈中移除。

</dd>


<dt>

  cookieName

</dt>

<dd>

cookie 名称用于存储会话 ID。随意重命名它。

</dd>

<dt>

  clearWithBrowser

</dt>

<dd>

当设置为 true 时，用户关闭浏览器窗口后，会话 ID cookie 将被删除。此 cookie 在技术上称为 [会话 cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_the_lifetime_of_a_cookie)。

</dd>

<dt>

  age

</dt>

<dd>

`age` 属性控制没有用户活动时的会话数据有效期。在给定的持续时间之后，会话数据被视为过期。

</dd>

<dt>

  cookie

</dt>

<dd>

控制会话 ID cookie 属性。另请参阅 [cookie 配置](./cookies.md#configuration)。

</dd>

<dt>

store

</dt>

<dd>

定义要用于存储会话数据的存储。它可以是固定值，也可以从环境变量中读取。

</dd>

<dt>

  stores

</dt>

<dd>

`stores` 对象用于配置一个或多个后端存储。

大多数应用程序将使用单个存储。但是，你可以配置多个存储，并根据应用程序运行的环境在它们之间切换。

</dd>

</dl>

---

### 存储配置

以下是 `@adonisjs/session` 包捆绑的后端存储列表。

```ts
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  store: env.get('SESSION_DRIVER'),

  // highlight-start
  stores: {
    cookie: stores.cookie(),

    file: stores.file({
      location: app.tmpPath('sessions')
    }),

    redis: stores.redis({
      connection: 'main'
    })

    dynamodb: stores.dynamodb({
      clientConfig: {}
    }),

    database: stores.database({
      connectionName: 'postgres',
      tableName: 'sessions',
    }),
  }
  // highlight-end
})
```

<dl>

<dt>

  stores.cookie

</dt>

<dd>

`cookie` 存储加密并将会话数据存储在 cookie 中。

</dd>


<dt>

  stores.file

</dt>

<dd>

定义 `file` 存储的配置。该方法接受用于存储会话文件的 `location` 路径。

</dd>


<dt>

  stores.redis

</dt>

<dd>

定义 `redis` 存储的配置。该方法接受用于存储会话数据的 `connection` 名称。

在使用 `redis` 存储之前，请确保先安装并配置 [@adonisjs/redis](../database/redis.md) 包。

</dd>

<dt>

  stores.dynamodb

</dt>

<dd>

定义 `dynamodb` 存储的配置。你可以通过 `clientConfig` 属性传递 [DynamoDB config](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-dynamodb/Interface/DynamoDBClientConfig/)，或者将 DynamoDB 实例作为 `client` 属性传递。

```ts
// title: With client config
stores.dynamodb({
  clientConfig: {
    region: 'us-east-1',
    endpoint: '<database-endpoint>',
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    }
  },
})
```

```ts
// title: With client instance
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
const client = new DynamoDBClient({})

stores.dynamodb({
  client,
})
```

此外，你可以定义自定义表名和键属性名。

```ts
stores.dynamodb({
  tableName: 'Session'
  keyAttribute: 'key'
})
```

</dd>

<dt>

  stores.database

</dt>

<dd>

定义 `database` 存储的配置。该方法可选地接受要使用的 `connectionName` 和用于存储会话数据的 `tableName`。

在使用 `database` 存储之前，请确保先安装并配置 [@adonisjs/lucid](../database/lucid.md) 包。

你还必须在数据库中创建 sessions 表。你可以使用以下命令创建迁移文件。

```sh
node ace make:session-table
```

```ts
stores.database({
  connectionName: 'postgres',
  tableName: 'sessions',
  gcProbability: 2,
})
```

与自动处理过期的 Redis 不同，SQL 数据库需要手动清理过期会话。数据库存储实现了概率垃圾回收：在每个请求上，有 `gcProbability` 百分比的机会（默认值：**2%**）将从数据库中删除过期会话。

将 `gcProbability` 设置为 `0` 以完全禁用自动垃圾回收。在这种情况下，你应该设置一个计划任务来定期清理过期会话。

#### 向现有数据库添加标记支持

如果你有一个现有的 sessions 表并希望使用 [会话标记](#session-tagging)，你需要添加 `user_id` 列。创建一个新的迁移：

```sh
node ace make:migration add_user_id_to_sessions
```

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sessions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('user_id').nullable().index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('user_id')
    })
  }
}
```

</dd>

</dl>

---

### 更新环境变量验证

如果你决定使用默认存储以外的会话存储，请确保还要更新 `SESSION_DRIVER` 环境变量的环境变量验证。

我们在以下示例中配置了 `cookie`、`redis` 和 `dynamodb` 存储。因此，我们还应该允许 `SESSION_DRIVER` 环境变量为其中之一。

```ts
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  // highlight-start
  store: env.get('SESSION_DRIVER'),

  stores: {
    cookie: stores.cookie(),
    redis: stores.redis({
      connection: 'main'
    })
  }
  // highlight-end
})
```

```ts
// title: start/env.ts
{
  SESSION_DRIVER: Env.schema.enum(['cookie', 'redis', 'memory'] as const)
}
```

## 基本示例

一旦会话包被注册，你就可以从 [HTTP 上下文](../concepts/http_context.md) 访问 `session` 属性。会话属性公开了用于向会话存储读取和写入数据的 API。

```ts
import router from '@adonisjs/core/services/router'

router.get('/theme/:color', async ({ params, session, response }) => {
  // highlight-start
  session.put('theme', params.color)
  // highlight-end
  response.redirect('/')
})

router.get('/', async ({ session }) => {
  // highlight-start
  const colorTheme = session.get('theme')
  // highlight-end
  return `You are using ${colorTheme} color theme`
})
```

会话数据在请求开始时从会话存储中读取，并在结束时写回存储。因此，所有更改都保留在内存中，直到请求完成。

## 支持的数据类型

会话数据使用 `JSON.stringify` 序列化为字符串；因此，你可以使用以下 JavaScript 数据类型作为会话值。

- string
- number
- bigInt
- boolean
- null
- object
- array

```ts
// Object
session.put('user', {
  id: 1,
  fullName: 'virk',
})

// Array
session.put('product_ids', [1, 2, 3, 4])

// Boolean
session.put('is_logged_in', true)

// Number
session.put('visits', 10)

// BigInt
session.put('visits', BigInt(10))

// Data objects are converted to ISO string
session.put('visited_at', new Date())
```

## 读取和写入数据

以下是可用于与 `session` 对象数据交互的方法列表。

### get

从存储中返回键的值。你可以使用点符号读取嵌套值。

```ts
session.get('key')
session.get('user.email')
```

你还可以定义默认值作为第二个参数。如果存储中不存在该键，则返回默认值。

```ts
session.get('visits', 0)
```

### has

检查会话存储中是否存在键。

```ts
if (session.has('visits')) {
}
```

### all

返回会话存储中的所有数据。返回值将始终是一个对象。

```ts
session.all()
```

### put

向会话存储添加键值对。你可以使用点符号创建具有嵌套值的对象。

```ts
session.put('user', { email: 'foo@bar.com' })

// Same as above
session.put('user.email', 'foo@bar.com')
```

### forget

从会话存储中移除键值对。

```ts
session.forget('user')

// Remove the email from the user object
session.forget('user.email')
```

### pull

`pull` 方法返回键的值并同时从存储中移除它。

```ts
const user = session.pull('user')
session.has('user') // false
```

### increment

`increment` 方法增加键的值。如果该键不存在，则定义一个新的键值。

```ts
session.increment('visits')

// Increment by 4
session.increment('visits', 4)
```

### decrement

`decrement` 方法减少键的值。如果该键不存在，则定义一个新的键值。

```ts
session.decrement('visits')

// Decrement by 4
session.decrement('visits', 4)
```

### clear

`clear` 方法从会话存储中移除所有内容。

```ts
session.clear()
```

## 会话生命周期

AdonisJS 在第一个 HTTP 请求时创建一个空会话存储并将其分配给唯一的会话 ID，即使请求/响应生命周期不与会话交互也是如此。

在随后的每个请求中，我们更新会话 ID cookie 的 `maxAge` 属性以确保它不会过期。会话存储也会收到有关更改（如果有）的通知，以更新并持久化它们。

你可以使用 `sessionId` 属性访问唯一的会话 ID。访问者的会话 ID 在过期之前保持不变。

```ts
console.log(session.sessionId)
```

### 重新生成会话 ID

重新生成会话 ID 有助于防止应用程序中的 [会话固定 (session fixation)](https://owasp.org/www-community/attacks/Session_fixation) 攻击。当将匿名会话与登录用户关联时，必须重新生成会话 ID。

`@adonisjs/auth` 包会自动重新生成会话 ID，因此你不必手动执行此操作。

```ts
/**
 * 新的会话 ID 将在请求结束时分配
 */
session.regenerate()
```

## 会话标记

会话标记允许你将会话链接到用户 ID。这对于实现以下功能非常有用：

- **从所有设备注销**：销毁与用户关联的所有会话。
- **活动会话列表**：在用户的帐户设置中显示所有活动会话。

:::note
会话标记仅由 `redis`、`database` 和 `memory` 存储支持。尝试使用 `cookie`、`file` 或 `dynamodb` 存储进行标记将抛出错误。
:::

### 标记当前会话

你可以使用 `session.tag` 方法使用用户 ID 标记当前会话。这通常在用户登录后完成。

```ts
import router from '@adonisjs/core/services/router'

router.post('/login', async ({ auth, session }) => {
  const user = await auth.use('web').login(email, password)

  // highlight-start
  // Tag the session with the user ID
  await session.tag(String(user.id))
  // highlight-end
})
```

## SessionCollection

`SessionCollection` 类提供了在 HTTP 请求上下文之外进行程序化会话管理的 API。它允许你通过 ID 读取、销毁和标记会话。

### 创建实例

你必须通过容器获取 `SessionCollection` 实例，以确保正确的配置注入。

```ts
import app from '@adonisjs/core/services/app'
import { SessionCollection } from '@adonisjs/session'

const sessionCollection = await app.container.make(SessionCollection)
```

### 可用方法

```ts
// Get session data by ID
const data = await sessionCollection.get(sessionId)

// Destroy a session by ID
await sessionCollection.destroy(sessionId)

// Tag a session with a user ID
await sessionCollection.tag(sessionId, userId)

// Get all sessions for a user
const sessions = await sessionCollection.tagged(userId)
// Returns: Array<{ id: string, data: SessionData }>

// Check if the current store supports tagging
const supportsTagging = sessionCollection.supportsTagging()
```

### 列出活动会话

以下是在用户的帐户设置页面中列出所有活动会话的示例。

```ts
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'
import { SessionCollection } from '@adonisjs/session'

router.get('/account/sessions', async ({ auth, session, view }) => {
  const user = auth.user!
  const sessionCollection = await app.container.make(SessionCollection)

  // highlight-start
  const sessions = await sessionCollection.tagged(String(user.id))

  // Mark the current session
  const sessionsWithCurrent = sessions.map((tagged) => ({
    ...tagged,
    isCurrent: tagged.id === session.sessionId,
  }))
  // highlight-end

  return view.render('account/sessions', { sessions: sessionsWithCurrent })
})
```

### 从所有其他设备注销

以下是实现“从所有其他设备注销”功能的完整示例。

```ts
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'
import { SessionCollection } from '@adonisjs/session'

router.post('/logout-other-devices', async ({ auth, session, response }) => {
  const user = auth.user!
  const sessionCollection = await app.container.make(SessionCollection)

  // highlight-start
  const sessions = await sessionCollection.tagged(String(user.id))

  for (const s of sessions) {
    if (s.id !== session.sessionId) {
      await sessionCollection.destroy(s.id)
    }
  }
  // highlight-end

  return response.redirect().back()
})
```

## 闪存消息 (Flash messages)

闪存消息用于在两个 HTTP 请求之间传递数据。它们通常用于在特定操作后向用户提供反馈。例如，在表单提交后显示成功消息或显示验证错误消息。

在下面的示例中，我们定义了用于显示联系表单并将表单详细信息提交到数据库的路由。表单提交后，我们将用户重定向回表单，并使用闪存消息显示成功通知。

```ts
import router from '@adonisjs/core/services/router'

router.post('/contact', ({ session, request, response }) => {
  const data = request.all()
  // Save contact data
  
  // highlight-start
  session.flash('notification', {
    type: 'success',
    message: 'Thanks for contacting. We will get back to you'
  })
  // highlight-end

  response.redirect().back()
})

router.get('/contact', ({ view }) => {
  return view.render('contact')
})
```

你可以使用 `flashMessage` 标签或 `flashMessages` 属性在 edge 模板中访问闪存消息。

```edge
@flashMessage('notification')
  <div class="notification {{ $message.type }}">
    {{ $message.message }}
  </div>
@end

<form method="POST" action="/contact">
  <!-- Rest of the form -->
</form>
```

你可以使用 `session.flashMessages` 属性在控制器中访问闪存消息。

```ts
router.get('/contact', ({ view, session }) => {
  // highlight-start
  console.log(session.flashMessages.all())
  // highlight-end
  return view.render('contact')
})
```

### 验证错误和闪存消息

会话中间件自动捕获 [验证异常](./validation.md#error-handling) 并将用户重定向回表单。验证错误和表单输入数据保存在闪存消息中，你可以在 Edge 模板中访问它们。

在下面的示例中：

- 我们使用 [`old` 方法](../references/edge.md#old) 访问 `title` 输入字段的值。
- 并使用 [`@inputError` 标签](../references/edge.md#inputerror) 访问错误消息。

```edge
<form method="POST" action="/posts">
  <div>
    <label for="title"> Title </label>
    <input 
      type="text"
      id="title"
      name="title"
      value="{{ old('title') || '' }}"
    />

    @inputError('title')
      @each(message in $messages)
        <p> {{ message }} </p>
      @end
    @end
  </div>
</form>
```

### 写入闪存消息

以下是将数据写入闪存消息存储的方法。`session.flash` 方法接受键值对并将其写入会话存储中的闪存消息属性。

```ts
session.flash('key', value)
session.flash({
  key: value
})
```

你可以使用以下方法之一来闪存表单数据，而不是手动读取请求数据并将其存储在闪存消息中。

```ts
// title: flashAll
/**
 * 闪存请求数据的简写
 */
session.flashAll()

/**
 * 与 "flashAll" 相同
 */
session.flash(request.all())
```

```ts
// title: flashOnly
/**
 * 闪存所选请求数据属性的简写
 */
session.flashOnly(['username', 'email'])

/**
 * 与 "flashOnly" 相同
 */
session.flash(request.only(['username', 'email']))
```

```ts
// title: flashExcept
/**
 * 闪存所选请求数据属性的简写
 */
session.flashExcept(['password'])

/**
 * 与 "flashExcept" 相同
 */
session.flash(request.except(['password']))
```

最后，你可以使用 `session.reflash` 方法重新闪存当前的闪存消息。

```ts
session.reflash()
session.reflashOnly(['notification', 'errors'])
session.reflashExcept(['errors'])
```

### 读取闪存消息

闪存消息仅在重定向后的后续请求中可用。你可以使用 `session.flashMessages` 属性访问它们。

```ts
console.log(session.flashMessages.all())
console.log(session.flashMessages.get('key'))
console.log(session.flashMessages.has('key'))
```

相同的 `flashMessages` 属性也与 Edge 模板共享，你可以按如下方式访问它。

另请参阅：[Edge helpers reference](../references/edge.md#flashmessages)

```edge
{{ flashMessages.all() }}
{{ flashMessages.get('key') }}
{{ flashMessages.has('key') }}
```

最后，你可以使用以下 Edge 标签访问特定的闪存消息或验证错误。

```edge
{{-- Read any flash message by key --}}
@flashMessage('key')
  {{ inspect($message) }}
@end

{{-- Read generic errors --}}
@error('key')
  {{ inspect($message) }}
@end

{{-- Read validation errors --}}
@inputError('key')
  {{ inspect($messages) }}
@end
```

## 事件

请查看 [事件参考指南](../references/events.md#sessioninitiated) 以查看 `@adonisjs/session` 包分发的事件列表。

## 创建自定义会话存储

会话存储必须实现 [SessionStoreContract](https://github.com/adonisjs/session/blob/main/src/types.ts#L23C18-L23C38) 接口并定义以下方法。

```ts
import {
  SessionData,
  SessionStoreFactory,
  SessionStoreContract,
} from '@adonisjs/session/types'

/**
 * The config you want to accept
 */
export type MongoDBConfig = {}

/**
 * Driver implementation
 */
export class MongoDBStore implements SessionStoreContract {
  constructor(public config: MongoDBConfig) {
  }

  /**
   * Returns the session data for a session ID. The method
   * must return null or an object of a key-value pair
   */
  async read(sessionId: string): Promise<SessionData | null> {
  }

  /**
   * Save the session data against the provided session ID
   */
  async write(sessionId: string, data: SessionData): Promise<void> {
  }

  /**
   * Delete session data for the given session ID
   */
  async destroy(sessionId: string): Promise<void> {
  }

  /**
   * Reset the session expiry
   */
  async touch(sessionId: string): Promise<void> {
  }
}

/**
 * Factory function to reference the store
 * inside the config file.
 */
export function mongoDbStore (config: MongoDbConfig): SessionStoreFactory {
  return (ctx, sessionConfig) => {
    return new MongoDBStore(config)
  }
}
```

在上面的代码示例中，我们导出了以下值。

- `MongoDBConfig`: 你想要接受的配置的 TypeScript 类型。

- `MongoDBStore`: 存储作为类的实现。它必须遵守 `SessionStoreContract` 接口。

- `mongoDbStore`: 最后，一个工厂函数，用于为每个 HTTP 请求创建存储的实例。

### 使用存储

创建存储后，你可以使用 `mongoDbStore` 工厂函数在配置文件中引用它。

```ts
// title: config/session.ts
import { defineConfig } from '@adonisjs/session'
import { mongDbStore } from 'my-custom-package'

export default defineConfig({
  stores: {
    mongodb: mongoDbStore({
      // config goes here
    })
  }
})
```

### 关于序列化数据的说明

`write` 方法接收对象形式的会话数据，你可能需要在保存之前将其转换为字符串。你可以使用任何序列化包，或者使用 AdonisJS 帮助程序模块提供的 [MessageBuilder](../references/helpers.md#message-builder) 帮助程序。如需灵感，请查阅官方 [会话存储](https://github.com/adonisjs/session/blob/main/src/stores/redis.ts#L59)。
