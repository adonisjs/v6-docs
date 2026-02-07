---
summary: 学习如何在 AdonisJS 中使用 Inertia，结合你喜爱的前端框架创建服务端渲染应用。
---

# Inertia

[Inertia](https://inertiajs.com/) 是一种框架无关的方法，可以在没有现代 SPA 复杂性的情况下创建单页应用 (SPA)。

它是传统服务端渲染应用（使用模板引擎）和现代 SPA（使用客户端路由和状态管理）之间的一个绝佳中间地带。

使用 Inertia，你可以使用你喜爱的前端框架（Vue.js、React、Svelte 或 Solid.js）创建 SPA，而无需创建单独的 API。

:::codegroup

```ts
// title: app/controllers/users_controller.ts
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index({ inertia }: HttpContext) {
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


## 安装

:::note
你是要开始一个新项目并想使用 Inertia 吗？查看 [Inertia 启动套件](https://docs.adonisjs.com/guides/getting-started/installation#inertia-starter-kit)。
:::

运行以下命令从 npm 仓库安装该包：

:::codegroup

```sh
// title: npm
npm i @adonisjs/inertia
```

:::

完成后，运行以下命令来配置该包。

```sh
node ace configure @adonisjs/inertia
```

:::disclosure{title="查看 configure 命令执行的步骤"}

1. 在 `adonisrc.ts` 文件中注册以下服务提供者和命令。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/inertia/inertia_provider')
      ]
    }
    ```
2. 在 `start/kernel.ts` 文件中注册以下中间件。

   ```ts
   router.use([() => import('@adonisjs/inertia/inertia_middleware')])
   ```

3. 创建 `config/inertia.ts` 文件。

4. 复制一些存根文件到你的应用中，帮助你快速开始。每个复制的文件都针对之前选择的前端框架进行了适配。

  1. 创建一个 `./resources/views/inertia_layout.edge` 文件，该文件将用于渲染启动 Inertia 的 HTML 页面。

  2. 创建一个 `./inertia/css/app.css` 文件，其中包含样式化 `inertia_layout.edge` 视图所需的内容。

  3. 创建一个 `./inertia/tsconfig.json` 文件，以区分服务端和客户端的 TypeScript 配置。

  4. 创建一个 `./inertia/app/app.ts` 用于引导 Inertia 和你的前端框架。

  5. 创建一个 `./inertia/pages/home.{tsx|vue|svelte}` 文件来渲染应用的主页。

  6. 创建 `./inertia/pages/server_error.{tsx|vue|svelte}` 和 `./inertia/pages/not_found.{tsx|vue|svelte}` 文件来渲染错误页面。

  7. 在 `vite.config.ts` 文件中添加正确的 vite 插件以编译你的前端框架。

  8. 在 `start/routes.ts` 文件中添加一个 `/` 的哑路由 (dumb route)，作为使用 Inertia 渲染主页的示例。
 
5. 根据选择的前端框架安装相应的包。

:::

完成后，你应该就可以在 AdonisJS 应用中使用 Inertia 了。启动你的开发服务器，访问 `localhost:3333` 查看使用你选择的前端框架通过 Inertia 渲染的主页。

:::note
**阅读 [Inertia 官方文档](https://inertiajs.com/)**。

Inertia 是一个后端无关的库。我们只是创建了一个适配器使其能与 AdonisJS 一起工作。在阅读本文档之前，你应该先熟悉 Inertia 的概念。

**本文档仅涵盖 AdonisJS 特定的部分。**
:::

## 客户端入口点

如果你使用了 `configure` 或 `add` 命令，该包已经在 `inertia/app/app.ts` 创建了一个入口文件，所以你可以跳过此步骤。

基本上，这个文件将是你前端应用的主要入口点，用于引导 Inertia 和你的前端框架。这个文件应该是被你的根 Edge 模板通过 `@vite` 标签加载的入口点。

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
      `../pages/${name}.vue`,
      import.meta.glob<DefineComponent>('../pages/**/*.vue'),
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

这个文件的作用是创建一个 Inertia 应用并解析页面组件。当你使用 `inertia.render` 时编写的页面组件名称将被传递给 `resolve` 函数，该函数的作用是返回需要渲染的组件。

## 渲染页面

配置包时，`start/kernel.ts` 文件中注册了一个 `inertia_middleware`。该中间件负责在 [`HttpContext`](../concepts/http_context.md) 上设置 `inertia` 对象。

要使用 Inertia 渲染视图，请使用 `inertia.render` 方法。该方法接受视图名称和作为 props 传递给组件的数据。

```ts
// title: app/controllers/home_controller.ts
export default class HomeController {
  async index({ inertia }: HttpContext) {
    // highlight-start
    return inertia.render('home', { user: { name: 'julien' } })
    // highlight-end
  }
}
```

看到传递给 `inertia.render` 方法的 `home` 了吗？它应该是相对于 `inertia/pages` 目录的组件文件路径。这里我们渲染的是 `inertia/pages/home.(vue,tsx)` 文件。

你的前端组件将接收 `user` 对象作为一个 prop：

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

就是这么简单。

:::warning
向前端传递数据时，一切都会被序列化为 JSON。不要期望传递模型实例、日期或其他复杂对象。
:::

### 根 Edge 模板

根模板是一个常规的 Edge 模板，将在访问应用的第一个页面时加载。你应该在这里包含 CSS 和 Javascript 文件，以及 `@inertia` 标签。一个典型的根模板如下所示：

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

你可以在 `config/inertia.ts` 文件中配置根模板路径。默认情况下，它假定你的模板位于 `resources/views/inertia_layout.edge`。

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  // 根模板相对于 
  // `resources/views` 目录的路径
  rootView: 'app_root', 
})
```

如果需要，你可以将一个函数传递给 `rootView` 属性，以动态决定使用哪个根模板。

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

### 根模板数据

你可能希望与根 Edge 模板共享数据。例如，添加 meta 标题或 open graph 标签。你可以通过使用 `inertia.render` 方法的第三个参数来实现：

```ts
// title: app/controllers/posts_controller.ts
export default class PostsController {
  async index({ inertia }: HttpContext) {
    return inertia.render('posts/details', post, {
      // highlight-start
      title: post.title,
      description: post.description
      // highlight-end
    })
  }
}
```

现在 `title` 和 `description` 将在根 Edge 模板中可用：

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

## 重定向

在 AdonisJS 中你应该这样做：

```ts
export default class UsersController {
  async store({ response }: HttpContext) {
    await User.create(request.body())

    // 👇 你可以使用标准的 AdonisJS 重定向
    return response.redirect().toRoute('users.index')
  }

  async externalRedirect({ inertia }: HttpContext) {
    // 👇 或者使用 inertia.location 进行外部重定向
    return inertia.location('https://adonisjs.com')
  }
}
```

更多信息请参阅 [官方文档](https://inertiajs.com/redirects)。

## 与所有视图共享数据

有时，你可能需要跨多个视图共享相同的数据。例如，我们与所有视图共享当前用户信息。如果要在每个控制器中都这样做会变得很繁琐。幸运的是，我们有两种解决方案。

### `sharedData`

在 `config/inertia.ts` 文件中，你可以定义一个 `sharedData` 对象。此对象允许你定义应与所有视图共享的数据。

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  sharedData: {
    appName: 'My App', // 👈 这将在所有视图中可用
    user: (ctx) => ctx.auth?.user, // 👈 作用域为当前请求
  },
})
```

### 从中间件共享

有时，从中间件而不是 `config/inertia.ts` 文件共享数据可能更方便。你可以通过使用 `inertia.share` 方法来实现：

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class MyMiddleware {
  async handle({ inertia, auth }: HttpContext, next: NextFn) {
    inertia.share({
      appName: 'My App',
      user: (ctx) => ctx.auth?.user
    })
  }
}
```

## 部分重载 & 懒数据求值

首先阅读 [官方文档](https://inertiajs.com/partial-reloads) 以了解什么是部分重载以及它们是如何工作的。

关于懒数据求值，在 AdonisJS 中是这样工作的：

```ts
export default class UsersController {
  async index({ inertia }: HttpContext) {
    return inertia.render('users/index', {
      // 首次访问时总是包含。
      // 部分重载时可选包含。
      // 总是求值
      users: await User.all(),

      // 首次访问时总是包含。
      // 部分重载时可选包含。
      // 仅在需要时求值
      users: () => User.all(),

      // 首次访问时从不包含。
      // 部分重载时可选包含。
      // 仅在需要时求值
      users: inertia.optional(() => User.all())
    }),
  }
}
```

## 类型共享

通常，你会希望共享传递给前端页面组件的数据类型。一个简单的方法是使用 `InferPageProps` 类型。

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
  // 👇 它将根据你在控制器中传递给 inertia.render 的内容
  // 正确地进行类型推断
  props: InferPageProps<UsersController, 'index'>
) {
  return (
    // ...
  )
}
```

:::

如果你使用 Vue，你必须在 `defineProps` 中手动定义每个属性。这是 Vue 的一个令人恼火的限制，更多信息请查看 [此 issue](https://github.com/vitejs/vite-plugin-vue/issues/167)。

```vue
<script setup lang="ts">
import { InferPageProps } from '@adonisjs/inertia/types'

defineProps<{
  // 👇 你必须手动定义每个 prop
  users: InferPageProps<UsersController, 'index'>['users'],
  posts: InferPageProps<PostsController, 'index'>['posts'],
}>()

</script>
```


### 引用指令

由于你的 Inertia 应用是一个单独的 TypeScript 项目（有自己的 `tsconfig.json`），你需要帮助 TypeScript 理解某些类型。我们的许多官方包使用 [模块扩展 (module augmentation)](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) 向你的 AdonisJS 项目添加特定类型。

例如，`HttpContext` 上的 `auth` 属性及其类型仅在你将 `@adonisjs/auth/initialize_auth_middleware` 导入项目时才可用。现在的问题是，我们在 Inertia 项目中没有导入这个模块，所以如果你尝试从使用 `auth` 的控制器推断页面 props，那么你可能会收到 TypeScript 错误或无效类型。

为了解决这个问题，你可以使用 [引用指令](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-path-) 来帮助 TypeScript 理解某些类型。为此，你需要在 `inertia/app/app.ts` 文件中添加以下行：

```ts
/// <reference path="../../adonisrc.ts" />
```

根据你使用的类型，你可能需要添加其他引用指令，例如引用也使用模块扩展的某些配置文件。

```ts
/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/ally.ts" />
/// <reference path="../../config/auth.ts" />
```

### 类型级序列化

关于 `InferPageProps` 需要知道的一个重要事项是，它将对你传递的数据进行“类型级序列化”。例如，如果你将 `Date` 对象传递给 `inertia.render`，`InferPageProps` 得到的类型将是 `string`：

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

这非常有道理，因为日期在通过网络以 JSON 传输时会被序列化为字符串。

### 模型序列化

记住上一点，另一个需要知道的重要事项是，如果你将 AdonisJS 模型传递给 `inertia.render`，那么 `InferPageProps` 得到的类型将是一个 `ModelObject`：一个几乎不包含任何信息的类型。这可能会有问题。为了解决这个问题，你有几个选择：

- 在将模型传递给 `inertia.render` 之前，将其转换为简单对象：
- 使用 DTO (数据传输对象) 系统将模型转换为简单对象，然后再传递给 `inertia.render`。

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

  toJson() {
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

现在你将在前端组件中拥有准确的类型。

### 共享 Props

要在组件中拥有 [共享数据](#sharing-data-with-all-views) 的类型，请确保在 `config/inertia.ts` 文件中执行了如下模块扩展：

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
    // 如果需要，你也可以手动添加一些共享 props，
    // 例如从中间件共享的 props
    propsSharedFromAMiddleware: number;
  }
}
```

另外，请确保在 `inertia/app/app.ts` 文件中添加此 [引用指令](#reference-directives)：

```ts
/// <reference path="../../config/inertia.ts" />
```
