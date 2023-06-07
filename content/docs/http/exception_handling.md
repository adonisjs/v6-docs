# Exception handling

Exceptions raised during an HTTP request are handled by the `HttpExceptionHandler` defined inside the `./app/exceptions/handler.ts` file. Inside this file, you can decide how to convert exceptions to responses and log them using the logger or report them to an external logging provider.

The `HttpExceptionHandler` extends the [ExceptionHandler](https://github.com/adonisjs/http-server/blob/next/src/exception_handler.ts) class, which does all the heavy lifting of handling errors and provides you with high-level APIs to tweak the reporting and rendering behavior.

```ts
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = true

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }

  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }
}
```

## Assigning error handler to the server

The error handler is registered with the AdonisJS HTTP server inside the `start/kernel.ts` file. We lazily import the HTTP handler using the `#exceptions` alias defined in the `package.json` file.

```ts
server.errorHandler(() => import('#exceptions/handler'))
```

## Handling exceptions

The exceptions are handled by the `handle` method on the exceptions handler class. By default, the following steps are performed while handling an error.

- Check if the error instance has a `handle` method. If yes, call the [error.handle](#self-handled-exceptions) method and return its response.
- Check if a status page is defined for the `error.status` code. If yes, render the status page.
- Otherwise, render the exception using content negotiation renderers.

If you want to handle a specific exception differently, you can do that inside the `handle` method.

```ts
import { errors } from '@adonisjs/core'

async handle(error: unknown, ctx: HttpContext) {
  if (error instanceof errors.E_VALIDATION_EXCEPTION) {
    //self-handle validation exception
    return
  }
  
  return super.handle(error, ctx)
}
```

### Status pages

Status pages are a collection of templates you want to render for a given or a range of status codes. 

The range of status codes can be defined as a string expression. Two dots separate the starting and the ending status codes (`..`).

If you are creating a JSON server, you may not need status pages.

```ts
export default class HttpExceptionHandler extends ExceptionHandler {
  protected statusPages = {
    '404': ({ view }) => view.render('errors/not-found'),
    '500..599': ({ view }) => view.render('errors/server-error')
  }
}
```

### Debug mode

The content negotiation renderers handle exceptions that are not self-handled and not converted to a status page.

The content negotiation renderers have support for debug mode. They can parse and pretty-print errors in debug mode using the [Youch](https://www.npmjs.com/package/youch) npm package.

You can toggle the debug mode using the `debug` property on the exceptions handler class. However, turning off the debug mode in production is recommended, as it exposes sensitive information about your app.

```ts
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
}
```

## Reporting exceptions

The `report` method on the exceptions handler class handles reporting of exceptions. 

The method receives the error as the first argument and the [HTTP context](./http_context.md) as the second argument. You should not write a response from the `report` method and use the context only to read the request information.

### Logging exceptions

All exceptions are reported using the [logger](../digging_deeper/logger.md) by default.

- Exceptions with status codes in the `400..499` range are logged in the `warning` level.
- Exceptions with the status code `>=500` are logged in the `error` level.
- All other exceptions are logged in the `info` level.

You can add custom properties to the log messages by returning an object from the `context` method.

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

### Ignoring status codes

You can ignore exceptions from being reported by defining an array of status codes via the `ignoreStatuses` property.

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

### Ignoring errors

You can also ignore exceptions by defining an array of error codes or error classes to ignore.

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

An array of exception classes can be ignored using the `ignoreExceptions` property.

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

### Custom `shouldReport` method

The logic to ignore status codes or exceptions is written inside the [`shouldReport` method](https://github.com/adonisjs/http-server/blob/next/src/exception_handler.ts#L218). If needed, you can override this method and define your custom logic for ignoring exceptions.

```ts
import { HttpError } from '@adonisjs/core/types/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected shouldReport(error: HttpError) {
    // return a boolean
  }
}
```

## Custom exceptions

You can create an exception class using the `make:exception` ace command. An exception extends the `Exception` class from the `@adonisjs/core` package.

See also: [Make exception scaffolding command](../digging_deeper/scaffolding.md#make-exception)

```sh
node ace make:exception UnAuthorized
```

```ts
import { Exception } from '@adonisjs/core'

export default class UnAuthorizedException extends Exception {}
```

You can raise the exception by creating a new instance of it. When raising the exception, you can assign a custom **error code** and **status code** to the exception.

```ts
import UnAuthorizedException from '#exceptions/unauthorized_exception'

throw new UnAuthorizedException('You are not authorized', {
  status: 403,
  code: 'E_UNAUTHORIZED'
})
```

The error and status codes can also be defined as static properties on the exception class. The static values will be used if no custom value is defined when throwing the exception.

```ts
import { Exception } from '@adonisjs/core'
export default class UnAuthorizedException extends Exception {
  static status = 403
  static code = 'E_UNAUTHORIZED'
}
```

### Defining the `handle` method

To self-handle the exception, you can define the `handle` method on the exception class. The method receives an instance of the error as the first argument and the HTTP context as the second argument.

```ts
import { Exception } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

export default class UnAuthorizedException extends Exception {
  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send(error.message)
  }
}
```

### Define the `report` method

You can implement the `report` method on the exception class to self-handle the exception reporting. The report method receives an instance of the error as the first argument and the HTTP context as the second argument.

```ts
import { Exception } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

export default class UnAuthorizedException extends Exception {
  async report(error: this, ctx: HttpContext) {
    ctx.logger.error({ err: err }, error.message)
  }
}
```

## Known errors

Following is the list of known errors thrown by the framework's core and first-party packages.

You can test if an error is an instance of a specific error code using the `instanceof` check.

```ts
import { errors } from '@adonisjs/core'

try {
  router.builder().make('articles.index')
} catch (error: unknown) {
  if (error instanceof errors.E_CANNOT_LOOKUP_ROUTE) {
    // handle error
  }
}
```

<dl>

<dt>

#### E_ROUTE_NOT_FOUND

</dt>

<dd>

This error is raised when the HTTP server cannot find a route for a given request. The exception will be converted to a `404` response.

</dd>

<dt>

#### E_CANNOT_LOOKUP_ROUTE

</dt>

<dd>

This error is raised when the [URL builder](./url_builder.md) cannot look up a route when creating a URL. 

</dd>

<dt>

#### E_HTTP_EXCEPTION

</dt>

<dd>

This error is a generic error that may get raised during an HTTP request to abort the request. The `response.abort` method throws this error.

</dd>

<dt>

#### E_HTTP_REQUEST_ABORTED

</dt>

<dd>

This error is raised when the client aborts the HTTP request as the server tries to process the request body.

</dd>


<dt> 

#### E_INSECURE_APP_KEY

</dt>

<dd>

This error is raised when the value `appKey` stored inside the `config/app.ts` file is not at least 16 characters long.

</dd>

<dt> 

#### E_MISSING_APP_KEY

</dt>

<dd>

This error is raised when the value `appKey` stored inside the `config/app.ts` is not defined. The `appKey` is required for encrypting data throughout your AdonisJS application.

</dd>

<dt> 

#### E_MISSING_METAFILE_PATTERN

</dt>

<dd>

This error is raised when a [metaFile](../fundamentals/adonisrc_file.md#metafiles) entry is defined without the `pattern` property.

</dd>

<dt> 

#### E_MISSING_PRELOAD_FILE

</dt>

<dd>

This error is raised when a [preload file](../fundamentals/adonisrc_file.md#preloads) entry is defined without the `file` property.

</dd>

<dt> 

#### E_MISSING_PROVIDER_FILE

</dt>

<dd>

This error is raised when a [provider](../fundamentals/adonisrc_file.md#providers) entry is defined without the `file` property.


</dd>

<dt> 

#### E_MISSING_SUITE_NAME

</dt>

<dd>

This error is raised when a [test suite](../fundamentals/adonisrc_file.md#tests) entry is defined without the `name` property.

</dd>

<dt> 

#### E_MISSING_BUNDLER_DEV_COMMAND

</dt>

<dd>

This error is raised when the [assets bundler](../fundamentals/adonisrc_file.md#assetsbundler) entry is defined without the `dev` command.

</dd>

<dt> 

#### E_MISSING_BUNDLER_BUILD_COMMAND

</dt>

<dd>

This error is raised when the [assets bundler](../fundamentals/adonisrc_file.md#assetsbundler) entry is defined without the `build` command.

</dd>

<dt> 

#### E_MISSING_BUNDLER_NAME

</dt>

<dd>

This error is raised when the [assets bundler](../fundamentals/adonisrc_file.md#assetsbundler) entry is defined without the `name` command.

</dd>

<dt> 

#### E_INVALID_ENV_VARIABLES

</dt>

<dd>

This error is raised when the environment variables validation fails.

</dd>

<dt> 

#### E_MISSING_COMMAND_NAME

</dt>

<dd>

This error is raised when an Ace command is defined with the `commandName` static property.

</dd>

<dt> 

#### E_COMMAND_NOT_FOUND

</dt>

<dd>

This error is raised when Ace cannot find a command by name.

</dd>

<dt> 

#### E_MISSING_FLAG

</dt>

<dd>

This error is raised when you attempt to run a command without a required flag.

</dd>

<dt> 

#### E_MISSING_FLAG_VALUE

</dt>

<dd>

This error is raised when you attempt to run a command with a flag but do not provide a value.

</dd>

<dt> 

#### E_MISSING_ARG

</dt>

<dd>

This error is raised when you attempt to run a command without a required argument.

</dd>

<dt> 

#### E_MISSING_ARG_VALUE

</dt>

<dd>

This error is raised when you attempt to run a command and provide an empty string as the argument value.

</dd>

<dt> 

#### E_UNKNOWN_FLAG

</dt>

<dd>

This error is raised when you mention a flag not accepted by the command.

</dd>

<dt> 

#### E_INVALID_FLAG

</dt>

<dd>

This error is raised when you mention you pass an invalid value for a command's flag. For example, The flag accepts a number and you pass it a string.

</dd>

</dl>

