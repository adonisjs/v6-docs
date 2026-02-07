---
summary: 了解如何在 AdonisJS 中使用 session guard 验证用户。
---

# 会话守卫

Session guard 使用 [@adonisjs/session](../basics/session.md) 包在 HTTP 请求期间登录和验证用户。

会话和 Cookie 已经在互联网上存在很长时间了，对于大多数应用程序来说效果很好。因此，我们建议对服务器端渲染的应用程序或同一顶级域名上的 SPA Web 客户端使用 session guard。

## 配置 guard

身份验证 guards 在 `config/auth.ts` 文件中定义。你可以在此文件中的 `guards` 对象下配置多个 guards。

```ts
// title: config/auth.ts
import { defineConfig } from '@adonisjs/auth'
// highlight-start
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
// highlight-end

const authConfig = defineConfig({
  default: 'web',
  guards: {
    // highlight-start
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    })
    // highlight-end
  },
})

export default authConfig
```

`sessionGuard` 方法创建 [SessionGuard](https://github.com/adonisjs/auth/blob/main/modules/session_guard/guard.ts) 类的实例。它接受一个用户 provider（可用于在身份验证期间查找用户）和一个可选的配置对象（用于配置 remember tokens 行为）。

`sessionUserProvider` 方法创建 [SessionLucidUserProvider](https://github.com/adonisjs/auth/blob/main/modules/session_guard/user_providers/lucid.ts) 类的实例。它接受一个对用于身份验证的模型的引用。

## 执行登录

你可以使用 guard 中的 `login` 方法登录用户。该方法接受 User 模型的实例并为他们创建登录会话。

在以下示例中：

- 我们使用 [AuthFinder mixin](./verifying_user_credentials.md#using-the-auth-finder-mixin) 中的 `verifyCredentials` 通过电子邮件和密码查找用户。

- `auth.use('web')` 返回在 `config/auth.ts` 文件中配置的 [SessionGuard](https://github.com/adonisjs/auth/blob/main/modules/session_guard/guard.ts) 实例（`web` 是你在配置中定义的 guard 的名称）。

- 接下来，我们调用 `auth.use('web').login(user)` 方法为用户创建登录会话。

- 最后，我们将用户重定向到 `/dashboard` 端点。请随意自定义重定向端点。

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    // highlight-start
    /**
     * 步骤 1: 从请求体中获取凭据
     */
    const { email, password } = request.only(['email', 'password'])

    /**
     * 步骤 2: 验证凭据
     */
    const user = await User.verifyCredentials(email, password)

    /**
     * 步骤 3: 登录用户
     */
    await auth.use('web').login(user)

    /**
     * 步骤 4: 将他们发送到受保护的路由
     */
    response.redirect('/dashboard')
    // highlight-end
  }
}
```

## 保护路由

你可以使用 `auth` 中间件保护路由免受未经身份验证的用户的访问。该中间件在 `start/kernel.ts` 文件中的命名中间件集合下注册。

```ts
import router from '@adonisjs/core/services/router'

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware')
})
```

将 `auth` 中间件应用于你要保护免受未经身份验证的用户访问的路由。

```ts
// highlight-start
import { middleware } from '#start/kernel'
// highlight-end
import router from '@adonisjs/core/services/router'

router
 .get('dashboard', () => {})
 // highlight-start
 .use(middleware.auth())
 // highlight-end
```

默认情况下，auth 中间件将根据 `default` guard（如配置文件中所定义）对用户进行身份验证。但是，在分配 `auth` 中间件时，你可以指定一个 guards 数组。

在以下示例中，auth 中间件将尝试使用 `web` 和 `api` guards 对请求进行身份验证。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
 .get('dashboard', () => {})
 // highlight-start
 .use(
   middleware.auth({
     guards: ['web', 'api']
   })
 )
 // highlight-end
```

### 处理身份验证异常

如果用户未通过身份验证，auth 中间件会抛出 [E_UNAUTHORIZED_ACCESS](https://github.com/adonisjs/auth/blob/main/src/errors.ts#L21)。该异常将使用以下内容协商规则自动处理。

- 带有 `Accept=application/json` 标头的请求将收到一个带有 `message` 属性的错误数组。

- 带有 `Accept=application/vnd.api+json` 标头的请求将收到一个根据 [JSON API](https://jsonapi.org/format/#errors) 规范的错误数组。

- 对于服务器端渲染的应用程序，用户将被重定向到 `/login` 页面。你可以在 `auth` 中间件类中配置重定向端点。

## 获取已登录用户的访问权限

你可以使用 `auth.user` 属性访问已登录的用户实例。该值仅在使用 `auth` 或 `silent_auth` 中间件或者你手动调用 `auth.authenticate` 或 `auth.check` 方法时才可用。

```ts
// title: 使用 auth 中间件
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    await auth.user!.getAllMetrics()
    // highlight-end
  })
  .use(middleware.auth())
```

```ts
// title: 手动调用 authenticate 方法
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    /**
     * 首先，验证用户
     */
    await auth.authenticate()

    /**
     * 然后访问用户对象
     */ 
    await auth.user!.getAllMetrics()
    // highlight-end
  })
```

### Silent auth 中间件

`silent_auth` 中间件类似于 `auth` 中间件，但在用户未通过身份验证时不会抛出异常。相反，请求仍会照常继续。

当你希望始终对用户进行身份验证以执行某些操作，但不希望在用户未通过身份验证时阻止请求时，此中间件非常有用。

如果你打算使用此中间件，则必须在 [路由中间件](../basics/middleware.md#router-middleware-stack) 列表中注册它。

```ts
// title: start/kernel.ts
import router from '@adonisjs/core/services/router'

router.use([
  // ...
  () => import('#middleware/silent_auth_middleware')
])
```

### 检查请求是否已通过身份验证

你可以使用 `auth.isAuthenticated` 标志检查请求是否已通过身份验证。对于经过身份验证的请求，`auth.user` 的值将始终已定义。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    if (auth.isAuthenticated) {
      await auth.user!.getAllMetrics()
    }
    // highlight-end
  })
  .use(middleware.auth())
```

### 获取已认证用户或失败

如果你不喜欢在 `auth.user` 属性上使用 [非空断言运算符](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-)，可以使用 `auth.getUserOrFail` 方法。此方法将返回用户对象或抛出 [E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access) 异常。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    const user = auth.getUserOrFail()
    await user.getAllMetrics()
    // highlight-end
  })
  .use(middleware.auth())
```

### 在 Edge 模板中访问用户

[InitializeAuthMiddleware](./introduction.md#the-initialize-auth-middleware) 还与 Edge 模板共享 `ctx.auth` 属性。因此，你可以通过 `auth.user` 属性访问当前登录的用户。

```edge
@if(auth.isAuthenticated)
  <p> Hello {{ auth.user.email }} </p>
@end
```

如果你想在非受保护的路由上获取已登录的用户信息，可以使用 `auth.check` 方法检查用户是否已登录，然后访问 `auth.user` 属性。这方面的一个很好的用例是在公共页面的网站标题上显示已登录的用户信息。

```edge
{{--
  这是一个公共页面；因此，它不受 auth 中间件保护。
  但是，我们仍然希望在网站标题中显示已登录的用户信息。

  为此，我们使用 `auth.check` 方法静默检查用户是否已登录，
  然后在标题中显示他们的电子邮件。

  你应该明白了吧！
--}}

@eval(await auth.check())

<header>
  @if(auth.isAuthenticated)
    <p> Hello {{ auth.user.email }} </p>
  @end
</header>
```

## 执行注销

你可以使用 `guard.logout` 方法注销用户。在注销期间，用户状态将从会话存储中删除。当前活动的“记住我”令牌也将被删除（如果使用“记住我”令牌）。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .post('logout', async ({ auth, response }) => {
    await auth.use('web').logout()
    return response.redirect('/login')
  })
  .use(middleware.auth())
```

## 使用“记住我”功能

“记住我”功能会在用户会话过期后自动登录用户。这是通过生成加密安全令牌并将其作为 Cookie 保存在用户浏览器中来实现的。

用户会话过期后，AdonisJS 将使用“记住我” Cookie，验证令牌的有效性，并自动为用户重新创建登录会话。

### 创建 Remember Me Tokens 表

“记住我”令牌保存在数据库中，因此，你必须创建一个新的迁移来创建 `remember_me_tokens` 表。

```sh
node ace make:migration remember_me_tokens
```

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'remember_me_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments()
      table
        .integer('tokenable_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('hash').notNullable().unique()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.timestamp('expires_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 配置令牌 provider

要读取/写入令牌，你必须将 [DbRememberMeTokensProvider](https://github.com/adonisjs/auth/blob/main/modules/session_guard/token_providers/db.ts) 分配给 User 模型。

```ts
import { BaseModel } from '@adonisjs/lucid/orm'
// highlight-start
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
// highlight-end

export default class User extends BaseModel {
  // ...rest of the model properties

  // highlight-start
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
  // highlight-end
}
```

### 在配置中启用 Remember Me 令牌

最后，让我们在 `config/auth.ts` 文件中的 session guard 配置上启用 `useRememberTokens` 标志。

```ts
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      // highlight-start
      useRememberMeTokens: true,
      rememberMeTokensAge: '2 years',
      // highlight-end
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    })
  },
})

export default authConfig
```

### 在登录期间记住用户

设置完成后，你可以使用 `guard.login` 方法生成“记住我”令牌和 Cookie，如下所示。

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)

    await auth.use('web').login(
      user,
      // highlight-start
      /**
       * 当 "remember_me" 输入存在时生成令牌
       */
      !!request.input('remember_me')
      // highlight-end
    )
    
    response.redirect('/dashboard')
  }
}
```

## 使用 guest 中间件

Auth 包附带了一个 guest 中间件，你可以使用它来重定向已登录的用户，阻止其访问 `/login` 页面。这样做是为了避免在单个设备上为单个用户创建多个会话。

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .get('/login', () => {})
  .use(middleware.guest())
```

默认情况下，guest 中间件将使用 `default` guard（如配置文件中所定义）检查用户登录状态。但是，在分配 `guest` 中间件时，你可以指定一个 guards 数组。

```ts
router
  .get('/login', () => {})
  .use(middleware.guest({
    guards: ['web', 'admin_web']
  }))
```

最后，你可以在 `./app/middleware/guest_middleware.ts` 文件中为已登录的用户配置重定向路由。

## 事件

请查看 [事件参考指南](../references/events.md#session_authcredentials_verified) 以查看 Auth 包发出的可用事件列表。
