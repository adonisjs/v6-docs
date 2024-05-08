---
summary: Use Redis inside your AdonisJS applications using the `@adonisjs/redis` package. 
---

# Redis

You can use Redis inside your AdonisJS applications using the `@adonisjs/redis` package. The package is a thin wrapper on top of [ioredis](https://github.com/redis/ioredis) with better DX around Pub/Sub and automatic management of multiple redis connections.

## Installation

Install and configure the package using the following command :

```sh
node ace add @adonisjs/redis
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `@adonisjs/redis` package using the detected package manager.

2. Registers the following service provider inside the `adonisrc.ts` file.

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/redis/redis_provider')
      ]
    }
    ```

3. Create `config/redis.ts` file. This file contains the connection configuration for your redis server.

4. Define following environment variables and their validation rules.

    ```dotenv
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    REDIS_PASSWORD=
    ```

:::


## Configuration

The configuration for the Redis package is stored inside the `config/redis.ts` file.

See also: [Config file stub](https://github.com/adonisjs/redis/blob/main/stubs/config/redis.stub)

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

The `connection` property defines the connection to use by default. When you run redis commands without choosing an explicit connection, they will be executed against the default connection.

</dd>

<dt>

connections

<dt>

<dd>

The `connections` property is a collection of multiple named connections. You can define one or more connections inside this object and switch between them using the `redis.connection()` method.

Every named connection config is identical to the [config accepted by ioredis](https://redis.github.io/ioredis/index.html#RedisOptions).

</dd>
</dl>

---

### Configuring clusters

The `@adonisjs/redis` package will create a [cluster connection](https://github.com/redis/ioredis#cluster) if you define an array of hosts inside the connection config. For example:

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

### Configuring sentinels
You can configure a redis connection to use sentinels by defining an array of sentinel nodes within the connection config. For example:

See also: [IORedis docs on Sentinels config](https://github.com/redis/ioredis?tab=readme-ov-file#sentinel)

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

## Usage

You can run redis commands using the `redis` service exported by the package. The redis service is a singleton object configured using the configuration you have defined inside the `config/redis.ts` file.

:::note

Consult the [ioredis](https://redis.github.io/ioredis/classes/Redis.html) documentation to view the list of available methods. Since we are a wrapper on top of IORedis, the commands API is identical.

:::

```ts
import redis from '@adonisjs/redis/services/main'

await redis.set('username', 'virk')
const username = await redis.get('username')
```

### Switching between connections
Commands executed using the `redis` service are invoked against the **default connection** defined inside the config file. However, you can execute commands on a specific connection by first getting an instance of it.

The `.connection()` method creates and caches a connection instance for the process's lifetime.

```ts
import redis from '@adonisjs/redis/services/main'

// highlight-start
// Get connection instance
const redisMain = redis.connection('main')
// highlight-end

await redisMain.set('username', 'virk')
const username = await redisMain.get('username')
```

### Quitting connections

The connections are long-lived, and you will get the same instance every time you call the `.connection()` method. You can quit the connection using the `quit` method. Use the `disconnect` method to end the connection forcefully.

```ts
import redis from '@adonisjs/redis/services/main'

await redis.quit('main') // Quit the main connection
await redis.disconnect('main') // Force quit the main connection
```

```ts
import redis from '@adonisjs/redis/services/main'

const redisMain = redis.connection('main')
redisMain.quit() // Quit using connection instance
redisMain.disconnect() // Force quit using connection instance
```

## Error handling

Redis connections can fail anytime during the lifecycle of your application. Therefore it is essential to capture the errors and have a retry strategy.

By default, AdonisJS will log the redis connection errors using the [application logger](../digging_deeper/logger.md) and retry a connection ten times before closing it permanently. The retry strategy is defined for every connection within the `config/redis.ts` file.

See also: [IORedis docs on auto reconnect](https://github.com/redis/ioredis#auto-reconnect)

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

You can disable the default error reporter using the `.doNotLogErrors` method. Doing so will remove the `error` event listener from the redis connection.

```ts
import redis from '@adonisjs/redis/services/main'

/**
 * Disable default error reporter
 */
redis.doNotLogErrors()

redis.on('connection', (connection) => {
  /**
   * Make sure always to have an error listener defined.
   * Otherwise, the app will crash
   */
  connection.on('error', (error) => {
    console.log(error)
  })
})
```

## Pub/Sub

Redis needs multiple connections to publish and subscribe to channels. The subscriber connection cannot perform operations other than subscribing to new channels/patterns and unsubscribing.

When using the `@adonisjs/redis` package, you do not have to create a subscriber connection manually; we will handle that for you. When you call the `subscribe` method for the first time, we will automatically create a new subscriber connection.

```ts
import redis from '@adonisjs/redis/services/main'

redis.subscribe('user:add', function (message) {
  console.log(message)
})
```

### API differences between IORedis and AdonisJS

When using `ioredis`, you must use two different APIs to subscribe to a channel and listen for new messages. However, with the AdonisJS wrapper, the `subscribe` method takes care of both.

:::caption{for="info"}
**With IORedis**
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
**With AdonisJS**
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

### Publishing messages

You can publish messages using the `publish` method. The method accepts the channel name as the first parameter and the data to publish as the second parameter.

```ts
redis.publish(
  'user:add',
  JSON.stringify({
    id: 1,
    username: 'virk',
  })
)
```

### Subscribing to patterns

You can subscribe to patterns using the `psubscribe` method. Similar to the `subscribe` method, it will create a subscriber connection (if one does not exist).

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

### Unsubscribing

You can unsubscribe from channels or patterns using the `unsubscribe` and `punsubscribe` methods.

```ts
await redis.unsubscribe('user:add')
await redis.punsubscribe('user:*add*')
```

## Using Lua scripts

You can register Lua Scripts as commands with the redis service, and they will be applied to all the connections.

See also: [IORedis docs on Lua Scripting](https://github.com/redis/ioredis#lua-scripting)

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

Once you have defined a command, you can execute it using the `runCommand` method. First, all the keys are defined, and then the arguments.

```ts
redis.runCommand(
  'release', // command name
  'jobs:completed', // key 1
  'jobs:running', // key 2
  '11023', // argv 1
  100 // argv 2
)
```

The same command can be executed on an explicit connection.

```ts
redis.connection('jobs').runCommand(
  'release', // command name
  'jobs:completed', // key 1
  'jobs:running', // key 2
  '11023', // argv 1
  100 // argv 2
)
```

Finally, you can also define commands with a specific connection instance. For example:

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

## Transforming arguments and replies

You can define the arguments transformer and the reply transformer using the `redis.Command` property. The API is identical to the [IORedis API](https://github.com/redis/ioredis#transforming-arguments--replies).

```ts
// title: Argument transformer
import redis from '@adonisjs/redis/services/main'

redis.Command.setArgumentTransformer('hmset', (args) => {
  if (args.length === 2) {
    if (args[1] instanceof Map) {
      // utils is an internal module of ioredis
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
// title: Reply transformer
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

## Events

Following is the list of events emitted by a Redis connection instance.

### connect / subscriber\:connect
The event is emitted when a connection is made. The `subscriber:connect` event is emitted when a subscriber connection is made.

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('connect', () => {})
  connection.on('subscriber:connect', () => {})
})
```

### wait
Emitted when the connection is in `wait` mode because the `lazyConnect` option is set inside the config. After executing the first command, the connection will be moved from the `wait` state.

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('wait', () => {})
})
```

### ready / subscriber\:ready
The event will be emitted immediately after the `connect` event unless you have enabled the `enableReadyCheck` flag inside the config. In that case, we will wait for the Redis server to report it is ready to accept commands.

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('ready', () => {})
  connection.on('subscriber:ready', () => {})
})
```

### error / subscriber\:error
The event is emitted when unable to connect to the redis server. See [error handling](#error-handling) to learn how AdonisJS handles connection errors.

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('error', () => {})
  connection.on('subscriber:error', () => {})
})
```

### close / subscriber\:close
The event is emitted when a connection is closed. IORedis might retry establishing a connection after emitting the `close` event, depending upon the retry strategy.

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('close', () => {})
  connection.on('subscriber:close', () => {})
})
```

### reconnecting / subscriber\:reconnecting
The event is emitted when trying to reconnect to the redis server after the `close` event.

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

### end / subscriber\:end
The event is emitted when the connection has been closed, and no further reconnections will be made. It should be the end of the connection lifecycle.

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('end', () => {})
  connection.on('subscriber:end', () => {})
})
```

### node\:added
The event is emitted when connected to a new cluster node (Applicable to cluster instances only).

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:added', () => {})
})
```

### node\:removed
The event is emitted when a cluster node is removed (Applicable to cluster instances only).

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:removed', () => {})
})
```

### node\:error
The event is emitted when unable to connect to a cluster node (Applicable to cluster instances only).

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:error', ({ error, address }) => {
    console.log(error, address)
  })
})
```

### subscription\:ready / psubscription\:ready
The event is emitted when a subscription on a given channel or a pattern has been established.

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

### subscription\:error / psubscription\:error
The event is emitted when unable to subscribe to a channel or a pattern.

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('subscription:error', () => {})
  connection.on('psubscription:error', () => {})
})
```
