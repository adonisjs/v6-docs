---
summary: 了解如何在 AdonisJS 中实现 CORS 以保护你的应用。
---

# 跨域资源共享 (CORS)

[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) 帮助你保护你的应用免受在浏览器环境中使用脚本触发的恶意请求。

例如，如果从不同的域向你的服务器发送 AJAX 或 fetch 请求，浏览器将使用 CORS 错误阻止该请求，并期望你在认为应该允许该请求时实现 CORS 策略。

在 AdonisJS 中，你可以使用 `@adonisjs/cors` 包实现 CORS 策略。该包附带一个 HTTP 中间件，用于拦截传入请求并使用正确的 CORS 标头进行响应。

## 安装

使用以下命令安装并配置该包：

```sh
node ace add @adonisjs/cors
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/cors` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。

    ```ts
    {
      providers: [
        // ...其他提供者
        () => import('@adonisjs/cors/cors_provider')
      ]
    }
    ```

3. 创建 `config/cors.ts` 文件。此文件包含 CORS 的配置设置。

4. 在 `start/kernel.ts` 文件中注册以下中间件。

    ```ts
    server.use([
      () => import('@adonisjs/cors/cors_middleware')
    ])
    ```

:::

## 配置

CORS 中间件的配置存储在 `config/cors.ts` 文件中。

```ts
import { defineConfig } from '@adonisjs/cors'

const corsConfig = defineConfig({
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
```

<dl>

<dt>

enabled

</dt>

<dd>

暂时开启或关闭中间件，而无需将其从中间件堆栈中移除。

</dd>

<dt>

origin

</dt>

<dd>

`origin` 属性控制 [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) 标头的值。

你可以通过将值设置为 `true` 来允许请求的当前来源，或者通过将其设置为 `false` 来禁止请求的当前来源。

```ts
{
  origin: true
}
```

你可以指定一个硬编码的来源列表，以允许一组域名。

```ts
{
  origin: ['adonisjs.com']
}
```

使用通配符表达式 `*` 允许所有来源。阅读 [MDN 文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin#directives) 了解通配符表达式的工作原理。

当 `credentials` 属性设置为 `true` 时，我们会自动使通配符表达式的行为像 `boolean (true)` 一样。

```ts
{
  origin: '*'
}
```

你可以使用函数在 HTTP 请求期间计算 `origin` 值。例如：

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

`methods` 属性控制在预检请求期间允许的方法。[Access-Control-Request-Method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method) 标头值将根据允许的方法进行检查。

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

`headers` 属性控制在预检请求期间允许的请求标头。[Access-Control-Request-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers) 标头值将根据 headers 属性进行检查。

将值设置为 `true` 将允许所有标头。而将值设置为 `false` 将禁止所有标头。

```ts
{
  headers: true
}
```

你可以通过将它们定义为字符串数组来指定允许的标头列表。

```ts
{
  headers: [
    'Content-Type',
    'Accept',
    'Cookie'
  ]
}
```

你可以在 HTTP 请求期间使用函数计算 `headers` 配置值。例如：

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

`exposeHeaders` 属性控制在预检请求期间通过 [Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers) 标头公开的标头。

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

`credentials` 属性控制是否在预检请求期间设置 [Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials) 标头。

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

`maxAge` 属性控制 [Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age) 响应标头。值以秒为单位。

- 将值设置为 `null` 将不会设置标头。
- 而将其设置为 `-1` 会设置标头但禁用缓存。

```ts
{
  maxAge: 90
}
```

</dd>

</dl>

## 调试 CORS 错误
调试 CORS 问题是一种具有挑战性的体验。但是，除了理解 CORS 规则并调试响应标头以确保一切就绪之外，没有其他捷径。

以下是一些你可以阅读以更好地了解 CORS 工作原理的文章链接。

- [如何调试任何 CORS 错误](https://httptoolkit.com/blog/how-to-debug-cors-errors/)
- [Will it CORS?](https://httptoolkit.com/will-it-cors/)
- [MDN 对 CORS 的深入解释](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
