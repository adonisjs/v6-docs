# Extending the framework

The architecture of AdonisJS makes it very easy to extend the framework. We dogfood framework's core APIs to build an ecosystem of first-party packages.

In this guide, we will explore different APIs you can use to extend the framework through a package or within your application codebase.

## Macros and getters

Macros and getters offer an API to add properties to the prototype of a class. You can think of them as Syntactic sugar for `Object.defineProperty`. Under the hood, we use [macroable](https://github.com/poppinss/macroable) package, and you can refer to its README for an in-depth technical explanation.

Since macros and getters are added at runtime, you will have to inform TypeScript about the type information for the added property using [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).

You can write the code for adding macros inside a dedicated file (like the `extensions.ts`) and import it inside the service provider's `boot` method.

```ts
export default class AppProvider {
  async boot() {
    await import('../src/extensions.js')
  }
}
```

In the following example, we add the `wantsJSON` method to the [Request](../http/request.md) class and define its types simultaneously.

```ts
// title: extensions.ts
import { Request } from '@adonisjs/core/http'

Request.macro('wantsJSON', function (this: Request) {
  const firstType = this.types()[0]
  if (!firstType) {
    return false
  }
  
  return firstType.includes('/json') || firstType.includes('+json')
})
```

```ts
// title: extensions.ts
declare module '@adonisjs/core/http' {
  interface Request {
    wantsJSON(): boolean
  }
}
```

- The module path during the `declare module` call must be the same as the path you use to import the class.
- The `interface` name must be the same as the class name to which you add the macro or the getter.

### Getters

Getters are lazily evaluated properties added to a class. You can add a getter using the `Class.getter` method. The first argument is the getter name, and the second argument is the callback function to compute the property value.

Getter callbacks cannot be async because [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) in JavaScript cannot be asynchronous.

```ts
import { Request } from '@adonisjs/core/http'

Request.getter('hasRequestId', function (this: Request) {
  return this.header('x-request-id')
})

// you can use the property as follows.
if (ctx.request.hasRequestId) {
}
```

Getters can be a singleton, meaning the function to compute the getter value will be called once, and the return value will be cached for an instance of the class.

```ts
const isSingleton = true

Request.getter('hasRequestId', function (this: Request) {
  return this.header('x-request-id')
}, isSingleton)
```

### Macroable classes

Following is the list of classes that can be extended using Macros and getters.

| Class | Import path |
|------|------------|
| [Request](https://github.com/adonisjs/http-server/blob/next/src/request.ts) | `@adonisjs/core/http` |
| [Response](https://github.com/adonisjs/http-server/blob/next/src/response.ts) | `@adonisjs/core/http` |
| [HttpContext](https://github.com/adonisjs/http-server/blob/next/src/http_context/main.ts) | `@adonisjs/core/http` |
| [Route](https://github.com/adonisjs/http-server/blob/next/src/router/route.ts) | `@adonisjs/core/http` |
| [RouteGroup](https://github.com/adonisjs/http-server/blob/next/src/router/group.ts) | `@adonisjs/core/http` |
| [RouteResource](https://github.com/adonisjs/http-server/blob/next/src/router/resource.ts) | `@adonisjs/core/http` |
| [BriskRoute](https://github.com/adonisjs/http-server/blob/next/src/router/brisk.ts) | `@adonisjs/core/http` |
| [MultipartFile](https://github.com/adonisjs/bodyparser/blob/next/src/multipart/file.ts) | `@adonisjs/core/bodyparser` |

## Extending modules
Most of the AdonisJS modules provide extensible APIs to register custom implementations. Following is an aggregated list of the same.

- [Creating Hash driver](../security/hash.md#creating-a-custom-hash-driver)
- [Creating Session driver](../http/session.md#creating-a-custom-session-driver)
- [Creating Social auth driver](../digging_deeper/social_auth.md#creating-a-custom-social-driver)
- [Extending REPL](../ace/repl.md#adding-custom-methods-to-repl)
- [Creating i18n translations loader](../digging_deeper/i18n.md#creating-a-custom-translation-loader)
- [Creating i18n translations formatter](../digging_deeper/i18n.md#creating-a-custom-translation-formatter)
