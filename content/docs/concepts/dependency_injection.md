---
summary: 了解 AdonisJS 中的依赖注入以及如何使用 IoC 容器来解析依赖项。
---

# 依赖注入

每个 AdonisJS 应用程序的核心都是一个 IoC 容器，它可以几乎零配置地构造类和解析依赖项。

IoC 容器主要服务于以下两个用例。

- 为第一方和第三方包公开 API，以便从容器注册和解析绑定（稍后将详细介绍 [绑定](#container-bindings)）。
- 自动解析并将依赖项注入到类构造函数或类方法中。

让我们从向类中注入依赖项开始。

## 基本示例

自动依赖注入依赖于 [TypeScript 旧版装饰器实现](https://www.typescriptlang.org/docs/handbook/decorators.html) 和 [Reflection metadata](https://www.npmjs.com/package/reflect-metadata) API。

在下面的示例中，我们创建一个 `EchoService` 类，并将其的一个实例注入到 `HomeController` 类中。您可以复制粘贴代码示例来跟随操作。

### 步骤 1. 创建 Service 类
首先在 `app/services` 文件夹中创建 `EchoService` 类。

```ts
// title: app/services/echo_service.ts
export default class EchoService {
  respond() {
    return 'hello'
  }
}
```

### 步骤 2. 在控制器中注入服务

在 `app/controllers` 文件夹中创建一个新的 HTTP 控制器。或者，您可以使用 `node ace make:controller home` 命令。

在控制器文件中导入 `EchoService` 并将其作为构造函数依赖项接受。

```ts
// title: app/controllers/home_controller.ts
import EchoService from '#services/echo_service'

export default class HomeController {
  constructor(protected echo: EchoService) {
  }
  
  handle() {
    return this.echo.respond()
  }
}
```

### 步骤 3. 使用 inject 装饰器

为了使自动依赖解析工作，我们必须在 `HomeController` 类上使用 `@inject` 装饰器。

```ts
import EchoService from '#services/echo_service'
// insert-start
import { inject } from '@adonisjs/core'
// insert-end

// insert-start
@inject()
// insert-end
export default class HomeController {
  constructor(protected echo: EchoService) {
  }
  
  handle() {
    return this.echo.respond()
  }
}
```

就是这样！现在，您可以将 `HomeController` 类绑定到路由，它将自动接收 `EchoService` 类的实例。

### 结论

您可以将 `@inject` 装饰器视为查看类构造函数或方法依赖项并将有关信息通知容器的间谍。

当 AdonisJS 路由器要求容器构造 `HomeController` 时，容器已经知道了控制器的依赖项。

## 构造依赖树

目前，`EchoService` 类没有依赖项，使用容器创建其实例似乎有些大材小用。

让我们更新类构造函数，使其接受 `HttpContext` 类的一个实例。

```ts
// title: app/services/echo_service.ts
// insert-start
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
// insert-end

// insert-start
@inject()
// insert-end
export default class EchoService {
  // insert-start
  constructor(protected ctx: HttpContext) {
  }
  // insert-end

  respond() {
    return `Hello from ${this.ctx.request.url()}`
  }
}
```

同样，我们必须将我们的间谍（`@inject` 装饰器）放在 `EchoService` 类上以检查其依赖项。

瞧，这就是我们要做的一切。无需更改控制器内的一行代码，您可以重新运行代码，`EchoService` 类将接收 `HttpContext` 类的实例。


:::note

使用容器的好处在于，您可以拥有深层嵌套的依赖项，并且容器可以为您解析整个树。唯一的条件是使用 `@inject` 装饰器。


:::

## 使用方法注入

方法注入用于在类方法内部注入依赖项。要使方法注入工作，必须在方法签名前放置 `@inject` 装饰器。

让我们继续前面的示例，并将 `EchoService` 依赖项从 `HomeController` 构造函数移动到 `handle` 方法。

:::note

在控制器内部使用方法注入时，请记住第一个参数接收固定值（即 HTTP 上下文），其余参数使用容器解析。

:::

```ts
// title: app/controllers/home_controller.ts
import EchoService from '#services/echo_service'
import { inject } from '@adonisjs/core'

// delete-start
@inject()
// delete-end
export default class HomeController {
  // delete-start
  constructor(private echo: EchoService) {
  }
  // delete-end
  
  // insert-start
  @inject()
  handle(ctx, echo: EchoService) {
    return echo.respond()
  }
  // insert-end
}
```

就是这样！这次，`EchoService` 类实例将被注入到 `handle` 方法中。

## 何时使用依赖注入

建议在项目中利用依赖注入，因为 DI 会在应用程序的不同部分之间创建松散耦合。因此，代码库变得更容易测试和重构。

但是，您必须小心，不要将依赖注入的想法推向极端，以至于开始失去其好处。例如：

- 您不应该将像 `lodash` 这样的辅助库作为类的依赖项注入。直接导入并使用它。
- 对于不太可能被交换或替换的组件，您的代码库可能不需要松散耦合。例如，您可能更喜欢导入 `logger` 服务而不是将 `Logger` 类作为依赖项注入。

## 直接使用容器

AdonisJS 应用程序中的大多数类，如 **控制器**、**中间件**、**事件监听器**、**验证器** 和 **邮件发送器**，都是使用容器构造的。因此，您可以利用 `@inject` 装饰器进行自动依赖注入。

对于想要使用容器自行构造类实例的情况，可以使用 `container.make` 方法。

`container.make` 方法接受一个类构造函数，并在解析其所有依赖项后返回其实例。

```ts
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'

class EchoService {}

@inject()
class SomeService {
  constructor(public echo: EchoService) {}
}

/**
 * 与创建类的新实例相同，但
 * 将具有自动 DI 的好处
 */
const service = await app.container.make(SomeService)

console.log(service instanceof SomeService)
console.log(service.echo instanceof EchoService)
```

您可以使用 `container.call` 方法在方法内部注入依赖项。`container.call` 方法接受以下参数。

1. 类的实例。
2. 要在类实例上运行的方法的名称。容器将解析依赖项并将它们传递给方法。
3. 传递给方法的可选固定参数数组。

```ts
class EchoService {}

class SomeService {
  @inject()
  run(echo: EchoService) {
  }
}

const service = await app.container.make(SomeService)

/**
 * Echo 类的实例将被传递给
 * run 方法
 */
await app.container.call(service, 'run')
```

## 容器绑定

容器绑定是 AdonisJS 中 IoC 容器存在的主要原因之一。绑定充当您安装的包与应用程序之间的桥梁。

绑定本质上是一个键值对，键是绑定的唯一标识符，值是返回该值的工厂函数。

- 绑定名称可以是 `string`、`symbol` 或类构造函数。
- 工厂函数可以是异步的，并且必须返回值。

您可以使用 `container.bind` 方法注册容器绑定。以下是注册和从容器解析绑定的简单示例。

```ts
import app from '@adonisjs/core/services/app'

class MyFakeCache {
  get(key: string) {
    return `${key}!`
  }
}

app.container.bind('cache', function () {
  return new MyFakeCache()
})

const cache = await app.container.make('cache')
console.log(cache.get('foo')) // returns foo!
```

### 何时使用容器绑定？

容器绑定用于特定用例，例如注册包导出的单例服务或在自动依赖注入不足时自行构造类实例。

我们建议您不要通过将所有内容注册到容器来使应用程序变得不必要地复杂。相反，在使用容器绑定之前，请在应用程序代码中寻找特定的用例。

以下是框架包中使用容器绑定的一些示例。

- [在容器内注册 BodyParserMiddleware](https://github.com/adonisjs/core/blob/main/providers/app_provider.ts#L134-L139)：由于中间件类需要存储在 `config/bodyparser.ts` 文件中的配置，因此无法使用自动依赖注入。在这种情况下，我们通过将其注册为绑定来手动构造中间件类实例。
- [将 Encryption 服务注册为单例](https://github.com/adonisjs/core/blob/main/providers/app_provider.ts#L97-L100)：Encryption 类需要存储在 `config/app.ts` 文件中的 `appKey`，因此，我们使用容器绑定作为桥梁，从用户应用程序读取 `appKey` 并配置 Encryption 类的单例实例。


:::important

容器绑定的概念在 JavaScript 生态系统中并不常用。因此，如有疑问，请随时 [加入我们的 Discord 社区](https://discord.gg/vDcEjq6)。


:::


### 在工厂函数内解析绑定

您可以在绑定工厂函数内从容器解析其他绑定。例如，如果 `MyFakeCache` 类需要来自 `config/cache.ts` 文件的配置，您可以按如下方式访问它。

```ts
this.app.container.bind('cache', async (resolver) => {
  const configService = await resolver.make('config')
  const cacheConfig = configService.get<any>('cache')

  return new MyFakeCache(cacheConfig)
})
```

### 单例 (Singletons)

单例是工厂函数仅调用一次且返回值在应用程序生命周期内缓存的绑定。

您可以使用 `container.singleton` 方法注册单例绑定。

```ts
this.app.container.singleton('cache', async (resolver) => {
  const configService = await resolver.make('config')
  const cacheConfig = configService.get<any>('cache')

  return new MyFakeCache(cacheConfig)
})
```

### 绑定值 (Binding values)

您可以使用 `container.bindValue` 方法将值直接绑定到容器。

```ts
this.app.container.bindValue('cache', new MyFakeCache())
```

### 别名 (Aliases)

您可以使用 `alias` 方法为绑定定义别名。该方法接受别名名称作为第一个参数，并接受对现有绑定或类构造函数的引用作为别名值。

```ts
this.app.container.singleton(MyFakeCache, async () => {
  return new MyFakeCache()
})

this.app.container.alias('cache', MyFakeCache)
```

### 为绑定定义静态类型

您可以使用 [TypeScript 声明合并](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) 为绑定定义静态类型信息。

类型定义在 `ContainerBindings` 接口上，作为键值对。

```ts
declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    cache: MyFakeCache
  }
}
```

如果您创建了一个包，可以将上述代码块写入服务提供者文件中。

在您的 AdonisJS 应用程序中，可以将上述代码块写入 `types/container.ts` 文件中。


## 创建抽象层

容器允许您为应用程序创建抽象层。您可以为接口定义绑定并将其解析为具体实现。

:::note
当您想要将六边形架构（也称为端口和适配器原则）应用于应用程序时，此方法非常有用。
:::

由于 TypeScript 接口在运行时不存在，因此您必须为接口使用抽象类构造函数。

```ts
export abstract class PaymentService {
  abstract charge(amount: number): Promise<void>
  abstract refund(amount: number): Promise<void>
}
```

接下来，您可以创建 `PaymentService` 接口的具体实现。

```ts
import { PaymentService } from '#contracts/payment_service'

export class StripePaymentService implements PaymentService {
  async charge(amount: number) {
    // 使用 Stripe 收款
  }

  async refund(amount: number) {
    // 使用 Stripe 退款
  }
}
```

现在，您可以在 `AppProvider` 内部的容器中注册 `PaymentService` 接口和 `StripePaymentService` 具体实现。

```ts
// title: providers/app_provider.ts
import { PaymentService } from '#contracts/payment_service'

export default class AppProvider {
  async boot() {
    const { StripePaymentService } = await import('#services/stripe_payment_service')
    
    this.app.container.bind(PaymentService, () => {
      return this.app.container.make(StripePaymentService)
    })
  }
}
```

最后，您可以从容器中解析 `PaymentService` 接口并在应用程序中使用它。

```ts
import { PaymentService } from '#contracts/payment_service'

@inject()
export default class PaymentController {
  constructor(private paymentService: PaymentService) {
  }

  async charge() {
    await this.paymentService.charge(100)
    
    // ...
  }
}
```

## 在测试期间交换实现

当您依靠容器来解析依赖树时，您对该树中的类控制较少/没有控制。因此，模拟/伪造这些类可能会变得更加困难。

在下面的示例中，`UsersController.index` 方法接受 `UserService` 类的一个实例，我们使用 `@inject` 装饰器解析依赖项并将其提供给 `index` 方法。

```ts
import UserService from '#services/user_service'
import { inject } from '@adonisjs/core'

export default class UsersController {
  @inject()
  index(service: UserService) {}
}
```

假设在测试期间，您不想使用实际的 `UserService`，因为它会发出外部 HTTP 请求。相反，您想使用伪造实现。

但首先，看看您可能会编写什么代码来测试 `UsersController`。

```ts
import UserService from '#services/user_service'

test('get all users', async ({ client }) => {
  const response = await client.get('/users')

  response.assertBody({
    data: [{ id: 1, username: 'virk' }]
  })
})
```

在上面的测试中，我们通过 HTTP 请求与 `UsersController` 交互，并没有直接控制它。

容器提供了一个简单的 API 来用伪造实现交换类。您可以使用 `container.swap` 方法定义交换。

`container.swap` 方法接受您要交换的类构造函数，后跟一个返回替代实现的工厂函数。

```ts
import UserService from '#services/user_service'
// insert-start
import app from '@adonisjs/core/services/app'
// insert-end

test('get all users', async ({ client }) => {
  // insert-start
  class FakeService extends UserService {
    all() {
      return [{ id: 1, username: 'virk' }]
    }
  }
    
  app.container.swap(UserService, () => {
    return new FakeService()
  })
  // insert-end
  
  const response = await client.get('users')
  response.assertBody({
    data: [{ id: 1, username: 'virk' }]
  })
})
```

一旦定义了交换，容器将使用它而不是实际的类。您可以使用 `container.restore` 方法恢复原始实现。

```ts
app.container.restore(UserService)

// 恢复 UserService 和 PostService
app.container.restoreAll([UserService, PostService])

// 恢复全部
app.container.restoreAll()
```

## 上下文依赖

上下文依赖允许您定义如何为给定类解析依赖项。例如，您有两个依赖于 Drive Disk 类的服务。

```ts
import { Disk } from '@adonisjs/drive'

export default class UserService {
  constructor(protected disk: Disk) {}
}
``` 

```ts
import { Disk } from '@adonisjs/drive'

export default class PostService {
  constructor(protected disk: Disk) {}
}
```

您希望 `UserService` 接收带有 GCS 驱动程序的磁盘实例，而 `PostService` 接收带有 S3 驱动程序的磁盘实例。您可以使用上下文依赖来实现这一点。

以下代码必须编写在服务提供者 `register` 方法中。

```ts
import { Disk } from '@adonisjs/drive'
import UserService from '#services/user_service'
import PostService from '#services/post_service'
import { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container
      .when(UserService)
      .asksFor(Disk)
      .provide(async (resolver) => {
        const driveManager = await resolver.make('drive')
        return drive.use('gcs')
      })

    this.app.container
      .when(PostService)
      .asksFor(Disk)
      .provide(async (resolver) => {
        const driveManager = await resolver.make('drive')
        return drive.use('s3')
      })
  }
}
```

## 容器钩子

您可以使用容器的 `resolving` 钩子来修改/扩展 `container.make` 方法的返回值。

通常，在尝试扩展特定绑定时，您将在服务提供者内部使用钩子。例如，Database 提供者使用 `resolving` 钩子来注册额外的数据库驱动验证规则。

```ts
import { ApplicationService } from '@adonisjs/core/types'

export default class DatabaseProvider {
  constructor(protected app: ApplicationService) {
  }

  async boot() {
    this.app.container.resolving('validator', (validator) => {
      validator.rule('unique', implementation)
      validator.rule('exists', implementation)
    })
  }
}
```

## 容器事件

容器在解析绑定或构造类实例后发出 `container_binding:resolved` 事件。`event.binding` 属性将是字符串（绑定名称）或类构造函数，`event.value` 属性是解析的值。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('container_binding:resolved', (event) => {
  console.log(event.binding)
  console.log(event.value)
})
```

## 另请参阅

- [容器 README 文件](https://github.com/adonisjs/fold/blob/develop/README.md) 以框架无关的方式涵盖了容器 API。
- [为什么需要 IoC 容器？](https://github.com/thetutlage/meta/discussions/4) 在这篇文章中，框架的创建者分享了他使用 IoC 容器的理由。
