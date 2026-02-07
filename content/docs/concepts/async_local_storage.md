---
summary: 了解 AsyncLocalStorage 以及如何在 AdonisJS 中使用它。
---

# 异步本地存储 (Async local storage)

根据 [Node.js 官方文档](https://nodejs.org/docs/latest-v21.x/api/async_context.html#class-asynclocalstorage)：“AsyncLocalStorage 用于在回调和 Promise 链中创建异步状态。**它允许在 Web 请求的整个生命周期或任何其他异步持续时间内存储数据。它类似于其他语言中的线程本地存储**。”

简单来说，AsyncLocalStorage 允许您在执行异步函数时存储状态，并使其在该函数内的所有代码路径中可用。

## 基本示例

让我们通过实际操作来看看。首先，我们将创建一个新的 Node.js 项目（没有任何依赖项），并使用 `AsyncLocalStorage` 在模块之间共享状态，而不通过引用传递它。

:::note

您可以在 [als-basic-example](https://github.com/thetutlage/als-basic-example) GitHub 仓库中找到此示例的最终代码。

:::

### 步骤 1. 创建新项目

```sh
npm init --yes
```

打开 `package.json` 文件并将模块系统设置为 ESM。

```json
{
  "type": "module"
}
```

### 步骤 2. 创建 `AsyncLocalStorage` 实例

创建一个名为 `storage.js` 的文件，该文件创建并导出 `AsyncLocalStorage` 的一个实例。

```ts
// title: storage.js
import { AsyncLocalStorage } from 'async_hooks'
export const storage = new AsyncLocalStorage()
```

### 步骤 3. 在 `storage.run` 中执行代码

创建一个名为 `main.js` 的入口点文件。在此文件中，导入在 `./storage.js` 文件中创建的 `AsyncLocalStorage` 实例。

`storage.run` 方法接受我们要共享的状态作为第一个参数，并接受一个回调函数作为第二个参数。此回调内的所有代码路径（包括导入的模块）都可以访问相同的状态。

```ts
// title: main.js
import { storage } from './storage.js'
import UserService from './user_service.js'
import { setTimeout } from 'node:timers/promises'

async function run(user) {
  const state = { user }

  return storage.run(state, async () => {
    await setTimeout(100)
    const userService = new UserService()
    await userService.get()
  })
}
```

为了演示，我们将执行 `run` 方法三次而不等待它。将以下代码粘贴到 `main.js` 文件的末尾。

```ts
// title: main.js
run({ id: 1 })
run({ id: 2 })
run({ id: 3 })
```

### 步骤 4. 从 `user_service` 模块访问状态

最后，让我们在 `user_service` 模块中导入存储实例并访问当前状态。

```ts
// title: user_service.js
import { storage } from './storage.js'

export class UserService {
  async get() {
    const state = storage.getStore()
    console.log(`The user id is ${state.user.id}`)
  }
}
```

### 步骤 5. 执行 `main.js` 文件

让我们运行 `main.js` 文件，看看 `UserService` 是否可以访问状态。

```sh
node main.js
```

## 为什么需要异步本地存储？

与 PHP 等其他语言不同，Node.js 不是线程语言。在 PHP 中，每个 HTTP 请求都会创建一个新线程，每个线程都有自己的内存。这允许您将状态存储在全局内存中，并在代码库的任何位置访问它。

在 Node.js 中，您不能拥有在 HTTP 请求之间隔离的全局状态，因为 Node.js 运行在单线程上并具有共享内存。因此，所有 Node.js 应用程序都通过参数传递数据来共享数据。

通过引用传递数据没有技术上的缺点。但是，它确实使代码变得冗长，特别是当您配置 APM 工具并且必须手动向它们提供请求数据时。

## 用法

AdonisJS 在 HTTP 请求期间使用 `AsyncLocalStorage` 并共享 [HTTP 上下文](./http_context.md) 作为状态。因此，您可以在应用程序中全局访问 HTTP 上下文。

首先，您必须在 `config/app.ts` 文件中启用 `useAsyncLocalStorage` 标志。

```ts
// title: config/app.ts
export const http = defineConfig({
  useAsyncLocalStorage: true,
})
```

启用后，您可以使用 `HttpContext.get` 或 `HttpContext.getOrFail` 方法获取正在进行的请求的 HTTP 上下文实例。

在下面的示例中，我们在 Lucid 模型中获取上下文。

```ts
import { HttpContext } from '@adonisjs/core/http'
import { BaseModel } from '@adonisjs/lucid'

export default class Post extends BaseModel {
  get isLiked() {
    const ctx = HttpContext.getOrFail()
    const authUserId = ctx.auth.user.id
    
    return !!this.likes.find((like) => {
      return like.userId === authUserId
    })
  }
}
```

## 注意事项

如果使用 ALS 能让您的代码变得简单，并且您更喜欢全局访问而不是通过引用传递 HTTP 上下文，那么您可以使用它。

但是，请注意以下情况，这些情况很容易导致内存泄漏或程序行为不稳定。

### 顶层访问

不要在任何模块的顶层访问 ALS，因为 Node.js 中的模块是缓存的。

:::caption{for="error"}
**错误用法**\
在顶层将 `HttpContext.getOrFail()` 方法的结果赋值给变量，将保留对首次导入模块的请求的引用。
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
const ctx = HttpContext.getOrFail()

export default class UsersController {
  async index() {
    ctx.request
  }
}
```

:::caption[]{for="success"}
**正确用法**\
相反，您应该将 `getOrFail` 方法调用移动到 `index` 方法内部。
:::

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index() {
    const ctx = HttpContext.getOrFail()
  }
}
```

### 在静态属性中

任何类的静态属性（不是方法）都会在模块导入后立即求值；因此，您不应该在静态属性中访问 HTTP 上下文。

:::caption{for="error"}
**错误用法**
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
import { BaseModel } from '@adonisjs/lucid'

export default class User extends BaseModel {
  static connection = HttpContext.getOrFail().tenant.name
}
```

:::caption[]{for="success"}
**正确用法**\
相反，您应该将 `HttpContext.get` 调用移动到方法内部或将属性转换为 getter。
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
import { BaseModel } from '@adonisjs/lucid'

export default class User extends BaseModel {
  static query() {
    const ctx = HttpContext.getOrFail()
    return super.query({ connection: tenant.connection })
  }
}
```

### 事件处理器

事件处理器在 HTTP 请求完成后执行。因此，您应该避免尝试在其中访问 HTTP 上下文。

```ts
import emitter from '@adonisjs/core/services/emitter'

export default class UsersController {
  async index() {
    const user = await User.create({})
    emitter.emit('new:user', user)
  }
}
```

:::caption[]{for="error"}
**避免在事件监听器中使用**
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'

emitter.on('new:user', () => {
  const ctx = HttpContext.getOrFail()
})
```
