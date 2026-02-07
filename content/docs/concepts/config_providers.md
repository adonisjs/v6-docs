---
summary: 了解配置提供者 (Config providers) 以及它们如何帮助您在应用程序启动后延迟计算配置。
---

# 配置提供者 (Config providers)

一些配置文件（如 `config/hash.ts`）不导出纯对象配置。相反，它们导出 [配置提供者](https://github.com/adonisjs/core/blob/main/src/config_provider.ts#L16)。配置提供者为包提供了一个透明的 API，以便在应用程序启动后延迟计算配置。

## 没有配置提供者

为了理解配置提供者，让我们看看如果我们不使用配置提供者，`config/hash.ts` 文件会是什么样子。

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

到目前为止，一切顺利。我们直接导入它并使用工厂函数返回一个实例，而不是从 `drivers` 集合中引用 `scrypt` 驱动程序。

假设 `Scrypt` 驱动程序需要一个 Emitter 类的实例，以便在每次哈希值时发出事件。

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

**🚨 上面的例子将会失败**，因为 AdonisJS [容器服务](./container_services.md) 在应用程序启动之前不可用，而配置文件是在应用程序启动阶段之前导入的。

### 呃，这是 AdonisJS 架构的问题吗 🤷🏻‍♂️

并非如此。让我们不使用容器服务，而是直接在配置文件中创建 Emitter 类的实例。

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

现在，我们遇到了一个新问题。我们为 `Scrypt` 驱动程序创建的 `emitter` 实例不是全局可用的，我们无法导入它并监听驱动程序发出的事件。

因此，您可能希望将 `Emitter` 类的构造移动到其文件中并导出其实例。这样，您可以将 emitter 实例传递给驱动程序并使用它来监听事件。

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

上面的代码将正常工作。但是，这次您是在手动构造应用程序所需的依赖项。结果，您的应用程序将有大量的样板代码来将所有内容连接在一起。

使用 AdonisJS，我们努力编写最少的样板代码，并使用 IoC 容器来查找依赖项。

## 使用配置提供者

现在，让我们重写 `config/hash.ts` 文件，这次使用配置提供者。配置提供者是一个函数的别名，该函数接受 [Application 类的实例](./application.md) 并使用容器解析其依赖项。

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

一旦您使用 [hash](../security/hashing.md) 服务，`scrypt` 驱动程序的配置提供者将被执行以解析其依赖项。因此，直到我们在代码的其他地方使用哈希服务之前，我们不会尝试查找 `emitter`。

由于配置提供者是异步的，您可能希望通过动态导入延迟导入 `Scrypt` 驱动程序。

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

## 如何访问解析后的配置？

您可以直接从服务访问解析后的配置。例如，在哈希服务的情况下，您可以按如下方式获取对解析后配置的引用。

```ts
import hash from '@adonisjs/core/services/hash'
console.log(hash.config)
```
