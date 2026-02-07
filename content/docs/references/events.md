---
summary: 了解 AdonisJS 框架核心和官方包分发的事件。
---

# 事件参考手册

在本指南中，我们将查看框架核心和官方包分发的事件列表。请查看 [发射器 (emitter)](../digging_deeper/emitter.md) 文档以了解有关其用法的更多信息。

## http:request_completed

[`http:request_completed`](https://github.com/adonisjs/http-server/blob/main/src/types/server.ts#L65) 事件在 HTTP 请求完成后分发。该事件包含 [HttpContext](../concepts/http_context.md) 的实例和请求持续时间。`duration` 值是 `process.hrtime` 方法的输出。

```ts
import emitter from '@adonisjs/core/services/emitter'
import string from '@adonisjs/core/helpers/string'

emitter.on('http:request_completed', (event) => {
  const method = event.ctx.request.method()
  const url = event.ctx.request.url(true)
  const duration = event.duration

  console.log(`${method} ${url}: ${string.prettyHrTime(duration)}`)
})
```

## http:server_ready
一旦 AdonisJS HTTP 服务器准备好接受传入请求，就会分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('http:server_ready', (event) => {
  console.log(event.host)
  console.log(event.port)

  /**
   * 启动应用程序并启动 HTTP 服务器
   * 所花费的时间。
   */
  console.log(event.duration)
})
```

## container_binding:resolved

此事件在 IoC 容器解析绑定或构造类实例后分发。`event.binding` 属性将是一个字符串（绑定名称）或类构造函数，`event.value` 属性是解析后的值。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('container_binding:resolved', (event) => {
  console.log(event.binding)
  console.log(event.value)
})
```

## session:initiated
`@adonisjs/session` 包在 HTTP 请求期间初始化会话存储时发出此事件。`event.session` 属性是 [Session 类](https://github.com/adonisjs/session/blob/main/src/session.ts) 的实例。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:initiated', (event) => {
  console.log(`Initiated store for ${event.session.sessionId}`)
})
```

## session:committed
`@adonisjs/session` 包在 HTTP 请求期间将会话数据写入会话存储时发出此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:committed', (event) => {
  console.log(`Persisted data for ${event.session.sessionId}`)
})
```

## session:migrated
`@adonisjs/session` 包在使用 `session.regenerate()` 方法生成新会话 ID 时发出此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:migrated', (event) => {
  console.log(`Migrating data to ${event.toSessionId}`)
  console.log(`Destroying session ${event.fromSessionId}`)
})
```

## i18n:missing:translation
当缺少特定键和语言环境的翻译时，`@adonisjs/i18n` 包会分发此事件。您可以监听此事件以查找给定语言环境的缺失翻译。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('i18n:missing:translation', function (event) {
  console.log(event.identifier)
  console.log(event.hasFallback)
  console.log(event.locale)
})
```

## mail:sending
`@adonisjs/mail` 包在发送电子邮件之前发出此事件。在调用 `mail.sendLater` 方法的情况下，当邮件队列处理作业时将发出此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:sending', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail:sent
发送电子邮件后，`@adonisjs/mail` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:sent', (event) => {
  console.log(event.response)

  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail:queueing
`@adonisjs/mail` 包在将作业排队以发送电子邮件之前发出此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:queueing', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail:queued
电子邮件排队后，`@adonisjs/mail` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:queued', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## queued:mail:error
当 `@adonisjs/mail` 包的 [MemoryQueue](https://github.com/adonisjs/mail/blob/main/src/messengers/memory_queue.ts) 实现无法发送使用 `mail.sendLater` 方法排队的电子邮件时，将分发此事件。

如果您使用的是自定义队列实现，则必须捕获作业错误并发出此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('queued:mail:error', (event) => {
  console.log(event.error)
  console.log(event.mailerName)
})
```

## session_auth:login_attempted

当直接调用 `auth.login` 方法或由会话守卫内部调用时，`@adonisjs/auth` 包的 [SessionGuard](https://github.com/adonisjs/auth/blob/main/src/guards/session/guard.ts) 实现将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:login_attempted', (event) => {
  console.log(event.guardName)
  console.log(event.user)
})
```

## session_auth:login_succeeded

用户成功登录后，`@adonisjs/auth` 包的 [SessionGuard](https://github.com/adonisjs/auth/blob/main/src/guards/session/guard.ts) 实现将分发此事件。

您可以使用此事件来跟踪与给定用户关联的会话。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:login_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)
  console.log(event.user)
  console.log(event.rememberMeToken) // (如果有创建的话)
})
```

## session_auth:authentication_attempted
当尝试验证请求会话并检查已登录用户时，`@adonisjs/auth` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_attempted', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)
})
```

## session_auth:authentication_succeeded
在验证请求会话并且用户已登录后，`@adonisjs/auth` 包将分发此事件。您可以使用 `event.user` 属性访问已登录的用户。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  console.log(event.user)
  console.log(event.rememberMeToken) // 如果使用令牌进行身份验证
})
```

## session_auth:authentication_failed
当身份验证检查失败并且用户在当前 HTTP 请求期间未登录时，`@adonisjs/auth` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_failed', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  console.log(event.error)
})
```

## session_auth:logged_out
用户注销后，`@adonisjs/auth` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:logged_out', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  /**
   * 当在最初没有用户登录的请求期间
   * 调用 logout 时，user 的值将为 null。
   */
  console.log(event.user)
})
```

## access_tokens_auth:authentication_attempted
在 HTTP 请求期间尝试验证访问令牌时，`@adonisjs/auth` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_attempted', (event) => {
  console.log(event.guardName)
})
```

## access_tokens_auth:authentication_succeeded
验证访问令牌后，`@adonisjs/auth` 包将分发此事件。您可以使用 `event.user` 属性访问经过身份验证的用户。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.user)
  console.log(event.token)
})
```

## access_tokens_auth:authentication_failed
当身份验证检查失败时，`@adonisjs/auth` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_failed', (event) => {
  console.log(event.guardName)
  console.log(event.error)
})
```


## authorization:finished
执行授权检查后，`@adonisjs/bouncer` 包将分发此事件。事件有效负载包括最终响应，您可以检查该响应以了解检查的状态。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('authorization:finished', (event) => {
  console.log(event.user)
  console.log(event.response)
  console.log(event.parameters)
  console.log(event.action) 
})
```

## cache:cleared

使用 `cache.clear` 方法清除缓存后，`@adonisjs/cache` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('cache:cleared', (event) => {
  console.log(event.store)
})
```

## cache:deleted

使用 `cache.delete` 方法删除缓存键后，`@adonisjs/cache` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('cache:deleted', (event) => {
  console.log(event.key)
})
```

## cache:hit

当在缓存存储中找到缓存键时，`@adonisjs/cache` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('cache:hit', (event) => {
  console.log(event.key)
  console.log(event.value)
})
```

## cache:miss

当在缓存存储中未找到缓存键时，`@adonisjs/cache` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('cache:miss', (event) => {
  console.log(event.key)
})
```

## cache:written

将缓存键写入缓存存储后，`@adonisjs/cache` 包将分发此事件。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('cache:written', (event) => {
  console.log(event.key)
  console.log(event.value)
})
```
