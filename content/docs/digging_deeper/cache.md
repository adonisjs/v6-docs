---
summary: 缓存数据以提高应用程序的性能
---

# 缓存 (Cache)

AdonisJS 缓存 (`@adonisjs/cache`) 是一个简单、轻量级的封装，基于 [bentocache.dev](https://bentocache.dev) 构建，用于缓存数据并增强应用程序的性能。它提供了一个直观且统一的 API 来与各种缓存驱动程序进行交互，例如 Redis、DynamoDB、PostgreSQL、内存缓存等。

我们强烈建议你阅读 Bentocache 的文档。Bentocache 提供了一些高级的可选概念，在某些情况下非常有用，例如 [多级缓存 (multi-tiering)](https://bentocache.dev/docs/multi-tier)、[宽限期 (grace periods)](https://bentocache.dev/docs/grace-periods)、[标签 (tagging)](https://bentocache.dev/docs/tagging)、[超时 (timeouts)](https://bentocache.dev/docs/timeouts)、[惊群保护 (Stampede Protection)](https://bentocache.dev/docs/stampede-protection) 等。

## 安装

运行以下命令安装并配置 `@adonisjs/cache` 包：

```sh
node ace add @adonisjs/cache
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/cache` 包。
2. 在 `adonisrc.ts` 文件中注册以下服务提供者：

   ```ts
   {
     providers: [
       // ...其他提供者
       () => import('@adonisjs/cache/cache_provider'),
     ]
   }
   ```

3. 创建 `config/cache.ts` 文件。
4. 在 `.env` 文件中定义所选缓存驱动程序的环境变量。

:::

## 配置

缓存包的配置文件位于 `config/cache.ts`。你可以配置默认的缓存驱动程序、驱动程序列表及其具体配置。

另请参阅：[配置存根 (Config stub)](https://github.com/adonisjs/cache/blob/1.x/stubs/config.stub)

```ts
import { defineConfig, store, drivers } from '@adonisjs/cache'

const cacheConfig = defineConfig({
  default: 'redis',

  stores: {
    /**
     * 仅在 DynamoDB 上缓存数据
     */
    dynamodb: store().useL2Layer(drivers.dynamodb({})),

    /**
     * 使用你配置的 Lucid 数据库缓存数据
     */
    database: store().useL2Layer(drivers.database({ connectionName: 'default' })),

    /**
     * 将数据缓存在内存中作为主存储，Redis 作为辅助存储。
     * 如果你的应用程序运行在多个服务器上，那么内存缓存
     * 需要使用总线进行同步。
     */
    redis: store()
      .useL1Layer(drivers.memory({ maxSize: '100mb' }))
      .useL2Layer(drivers.redis({ connectionName: 'main' }))
      .useBus(drivers.redisBus({ connectionName: 'main' })),
  },
})

export default cacheConfig
```

在上面的代码示例中，我们为每个缓存存储设置了多层。这被称为 [多级缓存系统](https://bentocache.dev/docs/multi-tier)。它允许我们首先检查快速的内存缓存（第一层）。如果在那里找不到数据，我们将使用分布式缓存（第二层）。

### Redis

要使用 Redis 作为缓存系统，你必须安装 `@adonisjs/redis` 包并进行配置。请参阅此处的文档：[Redis](../database/redis.md)。

在 `config/cache.ts` 中，你必须指定一个 `connectionName`。此属性应与 `config/redis.ts` 文件中的 Redis 配置键匹配。

### 数据库 (Database)

`database` 驱动程序具有对 `@adonisjs/lucid` 的对等依赖。因此，你必须安装并配置此包才能使用 `database` 驱动程序。

在 `config/cache.ts` 中，你必须指定一个 `connectionName`。此属性应对应于 `config/database.ts` 文件中的数据库配置键。

此外，配置 `database` 驱动程序时，会将一个 [迁移文件](https://github.com/adonisjs/cache/blob/1.x/stubs/migration.stub) 发布到你的 `database/migrations` 目录，你必须运行该迁移以创建用于存储缓存条目的必要表。

### 其他驱动程序

你可以使用其他驱动程序，如 `memory`、`dynamodb`、`kysely` 和 `orchid`。

更多信息请参阅 [缓存驱动程序](https://bentocache.dev/docs/cache-drivers)。

## 使用

一旦你的缓存配置完成，你可以导入 `cache` 服务与其进行交互。在下面的示例中，我们将用户详情缓存 5 分钟：

```ts
import cache from '@adonisjs/cache/services/main'
import router from '@adonisjs/core/services/router'
import User from '#models/user'

router.get('/user/:id', async ({ params }) => {
  return cache.getOrSet({
    key: `user:${params.id}`,
    factory: async () => {
      const user = await User.find(params.id)
      return user.toJSON()
    },
    ttl: '5m',
  })
})
```

:::warning

如你所见，我们使用 `user.toJSON()` 序列化用户数据。这是必要的，因为你的数据必须被序列化才能存储在缓存中。像 Lucid 模型这样的类或 `Date` 实例不能直接存储在 Redis 或数据库等缓存中。

:::

`ttl` 定义了缓存键的生存时间 (Time-To-Live)。TTL 过期后，缓存键被视为陈旧，下一个请求将从工厂方法重新获取数据。

### 标签 (Tagging)

你可以将缓存条目与一个或多个标签关联，以简化失效操作。条目可以分组在多个标签下，并在一次操作中失效，而不是管理单个键。

```ts
await cache.getOrSet({
  key: 'foo',
  factory: getFromDb(),
  tags: ['tag-1', 'tag-2']
});

await cache.deleteByTag({ tags: ['tag-1'] });
```

### 命名空间 (Namespaces)

另一种分组键的方法是使用命名空间。这允许你稍后一次性使所有内容失效：

```ts
const users = cache.namespace('users')

users.set({ key: '32', value: { name: 'foo' } })
users.set({ key: '33', value: { name: 'bar' } })

users.clear()
```

### 宽限期 (Grace period)

你可以使用 `grace` 选项允许 Bentocache 在缓存键过期但在宽限期内时返回陈旧数据。这使得 Bentocache 的工作方式与 SWR 或 TanStack Query 等库相同。

```ts
import cache from '@adonisjs/cache/services/main'

cache.getOrSet({
  key: 'slow-api',
  factory: async () => {
    await sleep(5000)
    return 'slow-api-response'
  },
  ttl: '1h',
  grace: '6h',
  // 6 小时
})
```

在上面的示例中，数据将在 1 小时后被视为陈旧。但是，在 6 小时的宽限期内，下一个请求将返回陈旧数据，同时从工厂方法重新获取数据并更新缓存。

### 超时 (Timeouts)

你可以使用 `timeout` 选项配置允许工厂方法运行多长时间后返回陈旧数据。默认情况下，Bentocache 设置了 0ms 的软超时，这意味着我们总是返回陈旧数据，同时在后台重新获取数据。

```ts
import cache from '@adonisjs/cache/services/main'

cache.getOrSet({
  key: 'slow-api',
  factory: async () => {
    await sleep(5000)
    return 'slow-api-response'
  },
  ttl: '1h',
  grace: '6h',
  timeout: '200ms',
})
```

在上面的示例中，工厂方法将被允许运行最多 200ms。如果工厂方法耗时超过 200ms，陈旧数据将返回给用户，但工厂方法将继续在后台运行。

如果你没有定义 `grace` 周期，你仍然可以使用硬超时在特定时间后停止工厂方法的运行。

```ts
import cache from '@adonisjs/cache/services/main'

cache.getOrSet({
  key: 'slow-api',
  factory: async () => {
    await sleep(5000)
    return 'slow-api-response'
  },
  ttl: '1h',
  hardTimeout: '200ms',
})
```

在这个例子中，工厂方法将在 200ms 后停止，并抛出一个错误。

:::note

你可以同时定义 `timeout` 和 `hardTimeout`。`timeout` 是工厂方法在返回陈旧数据之前允许运行的最长时间，而 `hardTimeout` 是工厂方法被停止之前允许运行的最长时间。

:::

## 缓存服务 (Cache Service)

从 `@adonisjs/cache/services/main` 导出的缓存服务是使用 `config/cache.ts` 中定义的配置创建的 [BentoCache](https://bentocache.dev/docs/named-caches) 类的单例实例。

你可以将缓存服务导入到你的应用程序中，并使用它与缓存进行交互：

```ts
import cache from '@adonisjs/cache/services/main'

/**
 * 如果不调用 `use` 方法，你在缓存服务上调用的方法
 * 将使用 `config/cache.ts` 中定义的默认存储。
 */
cache.put({ key: 'username', value: 'jul', ttl: '1h' })

/**
 * 使用 `use` 方法，你可以切换到 `config/cache.ts` 中
 * 定义的不同存储。
 */
cache.use('dynamodb').put({ key: 'username', value: 'jul', ttl: '1h' })
```

你可以在这里找到所有可用的方法：[BentoCache API](https://bentocache.dev/docs/methods)。

```ts
await cache.namespace('users').set({ key: 'username', value: 'jul' })
await cache.namespace('users').get({ key: 'username' })

await cache.get({ key: 'username' })

await cache.set({ key: 'username', value: 'jul' })
await cache.setForever({ key: 'username', value:'jul' })

await cache.getOrSet({
  key: 'username',
  factory: async () => fetchUserName(),
  ttl: '1h',
})

await cache.has({ key: 'username' })
await cache.missing({ key: 'username' })

await cache.pull({ key: 'username' })

await cache.delete({ key: 'username' })
await cache.deleteMany({ keys: ['products', 'users'] })
await cache.deleteByTag({ tags: ['products', 'users'] })

await cache.clear()
```

## Edge 辅助函数 (Edge Helper)

`cache` 服务作为 Edge 辅助函数在你的视图中可用。你可以使用它直接在模板中检索缓存值。

```edge
<p>
  Hello {{ await cache.get('username') }}
</p>
```

## Ace 命令 (Ace Commands)

`@adonisjs/cache` 包还提供了一组 Ace 命令，用于从终端与缓存进行交互。

### `cache:clear`

清除指定存储的缓存。如果未指定，它将清除默认存储。

```sh
# 清除默认缓存存储
node ace cache:clear

# 清除特定缓存存储
node ace cache:clear redis

# 清除特定命名空间
node ace cache:clear store --namespace users

# 清除多个特定标签
node ace cache:clear store --tags products --tags users
```

### `cache:delete`

从指定存储中删除特定的缓存键。如果未指定，它将从默认存储中删除。

```sh
# 删除特定缓存键
node ace cache:delete cache-key

# 从特定存储中删除特定缓存键
node ace cache:delete cache-key store
```

### `cache:prune`

一些缓存驱动程序（如数据库驱动程序）不会自动删除过期的键，因为它们缺乏原生的 TTL 支持。你可以使用 `cache:prune` 命令手动删除过期的键。在支持 TTL 的存储上，此命令将不执行任何操作。

```sh
# 从默认缓存存储中修剪过期键
node ace cache:prune

# 从特定缓存存储中修剪过期键
node ace cache:prune store
```
