# Exception handling

Exceptions raised during an HTTP request are handled by the `HttpExceptionHandler` defined inside the `./app/exceptions/handler.ts` file. Inside this file, you can decide how to convert exceptions to responses and log them using the logger or report them to an external logging provider.

The `HttpExceptionHandler` extends the [ExceptionHandler](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts) class, which does all the heavy lifting of handling errors and provides you with high-level APIs to tweak the reporting and rendering behavior.

```ts
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
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

- Check if the error instance has a `handle` method. If yes, call the [error.handle](#defining-the-handle-method) method and return its response.
- Check if a status page is defined for the `error.status` code. If yes, render the status page.
- Otherwise, render the exception using content negotiation renderers.

If you want to handle a specific exception differently, you can do that inside the `handle` method. Make sure to use the `ctx.response.send` method to send a response, since the return value from the `handle` method is discarded.

```ts
import { errors } from '@vinejs/vine'

async handle(error: unknown, ctx: HttpContext) {
  if (error instanceof errors.E_VALIDATION_EXCEPTION) {
    ctx.response.status(422).send(error.messages)
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
import { StatusPageRange, StatusPageRenderer } from '@adonisjs/http-server/types'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { view }) => view.render('errors/not-found'),
    '500..599': (_, { view }) => view.render('errors/server-error')
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

### Custom shouldReport method

The logic to ignore status codes or exceptions is written inside the [`shouldReport` method](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts#L155). If needed, you can override this method and define your custom logic for ignoring exceptions.

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

See also: [Make exception command](../reference/commands.md#makeexception)

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

To self-handle the exception, you can define the `handle` method on the exception class. This method should convert an error to an HTTP response using the `ctx.response.send` method.

The `error.handle` method receives an instance of the error as the first argument and the HTTP context as the second argument.

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
    ctx.logger.error({ err: error }, error.message)
  }
}
```

## Narrowing down the error type
The framework core and other official packages exports the exceptions raised by them. You can verify if an error is an instance of a specific exception using the `instanceof` check. For example:

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

## Known errors
Please check the [exceptions reference guide](../reference/exceptions.md) to view the list of known errors.
