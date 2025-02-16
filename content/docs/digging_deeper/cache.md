---
summary: Cache data to improve the performance of your application
---

# Cache

AdonisJS Cache (`@adonisjs/cache`) is a simple, lightweight wrapper built on top of [bentocache.dev](https://bentocache.dev) to cache data and enhance the performance of your application. It provides a straightforward and unified API to interact with various cache drivers, such as Redis, DynamoDB, PostgreSQL, in-memory caching, and more.

We highly encourage you to read the Bentocache documentation. Bentocache offers some advanced, optional concepts that can be very useful in certain situations, such as [multi-tiering](https://bentocache.dev/docs/multi-tier), [grace periods](https://bentocache.dev/docs/grace-periods), [tagging](https://bentocache.dev/docs/tagging) [timeouts](https://bentocache.dev/docs/timeouts), [Stampede Protection](https://bentocache.dev/docs/stampede-protection) and more.

## Installation

Install and configure the `@adonisjs/cache` package by running the following command:

```sh
node ace add @adonisjs/cache
```

:::disclosure{title="See the steps performed by the add command"}

1. Installs the `@adonisjs/cache` package using the detected package manager.
2. Registers the following service provider inside the `adonisrc.ts` file:

   ```ts
   {
     providers: [
       // ...other providers
       () => import('@adonisjs/cache/cache_provider'),
     ]
   }
   ```

3. Creates the `config/cache.ts` file.
4. Defines the environment variables for the selected cache drivers inside the `.env` file.

:::

## Configuration

The configuration file for the cache package is located at `config/cache.ts`. You can configure the default cache driver, the list of drivers, and their specific configurations.

See also: [Config stub](https://github.com/adonisjs/cache/blob/1.x/stubs/config.stub)

```ts
import { defineConfig, store, drivers } from '@adonisjs/cache'

const cacheConfig = defineConfig({
  default: 'redis',
  
  stores: {
    /**
     * Cache data only on DynamoDB
     */
    dynamodb: store().useL2Layer(drivers.dynamodb({})),

    /**
     * Cache data using your Lucid-configured database
     */
    database: store().useL2Layer(drivers.database({ connectionName: 'default' })),

    /**
     * Cache data in-memory as the primary store and Redis as the secondary store.
     * If your application is running on multiple servers, then in-memory caches
     * need to be synchronized using a bus.
     */
    redis: store()
      .useL1Layer(drivers.memory({ maxSize: '100mb' }))
      .useL2Layer(drivers.redis({ connectionName: 'main' }))
      .useBus(drivers.redisBus({ connectionName: 'main' })),
  },
})

export default cacheConfig
```

In the code example above, we are setting up multiple layers for each cache store. This is called a [multi-tier caching system](https://bentocache.dev/docs/multi-tier). It lets us first check a fast in-memory cache (the first layer). If we do not find the data there, we will then use the distributed cache (the second layer).

### Redis

To use Redis as your cache system, you must install the `@adonisjs/redis` package and configure it. Refer to the documentation here: [Redis](../database/redis.md).

In `config/cache.ts`, you must specify a `connectionName`. This property should match the Redis configuration key in the `config/redis.ts` file.

### Database

The `database` driver has a peer dependency on `@adonisjs/lucid`. Therefore, you must install and configure this package to use the `database` driver.

In `config/cache.ts`, you must specify a `connectionName`. This property should correspond to the database configuration key in the `config/database.ts` file.

### Other drivers

You can use other drivers such as `memory`, `dynamodb`, `kysely` and `orchid`. 

See [Cache Drivers](https://bentocache.dev/docs/cache-drivers) for more information.

## Usage

Once your cache is configured, you can import the `cache` service to interact with it. In the following example, we cache the user details for 5 minutes:

```ts
import cache from '@adonisjs/cache/services/main'
import router from '@adonisjs/core/services/router'

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

As you can see, we serialize the user's data using `user.toJSON()`. This is necessary because your data must be serialized to be stored in the cache. Classes such as Lucid models or instances of `Date` cannot be stored directly in caches like Redis or a database.

:::

The `ttl` defines the time-to-live for the cache key. After the TTL expires, the cache key is considered stale, and the next request will re-fetch the data from the factory method.

### Tagging

You can associate a cache entry with one or more tags to simplify invalidation. Instead of managing individual keys, entries can be grouped under multiple tags and invalidated in a single operation.

```ts
await bento.getOrSet({
  key: 'foo',
  factory: getFromDb(),
  tags: ['tag-1', 'tag-2']
});

await bento.deleteByTags({ tags: ['tag-1'] });
```

### Namespaces

Another way to group your keys is to use namespaces. This allows you to invalidate everything at once later :

```ts
const users = bento.namespace('users')

users.set({ key: '32', value: { name: 'foo' } })
users.set({ key: '33', value: { name: 'bar' } })

users.clear() 
```

### Grace period

You can allow Bentocache to return stale data if the cache key is expired but still within a grace period using the `grace` option. This change makes Bentocache works in a same way `SWR` or `TanStack Query` do

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
})
```

In the example above, the data will be considered stale after 1 hour. However, the next request within the grace period of 6 hours will return the stale data while re-fetching the data from the factory method and updating the cache.

### Timeouts

You can configure how long you allow your factory method to run before returning stale data using the `timeout` option. By default, Bentocache set a soft timeout of 0ms, which means we always return stale data while re-fetching the data in the background.

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

In the example above, the factory method will be allowed to run for a maximum of 200ms. If the factory method takes longer than 200ms, the stale data will be returned to the user but the factory method will continue to run in the background.

If you have not defined a `grace` period, you can still use a hard timeout to stop the factory method from running after a certain time.

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

In this example, the factory method will be stopped after 200ms and an error will be thrown.

:::note

You can define the `timeout` and `hardTimeout` together. The `timeout` is the maximum time the factory method is allowed to run before returning stale data, while the `hardTimeout` is the maximum time the factory method is allowed to run before being stopped.

:::

## Cache Service

The cache service exported from `@adonisjs/cache/services/main` is a singleton instance of the [BentoCache](https://bentocache.dev/docs/named-caches) class created using the configuration defined in `config/cache.ts`.

You can import the cache service into your application and use it to interact with the cache:

```ts
import cache from '@adonisjs/cache/services/main'

/**
 * Without calling the `use` method, the methods you call on the cache service
 * will use the default store defined in `config/cache.ts`.
 */
cache.put({ key: 'username', value: 'jul', ttl: '1h' })

/**
 * Using the `use` method, you can switch to a different store defined in
 * `config/cache.ts`.
 */
cache.use('dynamodb').put({ key: 'username', value: 'jul', ttl: '1h' })
```

You can find all available methods here: [BentoCache API](https://bentocache.dev/docs/methods).

```ts
await cache.namespace('users').set({ key: 'username', value: 'jul' })
await cache.namespace('users').get({ key: 'username' })

await cache.get({ key: 'username' })

await cache.set({key: 'username', value: 'jul' })
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
await cache.deleteByTags({ tags: ['products', 'users'] })

await cache.clear()
```

## Edge Helper

The `cache` service is available as an edge helper within your views. You can use it to retrieve cached values directly in your templates.

```edge
<p>
  Hello {{ await cache.get('username') }}
</p>
```

## Ace Commands

The `@adonisjs/cache` package also provides a set of Ace commands to interact with the cache from the terminal.

### cache:clear

Clears the cache for the specified store. If not specified, it will clear the default one.

```sh
node ace cache:clear
node ace cache:clear redis
node ace cache:clear dynamodb
```
