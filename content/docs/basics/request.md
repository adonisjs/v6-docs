---
summary: The Request class holds data for the ongoing HTTP request, including the request body, reference to uploaded files, cookies, request headers, and much more.
---

# Request

An instance of the [request class](https://github.com/adonisjs/http-server/blob/main/src/request.ts) holds data for the ongoing HTTP request, including the **request body**, **reference to uploaded files**, **cookies**, **request headers**, and much more. The request instance can be accessed using the `ctx.request` property.

## Query string and route params

The `request.qs` method returns the parsed query string as an object.

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

The `request.params` method returns an object of [Route params](./routing.md#route-params).

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

You can access a single parameter using the `request.param` method.

```ts
import router from '@adonisjs/core/services/router'

router.get('posts/:slug/comments/:id', async ({ request }) => {
  const slug = request.param('slug')
  const commentId = request.param('id')
})
```

## Request body

AdonisJS parses the request body using the [body-parser middleware](../basics/body_parser.md) registered inside the `start/kernel.ts` file.

You can access the request body using the `request.body()` method. It returns the parsed request body as an object.

```ts
import router from '@adonisjs/core/services/router'

router.post('/', async ({ request }) => {
  console.log(request.body())
})
```

The `request.all` method returns a merged copy of both the request body and the query string.

```ts
import router from '@adonisjs/core/services/router'

router.post('/', async ({ request }) => {
  console.log(request.all())
})
```

### Cherry-picking values

The `request.input`, `request.only`, and the `request.except` methods can cherry-pick specific properties from the request data. All the cherry-picking methods lookup for values inside both the request body and the query string.

The `request.only` method returns an object with only the mentioned properties.

```ts
import router from '@adonisjs/core/services/router'

router.post('login', async ({ request }) => {
  const credentials = request.only(['email', 'password'])

  console.log(credentials)
})
```

The `request.except` method returns an object excluding the mentioned properties.

```ts
import router from '@adonisjs/core/services/router'

router.post('register', async ({ request }) => {
  const userDetails = request.except(['password_confirmation'])

  console.log(userDetails)
})
```

The `request.input` method returns the value for a specific property. Optionally, you can pass a default value as the second argument. The default value is returned when the actual value is missing.

```ts
import router from '@adonisjs/core/services/router'

router.post('comments', async ({ request }) => {
  const email = request.input('email')
  const commentBody = request.input('body')
})
```

### Type-safe request body

By default, AdonisJS does not enforce data types for the `request.all`, `request.body`, or cherry-picking methods, as it cannot know the expected content of the request body in advance. 

To ensure type-safety, you can use the [validator](./validation.md) to validate and parse the request body, ensuring that all values are correct and match the expected types.

## Request URL

The `request.url` method returns the request URL relative to the hostname. By default, the return value does not include the query string. However, you can get the URL with query string by calling `request.url(true)`.

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

The `request.completeUrl` method returns the complete URL, including the hostname. Again, unless explicitly told, the return value does not include the query string.

```ts
import router from '@adonisjs/core/services/router'

router.get('/users', async ({ request }) => {
  request.completeUrl()
  request.completeUrl(true) // returns query string
})
```

## Request headers

The `request.headers` method returns the request headers as an object.

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.headers())
})
```

You can access the value for an individual header using the `request.header` method.

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  request.header('x-request-id')

  // Header name is not case sensitive
  request.header('X-REQUEST-ID')
})
```

## Request method

The `request.method` method returns the HTTP method for the current request. This method returns the spoofed method when [form method spoofing](#form-method-spoofing) is enabled, and you can use the `request.intended` method to get the original request method.

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

## User IP Address

The `request.ip` method returns the user IP address for the current HTTP request. This method relies on the [`X-Forwarded-For`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) header set by proxy servers like Nginx or Caddy.

:::note

Read the [trusted proxies](#configuring-trusted-proxies) section to configure the proxies your application should trust.

:::

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.ip())
})
```

The `request.ips` method returns an array of all the IP addresses set by intermediate proxies. The array is sorted by most trusted to least trusted IP address.

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.ips())
})
```

### Defining a custom `getIp` method

If the trusted proxy settings are insufficient to determine the correct IP address, you can implement your custom `getIp` method.

The method is defined inside the `config/app.ts` file under the `http` settings object.

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

## Content negotiation

AdonisJS provides several methods for [content-negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation#server-driven_content_negotiation) by parsing all the commonly supported `Accept` headers. For example, you can use the `request.types` method to get a list of all the content types accepted by a given request.

The return value of the `request.types` method is ordered by the client's preference (most preferred first).

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.types())
})
```

Following is the complete list of content negotiation methods.

| Method    | HTTP header in use                                                                           |
|-----------|----------------------------------------------------------------------------------------------|
| types     | [Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)                   |
| languages | [Accept-language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language) |
| encodings | [Accept-encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding) |
| charsets  | [Accept-charset](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Charset)   |

Sometimes you want to find the preferred content type based on what the server can support.

For the same, you can use the `request.accepts` method. The method takes an array of supported content types and returns the most preferred one after inspecting the `Accept` header. A `null` value is returned when unable to find a match.

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

Similar to `request.accept`, the following methods can be used to find the preferred value for other `Accept` headers.

```ts
// Preferred language
const language = request.language(['fr', 'de'])

// Preferred encoding
const encoding = request.encoding(['gzip', 'br'])

// Preferred charset
const charset = request.charset(['utf-8', 'hex', 'ascii'])
```

## Generating request ids

Request ids help you [debug and trace application issues](https://blog.heroku.com/http_request_id_s_improve_visibility_across_the_application_stack) from logs by assigning a unique id to every HTTP request. By default, request id creation is disabled. However, you can enable it inside the `config/app.ts` file.

:::note

Request ids are generated using the [cuid2](https://github.com/paralleldrive/cuid2) package. Before generating an id, we check for the `X-Request-Id` request header and use its value (if it exists).

:::

```ts
// title: config/app.ts
export const http = defineConfig({
  generateRequestId: true
})
```

Once enabled, you can access the id using the `request.id` method.

```ts
router.get('/', ({ request }) => {
  // ckk9oliws0000qt3x9vr5dkx7
  console.log(request.id())
})
```

The same request-id is also added to all the logs generated using the `ctx.logger` instance.

```ts
router.get('/', ({ logger }) => {
  // { msg: 'hello world', request_id: 'ckk9oliws0000qt3x9vr5dkx7' }
  logger.info('hello world')
})
```

## Configuring trusted proxies

Most Node.js applications are deployed behind a proxy server like Nginx or Caddy. Therefore we have to rely on HTTP headers such as `X-Forwarded-Host`, `X-Forwarded-For`, and `X-Forwarded-Proto` to know about the real end-client making an HTTP request.

These headers are only used when your AdonisJS application can trust the source IP address.

You can configure which IP addresses to trust within the `config/app.ts` file using the `http.trustProxy` configuration option.

```ts
import proxyAddr from 'proxy-addr'

export const http = defineConfig({
  trustProxy: proxyAddr.compile(['127.0.0.1/8', '::1/128'])
})
```

The value for `trustProxy` can also be a function. The method should return `true` if the IP address is trusted; otherwise, return `false`.

```ts
export const http = defineConfig({
  trustProxy: (address) => {
    return address === '127.0.0.1' || address === '123.123.123.123'
  }
})
```

If you are running Nginx on the same server as your application code, you need to trust the loopback IP addresses, i.e. (127.0.0.1).

```ts
import proxyAddr from 'proxy-addr'

export const http = defineConfig({
  trustProxy: proxyAddr.compile('loopback')
})
```

Suppose your application is only accessible through a load balancer, and you do not have a list of IP addresses for that load balancer. Then, you can trust the proxy server by defining a callback that always returns `true`.

```ts
export const http = defineConfig({
  trustProxy: () => true
})
```

## Configuring query string parser

Query strings from the request URL are parsed using the [qs](http://npmjs.com/qs) module. You can configure the parser settings inside the `config/app.ts` file.

[View the list](https://github.com/adonisjs/http-server/blob/main/src/types/qs.ts#L11) of all the available options.

```ts
export const http = defineConfig({
  qs: {
    parse: {
    },
  }
})
```

## Form method spoofing

The form method on an HTML form can only be set to `GET`, or `POST`, making it impossible to leverage [restful HTTP methods](https://restfulapi.net/http-methods/).

However, AdonisJS allows you to workaround this limitation using **form method spoofing**. Form method spoofing is a fancy term for specifying the form method via the `_method` query string.

For method spoofing to work, you must set the form action to `POST` and enable the feature inside the `config/app.ts` file.

```ts
// title: config/app.ts
export const http = defineConfig({
  allowMethodSpoofing: true,
})
```

Once enabled, you can spoof the form method as follows.

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

## Extending Request class

You can add custom properties to the Request class using macros or getters. Make sure to read the [extending AdonisJS guide](../concepts/extending_the_framework.md) first if you are new to the concept of macros.

```ts
import { Request } from '@adonisjs/core/http'

Request.macro('property', function (this: Request) {
  return value
})
Request.getter('property', function (this: Request) {
  return value
})
```

Since the macros and getters are added at runtime, you must inform TypeScript about their types.

```ts
declare module '@adonisjs/core/http' {
  export interface Request {
    property: valueType
  }
}
```
