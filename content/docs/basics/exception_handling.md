---
summary: 异常（Exception）是在 HTTP 请求生命周期中引发的错误。AdonisJS 提供了一套强大的异常处理机制，可以将异常转换为 HTTP 响应，并将它们报告给日志记录器。
---

# 异常处理

在 HTTP 请求期间引发的异常由定义在 `./app/exceptions/handler.ts` 文件中的 `HttpExceptionHandler` 处理。在这个文件中，你可以决定如何将异常转换为响应，并使用日志记录器记录它们，或者将它们报告给外部日志服务提供商。

`HttpExceptionHandler` 继承自 [ExceptionHandler](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts) 类，该类完成了处理错误的所有繁重工作，并为你提供了高级 API 来调整报告和渲染行为。

```ts
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
```

## 将错误处理器分配给服务器

错误处理器在 `start/kernel.ts` 文件中注册到 AdonisJS HTTP 服务器。我们使用在 `package.json` 文件中定义的 `#exceptions` 别名来延迟导入 HTTP 处理器。

```ts
server.errorHandler(() => import('#exceptions/handler'))
```

## 处理异常

异常由异常处理器类的 `handle` 方法处理。默认情况下，处理错误时会执行以下步骤。

- 检查错误实例是否有 `handle` 方法。如果有，调用 [error.handle](#定义-handle-方法) 方法并返回其响应。
- 检查是否为 `error.status` 状态码定义了状态页。如果有，渲染状态页。
- 否则，使用内容协商渲染器渲染异常。

如果你想以不同方式处理特定异常，可以在 `handle` 方法中进行。确保使用 `ctx.response.send` 方法发送响应，因为 `handle` 方法的返回值会被丢弃。

```ts
import { errors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      ctx.response.status(422).send(error.messages)
      return
    }

    return super.handle(error, ctx)
  }
}
```

### 状态页

状态页是你想要为给定状态码或状态码范围渲染的模板集合。

状态码范围可以定义为字符串表达式。用两个点分隔起始和结束状态码（`..`）。

如果你正在创建一个 JSON 服务器，你可能不需要状态页。

```ts
import { StatusPageRange, StatusPageRenderer } from '@adonisjs/http-server/types'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { view }) => view.render('errors/not-found'),
    '500..599': (_, { view }) => view.render('errors/server-error')
  }
}
```

### 调试模式

内容协商渲染器处理那些没有自行处理且没有转换为状态页的异常。

内容协商渲染器支持调试模式。它们可以使用 [Youch](https://www.npmjs.com/package/youch) npm 包在调试模式下解析并美化打印错误。

你可以使用异常处理器类上的 `debug` 属性切换调试模式。但是，建议在生产环境中关闭调试模式，因为它会暴露应用程序的敏感信息。

```ts
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
}
```

## 报告异常

异常处理器类上的 `report` 方法处理异常的报告。

该方法接收错误作为第一个参数，接收 [HTTP 上下文](../concepts/http_context.md)作为第二个参数。你不应该从 `report` 方法写入响应，而应该只使用上下文来读取请求信息。

### 记录异常日志

默认情况下，所有异常都使用 [logger](../digging_deeper/logger.md) 进行报告。

- 状态码在 `400..499` 范围内的异常以 `warning` 级别记录。
- 状态码 `>=500` 的异常以 `error` 级别记录。
- 所有其他异常都以 `info` 级别记录。

你可以通过从 `context` 方法返回一个对象来向日志消息添加自定义属性。

```ts
export default class HttpExceptionHandler extends ExceptionHandler {
  protected context(ctx: HttpContext) {
    return {
      requestId: ctx.requestId,
      userId: ctx.auth.user?.id,
      ip: ctx.request.ip(),
    }
  }
}
```

### 忽略状态码

你可以通过 `ignoreStatuses` 属性定义一个状态码数组来忽略某些异常的报告。

```ts
export default class HttpExceptionHandler extends ExceptionHandler {
  protected ignoreStatuses = [
    401,
    400,
    422,
    403,
  ]
}
```

### 忽略错误

你也可以通过定义要忽略的错误代码或错误类数组来忽略异常。

```ts
import { errors } from '@adonisjs/core'
import { errors as sessionErrors } from '@adonisjs/session'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected ignoreCodes = [
    'E_ROUTE_NOT_FOUND',
    'E_INVALID_SESSION'
  ]
}
```

也可以使用 `ignoreExceptions` 属性忽略异常类数组。

```ts
import { errors } from '@adonisjs/core'
import { errors as sessionErrors } from '@adonisjs/session'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected ignoreExceptions = [
    errors.E_ROUTE_NOT_FOUND,
    sessionErrors.E_INVALID_SESSION,
  ]
}
```

### 自定义 shouldReport 方法

忽略状态码或异常的逻辑编写在 [`shouldReport` 方法](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts#L155) 中。如果需要，你可以重写此方法并定义自定义的异常忽略逻辑。

```ts
import { HttpError } from '@adonisjs/core/types/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected shouldReport(error: HttpError) {
    // 返回布尔值
  }
}
```

## 自定义异常

你可以使用 `make:exception` ace 命令创建一个异常类。异常继承自 `@adonisjs/core` 包中的 `Exception` 类。

另请参阅：[Make exception 命令](../references/commands.md#makeexception)

```sh
node ace make:exception UnAuthorized
```

```ts
import { Exception } from '@adonisjs/core/exceptions'

export default class UnAuthorizedException extends Exception {}
```

你可以通过创建一个新的实例来引发异常。引发异常时，你可以为异常分配自定义的 **错误代码** 和 **状态码**。

```ts
import UnAuthorizedException from '#exceptions/unauthorized_exception'

throw new UnAuthorizedException('You are not authorized', {
  status: 403,
  code: 'E_UNAUTHORIZED'
})
```

错误代码和状态码也可以定义为异常类上的静态属性。如果在抛出异常时未定义自定义值，则将使用静态值。

```ts
import { Exception } from '@adonisjs/core/exceptions'
export default class UnAuthorizedException extends Exception {
  static status = 403
  static code = 'E_UNAUTHORIZED'
}
```

### 定义 `handle` 方法

要自行处理异常，可以在异常类上定义 `handle` 方法。此方法应使用 `ctx.response.send` 方法将错误转换为 HTTP 响应。

`error.handle` 方法接收错误实例作为第一个参数，接收 HTTP 上下文作为第二个参数。

```ts
import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class UnAuthorizedException extends Exception {
  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send(error.message)
  }
}
```

### 定义 `report` 方法

你可以在异常类上实现 `report` 方法来自行处理异常报告。report 方法接收错误实例作为第一个参数，接收 HTTP 上下文作为第二个参数。

```ts
import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class UnAuthorizedException extends Exception {
  async report(error: this, ctx: HttpContext) {
    ctx.logger.error({ err: error }, error.message)
  }
}
```

## 确定具体错误类型

框架核心和其他官方包会导出它们引发的异常。你可以使用 `instanceof` 检查来验证错误是否为特定异常的实例。例如：

```ts
import { errors } from '@adonisjs/core'

try {
  router.builder().make('articles.index')
} catch (error: unknown) {
  if (error instanceof errors.E_CANNOT_LOOKUP_ROUTE) {
    // 处理错误
  }
}
```

## 已知错误

请查阅 [异常参考指南](../references/exceptions.md) 以查看已知错误列表。
