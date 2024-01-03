# Views and Templates

AdonisJS is an excellent fit for creating traditional server-rendered applications in Node.js. If you enjoy the simplicity of using a backend template engine that outputs HTML without any overhead of Virtual DOM and build tools, then this guide is for you.

The typical workflow of a server-rendered application in AdonisJS looks as follows.

- Choose a template engine to render HTML dynamically.
- Use [Vite](./assets_bundling.md) for bundling CSS and frontend JavaScript.
- Optionally, you can opt for libraries like [HTMX](https://htmx.org/) or [Unpoly](https://unpoly.com/) to progressively enhance your application navigate like an SPA.

## Choosing a template engine
The AdonisJS core team has created a framework-agnostic template engine called [Edge.js](https://edgejs.dev). Following are some of the reasons for using Edge.

- Edge is simple, modern, and a batteries-included template engine in the Node.js ecosystem.
- It has support for Components with features like slots and context API.
- Integration with Iconify to render SVG icons.

AdonisJS does not force you to use Edge, and you can pick any other template engine of your choice, be it Pug, Nunjucks, and so on.

## Using Edge
Install Edge from the npm packages registry using one of the following commands.

See also: [Edge documentation](https://edgejs.dev)

:::codegroup

```sh
// title: npm
npm i edge.js
```

```sh
// title: yarn
yarn add edge.js
```

```sh
// title: pnpm
pnpm add edge.js
```

:::

Once done, you must run the following command to configure Edge within an AdonisJS application. 

```sh
node ace configure edge
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider inside the `adonisrc.ts` file.

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/core/providers/edge_provider')
      ]
    }
    ```

:::

## Rendering your first template
Once the configuration is completed, you can use Edge to render templates. Let's create a `welcome.edge` file inside the `resources/views` directory.

```sh
node ace make:view welcome
```

Open the newly created file and write the following markup inside it.

```edge
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <h1>
    Hello world from {{ request.url() }} endpoint
  </h1>
</body>
</html>
```

Finally, let's register a route to render the template.

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ view }) => {
  return view.render('welcome')
})
```

You can also use the `router.on.render` method to render a template without assigning a callback to the route.

```ts
router.on('/').render('welcome')
```

## Configuring Edge
You can use Edge plugins or add global helpers to Edge by creating a [preload file](../fundamentals/adonisrc_file.md#preloads) inside the `start` directory.

```sh
node ace make:preload view
```

```ts
// title: start/view.ts
import edge from 'edge.js'
import env from '#start/env'
import { edgeIconify } from 'edge-iconify'

/**
 * Register a plugin
 */
edge.use(edgeIconify)

/**
 * Define a global property
 */
edge.global('appUrl', env.get('APP_URL'))
```

## Global helpers
Please check the [Edge helpers reference guide](../reference/edge.md) to view the list of helpers contributed by AdonisJS.
