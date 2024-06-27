---
summary: Learn how to use Inertia with AdonisJS to create server-rendered applications with your favorite frontend framework.
---

# Inertia

[Inertia](https://inertiajs.com/) is a framework-agnostic way to create single-page applications without much of the complexity of modern SPAs.

It is a great middle ground between traditional server-rendered applications (with templating engines) and modern SPAs (with client-side routing and state management).

Using Inertia will allow you to create a SPA with your favorite frontend framework (Vue.js, React, Svelte or Solid.js) without creating a separate API.

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
// title: inertia/pages/users/index.vue
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
Are you starting a new project and want to use Inertia? Check out the [Inertia starter kit](https://docs.adonisjs.com/guides/getting-started/installation#inertia-starter-kit).
:::

Install the package from the npm registry running:

:::codegroup

```sh
// title: npm
npm i @adonisjs/inertia
```

:::

Once done, run the following command to configure the package.

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

4. Copy a few stubs into your application to help you start quickly. Each copied file is adapted to the frontend framework previously selected.

  1. Create a `./resources/views/inertia_layout.edge` file that will be used to render the HTML page used to boot Inertia.

  2. Create a `./inertia/css/app.css` file with the content needed to style the `inertia_layout.edge` view.

  3. Create a `./inertia/tsconfig.json` file to differentiate between the server and client-side TypeScript configuration.

  4. Create a `./inertia/app/app.ts` for bootstrapping Inertia and your frontend framework.

  5. Create a `./inertia/pages/home.{tsx|vue|svelte}` file to render the home page of your application.

  6. Create a `./inertia/pages/server_error.{tsx|vue|svelte}` and `./inertia/pages/not_found.{tsx|vue|svelte}` files to render the error pages.

  7. Add the correct vite plugin to compile your frontend framework in the `vite.config.ts` file.

  8. Add a dumb route at `/` in your `start/routes.ts` file to render the home page with Inertia as an example.
 
5. Install packages based on the selected frontend framework.

:::

Once done, you should be ready to use Inertia in your AdonisJS application. Start your development server, and visit `localhost:3333` to see the home page rendered using Inertia with your selected frontend framework.

:::note
**Read the [Inertia official documentation](https://inertiajs.com/)**.

Inertia is a backend-agnostic library. We just created an adapter to make it work with AdonisJS. You should be familiar with the Inertia concepts before reading this documentation.

**We will only cover AdonisJS's specific parts in this documentation.**
:::

## Client-side entrypoint

If you used the `configure` or `add` command, the package will have created an entrypoint file at `inertia/app/app.ts` so you can skip this step. 

Basically, this file will be the main entrypoint for your frontend application and will be used to bootstrap Inertia and your frontend framework. This file should be the entrypoint loaded by your root Edge template with the `@vite` tag.

:::codegroup

```ts
// title: Vue
import { createApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  title: (title) => {{ `${title} - ${appName}` }},
  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.vue`,
      import.meta.glob<DefineComponent>('./pages/**/*.vue'),
    )
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
})
```

```tsx
// title: React
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
    )
  },

  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
});
```

```ts
// title: Svelte
import { createInertiaApp } from '@inertiajs/svelte'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.svelte`,
      import.meta.glob('./pages/**/*.svelte'),
    )
  },

  setup({ el, App, props }) {
    new App({ target: el, props })
  },
})
```

```ts
// title: Solid
import { render } from 'solid-js/web'
import { createInertiaApp } from 'inertia-adapter-solid'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
    )
  },

  setup({ el, App, props }) {
    render(() => <App {...props} />, el)
  },
})
```
:::

The role of this file is to create an Inertia app and to resolve the page component. The page component you write when using `inertia.render` will be passed down the the `resolve` function and the role of this function is to return the component that need to be rendered.

## Rendering pages

While configuring your package, a `inertia_middleware` has been registered inside the `start/kernel.ts` file. This middleware is responsible for setting up the `inertia` object on the [`HttpContext`](../concepts/http_context.md).

To render a view using Inertia, use the `inertia.render` method. The method accepts the view name and the data to be passed to the component as props.

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

Do you see the `home` passed to the `inertia.render` method? It should be the path to the component file relative to the `inertia/pages` directory. We render the `inertia/pages/home.(vue,tsx)` file here.

Your frontend component will receive the `user` object as a prop : 

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
While passing data to the frontend, everything is serialized to JSON. Do not expect to pass instances of models, dates, or other complex objects. 
:::

### Root Edge template

The Root template is a regular Edge template that will be loaded on the first-page visit of your application. It is the place where you should include your CSS and Javascript files and also where you should include the `@inertia` tag. A typical root template looks like this :

:::codegroup

```edge
// title: Vue
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @inertiaHead()
  @vite(['inertia/app/app.ts', `inertia/pages/${page.component}.vue`])
</head>

<body>
  @inertia()
</body>

</html>
```

```edge
// title: React
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @inertiaHead()
  @viteReactRefresh()
  @vite(['inertia/app/app.tsx', `inertia/pages/${page.component}.tsx`])
</head>

<body>
  @inertia()
</body>

</html>
```

```edge
// title: Svelte
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @inertiaHead()
  @vite(['inertia/app/app.ts', `inertia/pages/${page.component}.svelte`])
</head>

<body>
  @inertia()
</body>

</html>
```

```edge
// title: Solid
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @inertiaHead()
  @vite(['inertia/app/app.tsx', `inertia/pages/${page.component}.tsx`])
</head>

<body>
  @inertia()
</body>

</html>
```


:::

You can configure the root template path in the `config/inertia.ts` file. By default, it assumes your template is at `resources/views/inertia_layout.edge`.

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  // The path to the root template relative 
  // to the `resources/views` directory
  rootView: 'app_root', 
})
```

If needed, you can pass a function to the `rootView` prop to dynamically decide which root template should be used.

```ts
import { defineConfig } from '@adonisjs/inertia'
import type { HttpContext } from '@adonisjs/core/http'

export default defineConfig({
  rootView: ({ request }: HttpContext) => {
    if (request.url().startsWith('/admin')) {
      return 'admin_root'
    }

    return 'app_root'
  }
})
```

### Root template data

You may want to share data with your root Edge template. For example, for adding a meta title or open graph tags. You can do so by using the 3rd argument of the `inertia.render` method :

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

It is how you should do it in AdonisJS : 

```ts
export default class UsersController {
  async store({ response }: HttpContext) {
    await User.create(request.body())

    // 👇 You can use standard AdonisJS redirections
    return response.redirect().toRoute('users.index')
  }

  async externalRedirect({ inertia }: HttpContext) {
    // 👇 Or use the inertia.location for external redirects
    return inertia.location('https://adonisjs.com')
  }
}
```

See the [official documentation](https://inertiajs.com/redirects) for more information.

## Sharing data with all views

Sometimes, you may need to share the same data across multiple views. For instance, we are sharing the current user information with all views. Having to do this for every controller can become tedious. Fortunately, we have two solutions for this issue.

### `sharedData` 

In the `config/inertia.ts` file, you can define a `sharedData` object. This object allows you to define data that should be shared with all views.

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

Sometimes, sharing data from a middleware rather than the `config/inertia.ts` file might be more convenient. You can do so by using the `inertia.share` method :

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class MyMiddleware {
  public async handle({ inertia, auth }: HttpContext, next: NextFn) {
    inertia.share({
      appName: 'My App',
      user: (ctx) => ctx.auth?.user
    })
  }
}
```

## Partial reloads & Lazy data evaluation 

First read the [official documentation](https://inertiajs.com/partial-reloads) to understand what partial reloads are and how they work.

About lazy data evaluation, here is how it works in AdonisJS :

```ts
export default class UsersController {
  public async index({ inertia }: HttpContext) {
    return inertia.render('users/index', {
      // ALWAYS included on first visit.
      // OPTIONALLY included on partial reloads.
      // ALWAYS evaluated
      users: await User.all(),

      // ALWAYS included on first visit.
      // OPTIONALLY included on partial reloads.
      // ONLY evaluated when needed
      users: () => User.all(),

      // NEVER included on first visit.
      // OPTIONALLY included on partial reloads.
      // ONLY evaluated when needed
      users: inertia.lazy(() => User.all())
    }),
  }
}
```

## Types sharing

Usually, you will want to share the types of the data you are passing to your frontend pages components. A simple way to do this is to use the `InferPageProps` type.

:::codegroup

```ts
// title: app/controllers/users_controller.ts
export class UsersController {
  index() {
    return inertia.render('users/index', {
      users: [
        { id: 1, name: 'julien' },
        { id: 2, name: 'virk' },
        { id: 3, name: 'romain' },
      ]
    })
  }
}
```

```tsx
// title: inertia/pages/users/index.tsx
import { InferPageProps } from '@adonisjs/inertia/types'
import type { UsersController } from '../../controllers/users_controller.ts'

export function UsersPage(
  // 👇 It will be correctly typed based
  // on what you passed to inertia.render
  // in your controller
  props: InferPageProps<UsersController, 'index'>
) {
  return (
    // ...
  )
}
```

:::

If you're using Vue, you'll have to manually define each property in your `defineProps`. This is an annoying limitation of Vue, see [this issue](https://github.com/vitejs/vite-plugin-vue/issues/167) for more information.

```vue
<script setup lang="ts">
import { InferPageProps } from '@adonisjs/inertia'

defineProps<{
  // 👇 You will have to manually define each prop
  users: InferPageProps<UsersController, 'index'>['users'],
  posts: InferPageProps<PostsController, 'index'>['posts'],
}>()

</script>
```


### Reference Directives

Since your Inertia Application is a separate TypeScript project (with its own `tsconfig.json`), you will need to help TypeScript understand some types. Many of our official packages use [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) to add certain types to your AdonisJS project.

For example, the `auth` property on the `HttpContext` and its typing will only be available when you import `@adonisjs/auth/initialize_auth_middleware` into your project. Now, the issue is that we don't import this module in our Inertia project, so if you try to infer the page props from a controller that uses `auth`, then you will likely receive a TypeScript error or an invalid type.

To resolve this issue, you can use [reference directives](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-path-) to help TypeScript understand certain types. To do this, you need to add the following line in your `inertia/app/app.ts` file:

```ts
/// <reference path="../../adonisrc.ts" />
```

Depending on the types you use, you may need to add other reference directives, such as references to certain configuration files that also use module augmentation.

```ts
/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/ally.ts" />
/// <reference path="../../config/auth.ts" />
```

### Type-level Serialization

An important thing to know about `InferPageProps` is that it will "serialize at the type level" the data you pass. For example, if you pass a `Date` object to `inertia.render`, the resulting type from `InferPageProps` will be `string`:

:::codegroup

```ts
// title: app/controllers/users_controller.ts
export default class UsersController {
  async index({ inertia }: HttpContext) {
    const users = [
      { id: 1, name: 'John Doe', createdAt: new Date() }
    ]

    return inertia.render('users/index', { users })
  }
}
```

```tsx
// title: inertia/pages/users/index.tsx
import type { InferPageProps } from '@adonisjs/inertia/types'

export function UsersPage(
  props: InferPageProps<UsersController, 'index'>
) {
  props.users
  //     ^? { id: number, name: string, createdAt: string }[]
}
```

:::

This makes total sense, as dates are serialized to string when they are passed over the network in JSON.

### Model Serialization

Keeping the last point in mind, another important thing to know is that if you pass an AdonisJS model to `inertia.render`, then the resulting type from `InferPageProps` will be a `ModelObject`: a type that contains almost no information. This can be problematic. To solve this issue, you have several options:

- Cast your model to a simple object before passing it to `inertia.render`:
- Use a DTO (Data Transfer Object) system to transform your models into simple objects before passing them to `inertia.render`.

:::codegroup

```ts
// title: Casting
class UsersController {
  async edit({ inertia, params }: HttpContext) {
    const user = users.serialize() as {
        id: number
        name: string 
    }

    return inertia.render('user/edit', { user })
  }
}
```

```ts
// title: DTOs
class UserDto {
  constructor(private user: User) {}

  public toJson() {
    return {
      id: this.user.id,
      name: this.user.name
    }
  }
}

class UsersController {
  async edit({ inertia, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return inertia.render('user/edit', { user: new UserDto(user).toJson() })
  }
}
```

:::

You will now have accurate types in your frontend component.

### Shared Props

To have the types of your [shared data](#sharing-data-with-all-views) in your components, ensure you have performed module augmentation in your `config/inertia.ts` file as follows:

```ts
// file: config/inertia.ts
const inertiaConfig = defineConfig({
  sharedData: {
    appName: 'My App',
  },
});

export default inertiaConfig;

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {
    // If necessary, you can also manually add some shared props,
    // such as those shared from a middleware for example
    propsSharedFromAMiddleware: number;
  }
}
```

Also, make sure to add this [reference directive](#reference-directives) in your `inertia/app/app.ts` file:

```ts
/// <reference path="../../config/inertia.ts" />
```

Once this is done, you will have access to your shared props in your components via `InferPageProps`. `InferPageProps` will contain the types of your shared props and the props passed by `inertia.render`:

```tsx
// file: inertia/pages/users/index.tsx

import type { InferPageProps } from '@adonisjs/inertia/types'

export function UsersPage(
  props: InferPageProps<UsersController, 'index'>
) {
  props.appName
  //     ^? string
  props.propsSharedFromAMiddleware
  //     ^? number
}
```

If needed, you can access only the types of your shared props via the `SharedProps` type:

```tsx
import type { SharedProps } from '@adonisjs/inertia/types'

const page = usePage<SharedProps>()
```

## CSRF 

If you enabled [CSRF protection](../security/securing_ssr_applications.md#csrf-protection) for your application, enable the `enableXsrfCookie` option in the `config/shield.ts` file.

Enabling this option will ensure that the `XSRF-TOKEN` cookie is set on the client side and sent back to the server with every request.

No additional configuration is needed to make Inertia work with CSRF protection.

## Asset versioning

When re-deploying your application, your users should always get the latest version of your client-side assets. It is something supported out-of-the-box by the Inertia protocol and AdonisJS.

By default, the `@adonisjs/inertia` package will compute a hash for the `public/assets/manifest.json` file and use it as the version of your assets.

If you want to tweak this behavior, you can edit the `config/inertia.ts` file. The `version` prop defines the version of your assets and can be a string or a function.

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  version: 'v1'
})
```

Read the [official documentation](https://inertiajs.com/asset-versioning) for more information.

## SSR

### Enabling SSR

[Inertia Starter Kit](../getting_started/installation.md#starter-kits) comes with server-side rendering (SSR) support out of the box. So make sure to use it if you want to enable SSR for your application. 

If you started your application without enabling SSR, you can always enable it later by following the following steps : 

#### Adding a server entrypoint

We need to add a server entrypoint that looks super similar to the client entrypoint. This entrypoint will render the first-page visit on the server and not on the browser.

You must create a `inertia/app/ssr.ts` that default export a function like this :

:::codegroup

```ts
// title: Vue 
import { createInertiaApp } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h, type DefineComponent } from 'vue'

export default function render(page) {
  return createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => {
      const pages = import.meta.glob<DefineComponent>('./pages/**/*.vue')
      return pages[`./pages/${name}.vue`]()
    },

    setup({ App, props, plugin }) {
      return createSSRApp({ render: () => h(App, props) }).use(plugin)
    },
  })
}
```

```tsx
// title: React
import ReactDOMServer from 'react-dom/server'
import { createInertiaApp } from '@inertiajs/react'

export default function render(page) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
      return pages[`./pages/${name}.tsx`]
    },
    setup: ({ App, props }) => <App {...props} />,
  })
}
```

```ts
// title: Svelte
import { createInertiaApp } from '@inertiajs/svelte'
import createServer from '@inertiajs/svelte/server'

export default function render(page) {
  return createInertiaApp({
    page,
    resolve: name => {
      const pages = import.meta.glob('./pages/**/*.svelte', { eager: true })
      return pages[`./pages/${name}.svelte`]
    },
  })
}
```

```tsx
// title: Solid
import { hydrate } from 'solid-js/web'
import { createInertiaApp } from 'inertia-adapter-solid'

export default function render(page: any) {
  return createInertiaApp({
    page,
    resolve: (name) => {
      const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
      return pages[`./pages/${name}.tsx`]
    },
    setup({ el, App, props }) {
      hydrate(() => <App {...props} />, el)
    },
  })
}
```
:::

#### Update the config file

Head over to the `config/inertia.ts` file and update the `ssr` prop to enable it. Also, point to your server entrypoint if you use a different path.

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  // ...
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx'
  }
})
```

#### Update the Vite config

First, make sure you have registered the `inertia` vite plugin. Once done, you should update the path to the server entrypoint in the `vite.config.ts` file if you use a different path.

```ts
import { defineConfig } from 'vite'
import inertia from '@adonisjs/inertia/client'

export default defineConfig({
  plugins: [
    inertia({
      ssr: {
        enabled: true,
        entrypoint: 'inertia/app/ssr.tsx'
      }
    })
  ]
})
```

You should now be able to render the first-page visit on the server and then continue with the client-side rendering.

### SSR Allowlist

When using SSR, you may want to not server-side render all your components. For example, you are building an admin dashboard gated by authentication, so these routes have no reason to be rendered on the server. But on the same application, you may have a landing page that could benefit from SSR to improve SEO.

So, you can add the pages that should be rendered on the server in the `config/inertia.ts` file.

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  ssr: {
    enabled: true,
    pages: ['home']
  }
})
```

You can also pass a function to the `pages` prop to dynamically decide which pages should be rendered on the server.

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  ssr: {
    enabled: true,
    pages: (ctx, page) => page.startsWith('admin')
  }
})
```

## Testing

There are several ways to test your frontend code:

- End-to-end testing. You can use the [Browser Client](https://docs.adonisjs.com/guides/browser-tests), a seamless integration between Japa and Playwright.
- Unit testing. We recommend using testing tools adapted for the frontend ecosystem, particularly [Vitest](https://vitest.dev).

And finally, you can also test your Inertia endpoints to ensure they return the correct data. For that, we have a few test helpers available in Japa.

First, make sure to configure the `inertiaApiClient` and `apiClient` plugins in your `test/bootsrap.ts` file if you haven't already done so:

```ts
// title: tests/bootstrap.ts
import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
// highlight-start
import { apiClient } from '@japa/api-client'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
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

Next, we can request our Inertia endpoint using `withInertia()` to ensure the data is correctly returned in JSON format.

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.get('/home').withInertia()

  response.assertStatus(200)
  response.assertInertiaComponent('home/main')
  response.assertInertiaProps({ user: { name: 'julien' } })
})
```

Let's take a look at the various assertions available to test your endpoints: 

### `withInertia()`

Adds the `X-Inertia` header to the request. It ensures that data is correctly returned in JSON format.

### `assertInertiaComponent()`

Checks that the component returned by the server is the one expected.

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.get('/home').withInertia()

  response.assertInertiaComponent('home/main')
})
```

### `assertInertiaProps()`

Checks that the props returned by the server are exactly those passed as parameters.

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.get('/home').withInertia()

  response.assertInertiaProps({ user: { name: 'julien' } })
})
```

### `assertInertiaPropsContains()`

Checks that the props returned by the server contain some of the props passed as parameters. It uses [`containsSubset`](https://japa.dev/docs/plugins/assert#containssubset) under the hood.

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.get('/home').withInertia()

  response.assertInertiaPropsContains({ user: { name: 'julien' } })
})
```

### Additional properties

In addition to this, you can access the following properties on `ApiResponse` :

```ts
test('returns correct data', async ({ client }) => {
  const { body } = await client.get('/home').withInertia()

  // 👇 The component returned by the server
  console.log(response.inertiaComponent) 

  // 👇 The props returned by the server
  console.log(response.inertiaProps)
})
```

## FAQ

### Why my server is constantly reloading when updating my frontend code?

Let's say you are using React. Every time you update your frontend code, the server will reload and the browser will refresh. You are not benefiting from the hot module replacement (HMR) feature. 

You need to exclude `inertia/**/*` from your root `tsconfig.json` file to make it work. 

```jsonc
{
  "compilerOptions": {
    // ...
  },
  "exclude": ["inertia/**/*"]
}
```

Because, the AdonisJS process that is responsible for restarting the server is watching files included in the `tsconfig.json` file.

### Why my production build is not working ?

A common issue is that you just forgot to set `NODE_ENV=production` when running your production build. 

### `Top-level await is not available...`

If you are facing an error like this one:

```
X [ERROR] Top-level await is not available in the configured target environment ("chrome87", "edge88", "es2020", "firefox78", "safari14" + 2 overrides)

    node_modules/@adonisjs/core/build/services/hash.js:15:0:
      15 │ await app.booted(async () => {
         ╵ ~~~~~
```

Then it's highly likely that you're importing backend code into your frontend. Taking a closer look at the error, which is generated by Vite, we see that it's trying to compile code from `node_modules/@adonisjs/core`. So, this means our backend code will end up in the frontend bundle. That's probably not what you want.

Generally, this error occurs when you try to share a type with your frontend. If this what you are trying to achieve, make sure to always import this type only via `import type` rather than `import`:

```ts
// ✅ Correct
import type { User } from '#models/user'

// ❌ Incorrect
import { User } from '#models/user'
``
