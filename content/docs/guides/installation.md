# Installation

Before creating a new application, you should ensure that you have Node.js and npm installed on your computer. AdonisJS needs `Node.js >= 20.6`.

You may install Node.js using either the [official installers](https://nodejs.org/en/download/) or [Volta](https://docs.volta.sh/guide/getting-started). Volta is a cross-platform package manager that installs and runs multiple Node.js versions on your computer.

```sh
// title: Verify Node.js version
node -v
# v21.0.0
```

## Creating a new application

You may create a new project using [npm init](https://docs.npmjs.com/cli/v7/commands/npm-init), [yarn create](https://classic.yarnpkg.com/en/docs/cli/create) or [pnpm create](https://pnpm.io/tr/next/cli/create). These commands will download the [create-adonisjs](http://npmjs.com/create-adonisjs) initializer package and begin the installation process.

You may customize the initial project output using one of the following CLI flags.

- `--kit`: Select the [starter kit](#starter-kits) for the project. You can choose between **web**, **api**, or **slim**.

- `--db`: Specify the database dialect of your choice. You can choose between **sqlite**, **postgres**, **mysql**, or **mssql**. Defaults to `sqlite`.

- `--git-init`: Initiate the git repository. Defaults to `false`.

- `--auth-guard`: Specify the authentication guard of your choice. You can choose between **session**, **access_tokens**, or **basic_auth**. Defaults to `session`.

- `--install`: Skip the prompt to install dependencies. Use the `--no-install` flag to create a project without installing any dependencies.

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

When passing CLI flags using the `npm init` command, make sure to use [double slash twice](https://stackoverflow.com/questions/43046885/what-does-do-when-running-an-npm-command). Otherwise, `npm init` will not pass the flags to the `create-adonisjs` initializer package. For example:

```sh
# Create a project with MYSQL
npm init adonisjs@latest hello-world -- --db=mysql

# Create a project with PostgreSQL and API starter kit
npm init adonisjs@latest hello-world -- --db=postgres --kit=api

# Create a project with API starter kit and access tokens guard
npm init adonisjs@latest hello-world -- --kit=api --auth-guard=access_tokens
```

## Starter kits

Starter kits serve as a starting point for creating applications using AdonisJS. They come with an [opinionated folder structure](./folder_structure.md), pre-configured AdonisJS packages, and the necessary tooling you need during development.


:::note

The official starter kits use ES modules and TypeScript. This combination allows you to use modern JavaScript constructs and leverage static-type safety.

:::

### Web starter kit

The Web starter kit is tailored for creating traditional server renderer web apps. Do not let the keyword **"traditional"** discourage you. We recommend this starter kit if you make a web app with limited frontend interactivity.

The simplicity of rendering HTML on the server using [Edge.js](https://edgejs.dev) will boost your productivity as you do not have to deal with complex build systems to render some HTML.

Later, you can use [Hotwire](https://hotwired.dev), [HTMX](http://htmx.org), or [Unpoly](http://unpoly.com) to make your applications navigate like a SPA and use [Alpine.js](http://alpinejs.dev) to create interactive widgets like a dropdown or a modal.

```sh
npm init adonisjs@latest -- -K=web

# Switch database dialect
npm init adonisjs@latest -- -K=web --db=mysql
```

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
<td><code>edge.js</code></td>
<td>The <a href="https://edgejs.dev">edge</a> template engine for composing HTML pages.</td>
</tr>
<tr>
<td><code>@vinejs/vine</code></td>
<td><a href="https://vinejs.dev">VineJS</a> is one of the fastest validation libraries in the Node.js ecosystem.</td>
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
<td><code>@adonisjs/static</code></td>
<td>Middleware to serve static assets from the <code>/public</code> directory of your application.</td>
</tr>
<tr>
<td><code>vite</code></td>
<td><a href="https://vitejs.dev/">Vite</a> is used for compiling the frontend assets.</td>
</tr>
</tbody></table>

---

### API starter kit

The API starter kit is tailored for creating JSON API servers. It is a trimmed-down version of the `web` starter kit. If you plan to build your frontend app using React or Vue, you may create your AdonisJS backend using the API starter kit.

```sh
npm init adonisjs@latest -- -K=api

# Switch database dialect
npm init adonisjs@latest -- -K=api --db=mysql
```

In this starter kit:

- We remove support for serving static files.
- Do not configure the views layer and vite.
- Turn off XSS and CSRF protection and enable CORS protection.
- Use the ContentNegotiation middleware to send HTTP responses in JSON.

The API starter kit is configured with session-based authentication. However, if you wish to use tokens-based authentication, you can use the `--auth-guard` flag.

See also: [Which authentication guard should I use?](../auth/introduction.md#choosing-an-auth-guard)

```sh
npm init adonisjs@latest -- -K=api --auth-guard=access_tokens
```

---

### Slim starter kit
For minimalists, we have created a `slim` starter kit. It comes with just the core of the framework and the default folder structure. You may use it when you do not want any bells and whistles of AdonisJS.

```sh
npm init adonisjs@latest -- -K=slim

# Switch database dialect
npm init adonisjs@latest -- -K=slim --db=mysql
```

### Inertia Starter kit

:::warning

This starter kit uses experimental features. Please use it knowing that some minor breaking changes may occur.

:::


[Inertia.js](https://inertiajs.com/) is a way to build server-driven single-page applications. You can use your favorite frontend framework ( React, Vue, Solid, Svelte ) to build the frontend of your application.

You can use the `--adapter` flag to choose the frontend framework you want to use. The available options are `react`, `vue`, `solid`, and `svelte`.

You can also use the `--ssr` and `--no-ssr` flags to turn server-side rendering on or off.

```sh
# React with server-side rendering
npm init adonisjs@latest -- -K=inertia --adapter=react --ssr

# Vue without server-side rendering
npm init adonisjs@latest -- -K=inertia --adapter=vue --no-ssr
```

---

### Bring your starter kit
Starter kits are pre-built projects hosted with a Git repository provider like GitHub, Bitbucket, or Gitlab. You can also create your starter kits and download them as follows.

```sh
npm init adonisjs@latest -- -K="github_user/repo"

# Download from GitLab
npm init adonisjs@latest -- -K="gitlab:user/repo"

# Download from BitBucket
npm init adonisjs@latest -- -K="bitbucket:user/repo"
```

You can download private repos using Git+SSH authentication using the `git` mode.

```sh
npm init adonisjs@latest -- -K="user/repo" --mode=git
```

Finally, you can specify a tag, branch, or commit.

```sh
# Branch
npm init adonisjs@latest -- -K="user/repo#develop"

# Tag
npm init adonisjs@latest -- -K="user/repo#v2.1.0"
```

## Starting the development server
Once you have created an AdonisJS application, you may start the development server by running the `node ace serve` command.

Ace is a command line framework bundled inside the framework's core. The `--watch` flag monitors the file system and restarts the development server on file change.

```sh
node ace serve --watch
```

Once the development server runs, you may visit [http://localhost:3333](http://localhost:3333) to view your application in a browser.

## Building for production

Since AdonisJS applications are written in TypeScript, they must be compiled into JavaScript before running in production.

You may create the JavaScript output using the `node ace build` command. The JavaScript output is written to the `build` directory.

When Vite is configured, this command also compiles the frontend assets using Vite and writes the output to the `build/public` folder.

See also: [TypeScript build process](../fundamentals/typescript_build_process.md).

```sh
node ace build
```

## Configuring the development environment

While AdonisJS takes care of building the end-user applications, you may need additional tools to enjoy the development process and have consistency in your coding style.

We strongly recommend you use **[ESLint](https://eslint.org/)** to lint your code and use **[Prettier](https://prettier.io)** to re-format your code for consistency.

The official starter kits come pre-configured with both ESLint and Prettier and use the opinionated presets from the AdonisJS core team. You can learn more about them in the [Tooling config](../fundamentals/tooling_config.md) section of the docs.

Finally, we recommend you install ESLint and Prettier plugins for your code editor so that you have a tighter feedback loop during the application development. Also, you can use the following commands to `lint` and `format` your code from the command line.

```sh
# Runs ESLint
npm run lint

# Run ESLint and auto-fix issues
npm run lint -- --fix

# Runs prettier
npm run format
```

## VSCode extensions
You can develop an AdonisJS application on any code editor supporting TypeScript. However, we have developed several extensions for VSCode to enhance the development experience further.

- [**AdonisJS**](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension) - View application routes, run ace commands, migrate the database, and read documentation directly from your code editor.

- [**Edge**](https://marketplace.visualstudio.com/items?itemName=AdonisJS.vscode-edge) - Supercharge your development workflow with support for syntax highlighting, autocompletion, and code snippets.

- [**Japa**](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode) - Run tests without leaving your code editor using Keyboard shortcuts or run them directly from the activity sidebar.
