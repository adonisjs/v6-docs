---
summary: Learn how to monitor your application in production and ensure it is running smoothly
---

# Health checks

Health checks are performed to ensure that your application is in a healthy state while running in production. This may include monitoring the **available disk space** on the server, the **memory consumed by your application**, or **testing the database connection**.

AdonisJS provides a handful of built-in [health checks](#available-health-checks) and the ability to create and register [custom health checks](#creating-a-custom-health-check).

## Configuring health checks

You may configure health checks in your application by executing the following command. The command will create a `start/health.ts` file and configures health checks for **memory usage** and **used disk space**. Feel free to modify this file and remove/add additional health checks.

:::note

Make sure you have installed `@adonisjs/core@6.12.1` before using the following command.

:::

```sh
node ace configure health_checks
```

```ts
// title: start/health.ts
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
])
```

## Exposing an endpoint

A common approach for performing health checks is to expose an HTTP endpoint that an external monitoring service can ping to collect the health check results.

So, let's define a route within the `start/routes.ts` file and bind the `HealthChecksController` to it. The `health_checks_controller.ts` file is created during the initial setup and lives inside the `app/controllers` directory.

```ts
// title: start/kernel.ts
import router from '@adonisjs/core/services/router'
const HealthChecksController = () => import('#controllers/health_checks_controller')

router.get('/health', [HealthChecksController])
```

### Sample report

The `healthChecks.run` method will execute all the checks and return a detailed [report as a JSON object](https://github.com/adonisjs/health/blob/develop/src/types.ts#L36). The report has the following properties:

```json
{
  "isHealthy": true,
  "status": "warning",
  "finishedAt": "2024-06-20T07:09:35.275Z",
  "debugInfo": {
    "pid": 16250,
    "ppid": 16051,
    "platform": "darwin",
    "uptime": 16.271809083,
    "version": "v21.7.3"
  },
  "checks": [
    {
      "name": "Disk space check",
      "isCached": false,
      "message": "Disk usage is 76%, which is above the threshold of 75%",
      "status": "warning",
      "finishedAt": "2024-06-20T07:09:35.275Z",
      "meta": {
        "sizeInPercentage": {
          "used": 76,
          "failureThreshold": 80,
          "warningThreshold": 75
        }
      }
    },
    {
      "name": "Memory heap check",
      "isCached": false,
      "message": "Heap usage is under defined thresholds",
      "status": "ok",
      "finishedAt": "2024-06-20T07:09:35.265Z",
      "meta": {
        "memoryInBytes": {
          "used": 41821592,
          "failureThreshold": 314572800,
          "warningThreshold": 262144000
        }
      }
    }
  ]
}
```

<dl>

<dt>

isHealthy

</dt>

<dd>

A boolean to know if all the checks have passed. The value will be set to `false` if one or more checks fail.

</dd>

<dt>

status

</dt>

<dd>

Report status after performing all the checks. It will be one of the following.

- `ok`: All checks have passed successfully.
- `warning`: One or more checks have reported a warning.
- `error`: One or more checks have failed.

</dd>

<dt>

finishedAt

</dt>

<dd>

The DateTime at which the tests were completed.

</dd>

<dt>

checks

</dt>

<dd>

An array of objects containing the detailed report of all the performed checks.

</dd>

<dt>

debugInfo

</dt>

<dd>

Debug info can be used to identify the process and the duration for which it has been running. It includes the following properties.

- `pid`: The process ID.
- `ppid`: The process ID of the parent process managing your AdonisJS app process.
- `platform`: The platform on which the application is running.
- `uptime`: The duration (in seconds) for which the application is running.
- `version`: Node.js version.

</dd>

</dl>

### Protecting the endpoint
You may protect the `/health` endpoint from public access using either the auth middleware or creating a custom middleware that checks for a particular API secret inside the request header. For example:

```ts
import router from '@adonisjs/core/services/router'
const HealthChecksController = () => import('#controllers/health_checks_controller')

router
  .get('/health', [HealthChecksController])
  // insert-start
  .use(({ request, response }, next) => {
    if (request.header('x-monitoring-secret') === 'some_secret_value') {
      return next()
    }
    response.unauthorized({ message: 'Unauthorized access' })
  })
  // insert-end
```

## Available health checks

Following is the list of available health checks you can configure within the `start/health.ts` file.

### DiskSpaceCheck

The `DiskSpaceCheck` calculates the used disk space on your server and reports a warning/error when a certain threshold has been exceeded.

```ts
import { HealthChecks, DiskSpaceCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck()
])
```

By default, the warning threshold is set to 75%, and the failure threshold is set to 80%. However, you may also define custom thresholds.

```ts
export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck()
    // highlight-start
    .warnWhenExceeds(80) // warn when used over 80%
    .failWhenExceeds(90), // fail when used over 90%
  // highlight-end
])
```

### MemoryHeapCheck

The `MemoryHeapCheck` monitors the heap size reported by the [process.memoryUsage()](https://nodejs.org/api/process.html#processmemoryusage) method and reports a warning/error when a certain threshold has been exceeded.

```ts
import { HealthChecks, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new MemoryHeapCheck()
])
```

By default, the warning threshold is set to **250MB** and the failure threshold is set to **300MB**. However, you may define custom thresholds as well.

```ts
export const healthChecks = new HealthChecks().register([
  new MemoryHeapCheck()
    // highlight-start
    .warnWhenExceeds('300 mb')
    .failWhenExceeds('700 mb'),
  // highlight-end
])
```

### MemoryRSSCheck

The `MemoryRSSCheck` monitors the Resident Set Size reported by the [process.memoryUsage()](https://nodejs.org/api/process.html#processmemoryusage) method and reports a warning/error when a certain threshold has been exceeded.

```ts
import { HealthChecks, MemoryRSSCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new MemoryRSSCheck()
])
```

By default, the warning threshold is set to **320MB**, and the failure threshold is set to **350MB**. However, you may also define custom thresholds.

```ts
export const healthChecks = new HealthChecks().register([
  new MemoryRSSCheck()
    // highlight-start
    .warnWhenExceeds('600 mb')
    .failWhenExceeds('800 mb'),
  // highlight-end
])
```

### DbCheck
The `DbCheck` is provided by the `@adonisjs/lucid` package to monitor the connection with a SQL database. You can import and use it as follows.

```ts
// insert-start
import db from '@adonisjs/lucid/services/db'
import { DbCheck } from '@adonisjs/lucid/database'
// insert-end
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  // insert-start
  new DbCheck(db.connection()),
  // insert-end
])
```

Following is an example report from the database health check.

```json
// title: Report sample
{
  "name": "Database health check (postgres)",
  "isCached": false,
  "message": "Successfully connected to the database server",
  "status": "ok",
  "finishedAt": "2024-06-20T07:18:23.830Z",
  "meta": {
    "connection": {
      "name": "postgres",
      "dialect": "postgres"
    }
  }
}
```

The `DbCheck` class accepts a database connection for monitoring. Register this check multiple times for each connection if you want to monitor multiple connections. For example:

```ts
// title: Monitoring multiple connections
export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  // insert-start
  new DbCheck(db.connection()),
  new DbCheck(db.connection('mysql')),
  new DbCheck(db.connection('pg')),
  // insert-end
])
```

### DbConnectionCountCheck
The `DbConnectionCountCheck` monitors the active connections on the database server and reports a warning/error when a certain threshold has been exceeded. This check is only supported for **PostgreSQL** and **MySQL** databases.

```ts
import db from '@adonisjs/lucid/services/db'
// insert-start
import { DbCheck, DbConnectionCountCheck } from '@adonisjs/lucid/database'
// insert-end
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  new DbCheck(db.connection()),
  // insert-start
  new DbConnectionCountCheck(db.connection())
  // insert-end
])
```

Following is an example report from the database connection count health check.

```json
// title: Report sample
{
  "name": "Connection count health check (postgres)",
  "isCached": false,
  "message": "There are 6 active connections, which is under the defined thresholds",
  "status": "ok",
  "finishedAt": "2024-06-20T07:30:15.840Z",
  "meta": {
    "connection": {
      "name": "postgres",
      "dialect": "postgres"
    },
    "connectionsCount": {
      "active": 6,
      "warningThreshold": 10,
      "failureThreshold": 15
    }
  }
}
```

By default, the warning threshold is set to **10 connections**, and the failure threshold is set to **15 connections**. However, you may also define custom thresholds.

```ts
new DbConnectionCountCheck(db.connection())
  .warnWhenExceeds(4)
  .failWhenExceeds(10)
```

### RedisCheck
The `RedisCheck` is provided by the `@adonisjs/redis` package to monitor the connection with a Redis database (including Cluster). You can import and use it as follows.

```ts
// insert-start
import redis from '@adonisjs/redis/services/main'
import { RedisCheck } from '@adonisjs/redis'
// insert-end
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  // insert-start
  new RedisCheck(redis.connection()),
  // insert-end
])
```

Following is an example report from the database health check.

```json
// title: Report sample
{
  "name": "Redis health check (main)",
  "isCached": false,
  "message": "Successfully connected to the redis server",
  "status": "ok",
  "finishedAt": "2024-06-22T05:37:11.718Z",
  "meta": {
    "connection": {
      "name": "main",
      "status": "ready"
    }
  }
}
```

The `RedisCheck` class accepts a redis connection to monitor. Register this check multiple times for each connection if you want to monitor multiple connections. For example:

```ts
// title: Monitoring multiple connections
export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  // insert-start
  new RedisCheck(redis.connection()),
  new RedisCheck(redis.connection('cache')),
  new RedisCheck(redis.connection('locks')),
  // insert-end
])
```

### RedisMemoryUsageCheck
The `RedisMemoryUsageCheck` monitors the memory consumption of the redis server and reports a warning/error when a certain threshold has been exceeded.

```ts
import redis from '@adonisjs/redis/services/main'
// insert-start
import { RedisCheck, RedisMemoryUsageCheck } from '@adonisjs/redis'
// insert-end
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  new RedisCheck(redis.connection()),
  // insert-start
  new RedisMemoryUsageCheck(db.connection())
  // insert-end
])
```

Following is an example report from the redis memory usage health check.

```json
// title: Report sample
{
  "name": "Redis memory consumption health check (main)",
  "isCached": false,
  "message": "Redis memory usage is 1.06MB, which is under the defined thresholds",
  "status": "ok",
  "finishedAt": "2024-06-22T05:36:32.524Z",
  "meta": {
    "connection": {
      "name": "main",
      "status": "ready"
    },
    "memoryInBytes": {
      "used": 1109616,
      "warningThreshold": 104857600,
      "failureThreshold": 125829120
    }
  }
}
```

By default, the warning threshold is set to **100MB**, and the failure threshold is set to **120MB**. However, you may also define custom thresholds.

```ts
new RedisMemoryUsageCheck(db.connection())
  .warnWhenExceeds('200MB')
  .failWhenExceeds('240MB')
```

## Caching results

Health checks are performed every time you call the `healthChecks.run` method (aka visit the `/health` endpoint). You might want to ping the `/health` endpoint frequently, but avoid performing certain checks on every visit.

For example, monitoring disk space every minute is not very useful, but tracking memory every minute can be helpful.

Therefore, we allow you to cache the results of individual health checks when you register them. For example:

```ts
import {
  HealthChecks,
  MemoryRSSCheck,
  DiskSpaceCheck,
  MemoryHeapCheck,
} from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  // highlight-start
  new DiskSpaceCheck().cacheFor('1 hour'),
  // highlight-end
  new MemoryHeapCheck(), // do not cache
  new MemoryRSSCheck(), // do not cache
])
```

## Creating a custom health check

You may create a custom health check as a JavaScript class that adheres to the [HealthCheckContract](https://github.com/adonisjs/health/blob/develop/src/types.ts#L98) interface. You can define a health check anywhere inside your project or package and import it within the `start/health.ts` file to register it.

```ts
import { Result, BaseCheck } from '@adonisjs/core/health'
import type { HealthCheckResult } from '@adonisjs/core/types/health'

export class ExampleCheck extends BaseCheck {
  async run(): Promise<HealthCheckResult> {
    /**
     * The following checks are for reference purposes only
     */
    if (checkPassed) {
      return Result.ok('Success message to display')
    }
    if (checkFailed) {
      return Result.failed('Error message', errorIfAny)
    }
    if (hasWarning) {
      return Result.warning('Warning message')
    }
  }
}
```

As shown in the above example, you may use the [Result](https://github.com/adonisjs/health/blob/develop/src/result.ts) class to create Health check results. Optionally, you may merge meta-data for the result as follows.

```ts
Result.ok('Database connection is healthy').mergeMetaData({
  connection: {
    dialect: 'pg',
    activeCount: connections,
  },
})
```

### Registering custom health check
You may import your custom health check class within the `start/health.ts` file and register it by creating a new class instance.

```ts
// highlight-start
import { ExampleCheck } from '../app/health_checks/example.js'
// highlight-end

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck().cacheFor('1 hour'),
  new MemoryHeapCheck(),
  new MemoryRSSCheck(),
  // highlight-start
  new ExampleCheck()
  // highlight-end
])
```
