# TypeScript build process

Applications written in TypeScript must be compiled into JavaScript before you can run them in production.

Compiling TypeScript source files can be performed using many different build tools. However, with AdonisJS, we stick to the most straightforward approach and use the following time-tested tools.


:::note

All the below-mentioned tools come pre-installed as development dependencies with official starter kits.


:::


- **[TSC](https://www.typescriptlang.org/docs/handbook/compiler-options.html)** is the TypeScript's official compiler. We use TSC to perform type-checking and create the production build.

- **[TS Node](https://typestrong.org/ts-node/)** is a Just-in-Time compiler for TypeScript. It allows you to execute TypeScript files without compiling them to JavaScript and proves to be a great tool for development.

- **[SWC](https://swc.rs/)** is a TypeScript compiler written in Rust. We use it during development with TS Node to make the JIT process extremely fast.

| Tool | Used for | Type checking |
|------|---------|------------|
| `TSC` | Creating production build | Yes |
| `TS Node` | Development | No |
| `SWC` | Development | No |

## Executing TypeScript files without compilation

You may execute the TypeScript files without compiling them using the `ts-node/esm` loader. For example, you may start the HTTP server by running the following command.

```sh
node --loader="ts-node/esm" bin/server.js
```

- `--loader`: The loader flag registers the module loader hooks with the ES module system. Loader hooks are part of the [Node.js API](https://nodejs.org/dist/latest-v21.x/docs/api/esm.html#loaders).

- `ts-node/esm`: The path to the `ts-node/esm` script that registers lifecycle hooks to perform Just-in-Time compilation of TypeScript source to JavaScript.

- `bin/server.js`: The path to the AdonisJS HTTP server entry point file. **See also: [A note on file extensions](#a-note-on-file-extensions)**

You may repeat this process for other TypeScript files as well. For example:

```sh
// title: Run tests
node --loader ts-node/esm bin/test.js
```


```sh
// title: Run ace commands
node --loader ts-node/esm bin/console.js
```

```sh
// title: Run some other TypeScript file
node --loader ts-node/esm path/to/file.js
```

### A note on file extensions

You might have noticed us using the `.js` file extension everywhere, even though the file on disk is saved with the `.ts` file extension.

This is because, with ES modules, TypeScript forces you to use the `.js` extension in imports and when running scripts. You can learn about the thesis behind this choice in [TypeScript documentation](https://www.typescriptlang.org/docs/handbook/modules/theory.html#typescript-imitates-the-hosts-module-resolution-but-with-types).

## Running the development server
Instead of running the `bin/server.js` file directly, we recommend using the `serve` command for the following reasons.

- The command includes a file watcher and restarts the development server on file change.
- The `serve` command detects the frontend assets bundler your app is using and starts its development server. For example, If you have a `vite.config.js` file in your project root, the `serve` command will start the `vite` dev server.

```sh
node ace serve --watch
```

You may pass arguments to the Vite dev server using the `--assets-args` command line flag.

```sh
node ace serve --watch --assets-args="--debug --base=/public"
```

You may use the `--no-assets` flag to disable the Vite dev server.

```sh
node ace serve --watch --no-assets
```

### Passing options to the Node.js commandline
The `serve` command starts the development server `(bin/server.ts file)` as a child process. If you want to pass [node arguments](https://nodejs.org/api/cli.html#options) to the child process, you can define them before the command name.

```sh
node ace --no-warnings --inspect serve --watch
```

## Creating production build

The production build of your AdonisJS application is created using the `node ace build` command. The `build` command performs the following operations to create a [**standalone JavaScript application**](#what-is-a-standalone-build) inside the `./build` directory.

- Remove the existing `./build` folder (if any).
- Rewrite the `ace.js` file **from scratch** to remove the `ts-node/esm` loader. 
- Compile frontend assets using Vite (if configured).
- Compile TypeScript source code to JavaScript using [`tsc`](https://www.typescriptlang.org/docs/handbook/compiler-options.html).
- Copy non-TypeScript files registered under the [`metaFiles`](./adonisrc_file.md#metafiles) array to the `./build` folder.
- Copy the `package.json` and `package-lock.json/yarn.lock` files to the `./build` folder.

:::warning
Any modifications made to the `ace.js` file will be lost during the build process since the file is rewritten from scratch. If you want to have any additional code that runs before Ace starts, you should instead do it inside the `bin/console.ts` file.
:::

And that is all!

```sh
node ace build
```

Once the build has been created, you can `cd` into the `build` folder, install production dependencies, and run your application.

```sh
cd build

# Install production dependencies
npm i --omit=dev

# Run server
node bin/server.js
```

You may pass arguments to the Vite build command using the `--assets-args` command line flag.

```sh
node ace build --assets-args="--debug --base=/public"
```

You may use the `--no-assets` flag to avoid compiling the frontend assets.

```sh
node ace build --no-assets
```

### What is a standalone build?

Standalone build refers to the JavaScript output of your application that you can run without the original TypeScript source. 

Creating a standalone build helps reduce the size of the code you deploy on your production server, as you do not have to copy both the source files and the JavaScript output.

After creating the production build, you can copy the `./build` to your production server, install dependencies, define environment variables, and run the application.
