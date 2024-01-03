# Mocks and fakes

When testing your applications, you might want to mock or fake specific dependencies to prevent actual implementations from running. For example, you wish to refrain from emailing your customers when running tests and neither call third-party services like a payment gateway.

AdonisJS offers a few different APIs and recommendations using which you can fake, mock, or stub a dependency.

## Using the fakes API

Fakes are objects with working implementations explicitly created for testing. For example, The mailer module of AdonisJS has a fake implementation that you can use during testing to collect outgoing emails in memory and write assertions for them.

We provide fake implementations for the following container services. The fakes API is documented alongside the module documentation.

- [Emitter fake](../digging_deeper/emitter.md#faking-events-during-tests)
- [Hash fake](../security/hash.md#faking-hash-service-during-tests)
- [Fake mailer](../mail/fake_mailer.md)

## Dependency injection and fakes

If you use dependency injection in your application or use the [container to create class instances](../fundamentals/ioc_container.md), you can provide a fake implementation for a class using the `container.swap` method.

In the following example, we inject `UserService` to the `UsersController`.

```ts
import UserService from '#services/user_service'
import { inject } from '@adonisjs/core'

export default class UsersController {
  @inject()
  index(, service: UserService) {}
}
```

During testing, we can provide an alternate/fake implementation of the `UserService` class as follows.

```ts
import UserService from '#services/user_service'
import app from '@adonisjs/core/services/app'

test('get all users', async () => {
  // highlight-start
  class FakeService extends UserService {
    all() {
      return [{ id: 1, username: 'virk' }]
    }
  }
  
  /**
   * Swap `UserService` with an instance of
   * `FakeService`
   */  
  app.container.swap(UserService, () => {
    return new FakeService()
  })
  
  /**
   * Test logic goes here
   */
  // highlight-end
})
```

Once the test has been completed, you must restore the fake using the `container.restore` method.

```ts
app.container.restore(UserService)

// Restore all
app.container.restore()
```

## Mocks and stubs using Sinon.js

[Sinon](https://sinonjs.org/#get-started) is a mature, time-tested mocking library in the Node.js ecosystem. If you use mocks and stubs regularly, we recommend using Sinon, as it works great with TypeScript.

## Mocking network requests

If your application makes outgoing HTTP requests to third-party services, you can use [nock](https://github.com/nock/nock) during testing to mock the network requests.

Since nock intercepts all outgoing requests from the [Node.js HTTP module](https://nodejs.org/dist/latest-v20.x/docs/api/http.html#class-httpclientrequest), it works with almost every third-party library like `got`, `axios` and so on.

## Freezing time
You may use the [timekeeper](https://www.npmjs.com/package/timekeeper) package to freeze or travel time when writing tests. The timekeeper packages works by mocking the `Date` class.

In the following example, we encapsulate the API of `timekeeper` inside a [Japa Test resource](https://japa.dev/docs/test-resources).

```ts
import { getActiveTest } from '@japa/runner'
import timekeeper from 'timekeeper'

export function timeTravel(secondsToTravel: number) {
  const test = getActiveTest()
  if (!test) {
    throw new Error('Cannot use "timeTravel" outside of a Japa test')
  }

  timekeeper.reset()

  const date = new Date()
  date.setSeconds(date.getSeconds() + secondsToTravel)
  timekeeper.travel(date)

  test.cleanup(() => {
    timekeeper.reset()
  })
}
```

You may use the `timeTravel` method inside your tests as follows.

```ts
import { timeTravel } from '#test_helpers'

test('expire token after 2 hours', async ({ assert }) => {
  /**
   * Travel 3 hours into the future
   */
  timeTravel(60 * 60 * 3)
})
```
