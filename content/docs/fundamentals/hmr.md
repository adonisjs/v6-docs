# Hot Module Reloading

Hot Module Reloading (HMR) refers to the process of reloading JavaScript modules after modification without restarting the entire process. HMR usually results in a faster feedback loop since, after a file change, you do not have to wait for the whole of the process to restart.

The term HMR has been used for many years now in the frontend ecosystem, where tools like Vite can hot-reload modules and apply changes to a webpage while maintaining its existing state.

However, the HMR performed by AdonisJS is a lot simpler and vastly differs from tools like Vite or Webpack. Our goal with HMR is to offer faster reloads, and that's it.

## Key concepts

### No updates are propagated to the browser

Since AdonisJS is a backend framework, we are not in charge of maintaining the state of a frontend application or applying CSS to a web page. Therefore, our HMR integration cannot talk to your frontend app and reconcile its state.

In fact, not every AdonisJS application is a browser-rendered web app. Many use AdonisJS for creating pure JSON APIs, and they can also benefit from our HMR integration.

### Works only with dynamic imports
Most HMR tools use code transformations to inject additional code into the compiled output. At AdonisJS, we are not a big fan of transpilers and always strive to embrace the platform as it is. Therefore, our approach to HMR uses [Node.js loader hooks](https://nodejs.org/api/module.html#customization-hooks) and works only with dynamic imports.

**The good news is that all the critical parts of your AdonisJS application are dynamically imported by default**. For example, Controllers, middleware, and event listeners are all dynamically imported, and hence, you can leverage HMR from today without changing a single line of code in your app.

It is worth mentioning that the imports of a dynamically imported module can be at the top level. For example, a controller (which is dynamically imported in the routes file) can have top-level imports for validators, TSX files, models, and services, and they all benefit from HMR.

## Usage
All official starter kits have been updated to use HMR by default. However, if you have an existing application, you can configure HMR as follows.

Install the [hot-hook](https://github.com/Julien-R44/hot-hook) npm package as a development dependency. The AdonisJS core team has created this package, which can also be used outside of an AdonisJS application.

```sh
npm i -D hot-hook
```

Next, copy-paste the following configuration to the `package.json` file. The `boundaries` property accepts an array of glob patterns that must be considered for HMR.

```json
{
  "hotHook": {
    "boundaries": [
      "./app/controllers/**/*.ts",
      "./app/middleware/*.ts"
    ]
  }
}
```

After the configuration, you can start the development server with the `--hmr` flag.

```sh
node ace serve --hmr
```

Also, you might want to update the `dev` script within the `package.json` file to use this new flag.

```json
{
  "scripts": {
    "dev": "node ace serve --hmr"
  }
}
```

## Full reloads vs HMR

:::note

This section explains the underlying workings of `hot-hook`. Feel free to skip it if you are not in the mood to read extended technical theory 🤓

Or, go through the [README file](https://github.com/Julien-R44/hot-hook) of the package if you want an even deeper explanation.

:::

Let's understand when AdonisJS will perform a complete reload (restarting the process) and when it will hot reload the module.

### Creating a dependency tree
When using the `--hmr` flag, AdonisJS will use `hot-hook` to create a dependency tree of your application starting from the `bin/server.ts` file and will watch all the files that are part of this dependency tree.

It means that if you create a TypeScript file in your application source code but never import it anywhere in your app, this file will not trigger any reload. It will be ignored as if the file does not exist.

### Identifying boundaries
Next, `hot-hook` will use the `boundaries` array from the configuration to identify the files that qualify for HMR. 

As a rule of thumb, you should never register config files, service providers, or preload files as boundaries. This is because these files usually result in some side-effect that will re-occur if we reload them without clearing the side-effects. Here are some examples:

- The `config/database.ts` file establishes a connection with the database. Hot reloading this file means closing the existing connection and re-creating it. The same can be achieved by restarting the entire process without adding any additional complexity.

- The `start/routes.ts` file is used to register the routes. Hot reloading this file means removing existing routes registered with the framework and re-registering them. Again, restarting the process is simple.

In other words, we can say that the modules imported/executed during an HTTP request should be part of HMR boundaries, and modules needed to boot the application should not be.

### Performing reloads
Once `hot-hook` has identified the boundaries, it will perform HMR for dynamically imported modules that are part of the boundary and restart the process for the rest of the files.

