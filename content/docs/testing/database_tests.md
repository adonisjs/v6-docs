# Database tests

Database tests refer to testing how your application interacts with the database. This includes testing what is written to the database, how to run migrations before the tests, and how to keep the database clean between tests.

## Migrating the database

Before executing your tests that interact with the database, you would want to run your migrations first. We have two hooks available in the `testUtils` service for that, which you can configure inside the `tests/bootstrap.ts` file.

### Reset database after each run cycle

The first option we have is `testUtils.db().migrate()`. This hook will first run all your migrations, and then rollback everything.

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().migrate(),
  ],
  teardown: [],
}
```

By configuring the hook here, what will happen is:

- Before running our tests, the migrations will be executed.
- At the end of our tests, the database will be rolled back.

So, each time we run our tests, we will have a fresh and empty database.

### Truncate tables after each run cycle

Resetting the database after each run cycle is a good option, but it can be slow if you have a lot of migrations. Another option is to truncate the tables after each run cycle. This option will be faster, as the migrations will only be executed once : the very first time you run your tests on a fresh database.


At the end of each run cycle, the tables will just be truncated, but our schema will be kept. So, the next time we run our tests, we will have an empty database, but the schema will already be in place, so there's no need to run every migration again.

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().truncate(),
  ],
}
```

## Seeding the database

If you need to seed your database, you can use the `testUtils.db().seed()` hook. This hook will run all your seeds before running your tests.

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().seed(),
  ],
}
```

## Keeping the database clean between tests

### Global transaction

When running tests, you may want to keep your database clean between each test. For that, you can use the `testUtils.db().beginGlobalTransaction()` hook. This hook will start a transaction before each test and roll it back at the end of the test.

```ts
// title: tests/unit/user.spec.ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('User', (group) => {
  group.each.setup(() => testUtils.db().beginGlobalTransaction())
})
```

Note that if you are using any transactions in your tested code, this will not work as transactions cannot be nested. In this case, you can use the `testUtils.db().migrate()` or `testUtils.db().truncate()` hook instead.

### Truncate tables

As mentioned above, the global transaction will not work if you are using transactions in your tested code. In this case, you can use the `testUtils.db().truncate()` hook. This hook will truncate all your tables after each test.

```ts
// title: tests/unit/user.spec.ts
import { test } from '@japa/runner'

test.group('User', (group) => {
  group.each.setup(() => testUtils.db().truncate())
})
```







