# Logger

AdonisJS has an inbuilt logger that supports writing logs to a **file**, **standard output**, and **external logging services**. Under the hood, we use [pino](https://getpino.io/#/). Pino is one of the fastest logging libraries in the Node.js ecosystem that generates logs in the [NDJSON format](http://ndjson.org/).

## Usage

To begin, you may import the Logger service to write logs from anywhere inside your application.  The logs are written to `stdout` and will appear on the terminal.

```ts
import logger from '@adonisjs/core/services/logger'

logger.info('this is an info message')
logger.error({ err: error }, 'Something went wrong')
```

It is recommended to use the `ctx.logger` property during HTTP requests. The HTTP context holds an instance of a request-aware logger that adds the current request ID to every log statement.

```ts
import router from '@adonisjs/core/services/router'
import User from '#models/user'

router.get('/users/:id', ({ logger, params }) => {
  logger.info('Fetching user by id %s', params.id)
  const user = await User.find(params.id)
})
```

## Configuration

The config for the logger is stored within the `config/logger.ts` file. By default, only one logger is configured. However, you can define config for multiple loggers if you want to use more than one in your application.


```ts
// title: config/logger.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/core/logger'

export default defineConfig({
  default: 'app',
  
  loggers: {
    app: {
      enabled: true,
      name: Env.get('APP_NAME'),
      level: Env.get('LOG_LEVEL', 'info')
    },
  }
})
```

<dl>
<dt>

default

<dt>

<dd>

The `default` property is a reference to one of the configured loggers within the same file under the `loggers` object. 

The default logger is used to write logs unless you select a specific logger when using the logger API.

</dd>

<dt>

loggers

<dt>

<dd>

The `loggers` object is a key-value pair to configure multiple loggers. The key is the name of the logger, and the value is the config object accepted by [pino](https://getpino.io/#/docs/api?id=options)

</dd>
</dl>



## Transport targets
Transports in pino play an essential role as they write logs to a destination. You can configure [multiple targets](https://getpino.io/#/docs/api?id=transport-object) within your config file, and pino will deliver logs to all of them. Each target can also specify a level from which it wants to receive the logs.

:::note

If you have not defined the `level` within the target configuration, the configured targets will inherit it from the parent logger.

This behavior is different from pino. In Pino, targets do not inherit levels from the parent logger.

:::

```ts
{
  loggers: {
    app: {
      enabled: true,
      name: Env.get('APP_NAME'),
      level: Env.get('LOG_LEVEL', 'info'),
      
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

File target

<dt>

<dd>

The `pino/file` target writes logs to a file descriptor. The `destination = 1` means write logs to `stdout` (this is a standard [unix convention for file descriptors](https://en.wikipedia.org/wiki/File_descriptor)).

</dd>

<dt>

Pretty target

<dt>

<dd>

The `pino-pretty` target uses the [pino-pretty npm module](http://npmjs.com/package/pino-pretty) to pretty-print logs to a file descriptor.

</dd>
</dl>

## Defining targets conditionally

It is common to register targets based on the environment in which the code is running. For example, using the `pino-pretty` target in development and the `pino/file` target in production.

As shown below, constructing the `targets` array with conditionals makes the config file look untidy.

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

Therefore, you can use the `targets` helper to define conditional array items using a fluent API. We express the same conditionals in the following example using the `targets.pushIf` method.

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

To further simplify the code, you can define the config object for the `pino/file` and `pino-pretty` targets using the `targets.pretty` and `targets.file` methods.

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

## Using multiple loggers

AdonisJS has first-class support for configuring multiple loggers. The logger's unique name and config are defined within the `config/logger.ts` file.

```ts
export default defineConfig({
  default: 'app',
  
  loggers: {
    // highlight-start
    app: {
      enabled: true,
      name: Env.get('APP_NAME'),
      level: Env.get('LOG_LEVEL', 'info')
    },
    payments: {
      enabled: true,
      name: 'payments',
      level: Env.get('LOG_LEVEL', 'info')
    },
    // highlight-start
  }
})
```

Once configured, you can access a named logger using the `logger.use` method.

```ts
import logger from '@adonisjs/core/services/logger'

logger.use('payments')
logger.use('app')

// Get an instance of the default logger
logger.use()
```

## Dependency injection

When using Dependency injection, you can type-hint the `Logger` class as a dependency, and the IoC container will resolve an instance of the default logger defined inside the config file.

If the class is constructed during an HTTP request, then the container will inject the request-aware instance of the Logger.

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

## Logging methods

The Logger API is nearly identical to Pino, except the AdonisJS logger is not an instance of an Event emitter (whereas Pino is). Apart from that, the logging methods have the same API as pino.

```ts
import logger from '@adonisjs/core/services/logger'

logger.trace(config, 'using config')
logger.debug('user details: %o', { username: 'virk' })
logger.info('hello %s', 'world')
logger.warn('Unable to connect to database')
logger.error({ err: Error }, 'Something went wrong')
logger.fatal({ err: Error }, 'Something went wrong')
```

An additional merging object can be passed as the first argument. Then, the object properties are added to the output JSON.

```ts
logger.info({ user: user }, 'Fetched user by id %s', user.id)
```

To display errors, you can [use the `err` key](https://getpino.io/#/docs/api?id=serializers-object) to specify the error value.

```ts
logger.error({ err: error }, 'Unable to lookup user')
```

## Logging conditionally

The logger produces logs for and above the level configured in the config file. For example, if the level is set to `warn`, the logs for the `info`, `debug`, and the `trace` levels will be ignored.

If computing data for a log message is expensive, you should check if a given log level is enabled before computing the data.

```ts
import logger from '@adonisjs/core/services/logger'

if (logger.isLevelEnabled('debug')) {
  const data = await getLogData()
  logger.debug(data, 'Debug message')
}
```

You may express the same conditional using the `ifLevelEnabled` method. The method accepts a callback as the 2nd argument, which gets executed when the specified logging level is enabled.

```ts
logger.ifLevelEnabled('debug', async () => {
  const data = await getLogData()
  logger.debug(data, 'Debug message')
})
```

## Child logger

A child logger is an isolated instance that inherits the config and bindings from the parent logger.

An instance of the child logger can be created using the `logger.child` method. The method accepts bindings as the first argument and an optional config object as the second argument.

```ts
import logger from '@adonisjs/core/services/logger'

const requestLogger = logger.child({ requestId: ctx.request.id() })
```

The child logger can also log under a different logging level.

```ts
logger.child({}, { level: 'warn' })
```

## Pino statics

[Pino static](https://getpino.io/#/docs/api?id=statics) methods and properties are exported by the `@adonisjs/core/logger` module.

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

## Writing logs to a file

Pino ships with a `pino/file` target, which you can use to write logs to a file. Within the target options, you can specify the log file destination path.

```ts
app: {
  enabled: true,
  name: Env.get('APP_NAME'),
  level: Env.get('LOG_LEVEL', 'info')

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

### File rotation
Pino does not have inbuilt support for file rotation, and therefore, you either have to use a system-level tool like [logrotate](https://getpino.io/#/docs/help?id=rotate) or make use of a third-party package like [pino-roll](https://github.com/feugy/pino-roll).

```sh
npm i pino-roll
```

```ts
app: {
  enabled: true,
  name: Env.get('APP_NAME'),
  level: Env.get('LOG_LEVEL', 'info')

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


## Hiding sensitive values

Logs can become the source for leaking sensitive data. Therefore, it is recommended to observe your logs and remove/hide sensitive values from the output.

In Pino, you can use the `redact` option to hide/remove sensitive key-value pairs from the logs. Under the hood, the [fast-redact](https://github.com/davidmarkclements/fast-redact) package is used, and you can consult its documentation to view available expressions.

```ts
// title: config/logger.ts
app: {
  enabled: true,
  name: Env.get('APP_NAME'),
  level: Env.get('LOG_LEVEL', 'info')

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

By default, the value is replaced with the `[Redacted]` placeholder. You can define a custom placeholder or remove the key-value pair.

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

### Using the Secret data type
An alternative to redaction is to wrap sensitive values inside the Secret class. For example:

See also: [Secret class usage docs](../reference/helpers.md#secret)

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
