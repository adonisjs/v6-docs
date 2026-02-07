---
summary: 了解如何使用 Vite 在 AdonisJS 应用程序中打包前端资源。
---

# Vite

AdonisJS 使用 [Vite](https://vitejs.dev/) 来打包应用程序的前端资源。我们提供了一个官方集成，它执行将 Vite 与 AdonisJS 等后端框架集成所需的所有繁重工作。它包括：

- 将 Vite 开发服务器嵌入到 AdonisJS 中。
- 一个专用的 Vite 插件，用于简化配置选项。
- Edge 帮助程序和标签，用于为 Vite 处理的资源生成 URL。
- 访问 [Vite Runtime API](https://vitejs.dev/guide/api-vite-runtime.html#vite-runtime-api) 以执行服务端渲染 (SSR)。

Vite 嵌入在 AdonisJS 开发服务器中，每个应由 Vite 处理的请求都通过 AdonisJS 中间件代理给它。它允许我们直接访问 Vite 的运行时 API 来执行服务端渲染 (SSR) 并管理单个开发服务器。这也意味着资源由 AdonisJS 直接提供，而不是由单独的进程提供。

:::tip
仍在使用 @adonisjs/vite 2.x？[查看迁移指南](https://github.com/adonisjs/vite/releases/tag/v3.0.0) 以升级到最新版本。
:::

## 安装

首先，确保至少安装了以下版本的 AdonisJS：

- `@adonisjs/core`: 6.9.1 或更高版本
- `@adonisjs/assembler`: 7.7.0 或更高版本

然后安装并配置 `@adonisjs/vite` 包。以下命令安装该包和 `vite`，并通过创建必要的配置文件来配置项目。

```sh
// title: npm
node ace add @adonisjs/vite
```

:::disclosure{title="查看 configure 命令执行的步骤"}

1. 在 `adonisrc.ts` 文件中注册以下服务提供者。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/vite/vite_provider')
      ]
    }
    ```

2. 创建 `vite.config.ts` 和 `config/vite.ts` 配置文件。

3. 创建前端入口点文件，即 `resources/js/app.js`。

:::

完成后，将以下内容添加到你的 `adonisrc.ts` 文件中。

```ts
import { defineConfig } from '@adonisjs/core/build/standalone'

export default defineConfig({
  // highlight-start
  assetsBundler: false,
  hooks: {
    onBuildStarting: [() => import('@adonisjs/vite/build_hook')],
  },
  // highlight-end
})
```

`assetsBundler` 属性设置为 `false` 以关闭 AdonisJS Assembler 完成的资源打包器管理。

`hooks` 属性注册 `@adonisjs/vite/build_hook` 以执行 Vite 构建过程。有关更多信息，请参阅 [Assembler hooks](../concepts/assembler_hooks.md)。


## 配置
设置过程会创建两个配置文件。`vite.config.ts` 文件用于配置 Vite 打包器，后端上的 AdonisJS 使用 `config/vite.ts`。

### Vite 配置文件
`vite.config.ts` 文件是 Vite 使用的常规配置文件。根据你的项目要求，你可以在此文件中安装和注册其他 Vite 插件。

默认情况下，`vite.config.ts` 文件使用 AdonisJS 插件，该插件接受以下选项。

```ts
// title: vite.config.ts
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    adonisjs({
      entrypoints: ['resources/js/app.js'],
      reload: ['resources/views/**/*.edge'],
    }),
  ]
})
```

<dl>

<dt>
entrypoints
</dt>

<dd>

`entrypoints` 指的是前端代码库的入口点文件。通常，它将是带有额外导入的 JavaScript 或 TypeScript 文件。每个入口点都会产生一个单独的输出包。

此外，如果需要，你可以定义多个入口点。例如，一个用于面向用户的应用程序的入口点，另一个用于管理面板的入口点。

</dd>

<dt>
buildDirectory
</dt>

<dd>

`buildDirectory` 选项定义输出目录的相对路径。选项值作为 [`build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) 选项提供给 Vite。

如果你决定更改默认值，请确还要更新 `config/vite.ts` 文件中的 `buildDirectory` 路径。

**默认值: public/assets**

</dd>

<dt>
reload
</dt>

<dd>

它包含要在文件更改时监视并重新加载浏览器的 glob 模式数组。默认情况下，我们监视 Edge 模板。但是，你也可以配置其他模式。

</dd>

<dt>
assetsUrl
</dt>

<dd>

它包含在生产环境中为资源生成链接时要添加的前缀 URL。如果你将 Vite 输出上传到 CDN，则此属性的值应该是 CDN 服务器 URL。

确保更新后端配置以使用相同的 `assetsUrl` 值。

</dd>
</dl>

---

### AdonisJS 配置文件
AdonisJS 在后端使用 `config/vite.ts` 文件来了解 Vite 构建过程的输出路径。

```ts
// title: config/vite.ts
import { defineConfig } from '@adonisjs/vite'

const viteBackendConfig = defineConfig({
  buildDirectory: 'public/assets',
  assetsUrl: '/assets',
})

export default viteBackendConfig
```

<dl>

<dt>
buildDirectory
</dt>

<dd>

它包含 Vite 构建输出目录的路径。如果你更改 `vite.config.ts` 文件中的默认值，则还必须更新此后端配置。

</dd>

<dt>
assetsUrl
</dt>

<dd>

在生产环境中为资源生成链接时要添加的前缀 URL。如果你将 Vite 输出上传到 CDN，则此属性的值应该是 CDN 服务器 URL。

</dd>

<dt>
scriptAttributes
</dt>

<dd>

你可以使用 `scriptAttributes` 属性在使 `@vite` 标签生成的脚本标签上设置属性。属性是键值对的集合。

```ts
// title: config/vite.ts
defineConfig({
  scriptAttributes: {
    defer: true,
    async: true,
  }
})
```

</dd>

<dt>
styleAttributes
</dt>

<dd>

你可以使用 `styleAttributes` 属性在使用 `@vite` 标签生成的链接标签上设置属性。属性是键值对的集合。

```ts
// title: config/vite.ts
defineConfig({
  styleAttributes: {
    'data-turbo-track': 'reload'
  }
})
```

你还可以通过将函数分配给 `styleAttributes` 选项来有条件地应用属性。

```ts
defineConfig({
  styleAttributes: ({ src, url }) => {
    if (src === 'resources/css/admin.css') {
      return {
        'data-turbo-track': 'reload'
      }
    }
  }
})
```

</dd>

</dl>

## 前端资源的文件夹结构
从技术上讲，AdonisJS 不强制要求任何文件夹结构来存储你的前端资源。你可以按自己的喜好组织它们。

但是，我们建议将前端资源存储在 `resources` 文件夹中，并将每个资源类放在其子目录中。

```
resources
└── css
└── js
└── fonts
└── images
```

vite 输出将位于 `public/assets` 文件夹中。我们选择 `/assets` 子目录，以便你可以继续将 `public` 文件夹用于你不希望使用 Vite 处理的其他静态文件。

## 启动开发服务器

你可以像往常一样启动应用程序，AdonisJS 将自动将所需的请求代理给 Vite。

```sh
node ace serve --hmr
```

## 在 Edge 模板中包含入口点
你可以使用 `@vite` Edge 标签为 `vite.config.ts` 文件中定义的入口点渲染脚本和样式标签。该标签接受入口点数组并返回 `script` 和 `link` 标签。

```edge
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    // highlight-start
    @vite(['resources/js/app.js'])
    // highlight-end
</head>
<body>
    
</body>
</html>
```

我们建议在你的 JavaScript 文件中导入 CSS 文件，而不是将其作为入口点单独注册。例如：

```
resources
└── css
    └── app.css
└── js
    └── app.js
```

```js
// title: resources/js/app.js
import '../css/app.css'
```

## 在 Edge 模板中引用资源
Vite 创建由入口点导入的文件的依赖关系图，并根据打包输出自动更新其路径。但是，Vite 不知道 Edge 模板，无法检测其引用的资源。

因此，我们提供了一个 Edge 帮助程序，你可以使用它为 Vite 处理的文件创建 URL。在以下示例中：

- `asset` 帮助程序将在开发期间返回指向 Vite 开发服务器的 URL。
- 在生产期间返回指向输出文件名的 URL。

```edge
<link rel="stylesheet" href="{{ asset('resources/css/app.css') }}">
```

```html
// title: Output in development
<link rel="stylesheet" href="http://localhost:5173/resources/css/app.css">
```

```html
// title: Output in production
<link rel="stylesheet" href="/assets/app-3bc29777.css">
```

## 使用 Vite 处理其他资源
Vite 会忽略前端代码未导入的静态资源。它可能只是 Edge 模板中引用的静态图像、字体或 SVG 图标。

因此，你必须使用其 [Glob imports](https://vitejs.dev/guide/features.html#glob-import) API 通知 Vite 这些资源的存在。

在以下示例中，我们要求 Vite 处理 `resources/images` 目录中的所有文件。此代码应写在入口点文件中。

```js
// title: resources/js/app.js
import.meta.glob(['../images/**'])
```

现在，你可以按如下方式在 Edge 模板中引用图像。

```edge
<img src="{{ asset('resources/images/hero.jpg') }}" />
```

## 配置 TypeScript
如果你打算在前端代码库中使用 TypeScript，请在 `resources` 目录中创建一个额外的 `tsconfig.json` 文件。Vite 和你的代码编辑器将自动使用此配置文件处理 `resources` 目录中的 TypeScript 源代码。

```json
// title: resources/tsconfig.json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "lib": ["DOM"],
    "jsx": "preserve", // If you are using React
    "paths": {
      "@/*": ["./js/*"]
    }
  }
}
```

## 使用 React 启用 HMR
要在开发期间启用 [react-refresh](https://www.npmjs.com/package/react-refresh)，你必须使用 `@viteReactRefresh` Edge 标签。它应该在你使用 `@vite` 标签包含入口点之前编写。

```edge
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    // highlight-start
    @viteReactRefresh()
    @vite(['resources/js/app.js'])
    // highlight-end
</head>
<body>
    
</body>
</html>
```

完成后，你可以像在常规 Vite 项目中一样配置 React 插件。

```ts
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    adonisjs({
      entrypoints: ["resources/js/app.js"],
    }),
    // highlight-start
    react(),
    // highlight-end
  ],
})
```

## 将资源部署到 CDN
使用 Vite 创建生产构建后，你可以将打包后的输出上传到 CDN 服务器以提供文件。

但是，在执行此操作之前，你必须向 Vite 和 AdonisJS 注册你的 CDN 服务器的 URL，以便 `manifest.json` 文件或延迟加载块中的输出 URL 应指向你的 CDN 服务器。

你必须在 `vite.config.ts` 和 `config/vite.ts` 文件中定义 `assetsUrl`。

```ts
// title: vite.config.ts
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    adonisjs({
      entrypoints: ['resources/js/app.js'],
      reloads: ['resources/views/**/*.edge'],
      // highlight-start
      assetsUrl: 'https://cdn.example.com/',
      // highlight-end
    }),
  ]
})
```

```ts
// title: config/vite.ts
import { defineConfig } from '@adonisjs/vite'

const viteBackendConfig = defineConfig({
  buildDirectory: 'public/assets',
  // highlight-start
  assetsUrl: 'https://cdn.example.com/',
  // highlight-end
})

export default viteBackendConfig
```

## 高级概念

### 中间件模式

在旧版本的 AdonisJS 中，Vite 作为单独的进程生成，并拥有自己的开发服务器。

在 3.x 版本中，Vite 嵌入在 AdonisJS 开发服务器中，每个应由 Vite 处理的请求都通过 AdonisJS 中间件代理给它。

中间件模式的优点是我们可以直接访问 Vite 的运行时 API 来执行服务端渲染 (SSR) 并拥有一个要管理的开发服务器。

你可以在 [Vite 文档](https://vitejs.dev/guide/ssr#setting-up-the-dev-server) 中阅读有关中间件模式的更多信息。

### 清单文件
Vite 会在资源的生产构建旁边生成 [清单文件](https://vitejs.dev/guide/backend-integration.html)。

清单文件包含 Vite 处理的资源的 URL，AdonisJS 使用此文件为使用 `asset` 帮助程序或 `@vite` 标签在 Edge 模板中引用的资源创建 URL。
