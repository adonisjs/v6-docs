---
summary: 使用 @adonisjs/static 包从给定目录提供静态文件。
---

# 静态文件服务器 (Static files server)

你可以使用 `@adonisjs/static` 包从给定目录提供静态文件。该包附带一个中间件，你必须将其注册在 [服务器中间件堆栈](./middleware.md#server-middleware-stack) 中以拦截 HTTP 请求并提供文件。

## 安装

该包已在 `web` 启动套件中预先配置。但是，你可以使用以下命令在其他启动套件中安装和配置它。

使用以下命令安装并配置该包：

```sh
node ace add @adonisjs/static
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/static` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/static/static_provider')
      ]
    }
    ```

3. 创建 `config/static.ts` 文件。

4. 在 `start/kernel.ts` 文件中注册以下中间件。

    ```ts
    server.use([
      () => import('@adonisjs/static/static_middleware')
    ])
    ```

:::

## 配置

静态中间件的配置存储在 `config/static.ts` 文件中。

```ts
import { defineConfig } from '@adonisjs/static'

const staticServerConfig = defineConfig({
  enabled: true,
  etag: true,
  lastModified: true,
  dotFiles: 'ignore',
})

export default staticServerConfig
```

<dl>

<dt>

  enabled

</dt>

<dd>

临时启用或禁用中间件，而不将其从中间件堆栈中移除。

</dd>

<dt>

  acceptRanges

</dt>

<dd>

`Accept-Range` 标头允许浏览器恢复中断的文件下载，而不是尝试重新开始下载。你可以通过将 `acceptsRanges` 设置为 `false` 来禁用可恢复下载。

默认为 `true`。

</dd>

<dt>

  cacheControl

</dt>

<dd>

启用或禁用 [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) 标头。当 `cacheControl` 被禁用时，`immutable` 和 `maxAge` 属性将被忽略。


```ts
{
  cacheControl: true
}
```
</dd>


<dt>

  dotFiles

</dt>

<dd>

定义如何处理对 `public` 目录内的点文件的请求。你可以设置以下选项之一。

- `allow`: 像其他文件一样提供点文件。
- `deny`: 使用 `403` 状态码拒绝请求。
- `ignore`: 假装文件不存在并响应 `404` 状态码。

```ts
{
  dotFiles: 'ignore'
}
```

</dd>


<dt>

  etag

</dt>

<dd>


启用或禁用 [etag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) 生成。

```ts
{
  etag: true,
}
```

</dd>

<dt>

  lastModified

</dt>

<dd>


启用或禁用 [Last-Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified) 标头。文件 [stat.mtime](https://nodejs.org/api/fs.html#statsmtime) 属性用作标头的值。

```ts
{
  lastModified: true,
}
```

</dd>


<dt>

  immutable

</dt>

<dd>


启用或禁用 `Cache-Control` 标头的 [immutable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#immutable) 指令。默认情况下，`immutable` 属性被禁用。

如果启用了 `immutable` 属性，则必须定义 `maxAge` 属性以启用缓存。

```ts
{
  immutable: true
}
```

</dd>

<dt>

  maxAge

</dt>

<dd>

定义 `Cache-Control` 标头的 [max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#max-age) 指令。该值应为毫秒数或时间表达式字符串。

```ts
{
  maxAge: '30 mins'
}
```

</dd>

<dt>

  headers

</dt>

<dd>

一个返回要在响应上设置的标头对象的函数。该函数接收文件路径作为第一个参数，并接收 [文件 stats](https://nodejs.org/api/fs.html#class-fsstats) 对象作为第二个参数。

```ts
{
  headers: (path, stats) => {
    if (path.endsWith('.mc2')) {
      return {
        'content-type': 'application/octet-stream'
      }
    }
  }
}
```

</dd>


</dl>

## 提供静态文件

注册中间件后，你可以在 `public` 目录中创建文件，并使用文件路径在浏览器中访问它们。例如，可以使用 `http://localhost:3333/css/style.css` URL 访问 `./public/css/style.css` 文件。

`public` 目录中的文件不会使用资源打包器进行编译或构建。如果你想编译前端资源，必须将它们放在 `resources` 目录中并使用 [资源打包器](../basics/vite.md)。

## 将静态文件复制到生产构建

当你运行 `node ace build` 命令时，存储在 `/public` 目录中的静态文件会自动复制到 `build` 文件夹中。

复制公共文件的规则在 `adonisrc.ts` 文件中定义。

```ts
{
  metaFiles: [
    {
      pattern: 'public/**',
      reloadServer: false
    }
  ]
}
```
