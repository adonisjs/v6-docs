---
summary: 了解如何使用宏 (macros) 和 getter 扩展 AdonisJS 框架。
---

# 扩展框架

AdonisJS 的架构使得扩展框架变得非常容易。我们自己使用框架的核心 API 来构建第一方包生态系统。

在本指南中，我们将探索可用于通过包或在应用程序代码库中扩展框架的不同 API。

## 宏 (Macros) 和 getter

宏和 getter 提供了一个 API，用于向类的原型添加属性。您可以将它们视为 `Object.defineProperty` 的语法糖。在底层，我们使用 [macroable](https://github.com/poppinss/macroable) 包，您可以参考其 README 以获得深入的技术解释。

由于宏和 getter 是在运行时添加的，因此您必须使用 [声明合并 (declaration merging)](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) 将添加的属性的类型信息通知 TypeScript。

您可以将用于添加宏的代码编写在专用文件中（如 `extensions.ts`），并在服务提供者的 `boot` 方法中导入它。

```ts
// title: providers/app_provider.ts
export default class AppProvider {
  async boot() {
    await import('../src/extensions.js')
  }
}
```

在下面的示例中，我们将 `wantsJSON` 方法添加到 [Request](../basics/request.md) 类中，并同时定义其类型。

```ts
// title: src/extensions.ts
import { Request } from '@adonisjs/core/http'

Request.macro('wantsJSON', function (this: Request) {
  const firstType = this.types()[0]
  if (!firstType) {
    return false
  }
  
  return firstType.includes('/json') || firstType.includes('+json')
})
```

```ts
// title: src/extensions.ts
declare module '@adonisjs/core/http' {
  interface Request {
    wantsJSON(): boolean
  }
}
```

- `declare module` 调用期间的模块路径必须与用于导入类的路径相同。
- `interface` 名称必须与添加宏或 getter 的类名相同。

### Getters

Getter 是添加到类中的延迟求值属性。您可以使用 `Class.getter` 方法添加 getter。第一个参数是 getter 名称，第二个参数是计算属性值的回调函数。

Getter 回调不能是异步的，因为 JavaScript 中的 [getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) 不能是异步的。

```ts
import { Request } from '@adonisjs/core/http'

Request.getter('hasRequestId', function (this: Request) {
  return this.header('x-request-id')
})

// 您可以按如下方式使用该属性。
if (ctx.request.hasRequestId) {
}
```

Getter 可以是单例，这意味着计算 getter 值的函数将被调用一次，返回值将被缓存用于该类的实例。

```ts
const isSingleton = true

Request.getter('hasRequestId', function (this: Request) {
  return this.header('x-request-id')
}, isSingleton)
```

### Macroable 类

以下是可以使用宏和 getter 扩展的类列表。

| 类 | 导入路径 |
|------------------------------------------------------------------------------------------------|-----------------------------|
| [Application](https://github.com/adonisjs/application/blob/main/src/application.ts)            | `@adonisjs/core/app`        |
| [Request](https://github.com/adonisjs/http-server/blob/main/src/request.ts)                    | `@adonisjs/core/http`       |
| [Response](https://github.com/adonisjs/http-server/blob/main/src/response.ts)                  | `@adonisjs/core/http`       |
| [HttpContext](https://github.com/adonisjs/http-server/blob/main/src/http_context/main.ts)      | `@adonisjs/core/http`       |
| [Route](https://github.com/adonisjs/http-server/blob/main/src/router/route.ts)                 | `@adonisjs/core/http`       |
| [RouteGroup](https://github.com/adonisjs/http-server/blob/main/src/router/group.ts)            | `@adonisjs/core/http`       |
| [RouteResource](https://github.com/adonisjs/http-server/blob/main/src/router/resource.ts)      | `@adonisjs/core/http`       |
| [BriskRoute](https://github.com/adonisjs/http-server/blob/main/src/router/brisk.ts)            | `@adonisjs/core/http`       |
| [ExceptionHandler](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts) | `@adonisjs/core/http`       |
| [MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts)        | `@adonisjs/core/bodyparser` |


## 扩展模块

大多数 AdonisJS 模块都提供可扩展的 API 来注册自定义实现。以下是相关列表的汇总。

- [创建 Hash 驱动程序](../security/hashing.md#creating-a-custom-hash-driver)
- [创建 Session 驱动程序](../basics/session.md#creating-a-custom-session-store)
- [创建 Social auth 驱动程序](../authentication/social_authentication.md#creating-a-custom-social-driver)
- [扩展 REPL](../digging_deeper/repl.md#adding-custom-methods-to-repl)
- [创建 i18n 翻译加载器](../digging_deeper/i18n.md#creating-a-custom-translation-loader)
- [创建 i18n 翻译格式化程序](../digging_deeper/i18n.md#creating-a-custom-translation-formatter)
