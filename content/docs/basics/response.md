---
summary: Response 类用于发送 HTTP 响应。它支持发送 HTML 片段、JSON 对象、流等。
---

# 响应 (Response)

[Response 类](https://github.com/adonisjs/http-server/blob/main/src/response.ts) 的实例用于响应 HTTP 请求。AdonisJS 支持发送 **HTML 片段**、**JSON 对象**、**流** 等。可以通过 `ctx.response` 属性访问响应实例。

## 发送响应

发送响应的最简单方法是从路由处理程序返回值。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  /** Plain string */
  return 'This is the homepage.'

  /** Html fragment */
  return '<p> This is the homepage </p>'

  /** JSON response */
  return { page: 'home' }

  /** Converted to ISO string */
  return new Date()
})
```

除了从路由处理程序返回值外，还可以使用 `response.send` 方法显式设置响应体。但是，多次调用 `response.send` 方法将覆盖旧的响应体，只保留最新的响应体。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  /** Plain string */
  response.send('This is the homepage')

  /** Html fragment */
  response.send('<p> This is the homepage </p>')

  /** JSON response */
  response.send({ page: 'home' })

  /** Converted to ISO string */
  response.send(new Date())
})
```

可以使用 `response.status` 方法设置响应的自定义状态码。

```ts
response.status(200).send({ page: 'home' })

// Send empty 201 response
response.status(201).send('')
```

## 流式传输内容

`response.stream` 方法允许将流管道传输到响应。该方法在流完成后会在内部销毁流。

`response.stream` 方法不会设置 `content-type` 和 `content-length` 标头；在流式传输内容之前，必须显式设置它们。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  const image = fs.createReadStream('./some-file.jpg')
  response.stream(image)
})
```

发生错误时，将向客户端发送 500 状态码。但是，你可以通过将回调定义为第二个参数来自定义错误代码和消息。

```ts
const image = fs.createReadStream('./some-file.jpg')

response.stream(image, () => {
  const message = 'Unable to serve file. Try again'
  const status = 400

  return [message, status]
})
```

## 下载文件

当你想从磁盘流式传输文件时，我们建议使用 `response.download` 方法而不是 `response.stream` 方法。这是因为 `download` 方法会自动设置 `content-type` 和 `content-length` 标头。

```ts
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'

router.get('/uploads/:file', async ({ response, params }) => {
  const filePath = app.makePath(`uploads/${params.file}`)

  response.download(filePath)
})
```

或者，你可以为文件内容生成 [Etag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)。使用 Etags 将有助于浏览器重用先前请求（如果有）的缓存响应。

```ts
const filePath = app.makePath(`uploads/${params.file}`)
const generateEtag = true

response.download(filePath, generateEtag)
```

与 `response.stream` 方法类似，你可以通过将回调定义为最后一个参数来发送自定义错误消息和状态码。

```ts
const filePath = app.makePath(`uploads/${params.file}`)
const generateEtag = true

response.download(filePath, generateEtag, (error) => {
  if (error.code === 'ENOENT') {
    return ['File does not exists', 404]
  }

  return ['Cannot download file', 400]
})
```

### 强制下载文件

`response.attachment` 方法与 `response.download` 方法类似，但它通过设置 [Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition) 标头强制浏览器将文件保存在用户的计算机上。

```ts
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'

router.get('/uploads/:file', async ({ response, params }) => {
  const filePath = app.makePath(`uploads/${params.file}`)

  response.attachment(filePath, 'custom-filename.jpg')
})
```

## 设置响应状态和标头

### 设置状态

你可以使用 `response.status` 方法设置响应状态。调用此方法将覆盖现有的响应状态（如果有）。但是，你可以使用 `response.safeStatus` 方法仅在状态为 `undefined` 时设置状态。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  /**
   * Sets the status to 200
   */
  response.safeStatus(200)

  /**
   * Does not set the status since it
   * is already set
   */
  response.safeStatus(201)
})
```

### 设置标头

你可以使用 `response.header` 方法设置响应标头。此方法将覆盖现有的标头值（如果已存在）。但是，你可以使用 `response.safeHeader` 方法仅在标头为 `undefined` 时设置标头。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  /**
   * Defines the content-type header
   */
  response.safeHeader('Content-type', 'text/html')

  /**
   * Does not set the content-type header since it
   * is already set
   */
  response.safeHeader('Content-type', 'text/html')
})
```

你可以使用 `response.append` 方法将值附加到现有的标头值。

```ts
response.append('Set-cookie', 'cookie-value')
```

`response.removeHeader` 方法删除现有的标头。

```ts
response.removeHeader('Set-cookie')
```

### X-Request-Id 标头

如果当前请求中存在该标头，或者启用了 [生成请求 ID](./request#generating-request-ids)，则该标头将出现在响应中。

## 重定向

`response.redirect` 方法返回 [Redirect](https://github.com/adonisjs/http-server/blob/main/src/redirect.ts) 类的实例。重定向类使用流畅的 API 来构建重定向 URL。

执行重定向的最简单方法是使用重定向路径调用 `redirect.toPath` 方法。

```ts
import router from '@adonisjs/core/services/router'

router.get('/posts', async ({ response }) => {
  response.redirect().toPath('/articles')
})
```

重定向类还允许从预先注册的路由构建 URL。`redirect.toRoute` 方法接受 [路由标识符](./routing.md#route-identifier) 作为第一个参数，将路由参数作为第二个参数。

```ts
import router from '@adonisjs/core/services/router'

router.get('/articles/:id', async () => {}).as('articles.show')

router.get('/posts/:id', async ({ response, params }) => {
  response.redirect().toRoute('articles.show', { id: params.id })
})
```

### 重定向回上一页

在表单提交期间出现验证错误时，你可能希望将用户重定向回上一页。你可以使用 `redirect.back` 方法来做到这一点。

```ts
response.redirect().back()
```

### 重定向状态码

重定向响应的默认状态为 `302`；你可以通过调用 `redirect.status` 方法来更改它。

```ts
response.redirect().status(301).toRoute('articles.show', { id: params.id })
```

### 带有查询字符串的重定向

你可以使用 `withQs` 方法将查询字符串附加到重定向 URL。该方法接受键值对对象并将其转换为字符串。

```ts
response.redirect().withQs({ page: 1, limit: 20 }).toRoute('articles.index')
```

要从当前请求 URL 转发查询字符串，请在没有任何参数的情况下调用 `withQs` 方法。

```ts
// Forward current URL query string
response.redirect().withQs().toRoute('articles.index')
```

当重定向回上一页时，`withQs` 方法将转发上一页的查询字符串。

```ts
// Forward current URL query string
response.redirect().withQs().back()
```

## 中止请求并报错

你可以使用 `response.abort` 方法通过引发异常来结束请求。该方法将抛出 `E_HTTP_REQUEST_ABORTED` 异常并触发 [异常处理](./exception_handling.md) 流程。

```ts
router.get('posts/:id/edit', async ({ response, auth, params }) => {
  const post = await Post.findByOrFail(params.id)

  if (!auth.user.can('editPost', post)) {
    response.abort({ message: 'Cannot edit post' })
  }

  // continue with the rest of the logic
})
```

默认情况下，该异常将创建一个状态码为 `400` 的 HTTP 响应。但是，你可以指定自定义状态码作为第二个参数。

```ts
response.abort({ message: 'Cannot edit post' }, 403)
```

## 响应完成后运行操作

你可以使用 `response.onFinish` 方法监听 Node.js 完成将响应写入 TCP 套接字的事件。在底层，我们使用 [on-finished](https://github.com/jshttp/on-finished) 包，因此请随时查阅该包的 README 文件以获取深入的技术说明。

```ts
router.get('posts', ({ response }) => {
  response.onFinish(() => {
    // cleanup logic
  })
})
```

## 访问 Node.js `res` 对象

你可以使用 `response.response` 属性访问 [Node.js res 对象](https://nodejs.org/dist/latest-v19.x/docs/api/http.html#class-httpserverresponse)。

```ts
router.get('posts', ({ response }) => {
  console.log(response.response)
})
```

## 响应体序列化

使用 `response.send` 方法设置的响应体在 [作为响应写入](https://nodejs.org/dist/latest-v18.x/docs/api/http.html#responsewritechunk-encoding-callback) 到传出消息流之前会被序列化为字符串。

以下是支持的数据类型及其序列化规则的列表。

- 数组和对象使用 [安全字符串化函数](https://github.com/poppinss/utils/blob/main/src/json/safe_stringify.ts) 进行字符串化。该方法类似于 `JSON.stringify`，但会删除循环引用并序列化 `BigInt(s)`。
- 数字和布尔值转换为字符串。
- Date 类的实例通过调用 `toISOString` 方法转换为字符串。
- 正则表达式和错误对象通过调用 `toString` 方法转换为字符串。
- 任何其他数据类型都会导致异常。

### 内容类型推断

序列化响应后，响应类会自动推断并设置 `content-type` 和 `content-length` 标头。

以下是我们设置 `content-type` 标头所遵循的规则列表。

- 对于数组和对象，内容类型设置为 `application/json`。
- 对于 HTML 片段，它设置为 `text/html`。
- JSONP 响应使用 `text/javascript` 内容类型发送。
- 对于其他所有内容，内容类型设置为 `text/plain`。

## 扩展 Response 类

你可以使用宏 (macros) 或 getter 向 Response 类添加自定义属性。如果你是第一次接触宏的概念，请务必先阅读 [扩展 AdonisJS 指南](../concepts/extending_the_framework.md)。

```ts
import { Response } from '@adonisjs/core/http'

Response.macro('property', function (this: Response) {
  return value
})
Response.getter('property', function (this: Response) {
  return value
})
```

由于宏和 getter 是在运行时添加的，你必须告知 TypeScript 它们的类型。

```ts
declare module '@adonisjs/core/http' {
  export interface Response {
    property: valueType
  }
}
```
