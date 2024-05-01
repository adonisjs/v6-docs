# Static files server

You can serve static files from a given directory using the `@adonisjs/static` package. The package ships with a middleware that you must register in the [server middleware stack](middleware.md#server-middleware-stack) to intercept the HTTP requests and serve files.

## Installation

The package comes pre-configured with the `web` starter kit. However, you can install and configure it as follows with other starter kits.


Install and configure the package using the following command :

```sh
node ace add @adonisjs/static
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `@adonisjs/static` package using the detected package manager.

2. Registers the following service provider inside the `adonisrc.ts` file.

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/static/static_provider')
      ]
    }
    ```

3. Create the `config/static.ts` file.

4. Registers the following middleware inside the `start/kernel.ts` file.

    ```ts
    server.use([
      () => import('@adonisjs/static/static_middleware')
    ])
    ```

:::

## Configuration

The configuration for the static middleware is stored inside the `config/static.ts` file.

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

Enable or disable the middleware temporarily without removing it from the middleware stack.

</dd>

<dt>

  acceptRanges

</dt>

<dd>

The `Accept-Range` header allows browsers to resume an interrupted file download instead of trying to restart the download. You can disable resumable downloads by setting `acceptsRanges` to `false`.

Defaults to `true`.

</dd>

<dt>

  cacheControl

</dt>

<dd>

Enable or disable the [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) header. The `immutable` and `maxAge` properties will be ignored when `cacheControl` is disabled.


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

Define how to treat requests for dot files inside the `public` directory. You can set one of the following options.

- `allow`: Serve the dot-file same as the other files.
- `deny`: Deny the request with the `403` status code.
- `ignore`: Pretend the file does not exist and respond with a `404` status code.

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


Enable or disable [etag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) generation.

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


Enable or disable the [Last-Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified) header. The file [stat.mtime](https://nodejs.org/api/fs.html#statsmtime) property is used as the value for the header.

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


Enable or disable the [immutable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#immutable) directive for the `Cache-Control` header. By default, the `immutable` property is disabled.

If the `immutable` property is enabled, you must define the `maxAge` property to enable caching.

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

Define the [max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#max-age) directive for the `Cache-Control` header. The value should be either in milliseconds or a time expression string.

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

A function that returns an object of headers to set on the response. The function receives the file path as the first argument and the [file stats](https://nodejs.org/api/fs.html#class-fsstats) object as the second argument.

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

## Serving static files

Once the middleware is registered, you may create files inside the `public` directory and access them in the browser using the file path. For example, the `./public/css/style.css` file can be accessed using the `http://localhost:3333/css/style.css` URL.

The files in the `public` directory are not compiled or built using an assets bundler. If you want to compile frontend assets, you must place them inside the `resources` directory and use the [assets bundler](../../basics/vite).

## Copying static files to production build
The static files stored inside the `/public` directory are automatically copied to the `build` folder when you run `node ace build` command.

The rule for copying public files is defined inside the `adonisrc.ts` file.

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
