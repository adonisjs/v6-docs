---
summary: 学习如何在 AdonisJS 中使用 Edge.js 进行模板渲染
---

# EdgeJS

Edge 是一个 **简单**、**现代** 且 **功能齐全** 的模板引擎，由 AdonisJS 核心团队为 Node.js 创建和维护。Edge 的语法类似于编写 JavaScript。如果你懂 JavaScript，你就懂 Edge。

:::note
Edge 的文档可在 [https://edgejs.dev](https://edgejs.dev) 上查看
:::

## 安装

使用以下命令安装并配置 Edge。

```sh
node ace add edge
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `edge.js` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/core/providers/edge_provider')
      ]
    }
    ```

:::

## 渲染你的第一个模板

配置完成后，你可以使用 Edge 来渲染模板。让我们在 `resources/views` 目录下创建一个 `welcome.edge` 文件。

```sh
node ace make:view welcome
```

打开新创建的文件并写入以下标记。

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

最后，让我们注册一个路由来渲染该模板。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ view }) => {
  return view.render('welcome')
})
```

你也可以使用 `router.on().render` 方法来渲染模板，而无需为路由分配回调函数。

```ts
router.on('/').render('welcome')
```

### 向模板传递数据

你可以通过将对象作为第二个参数传递给 `view.render` 方法来向模板传递数据。

```ts
router.get('/', async ({ view }) => {
  return view.render('welcome', { username: 'romainlanz' })
})
```

## 配置 Edge
你可以通过在 `start` 目录下创建一个 [预加载文件](../concepts/adonisrc_file.md#preloads) 来使用 Edge 插件或向 Edge 添加全局辅助函数。

```sh
node ace make:preload view
```

```ts
// title: start/view.ts
import edge from 'edge.js'
import env from '#start/env'
import { edgeIconify } from 'edge-iconify'

/**
 * 注册插件
 */
edge.use(edgeIconify)

/**
 * 定义全局属性
 */
edge.global('appUrl', env.get('APP_URL'))
```

## 全局辅助函数

请查看 [Edge 辅助函数参考指南](../references/edge.md) 以了解 AdonisJS 提供的辅助函数列表。

## 了解更多

- [Edge.js 文档](https://edgejs.dev)
- [组件](https://edgejs.dev/docs/components/introduction)
- [SVG 图标](https://edgejs.dev/docs/edge-iconify)
- [Adocasts Edge 系列教程](https://adocasts.com/topics/edge)
