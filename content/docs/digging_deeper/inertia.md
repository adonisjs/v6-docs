---
summary: How to use Inertia.JS with AdonisJS
---

# Inertia.js

[Inertia.js](https://inertiajs.com/) is a framework agnostic way to create single page applications without a lot of the complexity that comes with modern SPAs.

This is a great middle ground between traditional server rendered applications (with templating engines) and modern SPAs (with client side routing and state management).

Using Inertia.js will allow you to create a SPA with your favorite frontend framework (Vue.js, React, Svelte or Solid.js), without having to create a separate API. Best of both worlds.

:::codegroup

```ts
// title: app/controllers/users_controller.ts
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  public async index({ inertia }: HttpContext) {
    const users = await User.all()

    return inertia.render('users/index', { users })
  }
}
```


```vue
// title: resources/pages/users/index.vue
<script setup lang="ts">
import { Link, Head } from '@inertiajs/vue3'

defineProps<{
  users: SerializedUser[]
}>()
</script>

<template>
  <Head title="Users" />

  <div v-for="user in users" :key="user.id">
    <Link :href="`/users/${user.id}`">
      {{ user.name }}
    </Link>
    <div>{{ user.email }}</div>
  </div>
</template>
```

:::


## Installation

:::note
Starting a new project and want to use Inertia.js? Check out the [Inertia starter kit](https://docs.adonisjs.com/guides/installation#starter-kits).
:::

Install the package from the npm registry using one of the following commands.

:::codegroup

```sh
// title: npm
npm i @adonisjs/inertia
```

```sh
// title: pnpm
pnpm add @adonisjs/inertia
```

```sh
// title: yarn
yarn add @adonisjs/inertia
```

:::

Once done, make sure to run the following command to configure the package.

```sh
node ace configure @adonisjs/inertia
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider and command inside the `adonisrc.ts` file.

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/inertia/inertia_provider')
      ]
    }
    ```
2. Registers the following middleware inside the `start/kernel.ts` file 

   ```ts
   router.use([() => import('@adonisjs/inertia/inertia_middleware')])
   ```

3. Create the `config/inertia.ts` file.

4. Copy a few stubs into your application to help you get started quickly. Each copied file is adapted to the frontend framework previously selected.

  1. Create a `./resources/views/root.edge` file that will render the HTML page for your SPA.

  2. Create a `./resources/css/app.css` file with the content needed to style the previous `root.edge` view.

  3. Create a `./resources/tsconfig.json` file needed to differentiate between the server and client side code.

  4. Create a `./resources/app.ts` for bootstraping Inertia and your frontend framework.

  5. Create a `./resources/pages/home.{tsx|vue|svelte}` file to render the home page of your application.

  5. Add the correct vite plugin needed to compile your frontend framework in the `vite.config.ts` file.

  6. Add a dumb route `/inertia` in your `start/routes.ts` file to render the home page with Inertia
 
5. Install packages based upon the selected frontend framework.

:::

Once done, you should be ready to use Inertia.js in your AdonisJS application. Start your development server and visit the `/inertia` route to see the home page rendered using Inertia.js and your selected frontend framework.

## Rendering pages

:::note
**Make sure to read the [Inertia.js official documentation](https://inertiajs.com/)**.

Inertia.js is a backend agnostic library. We just created an adapter to make it work with AdonisJS. So you should be familiar with the Inertia.js concepts before reading this documentation.

**We are only going to cover the AdonisJS specific parts in this documentation.**
:::

While configuring your package, a `inertia_middleware` has been registered inside the `start/kernel.ts` file. This middleware is responsible for setting up the `inertia` object on the [`HttpContext`](../http/http_context.md). This is the only thing used for interacting with Inertia.js and rendering views.

To render a view using Inertia.js, you must use the `inertia.render` method. The method accepts the view name and the data to be passed to the component as props.

```ts
// title: app/controllers/home_controller.ts
export default class HomeController {
  public async index({ inertia }: HttpContext) {
    // highlight-start
    return inertia.render('home', { user: { name: 'julien' } })
    // highlight-end
  }
}
```

See the `home` passed to the `inertia.render` method? This should be the path to the component file relative to the `resources/pages` directory. That means, here we are rendering the `resources/pages/home.(vue,tsx)` file.

You frontend component will receive the `user` object as a prop : 

:::codegroup

```vue
// title: Vue
<script setup lang="ts">
defineProps<{
  user: { name: string }
}>()
</script>

<template>
  <p>Hello {{ user.name }}</p>
</template>
```

```tsx
// title: React
export default function Home(props: { user: { name: string } }) {
  return <p>Hello {props.user.name}</p>
}
```

```svelte
// title: Svelte
<script lang="ts">
export let user: { name: string }
</script>

<Layout>
  <p>Hello {user.name}</p>
</Layout>
```

```jsx
// title: Solid
export default function Home(props: { user: { name: string } }) {
  return <p>Hello {props.user.name}</p>
}
```

:::

As simple as that.

:::warning
While passing data to the frontend, everything is serialized to JSON. Do not expect to pass instance of models, dates or other complex objects. 
:::

### Root Edge template

The Root template is a regular Edge template that will be loaded on the first page visit of your application. This is the place where you should include your CSS and Javascript files, and also where you should include the `@inertia` tag. A typical root template looks like this :

```edge
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @vite(['resources/app.ts'])
</head>

<body>
  @inertia()
</body>

</html>
```

It may differ depending on the frontend framework you are using. ( [`@viteReactRefresh`](https://docs.adonisjs.com/guides/edge-reference#vitereactrefresh) may be needed, `app.ts` may be `app.tsx`, etc. )

You can configure the root template path in the `config/inertia.ts` file. By default, it assumes that your template is located at `resources/views/root.edge`.

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  // The path to the root template relative 
  // to the `resources/views` directory
  rootView: 'app_root', 
})
```

### Root template data

Sometimes you may want to share data with your root Edge template. For example, for adding a meta title, or open graph tags. You can do so by using the 3rd argument of the `inertia.render` method :

```ts
// title: app/controllers/posts_controller.ts
export default class PostsController {
  public async index({ inertia }: HttpContext) {
    return inertia.render('posts/details', post, {
      // highlight-start
      title: post.title,
      description: post.description
      // highlight-end
    })
  }
}
```

The `title` and `description` will now be available to the root Edge template : 

```edge
// title: resources/views/root.edge
<html>
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">

  <body>
    @inertia()
  </body>
</html
```

## Redirects

See the [official documentation](https://inertiajs.com/redirects) for more information.

This is how you should do it in AdonisJS : 

```ts
export default class UsersController {
  async store({ inertia, response }: HttpContext) {
    await User.create(request.body())

    // 👇 You can use standard AdonisJS redirections
    return response.redirect().toRoute('users.index')
  }

  async externalRedirect({ response }: HttpContext) {
    // 👇 Or use the inertia.location for external redirects
    return inertia.location('https://adonisjs.com')
  }
}
```
## Sharing data with all views

Sometimes, you may need to share the same data across multiple views. For instance, sharing the current user information with all views. Having to do this for every controller can become tedious. Fortunately, we have two solutions for this issue.

### `sharedData` 

In the `config/inertia.ts` file you can define a `sharedData` object. This object allows you to define data that should be shared with all views.

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  sharedData: {
    // 👇 This will be available in all views
    appName: 'My App' ,
    // 👇 Scoped to the current request
    user: (ctx) => ctx.auth?.user, 
    // 👇 Scoped to the current request
    errors: (ctx) => ctx.session.flashMessages.get('errors'),
  },
})
```

### Share from a middleware

Sometimes, it might be more convenient to share data from a middleware rather than the `config/inertia.ts` file. You can do so by using the `inertia.share` method :

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class MyMiddleware {
  public async handle({ inertia }: HttpContext, next: NextFn) {
    inertia.share('appName', 'My App')
    inertia.share('user', (ctx) => ctx.auth?.user)
  }
}
```

## Partial reloads & Lazy data evaluation 

Please first read the [official documentation](https://inertiajs.com/partial-reloads) to understand what partial reloads are and how they work.

About lazy data evaluation, here is how it works in AdonisJS :

```ts
export default class UsersController {
  public async index({ inertia }: HttpContext) {
    return inertia.render('users/index', {
      // ALWAYS included on first visit.
      // OPTIONALLY included on partial reloads.
      // ALWAYS evaluated
      'users': await User.all()m

      // ALWAYS included on first visit.
      // OPTIONALLY included on partial reloads.
      // ONLY evaluated when needed
      'users': () => User.all(),

      // NEVER included on first visit.
      // OPTIONALLY included on partial reloads.
      // ONLY evaluated when needed
      'users': inertia.lazy(() => User.all())
    }),
  }
}
```


## CSRF 

If you enabled [CSRF protection](../security/web-security.md#csrf-protection) for your application, make sure to enable the `enableXsrfCookie` option in the `config/shield.ts` file.

Enabling this option will make sure that the `XSRF-TOKEN` cookie is set on the client side and sent back to the server with every request.

No additional configuration is needed to make Inertia.js work with CSRF protection.

## Asset versioning

When re-deploying your application, you may want your users to always get the latest version of your client-side assets. This is something supported out-of-the-box by the Inertia protocol and AdonisJS.

Make sure to read the [official documentation](https://inertiajs.com/asset-versioning) for more information.

By default, the `@adonisjs/inertia` package will compute a hash for the `public/assets/manifest.json` file and use it as the version of your assets.

If you want to tweak this behavior, you can do so by editing the `config/inertia.ts` file. The `version` prop is used to define the version of your assets and can be a string or a function.

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  version: 'v1'
})
```

## SSR

At the time of writing, we don't have any SSR support for Inertia.js. See [this article](https://adonisjs.com/blog/future-plans-for-adonisjs-6#adonisjsinertia) for more information.

However we are currently working to add SSR support. You should be able to start working on your project right now even if it requires SSR. Moving your app to SSR should be super easy once it's available (No breaking changes)

## Testing

There are several ways to test your frontend code:

- End-to-end testing. You can use the [Browser Client](https://docs.adonisjs.com/guides/browser-tests), a seamless integration between Japa and Playwright.
- Unit testing. We recommend using testing tools adapted for the frontend ecosystem, in particular [Vitest](https://vitest.dev).

And finally, you can also test your Inertia.js endpoints to make sure they're returning the right data. For that, we have few test helpers available in Japa.

First, make sure to configure the `inertiaApiClient` and `apiClient` plugins in your `test/bootsrap.ts` file if you haven't already done so:

```ts
// title: tests/bootstrap.ts
import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'
// highlight-start
import { apiClient } from '@japa/api-client'
import { inertiaApiClient } from '@adonisjs/inertia'
// highlight-end

export const plugins: Config['plugins'] = [
  assert(), 
  pluginAdonisJS(app),
  // highlight-start
  apiClient(),
  inertiaApiClient(app)
  // highlight-end
]
```

Next, we can make a request to our Inertia.js endpoint using `withInertia()` to ensure that the data is correctly returned in JSON format.

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.withInertia().get('/home')

  response.assertStatus(200)
  response.assertInertiaComponent('home/main')
  response.assertInertiaProps({ user: { name: 'julien' } })
})
```

Let's take a look at the various assertions available to test your endpoints: 

### `withInertia()`

Adds the `X-Inertia` header to the request. This ensures that data is correctly returned in JSON format.

### `assertInertiaComponent()`

Checks that the component returned by the server is the one expected.

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.withInertia().get('/home')

  response.assertInertiaComponent('home/main')
})
```

### `assertInertiaProps()`

Checks that the props returned by the server are exactly those passed as parameters.

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.withInertia().get('/home')

  response.assertInertiaProps({ user: { name: 'julien' } })
})
```

### `assertInertiaPropsContains()`

Checks that the props returned by the server contain some of the props passed as parameters. Uses [`containsSubset`](https://japa.dev/docs/plugins/assert#containssubset) under the hood.

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.withInertia().get('/home')

  response.assertInertiaPropsContains({ user: { name: 'julien' } })
})
```

### Additional properties

In addition to this, you can access the following properties on `ApiResponse` :

```ts
test('returns correct data', async ({ client }) => {
  const { body } = await client.withInertia().get('/home')

  // 👇 The component returned by the server
  console.log(response.inertiaComponent) 

  // 👇 The props returned by the server
  console.log(response.inertiaProps)
})
```
