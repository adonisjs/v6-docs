---
summary: Request 类保存正在进行的 HTTP 请求的数据，包括请求体、上传文件的引用、cookie、请求头等。
---

# 请求 (Request)

[Request 类](https://github.com/adonisjs/http-server/blob/main/src/request.ts) 的实例保存正在进行的 HTTP 请求的数据，包括 **请求体**、**上传文件的引用**、**cookie**、**请求头** 等。可以通过 `ctx.request` 属性访问请求实例。

## 查询字符串和路由参数

`request.qs` 方法以对象形式返回解析后的查询字符串。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts', async ({ request }) => {
  /*
   * URL: /?sort_by=id&direction=desc
   * qs: { sort_by: 'id', direction: 'desc' }
   */
  request.qs()
})
```

`request.params` 方法返回 [路由参数](./routing.md#route-params) 对象。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts/:slug/comments/:id', async ({ request }) => {
  /*
   * URL: /posts/hello-world/comments/2
   * params: { slug: 'hello-world', id: '2' }
   */
  request.params()
})
```

你可以使用 `request.param` 方法访问单个参数。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts/:slug/comments/:id', async ({ request }) => {
  const slug = request.param('slug')
  const commentId = request.param('id')
})
```

## 请求体

AdonisJS 使用在 `start/kernel.ts` 文件中注册的 [body-parser 中间件](../basics/body_parser.md) 解析请求体。

你可以使用 `request.body()` 方法访问请求体。它以对象形式返回解析后的请求体。

```ts
import router from '@adonisjs/core/services/router'

router.post('/', async ({ request }) => {
  console.log(request.body())
})
```

`request.all` 方法返回请求体和查询字符串的合并副本。

```ts
import router from '@adonisjs/core/services/router'

router.post('/', async ({ request }) => {
  console.log(request.all())
})
```

### 挑选值

`request.input`、`request.only` 和 `request.except` 方法可以从请求数据中挑选特定属性。所有挑选方法都会在请求体和查询字符串中查找值。

`request.only` 方法返回仅包含提到的属性的对象。

```ts
import router from '@adonisjs/core/services/router'

router.post('login', async ({ request }) => {
  const credentials = request.only(['email', 'password'])

  console.log(credentials)
})
```

`request.except` 方法返回排除提到的属性的对象。

```ts
import router from '@adonisjs/core/services/router'

router.post('register', async ({ request }) => {
  const userDetails = request.except(['password_confirmation'])

  console.log(userDetails)
})
```

`request.input` 方法返回特定属性的值。你可以选择传递默认值作为第二个参数。当缺少实际值时，将返回默认值。

```ts
import router from '@adonisjs/core/services/router'

router.post('comments', async ({ request }) => {
  const email = request.input('email')
  const commentBody = request.input('body')
})
```

### 类型安全的请求体

默认情况下，AdonisJS 不会对 `request.all`、`request.body` 或挑选方法强制执行数据类型，因为它无法提前知道请求体的预期内容。

为了确保类型安全，你可以使用 [验证器](./validation.md) 来验证和解析请求体，确保所有值都是正确的并且符合预期类型。

## 请求 URL

`request.url` 方法返回相对于主机名的请求 URL。默认情况下，返回值不包含查询字符串。但是，你可以通过调用 `request.url(true)` 来获取包含查询字符串的 URL。

```ts
import router from '@adonisjs/core/services/router'

router.get('/users', async ({ request }) => {
  /*
   * URL: /users?page=1&limit=20
   * url: /users
   */
  request.url()

  /*
   * URL: /users?page=1&limit=20
   * url: /users?page=1&limit=20
   */
  request.url(true) // returns query string
})
```

`request.completeUrl` 方法返回完整的 URL，包括主机名。同样，除非明确告知，否则返回值不包含查询字符串。

```ts
import router from '@adonisjs/core/services/router'

router.get('/users', async ({ request }) => {
  request.completeUrl()
  request.completeUrl(true) // returns query string
})
```

## 请求头

`request.headers` 方法以对象形式返回请求头。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.headers())
})
```

你可以使用 `request.header` 方法访问单个请求头的值。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  request.header('x-request-id')

  // Header name is not case sensitive
  request.header('X-REQUEST-ID')
})
```

## 请求方法

`request.method` 方法返回当前请求的 HTTP 方法。当启用 [表单方法伪造](#form-method-spoofing) 时，此方法返回伪造的方法，你可以使用 `request.intended` 方法获取原始请求方法。

```ts
import router from '@adonisjs/core/services/router'

router.patch('posts', async ({ request }) => {
  /**
   * The method that was used for route matching
   */
  console.log(request.method())

  /**
   * The actual request method
   */
  console.log(request.intended())
})
```

## 用户 IP 地址

`request.ip` 方法返回当前 HTTP 请求的用户 IP 地址。此方法依赖于 Nginx 或 Caddy 等代理服务器设置的 [`X-Forwarded-For`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) 标头。

:::note

阅读 [受信任的代理](#configuring-trusted-proxies) 部分以配置应用程序应信任的代理。

:::

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.ip())
})
```

`request.ips` 方法返回中间代理设置的所有 IP 地址的数组。该数组按最受信任到最不受信任的 IP 地址排序。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.ips())
})
```

### 定义自定义 `getIp` 方法

如果受信任的代理设置不足以确定正确的 IP 地址，你可以实现自定义的 `getIp` 方法。

该方法在 `config/app.ts` 文件中的 `http` 设置对象下定义。

```ts
export const http = defineConfig({
  getIp(request) {
    const ip = request.header('X-Real-Ip')
    if (ip) {
      return ip
    }

    return request.ips()[0]
  }
})
```

## 内容协商

AdonisJS 通过解析所有通常支持的 `Accept` 标头，为 [内容协商](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation#server-driven_content_negotiation) 提供了多种方法。例如，你可以使用 `request.types` 方法获取给定请求接受的所有内容类型的列表。

`request.types` 方法的返回值按客户端的偏好排序（最喜欢的排在第一位）。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.types())
})
```

以下是内容协商方法的完整列表。

| Method    | HTTP header in use                                                                           |
|-----------|----------------------------------------------------------------------------------------------|
| types     | [Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)                   |
| languages | [Accept-language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language) |
| encodings | [Accept-encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding) |
| charsets  | [Accept-charset](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Charset)   |

有时你想根据服务器支持的内容查找首选内容类型。

为此，你可以使用 `request.accepts` 方法。该方法接受支持的内容类型数组，并在检查 `Accept` 标头后返回最首选的内容类型。当找不到匹配项时返回 `null` 值。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts', async ({ request, view }) => {
  const posts = [
    {
      title: 'Adonis 101',
    },
  ]

  const bestMatch = request.accepts(['html', 'json'])

  switch (bestMatch) {
    case 'html':
      return view.render('posts/index', { posts })
    case 'json':
      return posts
    default:
      return view.render('posts/index', { posts })
  }
})
```

与 `request.accept` 类似，以下方法可用于查找其他 `Accept` 标头的首选值。

```ts
// Preferred language
const language = request.language(['fr', 'de'])

// Preferred encoding
const encoding = request.encoding(['gzip', 'br'])

// Preferred charset
const charset = request.charset(['utf-8', 'hex', 'ascii'])
```

## 生成请求 ID

请求 ID 通过为每个 HTTP 请求分配唯一的 ID，帮助你从日志中 [调试和跟踪应用程序问题](https://blog.heroku.com/http_request_id_s_improve_visibility_across_the_application_stack)。默认情况下，请求 ID 创建是禁用的。但是，你可以在 `config/app.ts` 文件中启用它。

:::note

请求 ID 使用 [cuid2](https://github.com/paralleldrive/cuid2) 包生成。在生成 ID 之前，我们会检查 `X-Request-Id` 请求头并使用其值（如果存在）。

:::

```ts
// title: config/app.ts
export const http = defineConfig({
  generateRequestId: true
})
```

启用后，你可以使用 `request.id` 方法访问 ID。

```ts
router.get('/', ({ request }) => {
  // ckk9oliws0000qt3x9vr5dkx7
  console.log(request.id())
})
```

相同的请求 ID 也会添加到使用 `ctx.logger` 实例生成的所有日志中。

```ts
router.get('/', ({ logger }) => {
  // { msg: 'hello world', request_id: 'ckk9oliws0000qt3x9vr5dkx7' }
  logger.info('hello world')
})
```

## 配置受信任的代理

大多数 Node.js 应用程序部署在 Nginx 或 Caddy 等代理服务器后面。因此，我们必须依靠 HTTP 标头（如 `X-Forwarded-Host`、`X-Forwarded-For` 和 `X-Forwarded-Proto`）来了解发出 HTTP 请求的真实终端客户端。

这些标头仅在你的 AdonisJS 应用程序可以信任源 IP 地址时使用。

你可以在 `config/app.ts` 文件中使用 `http.trustProxy` 配置选项配置要信任的 IP 地址。

```ts
import proxyAddr from 'proxy-addr'

export const http = defineConfig({
  trustProxy: proxyAddr.compile(['127.0.0.1/8', '::1/128'])
})
```

`trustProxy` 的值也可以是一个函数。如果 IP 地址受信任，该方法应返回 `true`；否则，返回 `false`。

```ts
export const http = defineConfig({
  trustProxy: (address) => {
    return address === '127.0.0.1' || address === '123.123.123.123'
  }
})
```

如果你在与应用程序代码相同的服务器上运行 Nginx，你需要信任回环 IP 地址，即 (127.0.0.1)。

```ts
import proxyAddr from 'proxy-addr'

export const http = defineConfig({
  trustProxy: proxyAddr.compile('loopback')
})
```

假设你的应用程序只能通过负载均衡器访问，并且你没有该负载均衡器的 IP 地址列表。那么，你可以通过定义一个始终返回 `true` 的回调来信任代理服务器。

```ts
export const http = defineConfig({
  trustProxy: () => true
})
```

## 配置查询字符串解析器

来自请求 URL 的查询字符串使用 [qs](http://npmjs.com/qs) 模块解析。你可以在 `config/app.ts` 文件中配置解析器设置。

[查看所有可用选项的列表](https://github.com/adonisjs/http-server/blob/main/src/types/qs.ts#L11)。

```ts
export const http = defineConfig({
  qs: {
    parse: {
    },
  }
})
```

## 表单方法伪造

HTML 表单上的表单方法只能设置为 `GET` 或 `POST`，这使得无法利用 [RESTful HTTP 方法](https://restfulapi.net/http-methods/)。

但是，AdonisJS 允许你使用 **表单方法伪造** 来解决此限制。表单方法伪造是一个花哨的术语，用于通过 `_method` 查询字符串指定表单方法。

要使方法伪造工作，你必须将表单操作设置为 `POST` 并在 `config/app.ts` 文件中启用该功能。

```ts
// title: config/app.ts
export const http = defineConfig({
  allowMethodSpoofing: true,
})
```

启用后，你可以如下所示伪造表单方法。

```html
<form method="POST" action="/articles/1?_method=PUT">
  <!-- Update form -->
</form>
```

```html
<form method="POST" action="/articles/1?_method=DELETE">
  <!-- Delete form -->
</form>
```

## 扩展 Request 类

你可以使用宏 (macros) 或 getter 向 Request 类添加自定义属性。如果你是第一次接触宏的概念，请务必先阅读 [扩展 AdonisJS 指南](../concepts/extending_the_framework.md)。

```ts
import { Request } from '@adonisjs/core/http'

Request.macro('property', function (this: Request) {
  return value
})
Request.getter('property', function (this: Request) {
  return value
})
```

由于宏和 getter 是在运行时添加的，你必须告知 TypeScript 它们的类型。

```ts
declare module '@adonisjs/core/http' {
  export interface Request {
    property: valueType
  }
}
```
