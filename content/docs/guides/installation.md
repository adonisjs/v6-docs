# Installation

Before creating a new application, you should ensure that you have Node.js and npm installed on your computer. AdonisJS needs `Node.js >= 18`.

You may install Node.js using either the [official installers](https://nodejs.org/en/download/) or [Volta](https://docs.volta.sh/guide/getting-started). Volta is a cross-platform package manager to install and run multiple Node.js versions on your computer.

```sh
// title: Verify Node.js version
node -v
# v18.16.0
```

## Creating a new application

You may create a new project using [npm init](https://docs.npmjs.com/cli/v7/commands/npm-init), [yarn create](https://classic.yarnpkg.com/en/docs/cli/create) or [pnpm create](https://pnpm.io/tr/next/cli/create). These commands will download the [create-adonisjs](http://npmjs.com/create-adonisjs) initializer package and begin the installation process.

During installation, you must select a [starter kit](#starter-kits) for the initial project structure. Optionally, you may also [configure ESLint and Prettier](#configuring-the-development-environment)

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

### Web starter kit :span[Not ready yet]{class="badge"}

The Web starter kit is tailored for creating traditional server renderer web apps. Do not let the keyword **"traditional"** discourage you. We recommend this starter kit if you make a web app with limited frontend interactivity.

The simplicity of rendering HTML on the server using [Edge.js](https://edge.adonisjs.com) will boost your productivity as you do not have to deal with complex build systems to render some HTML.

Later, you can use [Hotwire](https://hotwired.dev), [HTMX](http://htmx.org), or [Unpoly](http://unpoly.com) to make your applications navigate like a SPA and use [Alpine.js](http://alpinejs.dev) to create interactive widgets like a dropdown or a modal.

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

### API starter kit :span[Not ready yet]{class="badge"}

The API starter kit is tailored for creating JSON API servers. It is a trimmed-down version of the `web` starter kit. If you plan to build your frontend app using React or Vue, you may create your AdonisJS backend using the API starter kit.

In this starter kit:

- We remove support for serving static files.
- Do not configure the views layer and vite.
- Turn off XSS and CSRF protection, and enable CORS protection.
- Use the ContentNegotiation middleware to send HTTP responses in JSON.

The API starter kit is configured with session-based authentication. However, if you wish to use tokens-based authentication, you can use the `--tokens-auth` flag.

```sh
npm init adonisjs -- --tokens-auth
```

### Slim starter kits
For minimalists, we have created a `slim` starter kit. It comes with just the core of the framework and the default folder structure. You may use it when you do not want any bells and whistles of AdonisJS.

### Bring your starter kits
Starter kits are pre-built projects hosted with a Git repository provider like Github, Bitbucket, or Gitlab. You can also create your starter kits and download them as follows.

```sh
npm init adonisjs -- -K="github_user/repo"

# Download from GitLab
npm init adonisjs -- -K="gitlab:user/repo"

# Download from BitBucket
npm init adonisjs -- -K="bitbucket:user/repo"
```

You can download private repos using Git+SSH authentication using the `git` mode.

```sh
npm init adonisjs -- -K="user/repo" --mode=git
```

Finally, you can specify a tag, branch, or commit.

```sh
# Branch
npm init adonisjs -- -K="user/repo#develop"

# Tag
npm init adonisjs -- -K="user/repo#v2.1.0"
```

## Starting the development server
You may start the development server by running the `node ace serve` command.

Ace is a command line framework bundled inside the framework's core. The `--watch` flag monitors the file system and restarts the development server on file change.

```sh
node ace serve --watch
```

Once the development server runs, you may visit [http://localhost:3333](http://localhost:3333) to view your application in a browser.

## Building for production

Since AdonisJS applications are written in TypeScript, they must get compiled to JavaScript before running in production.

You may create the JavaScript output using the `node ace build` command. The JavaScript output is written to the `build` directory. 

When Vite is configured, this command also compiles the frontend assets using Vite and writes the output to the `build/public` folder.

See also: [TypeScript build process](../fundamentals/typescript_build_process.md).

```sh
node ace build --production
```

## Configuring the development environment

While AdonisJS takes care of building the end-user applications, you might need additional tools to enjoy the development process and have consistency in your coding style. 

We strongly recommend you to **use [ESLint](https://eslint.org/)** to lint your code **and [Prettier](https://prettier.io)** to re-format your code for consistency.

During the installation process, AdonisJS will prompt you to configure both ESLint and Prettier. We will set up these tools and their related dependencies if you accept the prompt.

The default configuration uses opinionated presets from the AdonisJS core team. You can learn more about them in the [Tooling config](../fundamentals/tooling_config.md) section of the docs.

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

### AdonisJS Extension
You can download the [AdonisJS extension](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension) from the VSCode marketplace. Following are some of the highlighted features of the extension.

- Syntax highlighting, autocomplete, and jump to file support for Edge templates.
- Run [Ace](../ace/introduction.md) commands from the VSCode activity bar.
- View application routes in the sidebar.
- And some snippets.

### Japa Extension
Japa is the [testing framework](../testing/introduction.md) used by AdonisJS, and the [Japa extension](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode) allows you to run your tests without leaving your code editor.

- You can click on the code lens to run a specific or all the tests inside a file. The same action can be triggered using keyboard shortcuts.
- Go to the snapshots file from the test (If using snapshot testing).
- And some snippets.
