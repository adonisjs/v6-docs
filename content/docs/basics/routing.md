---
summary: Learn how to define routes, route params, and route handlers in AdonisJS.
---

# Routing

The users of your website or web application can visit different URLs like `/`, `/about`, or `/posts/1`. To make these URLs work, you have to define routes.

In AdonisJS, routes are defined inside the `start/routes.ts` file. A route is a combination of a **URI pattern** and a **handler** to handle requests for that specific route. For example:

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.get('/', () => {
  return 'Hello world from the home page.'
})

router.get('/about', () => {
  return 'This is the about page.'
})

router.get('/posts/:id', ({ params }) => {
  return `This is post with id ${params.id}`
})
```

The last route in the above example uses a dynamic URI pattern. The `:id` is a way to tell the router to accept any value for the id. We call them **route params**.

## View list of registered routes
You can run the `list:routes` command to view the list of routes registered by your application.

```sh
node ace list:routes
```

Also, you can see the routes list from the VSCode activity bar, if you are using our [official VSCode extension](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension).

![](./vscode_routes_list.png)

## Route params

Route params allow you to define URIs that can accept dynamic values. Each param captures the value of a URI segment, and you can access this value within the route handler.

A route param always starts with a colon `:`, followed by the param's name.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.get('/posts/:id', ({ params }) => {
  return params.id
})
```

| URL              | Id        |
|------------------|-----------|
| `/posts/1`       | `1`       |
| `/posts/100`     | `100`     |
| `/posts/foo-bar` | `foo-bar` |

A URI can also accept multiple params. Each param should have a unique name.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.get('/posts/:id/comments/:commentId', ({ params }) => {
  console.log(params.id)
  console.log(params.commentId)
})
```

| URL                          | Id        | Comment Id |
|------------------------------|-----------|------------|
| `/posts/1/comments/4`        | `1`       | `4`        |
| `/posts/foo-bar/comments/22` | `foo-bar` | `22`       |

### Optional params

The route params can also be optional by appending a question mark `?` at the end of the param name. The optional params should come after the required params.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.get('/posts/:id?', ({ params }) => {
  if (!params.id) {
    return 'Showing all posts'
  }

  return `Showing post with id ${params.id}`
})
```

### Wildcard params

To capture all the segments of a URI, you can define a wildcard param. The wildcard param is specified using a special `*` keyword and must be defined at the last position.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.get('/docs/:category/*', ({ params }) => {
  console.log(params.category)
  console.log(params['*'])
})
```

| URL                  | Category | Wildcard param   |
|----------------------|----------|------------------|
| `/docs/http/context` | `http`   | `['context']`    |
| `/docs/api/sql/orm`  | `api`    | `['sql', 'orm']` |

### Params matchers

The router does not know the format of the param data you want to accept. For example, a request with URI `/posts/foo-bar` and `/posts/1` will match the same route. However, you can explicitly validate the params values using param matchers.

A matcher is registered using the `route.where` method. The first argument is the param name, and the second argument is the matcher object.

In the following example, we define a regex to validate the id to be a valid number. The route will be skipped in case the validation fails.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router
  .get('/posts/:id', ({ params }) => {})
  .where('id', {
    match: /^[0-9]+$/,
  })
```

Alongside the `match` regex, you can also define a `cast` function to convert the param value to its correct data type. In this example, we can convert the id to a number.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router
  .get('/posts/:id', ({ params }) => {
    console.log(typeof params.id)
  })
  .where('id', {
    match: /^[0-9]+$/,
    cast: (value) => Number(value),
  })
```

### Inbuilt matchers

The router ships with the following helper methods for commonly used data types.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

// Validate id to be numeric + cast to number data type
router.where('id', router.matchers.number())

// Validate id to be a valid UUID
router.where('id', router.matchers.uuid())

// Validate slug to match a given slug regex: regexr.com/64su0
router.where('slug', router.matchers.slug())
```

### Global matchers

The route matchers can be defined globally on the router instance. Unless explicitly overridden at the route level, a global matcher is applied on all the routes.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

// Global matcher
router.where('id', router.matchers.uuid())

router
  .get('/posts/:id', () => {})
  // Overridden at route level
  .where('id', router.matchers.number())
```

## HTTP methods

The `router.get` method creates a route that responds to [GET HTTP method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET). Similarly, you can use the following methods to register routes for different HTTP methods.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

// GET method
router.get('users', () => {})

// POST method
router.post('users', () => {})

// PUT method
router.put('users/:id', () => {})

// PATCH method
router.patch('users/:id', () => {})

// DELETE method
router.delete('users/:id', () => {})
```

You can use the `route.any` method to create a route that responds to all standard HTTP methods.

```ts
// title: start/routes.ts
router.any('reports', () => {})
```

Finally, you can create a route for custom HTTP methods using the `route.route` method.

```ts
// title: start/routes.ts
router.route('/', ['TRACE'], () => {})
```

## Router handler

The route handler handles the request by returning a response or raising an exception to abort the request.

A handler can be an inline callback (as seen in this guide) or a reference to a controller method.

```ts
// title: start/routes.ts
router.post('users', () => {
  // Do something
})
```

:::note

Route handlers can be async functions, and AdonisJS will handle the promise resolution automatically.

:::

In the following example, we import the `UsersController` class and bind it to the route. During an HTTP request, AdonisJS will create an instance of the controller class using the IoC container and execute the `store` method.

See also: Dedicated guide on [controllers](./controllers.md).


```ts
// title: start/routes.ts
const UsersController = () => import('#controllers/users_controller')

router.post('users', [UsersController, 'store'])
```

## Route middleware

You can define a middleware on a route by calling the `route.use` method. The method accepts an inline callback or a reference to a named middleware.

Following is a minimal example of defining a route middleware. We recommend reading the [dedicated guide on middleware](./middleware.md) to explore all the available options and the execution flow of middleware.

```ts
// title: start/routes.ts
router
  .get('posts', () => {
    console.log('Inside route handler')

    return 'Viewing all posts'
  })
  .use((_, next) => {
    console.log('Inside middleware')
    return next()
  })
```

## Route identifier

Every route has a unique identifier you can use to reference the route elsewhere in your application. For example, you can generate a URL to a route using the [URL builder](#url-builder) or redirect to a route using the [response.redirect](./response.md#redirects) method.

By default, the route pattern is the route identifier. However, you can assign a unique, memorable name to the route using the `route.as` method.

```ts
// title: start/routes.ts
router.get('users', () => {}).as('users.index')

router.post('users', () => {}).as('users.store')

router.delete('users/:id', () => {}).as('users.delete')
```

You can now construct URLs using the route name within your templates or using the URL builder.

```ts
const url = router.builder().make('users.delete', [user.id])
```

```edge
<form
  method='POST'
  action="{{
    route('users.delete', [user.id], { formAction: 'delete' })
  }}"
></form>
```

## Grouping routes

Route groups offer a convenience layer to bulk configure nested inside a group. You may create a group of routes using the `router.group` method.

```ts
// title: start/routes.ts
router.group(() => {
  /**
   * All routes registered inside the callback
   * are part of the surrounding group
   */
  router.get('users', () => {})
  router.post('users', () => {})
})
```

Route groups can be nested inside each other, and AdonisJS will merge or override properties based on the behavior of the applied setting.

```ts
// title: start/routes.ts
router.group(() => {
  router.get('posts', () => {})

  router.group(() => {
    router.get('users', () => {})
  })
})
```

### Prefixing routes inside a group

The URI pattern of routes inside a group can be prefixed using the `group.prefix` method. The following example will create routes for the `/api/users` and `/api/payments` URI patterns.

```ts
// title: start/routes.ts
router
  .group(() => {
    router.get('users', () => {})
    router.get('payments', () => {})
  })
  .prefix('/api')
```

In the case of nested groups, the prefix will be applied from the outer to the inner group. The following example will create routes for `/api/v1/users` and `/api/v1/payments` URI patterns.

```ts
// title: start/routes.ts
router
  .group(() => {
    router
      .group(() => {
        router.get('users', () => {})
        router.get('payments', () => {})
      })
      .prefix('v1')
  })
  .prefix('api')
```

### Naming routes inside a group

Similar to prefixing the route pattern, you can also prefix the route names inside a group using the `group.as` method.

:::note

The routes inside a group must have names before you can prefix them.

:::

```ts
// title: start/routes.ts
router
  .group(() => {
    route
      .get('users', () => {})
      .as('users.index') // final name - api.users.index
  })
  .prefix('api')
  .as('api')
```

In the case of nested groups, the names will be prefixed from the outer to the inner group.

```ts
// title: start/routes.ts
router
  .group(() => {
    route
      .get('users', () => {})
      .as('users.index') // api.users.index

    router
      .group(() => {
        route
          .get('payments', () => {})
          .as('payments.index') // api.commerce.payments.index
      })
      .as('commerce')
  })
  .prefix('api')
  .as('api')
```

### Applying middleware to routes inside a group

You can assign middleware to routes inside a group using the `group.use` method. The group middleware are executed before the middleware applied on individual routes within the group.

In the case of nested groups, the middleware from the outermost group will run first. In other words, a group prepends middleware to the route middleware stack.

See also: [Middleware guide](./middleware.md)

```ts
// title: start/routes.ts
router
  .group(() => {
    router
      .get('posts', () => {})
      .use((_, next) => {
        console.log('logging from route middleware')
        return next()
      })
  })
  .use((_, next) => {
    console.log('logging from group middleware')
    return next()
  })
```

## Registering routes for a specific domain

AdonisJS allows you to register routes under a specific domain name. This is helpful when you have an application mapped to multiple domains and want different routes for each domain.

In the following example, we define two sets of routes.

- Routes that are resolved for any domain/hostname. 
- Routes that are matched when the domain/hostname matches the pre-defined domain name value.

```ts
// title: start/routes.ts
router.group(() => {
  router.get('/users', () => {})
  router.get('/payments', () => {})
})

router.group(() => {
  router.get('/articles', () => {})
  router.get('/articles/:id', () => {})
}).domain('blog.adonisjs.com')
```

Once you deploy your application, the routes under the group with an explicit domain will only be matched if the request's hostname is `blog.adonisjs.com`.

### Dynamic subdomains

You can specify dynamic subdomains using the `group.domain` method. Similar to the route params, the dynamic segment of a domain starts with a colon `:`.

In the following example, the `tenant` segment accepts any subdomain, and you can access its value using the `HttpContext.subdomains` object.

```ts
// title: start/routes.ts
router
 .group(() => {
   router.get('users', ({ subdomains }) => {
     return `Listing users for ${subdomains.tenant}`
   })
 })
 .domain(':tenant.adonisjs.com')
```

## Render view from a route

You may use the `router.on.render` method if you have a route handler that only renders a view. It is a convenient shortcut to render a view without defining an explicit handler.

The render method accepts the name of the edge template to render. Optionally, you can pass the template data as the second argument.

:::warning

The `route.on.render` method only exists when you have configured the [Edge service provider](../views-and-templates/introduction.md#using-edge)

:::

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.on('/').render('home')
router.on('about').render('about', { title: 'About us' })
router.on('contact').render('contact', { title: 'Contact us' })
```

## Redirect from a route

If you are defining a route handler to redirect the request to another path or route, you may use the `router.on.redirect` or `router.on.redirectToPath` methods.

The `redirect` method accepts the route identifier. Whereas the `redirectToPath` method accepts a static path/URL.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

// Redirect to a route
router.on('/posts').redirect('/articles')

// Redirect to a URL
router.on('/posts').redirectToPath('https://medium.com/my-blog')
```

### Forwarding params

In the following example, the value of `id` from the original request will be used to construct the `/articles/:id` route. So,  if a request comes for `/posts/20`, it will be redirected to `/articles/20`.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.on('/posts/:id').redirect('/articles/:id')
```

### Explicitly specifying params

You can also specify the route params explicitly as the second argument. In this case, the params from the current request will be ignored.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

// Always redirect to /articles/1
router.on('/posts/:id').redirect('/articles/:id', {
  id: 1
})
```

### With query string

The query string for the redirect URL can be defined within the options object.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.on('/posts').redirect('/articles', {
  qs: {
    limit: 20,
    page: 1,
  }  
})
```

## Current request route

The route of the current request can be accessed using the [`HttpContext.route`](../concepts/http_context.md#http-context-properties) property. It includes the **route pattern**, **name**, **reference to its middleware store**, and **reference to the route handler**.

```ts
// title: start/routes.ts
router.get('payments', ({ route }) => {
  console.log(route)
})
```

You can also check if the current request is for a specific route or not using the `request.matchesRoute` method. The method accepts either the route URI pattern or the route name.

```ts
// title: start/routes.ts
router.get('/posts/:id', ({ request }) => {
  if (request.matchesRoute('/posts/:id')) {
  }
})
```

```ts
// title: start/routes.ts
router
  .get('/posts/:id', ({ request }) => {
    if (request.matchesRoute('posts.show')) {
    }
  })
  .as('posts.show')
```

You can also match against multiple routes. The method will return true as soon as it finds the first match.

```ts
if (request.matchesRoute(['/posts/:id', '/posts/:id/comments'])) {
  // do something
}
```

## How AdonisJS matches routes

The routes are matched in the same order as they are registered inside the routes file. We begin the match from the topmost route and stop at the first matching route.

If you have two similar routes, you must first register the most specific route.

In the following example, the request for the URL `/posts/archived` will be handled by the first route (i.e., `/posts/:id` ) because the dynamic param `id` will capture the `archived` value.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router.get('posts/:id', () => {})
router.get('posts/archived', () => {})
```

This behavior can be fixed by re-ordering the routes by placing the most specific route before the route with a dynamic param.

```ts
// title: start/routes.ts
router.get('posts/archived', () => {})
router.get('posts/:id', () => {})
```


### Handling 404 requests 

AdonisJS raises a 404 exception when no matching route is found for the current request's URL.

To display a 404 page to the user, you can catch the `E_ROUTE_NOT_FOUND` exception inside the [global exception handler](./exception_handling.md) and render a template.

```ts
// app/exceptions/handler.ts
import { errors } from '@adonisjs/core'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof errors.E_ROUTE_NOT_FOUND) {
      return ctx.view.render('errors/404')
    }
    
    return super.handle(error, ctx)
  }
}
```

## URL builder

You may use the URL builder to create URLs for pre-defined routes in your application. For example, create a form action URL inside Edge templates, or make the URL to redirect the request to another route.

The `router.builder` method creates an instance of the [URL builder](https://github.com/adonisjs/http-server/blob/main/src/router/lookup_store/url_builder.ts) class, and you can use the builder's fluent API to lookup a route and create a URL for it.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'
const PostsController = () => import('#controllers/posts_controller')

router
  .get('posts/:id', [PostsController, 'show'])
  .as('posts.show')
```

You may generate the URL for the `posts.show` route as follows.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

router
  .builder()
  .params([1])
  .make('posts.show') // /posts/1

router
 .builder()
 .params([20])
 .make('posts.show') // /posts/20
```

The params can be specified as an array of positional arguments. Or you can define them as a key-value pair.

```ts
// title: start/routes.ts
router
 .builder()
 .params({ id: 1 })
 .make('posts.show') // /posts/1
```

### Defining query parameters

The query parameters can be defined using the `builder.qs` method. The method accepts an object of key-value pair and serializes it to a query string.

```ts
// title: start/routes.ts
router
  .builder()
  .qs({ page: 1, sort: 'asc' })
  .make('posts.index') // /posts?page=1&sort=asc
```

The query string is serialized using the [qs](https://www.npmjs.com/package/qs) npm package. You can [configure its settings](https://github.com/adonisjs/http-server/blob/main/src/define_config.ts#L49-L54) inside the `config/app.ts` file under the `http` object.

```ts
// title: config/app.js
http: defineConfig({
  qs: {
    stringify: {
      // 
    }
  }
})
```

### Prefixing URL

You may prefix a base URL to the output using the `builder.prefixUrl` method.

```ts
// title: start/routes.ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 1 })
  .make('posts.show')
```

### Generating signed URLs

Signed URLs are URLs with a signature query string appended to them. The signature is used to verify if the URL has been tampered after it was generated.

For example, you have a URL to unsubscribe users from your newsletter. The URL contains the `userId` and might look as follows.

```
/unsubscribe/231
```

To prevent someone from changing the user id from `231` to something else, you can sign this URL and verify the signature when handling requests for this route.

```ts
// title: start/routes.ts
router.get('unsubscribe/:id', ({ request, response }) => {
  if (!request.hasValidSignature()) {
    return response.badRequest('Invalid or expired URL')
  }
  
  // Remove subscription
}).as('unsubscribe')
```

You may use the `makeSigned` method to create a signed URL.

```ts
// title: start/routes.ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 231 })
  // highlight-start
  .makeSigned('unsubscribe')
  // highlight-end
```

#### Signed URL expiration

You may generate signed URLs that expire after a given duration using the `expiresIn` option. The value can be a number in milliseconds or a time expression string.

```ts
// title: start/routes.ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 231 })
  // highlight-start
  .makeSigned('unsubscribe', {
    expiresIn: '3 days'
  })
  // highlight-end
```

### Disabling route lookup

The URL builder performs a route lookup with the route identifier given to the `make` and the `makeSigned` methods.

If you want to create a URL for routes defined outside of your AdonisJS application, you may disable the route lookup and give the route pattern to the `make` and the `makeSigned` methods.

```ts
// title: start/routes.ts
router
  .builder()
  .prefixUrl('https://your-app.com')
  .disableRouteLookup()
  .params({ token: 'foobar' })
  .make('/email/verify/:token') // /email/verify/foobar
```

### Making URL for routes under a domain
You can make URLs for routes registered under a specific domain using the `router.builderForDomain` method. The method accepts the route pattern you used at the time of defining the routes.

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'
const PostsController = () => import('#controllers/posts_controller')

router.group(() => {
  router
    .get('/posts/:id', [PostsController, 'show'])
    .as('posts.show')
}).domain('blog.adonisjs.com')
```

You can create URL for the `posts.show` route under `blog.adonisjs.com` domain as follows.

```ts
// title: start/routes.ts
router
  .builderForDomain('blog.adonisjs.com')
  .params({ id: 1 })
  .make('posts.show')
```

### Generating URLs inside templates

You may use the `route` and the `signedRoute` methods inside templates to generate a URL using the URL builder.

See also: [Edge helpers reference](../references/edge.md#routesignedroute)

```edge
<a href="{{ route('posts.show', [post.id]) }}">
  View post
</a>
```

```edge
<a href="{{
  signedRoute('unsubscribe', [user.id], {
    expiresIn: '3 days',
    prefixUrl: 'https://blog.adonisjs.com'    
  })
}}">
  Unsubscribe
</a>
```

## Extending router

You can add custom properties to different router classes using macros and getters. Make sure to read the [extending AdonisJS guide](../concepts/extending_the_framework.md) first if you are new to the concept of macros.

Following is the list of classes you can extend.

### Router

The [Router class](https://github.com/adonisjs/http-server/blob/main/src/router/main.ts) contains the top-level methods for creating a route, a route group, or a route resource. An instance of this class is made available via the router service.

```ts
import { Router } from '@adonisjs/core/http'

Router.macro('property', function (this: Router) {
  return value
})
Router.getter('propertyName', function (this: Router) {
  return value
})
```

```ts
// title: types/http.ts
declare module '@adonisjs/core/http' {
  export interface Router {
    property: valueType
  }
}
```

### Route

The [Route class](https://github.com/adonisjs/http-server/blob/main/src/router/route.ts) represents a single route. An instance of the Route class is created once you call the `router.get`, `router.post`, and other similar methods.

```ts
import { Route } from '@adonisjs/core/http'

Route.macro('property', function (this: Route) {
  return value
})
Router.getter('property', function (this: Route) {
  return value
})
```

```ts
// title: types/http.ts
declare module '@adonisjs/core/http' {
  export interface Route {
    property: valueType
  }
}
```

### RouteGroup

The [RouteGroup class](https://github.com/adonisjs/http-server/blob/main/src/router/group.ts) represents a group of routes. An instance of RouteGroup class is created once you call the `router.group` method.

You can access the group's routes using the `this.routes` property inside your macro or getter implementation.

```ts
import { RouteGroup } from '@adonisjs/core/http'

RouteGroup.macro('property', function (this: RouteGroup) {
  return value
})
RouteGroup.getter('property', function (this: RouteGroup) {
  return value
})
```

```ts
// title: types/http.ts
declare module '@adonisjs/core/http' {
  export interface RouteGroup {
    property: valueType
  }
}
```

### RouteResource

The [RouteResource class](https://github.com/adonisjs/http-server/blob/main/src/router/resource.ts) represents a group of routes for a resource. An instance of RouteResource class is created once you call the `router.resource` method.

You can access the routes of the resource using the `this.routes` property inside your macro or getter implementation.

```ts
import { RouteResource } from '@adonisjs/core/http'

RouteResource.macro('property', function (this: RouteResource) {
  return value
})
RouteResource.getter('property', function (this: RouteResource) {
  return value
})
```

```ts
// title: types/http.ts
declare module '@adonisjs/core/http' {
  export interface RouteResource {
    property: valueType
  }
}
```

### BriskRoute

The [BriskRoute class](https://github.com/adonisjs/http-server/blob/main/src/router/brisk.ts) represents a route without an explicit handler. An instance of BriskRoute class is created once you call the `router.on` method.

You can call the `this.setHandler` method inside your macro or getter to assign a route handler.

```ts
import { BriskRoute } from '@adonisjs/core/http'

BriskRoute.macro('property', function (this: BriskRoute) {
  return value
})
BriskRouter.getter('property', function (this: BriskRoute) {
  return value
})
```

```ts
// title: types/http.ts
declare module '@adonisjs/core/http' {
  export interface BriskRoute {
    property: valueType
  }
}
```
