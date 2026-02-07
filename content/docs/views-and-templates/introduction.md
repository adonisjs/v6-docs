---
summary: AdonisJS 中视图和模板的渲染选项
---

# 视图与模板

AdonisJS 非常适合使用 Node.js 创建传统的服务端渲染应用。如果你喜欢使用简单直接的后端模板引擎来输出 HTML，而不需要 Virtual DOM 和构建工具带来的额外开销，那么这篇指南非常适合你。

在 AdonisJS 中，服务端渲染应用的典型工作流程如下：

- 选择一个模板引擎来动态渲染 HTML。
- 使用 [Vite](../basics/vite.md) 打包 CSS 和前端 JavaScript。
- (可选) 你可以选择使用 [HTMX](https://htmx.org/) 或 [Unpoly](https://unpoly.com/) 等库来增强你的应用，使其具有类似 SPA 的导航体验。

:::note
AdonisJS 核心团队创建了一个名为 [Edge.js](https://edgejs.dev) 的框架无关的模板引擎，但并未强制要求你使用它。你可以在 AdonisJS 应用中使用任何你喜欢的其他模板引擎。
:::

## 常用选项

以下是可以在 AdonisJS 应用中使用的常用模板引擎列表（就像在任何其他 Node.js 应用中一样）。

- [**EdgeJS**](https://edgejs.dev) 是一个简单、现代且功能齐全的模板引擎，由 AdonisJS 核心团队为 Node.js 创建和维护。
- [**Pug**](https://pugjs.org) 是一个深受 Haml 影响的模板引擎。
- [**Nunjucks**](https://mozilla.github.io/nunjucks) 是一个受 Jinja2 启发的功能丰富的模板引擎。

## 混合应用

AdonisJS 也非常适合创建混合应用，即在服务端渲染 HTML，然后在客户端“激活” (hydrate) JavaScript。这种方法在那些想要使用 `Vue`、`React`、`Svelte`、`Solid` 等框架构建交互式用户界面，但仍希望拥有完整的后端栈来处理服务端逻辑的开发者中非常流行。

在这种情况下，AdonisJS 对 [InertiaJS](./inertia.md) 提供了从头到尾的支持，以弥合前端和后端之间的差距。
