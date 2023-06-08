# Migrate from Encore to Vite

This guide will help you to migrate your AdonisJS application from Webpack Encore to Vite.

If you encounter a problem or a missing step in the migration guide, feel free to open an issue or propose a PR, as we can't cover all the use cases.

Also make sure to have the [Vite documentation](https://vitejs.dev/guide/) and our [Vite plugin documentation](../http/assets_bundling_vite.md) aside while reading this migration guide.

:::warning
For using Vite as your assets bundler, you will need to use AdonisJS v6.0.0 or higher.
:::

## Installation

First make sure to install the `@adonisjs/vite` package, with Vite

```sh
npm i @adonisjs/vite
npm i -D vite
```

Then configure the package

```sh
node ace configure @adonisjs/vite
```

This command will :

- Create a basic `vite.config.js` file in the root of your project with the minimum configuration needed to run Vite.
- Add the Vite service provider to your RC file.

:::note
Depending on your project, you might need to install other vite plugins. Like `@vitejs/plugin-vue` for Vue.js projects or `@vitejs/plugin-react` for React projects.
:::

## Vite configuration

You should have a new `vite.config.ts` file at the root of your project with the following content :

```ts
// title: vite.config.ts
import { defineConfig } from "vite";
import Adonis from "@adonisjs/vite-plugin-adonis";

export default defineConfig({
  plugins: [
    Adonis({
      entryPoints: ["resources/js/app.ts", "resources/css/app.css"],
    }),
  ],
});
```

Similar to Webpack Encore, you can define multiple entry points by passing an array of strings to the `entryPoints` option.
So make sure to add all your `Encore.addEntry()` calls to your new Vite configuration.

## Vite compatible imports

Vite only supports ES modules, so you will need to replace any `require()` statements with `import`.

## Environment variables

Vite will only load environment variables prefixed with `VITE_`. So make sure to rename the variables you need client-side.

```
// delete-start
MY_FRONT_END_ENV_VAR=http://localhost:3333
// delete-end
// insert-start
VITE_MY_FRONT_END_ENV_VAR=http://localhost:3333
// insert-end
```

Also, with Vite, environment variables are accessible from the `import.meta.env` object and not from `process.env` :

```js
// title: resources/js/app.ts
// delete-start
const url = process.env.MY_FRONT_END_ENV_VAR;
// delete-end
// insert-start
const url = import.meta.env.MY_FRONT_END_ENV_VAR;
// insert-end
```

## Replace @entryPoints with @vite

Make sure to replace your `@entryPointsStyles` and `@entryPointsScripts` tags with the `@vite` tag.

```edge
// title: resources/views/welcome.edge

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdonisJS - A fully featured web framework for Node.js</title>
  // insert-start
  @vite(['resources/js/app.ts', 'resources/css/app.css'])
  // insert-end
  // delete-start
  @entryPointStyles('app')
  @entryPointScripts('app')
  // delete-end
</head>
```

## Typescript, CSS, Tailwind ..

Typescript, CSS, Postcss, Less, Sass, Tailwind: these tools should work out of the box. You don't need to configure anything thanks to Vite.

## Vue

Nothing special except that you need to install the `@vitejs/plugin-vue` plugin and add it to your `vite.config.ts` file.

```ts
// title: vite.config.ts
import { defineConfig } from "vite";
import Adonis from "@adonisjs/vite-plugin-adonis";
import Vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    Adonis({
      entryPoints: {
        app: ["resources/js/app.ts", "resources/css/app.css"],
      },
    }),
    // highlight-start
    Vue(),
    // highlight-end
  ],
});
```

## React

You will need to install the `@vitejs/plugin-react` plugin.

```ts
// title: vite.config.ts
import { defineConfig } from "vite";
import Adonis from "@adonisjs/vite-plugin-adonis";
import React from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    Adonis({
      entryPoints: {
        app: ["resources/js/app.ts", "resources/css/app.css"],
      },
    }),
    // highlight-start
    React(),
    // highlight-end
  ],
});
```

Also, for the HMR to work, you will need to add the following tag in your `edge` files :

```edge
// title: resources/views/welcome.edge

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdonisJS - A fully featured web framework for Node.js</title>
  // highlight-start
  @vite()
  @viteReactRefresh()
  // highlight-end
  @entryPointStyles('app')
  @entryPointScripts('app')
</head>
```

The above example is for Vue.js, but with React or other frameworks, the process is probably almost the same.

## CDN Deployment

If you were using a CDN to serve your resources, you probably did the following with Encore :

```ts
// title: webpack.config.js
if (Encore.isProduction()) {
  Encore.setPublicPath("https://your-cdn-server-url/assets");
  Encore.setManifestKeyPrefix("assets/");
} else {
  Encore.setPublicPath("/assets");
}
```

With Vite, you can do the same thing as follows :

```ts
// title: vite.config.ts

import { defineConfig } from 'vite'
import Adonis from '@adonisjs/vite-plugin-adonis'

export default defineConfig(({ command }) => ({
  plugins: [
    Adonis({
      // ...

      // highlight-start
      assetsUrl: command === "build"
        ? "https://your-cdn-server-url/assets",
        : "/assets"
      // highlight-end

      // ...
    })
  ]
})
```

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

## Uninstall webpack

You can now uninstall webpack from your project by removing the following packages and deleting the `webpack.config.cjs` file :

```bash
npm rm @babel/core @babel/preset-env @symfony/webpack-encore webpack webpack-cli file-loader
rm webpack.config.cjs
```

## Conclusion

You can now enjoy the speed of Vite and the power of AdonisJS. 🔥

Feel free to open PRs or issues on the documentation if you believe we are missing important steps in this guide.
