# Hot Module Reloading

Hot Module Reloading (HMR) is a feature baked in since AdonisJS 6.x.x that allows automatic reloading of modified files without having to restart the entire server.

Until recently, the traditional way of working with AdonisJS was to launch the dev server with the command `node ace serve --watch`, which would take care of completely restarting the server/node process each time a file was modified, just like Nodemon does for example.

This process works well, but depending on certain things, it's sometimes not the most optimal:

- Sometimes you have a lot of configured packages, and therefore providers that execute on each restart. This can slow down the startup process.
- If you use TSX as a template engine, then a simple modification of, let's say, paddings or margins in one of your views forces you to reload the entire server, resulting in a quite slow feedback loop.

To correct these issues and improve the development experience, AdonisJS 6.x.x introduced Hot Module Reloading (HMR) based on [Hot-Hook](https://github.com/julien-R44/hot-hook), also developed by the Core Team.

:::tip

Make sure to read the extensive documentation of [Hot-Hook](https://github.com/julien-R44/hot-hook) to understand in more detail how it works.

:::

## Configuration

First, make sure you have AdonisJS version 6.x.x. Then, you can configure HMR in your `package.json`. You will generally only need to specify the list of your controllers via a glob pattern.

```jsonc
// title: package.json
{
  "name": "adonis-app",
  "type": "module",
  // ...
  "hotHook": {
    "boundaries": [
      "./app/controllers/**/*.ts"
    ]
  }
}
```

## Usage

To launch the server with HMR, you will need to use the command `node ace serve --hmr` instead of `node ace serve --watch`.

```sh
node ace serve --hmr
```

And there you go. Try modifying a controller and you will see that the server does not restart, and if you execute a request, the modifications will be taken into account: you will always have the latest version of your code.

## Cleaning up side-effects

It's important to note that HMR does not automatically clean up your modules' side effects. Consider the following case:

```ts
export default class UsersController {
  store() {
    setInterval(() => {
      console.log('Hello')
    }, 1000)
  }
}
```

If this controller is modified, the server will not restart, and consequently, the `setInterval` will not be cleaned up, meaning if HMR is applied multiple times to this file, then multiple `setInterval` will be created and executed at the same time.

Two solutions are available to avoid this kind of problem. The first is to clean up side-effects using `import.meta.hot?.dispose`:

```ts
let interval: NodeJS.Timeout
import.meta.hot?.dispose(() => {
  clearInterval(interval)
})

export default class UsersController {
  store() {
    interval = setInterval(() => {
      console.log('Hello')
    }, 1000)
  }
}
```

The callback passed to `import.meta.hot?.dispose` will be executed each time the module is reloaded. This way, we ensure that the setInterval is properly destroyed when the module is reloaded.

The second solution, sometimes simpler, is to disable HMR for this file using `import.meta.hot?.decline`:

```ts
import.meta.hot?.decline()

export default class UsersController {
  store() {
    setInterval(() => {
      console.log('Hello')
    }, 1000)
  }
}
```

By using `import.meta.hot?.decline`, HMR will not be applied to this file : the server will restart when this file is updated.

## Limitations

### Unreloaded files

In AdonisJS, only your controllers and their dependencies are automatically reloaded. If you modify, for example, a provider or a configuration file, your server will be completely restarted: which makes sense because these files are executed only at the startup of your application. So it is necessary to restart the server for the modifications to be taken into account.

### Dynamic imports

You will need to use dynamic imports for your controllers for HMR to work correctly:

```ts
const UserController = () => import('#controllers/users_controller.js')
router.get('/users', [UserController, 'index'])
```

If you use the [Eslint configuration](./tooling_config.md#eslint-config) of AdonisJS, this will be automatically done for you.

:::tip
For more information on this subject, consult [this part of the Hot hook documentation](https://github.com/Julien-R44/hot-hook#esm-cache-busting)
:::
