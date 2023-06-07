# Installation

Before creating a new application, you should ensure that you have Node.js and npm installed on your computer. AdonisJS needs `Node.js >= 18`.

You may install Node.js using either the [official installers](https://nodejs.org/en/download/) or [Volta](https://docs.volta.sh/guide/getting-started). Volta is a cross-platform package manager to install and run multiple Node.js versions on your computer.

```sh
// title: Verify Node.js version
node -v
# v18.12.0
```


## Creating a new application

You may create a new project using [npm init](https://docs.npmjs.com/cli/v7/commands/npm-init), [yarn create](https://classic.yarnpkg.com/en/docs/cli/create) or [pnpm create](https://pnpm.io/tr/next/cli/create). These commands will download the [create-adonisjs](http://npmjs.com/create-adonisjs) initializer package and begins the installation process.

During installation, you will have to select a [starter kit](#starter-kits) for the initial project structure. Optionally, you may also [configure ESLint and Prettier](#configuring-the-development-environment)

:::codegroup

```sh
// title: npm
npm init adonisjs@latest hello-world
```

```sh
// title: yarn
yarn create adonisjs@latest hello-world
```

```sh
// title: pnpm
pnpm create adonisjs@latest hello-world
```


:::

## Starter kits

Starter kits serve as a starting point for creating applications using AdonisJS. They come with an [opinionated folder structure](./folder_structure.md), pre-configured AdonisJS packages, and the necessary tooling you need during development.


:::note

The official starter kits use ES modules and TypeScript. This combination allows you to use modern JavaScript constructs and leverage static-type safety.


:::

### Web starter kit

The Web starter kit is tailored for creating traditional server renderer web apps. Do not let the keyword **"traditional"** discourage you. We recommend this starter kit if you are creating a web app with limited frontend interactivity.

The simplicity of rendering HTML on the server using [Edge.js]() will sky rocket your productivity as you do not have to deal with complex build systems just to render some HTML.

Later, you can use [Hotwire](https://hotwired.dev), [HTMX](http://htmx.org), or [Unpoly](http://unpoly.com) to make your applications navigate like an SPA and use [Alpine.js](http://alpinejs.dev) to create interactive widgets like a dropdown or a modal.

The web starter kit comes with the following packages.

<table>
<thead>
<tr>
<th width="180px">Package</th>
<th>Description</th>
</tr>
</thead>
<tbody><tr>
<td><code>@adonisjs/core</code></td>
<td>The framework&#39;s core has the baseline features you might reach for when creating backend applications.</td>
</tr>
<tr>
<td><code>@adonisjs/view</code></td>
<td>The view layer uses the <a href="https://edge.adonisjs.com">edge</a> template engine for composing HTML pages.</td>
</tr>
<tr>
<td><code>@adonisjs/lucid</code></td>
<td>Lucid is a SQL ORM maintained by the AdonisJS core team.</td>
</tr>
<tr>
<td><code>@adonisjs/auth</code></td>
<td>The authentication layer of the framework. It is configured to use sessions.</td>
</tr>
<tr>
<td><code>@adonisjs/shield</code></td>
<td>A set of security primitives to keep your web apps safe from attacks like <strong>CSRF</strong> and <strong>‌ XSS</strong>.</td>
</tr>
<tr>
<td><code>vite</code></td>
<td><a href="https://vitejs.dev/">Vite</a> is used for compiling the frontend assets.</td>
</tr>
</tbody></table>

You can drop specific packages using the following command-line flags.

```sh
npm init adonisjs -- --no-auth --no-orm --no-assets
```

- `--no-auth`: Removes the `@adonisjs/auth` package along with its config files.
- `--no-orm`: Removes both the `@adonisjs/lucid` and the `@adonisjs/auth` package. The authentication layer needs the ORM to find users.
- `--no-assets`: Removes the Vite assets bundler.

### API starter kit

The API starter kit is tailored for creating JSON API servers. It is a trimmed-down version of the `web` starter kit. If you plan to build your frontend app using React or Vue, you may create your AdonisJS backend using the API starter kit 

In this starter kit:

- We remove support for serving static files.
- Do not configure the views layer and vite.
- Turn off XSS and CSRF protection, and enable CORS protection.
- Use the [ContentNegotiation]() middleware to send HTTP responses in JSON.

The API starter kit is configured with session-based authentication. However, if you wish to use tokens-based authentication, you can use the `--tokens-auth` flag.

```sh
npm init adonisjs -- --tokens-auth
```

## Starting the dev server

You may start the development server by running the `node ace serve` command.

Ace is a command line framework bundled inside the framework's core. The `--watch` flag monitors the file system and restarts the development server on file change.

```sh
node ace serve --watch
```

Once the development server is running, you may visit [http://localhost:3333](http://localhost:3333) to view your application in a browser.

## Building for production

Since AdonisJS applications are written in TypeScript, they must get compiled to JavaScript before running in production.

You may create the JavaScript output using the `node ace build` command. The JavaScript output is written to the `build` directory. 

When Vite is configured, this command also compiles the frontend assets using Vite and writes the output to the `build/public` folder.

```sh
node ace build --production
```

See also: [TypeScript build process](../fundamentals/typescript_build_process.md) and the [Deployment guides](../deployment/digital_ocean.md).

## Configuring the development environment

While AdonisJS takes care of building the end-user applications, you might need additional tools to enjoy the development process and have consistency in your coding style.

Following are some of the recommendations for you.

### ESLint

When creating a new application, you will be prompted to configure [ESLint](https://eslint.org/). If you accept the prompt, we will define an [opinionated set](https://github.com/adonisjs-community/eslint-plugin-adonis/blob/develop/lib/ts-app.json) of ESLint rules inside the `package.json` file.

### Prettier

Next, you will be prompted to configure [prettier](https://prettier.io). We will define the prettier rules inside the `package.json` file if you accept the prompt.

You can format source files using the `npm run format` command or configure your code editor with the prettier extension. 

### AdonisJS VSCode extension

If you are a VSCode user, we recommend installing the official [VSCode extension](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension) to supercharge your development environment. 

### Japa VSCode extension

Japa is the testing framework used by AdonisJS. The [Japa VSCode extension](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode) allows you to run tests within VSCode either using keyboard shortcuts or code lenses.
