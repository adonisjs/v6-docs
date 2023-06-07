# AdonisRC file

The `.adonisrc.json` file is used to configure the workspace settings of your application. In this file, you can [register providers](#providers), define [command aliases](#commandsaliases), specify the [files to copy](#metafiles) to the production build, and much more.

The file contains the minimum required configuration to run your application. However, you can view the complete file contents by running the `node ace inspect:rcfile` command.

```sh
node ace inspect:rcfile
```

You can access the parsed RCFile contents using the `app` service.

```ts
import app from '@adonisjs/core/services/app'

console.log(app.rcFile)
```

## typescript

The `typescript` property informs the framework and the Ace commands that your application uses TypeScript. Currently, this value is always set to `true`. However, we will later allow applications to be written in JavaScript.

## directories

A set of directories and their paths used by the [scaffolding commands](../digging_deeper/scaffolding.md). If you decide to rename specific directories, update their new path inside the `directories` object to notify scaffolding commands.

```json
{
  "directories": {
    "config": "config",
    "commands": "commands",
    "contracts": "contracts",
    "public": "public",
    "providers": "providers",
    "languageFiles": "resources/lang",
    "migrations": "database/migrations",
    "seeders": "database/seeders",
    "factories": "database/factories",
    "views": "resources/views",
    "start": "start",
    "tmp": "tmp",
    "tests": "tests",
    "httpControllers": "app/controllers",
    "models": "app/models",
    "services": "app/services",
    "exceptions": "app/exceptions",
    "mailers": "app/mailers",
    "middleware": "app/middleware",
    "policies": "app/policies",
    "validators": "app/validators"
  }
}
```

## preloads
An array of files to import at the time of booting the application. The files are imported immediately after booting the service providers.

You can define the environment in which to import the file. The valid options are:

- `web` environment refers to the process started for the HTTP server.
- `console` environment refers to the Ace commands except for the `repl` command.
- `repl` environment refers to the process started using the `node ace repl` command.
- Finally, the `test` environment refers to the process started for running the tests.


:::note

You can create and register a preload file using the `node ace make:prldfile` command.


:::


```json
{
  "preloads": ["./start/view.js"]
}
```

```json
{
  "preloads": [
    {
      "file": "./start/routes.js",
      "environment": [
        "web",
        "console",
        "test"
      ]
    },
  ]
}
```

## metaFiles

The `metaFiles` array is a collection of files you want to copy to the `build` folder when creating the production build.

These are non-TypeScript/JavaScript files that must exist in the production build for your application to work. For example, the Edge templates, i18n language files, etc.

- `pattern`: The [glob pattern](https://github.com/sindresorhus/globby#globbing-patterns) to find matching files. 
- `reloadServer`: Reload the development server when matching files change.

```json
{
  "metaFiles": [
    {
      "pattern": "public/**",
      "reloadServer": false
    },
    {
      "pattern": "resources/views/**/*.edge",
      "reloadServer": false
    }
  ]
}
```

## commands
An array of paths to import ace commands. You can define a relative path like `./commands/main.js` or a path to an installed package.

```json
{
  "commands": [
    "./commands/main.js",
    "@adonisjs/core/commands",
    "@adonisjs/lucid/commands"
  ]
}
```

## commandsAliases
A key-value pair of command aliases. This is usually to help you create memorable aliases for the commands that are harder to type or remember.

```json
{
  "commandsAliases": {
    "migrate": "migration:run"
  }
}
```

You can also define multiple aliases by adding multiple entries.

```json
{
  "commandsAliases": {
    "migrate": "migration:run",
    "up": "migration:run"
  }
}
```

## tests

The `tests` object registers the test suites and some of the global settings for the test runner.

```json
{
 "tests": {
    "timeout": 2000,
    "forceExit": false,
    "suites": [
      {
        "name": "functional",
        "files": [
          "tests/functional/**/*.spec.ts"
        ],
        "timeout": 30000
      }
    ]
  }
}
```



- `timeout`: Define the default timeout for all the tests.
- `forceExit`:  Forcefully exit the application process as soon as the tests are complete. Usually, it is good practice to perform a graceful exit.
- `suite.name`: A unique name for the test suite.
- `suite.files`: An array of glob patterns to import the test files.
- `suite.timeout`: The default timeout for all the tests inside the suite.

## providers
An array of service providers to load during the application boot phase.

By default, the providers are loaded in all the environments. However, you can also define an explicit array of environments to import the provider.

- `web` environment refers to the process started for the HTTP server.
- `console` environment refers to the Ace commands except for the `repl` command.
- `repl` environment refers to the process started using the `node ace repl` command.
- Finally, the `test` environment refers to the process started for running the tests.


:::note

Providers are loaded in the same order as registered inside the `providers` array.


:::

```json
{
  "providers": [
    "./providers/app_provider.js",
    "@adonisjs/core/providers/app_provider",
    "@adonisjs/core/providers/http_provider",
    "@adonisjs/core/providers/hash_provider"
  ]
}
```

```json
{
  "providers": [
    {
      "file": "./providers/app_provider.js",
      "environment": [
        "web",
        "console",
        "test"
      ]
    },
    {
      "file": "@adonisjs/core/providers/app_provider"
    },
    {
      "file": "@adonisjs/core/providers/http_provider",
      "environment": [
        "web"
      ]
    },
    {
      "file": "@adonisjs/core/providers/hash_provider"
    }
  ]
}
```

## assetsBundler

The `serve` and `build` command attempts to detect the assets used by your application to compile the frontend assets.

The detection is performed for [vite](https://vitejs.dev) by searching for the `vite.config.js` file and [Webpack encore](https://github.com/symfony/webpack-encore) by searching for the `webpack.config.js` file.

However, if you use a different assets bundler, you can configure it inside the `.adonisrc.json` file as follows.

```json
{
  "assetsBundler": {
    "name": "vite",
    "devServerCommand": "vite",
    "buildCommand": "vite build"
  }
}
```

- `name` - The name of the asset bundler you use. It is required for display purposes.
- `devServerCommand` - The command to start the development server.
- `buildCommand` - The command to run for creating the production build.