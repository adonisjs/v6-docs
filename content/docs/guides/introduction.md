# Introduction

## What is AdonisJS?

AdonisJS is a TypeScript-first web framework for Node.js. You can use it to create a full-stack web application or a JSON API server.

At the fundamental level, AdonisJS [provides structure to your applications](./folder_structure.md), configures a [seamless TypeScript development environment](../fundamentals/typescript_build_process.md), and offers a vast collection of well-maintained and extensively documented packages.

We envision teams using AdonisJS **spending less time** on trivial decisions like cherry-picking npm packages for every minor feature, writing glue code, debating for the perfect folder structure, and **spending more time** delivering real-world features critical for the business needs.

### Frontend agnostic 

AdonisJS focuses on the backend and lets you choose the frontend stack of your choice.

If you like to keep things simple, pair AdonisJS with a [traditional template engine](../http/views_and_templates.md) to generate static HTML on the server. Or create a JSON API for your frontend Vue/React application.

AdonisJS aims to provide you with batteries to create a robust backend application from scratch. Be it sending emails, validating user input, performing CRUD operations, or authenticating users. We take care of it all.

### Modern and Type-safe

AdonisJS is built on top of modern JavaScript primitives. We use ES modules, Node.js sub-path import aliases, SWC for executing TypeScript source, and Vite for assets bundling.


Also, TypeScript plays a considerable role when designing the framework's APIs. For example, AdonisJS has:

- [Type-safe event emitter](../digging_deeper/emitter.md#making-events-type-safe)
- [Type-safe environment variables](./env.md)
- [Type-safe validation library](../http/validation.md)

### Embracing MVC

AdonisJS embraces the classic MVC design pattern. You start by defining the routes using the functional JavaScript API, bind controllers to them and write logic to handle the HTTP requests within the controllers.

```ts
import router from '@adonisjs/core/services/router'
import PostsController from '#controllers/posts_controller'

router.get('posts', [PostsController, 'index'])
```

Controllers can use models to fetch data from the database and render a view (aka template) as a response.

```ts
import { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.all()
    return view.render('pages/posts/list', { posts })
  }
}
```

If you are building an API server, you can replace the view layer with a JSON response. But, the flow of handling and responding to the HTTP requests remains the same.

```ts
import { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.all()
    // delete-start
    return view.render('pages/posts/list', { posts })
    // delete-end
    // insert-start
    /**
     * Posts array will be serialized to JSON
     * automatically.
     */
    return posts
    // insert-end
  }
}
```

## Guides assumptions

The AdonisJS documentation is written as a reference guide, covering the usage and the API of several packages and modules maintained by the core team.

**The guide does not teach you how to build an application from scratch**. If you are looking for a tutorial, we recommend starting your journey with [Adocasts](https://adocasts.com/). Tom (the creator of Adocasts) has created some highly quality screencasts, helping you to take the first steps with AdonisJS.

With that said, the documentation extensively covers the usage of available modules and the inner workings of the framework.

## VSCode extensions
You can develop an AdonisJS application on any code editor supporting TypeScript. However, we have developed several extensions for VSCode to enhance the development experience further.

- [**AdonisJS**](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension) - View application routes, run ace commands, migrate the database, and read documentation directly from your code editor.

- [**Edge**](https://marketplace.visualstudio.com/items?itemName=AdonisJS.vscode-edge) - Supercharge your development workflow with support for syntax highlighting, autocompletion, and code snippets.

- [**Japa**](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode) - Run tests without leaving your code editor using Keyboard shortcuts or run them directly from the activity sidebar.

## Community and Help

- [**Discord server**](https://discord.gg/vDcEjq6) - Hangout with fellow developers.

- [**X (Formerly Twitter)**](https://twitter.com/adonisframework) - Stay upto-date with framework announcements.

- [**GitHub discussions**](https://github.com/adonisjs/core/discussions) - Browse existing topics and ask for help.

- [**Priority Support**](https://adonisjs.com/support_program) - Get priority support and a direct line of contact with the framework creator.

## Recent releases
Following is the list of recent releases. [Click here](./releases.md) to view all the releases.

::include{template="partials/recent_releases"}

## Sponsors

::include{template="partials/sponsors"}
