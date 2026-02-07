---
summary: 学习如何在 AdonisJS 测试期间模拟或伪造依赖项。
---

# 模拟与伪造 (Mocks and Fakes)

在测试应用程序时，你可能希望模拟或伪造特定的依赖项，以防止运行实际的实现。例如，你希望在运行测试时避免向客户发送电子邮件，也不调用第三方服务（如支付网关）。

AdonisJS 提供了一些不同的 API 和建议，你可以使用它们来伪造、模拟或存根依赖项。

## 使用 Fakes API

Fakes 是专为测试而创建的具有工作实现的对像。例如，AdonisJS 的 mailer 模块有一个 fake 实现，你可以在测试期间使用它在内存中收集传出的电子邮件并对其进行断言。

我们为以下容器服务提供 fake 实现。Fakes API 与模块文档一起记录。

- [Emitter fake](../digging_deeper/emitter.md#faking-events-during-tests)
- [Hash fake](../security/hashing.md#faking-hash-service-during-tests)
- [Fake mailer](../digging_deeper/mail.md#fake-mailer)
- [Drive fake](../digging_deeper/drive.md#faking-disks)

## 依赖注入与 Fakes

如果你在应用程序中使用依赖注入或使用 [容器创建类实例](../concepts/dependency_injection.md)，则可以使用 `container.swap` 方法为类提供 fake 实现。

在下面的示例中，我们将 `UserService` 注入到 `UsersController` 中。

```ts
import UserService from '#services/user_service'
import { inject } from '@adonisjs/core'

export default class UsersController {
  @inject()
  index(service: UserService) {}
}
```

在测试期间，我们可以如下提供 `UserService` 类的替代/伪造实现。

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

测试完成后，必须使用 `container.restore` 方法恢复 fake。

```ts
app.container.restore(UserService)

// Restore UserService and PostService
app.container.restoreAll([UserService, PostService])

// Restore all
app.container.restoreAll()
```

## 使用 Sinon.js 进行模拟和存根

[Sinon](https://sinonjs.org/#get-started) 是 Node.js 生态系统中成熟且经过时间考验的模拟库。如果你经常使用 mocks 和 stubs，我们建议使用 Sinon，因为它与 TypeScript 配合得很好。

## 模拟网络请求

如果你的应用程序向第三方服务发出传出 HTTP 请求，则可以在测试期间使用 [nock](https://github.com/nock/nock) 来模拟网络请求。

由于 nock 拦截来自 [Node.js HTTP 模块](https://nodejs.org/dist/latest-v20.x/docs/api/http.html#class-httpclientrequest) 的所有传出请求，因此它几乎适用于所有第三方库，如 `got`、`axios` 等。

## 冻结时间
在编写测试时，你可以使用 [timekeeper](https://www.npmjs.com/package/timekeeper) 包来冻结或穿越时间。timekeeper 包通过模拟 `Date` 类来工作。

在下面的示例中，我们将 `timekeeper` 的 API 封装在 [Japa 测试资源](https://japa.dev/docs/test-resources) 中。

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

你可以在测试中如下使用 `timeTravel` 方法。

```ts
import { timeTravel } from '#test_helpers'

test('expire token after 2 hours', async ({ assert }) => {
  /**
   * Travel 3 hours into the future
   */
  timeTravel(60 * 60 * 3)
})
```
