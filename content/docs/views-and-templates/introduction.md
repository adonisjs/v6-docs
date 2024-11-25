---
summary: Available options for rendering views and templates in AdonisJS
---

# Views and Templates

AdonisJS is an excellent fit for creating traditional server-rendered applications in Node.js. If you enjoy the simplicity of using a backend template engine that outputs HTML without any overhead of Virtual DOM and build tools, then this guide is for you.

The typical workflow of a server-rendered application in AdonisJS looks as follows.

- Choose a template engine to render HTML dynamically.
- Use [Vite](../basics/vite.md) for bundling CSS and frontend JavaScript.
- Optionally, you can opt for libraries like [HTMX](https://htmx.org/) or [Unpoly](https://unpoly.com/) to progressively enhance your application and navigate like an SPA.

:::note
The AdonisJS core team has created a framework-agnostic template engine called [Edge.js](https://edgejs.dev) but does not force you to use it. You can use any other template engine you would like inside an AdonisJS application.
:::

## Popular options

Following is the list of popular template engines you can use inside an AdonisJS application (just like any other Node.js application).

- [**EdgeJS**](https://edgejs.dev) is a simple, modern, and batteries included template engine created and maintained by the AdonisJS core team for Node.js.
- [**Pug**](https://pugjs.org) is a template engine heavily influenced by Haml.
- [**Nunjucks**](https://mozilla.github.io/nunjucks) is a rich feature template engine inspired by Jinja2.

## Hybrid applications

AdonisJS is also a great fit for creating hybrid applications that render HTML on the server and then hydrate your JavaScript on the client. This approach is popular among developers who want to use `Vue`, `React`, `Svelte`, `Solid`, or others for building interactive user interfaces but still want a full backend stack to handle server-side concerns.

In this case, AdonisJS provide a first-class support for using [InertiaJS](./inertia.md) to bridge the gap between your frontend and backend.
