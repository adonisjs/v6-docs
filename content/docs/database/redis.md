---
summary: 使用 `@adonisjs/redis` 包在 AdonisJS 应用中使用 Redis。
---

# Redis

你可以使用 `@adonisjs/redis` 包在 AdonisJS 应用程序中使用 Redis。该包是 [ioredis](https://github.com/redis/ioredis) 的一个轻量级封装，提供了更好的发布/订阅（Pub/Sub）开发体验以及多 Redis 连接的自动管理。

## 安装

使用以下命令安装并配置该包：

```sh
node ace add @adonisjs/redis
```

:::disclosure{title="查看添加命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/redis` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/redis/redis_provider')
      ]
    }
    ```

3. 创建 `config/redis.ts` 文件。此文件包含 Redis 服务器的连接配置。

4. 定义以下环境变量及其验证规则。

    ```dotenv
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    REDIS_PASSWORD=
    ```

:::


## 配置

Redis 包的配置存储在 `config/redis.ts` 文件中。

另请参阅：[配置文件存根](https://github.com/adonisjs/redis/blob/main/stubs/config/redis.stub)

```ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: '',
    },
  },
})

export default redisConfig
```

<dl>
<dt>

connection

<dt>

<dd>

`connection` 属性定义默认使用的连接。当你运行 redis 命令而没有选择显式连接时，它们将针对默认连接执行。

</dd>

<dt>

connections

<dt>

<dd>

`connections` 属性是多个命名连接的集合。你可以在此对象内定义一个或多个连接，并使用 `redis.connection()` 方法在它们之间切换。

每个命名连接的配置与 [ioredis 接受的配置](https://redis.github.io/ioredis/index.html#RedisOptions) 相同。

</dd>
</dl>

### 通过 Socket 连接
你可以配置 Redis 使用 Unix socket 进行连接。在 Redis 配置对象中使用 `path` 属性并提供 socket 的文件系统路径。


```ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      path: env.get('REDIS_SOCKET_PATH'),
      db: 0,
      keyPrefix: '',
    },
  },
})

export default redisConfig
```

---

### 配置集群

如果你在连接配置中定义了一个主机数组，`@adonisjs/redis` 包将创建一个 [集群连接](https://github.com/redis/ioredis#cluster)。例如：

```ts
const redisConfig = defineConfig({
  connections: {
    main: {
      // highlight-start
      clusters: [
        { host: '127.0.0.1', port: 6380 },
        { host: '127.0.0.1', port: 6381 },
      ],
      clusterOptions: {
        scaleReads: 'slave',
        slotsRefreshTimeout: 10 * 1000,
      },
      // highlight-end
    },
  },
})
```

### 配置哨兵
你可以通过在连接配置中定义一个哨兵节点数组来配置 redis 连接以使用哨兵。例如：

另请参阅：[IORedis 关于哨兵配置的文档](https://github.com/redis/ioredis?tab=readme-ov-file#sentinel)

```ts
const redisConfig = defineConfig({
  connections: {
    main: {
      // highlight-start
      sentinels: [
        { host: 'localhost', port: 26379 },
        { host: 'localhost', port: 26380 },
      ],
      name: 'mymaster',
      // highlight-end
    },
  },
})
```

## 用法

你可以使用包导出的 `redis` 服务运行 redis 命令。redis 服务是一个单例对象，使用你在 `config/redis.ts` 文件中定义的配置进行配置。

:::note

查阅 [ioredis](https://redis.github.io/ioredis/classes/Redis.html) 文档以查看可用方法列表。由于我们是 IORedis 的封装，因此命令 API 是相同的。

:::

```ts
import redis from '@adonisjs/redis/services/main'

await redis.set('username', 'virk')
const username = await redis.get('username')
```

### 切换连接
使用 `redis` 服务执行的命令是针对配置文件中定义的 **默认连接** 调用的。但是，你可以通过首先获取特定连接的实例来对其执行命令。

`.connection()` 方法创建并缓存该连接实例，其生命周期与进程相同。

```ts
import redis from '@adonisjs/redis/services/main'

// highlight-start
// 获取连接实例
const redisMain = redis.connection('main')
// highlight-end

await redisMain.set('username', 'virk')
const username = await redisMain.get('username')
```

### 退出连接

连接是长期的，每次调用 `.connection()` 方法都会获得相同的实例。你可以使用 `quit` 方法退出连接。使用 `disconnect` 方法强制结束连接。

```ts
import redis from '@adonisjs/redis/services/main'

await redis.quit('main') // 退出 main 连接
await redis.disconnect('main') // 强制退出 main 连接
```

```ts
import redis from '@adonisjs/redis/services/main'

const redisMain = redis.connection('main')
redisMain.quit() // 使用连接实例退出
redisMain.disconnect() // 使用连接实例强制退出
```

## 错误处理

Redis 连接可能会在应用程序生命周期的任何时候失败。因此，捕获错误并制定重试策略至关重要。

默认情况下，AdonisJS 将使用 [应用程序记录器](../digging_deeper/logger.md) 记录 redis 连接错误，并在永久关闭之前重试连接十次。重试策略是在 `config/redis.ts` 文件中的每个连接中定义的。

另请参阅：[IORedis 关于自动重连的文档](https://github.com/redis/ioredis#auto-reconnect)

```ts
// title: config/redis.ts
{
  main: {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT'),
    password: env.get('REDIS_PASSWORD', ''),
    // highlight-start
    retryStrategy(times) {
      return times > 10 ? null : times * 50
    },
    // highlight-end
  },
}
```

你可以使用 `.doNotLogErrors` 方法禁用默认的错误报告器。这样做将从 redis 连接中删除 `error` 事件监听器。

```ts
import redis from '@adonisjs/redis/services/main'

/**
 * 禁用默认错误报告器
 */
redis.doNotLogErrors()

redis.on('connection', (connection) => {
  /**
   * 确保始终定义错误监听器。
   * 否则，应用程序将崩溃
   */
  connection.on('error', (error) => {
    console.log(error)
  })
})
```

## 发布/订阅 (Pub/Sub)

Redis 需要多个连接来发布和订阅频道。订阅者连接除了订阅新频道/模式和取消订阅之外，不能执行其他操作。

当使用 `@adonisjs/redis` 包时，你不必手动创建订阅者连接；我们会为你处理。当你第一次调用 `subscribe` 方法时，我们会自动创建一个新的订阅者连接。

```ts
import redis from '@adonisjs/redis/services/main'

redis.subscribe('user:add', function (message) {
  console.log(message)
})
```

### IORedis 和 AdonisJS 之间的 API 差异

当使用 `ioredis` 时，你必须使用两个不同的 API 来订阅频道和监听新消息。但是，使用 AdonisJS 封装器，`subscribe` 方法会同时处理这两者。

:::caption{for="info"}
**使用 IORedis**
:::

```ts
redis.on('message', (channel, messages) => {
  console.log(message)
})

redis.subscribe('user:add', (error, count) => {
  if (error) {
    console.log(error)
  }
})
```

:::caption{for="info"}
**使用 AdonisJS**
:::

```ts
redis.subscribe('user:add', (message) => {
  console.log(message)
},
{
  onError(error) {
    console.log(error)
  },
  onSubscription(count) {
    console.log(count)
  },
})
```

### 发布消息

你可以使用 `publish` 方法发布消息。该方法接受频道名称作为第一个参数，要发布的数据作为第二个参数。

```ts
redis.publish(
  'user:add',
  JSON.stringify({
    id: 1,
    username: 'virk',
  })
)
```

### 订阅模式

你可以使用 `psubscribe` 方法订阅模式。与 `subscribe` 方法类似，它将创建一个订阅者连接（如果不存在）。

```ts
redis.psubscribe('user:*', (channel, message) => {
  console.log(channel)
  console.log(message)
})

redis.publish(
  'user:add',
  JSON.stringify({
    id: 1,
    username: 'virk',
  })
)
```

### 取消订阅

你可以使用 `unsubscribe` 和 `punsubscribe` 方法取消订阅频道或模式。

```ts
await redis.unsubscribe('user:add')
await redis.punsubscribe('user:*add*')
```

## 使用 Lua 脚本

你可以将 Lua 脚本注册为 redis 服务的命令，它们将应用于所有连接。

另请参阅：[IORedis 关于 Lua 脚本的文档](https://github.com/redis/ioredis#lua-scripting)

```ts
import redis from '@adonisjs/redis/services/main'

redis.defineCommand('release', {
  numberOfKeys: 2,
  lua: `
    redis.call('zrem', KEYS[2], ARGV[1])
    redis.call('zadd', KEYS[1], ARGV[2], ARGV[1])
    return true
  `,
})
```

定义命令后，可以使用 `runCommand` 方法执行它。首先定义所有键，然后是参数。

```ts
redis.runCommand(
  'release', // 命令名称
  'jobs:completed', // 键 1
  'jobs:running', // 键 2
  '11023', // 参数 1
  100 // 参数 2
)
```

相同的命令可以在显式连接上执行。

```ts
redis.connection('jobs').runCommand(
  'release', // 命令名称
  'jobs:completed', // 键 1
  'jobs:running', // 键 2
  '11023', // 参数 1
  100 // 参数 2
)
```

最后，你还可以使用特定连接实例定义命令。例如：

```ts
redis.on('connection', (connection) => {
  if (connection.connectionName === 'jobs') {
    connection.defineCommand('release', {
      numberOfKeys: 2,
      lua: `
        redis.call('zrem', KEYS[2], ARGV[1])
        redis.call('zadd', KEYS[1], ARGV[2], ARGV[1])
        return true
      `,
    })
  }
})
```

## 转换参数和回复

你可以使用 `redis.Command` 属性定义参数转换器和回复转换器。API 与 [IORedis API](https://github.com/redis/ioredis#transforming-arguments--replies) 相同。

```ts
// title: 参数转换器
import redis from '@adonisjs/redis/services/main'

redis.Command.setArgumentTransformer('hmset', (args) => {
  if (args.length === 2) {
    if (args[1] instanceof Map) {
      // utils 是 ioredis 的内部模块
      return [args[0], ...utils.convertMapToArray(args[1])]
    }
    if (typeof args[1] === 'object' && args[1] !== null) {
      return [args[0], ...utils.convertObjectToArray(args[1])]
    }
  }
  return args
})
```

```ts
// title: 回复转换器
import redis from '@adonisjs/redis/services/main'

redis.Command.setReplyTransformer('hgetall', (result) => {
  if (Array.isArray(result)) {
    const obj = {}
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1]
    }
    return obj
  }
  return result
})
```

## 事件

以下是 Redis 连接实例发出的事件列表。

### connect / subscriber:connect
建立连接时发出此事件。建立订阅者连接时发出 `subscriber:connect` 事件。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('connect', () => {})
  connection.on('subscriber:connect', () => {})
})
```

### wait
当连接处于 `wait` 模式时发出（因为配置中设置了 `lazyConnect` 选项）。执行第一个命令后，连接将移出 `wait` 状态。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('wait', () => {})
})
```

### ready / subscriber:ready
除非在配置中启用了 `enableReadyCheck` 标志，否则 `connect` 事件之后会立即发出此事件。如果启用了该标志，我们将等待 Redis 服务器报告它已准备好接受命令。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('ready', () => {})
  connection.on('subscriber:ready', () => {})
})
```

### error / subscriber:error
无法连接到 redis 服务器时发出此事件。请参阅 [错误处理](#error-handling) 以了解 AdonisJS 如何处理连接错误。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('error', () => {})
  connection.on('subscriber:error', () => {})
})
```

### close / subscriber:close
连接关闭时发出此事件。IORedis 可能会在发出 `close` 事件后重试建立连接，具体取决于重试策略。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('close', () => {})
  connection.on('subscriber:close', () => {})
})
```

### reconnecting / subscriber:reconnecting
在 `close` 事件之后尝试重新连接到 redis 服务器时发出此事件。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('reconnecting', ({ waitTime }) => {
    console.log(waitTime)
  })
  connection.on('subscriber:reconnecting', ({ waitTime }) => {
    console.log(waitTime)
  })
})
```

### end / subscriber:end
当连接已关闭且不会进行进一步的重新连接时发出此事件。这应该是连接生命周期的结束。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('end', () => {})
  connection.on('subscriber:end', () => {})
})
```

### node:added
连接到新的集群节点时发出此事件（仅适用于集群实例）。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:added', () => {})
})
```

### node:removed
移除集群节点时发出此事件（仅适用于集群实例）。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:removed', () => {})
})
```

### node:error
无法连接到集群节点时发出此事件（仅适用于集群实例）。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:error', ({ error, address }) => {
    console.log(error, address)
  })
})
```

### subscription:ready / psubscription:ready
给定频道或模式的订阅建立时发出此事件。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('subscription:ready', ({ count }) => {
    console.log(count)
  })
  connection.on('psubscription:ready', ({ count }) => {
    console.log(count)
  })
})
```

### subscription:error / psubscription:error
无法订阅频道或模式时发出此事件。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('subscription:error', () => {})
  connection.on('psubscription:error', () => {})
})
```
