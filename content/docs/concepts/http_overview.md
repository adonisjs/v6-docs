# HTTP overview

AdonisJS is primarily a web framework to create applications that respond to HTTP requests. In this guide, we will learn how AdonisJS boots the HTTP server, handles the incoming requests, and the modules available at the HTTP layer.

## The HTTP layer
The HTTP layer inside an AdonisJS application consists of the following modules. It is worth mentioning that the AdonisJS HTTP layer is built from scratch and does not use any microframework under the hood.


<dl>

<dt>

[Router](../basics/routing.md)

</dt>

<dd>

The [router module](https://github.com/adonisjs/http-server/blob/main/src/router/main.ts) is responsible for defining the endpoints of your application, which are known as routes. A route should define a handler responsible for handling the request. The handler can be a closure or reference to a controller.

</dd>

<dt>

[Controllers](../basics/controllers.md)

</dt>

<dd>

Controllers are JavaScript classes that you bind to a route to handle the HTTP requests. Controllers act as an organization layer and help you divide the business logic of your application inside different files/classes.

</dd>

<dt>

[HttpContext](http_context.md)

</dt>


<dd>

AdonisJS creates an instance of the [HttpContext](https://github.com/adonisjs/http-server/blob/main/src/http_context/main.ts) class for every incoming HTTP request. The HttpContext (aka `ctx`) carries the information like the request body, headers, authenticated user, etc, for a given request.

</dd>

<dt>

[Middleware](../basics/middleware.md)

</dt>

<dd>

The middleware pipeline in AdonisJS is an implementation of [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) design pattern. You can use middleware to intercept HTTP requests and respond to them before they reach the route handler.

</dd>

<dt>

[Global Exception handler](../basics/exception_handling.md)

</dt>

<dd>

The global exception handler handles exceptions raised during an HTTP request at a central location. You can use the global exception handler to convert exceptions to an HTTP response or report them to an external logging service.

</dd>

<dt>

Server

</dt>

<dd>

The [server module](https://github.com/adonisjs/http-server/blob/main/src/server/main.ts) wires up the router, middleware, the global exception handler and exports [a `handle` function](https://github.com/adonisjs/http-server/blob/main/src/server/main.ts#L330) you can bind to the Node.js HTTP server to handle requests.

</dd>

</dl>

## How AdonisJS boots the HTTP server
The HTTP server is booted once you call [the `boot` method](https://github.com/adonisjs/http-server/blob/main/src/server/main.ts#L252) on the Server class. Under the hood, this method performs the following actions.

- Create the middleware pipeline
- Compile routes
- Import and instantiate the global exception handler

In a typical AdonisJS application, the `boot` method is called by the [Ignitor](https://github.com/adonisjs/core/blob/main/src/ignitor/http.ts) module within the `bin/server.ts` file.

Also, it is essential to define the routes, middleware, and the global exception handler before the `boot` method is called, and AdonisJS achieves that using the `start/routes.ts` and `start/kernel.ts` [preload files](rc_file#preloads).

![](server_boot_lifecycle.png)

## HTTP request lifecycle
Now that we have an HTTP server listening for incoming requests. Let's see how AdonisJS handles a given HTTP request.

:::note

**See also:**\
[Middleware execution flow](../basics/middleware.md#middleware-execution-flow)\
[Middleware and exception handling](../basics/middleware.md#middleware-and-exception-handling)

:::


<dl>

<dt> Creating the HttpContext </dt>


<dd>

As the first step, the server module creates an instance of the [HttpContext](http_context.md) class and passes it as a reference to the middleware, route handlers, and the global exception handler.

If you have enabled the [AsyncLocalStorage](async_local_storage.md#usage), then the same instance is 
shared as the local storage state.

</dd>

<dt> Executing server middleware stack </dt>

<dd>

Next, the middleware from the [server middleware stack](../basics/middleware.md#server-middleware-stack) are executed. These middleware can intercept and respond to the request before it reaches the route handler.

Also, every HTTP request goes through the server middleware stack, even if you have not defined any router for the given endpoint. This allows server middleware to add functionality to an app without relying on the routing system.

</dd>

<dt> Finding the matching route </dt>

<dd>

If a server middleware does not end the request, we look for a matching route for the `req.url` property. The request is aborted with a `404 - Not found` exception when no matching route exists. Otherwise, we continue with the request.

</dd>

<dt> Executing the route middleware </dt>

<dd>

Once there is a matching route, we execute the [router global middleware](../basics/middleware.md#router-middleware-stack) and the [named middleware stack](../basics/middleware.md#named-middleware-collection). Again, middleware can intercept the request before it reaches the route handler.

</dd>

<dt> Executing the route handler </dt>

<dd>

As the final step, the request reaches the route handler and returns to the client with a response.

Suppose an exception is raised during any step in the process. In that case, the request will be handed over to the global exception handler, who is responsible for converting the exception to a response.

</dd>

<dt> Serializing response </dt>

<dd>

Once you define the response body using the `response.send` method or by returning a value from the route handler, we begin the response serialization process and set the appropriate headers.

Learn more about [response body serialization](../basics/response.md#response-body-serialization)

</dd>

</dl>
