---
summary: Learn about the HTTP context in AdonisJS and how to access it from route handlers, middleware, and exception handlers.
---

# HTTP context

A new instance of [HTTP Context class](https://github.com/adonisjs/http-server/blob/main/src/http_context/main.ts) is generated for every HTTP request and passed along to the route handler, middleware, and exception handler.

HTTP Context holds all the information you may need related to an HTTP request. For example:

- You can access the request body, headers, and query params using the [ctx.request](../basics/request.md) property.
- You can respond to the HTTP request using the [ctx.response](../basics/response.md) property.
- Access the logged-in user using the [ctx.auth](../authentication/introduction.md) property.
- Authorize user actions using the [ctx.bouncer](../security/authorization.md) property.
- And so on.

In a nutshell, the context is a request-specific store holding all the information for the ongoing request.

## Getting access to the HTTP context

The HTTP context is passed by reference to the route handler, middleware, and exception handler, and you can access it as follows.

### Route handler

The [router handler](../basics/routing.md) receives the HTTP context as the first parameter.

```ts
import router from '@adonisjs/core/services/router'

router.get('/', (ctx) => {
  console.log(ctx.inspect())
})
```

```ts
// title: Destructure properties
import router from '@adonisjs/core/services/router'

router.get('/', ({ request, response }) => {
  console.log(request.url())
  console.log(request.headers())
  console.log(request.qs())
  console.log(request.body())
  
  response.send('hello world')
  response.send({ hello: 'world' })
})
```

### Controller method

The [controller method](../basics/controllers.md) (similar to the router handler) receives the HTTP context as the first parameter.

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ request, response }: HttpContext) {
  }
}
```

### Middleware class

The `handle` method of the [middleware class](../basics/middleware.md) receives HTTP context as the first parameter. 

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class AuthMiddleware {
  async handle({ request, response }: HttpContext) {
  }
}
```

### Exception handler class

The `handle` and the `report` methods of the [global exception handler](../basics/exception_handling.md) class receive HTTP context as the second parameter. The first parameter is the `error` property.

```ts
import {
  HttpContext,
  HttpExceptionHandler
} from '@adonisjs/core/http'

export default class ExceptionHandler extends HttpExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
```

## Injecting HTTP Context using Dependency Injection

If you use Dependency injection throughout your application, you can inject the HTTP context to a class or a method by type hinting the `HttpContext` class.


:::warning

Ensure the `#middleware/container_bindings_middleware` middleware is registered inside the `start/kernel.ts` file. This middleware is required to resolve request-specific values (i.e., the HttpContext class) from the container.

:::

See also: [IoC container guide](../concepts/dependency_injection.md)

```ts
// title: app/services/user_service.ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UserService {
  constructor(protected ctx: HttpContext) {}
  
  all() {
    // method implementation
  }
}
```

For automatic dependency resolution to work, you must inject the `UserService` inside your controller. Remember, the first argument to a controller method will always be the context, and the rest will be injected using the IoC container.

```ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'

export default class UsersController {
  @inject()
  index(ctx: HttpContext, userService: UserService) {
    return userService.all()
  }
}
```

That's all! The `UserService` will now automatically receive an instance of the ongoing HTTP request. You can repeat the same process for nested dependencies as well.

## Accessing HTTP context from anywhere inside your application

Dependency injection is one way to accept the HTTP context as a class constructor or a method dependency and then rely on the container to resolve it for you.

However, it is not a hard requirement to restructure your application and use Dependency injection everywhere. You can also access the HTTP context from anywhere inside your application using the [Async local storage](https://nodejs.org/dist/latest-v21.x/docs/api/async_context.html#class-asynclocalstorage) provided by Node.js. 

We have a [dedicated guide](./async_local_storage.md) on how Async local storage works and how AdonisJS uses it to provide global access to the HTTP context.

In the following example, the `UserService` class uses the `HttpContext.getOrFail` method to get the HTTP context instance for the ongoing request.

```ts
// title: app/services/user_service.ts
import { HttpContext } from '@adonisjs/core/http'

export default class UserService {
  all() {
    const ctx = HttpContext.getOrFail()
    console.log(ctx.request.url())
  }
}
```

The following code block shows the `UserService` class usage inside the `UsersController`.

```ts
import { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'

export default class UsersController {
  index(ctx: HttpContext) {
    const userService = new UserService()
    return userService.all()
  }
}
```

## HTTP Context properties

Following is the list of properties you can access through the HTTP context. As you install new packages, they may add additional properties to the context.

<dl>
<dt>

ctx.request

</dt>

<dd>

Reference to an instance of the [HTTP Request class](../basics/request.md).

</dd>

<dt>

ctx.response

</dt>

<dd>

Reference to an instance of the [HTTP Response class](../basics/response.md).

</dd>

<dt>

ctx.logger

</dt>

<dd>

Reference to an instance of [logger](../digging_deeper/logger.md) created for a given HTTP request.

</dd>

<dt>

ctx.route

</dt>

<dd>

The matched route for the current HTTP request. The `route` property is an object of type [StoreRouteNode](https://github.com/adonisjs/http-server/blob/main/src/types/route.ts#L69)

</dd>

<dt>

ctx.params

</dt>

<dd>

An object of route params

</dd>

<dt>

ctx.subdomains

</dt>

<dd>

An object of route subdomains. Only exists when the route is part of a dynamic subdomain

</dd>

<dt>

ctx.session

</dt>

<dd>

Reference to an instance of [Session](../basics/session.md) created for the current HTTP request.

</dd>

<dt>

ctx.auth

</dt>

<dd>

Reference to an instance of the [Authenticator class](https://github.com/adonisjs/auth/blob/main/src/authenticator.ts). Learn more about [authentication](../authentication/introduction.md).

</dd>

<dt>

ctx.view

</dt>

<dd>

Reference to an instance of Edge renderer. Learn more about Edge in [View and templates guide](../views-and-templates/introduction.md#using-edge)

</dd>

<dt>

ctx\.ally

</dt>

<dd>

Reference to an instance of the [Ally Manager class](https://github.com/adonisjs/ally/blob/main/src/ally_manager.ts) to implement social login in your apps. Learn more about [Ally](../authentication/social_authentication.md)

</dd>

<dt>

ctx.bouncer

</dt>

<dd>

Reference to an instance of the [Bouncer class](https://github.com/adonisjs/bouncer/blob/main/src/bouncer.ts). Learn more about [Authorization](../security/authorization.md).

</dd>

<dt>

ctx.i18n

</dt>

<dd>

Reference to an instance of the [I18n class](https://github.com/adonisjs/i18n/blob/main/src/i18n.ts). Learn more about `i18n` in [Internationalization](../digging_deeper/i18n.md) guide.

</dd>

</dl>


## Extending HTTP context

You may add custom properties to the HTTP context class using macros or getters. Make sure to read the [extending AdonisJS guide](./extending_the_framework.md) first if you are new to the concept of macros.

```ts
import { HttpContext } from '@adonisjs/core/http'

HttpContext.macro('aMethod', function (this: HttpContext) {
  return value
})

HttpContext.getter('aProperty', function (this: HttpContext) {
  return value
})
```

Since the macros and getters are added at runtime, you must inform TypeScript about their types using module augmentation.

```ts
import { HttpContext } from '@adonisjs/core/http'

// insert-start
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    aMethod: () => ValueType
    aProperty: ValueType
  }
}
// insert-end

HttpContext.macro('aMethod', function (this: HttpContext) {
  return value
})

HttpContext.getter('aProperty', function (this: HttpContext) {
  return value
})
```

## Creating dummy context during tests

You may use the `testUtils` service to create a dummy HTTP context during tests. 

The context instance is not attached to any route; therefore, the `ctx.route` and `ctx.params` values will be undefined. However, you can manually assign these properties if required by the code under test.

```ts
import testUtils from '@adonisjs/core/services/test_utils'

const ctx = testUtils.createHttpContext()
```

By default, the `createHttpContext` method uses fake values for the `req` and the `res` objects. However, you can define custom values for these properties as shown in the following example.

```ts
import { createServer } from 'node:http'
import testUtils from '@adonisjs/core/services/test_utils'

createServer((req, res) => {
  const ctx = testUtils.createHttpContext({
    // highlight-start
    req,
    res
    // highlight-end
  })
})
```

### Using the HttpContext factory
The `testUtils` service is only available inside an AdonisJS application; therefore, if you are building a package and need access to a fake HTTP context, you may use the [HttpContextFactory](https://github.com/adonisjs/http-server/blob/main/factories/http_context.ts#L30) class.

```ts
import { HttpContextFactory } from '@adonisjs/core/factories/http'
const ctx = new HttpContextFactory().create()
```
