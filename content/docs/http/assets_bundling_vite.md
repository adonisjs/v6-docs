# Assets Bundling (Vite)

AdonisJS use [Vite](https://vitejs.dev/) as the default bundler for assets. Vite is a next-generation frontend tooling that is fast and supports modern JavaScript features like ES modules. Vite is now the default bundler for AdonisJS applications.

AdonisJS provides a Vite plugin and also a provider to configure Vite for your application.

## Basic Setup

### Installation

The package comes pre-configured with the [web starter kit](../guides/installation.md#web-starter-kit). However, you can install it as follows with other starter kits.

:::codegroup

```sh
// title: npm
npm i @adonisjs/vite
npm i -D vite
```

```sh
// title: yarn
yarn add @adonisjs/vite vite
yarn add -D vite
```

```sh
// title: pnpm
pnpm add @adonisjs/vite
pnpm add -D vite
```

:::

Once the package is installed, you must configure it using the `node ace configure` command.

```sh
node ace configure @adonisjs/vite
```

A `vite.config.ts` file will be created in the project root with the minimum configuration required to bundle assets.

:::warning
If you want to use a framework like React, Vue, or Svelte, you will have to install the respective plugin and configure it in your `vite.config.ts`. See our different guides below for more information.
:::

### Configure entrypoints

Entrypoints are the files that Vite will bundle and serve. They can be any files supported by Vite like JavaScript, TypeScript, CSS, PostCSS, and so on. Any other imports inside the entry point file are part of the same bundle.

For example, if you have registered the `./resources/js/app.js` file as an entrypoint with the following contents, all the internal imports will be bundled together to form a single output.

```ts
import "../css/app.css";
import "normalize.css";
import "alpinejs";
```

You can register entrypoints within the `vite.config.ts` file.

```ts
import { defineConfig } from "vite";
import Adonis from "@adonisjs/vite";

export default defineConfig({
  plugins: [
    Adonis({
      entrypoints: ["resources/js/app.ts", "resources/css/app.css"],
    }),
  ],
});
```

Once entrypoints are registered, you can use the `@vite` tag to generate the HTML tags for the entrypoints within your Edge templates.

```edge
{{-- Single entrypoint --}}
@vite(['resources/js/app.ts'])

{{-- Can also specify multiple entrypoints --}}
@vite([
  'resources/js/app.ts',
  'resources/js/admin.ts',
  'resources/css/app.css'
])
```

These tags will output correct `<script>` and `<link>` tags for each entrypoints. In development, ( when [hotfile](#hotfile) is present ), the tags will also include the Vite HMR script. In production, the tags will include the hashed file names.

:::note
While developping, sometimes your webpage might load without styles for a short moment. This is called a Flash of Unstyled Content (FOUC). It happens when the Vite client is in charge of loading the CSS from your scripts.

To fix this, you can define your CSS file as an entrypoint instead of putting it inside a script, and also include it in your `@vite` tag. This way, CSS will be loaded immediately by the browser without relying on Vite to load it.
:::

### Running Vite

Now that you have configured Vite, when you start the AdonisJS development server, it will also start the Vite development server in parallel in a subprocess. So your assets will be server by the Vite dev server on another port.

Logs coming from the Vite dev server will be outputted in the same terminal as the AdonisJS server.

```sh
node ace serve --watch
```

## Configuration

Remember that you can always refer to the [Vite documentation](https://vitejs.dev/config/) for more information about the configuration.

### Reload on file changes

When working with `.edge` file, you will have to tell Vite to reload the browser when a `.edge` file changes.

By chance, this is already done for you by the `@adonisjs/vite` package. By default, we are watching for changes in `./resources/views/**/*.edge` files.

If needed, you can customize this behavior like so :

```ts
import { defineConfig } from "vite";
import Adonis from "@adonisjs/vite/plugin";

export default defineConfig({
  plugins: [
    Adonis({
      entrypoints: ["resources/js/app.js"],

      // highlight-start
      reload: [
        "./resources/views/**/*.edge",
        "./resources/another-folder/**/*.md",
      ],
      // highlight-end
    }),
  ],
});
```

### Aliases

By default, AdonisJS vite plugin is pre-configured with the following alias :

```ts
{
  '@': '/resources/js',
}
```

You can overwrite or add more aliases by editing the `vite.config.ts` file.

```ts
import { defineConfig } from "vite";
import Adonis from "@adonisjs/vite/plugin";

export default defineConfig({
  plugins: [
    Adonis({
      entrypoints: ["resources/js/app.js"],
    }),
  ],

  resolve: {
    alias: {
      // Overwrite the default alias
      "@": "/my-other-resources/ts",

      // Add a new alias
      "@components": "/my-other-resources/components",
    },
  },
});
```

## View helpers and tags

### Processing Edge Assets

Since Edge files are not processed by Vite, you will need to make Vite aware of any assets that are used in your Edge files. This can be done by using `import.meta.glob`. Let's say, from your Edge files you want to be able to use all images stored in `/resources/images/` directory, you can do the following:

```ts
// resources/js/app.js

import.meta.glob(["../images/**"]);
```

That way, Vite will be aware of all the images in the `/resources/images/` directory and will be able to process them and serve them in development and production.

### @vite

The `@vite` tag is used to generate the HTML tags for the entrypoints. It accepts an array of entrypoints as its first argument.

```edge
@vite(['resources/js/app.ts'])
```

In development, ( when [hotfile](#hotfile) is present ), the tags will also include the Vite HMR script. In production, the tags will include the hashed file names.

### @viteReactRefresh

`@viteReactRefresh` must be used in React applications to enable [React Refresh](https://www.npmjs.com/package/react-refresh). It must be included before the `@vite` tag.

```edge
@viteReactRefresh
@vite(['resources/js/app.tsx'])
```

### `asset` helper

For invalidating browser cache, Vite is appending a hash to the file name of the assets in production. This means that the file name of the assets will change on every build.

Hence, you should never hardcode the asset path in your code and always use the `asset` helper for referencing assets.

```edge
// delete-start
<img src="/resources/images/logo.png" />
// delete-end

// insert-start
<img src="{{ asset('resources/images/logo.png') }}" />
// insert-end
```

## Integrations

### Typescript

Vite supports Typescript out of the box, so you don't need to install any additional package. However, you will have to add a second `tsconfig.json` at the root of your `resources/` directory.

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "lib": ["DOM"],
    "jsx": "preserve", // if you use React
    "paths": {
      // Paths must match the alias you
      // defined in vite.config.ts.
      "@/*": ["./js/*"]
    }
  }
}
```

Once done, your type-checking and IntelliSense should work as expected.

### Vue.js

If you want to use Vue.js, you will have to install the `@vitejs/plugin-vue` plugin and configure it in the `vite.config.ts` file.

```sh
pnpm i -D @vitejs/plugin-vue
```

```ts
import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    Adonis({
      entrypoints: ["resources/js/app.js"],
    }),
    Vue(),
  ],
});
```

### React

If you want to use React, you will have to install the `@vitejs/plugin-react` plugin and configure it in the `vite.config.ts` file.

```sh
pnpm i -D @vitejs/plugin-react
```

```ts
import { defineConfig } from "vite";
import React from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    Adonis({
      entrypoints: ["resources/js/app.js"],
    }),
    React(),
  ],
});
```

You will also need to add a [`@viteReactRefresh`](#vitereactrefresh) tag in your main Edge file to enable HMR.

```edge
<!DOCTYPE html>
<html lang="en">
<head>
  @viteReactRefresh()
  @vite(['resources/js/app.ts'])
</head>
```

## Deploying to CDN

In order to deploy your assets to another domain such as a CDN, you will need to modify the base URL of your assets.
First, you will need to call setAssetsUrl on the Vite service. You can do this from your `AppProvider`.

```ts
// title: providers/app_provider.ts

export default class AppProvider {
  // ...

  async boot() {
    const vite = await this.app.container.make("vite");

    if (this.app.inProduction) {
      vite.setAssetsUrl("https://cdn.example.com/");
    }
  }
}
```

Then, you will need to update the `assetsUrl` in your `vite.config.ts` file.

```ts
import { defineConfig } from "vite";
import Adonis from "@adonisjs/vite/plugin";

export default defineConfig({
  plugins: [
    Adonis({
      entrypoints: ["resources/js/app.js"],
      // highlight-start
      assetsUrl: "https://cdn.example.com/",
      // highlight-end
    }),
  ],
});
```

## Set script and link attributes

If ever you need to set custom attributes on the script and link tags inserted by `@vite` tag, you can use `setScriptAttributes` or `setStyleAttributes` methods on the Vite service.

```ts
// title: providers/app_provider.ts

export default class AppProvider {
  // ...

  async boot() {
    const vite = await this.app.container.make("vite");

    vite.setScriptAttributes({
      defer: true,
      myCustomAttribute: "my-custom-value",
    });

    vite.setStyleAttributes({
      myCustomAttribute: "my-custom-value",
    });
  }
}
```

If you need more granularity, you can also pass a callback to `setScriptAttributes` and `setStyleAttributes` methods.

```ts
// title: providers/app_provider.ts

export default class AppProvider {
  // ...

  async boot() {
    const vite = await this.app.container.make("vite");

    /**
     * This will only set the `myCustomAttribute` on the script tag
     * that has a `src` of `/resources/js/app.js`.
     */
    vite.setScriptAttributes(({ src, url }) => {
      if (src === "/resources/js/app.js") {
        return {
          myCustomAttribute: "my-custom-value",
        };
      }

      return {};
    });
  }
}
```

## Advanced usage

### Hotfile

The Hotfile is a file that is generated by our Vite Plugin only during development, in the `public/assets/hot.json` directory.
When the Vite dev server is stopped, the Hotfile is deleted. So this file has two purposes:

- Know if we are currently in development or production. If the Hotfile is present, then we know we are in development mode and we should rely on the Vite dev server for serving assets. Otherwise, we are in production mode and we should serve the assets differently ( CDN or using `@adonisjs/static` )

- Know the URL of the Vite dev server. Since the Dev Server can be started on a different port if the default port is already in use, we need to know the exact URL of the Dev Server for serving assets in development mode. So we store it in our Hotfile.

If ever you need to customize the hotfile path, you need to pass the `hotFile` option to the Vite plugin. And also call the `setHotfilePath` from the Vite service.

```ts
// title: vite.config.ts
export default defineConfig({
  Adonis({
    // ...
    // highlight-start
    hotFile: "public/assets/hot.json",
    // highlight-end
  }),
});
```

```ts
// title: providers/app_provider.ts
export default class AppProvider {
  async boot() {
    const vite = await this.app.container.make("vite");
    vite.setHotfilePath("public/assets/hot.json");
  }
}
```

### Manifest

When building for production, Vite will generate a manifest file, by default at `public/assets/manifest.json`. Basically : this file contains a mapping of all your assets and their hashed version.

So in production, we must read this file to know the filename we have to include in our HTML.

:::warning
One thing to keep in mind is that the manifest file is cached after first read in production. So if ever you update the manifest file while your app is running, you will need to restart your app to make the changes effective.

Can't see any use case for this, but was worth mentioning.
:::

If you need to customize the manifest path, you need to pass the `manifest` option to the Vite plugin. And also call the `setManifestPath` from the Vite service.

```ts
// title: vite.config.ts

export default defineConfig({
  Adonis({
    // ...
    // highlight-start
    manifest: "public/assets/manifest.json",
    // highlight-end
  }),
});
```

```ts
// title: providers/app_provider.ts
export default class AppProvider {
  async boot() {
    const vite = await this.app.container.make("vite");
    vite.setManifestPath("public/assets/manifest.json");

    // Can also read the manifest file :
    const manifest = vite.manifest();
    console.log(manifest);
  }
}
```
