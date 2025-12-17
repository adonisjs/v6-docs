---
summary: Learn how to add type safety to your AdonisJS API with Tuyau, a collection of tools designed to enhance type safety when building APIs or Inertia app with AdonisJS.
---

# Tuyau client

Tuyau is a collection of tools designed to enhance type safety when building APIs with AdonisJS. It offers an end-to-end (E2E) client that automatically generates a type-safe frontend client for your AdonisJS API, eliminating the need to manually maintain types or runtime code. This approach ensures that your frontend and backend remain in sync, reducing the risk of errors and improving development efficiency.

In addition to the E2E client, Tuyau provides several other features:

- **Routes Helper**: Generate and use routes in the frontend with type safety.
- **Inertia Helpers**: A set of components and helpers for AdonisJS and Inertia projects, enhancing type safety when using Inertia in your AdonisJS applications.
- **SuperJSON Integration**: Seamlessly integrate SuperJSON with Tuyau and AdonisJS, enabling the serialization and deserialization of complex data types.

:::note

Tuyau is designed to function within a monorepo setup, where both your AdonisJS backend and frontend projects reside in the same repository.

:::
## Installation

Install and configure the `@tuyau/core` package using the following command:

```sh
node ace add @tuyau/core
```

You will also have to install the Tuyau client package.

```sh
npm install @tuyau/client
```

## Usage

The core package provides a command to generate the TypeScript types needed for the client package. Run the following command manually after adding a new route/controller or a `request.validateUsing` call in your controller method:

```sh
node ace tuyau:generate
```

This command creates an `.adonisjs` folder in your project, containing the necessary files for the client package.

## Share the API definition

The `node ace tuyau:generate` command generates two files: `.adonisjs/api.ts` and `.adonisjs/index.ts`. To share the API definition with your frontend project, export the `.adonisjs/index.ts` file from your server workspace using subpath exports in your package.json:

```json
{
  "name": "@acme/server",
  "type": "module",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./api": "./.adonisjs/index.ts"
  }
}
```

Then, include `@acme/server` as a dependency in your frontend workspace:

```json
{
  "name": "@acme/frontend",
  "type": "module",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "@acme/server": "workspace:*"
  }
}
```

:::note

Ensure your package manager or monorepo tool can resolve the `workspace:*` syntax. If not, use the appropriate syntax for your tool.

:::

## Initialize the client

In your frontend project, create the Tuyau client by importing the API definition:

```ts
import { createTuyau } from '@tuyau/client';
import { api } from '@acme/server/api';

export const tuyau = createTuyau({
  api,
  baseUrl: 'http://localhost:3333',
});
```

Here, api is a runtime object containing both the API definition (as a type) and the routes of your API. This setup allows you to map route names to paths and ensures type safety when calling your routes.

If you prefer not to include the runtime code for route names, you can import only the `ApiDefinition` type:

```ts
import { createTuyau } from '@tuyau/client';
import type { ApiDefinition } from '@acme/server/api';

export const tuyau = createTuyau<{ definition: ApiDefinition }>({
  baseUrl: 'http://localhost:3333',
});
```

This approach omits the runtime code for route names but still provides type safety when calling your routes by their path (e.g., `tuyau.users.$get()`). However, you will lose the ability to use route helpers like `$has`, `$current`, and `$route`.

## RPC Client

This client is built on top of [Ky](https://github.com/sindresorhus/ky), a lightweight HTTP client, and provides a straightforward interface for making requests to your API endpoints.

With the client instance in place, you can make requests to your API endpoints using method chaining:

```ts
// GET /users
await tuyau.users.$get();

// POST /users { name: 'John Doe' }
await tuyau.users.$post({ name: 'John Doe' });

// PUT /users/1 { name: 'John Doe' }
await tuyau.users({ id: 1 }).$put({ name: 'John Doe' });

// GET /users/1/posts?limit=10&page=1
await tuyau.users({ id: 1 }).posts.$get({ query: { page: 1, limit: 10 } });
```

This approach ensures that all requests are type-safe, with parameters, payloads, query parameters, and responses all being validated at compile time.

If you prefer to use route names instead of paths, you can utilize the `$route` method:

```ts
// Backend
router.get('/posts/:id/generate-invitation', '...')
  .as('posts.generateInvitation');

// Client
await tuyau
  .$route('posts.generateInvitation', { id: 1 })
  .$get({ query: { limit: 10, page: 1 } });
```

### Path parameters

For routes with path parameters, pass an object to the corresponding function:

```ts
// Backend
router.get('/users/:id/posts/:postId/comments/:commentId', '...');

// Client
const result = await tuyau.users({ id: 1 })
  .posts({ postId: 2 })
  .comments({ commentId: 3 })
  .$get();
```

### File uploads

When a File instance is passed, Tuyau automatically converts it to a ?`FormData` instance and sets the appropriate headers. The payload is serialized using the `object-to-formdata` package, ensuring that the file is correctly formatted for transmission.

```ts
const fileInput = document.getElementById('file');
const file = fileInput.files[0];

await tuyau.users.$post({ avatar: file });
```

### Custom options

You can pass specific [Ky](https://github.com/sindresorhus/ky) options to the request by providing them as a second argument to the request method:

```ts
await tuyau.users.$post({ name: 'John Doe' }, {
  headers: {
    'X-Custom-Header': 'foobar',
  },
});
```

## Route Helper

Tuyau provides a convenient helper to generate URLs based on your AdonisJS route names.

To generate a URL using a route name, you can use the `$url` method:

```ts
// For a route named 'users.posts.show' with parameters
const url = tuyau.$url('users.posts.show', { id: 1, postId: 2 });
console.log(url); // Outputs: http://localhost:3333/users/1/posts/2

// For a route named 'users' with query parameters
const url = tuyau.$url('users', { query: { page: 1, limit: 10 } });
console.log(url); // Outputs: http://localhost:3333/users?page=1&limit=10
```

In these examples, tuyau.$url generates the full URL by combining the base URL with the route path and any provided parameters or query strings.

## Inertia Helpers

Tuyau offers a set of helpers for Inertia.js projects through the `@tuyau/inertia` package.

Begin by installing the `@tuyau/inertia` package in your frontend project:

```sh
npm install @tuyau/inertia
```

### React integration

For React applications, wrap your app with the `TuyauProvider` component and pass your Tuyau client instance:

```tsx
// title: inertia/app/app.tsx

import { TuyauProvider } from '@tuyau/inertia/react';
import { tuyau } from './tuyau';

createInertiaApp({
  // ...
  setup({ el, App, props }) {
    hydrateRoot(
      el,
      <>
        <TuyauProvider client={tuyau}>
          <App {...props} />
        </TuyauProvider>
      </>
    );
  },
});
```

:::warning

Ensure that the TuyauProvider is also included in your server-side rendering setup if applicable.

:::

### Vue integration

For Vue.js applications, install the Tuyau plugin and use it within your app:

```ts
// title: inertia/app/app.ts

import { TuyauPlugin } from '@tuyau/inertia/vue';
import { tuyau } from './tuyau';

createInertiaApp({
  // ...
  setup({ el, App, props, plugin }) {
    createSSRApp({ render: () => h(App, props) })
      .use(plugin)
      .use(TuyauPlugin, { client: tuyau })
      .mount(el);
  },
});
```

Similarly, include the `TuyauPlugin` in your server-side rendering setup if used.

### Usage

Tuyau provides a `Link` component that wraps Inertia’s Link, offering enhanced type safety.

```tsx
// React example
import { Link } from '@tuyau/inertia/react';

<Link route="users.posts.show" params={{ id: 1, postId: 2 }}>
  Go to post
</Link>
```

```vue
<!-- Vue example -->
<script setup lang="ts">
import { Link } from '@tuyau/inertia/vue';
</script>

<template>
  <Link route="users.posts.show" :params="{ id: 1, postId: 2 }">
    Go to post
  </Link>
</template>
```

## SuperJSON

SuperJSON is an extension of JSON that supports additional types such as `Date`, `RegExp`, `BigInt`, and more.

To enable SuperJSON in your AdonisJS project, install the `@tuyau/superjson` package:

```sh
node ace add @tuyau/superjson
```

This command adds a `superjson_middleware` entry to your `start/kernel.ts` file. The middleware will automatically serialize response data using SuperJSON when a `x-superjson` header is present in the request.

If working on a monorepo, install the same package with `npm install @tuyau/superjson` in your client.

Then, include the plugin when initializing the Tuyau client:

```ts
import { superjson } from '@tuyau/superjson/plugin';

export const tuyau = createTuyau({
  api,
  baseUrl: 'http://localhost:3333',
  plugins: [superjson()],
});
```

This setup ensures that every request includes the `x-superjson` header, prompting the API to return data in SuperJSON format, and that the response data is correctly parsed using SuperJSON.

### Limitation

While SuperJSON enhances type handling, it has some limitations. For instance, if your API returns a Lucid model, the frontend will receive it as the same type, which may not be accurate. It’s important to ensure that your API returns the correct data types to maintain type safety.
