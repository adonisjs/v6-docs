# CORS

[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) helps you protect your application from malicious requests triggered using scripts in a browser environment. 

For example, if an AJAX or a fetch request is sent to your server from a different domain, the browser will block that request with a CORS error and expect you to implement a CORS policy if you think the request should be allowed.

In AdonisJS, you can implement the CORS policy using the `@adonisjs/cors` package. The package ships with an HTTP middleware that intercepts incoming requests and responds with correct CORS headers.

## Installation

You can install the package from the npm packages registry.


:::codegroup


```sh
// title: npm
npm i @adonisjs/cors@next
```

```sh
// title: yarn
yarn add @adonisjs/cors@next
```

```sh
// title: pnpm
pnpm add @adonisjs/cors@next
```

:::

After installing the package, run the following command to configure the package.

```sh
node ace configure @adonisjs/cors
```

Finally, register the `cors_middleware` to the [server middleware list](../http/middleware.md#server-middleware). The CORS middleware **should be the first middleware in the stack**.

```ts
// title: start/kernel.ts
server.use([
  () => import('@adonisjs/cors/cors_middleware')
])
```

## Configuration

The configuration for the CORS middleware is stored inside the `config/cors.ts` file. 

```ts
import { defineConfig } from '@adonisjs/cors'

export default defineConfig({
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
```

<dl>

<dt>

enabled

</dt>

<dd>

Turn the middleware on or off temporarily without removing it from the middleware stack.

</dd>

<dt>

origin

</dt>

<dd>

The `origin` property controls the value for the [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) header.

You can allow the request's current origin by setting the value to `true` or disallow the request's current origin by setting it to `false`.

```ts
{
  origin: true
}
```

You may specify a list of hardcoded origins to allow an array of domain names.

```ts
{
  origin: ['adonisjs.com']
}
```

Use the wildcard expression `*` to allow all the origins. Read the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin#directives) to understand how the wildcard expression works.

When the `credentials` property is set to `true`, we will automatically make the wildcard expression behave like a `boolean (true)`. 

```ts
{
  origin: '*'
}
```

You can compute the `origin` value during the HTTP request using a function. For example:

```ts
{
  origin: (requestOrigin, ctx) => {
    return true
  }
}
```

</dd>

<dt>

methods

</dt>

<dd>

The `methods` property controls the method to allow during the preflight request. The [Access-Control-Request-Method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method) header value is checked against the allowed methods.

```sh
{
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE']
}
```

</dd>

<dt>

headers

</dt>

<dd>

The `headers` property controls the request headers to allow during the preflight request. The [Access-Control-Request-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers) header value is checked against the headers property.

Setting the value to `true` will allow all the headers. Whereas setting the value to `false` will disallow all the headers.

```ts
{
  headers: true
}
```

You can specify a list of headers to allow by defining them as an array of strings.

```ts
{
  headers: [
    'Content-Type',
    'Accept',
    'Cookie'
  ]
}
```

You can compute the `headers` config value using a function during the HTTP request. For example:

```ts
{
  headers: (requestHeaders, ctx) => {
    return true
  }
}
```

</dd>

<dt>

exposeHeaders

</dt>

<dd>

The `exposeHeaders` property controls the headers to expose via [Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers) header during the preflight request.

```ts
{
  exposeHeaders: [
    'cache-control',
    'content-language',
    'content-type',
    'expires',
    'last-modified',
    'pragma',
  ]
}
```

</dd>

<dt>

credentials

</dt>

<dd>

The `credentials` property controls whether to set the [Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials) header during the preflight request.

```ts
{
  credentials: true
}
```

</dd>

<dt>

maxAge

</dt>

<dd>

The `maxAge` property controls the [Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age) response header. The value is in seconds.

- Setting the value to `null` will not set the header.
- Whereas setting it to `-1 `does set the header but disables the cache.

```ts
{
  maxAge: 90
}
```

</dd>

</dl>

## Debugging CORS errors
Debugging CORS issues is a challenging experience. However, there are no shortcuts other than understanding the rules of CORS and debugging the response headers to ensure everything is in place.

Following are some links to the articles you may read to understand better how CORS works.

- [How to Debug Any CORS Error](https://httptoolkit.com/blog/how-to-debug-cors-errors/)
- [Will it CORS?](https://httptoolkit.com/will-it-cors/)
- [MDN in-depth explanation of CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
