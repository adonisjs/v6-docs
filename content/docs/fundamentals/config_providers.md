# Config providers

Some configuration files like (`config/hash.ts`) do not export config as a plain object. Instead, they export a [config provider](https://github.com/adonisjs/core/blob/main/src/config_provider.ts#L16). The config provider provides a transparent API for packages to lazily compute the configuration after the application is booted.

## Without config providers

To understand config providers, let's see what the `config/hash.ts` file would look like if we were not using config providers.

```ts
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'

export default {
  default: 'scrypt',
  list: {
    scrypt: () => new Scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    })
  }
}
```

So far, so good. Instead of referencing the `scrypt` driver from the `drivers` collection. We are importing it directly and returning an instance using a factory function.

Let's say the `Scrypt` driver needs an instance of the Emitter class to emit an event every time it hashes a value.

```ts
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
// insert-start
import emitter from '@adonisjs/core/services/emitter'
// insert-end

export default {
  default: 'scrypt',
  list: {
    scrypt: () => new Scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    // insert-start
    }, emitter)
    // insert-end
  }
}
```

**🚨 The above example will fail** because the AdonisJS [container services](./container_services.md) are unavailable until the application has been booted and the config files are imported before the application boot phase.

### Well, that's a problem with AdonisJS architecture 🤷🏻‍♂️
Not really. Let's not use the container service and create an instance of the Emitter class directly within the config file.

```ts
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
// delete-start
import emitter from '@adonisjs/core/services/emitter'
// delete-end
// insert-start
import { Emitter } from '@adonisjs/core/events'
// insert-end

// insert-start
const emitter = new Emitter()
// insert-end

export default {
  default: 'scrypt',
  list: {
    scrypt: () => new Scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }, emitter)
  }
}
```

Now, we have a new problem. The `emitter` instance we have created for the `Scrypt` driver is not globally available for us to import and listen for events emitted by the driver.

Therefore, you might want to move the construction of the `Emitter` class to its file and export an instance of it. This way, you can pass the emitter instance to the driver and use it to listen to events.

```ts
// title: start/emitter.ts
import { Emitter } from '@adonisjs/core/events'
export const emitter = new Emitter()
```

```ts
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
// delete-start
import { Emitter } from '@adonisjs/core/events'
// delete-end
// insert-start
import { emitter } from '#start/emitter'
// insert-end

// delete-start
const emitter = new Emitter()
// delete-end

export default {
  default: 'scrypt',
  list: {
    scrypt: () => new Scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }, emitter)
  }
}
```

The above code will work fine. However, you are manually constructing the dependencies your application needs this time. As a result, your application will have a lot of boilerplate code to wire everything together.

With AdonisJS, we strive to write minimal boilerplate code and use the IoC container for lookup dependencies.

## With config provider
Now, let's re-write the `config/hash.ts` file and use a config provider this time. Config provider is a fancy name for a function that accepts an [instance of the Application class](./application.md) and resolves its dependencies using the container.

```ts
// highlight-start
import { configProvider } from '@adonisjs/core'
// highlight-end
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'

export default {
  default: 'scrypt',
  list: {
    // highlight-start
    scrypt: configProvider.create(async (app) => {
      const emitter = await app.container.make('emitter')

      return () => new Scrypt({
        cost: 16384,
        blockSize: 8,
        parallelization: 1,
        maxMemory: 33554432,
      }, emitter)
    })
    // highlight-end
  }
}
```

Once you use the [hash](../security/hash.md) service, the config provider for the `scrypt` driver will be executed to resolve its dependencies. As a result, we do not attempt to look up the `emitter` until we use the hash service elsewhere inside our code.

Since config providers are async, you might want to import the `Scrypt` driver lazily via dynamic import.

```ts
import { configProvider } from '@adonisjs/core'
// delete-start
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
// delete-end

export default {
  default: 'scrypt',
  list: {
    scrypt: configProvider.create(async (app) => {
      // insert-start
      const { Scrypt } = await import('@adonisjs/core/hash/drivers/scrypt')
      // insert-end
      const emitter = await app.container.make('emitter')

      return () => new Scrypt({
        cost: 16384,
        blockSize: 8,
        parallelization: 1,
        maxMemory: 33554432,
      }, emitter)
    })
  }
}
```

## How do I access the resolved config?
You may access the resolved config from the service directly. For example, in the case of the hash service, you can get a reference to the resolved config as follows.

```ts
import hash from '@adonisjs/core/services/hash'
console.log(hash.config)
```
