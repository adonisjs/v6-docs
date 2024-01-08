# Application

The [Application](https://github.com/adonisjs/application/blob/main/src/application.ts) class does all the heavy lifting of wiring together an AdonisJS application. You can use this class to know about the environment in which your app is running, get the current state of the application, or make paths to specific directories.

See also: [Application lifecycle](./application_lifecycle.md)

## Environment 

The environment refers to the application runtime environment. The application is always booted in one of the following known environments. 

- `web` environment refers to the process started for the HTTP server.

- `console` environment refers to the Ace commands except for the REPL command.

- `repl` environment refers to the process started using the `node ace repl` command.

- Finally, the `test` environment refers to the process started using the `node ace test` command.

You can access the application environment using the `getEnvironment` method.

```ts
import app from '@adonisjs/core/services/app'

console.log(app.getEnvironment())
```

You can also switch the application environment before it has been booted. A great example of this is the REPL command. 

The `node ace repl` command starts the application in the `console` environment, but the command internally switches the environment to `repl` before presenting the REPL prompt.

```ts
if (!app.isBooted) {
	app.setEnvironment('repl')
}
```

## Node environment

You can access the Node.js environment using the `nodeEnvironment` property. The value is a reference to the `NODE_ENV` environment variable. However, the value is further normalized to be consistent.

```ts
import app from '@adonisjs/core/services/app'

console.log(app.nodeEnvironment)
```

| NODE_ENV | Normalized to |
|------------|----------------|
| dev | development |
| develop | development |
| stage | staging |
| prod | production |
| testing | test |

Also, you can use the following properties as a shorthand to know the current environment.

- `inProduction`: Check if the application is running in the production environment.
- `inDev`: Check if the application is running in the development environment.
- `inTest`: Check if the application is running in the test environment.

```ts
import app from '@adonisjs/core/services/app'

// Is in production
app.inProduction
app.nodeEnvironment === 'production'

// Is in development
app.inDev
app.nodeEnvironment === 'development'

// Is in the test
app.inTest
app.nodeEnvironment === 'test'
```

## State

The state refers to the current state of the application. The framework features you can access significantly depend upon the current state of the application. For example, you cannot access the [container bindings](./ioc_container.md#container-bindings) or [container services](./container_services.md) until the app is in a `booted` state.

The application is always in one of the following known states.

- `created`: It is the default state of the application.

- `initiated`: In this state, we parse/validate the environment variables and process the `adonisrc.ts` file.

- `booted`: The application service providers are registered and booted at this state.

- `ready`: The ready state varies between different environments. For example, in the `web` environment, the ready state means the application is ready to accept new HTTP requests.

- `terminated`: The application has been terminated, and the process will exit shortly. The application will not accept new HTTP requests in the `web` environment.

```ts
import app from '@adonisjs/core/services/app'

console.log(app.getState())
```

You can also use the following shorthand properties to know whether the application is in a given state.

```ts
import app from '@adonisjs/core/services/app'

// App is booted
app.isBooted
app.getState() !== 'created' && app.getState() !== 'initiated'

// App is ready
app.isReady
app.getState() === 'ready'

// gracefully attempting to terminate the app
app.isTerminating

// App has been terminated
app.isTerminated
app.getState() === 'terminated'
```

## Listening for process signals

You can listen for [POSIX signals](https://man7.org/linux/man-pages/man7/signal.7.html) using the `app.listen`, or `app.listenOnce` methods. Under the hood, we register the listener with the Node.js `process` object.

```ts
import app from '@adonisjs/core/services/app'

// Listen for a SIGTERM signal
app.listen('SIGTERM', () => {
})

// Listen once for a SIGTERM signal
app.listenOnce('SIGTERM', () => {
})
```

At times, you might want to register the listeners conditionally. For example, listen to the `SIGINT` signal when running inside the pm2 environment.

You can use the `listenIf` or `listenOnceIf` methods to register a listener conditionally. The listener is only registered when the first argument's value is truthy.

```ts
import app from '@adonisjs/core/services/app'

app.listenIf(app.managedByPm2, 'SIGTERM', () => {
})

app.listenOnceIf(app.managedByPm2, 'SIGTERM', () => {
})
```

## Notifying parent process

If your application starts as a child process, you can send messages to the parent process using the `app.notify` method. Under the hood, we use the `process.send` method.

```ts
import app from '@adonisjs/core/services/app'

app.notify('ready')

app.notify({
  isReady: true,
  port: 3333,
  host: 'localhost'
})
```

## Making URLs and paths to project files

Instead of self-constructing absolute URLs or paths to project files, we highly recommend using the following helpers.

### makeURL

The make URL method returns a file URL to a given file or directory within the project root. For example, you may generate a URL when importing a file.

```ts
import app from '@adonisjs/core/services/app'

const files = [
  './tests/welcome.spec.ts',
  './tests/maths.spec.ts'
]

await Promise.all(files.map((file) => {
  return import(app.makeURL(file).href)
}))
```

### makePath

The `makePath` method returns an absolute path to a given file or directory within the project root.

```ts
import app from '@adonisjs/core/services/app'

app.makePath('app/middleware/auth.ts')
```

### configPath

Returns path to a file inside the project's config directory.

```ts
app.configPath('shield.ts')
// /project_root/config/shield.ts

app.configPath()
// /project_root/config
```

### publicPath

Returns path to a file inside the project's public directory.

```ts
app.publicPath('style.css')
// /project_root/public/style.css

app.publicPath()
// /project_root/public
```

### providersPath

Returns path to a file inside the provider's directory.

```ts
app.providersPath('app_provider')
// /project_root/providers/app_provider.ts

app.providersPath()
// /project_root/providers
```

### factoriesPath

Returns path to a file inside the database factories directory.

```ts
app.factoriesPath('user.ts')
// /project_root/database/factories/user.ts

app.factoriesPath()
// /project_root/database/factories
```

### migrationsPath
Returns path to a file inside the database migrations directory.

```ts
app.migrationsPath('user.ts')
// /project_root/database/migrations/user.ts

app.migrationsPath()
// /project_root/database/migrations
```

### seedersPath
Returns path to a file inside the database seeders directory.

```ts
app.seedersPath('user.ts')
// /project_root/database/seeders/users.ts

app.seedersPath()
// /project_root/database/seeders
```

### languageFilesPath
Returns path to a file inside languages directory.

```ts
app.languageFilesPath('en/messages.json')
// /project_root/resources/lang/en/messages.json

app.languageFilesPath()
// /project_root/resources/lang
```

### viewsPath
Returns path to a file inside the views directory.

```ts
app.viewsPath('welcome.edge')
// /project_root/resources/views/welcome.edge

app.viewsPath()
// /project_root/resources/views
```

### startPath
Returns path to a file inside the start directory.

```ts
app.startPath('routes.ts')
// /project_root/start/routes.ts

app.startPath()
// /project_root/start
```

### tmpPath

Returns path to a file inside the `tmp` directory within the project root.

```ts
app.tmpPath('logs/mail.txt')
// /project_root/tmp/logs/mail.txt

app.tmpPath()
// /project_root/tmp
```

### httpControllersPath

Returns path to a file inside the HTTP controllers directory.

```ts
app.httpControllersPath('users_controller.ts')
// /project_root/app/controllers/users_controller.ts

app.httpControllersPath()
// /project_root/app/controllers
```

### modelsPath

Returns path to a file inside the model's directory.

```ts
app.modelsPath('user.ts')
// /project_root/app/models/user.ts

app.modelsPath()
// /project_root/app/models
```

### servicesPath

Returns path to a file inside the services directory.

```ts
app.servicesPath('user.ts')
// /project_root/app/services/user.ts

app.servicesPath()
// /project_root/app/services
```

### exceptionsPath

Returns path to a file inside the exceptions directory.

```ts
app.exceptionsPath('handler.ts')
// /project_root/app/exceptions/handler.ts

app.exceptionsPath()
// /project_root/app/exceptions
```

### mailsPath

Returns path to a file inside the mails directory.

```ts
app.mailsPath('verify_email.ts')
// /project_root/app/mails/verify_email.ts

app.mailsPath()
// /project_root/app/mails
```

### middlewarePath

Returns path to a file inside the middleware directory.

```ts
app.middlewarePath('auth.ts')
// /project_root/app/middleware/auth.ts

app.middlewarePath()
// /project_root/app/middleware
```

### policiesPath

Returns path to a file inside the policies directory.

```ts
app.policiesPath('posts.ts')
// /project_root/app/polices/posts.ts

app.policiesPath()
// /project_root/app/polices
```

### validatorsPath

Returns path to a file inside the validators directory.

```ts
app.validatorsPath('create_user.ts')
// /project_root/app/validators/create_user.ts

app.validatorsPath()
// /project_root/app/validators/create_user.ts
```

### commandsPath

Returns path to a file inside the commands directory.

```ts
app.commandsPath('greet.ts')
// /project_root/commands/greet.ts

app.commandsPath()
// /project_root/commands
```

### eventsPath

Return path to a file inside the events directory.

```ts
app.eventsPath('user_created.ts')
// /project_root/app/events/user_created.ts

app.eventsPath()
// /project_root/app/events
```

### listenersPath

Return path to a file inside the listeners directory.

```ts
app.listenersPath('send_invoice.ts')
// /project_root/app/listeners/send_invoice.ts

app.listenersPath()
// /project_root/app/listeners
```

## Generators

Generators are used to create class names and file names for different entities. For example, you may use the `generators.controllerFileName` method to generate the filename for a controller.

```ts
import app from '@adonisjs/core/services/app'

app.generators.controllerFileName('user')
// output - users_controller.ts

app.generators.controllerName('user')
// output - UsersController
```

Please [reference the `generators.ts` source code](https://github.com/adonisjs/application/blob/main/src/generators.ts) to view the list of available generators.
