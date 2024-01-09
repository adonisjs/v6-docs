# Async Local storage

As per the [Node.js official documentation](https://nodejs.org/docs/latest-v21.x/api/async_context.html#class-asynclocalstorage): “AsyncLocalStorage is used to create asynchronous state within callbacks and promise chains. **It allows storing data throughout the lifetime of a web request or any other asynchronous duration. It is similar to thread-local storage in other languages**.”

To simplify the explanation further, AsyncLocalStorage allows you to store a state when executing an async function and make it available to all the code paths within that function.

## Basic example

Let's see it in action. First, we will create a new Node.js project (without any dependencies) and use `AsyncLocalStorage` to share the state between modules without passing it by reference.


:::note

You can find the final code for this example on [als-basic-example](https://github.com/thetutlage/als-basic-example) Github repo.


:::

### Step 1. Creating a new project

```sh
npm init --yes
```

Open the `package.json` file and set the module system to ESM.

```json
{
  "type": "module"
}
```

### Step 2. Creating an instance of `AsyncLocalStorage`

Create a file named `storage.js`, which creates and exports an instance of the `AsyncLocalStorage`.

```ts
// title: storage.js
import { AsyncLocalStorage } from 'async_hooks'
export const storage = new AsyncLocalStorage()
```

### Step 3. Execute code inside `storage.run`

Create an entry point file named `main.js`.  Inside this file, import the instance of `AsyncLocalStorage` created inside the `./storage.js` file.

The `storage.run` method accepts the state we want to share as the first argument and a callback function as the second argument. All code paths inside this callback (including the imported modules) will have access to the same state.

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

For demonstration, we will execute the `run` method three times without awaiting it. Paste the following code at the end of the `main.js` file.

```ts
// title: main.js
run({ id: 1 })
run({ id: 2 })
run({ id: 3 })
```

### Step 4. Access the state from the `user_service` module.

Finally, let's import the storage instance inside the `user_service` module and access the current state.

```ts
// title: user_service.js
import { storage } from './storage.js'

export default class UserService {
  async get() {
    const state = storage.getStore()
    console.log(`The user id is ${state.user.id}`)
  }
}
```

### Step 5. Execute the `main.js` file.

Let's run the `main.js` file to see if the `UserService` can access the state.

```sh
node main.js
```

## What is the need for Async local storage?

Unlike other languages like PHP, Node.js is not a threaded language. In PHP, every HTTP request creates a new thread, and each thread has its memory. This allows you to store the state in the global memory and access it anywhere inside your codebase.

In Node.js, you cannot have a global state isolated between HTTP requests because Node.js runs on a single thread and has shared memory. As a result, all Node.js applications share data by passing it as parameters.

Passing data by reference has no technical downsides. But, it does make the code verbose, especially when you configure APM tools and have to provide request data to them manually.

## Usage

AdonisJS uses `AsyncLocalStorage` during HTTP requests and shares the [HTTP context](../http/http_context.md) as the state. As a result, you can access the HTTP context in your application globally.

First, you must enable the `useAsyncLocalStorage` flag inside the `config/app.ts` file.

```ts
// title: config/app.ts
export const http = defineConfig({
  useAsyncLocalStorage: true,
})
```

Once enabled, you can use the `HttpContext.get` or `HttpContext.getOrFail` methods to get an instance of the HTTP Context for the ongoing request.

In the following example, we get the context inside a Lucid model.

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

## Caveats
You can use ALS if it makes your code straightforward and you prefer global access vs. passing HTTP Context by reference.

However, be aware of the following situations that can easily lead to memory leaks or unstable behavior of the program.


### Top-level access

Do not access the ALS at the top level of any module because modules in Node.js are cached. 

:::caption{for="error"}
**Incorrect usage**\
Assigning the result of the `HttpContext.getOrFail()` method to a variable at top-level will hold the reference to the request that first imported the module.
:::


```ts
import { HttpContext } from '@adonisjs/core/http'
const ctx = HttpContext.getOrFail()

export default class UsersController {
  public async index() {
    ctx.request
  }
}
```

:::caption[]{for="success"}
**Correct usage**\
Instead, you should move the `getOrFail` method call inside the `index` method.
:::

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index() {
    const ctx = HttpContext.getOrFail()
  }
}
```

### Inside static properties
Static properties (not methods) of any class are evaluated as soon as the module is imported; hence, you should not access the HTTP context within static properties.

:::caption{for="error"}
**Incorrect usage**
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
import { BaseModel } from '@adonisjs/lucid'

export default class User extends BaseModel {
  static connection = HttpContext.getOrFail().tenant.name
}
```

:::caption[]{for="success"}
**Correct usage**\
Instead, you should move the `HttpContext.get` call inside a method or convert the property to a getter.
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

### Event handlers
Event handlers are executed after the HTTP request finishes. Therefore you should refrain from attempting to access the HTTP context inside them.

```ts
import emitter from '@adonisjs/core/services/emitter'

export default class UsersController {
  public async index() {
    const user = await User.create({})
    emitter.emit('new:user', user)
  }
}
```

:::caption[]{for="error"}
**Avoid usage inside event listeners**
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'

emitter.on('new:user', () => {
  const ctx = HttpContext.getOrFail()
})
```
