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
- Comes with a headless UI KIT.
- Integration with Iconify to render SVG icons.

AdonisJS does not force you to use Edge, and you can pick any other template engine of your choice, be it Pug, Nunjucks, and so on.

## Using Edge
Install Edge from the npm packages registry using one of the following commands.

See also: [Edge documentation](https://edgejs.dev)

:::codegroup

```sh
// title: npm
npm i edge.js@next
```

```sh
// title: yarn
yarn add edge.js@next
```

```sh
// title: pnpm
pnpm add edge.js@next
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

```html
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
AdonisJS adds the following global helpers to Edge. You can access them inside your templates, including components.

### request
Reference the current HTTP [request](./request.md) object.

```edge
{{ request.url() }}
{{ request.input('signature') }}
```

### route/signedRoute
Helper functions to create [URL for a route](./url_builder.md#generating-urls-inside-templates)

```edge
<a href="{{ route('posts.show', [post.id]) }}">
  View post
</a>
```

```edge
<a href="{{
  signedRoute('unsubscribe', [user.id], {
    expiresIn: '3 days',
    prefixUrl: 'https://blog.adonisjs.com'    
  })
}}">
 Unsubscribe
</a>
```

### app
Reference to the [Application instance](../fundamentals/application.md).

```edge
{{ app.getEnvironment() }}
```

### config
A [helper function](../guides/config.md#reading-config-inside-edge-templates) to reference configuration values inside Edge templates.

```edge
@if(config.has('app.appUrl'))
  <a href="{{ config('app.appUrl') }}"> Home </a>
@else
  <a href="/"> Home </a>
@end
```

### session
A read-only copy of the [session object](./session.md#reading-and-writing-data). You cannot mutate session data within Edge templates.

```edge
Post views: {{ session.get(`post.${post.id}.visits`) }}
```

### flashMessages
A read-only copy of [session flash messages](./session.md#flash-messages). You can access the flash messages using the `flashMessages` property or the following helper methods.

```edge
@if(flashMessages.has('errors.title'))
  <p>{{ flashMessages.get('errors.title') }}</p>
@end

@if(flashMessages.has('notification'))
  <div class="notification {{ flashMessages.get('notification').type }}">
    {{ flashMessages.get('notification').message }}
  </div>
@end
```

For a better developer experience, we recommend using the following tags to read data from flash messages.

```edge
@flashMessage('notification')
  <div class="notification {{ message.type }}">
    {{ message.message }}
  </div>
@end

@error('title')
  @each(message in messages)
    <p>{{ message }}</p>
  @end
@end
```

### asset
Resolve the URL of an asset processed by Vite. Learn more about [referencing assets inside Edge templates](./assets_bundling.md#referencing-assets-inside-edge-templates).

```edge
<img src="{{ asset('resources/images/hero.jpg') }}" />
```
