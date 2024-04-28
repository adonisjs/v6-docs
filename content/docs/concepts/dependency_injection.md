<<<<<<< HEAD
# Dependency injection
=======
# Dependency Injection
>>>>>>> a7aa500 (docs: first draft of new structure)

At the heart of every AdonisJS application is an IoC container that can construct classes and resolve dependencies with almost zero config.

The IoC container serves the following two primary use cases.

- Exposing API for first and third-party packages to register and resolve bindings from the container (More on [bindings later](#container-bindings)).
- Automatically resolve and inject dependencies to a class constructor or class methods.

Let's start with injecting dependencies into a class.

## Basic example

The automatic dependency injection relies on the [TypeScript legacy decorators implementation](https://www.typescriptlang.org/docs/handbook/decorators.html) and the [Reflection metadata](https://www.npmjs.com/package/reflect-metadata) API.

In the following example, we create an `EchoService` class and inject an instance of it into the `HomeController` class. You can follow along by copy-pasting the code examples.

### Step 1. Create the Service class
Start by creating the `EchoService` class inside the `app/services` folder.

```ts
// title: app/services/echo_service.ts
export default class EchoService {
  respond() {
    return 'hello'
  }
}
```

### Step 2. Inject the service inside the controller

Create a new HTTP controller inside the `app/controllers` folder. Alternatively, you can use the `node ace make:controller home` command.

Import the `EchoService` in the controller file and accept it as a constructor dependency.

```ts
// title: app/controllers/home_controller.ts
import EchoService from '#services/echo_service'

export default class HomeController {
  constructor(protected echo: EchoService) {
  }
  
  handle() {
    return this.echo.respond()
  }
}
```

### Step 3. Using the inject decorator

To make automatic dependency resolution work, we will have to use the `@inject` decorator on the `HomeController` class. 

```ts
import EchoService from '#services/echo_service'
// insert-start
import { inject } from '@adonisjs/core'
// insert-end

// insert-start
@inject()
// insert-end
export default class HomeController {
  constructor(protected echo: EchoService) {
  }
  
  handle() {
    return this.echo.respond()
  }
}
```

That's all! You can now bind the `HomeController` class to a route and it will automatically receive an instance of the `EchoService` class.

### Conclusion

You can think of the `@inject` decorator as a spy looking at the class constructor or method dependencies and informing the container about it. 

When the AdonisJS router asks the container to construct the `HomeController`, the container already knows about the controller dependencies.

## Constructing a tree of dependencies

Right now, the `EchoService` class has no dependencies, and using the container to create an instance of it might seem overkill.

Let's update the class constructor and make it accept an instance of the `HttpContext` class.

```ts
// title: app/services/echo_service.ts
// insert-start
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
// insert-end

// insert-start
@inject()
// insert-end
export default class EchoService {
  // insert-start
  constructor(protected ctx: HttpContext) {
  }
  // insert-end

  respond() {
    return `Hello from ${this.ctx.request.url()}`
  }
}
```

Again, we must place our spy (the `@inject` decorator) on the `EchoService` class to inspect its dependencies.

Voila, that's all we have to do. Without changing a single line of code inside the controller, you can re-run the code, and the `EchoService` class will receive an instance of the `HttpContext` class.


:::note

The great thing about using the container is that you can have deeply nested dependencies, and the container can resolve the entire tree for you. The only deal is to use the `@inject` decorator.


:::

## Using method injection

Method injection is used to inject dependencies inside a class method. For method injection to work, you must place the `@inject` decorator before the method signature.

Let's continue with our previous example and move the `EchoService` dependency from the `HomeController` constructor to the `handle` method.

:::note

When using method injection inside a controller, remember the first parameter receives a fixed value (i.e., the HTTP context), and the rest of the parameters are resolved using the container.

:::

```ts
// title: app/controllers/home_controller.ts
import EchoService from '#services/echo_service'
import { inject } from '@adonisjs/core'

// delete-start
@inject()
// delete-end
export default class HomeController {
  // delete-start
  constructor(private echo: EchoService) {
  }
  // delete-end
  
  // insert-start
  @inject()
  handle(ctx, echo: EchoService) {
    return echo.respond()
  }
  // insert-end
}
```

That's all! This time, the `EchoService` class instance will be injected inside the `handle` method.

## When to use Dependency Injection

Leveraging dependency injection in your projects is recommended because DI creates a loose coupling between different parts of your application. As a result, the codebase becomes easier to test and refactor.

However, you have to be careful and not take the idea of dependency injection to its extreme that you start to lose its benefits. For example:

- You should not inject helper libraries like `lodash` as a dependency of your class. Import and use it directly.
- Your codebase might not need loose coupling for components that are ever likely to get swapped or replaced. For example, you may prefer importing the `logger` service vs. injecting the `Logger` class as a dependency.

## Using the container directly 

Most classes within your AdonisJS application, like the **Controllers**, **Middleware**, **Event listeners**, **Validators**, and **Mailers**, are constructed using the container. Therefore you can leverage the `@inject` decorator for automatic dependency injection.

For situations where you want to self-construct a class instance using the container, you can use the `container.make` method. 

The `container.make` method accepts a class constructor and returns an instance of it after resolving all its dependencies.

```ts
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'

class EchoService {}

@inject()
class SomeService {
  constructor(public echo: EchoService) {}
}

/**
 * Same as making a new instance of the class, but
 * will have the benefit of automatic DI
 */
const service = await app.container.make(SomeService)

console.log(service instanceof SomeService)
console.log(service.echo instanceof EchoService)
```

You can use the `container.call` method to inject dependencies inside a method. The `container.call` method accepts the following arguments.

1. An instance of the class.
2. The name of the method to run on the class instance. The container will resolve the dependencies and pass them to the method.
3. An optional array of fixed parameters to pass to the method.

```ts
class EchoService {}

class SomeService {
  @inject()
  run(echo: EchoService) {
  }
}

const service = await app.container.make(SomeService)

/**
 * An instance of Echo class will get passed
 * the run method
 */
await app.container.call(service, 'run')
```

## Container bindings

Container bindings are one of the primary reasons for the IoC container to exist in AdonisJS. Bindings act as a bridge between the packages you install and your application.

Bindings are essentially a key-value pair, the key is the unique identifier for the binding, and the value is a factory function that returns the value. 

- The binding name can be a `string`, a `symbol`, or a class constructor.
- The factory function can be asynchronous and must return a value.

You may use the `container.bind` method to register a container binding. Following is a straightforward example of registering and resolving bindings from the container.

```ts
import app from '@adonisjs/core/services/app'

class MyFakeCache {
  get(key: string) {
    return `${key}!`
  }
}

app.container.bind('cache', function () {
  return new MyCache()
})

const cache = await app.container.make('cache')
console.log(cache.get('foo')) // returns foo!
```

### When to use container bindings?

Container bindings are used for specific use cases, like registering singleton services exported by a package or self-constructing class instances when automatic dependency injection is insufficient.

We recommend you not make your applications unnecessarily complex by registering everything to the container. Instead, look for specific use cases in your application code before reaching for container bindings.

Following are some of the examples which are using container bindings inside the framework packages.

- [Registering BodyParserMiddleware inside container](https://github.com/adonisjs/core/blob/main/providers/app_provider.ts#L134-L139): Since the middleware class requires configuration stored inside the `config/bodyparser.ts` file, there is no way for automatic dependency injection to work. In this case, we manually construct the middleware class instance by registering it as a binding.
- [Registering Encryption service as a singleton](https://github.com/adonisjs/core/blob/main/providers/app_provider.ts#L97-L100): The Encryption class requires the `appKey` stored inside the `config/app.ts` file, therefore, we use container binding as a bridge to read the `appKey` from the user application and configure a singleton instance of the Encryption class.


:::important

The concept of container bindings is not commonly used in the JavaScript ecosystem. Therefore, feel free to [join our Discord community](https://discord.gg/vDcEjq6) to clarify your doubts.


:::


### Resolving bindings inside the factory function

You can resolve other bindings from the container within the binding factory function. For example, if the `MyFakeCache` class needs config from the `config/cache.ts` file, you can access it as follows.

```ts
this.app.container.bind('cache', async (resolver) => {
  const configService = await resolver.make('config')
  const cacheConfig = configService.get<any>('cache')

  return new MyFakeCache(cacheConfig)
})
```

### Singletons

Singletons are bindings for which the factory function is called once, and the return value is cached for the application's lifetime.

You can register a singleton binding using the `container.singleton` method.

```ts
this.app.container.singleton('cache', async (resolver) => {
  const configService = await resolver.make('config')
  const cacheConfig = configService.get<any>('cache')

  return new MyFakeCache(cacheConfig)
})
```

### Binding values

You can bind values directly to the container using the `container.bindValue` method.

```ts
this.app.container.bindValue('cache', new MyFakeCache())
```

### Aliases

You can define aliases for bindings using the `alias` method. The method accepts the alias name as the first parameter and a reference to an existing binding or a class constructor as the alias value.

```ts
this.app.container.singleton(MyFakeCache, async () => {
  return new MyFakeCache()
})

this.app.container.alias('cache', MyFakeCache)
```

### Defining static types for bindings

You can define the static-type information for binding using [TypeScript declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html). 

The types are defined on the `ContainerBindings` interface as a key-value pair.

```ts
declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    cache: MyFakeCache
  }
}
```

If you create a package, you can write the above code block inside the service provider file.

In your AdonisJS application, you can write the above code block inside the `types/container.ts` file.


## Swapping implementations during testing

When you rely on the container to resolve a tree of dependencies, you have less/no control over the classes in that tree. Therefore, mocking/faking those classes can become harder.

In the following example, the `UsersController.index` method accepts an instance of the `UserService` class, and we use the `@inject` decorator to resolve the dependency and give it to the `index` method.

```ts
import UserService from '#services/user_service'
import { inject } from '@adonisjs/core'

export default class UsersController {
  @inject()
  index(service: UserService) {}
}
```

Let's say during testing, you do not want to use the actual `UserService` as it makes external HTTP requests. Instead, you want to use a fake implementation.

But first, look at the code you might write to test the `UsersController`.

```ts
import UserService from '#services/user_service'

test('get all users', async ({ client }) => {
  const response = await client.get('/users')

  response.assertBody({
    data: [{ id: 1, username: 'virk' }]
  })
})
```

In the above test, we interact with the `UsersController` over an HTTP request and do not have direct control over it.

The container provides a straightforward API to swap classes with fake implementations. You can define a swap using the `container.swap` method.

The `container.swap` method accepts the class constructor you want to swap, followed by a factory function to return an alternative implementation.

```ts
import UserService from '#services/user_service'
// insert-start
import app from '@adonisjs/core/services/app'
// insert-end

test('get all users', async ({ client }) => {
  // insert-start
  class FakeService extends UserService {
    all() {
      return [{ id: 1, username: 'virk' }]
    }
  }
    
  app.container.swap(UserService, () => {
    return new FakeService()
  })
  // insert-end
  
  const response = await client.get('users')
  response.assertBody({
    data: [{ id: 1, username: 'virk' }]
  })
})
```

Once a swap has been defined, the container will use it instead of the actual class. You can restore the original implementation using the `container.restore` method.

```ts
app.container.restore(UserService)

// Restore all
app.container.restore()
```

## Contextual dependencies

Contextual dependencies allow you to define how a dependency should be resolved for a given class. For example, you have two services depending on the Drive Disk class.

```ts
import { Disk } from '@adonisjs/drive'

export default class UserService {
  constructor(protected disk: Disk) {}
}
``` 

```ts
import { Disk } from '@adonisjs/drive'

export default class PostService {
  constructor(protected disk: Disk) {}
}
```

You want the `UserService` to receive a disk instance with the GCS driver and the `PostService` to receive a disk instance with the S3 driver. You can do so using contextual dependencies.

The following code must be written inside a service provider `register` method.

```ts
import { Disk } from '@adonisjs/drive'
import UserService from '#services/user_service'
import PostService from '#services/post_service'
import { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container
      .when(UserService)
      .asksFor(Disk)
      .provide(async (resolver) => {
        const driveManager = await resolver.make('drive')
        return drive.use('gcs')
      })

    this.app.container
      .when(PostService)
      .asksFor(Disk)
      .provide(async (resolver) => {
        const driveManager = await resolver.make('drive')
        return drive.use('s3')
      })
  }
}
```

## Container hooks

You can use the container's `resolving` hook to modify/extend the return value of the `container.make` method.

Usually, you will use hooks inside a service provider when trying to extend a particular binding. For example, the Database provider uses the `resolving` hook to register additional database-driven validation rules.

```ts
import { ApplicationService } from '@adonisjs/core/types'

export default class DatabaseProvider {
  constructor(protected app: ApplicationService) {
  }

  async boot() {
    this.app.container.resolving('validator', (validator) => {
      validator.rule('unique', implementation)
      validator.rule('exists', implementation)
    })
  }
}
```

## Container events

The container emits the `container_binding:resolved` event after resolving a binding or constructing a class instance. The `event.binding` property will be a string (binding name) or a class constructor, and the `event.value` property is the resolved value.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('container_binding:resolved', (event) => {
  console.log(event.binding)
  console.log(event.value)
})
```

## See also

- [The container README file](https://github.com/adonisjs/fold/tree/next) covers the container API in the framework agnostic manner.
- [Why do you need an IoC container?](https://github.com/thetutlage/meta/discussions/4) In this article, the framework's creator shares his reasoning for using the IoC container.
