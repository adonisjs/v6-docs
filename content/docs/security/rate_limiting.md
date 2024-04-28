# Rate Limiting

AdonisJS provides a first-party package for implementing rate limits in your web application or the API server. The rate limiter provides `redis`, `mysql`, `postgresql` and `memory` as the storage options, with the ability to [create custom storage providers](#creating-a-custom-storage-provider).

The `@adonisjs/limiter` package is built on top of the [node-rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible) package, which provides one of the fastest rate-limiting API and uses atomic increments to avoid race conditions.

## Installation

Install and configure the package using the following command :

```sh
node ace add @adonisjs/limiter
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `@adonisjs/limiter` package using the detected package manager.

2. Registers the following service provider inside the `adonisrc.ts` file.
    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/limiter/limiter_provider')
      ]
    }
    ```

3. Create the `config/limiter.ts` file.

4. Create the `start/limiter.ts` file. This file is used to define HTTP throttle middleware.

5. Define the following environment variable alongside its validation inside the `start/env.ts` file.
   ```ts
   LIMITER_STORE=redis
   ```

6. Optionally, create the database migration for the `rate_limits` table if using the `database` store.

:::

## Configuration
The configuration for the rate limiter is stored within the `config/limiter.ts` file. 

See also: [Rate limiter config stub](https://github.com/adonisjs/limiter/blob/main/stubs/config/limiter.stub)

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

The `default` store to use for applying rate limits. The store is defined within the same config file under the `stores` object.

</dd>

<dt>

stores

</dt>

<dd>

A collection of stores you plan to use within your application. We recommend always configuring the `memory` store that could be used during testing.

</dd>

</dl>

---

### Environment variables
The default limiter is defined using the `LIMITER_STORE` environment variable, and therefore, you can switch between different stores in different environments. For example, use the `memory` store during testing and the `redis` store for development and production.

Also, the environment variable must be validated to allow one of the pre-configured stores. The validation is defined inside the `start/env.ts` file using the `Env.schema.enum` rule.

```ts
{
  LIMITER_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),
}
```

### Shared options
Following is the list of options shared by all the bundled stores.

<dl>


<dt>

keyPrefix

</dt>

<dd>

Define the prefix for the keys stored inside the database store. The database store ignores the `keyPrefix` since different database tables can be used to isolate data.

</dd>

<dt>

execEvenly

</dt>

<dd>

The `execEvenly` option adds a delay when throttling the requests so that all requests are exhausted at the end of the provided duration.

For example, if you allow a user to make **10 requests/min**, all requests will have an artificial delay, so the tenth request finishes at the end of the 1 minute. Read the [smooth out traffic peaks](https://github.com/animir/node-rate-limiter-flexible/wiki/Smooth-out-traffic-peaks) article on `rate-limiter-flexible` repo to learn more about the `execEvenly` option.

</dd>

<dt>

inMemoryBlockOnConsumed

</dt>

<dd>

Define the number of requests after which the key should be blocked within memory. For example, you allow a user to make **10 requests/min**, and they have consumed all the requests within the first 10 seconds.

However, they continue to make requests to the server, and therefore, the rate limiter has to check with the database before denying the request.

To reduce the load on the database, you can define the number of requests, after which we should stop querying the database and block the key within the memory.

```ts
{
  duration: '1 minute',
  requests: 10,

  /**
   * After 12 requests, block the key within the
   * memory and stop consulting the database.
   */
  inMemoryBlockOnConsumed: 12,
}
```

</dd>

<dt>

inMemoryBlockDuration

</dt>

<dd>

The duration for which to block the key within memory. This option will reduce the load on the database since the backend stores will first check within memory to see if a key is blocked.

```ts
{
  inMemoryBlockDuration: '1 min'
}
```

</dd>

</dl>

---


### Redis store
The `redis` store has a peer dependency on the `@adonisjs/redis` package; therefore, you must configure this package before using the redis store.

Following is the list of options the redis store accepts (alongside the shared options).

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

The `connectionName` property refers to a connection defined within the `config/redis.ts` file. We recommend using a separate redis database for the limiter.

</dd>

<dt>

rejectIfRedisNotReady

</dt>

<dd>

Reject the rate-limiting requests when the status of the Redis connection is not `ready.` 

</dd>

</dl>

---

### Database store
The `database` store has a peer dependency on the `@adonisjs/lucid` package, and therefore, you must configure this package before using the Database store.

Following is the list of options the database store accepts (alongside the shared options).

:::note

Only MySQL and PostgreSQL databases can be used with the database store.

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

Reference to the database connection defined within the `config/database.ts` file. If not defined, we will use the default database connection.

</dd>

<dt>

dbName

</dt>

<dd>

The database to use for making SQL queries. We try to infer the value of `dbName` from the connection config defined within the `config/database.ts` file. However, if using a connection string, you must supply the database name via this property.

</dd>

<dt>

tableName

</dt>

<dd>

The database table to use to store rate limits. 

</dd>

<dt>

schemaName

</dt>

<dd>

The schema to use for making SQL queries (PostgreSQL only).

</dd>

<dt>

clearExpiredByTimeout

</dt>

<dd>

When enabled, the database store will clear expired keys every 5 minutes. Do note that only keys that have been expired for more than 1 hour will be cleared.

</dd>

</dl>


## Throttling HTTP requests
Once the limiter has been configured, you may create HTTP throttle middleware using the `limiter.define` method. The `limiter` service is a singleton instance of the [LimiterManager](https://github.com/adonisjs/limiter/blob/main/src/limiter_manager.ts) class created using the config defined within the `config/limiter.ts` file.

If you open the `start/limiter.ts` file, you will find a pre-defined global throttle middleware you can apply on a route or a group of routes. Similarly, you can create as many throttle middleware as you need in your application.

In the following example, the global throttle middleware allows users to make **10 requests/min** based on their IP address.

```ts
// title: start/limiter.ts
import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})
```

You can apply the `throttle` middleware to a route as follows.

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

### Dynamic rate limiting

Let's create another middleware to protect an API endpoint. This time, we will apply dynamic rate limits based on the authentication status of a request.

```ts
// title: start/limiter.ts
export const apiThrottle = limiter.define('api', (ctx) => {
  /**
   * Allow logged-in users to make 100 requests by
   * their user ID
   */
  if (ctx.auth.user) {
    return limiter
      .allowRequests(100)
      .every('1 minute')
      .usingKey(`user_${ctx.auth.user.id}`)
  }

  /**
   * Allow guest users to make 10 requests by ip address
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

### Switching the backend store
You can use a specific backend store with throttle middleware using the `store` method. For example:

```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  .store('redis')
  // highlight-end
```


### Using a custom key
By default, the requests are rate-limited by the user's IP Address. However, you can specify a custom key using the `usingKey` method.

```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  .usingKey(`user_${ctx.auth.user.id}`)
  // highlight-end
```

### Blocking user
You may block a user for a specified duration if they continue to make requests even after exhausting their quota using the `blockFor` method. The method accepts the duration in seconds or the time expression.

```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  /**
   * Will be blocked for 30mins, if they send more than
   * 10 requests under one minute
   */
  .blockFor('30 mins')
  // highlight-end
```

## Handling ThrottleException
The throttle middleware throws the [E_TOO_MANY_REQUESTS](../api-references/exceptions.md#e_too_many_requests) exception when the user has exhausted all the requests within the specified timeframe. The exception will be automatically converted to an HTTP response using the following content negotiation rules.

- HTTP requests with the `Accept=application/json` header will receive an array of error messages. Each array element will be an object with the message property.

- HTTP requests with the `Accept=application/vnd.api+json` header will receive an array of error messages formatted per the JSON API spec.

- All other requests will receive a plain text response message. However, you may use [status pages](../basics/exception_handling.md#status-pages) to show a custom error page for limiter errors.

You may also self-handle the error within the [global exception handler](../basics/exception_handling.md#handling-exceptions).

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

### Customizing the error message
Instead of handling the exception globally, you may customize the error message, status, and response headers using the `limitExceeded` hook.

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

### Using translations for the error message
If you have configured the [@adonisjs/i18n](../digging_deeper/i18n.md) package, you may define the translation for the error message using the `errors.E_TOO_MANY_REQUESTS` key. For example:

```json
// title: resources/lang/fr/errors.json
{
  "E_TOO_MANY_REQUESTS": "Trop de demandes"
}
```

Finally, you can define a custom translation key using the `error.t` method.

```ts
limitExceeded((error) => {
  error.t('errors.rate_limited', {
    limit: error.response.limit,
    remaining: error.response.remaining,
  })
})
```

## Direct usage
Alongside throttling HTTP requests, you may also use the limiter to apply rate limits in other parts of your application. For example, block a user during login if they provide invalid credentials multiple times. Or limit the number of concurrent jobs a user can run.

### Creating limiter

Before you can apply rate limiting on an action, you must get an instance of the [Limiter](https://github.com/adonisjs/limiter/blob/main/src/limiter.ts) class using the `limiter.use` method. The `use` method accepts the name of the backend store and the following rate-limiting options.

- `requests`: The number of requests to allow for a given duration.
- `duration`: The duration in seconds or a [time expression](../api-references/helpers.md#seconds) string.
- `block (optional)`: The duration for which to block the key after all the requests have been exhausted.
- `inMemoryBlockOnConsumed (optional)`: See [shared options](#shared-options)
- `inMemoryBlockDuration (optional)`: See [shared options](#shared-options)

```ts
import limiter from '@adonisjs/limiter/services/main'

const reportsLimiter = limiter.use('redis', {
  requests: 1,
  duration: '1 hour'
})
```

Omit the first parameter if you want to use the default store. For example:

```ts
const reportsLimiter = limiter.use({
  requests: 1,
  duration: '1 hour'
})
```

### Applying rate limit on an action

Once you have created a limiter instance, you can use the `attempt` method to apply rate limiting on an action. 
The method accepts the following parameters.

- A unique key to use for rate limiting.
- The callback function to be executed until all the attempts have been exhausted.

The `attempt` method returns the result of the callback function (if it is executed). Otherwise, it returns `undefined`.

```ts
const key = 'user_1_reports'

/**
 * Attempt to run an action for the given key.
 * The result will be the callback function return
 * value or undefined if no callback was executed.
 */ 
const executed = reportsLimiter.attempt(key, async () => {
  await generateReport()
  return true
})

/**
 * Notify users that they have exceeded the limit
 */
if (!executed) {
  const availableIn = await reportsLimiter.availableIn(key)
  return `Too many requests. Try after ${availableIn} seconds`
}

return 'Report generated'
```

### Preventing too many login failures
Another example of direct usage could be to disallow an IP Address from making multiple invalid attempts on a login form.

In the following example, we use the `limiter.penalize` method to consume one request whenever the user provides invalid credentials and block them for 20 minutes after all the attempts have been exhausted.

The `limiter.penalize` method accepts the following arguments.

- A unique key to use for rate limiting.
- The callback function to be executed. One request will be consumed if the function throws an error.

The `penalize` method returns the result of the callback function or an instance of the `ThrottleException`. You can use the exception to find the duration remaining till the next attempt.

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'

export default class SessionController {
  store({ request, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'passwords'])

    /**
     * Create a limiter
     */
    const loginLimiter = limiter.use({
      requests: 5,
      duration: '1 min',
      blockDuration: '20 mins'
    })

    /**
     * Use IP address + email combination. This ensures if an 
     * attacker is misusing emails; we do not block actual
     * users from logging in and only penalize the attacker
     * IP address.
     */
    const key = `login_${request.ip()}_${email}`

    /**
     * Wrap User.verifyCredentials inside the "penalize" method, so
     * that we consume one request for every invalid credentials
     * error
     */
    const [error, user] = await loginLimiter.penalize(key, () => {
      return User.verifyCredentials(email, password)
    })

    /**
     * On ThrottleException, redirect the user back with a
     * custom error message
     */
    if (error) {
      session.flashAll()
      session.flashError({
        E_TOO_MANY_REQUESTS: `Too many login requests. Try again after ${error.response.availableIn} seconds`
      })
      return response.redirect().back()
    }

    /**
     * Otherwise, login the user
     */
  }
}
```

## Manually consuming requests
Alongside the `attempt` and the `penalize` methods, you may interact with the limiter directly to check the remaining requests and manually consume them.

In the following example, we use the `remaining` method to check if a given key has consumed all the requests. Otherwise, use the `increment` method to consume one request.

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

You might run into a race condition in the above example between calling the `remaining` and the `increment` methods. Therefore, you may want to use the `consume` method instead. The `consume` method will increment the requests count and throw an exception if all the requests have been consumed.

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

## Blocking keys
Alongside consuming requests, you may block a key for longer if a user continues to make requests after exhausting all the attempts.

The blocking is performed by the `consume`, `attempt`, and the `penalize` methods automatically when you create a limiter instance with `blockDuration` option. For example:

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
 * A user can make 10 requests in a minute. However, if
 * they send the 11th request, we will block the key
 * for 30 mins.
 */ 
await requestLimiter.consume('a_unique_key')

/**
 * Same behavior as consume
 */
await requestLimiter.attempt('a_unique_key', () => {
})

/**
 * Allow 10 failures and then block the key for 30 mins.
 */
await requestLimiter.penalize('a_unique_key', () => {
})
```

Finally, you may use the `block` method to block a key for a given duration.

```ts
const requestsLimiter = limiter.use({
  requests: 10,
  duration: '1 minute',
})

await requestsLimiter.block('a_unique_key', '30 mins')
```

## Resetting attempts
You may use one of the following methods to decrease the number of requests or delete the entire key from the storage.

The `decrement` method reduces the request count by 1, and the `delete` method deletes the key. Note that the `decrement` method is not atomic and might set the requests count to `-1` when concurrency is too high.

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
   * Decrement the consumed requests after we are done
   * processing the job. This will allow other workers
   * to use the slot.
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

## Testing
If you use a single (i.e., default) store for rate limiting, you may want to switch to the `memory` store during testing by defining the `LIMITER_STORE` environment variable inside the `.env.test` file.

```dotenv
// title: .env.test
LIMITER_STORE=memory
```

You may clear the rate-limiting storage between tests using the `limiter.clear` method. The `clear` method accepts an array of store names and flushes the database. 

When using Redis, it is recommended to use a separate database for the rate limiter. Otherwise, the `clear` method will flush the entire DB, and this might impact other parts of the applications.

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

Alternatively, you can call the `clear` method without any arguments, and all configured stores will be cleared.

```ts
test.group('Reports', (group) => {
  group.each.setup(() => {
    // highlight-start
    return () => limiter.clear()
    // highlight-end
  })
})
```

## Creating a custom storage provider
A custom storage provider must implement the [LimiterStoreContract](https://github.com/adonisjs/limiter/blob/main/src/types.ts#L163) interface and define the following properties/methods.

You may write the implementation inside any file/folder. A service provider is not needed to create a custom store.

```ts
import string from '@adonisjs/core/helpers/string'
import { LimiterResponse } from '@adonisjs/limiter'
import {
  LimiterStoreContract,
  LimiterConsumptionOptions
} from '@adonisjs/limiter/types'

/**
 * A custom set of options you want to accept.
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
   * Consume one request for the given key. This method
   * should throw an error when all requests have been
   * already consumed.
   */
  async consume(key: string | number): Promise<LimiterResponse> {
  }

  /**
   * Consume one request for the given key, but do not throw an
   * error when all requests have been consumed.
   */
  async increment(key: string | number): Promise<LimiterResponse> {}

  /**
   * Reward one request to the given key. If possible, do not set
   * the requests count to a negative value.
   */
  async decrement(key: string | number): Promise<LimiterResponse> {}

  /**
   * Block a key for the specified duration.
   */ 
  async block(
    key: string | number,
    duration: string | number
  ): Promise<LimiterResponse> {}
  
  /**
   * Set the number of consumed requests for a given key. The duration
   * should be inferred from the config if no explicit duration
   * is provided.
   */ 
  async set(
    key: string | number,
    requests: number,
    duration?: string | number
  ): Promise<LimiterResponse> {}

  /**
   * Delete the key from the storage
   */
  async delete(key: string | number): Promise<boolean> {}

  /**
   * Flush all keys from the database
   */
  async clear(): Promise<void> {}

  /**
   * Get a limiter response for a given key. Return `null` if the
   * key does not exist.
   */
  async get(key: string | number): Promise<LimiterResponse | null> {}
}
```

### Defining the config helper

Once you have written the implementation, you must create a config helper to use the provider inside the `config/limiter.ts` file. The config helper should return a `LimiterManagerStoreFactory` function.

You may write the following function within the same file as the `MongoDbLimiterStore` implementation.

```ts
import { LimiterManagerStoreFactory } from '@adonisjs/limiter/types'

/**
 * Config helper to use the mongoDb store
 * inside the config file
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

### Using the config helper

Once done, you may use the `mongoDbStore` helper as follows.

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

### Wrapping rate-limiter-flexible drivers
If you are planning to wrap an existing driver from the [node-rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible?tab=readme-ov-file#docs-and-examples) package, then you may use the [RateLimiterBridge](https://github.com/adonisjs/limiter/blob/main/src/stores/bridge.ts) for the implementation.

Let's re-implement the same `MongoDbLimiterStore` using the bridge this time.

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
   * Self-implement the clear method. Ideally, use the
   * config.client to issue a delete query
   */
  async clear() {}
}
```
