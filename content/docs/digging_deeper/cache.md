---
summary: Cache data to improve the performance of your application
---

# Cache

AdonisJS Cache (`@adonisjs/cache`) is a simple, lightweight wrapper built on top of [bentocache.dev](https://bentocache.dev) to cache data and enhance the performance of your application. It provides a straightforward and unified API to interact with various cache drivers, such as Redis, DynamoDB, PostgreSQL, in-memory caching, and more.

We highly encourage you to read the Bentocache documentation. Bentocache offers some advanced, optional concepts that can be very useful in certain situations, such as [multi-tiering](https://bentocache.dev/docs/multi-tier), [grace periods](https://bentocache.dev/docs/grace-periods), [timeouts](https://bentocache.dev/docs/timeouts), and more.

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
  suppressL2Errors: false,
  gracePeriod: {
    enabled: true,
    duration: '60s',
  },
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
      .useL1Layer(drivers.memory({ maxSize: 10 * 1024 * 1024 }))
      .useL2Layer(drivers.redis({ connectionName: 'main' }))
      .useBus(drivers.redisBus({ connectionName: 'main' })),
  },
})

export default cacheConfig
```

As you can see, you can configure multiple layers for each cache system. I highly recommend reading BentoCache's documentation to better understand how [multi-tiering](https://bentocache.dev/docs/multi-tier) works.

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
    duration: '5m',
    factory: async () => {
      const user = await User.find(params.id)
      return user.toJSON()
    },
  })
})
```

Key points to note here:

- We are using the [`getOrSet`](https://bentocache.dev/docs/methods#getorset) method. The first time the route is accessed, it will fetch the user details from the database and cache them for 5 minutes. Subsequent requests will return the cached value.
- The `factory` method is a callback that executes when the cache key is missing. The return value of the factory method is then cached.
- As you can see, we serialize the user's data using `user.toJSON()`. This is necessary because your data must be serialized to be stored in the cache. Classes such as Lucid models or instances of `Date` cannot be stored directly in caches like Redis or a database.

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
await cache.namespace('users').get('username')

await cache.get('username')

await cache.set('username', 'jul')
await cache.setForever('username', 'jul')

await cache.getOrSet({
  key: 'username',
  ttl: '1h',
  factory: async () => fetchUserName(),
})

await cache.has('username')
await cache.missing('username')

await cache.pull('username')

await cache.delete('username')
await cache.deleteMany(['products', 'users'])

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
