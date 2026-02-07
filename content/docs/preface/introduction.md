---
summary: "AdonisJS 是一个基于 TypeScript 的 Node.js Web 框架。你可以用它来构建全栈 Web 应用或 JSON API 服务器。"
---

# 介绍

::include{template="partials/introduction_cards"}

## 什么是 AdonisJS？

AdonisJS 是一个优先支持 TypeScript 的 Node.js Web 框架。你可以用它来构建全栈 Web 应用或 JSON API 服务器。

在基础层面，AdonisJS [为你的应用提供结构](../getting_started/folder_structure.md)，配置[无缝的 TypeScript 开发环境](../concepts/typescript_build_process.md)，为后端代码配置 [HMR (热模块替换)](../concepts/hmr.md)，并提供大量维护良好且文档详尽的软件包。

我们设想使用 AdonisJS 的团队可以**花费更少的时间**在琐碎的决策上（例如为每个小功能挑选 npm 包、编写胶水代码、争论完美的目录结构），从而**花费更多的时间**交付对业务至关重要的实际功能。

### 前端无关

AdonisJS 专注于后端，允许你选择自己喜欢的前端技术栈。

如果你喜欢保持简单，可以将 AdonisJS 与[传统模板引擎](../views-and-templates/introduction.md)搭配使用，在服务器端生成静态 HTML；或者为你的前端 Vue/React 应用创建 JSON API；或者使用 [Inertia](../views-and-templates/inertia.md) 让这一且完美融合。

AdonisJS 旨在为你提供从零开始构建健壮后端应用所需的“电池”。无论是发送邮件、验证用户输入、执行 CRUD 操作，还是用户身份验证，我们都已为你准备好。

### 现代且类型安全

AdonisJS 构建在现代 JavaScript 原语之上。我们使用 ES 模块、Node.js 子路径导入别名 (sub-path import aliases)、使用 SWC 执行 TypeScript 源码，并使用 Vite 进行资源打包。

此外，TypeScript 在设计框架 API 时扮演了重要角色。例如，AdonisJS 拥有：

- [类型安全的事件发射器](../digging_deeper/emitter.md#making-events-type-safe)
- [类型安全的环境变量](../getting_started/environment_variables.md)
- [类型安全的验证库](../basics/validation.md)

### 拥抱 MVC

AdonisJS 拥抱经典的 MVC 设计模式。你首先使用函数式 JavaScript API 定义路由，将控制器绑定到路由上，并在控制器内编写处理 HTTP 请求的逻辑。

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'
const PostsController = () => import('#controllers/posts_controller')

router.get('posts', [PostsController, 'index'])
```

控制器可以使用模型 (Models) 从数据库获取数据，并渲染视图（即模板）作为响应。

```ts
// title: app/controllers/posts_controller.ts
import Post from '#models/post'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.all()
    return view.render('pages/posts/list', { posts })
  }
}
```

如果你正在构建 API 服务器，可以将视图层替换为 JSON 响应。但是，处理和响应 HTTP 请求的流程保持不变。

```ts
// title: app/controllers/posts_controller.ts
import Post from '#models/post'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.all()
    // delete-start
    return view.render('pages/posts/list', { posts })
    // delete-end
    // insert-start
    /**
     * Posts 数组将自动序列化为 JSON
     */
    return posts
    // insert-end
  }
}
```

## 指南假设

AdonisJS 文档是作为参考指南编写的，涵盖了核心团队维护的多个包和模块的用法及 API。

**本指南不教你如何从零开始构建应用程序**。如果你在寻找教程，我们建议从 [Adocasts](https://adocasts.com/) 开始你的旅程。Tom (Adocasts 的创建者) 制作了一些高质量的截屏视频，帮助你迈出使用 AdonisJS 的第一步。

话虽如此，本文档广泛涵盖了可用模块的用法以及框架的内部工作原理。

## 最近发布
以下是最近发布的版本列表。[点击这里](./releases.md)查看所有版本。

::include{template="partials/recent_releases"}

## 赞助商

::include{template="partials/sponsors"}
