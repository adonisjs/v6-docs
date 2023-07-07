# Testing

AdonisJS has in-built support for writing tests. You do not have to install additional packages or wire up your application to be ready for testing - All the hard work has already been done.

You can run the application tests using the following ace command.

```sh
node ace test
```

The tests are stored inside the `tests` directory and we further organize tests by their type. For example, the functional tests are stored inside the `tests/functional` directory, and the unit tests are stored inside the `tests/unit` directory.

Functional tests refer to outside-in testing in which you will make real HTTP requests to your application to test the functionality of a given flow or an endpoint. For example, you may have a collection of functional tests for creating a user.

Some communities might refer to functional tests as feature tests or end-to-end tests. AdonisJS is flexible about what you call them. We decided to settle on the term **functional tests**.

## Configuring the tests runner

AdonisJS uses [Japa](https://japa.dev/docs) for writing and running tests. Therefore, we recommend reading the Japa documentation to understand its APIs and configuration options better.

### Suites

The test suites are defined inside the `.adonisrc.json` file. By default, we register the `functional` and the `unit` test suites. If needed, you can remove the existing suites and start from scratch.

```json
{
  "tests": {
    "suites": [
      {
        "name": "functional",
        "files": ["tests/functional/**/*.spec.(js|ts)"]
      },
      {
        "name": "unit",
        "files": ["tests/unit/**/*.spec.(js|ts)"]
      }
    ]
  }
}
```

- A suite combines the suite's unique name and the file's glob pattern.
- When you run tests for a specific suite, files only related to that suite are imported.

You can configure a suite at runtime using the `configureSuite` hook defined inside the `tests/bootstrap.ts` file. For example, when running functional tests, you can register suite-level hooks to start the HTTP server.

```ts
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
```

### Runner hooks

Runner hooks are global actions you can run before and after all the tests. The hooks are defined using the `runnerHooks` property inside the `tests/boostrap.ts` file.

```ts
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => {
      console.log('running before all the tests')
    }
  ],
  teardown: [
    () => {
      console.log('running after all the tests')
    }
  ],
}
```

### Plugins

Japa has a plugin system you can use to extend its functionality. Plugins are registered inside the `tests/bootstrap.ts` file.

See also: [Creating Japa plugins](https://japa.dev/docs/creating-plugins)

```ts
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app)
]
```

### Reporters

Reporters are used for reporting/displaying the progress of tests as they run. The reporters are registered inside the `tests/bootstrap.ts` file.

See also: [Creating Japa reporters](https://japa.dev/docs/creating-reporters)

```ts
export const reporters: Config['reporters'] = {
  activated: ['spec']
}
```

## Creating tests

You may create a new test using the `make:test` command. The command needs the suite's name to create the test file.

```sh
node ace make:test posts/create --suite=functional
```

The file will be created inside the directory configured using the `files` glob property.

## Writing tests

The tests are defined using the `test` method imported from the `@japa/runner` package. A test accepts a title as the first parameter and the implementation callback as the second parameter.

In the following example, we create a new user account and use the [`assert`](https://japa.dev/docs/plugins/assert) object to ensure the password hashed correctly.

```ts
import { test } from '@japa/runner'

import User from '#models/User'
import hash from '@adonisjs/core/services/hash'

test('hashes user password when creating a new user', async ({ assert }) => {
  const user = new User()
  user.password = 'secret'
  
  await user.save()
  
  assert.isTrue(hash.isValidHash(user.password))
  assert.isTrue(await hash.verify(user.password, 'secret'))
})
```

### Using test groups

Test groups are created using the `test.group` method. Groups add structure to your tests and allow you to run [lifecycle hooks](https://japa.dev/docs/grouping-tests#hooks) around your tests.

Continuing the previous example, let's move the password hashing test inside a group. 

```ts
import { test } from '@japa/runner'

import User from '#models/User'
import hash from '@adonisjs/core/services/hash'

// highlight-start
test.group('creating user', () => {
// highlight-end
  test('hashes user password', async ({ assert }) => {
    const user = new User()
    user.password = 'secret'
    
    await user.save()
    
    assert.isTrue(hash.isValidHash(user.password))
    assert.isTrue(await hash.verify(user.password, 'secret'))
  })
// highlight-start
})
// highlight-end
```

If you have noticed, we remove the **"when creating a new user"** fragment from our test title. This is because the group title clarifies that all tests under this group are scoped to **creating a new user**.

### Lifecycle hooks

Lifecycle hooks are used to perform actions around tests. You can define hooks using the `group` object.

See also - [Japa docs for Lifecycle hooks](https://japa.dev/docs/lifecycle-hooks)

```ts
test.group('creating user', (group) => {
  // highlight-start
  group.each.setup(async () => {
    console.log('runs before every test')
  })

  group.each.teardown(async () => {
    console.log('runs after every test')
  })

  group.setup(async () => {
    console.log('runs once before all the tests')
  })

  group.teardown(async () => {
    console.log('runs once after all the tests')
  })
  // highlight-end

  test('hashes user password', async ({ assert }) => {
    const user = new User()
    user.password = 'secret'
    
    await user.save()
    
    assert.isTrue(hash.isValidHash(user.password))
    assert.isTrue(await hash.verify(user.password, 'secret'))
  })
})
```

### Next steps

Now that you know the basics of creating and writing tests. We recommend you explore the following topics in the Japa documentation.

- [Explore the `test` function API](https://japa.dev/docs/underlying-test-class)
- [Learn how to test asynchronous code effectively](https://japa.dev/docs/testing-async-code)
- [Using datasets to avoid repetitive tests](https://japa.dev/docs/datasets)

## Running tests

You may run tests using the `test` command. By default, the tests for all the suites are executed. However, you can run tests for a specific suite by passing the name.

```sh
node ace test
```

```sh
node ace test functional
node ace test unit
```

### Watching for file changes and re-running tests

You may use the `--watch` command to watch the file system and re-run tests. If a test file is changed, then tests inside the changed file will run. Otherwise, all tests will be re-run.

```sh
node ace test --watch
```

### Filtering tests

You can apply filters using the command-line flags when running the tests. Following is the list of available options.

See also: [Japa filtering tests guide](https://japa.dev/docs/filtering-tests)

:::tip

**Using VSCode?** Use the [Japa extension](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode) to run selected tests within your code editor using keyboard shortcuts or the activity sidebar.

:::

| Flag | Description |
|------|-----------|
| `--tests` | Filter test by the test title. This filter matches against the exact test title. |
| `--files` | Filter tests by subset of test file name. The match is performed against the end of the filename without `.spec.ts`. You can run tests for a complete folder using the wildcard expression. `folder/*` |
| `--groups` | Filter test by group name. This filter matches against the exact group name. |
| `--tags` | Filter tests by tags. You can prefix the tag name with tilde `~` to ignore tests with the given tag |
| `--matchAll` | By default, Japa will run tests that matches any of the mentioned tags. If you want all tags to match, then use the `--matchAll` flag |

### Force exiting tests

Japa waits for the process to gracefully shut down after completing all the tests. The graceful shutdown process means exiting all long-lived connections and emptying the Node.js event loop.

If needed, you can force Japa to exit the process and not wait for a graceful shutdown using the `--force-exit` flag.

```sh
node ace test --force-exit
```

### Retrying tests
You can retry failing tests for multiple times using the `--retries` flag. The flag will be applied to all the tests without an explicit retries count defined at the test level.

```sh
# Retry failing tests 2 times
node ace test --retries=2
```

### Running failed tests from the last run
You can re-run tests failed from the last run using the `--failed` commandline flag.

```sh
node ace test --failed
```

### Switching between reporters
Japa allows you register multiple test reporters inside the config file, but does not activate them by default. You can activate reporters either inside the config file, or using the `--reporter` commandline flag.

```sh
# Activate spec reporter
node ace test --reporter=spec

# Activate spec and json reporters
node ace test --reporter=spec,json
```

You may also activate reporters inside the config file.

```ts
export const reporters: Config['reporters'] = {
  activated: ['spec', 'json']
}
```

## Environment variables

You may use the `.env.test` file to define the environment variables required during testing. The values inside the `.env.test` takes precedence over those inside the `.env` file.

The `SESSION_DRIVER` during testing must be set to `memory`.

```dotenv
// title: .env.test
SESSION_DRIVER=memory
MAIL_DRIVER=memory
```
