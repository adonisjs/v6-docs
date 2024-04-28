# Service Providers

Services providers are plain JavaScript classes with lifecycle methods to perform actions during different phases of the application.

A service provider can register [bindings into the container](../../concepts/dependency_injection#container-bindings), [extend existing bindings](../../concepts/dependency_injection#container-events), or run actions after the HTTP server starts.

Service providers are the entry point to an AdonisJS application with the ability to modify the application state before it is considered ready.

The providers are registered inside the `adonisrc.ts` file under the `providers` array. The value is a function to lazily import the service provider

```ts
{
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('./providers/app_provider.js'),
  ]
}
```

By default, a provider is loaded in all the runtime environments. However, you can limit the provider to run in specific environments.

```ts
{
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    {
      file: () => import('./providers/app_provider.js'),
      environment: ['web', 'repl']
    }
  ]
}
```

## Writing service providers

Service providers are stored inside the `providers` directory of your app. Alternatively, you can use the `node ace make:provider app` command.

The provider module must have an `export default` statement returning the provider class. The class constructor receives an instance of the [Application](application.md) class.

See also: [Make provider command](../api-references/commands.md#makeprovider)

```ts
import { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {
  }
}
```

Following are the lifecycle methods you can implement to perform different actions.

```ts
export default class AppProvider {
  register() {
  }
  
  async boot() {
  }
  
  async start() {
  }
  
  async ready() {
  }
  
  async shutdown() {
  }
}
```

### register

The `register` method is called after an instance of the provider class is created. The `register` method can register bindings within the IoC container. 

The `register` method is synchronous, so you cannot use Promises inside this method.

```ts
export default class AppProvider {
  register() {
    this.app.container.bind('db', () => {
      return new Database()
    })
  }
}
```

### boot

The `boot` method is called after all the bindings have been registered with the IoC container. Inside this method, you can resolve bindings from the container to extend/mutate them.

```ts
export default class AppProvider {
  async boot() {
   const validator = await this.app.container.make('validator')
    
   // Add custom validation rules
   validator.rule('foo', () => {})
  }
}
```

It is a good practice to extend bindings when they are resolved from the container. For example, you can use the `resolving` hook to add custom rules to the validator.

```ts
async boot() {
  this.app.container.resolving('validator', (validator) => {
    validator.rule('foo', () => {})
  })
}
```

### start

The `start` method is called after the `boot` and before the `ready ` method. It allows you to perform actions that the `ready` hook actions might need.

### ready

The `ready` method gets called at different stages based on the application's environment.

<table>
    <tr>
        <td width="100"><code> web </code></td>
        <td>The <code>ready</code> method is called after the HTTP server has been started and is ready to accept requests.</td>
    </tr>
    <tr>
        <td width="100"><code>console</code></td>
        <td>The <code> ready</code> method is called just before the <code>run</code> method of the main command.</td>
    </tr>
    <tr>
        <td width="100"><code>test</code></td>
        <td>The <code>ready</code> method is called just before running all the tests. However, the test files are imported before the <code>ready</code> method.</td>
    </tr>
    <tr>
        <td width="100"><code>repl</code></td>
        <td>The <code>ready</code> method is called before the REPL prompt is displayed on the terminal.</td>
    </tr>
</table>

```ts
export default class AppProvider {
  async start() {
    if (this.app.getEnvironment() === 'web') {
    }

    if (this.app.getEnvironment() === 'console') {
    }

    if (this.app.getEnvironment() === 'test') {
    }

    if (this.app.getEnvironment() === 'repl') {
    }
  }
}
```

### shutdown

The `shutdown` method is called when AdonisJS is in the middle of gracefully exiting the application.

The event of exiting the application depends upon the environment in which the app is running and how the application process started. Please read the [application lifecycle guide](application_lifecycle.md) to know more about it.

```ts
export default class AppProvider {
  async shutdown() {
    // perform the cleanup
  }
}
```
