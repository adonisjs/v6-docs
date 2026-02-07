---
summary: 了解 AdonisJS 中的身份验证系统以及如何在应用程序中验证用户身份。
---

# 身份验证 (Authentication)

AdonisJS 提供了一个强大且安全的身份验证系统，你可以用它来登录和验证应用程序的用户。无论是服务器端渲染的应用程序、SPA 客户端还是移动应用，你都可以为它们设置身份验证。

身份验证包是围绕 **guards（守卫）** 和 **providers（提供者）** 构建的。

- Guards 是特定登录类型的端到端实现。例如，`session` guard 允许你使用 cookie 和会话来验证用户。同时，`access_tokens` guard 使你能够使用令牌来验证客户端。

- Providers 用于从数据库中查找用户和令牌。你可以使用内置的 providers，也可以实现自己的 providers。


:::note

为了确保应用程序的安全，我们会正确地哈希用户密码和令牌。此外，AdonisJS 的安全原语受到保护，可防止 [时序攻击](https://en.wikipedia.org/wiki/Timing_attack) 和 [会话固定攻击](https://owasp.org/www-community/attacks/Session_fixation)。

:::

## Auth 包不支持的功能

Auth 包专注于验证 HTTP 请求，以下功能不在其范围内：

- 用户注册功能，如 **注册表单**、**电子邮件验证** 和 **账户激活**。
- 账户管理功能，如 **密码恢复** 或 **电子邮件更新**。
- 分配角色或验证权限。请改用 [bouncer](../security/authorization.md) 在应用程序中实现授权检查。


<!-- :::note

**Looking for a fully-fledged user management system?**\

Checkout persona. Persona is an official package and a starter kit with a fully-fledged user management system. 

It provides ready-to-use actions for user registration, email management, session tracking, profile management, and 2FA.

::: -->


## 选择 auth guard

以下内置的身份验证 guards 为你提供了最直接的用户验证工作流程，而不会影响应用程序的安全性。此外，你还可以针对自定义需求 [构建自己的身份验证 guards](./custom_auth_guard.md)。

### Session (会话)

Session guard 使用 [@adonisjs/session](../basics/session.md) 包在会话存储中跟踪登录用户的状态。

会话和 Cookie 已经在互联网上存在很长时间了，对于大多数应用程序来说效果很好。我们建议在以下情况使用 session guard：

- 你正在创建一个服务器端渲染的 Web 应用程序。
- 或者，AdonisJS API 及其客户端位于同一个顶级域名上。例如，`api.example.com` 和 `example.com`。

### Access tokens (访问令牌)

访问令牌是登录成功后发给用户的加密安全随机令牌（也称为不透明访问令牌）。你可以在 AdonisJS 服务器无法读写 Cookie 的应用程序中使用访问令牌。例如：

- 原生移动应用。
- 托管在与 AdonisJS API 服务器不同域上的 Web 应用程序。

使用访问令牌时，客户端应用程序有责任安全地存储它们。访问令牌提供对应用程序的不受限制的访问权限（代表用户），泄露令牌可能会导致安全问题。

### Basic auth (基本认证)

Basic auth guard 是 [HTTP 身份验证框架](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication) 的实现，其中客户端必须通过 `Authorization` 标头传递 Base64 编码的用户凭据字符串。

有比基本身份验证更好的方法来实现安全登录系统。但是，你可以在应用程序处于积极开发阶段时临时使用它。

## 选择用户 provider

如本指南前面所述，用户 provider 负责在身份验证过程中查找用户。

用户 providers 是特定于 guard 的；例如，session guard 的用户 provider 负责通过 ID 查找用户，而 access tokens guard 的用户 provider 还负责验证访问令牌。

我们为内置 guards 提供了 Lucid 用户 provider，它使用 Lucid 模型来查找用户、生成令牌和验证令牌。

<!-- If you are not using Lucid, you must [implement a custom user provider](). -->

## 安装

Auth 系统在 `web` 和 `api` starter kits 中已预先配置。但是，你可以按如下方式在应用程序中手动安装和配置它。

```sh
# 使用会话守卫配置（默认）
node ace add @adonisjs/auth --guard=session

# 使用访问令牌守卫配置
node ace add @adonisjs/auth --guard=access_tokens

# 使用基本身份验证守卫配置
node ace add @adonisjs/auth --guard=basic_auth
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/auth` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/auth/auth_provider')
      ]
    }
    ```

3. 在 `start/kernel.ts` 文件中创建并注册以下中间件。

    ```ts
    router.use([
      () => import('@adonisjs/auth/initialize_auth_middleware')
    ])
    ```

    ```ts
    router.named({
      auth: () => import('#middleware/auth_middleware'),
      // only if using the session guard
      guest: () => import('#middleware/guest_middleware')
    })
    ```

4. 在 `app/models` 目录中创建用户模型。
5. 为 `users` 表创建数据库迁移。
6. 为所选 guard 创建数据库迁移。
:::

## Initialize auth 中间件

在设置过程中，我们在你的应用程序中注册了 `@adonisjs/auth/initialize_auth_middleware`。该中间件负责创建 [Authenticator](https://github.com/adonisjs/auth/blob/main/src/authenticator.ts) 类的实例，并通过 `ctx.auth` 属性将其与请求的其余部分共享。

请注意，initialize auth 中间件不会验证请求或保护路由。它仅用于初始化身份验证器并将其与请求的其余部分共享。你必须使用 [auth](./session_guard.md#protecting-routes) 中间件来保护路由。

此外，同一个身份验证器实例也会与 Edge 模板共享（如果你的应用使用 Edge），你可以使用 `auth` 属性访问它。例如：

```edge
@if(auth.isAuthenticated)
  <p> Hello {{ auth.user.email }} </p>
@end
```

## 创建 users 表

`configure` 命令会在 `database/migrations` 目录中为 `users` 表创建一个数据库迁移。请随意打开此文件并根据你的应用程序要求进行更改。

默认情况下，将创建以下列。

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

此外，如果你在 `users` 表中定义、重命名或删除列，请更新 `User` 模型。

## 下一步

- 了解如何 [验证用户凭据](./verifying_user_credentials.md) 而不损害应用程序的安全性。
- 使用 [session guard](./session_guard.md) 进行有状态身份验证。
- 使用 [access tokens guard](./access_tokens_guard.md) 进行基于令牌的身份验证。
