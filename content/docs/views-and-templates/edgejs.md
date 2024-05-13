---
summary: Learn how to use Edge.js for templating in AdonisJS
---

# EdgeJS

Edge is a **simple**, **Modern**, and **batteries included** template engine created and maintained by the AdonisJS core team for Node.js. Edge is similar to writing JavaScript. If you know JavaScript, you know Edge.

:::note
The documentation for Edge is available on [https://edgejs.dev](https://edgejs.dev)
:::

## Installation

Install and configure Edge using the following command.

```sh
node ace add edge
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `edge.js` package using the detected package manager.

2. Registers the following service provider inside the `adonisrc.ts` file.

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
You can use Edge plugins or add global helpers to Edge by creating a [preload file](../concepts/adonisrc_file.md#preloads) inside the `start` directory.

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

Please check the [Edge helpers reference guide](../references/edge.md) to view the list of helpers contributed by AdonisJS.

## Learn more

- [Edge.js documentation](https://edgejs.dev)
- [Components](https://edgejs.dev/docs/components)
- [SVG icons](https://edgejs.dev/docs/edge-iconify)
- [Adocasts Edge Series](https://adocasts.com/topics/edge)
