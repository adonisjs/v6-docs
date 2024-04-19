# Package development

Packages are the primary source of adding new functionality to AdonisJS applications. A package can be a generic library like `lodash` and `luxon` or a package created specifically to work with AdonisJS.

AdonisJS packages are no different from a standard Node.js package published on npm. However, it may use AdonisJS APIs and provide extra functionality that works only inside an AdonisJS application.

This guide will teach us how to create packages for AdonisJS, bind values to the container, export middleware, contribute commands, register templates, and so on.

:::note

We assume you know how to create and publish a package on npm and have basic knowledge of using TypeScript.

:::

## A note on loosely coupled source code

When creating a package, ensure your package's source code is not tightly coupled with the AdonisJS application runtime. For example:

- Inside an AdonisJS application, you can import the router using the `@adonisjs/core/services/router` service. Whereas your package should accept the same router via Dependency injection. **In fact, packages should never import [container services](./container_services.md)**.

- Similarly, inside an AdonisJS application, you can import config files from the `config` directory. Whereas your package should read the config using the [Config provider](../guides/config.md#reading-config-inside-service-providers).

- You should not use the `@inject` decorator inside your packages. There is an alternative API to inject dependencies inside a class automatically.

To conclude, the source code of a package should be application agnostic, and you must use service providers to act as a bridge between the package source code and the user application.

## Creating a new package
You may create a new package by running the following command. The [create-adonisjs](http://npmjs.com/create-adonisjs) initializer will download the [Package starter kit](https://github.com/adonisjs/pkg-starter-kit) that comes with everything you need to develop and test AdonisJS applications.

:::codegroup

```sh
// title: npm
npm init adonisjs@latest my-package -- -K "adonisjs/pkg-starter-kit"
```

:::

Once the project has been created, you may `cd` into the newly created directory and run the example test.

```sh
npm run test
```

You may create the distribution build using the `build` command.

```sh
npm run build
```

Refer to the [README file of the starter kit](https://github.com/adonisjs/pkg-starter-kit) to learn about the directory structure, installed dependencies, and scaffolding commands.

## Using service providers
Service providers acts as a bridge between your package and an AdonisJS application. You can use service providers to provide dependencies to your package source code, register bindings to the container, or extend the framework using the `boot` method lifecycle hook.

See also: [Service providers](./service_providers.md) and [Extending the framework](./extending_the_framework.md).

### Automatically injecting dependencies
Inside an AdonisJS application you can use the `@inject` decorator to inject dependencies to a class constructor. Whereas, when creating a package, we recommend not using the decorator and instead use the `container.bind` method to customize the construction of a class.

The `container.bind` API is more flexible than the `@inject` decorator. The `@inject` can only resolve and inject classes using reflection, whereas with the `bind` method, you can inject any value to the class constructor.

In the following example, we have a `LogRequests` middleware that needs the configuration stored inside the `config/log_requests.ts` file and an instance of the current application.

```ts
import type { ApplicationService } from '@adonisjs/core/types'

export default class LogRequests {
  // highlight-start
  constructor(
    config: { ignoreRoutes: string[], logResponseBody: boolean },
    app: ApplicationService
  ) {
  }
  // highlight-end
}
```

Inside the `register` method of a service provider, we will use the `container.bind` method to self construct the `LogRequests` middleware class and manually inject the constructor dependencies. **Think of it as a way to tell AdonisJS how to create an instance of a specific class**.

```ts
import type { ApplicationService } from '@adonisjs/core/types'
import LogRequests from '../middleware/log_requests.js'

export default class MyPackageProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    // highlight-start
    this.app.container.bind(LogRequests, () => {
      const config = this.app.config.get<any>('log_requests', {})
      return new LogRequests(config, this.app)
    })
    // highlight-end
  }
}
```

You can repeat this process for any class that is constructed using the container. Be it the middleware, controllers, event listeners and so on.

### Registering singleton services
If your package has certain classes that should have only one instance throughout the lifecycle of the application, you can bind them to the container and export them as [container services](./container_services.md).

A great example of the same is the HTTP router shipped with the framework core. Since, a typical AdonisJS application needs a single instance of the [Router class](https://github.com/adonisjs/http-server/blob/main/src/router/main.ts), we [register it as a singleton](https://github.com/adonisjs/core/blob/main/providers/http_provider.ts#L39-L44) inside the container.

Let's take example of dummy `Cache` class and register it as a singleton inside the container.

```ts
// title: src/cache.ts
export class DummyCache {
  constructor(config: any) {}
}
```

```ts
// title: providers/cache_provider.ts
import type { ApplicationService } from '@adonisjs/core/types'
import { DummyCache } from '../src/cache.js'

export default class CacheProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(DummyCache, () => {
      const config = this.app.config.get<any>('cache', {})
      return new DummyCache(config)
    })
  }
}
```

Finally, let's create a container service module that will make an instance of the `DummyCache` class and export it.

```ts
// title: services/cache.ts
import app from '@adonisjs/core/services/app'
import { DummyCache } from '../src/cache.js'

let cache: DummyCache

await app.booted(async () => {
  cache = await app.container.make(DummyCache)
})

export { cache as default }
```

The user of the package can now import a singleton instance of the `DummyCache` class from the `cache` service as follows.

```ts
import cache from 'my-package/services/cache'
```

## Exporting middleware
You must export [HTTP middleware](../http/middleware.md) classes using `export default`. This will allow the package consumers to drop the import path inside the middleware collection array.

In the following example, we export a `LogRequests` middleware from the `./middleware/log_requests.ts` file. Also, we define the public import path using [Node.js subpath exports](https://nodejs.org/api/packages.html#subpath-exports).

```ts
// title: middleware/log_requests.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class LogRequests {
  async handle(ctx: HttpContext, next: NextFn) {
    await next()
  }
}
```

```json
// title: package.json
{
  "exports": {
    "./log_requests_middleware": "./build/middleware/log_requests.js"
  }
}
```

The application developer can register the middleware as follows.

```ts
router.use([
  () => import('my-package/log_requests_middleware')
])
```

## Exporting controllers
You must export [HTTP controller](../http/controllers.md) classes using `export default`. This will allow the package consumers to drop the import path inside the route definition.

In the following example, we export an `InvoicesController` class from the `./controllers/invoices_controller.ts` file. Also, we define the public import path using Node.js subpath exports.

```ts
// title: controllers/invoices_controller.ts
export default class InvoicesController {
  index() {
    // return view all invoices
  }

  store() {
    // create a new invoice
  }
}
```

```json
// title: package.json
{
  "exports": {
    "./invoices_controller": "./build/controllers/invoices_controller.js"
  }
}
```

The application developer can use the controller as follows.

```ts
import router from '@adonisjs/core/services/router'

const InvoicesController = () => import('my-package/invoices_controller')

router.get('invoices', [InvoicesController, 'index'])
router.post('invoices', [InvoicesController, 'store'])
```

## Exporting commands
You may ship [Ace commands](../ace/introduction.md) as part of your package by creating them inside the `commands` directory. If you are using the [package starter kit](https://github.com/adonisjs/pkg-starter-kit), we will create a manifest file (containing commands meta-data) for your commands automatically during the build process. The manifest file is used to improve the initial load time of Ace.

## Defining routes

## Using stubs

## Configuring the package
