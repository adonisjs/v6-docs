---
summary: 了解 AdonisJS 框架核心和官方包抛出的异常。
---

# 异常参考手册

在本指南中，我们将查看框架核心和官方包抛出的已知异常列表。其中一些异常被标记为 **自行处理 (self-handled)**。[自行处理异常](../basics/exception_handling.md#defining-the-handle-method) 可以将自身转换为 HTTP 响应。

<div style="--prose-h2-font-size: 22px;">

## E_ROUTE_NOT_FOUND
当 HTTP 服务器收到对不存在路由的请求时，将抛出此异常。默认情况下，客户端将获得 404 响应，并且您可以使用 [状态页](../basics/exception_handling.md#status-pages) 渲染 HTML 页面（可选）。

- **状态码**: 404
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_ROUTE_NOT_FOUND) {
  // handle error
}
```

## E_ROW_NOT_FOUND
当查找单个项目的数据库查询失败时 [例如使用 `Model.findOrFail()` 时]，将抛出此异常。默认情况下，客户端将获得 404 响应，并且您可以使用 [状态页](../basics/exception_handling.md#status-pages) 渲染 HTML 页面（可选）。

- **状态码**: 404
- **自行处理**: 否

```ts
import { errors as lucidErrors } from '@adonisjs/lucid'
if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
  // handle error
  console.log(`${error.model?.name || 'Row'} not found`)
}
```

## E_AUTHORIZATION_FAILURE
当 Bouncer 授权检查失败时，将抛出此异常。该异常是自行处理的，并 [使用内容协商](../security/authorization.md#throwing-authorizationexception) 向客户端返回适当的错误响应。

- **状态码**: 403
- **自行处理**: 是
- **翻译标识符**: `errors.E_AUTHORIZATION_FAILURE`

```ts
import { errors as bouncerErrors } from '@adonisjs/bouncer'
if (error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE) {
}
```

## E_TOO_MANY_REQUESTS
当请求耗尽给定持续时间内允许的所有请求时，[@adonisjs/rate-limiter](../security/rate_limiting.md) 包将抛出此异常。该异常是自行处理的，并 [使用内容协商](../security/rate_limiting.md#handling-throttleexception) 向客户端返回适当的错误响应。

- **状态码**: 429
- **自行处理**: 是
- **翻译标识符**: `errors.E_TOO_MANY_REQUESTS`

```ts
import { errors as limiterErrors } from '@adonisjs/limiter'
if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) {
}
```

## E_BAD_CSRF_TOKEN
当提交使用 [CSRF 保护](../security/securing_ssr_applications.md#csrf-protection) 的表单时未包含 CSRF 令牌，或者 CSRF 令牌无效时，将抛出此异常。

- **状态码**: 403
- **自行处理**: 是
- **翻译标识符**: `errors.E_BAD_CSRF_TOKEN`

```ts
import { errors as shieldErrors } from '@adonisjs/shield'
if (error instanceof shieldErrors.E_BAD_CSRF_TOKEN) {
}
```

`E_BAD_CSRF_TOKEN` 异常是 [自行处理](https://github.com/adonisjs/shield/blob/main/src/errors.ts#L20) 的，用户将被重定向回表单，您可以使用闪存消息 (flash messages) 访问错误。

```edge
@error('E_BAD_CSRF_TOKEN')
  <p>{{ message }}</p>
@end
```

## E_OAUTH_MISSING_CODE
当 OAuth 服务在重定向期间未提供 OAuth 代码时，`@adonisjs/ally` 包将抛出此异常。

如果您在调用 `.accessToken` 或 `.user` 方法之前 [处理错误](../authentication/social_authentication.md#handling-callback-response)，则可以避免此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors as allyErrors } from '@adonisjs/bouncer'
if (error instanceof allyErrors.E_OAUTH_MISSING_CODE) {
}
```

## E_OAUTH_STATE_MISMATCH
当重定向期间定义的 CSRF 状态丢失时，`@adonisjs/ally` 包将抛出此异常。

如果您在调用 `.accessToken` 或 `.user` 方法之前 [处理错误](../authentication/social_authentication.md#handling-callback-response)，则可以避免此异常。

- **状态码**: 400
- **自行处理**: 否

```ts
import { errors as allyErrors } from '@adonisjs/bouncer'
if (error instanceof allyErrors.E_OAUTH_STATE_MISMATCH) {
}
```

## E_UNAUTHORIZED_ACCESS
当其中一个身份验证守卫 (authentication guards) 无法验证请求时，将抛出此异常。该异常是自行处理的，并使用 [内容协商](../authentication/session_guard.md#handling-authentication-exception) 向客户端返回适当的错误响应。

- **状态码**: 401
- **自行处理**: 是
- **翻译标识符**: `errors.E_UNAUTHORIZED_ACCESS`

```ts
import { errors as authErrors } from '@adonisjs/auth'
if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
}
```

## E_INVALID_CREDENTIALS
当身份验证查找器无法验证用户凭据时，将抛出此异常。该异常已被处理，并使用 [内容协商](../authentication/verifying_user_credentials.md#handling-exceptions) 向客户端返回适当的错误响应。

- **状态码**: 400
- **自行处理**: 是
- **翻译标识符**: `errors.E_INVALID_CREDENTIALS`

```ts
import { errors as authErrors } from '@adonisjs/auth'
if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
}
```

## E_CANNOT_LOOKUP_ROUTE
当您尝试使用 [URL 构建器](../basics/routing.md#url-builder) 为路由创建 URL 时，将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_CANNOT_LOOKUP_ROUTE) {
  // handle error
}
```

## E_HTTP_EXCEPTION
`E_HTTP_EXCEPTION` 是用于在 HTTP 请求期间抛出错误的通用异常。您可以直接使用此异常，也可以创建扩展它的自定义异常。

- **状态码**: 在抛出异常时定义
- **自行处理**: 是

```ts
// title: Throw exception
import { errors } from '@adonisjs/core'

throw errors.E_HTTP_EXCEPTION.invoke(
  {
    errors: ['Cannot process request']
  },
  422
)
```

```ts
// title: Handle exception
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_HTTP_EXCEPTION) {
  // handle error
}
```

## E_HTTP_REQUEST_ABORTED
`E_HTTP_REQUEST_ABORTED` 是 `E_HTTP_EXCEPTION` 异常的子类。此异常由 [response.abort](../basics/response.md#aborting-request-with-an-error) 方法抛出。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_HTTP_REQUEST_ABORTED) {
  // handle error
}
```

## E_INSECURE_APP_KEY
当 `appKey` 的长度小于 16 个字符时，将抛出此异常。您可以使用 [generate:key](./commands.md#generatekey) ace 命令生成安全的 app key。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INSECURE_APP_KEY) {
  // handle error
}
```

## E_MISSING_APP_KEY
当 `config/app.ts` 文件中未定义 `appKey` 属性时，将抛出此异常。默认情况下，`appKey` 的值使用 `APP_KEY` 环境变量设置。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_APP_KEY) {
  // handle error
}
```

## E_INVALID_ENV_VARIABLES
当一个或多个环境变量未通过验证时，将抛出此异常。可以使用 `error.help` 属性访问详细的验证错误。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INVALID_ENV_VARIABLES) {
  console.log(error.help)
}
```

## E_MISSING_COMMAND_NAME
当命令未定义 `commandName` 属性或其值为空字符串时，将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_COMMAND_NAME) {
  console.log(error.commandName)
}
```

## E_COMMAND_NOT_FOUND
当 Ace 无法找到命令时，将抛出此异常。

- **状态码**: 404
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_COMMAND_NOT_FOUND) {
  console.log(error.commandName)
}
```

## E_MISSING_FLAG
当执行命令而未传递必需的 CLI 标志时，将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_FLAG) {
  console.log(error.commandName)
}
```

## E_MISSING_FLAG_VALUE
当尝试执行命令而未向非布尔 CLI 标志提供任何值时，将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_FLAG_VALUE) {
  console.log(error.commandName)
}
```

## E_MISSING_ARG
当执行命令而未定义必需的参数时，将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_ARG) {
  console.log(error.commandName)
}
```

## E_MISSING_ARG_VALUE
当执行命令而未定义必需参数的值时，将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_ARG_VALUE) {
  console.log(error.commandName)
}
```

## E_UNKNOWN_FLAG
当执行带有未知 CLI 标志的命令时，将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_UNKNOWN_FLAG) {
  console.log(error.commandName)
}
```

## E_INVALID_FLAG
当为 CLI 标志提供的值无效时（例如，向接受数值的标志传递字符串值），将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INVALID_FLAG) {
  console.log(error.commandName)
}
```

## E_MULTIPLE_REDIS_SUBSCRIPTIONS
当您尝试多次 [订阅给定的 pub/sub 频道](../database/redis.md#pubsub) 时，`@adonisjs/redis` 包将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors as redisErrors } from '@adonisjs/redis'
if (error instanceof redisErrors.E_MULTIPLE_REDIS_SUBSCRIPTIONS) {
}
```

## E_MULTIPLE_REDIS_PSUBSCRIPTIONS
当您尝试多次 [订阅给定的 pub/sub 模式](../database/redis.md#pubsub) 时，`@adonisjs/redis` 包将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors as redisErrors } from '@adonisjs/redis'
if (error instanceof redisErrors.E_MULTIPLE_REDIS_PSUBSCRIPTIONS) {
}
```

## E_MAIL_TRANSPORT_ERROR
当无法使用给定的传输方式发送电子邮件时，`@adonisjs/mail` 包将抛出此异常。通常，当电子邮件服务的 HTTP API 返回非 200 HTTP 响应时，会发生这种情况。

您可以使用 `error.cause` 属性访问网络请求错误。`cause` 属性是 `got` (npm 包) 返回的 [error 对象](https://github.com/sindresorhus/got/blob/main/documentation/8-errors.md)。

- **状态码**: 400
- **自行处理**: 否

```ts
import { errors as mailErrors } from '@adonisjs/mail'
if (error instanceof mailErrors.E_MAIL_TRANSPORT_ERROR) {
  console.log(error.cause)
}
```

## E_SESSION_NOT_MUTABLE
当会话存储以只读模式初始化时，`@adonisjs/session` 包将抛出此异常。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors as sessionErrors } from '@adonisjs/session'
if (error instanceof sessionErrors.E_SESSION_NOT_MUTABLE) {
  console.log(error.message)
}
```

## E_SESSION_NOT_READY
当会话存储尚未初始化时，`@adonisjs/session` 包将抛出此异常。当您未使用会话中间件时，会出现这种情况。

- **状态码**: 500
- **自行处理**: 否

```ts
import { errors as sessionErrors } from '@adonisjs/session'
if (error instanceof sessionErrors.E_SESSION_NOT_READY) {
  console.log(error.message)
}
```

</div>
