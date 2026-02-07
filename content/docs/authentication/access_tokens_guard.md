---
summary: 了解如何使用 access tokens guard 来使用访问令牌对 HTTP 请求进行身份验证。
---

# 访问令牌守卫

Access tokens 在服务器无法将 Cookie 持久化在最终用户设备上的 API 上下文中对 HTTP 请求进行身份验证，例如，对 API 的第三方访问或移动应用程序的身份验证。

访问令牌可以以任何格式生成；例如，符合 JWT 标准的令牌称为 JWT 访问令牌，专有格式的令牌称为不透明访问令牌。

AdonisJS 使用不透明的访问令牌，其结构和存储如下。

- 令牌由后缀为 CRC32 校验和的加密安全随机值表示。
- 令牌值的哈希值持久保存在数据库中。此哈希值用于在身份验证时验证令牌。
- 最终令牌值经过 base64 编码，并以 `oat_` 为前缀。前缀可以自定义。
- 前缀和 CRC32 校验和后缀有助于 [秘密扫描工具](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning) 识别令牌并防止其在代码库中泄露。

## 配置 User 模型

在使用 access tokens guard 之前，你必须使用 User 模型设置令牌 provider。**令牌 provider 用于创建、列出和验证访问令牌**。

Auth 包附带了一个数据库令牌 provider，它将令牌持久保存在 SQL 数据库中。你可以按如下方式配置它。

```ts
import { BaseModel } from '@adonisjs/lucid/orm'
// highlight-start
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
// highlight-end

export default class User extends BaseModel {
  // ...rest of the model properties

  // highlight-start
  static accessTokens = DbAccessTokensProvider.forModel(User)
  // highlight-end
}
```

`DbAccessTokensProvider.forModel` 接受 User 模型作为第一个参数，并接受一个选项对象作为第二个参数。

```ts
export default class User extends BaseModel {
  // ...rest of the model properties

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })
}
```

<dl>

<dt>

expiresIn

</dt>

<dd>

令牌过期的持续时间。你可以传递以秒为单位的数值或字符串形式的 [时间表达式](https://github.com/poppinss/utils?tab=readme-ov-file#secondsparseformat)。

默认情况下，令牌是长效的且不会过期。此外，你可以在生成令牌时指定令牌的过期时间。

</dd>

<dt>

prefix

</dt>

<dd>

公开发享的令牌值的前缀。定义前缀有助于 [秘密扫描工具](https://github.blog/2021-04-05-behind-githubs-new-authentication-token-formats/#identifiable-prefixes) 识别令牌并防止其在代码库中泄露。

在颁发令牌后更改前缀将使其无效。因此，请谨慎选择前缀，不要经常更改它们。

默认为 `oat_`。

</dd>

<dt>

table

</dt>

<dd>

用于存储访问令牌的数据库表名。默认为 `auth_access_tokens`。

</dd>

<dt>

type

</dt>

<dd>

用于标识一桶令牌的唯一类型。如果你在单个应用程序中颁发多种类型的令牌，则必须为所有令牌定义唯一的类型。

默认为 `auth_token`。

</dd>

<dt>

tokenSecretLength

</dt>

<dd>

随机令牌值的长度（以字符为单位）。默认为 `40`。

</dd>

</dl>

---

配置令牌 provider 后，你可以开始代表用户 [颁发令牌](#issuing-a-token)。你无需设置身份验证 guard 即可颁发令牌。验证令牌需要 guard。

## 创建 access tokens 数据库表

我们在初始设置期间为 `auth_access_tokens` 表创建迁移文件。迁移文件存储在 `database/migrations` 目录下。

你可以通过执行 `migration:run` 命令来创建数据库表。

```sh
node ace migration:run
```

但是，如果由于某种原因你要手动配置 auth 包，则可以手动创建迁移文件并将以下代码片段复制粘贴到其中。

```sh
node ace make:migration auth_access_tokens
```

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('tokenable_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

## 颁发令牌

根据你的应用程序，你可能会在登录期间或从应用程序仪表板登录后颁发令牌。在这两种情况下，颁发令牌都需要一个用户对象（将为谁生成令牌），你可以直接使用 `User` 模型生成它们。

如果你使用访问令牌作为登录/注销用户的主要方式，你可能更愿意直接通过 auth guard 创建/使令牌无效，请参阅 [登录和注销](#logging-in-and-out)。

在以下示例中，我们 **通过 id 查找用户** 并使用 `User.accessTokens.create` 方法 **为他们颁发访问令牌**。当然，在现实世界的应用程序中，你将通过身份验证来保护此端点，但现在让我们保持简单。

`.create` 方法接受 User 模型的实例并返回 [AccessToken](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/access_token.ts) 类的实例。

`token.value` 属性包含必须与用户共享的值（包装为 [Secret](../references/helpers.md#secret)）。该值仅在生成令牌时可用，用户将无法再次看到它。

```ts
import router from '@adonisjs/core/services/router'
import User from '#models/user'

router.post('users/:id/tokens', async ({ params }) => {
  const user = await User.findOrFail(params.id)
  const token = await User.accessTokens.create(user)

  return {
    type: 'bearer',
    value: token.value!.release(),
  }
})
```

你也可以直接在响应中返回 `token`，它将被序列化为以下 JSON 对象。

```ts
router.post('users/:id/tokens', async ({ params }) => {
  const user = await User.findOrFail(params.id)
  const token = await User.accessTokens.create(user)

  // delete-start
  return {
    type: 'bearer',
    value: token.value!.release(),
  }
  // delete-end
  // insert-start
  return token
  // insert-end
})

/**
 * response: {
 *   type: 'bearer',
 *   value: 'oat_MTA.aWFQUmo2WkQzd3M5cW0zeG5JeHdiaV9rOFQzUWM1aTZSR2xJaDZXYzM5MDE4MzA3NTU',
 *   expiresAt: null,
 * }
 */
```

### 定义能力 (Abilities)

根据你正在构建的应用程序，你可能希望限制访问令牌仅执行特定任务。例如，颁发允许读取和列出项目但不允许创建或删除项目的令牌。

在以下示例中，我们将能力数组定义为第二个参数。能力被序列化为 JSON 字符串并持久保存在数据库中。

对于 auth 包，能力没有实际意义。你的应用程序需要在执行给定操作之前检查令牌能力。

```ts
await User.accessTokens.create(user, ['server:create', 'server:read'])
```

### 令牌能力 vs. Bouncer 能力

你不应将令牌能力与 [bouncer 授权检查](../security/authorization.md#defining-abilities) 混淆。让我们通过一个实际示例来了解其中的区别。

- 假设你定义了一个 **bouncer 能力，允许管理员用户创建新项目**。

- 同一位管理员用户为自己创建了一个令牌，但为了防止令牌滥用，他们将令牌能力限制为 **读取项目**。

- 现在，在你的应用程序中，你将必须实施访问控制，允许管理员用户创建新项目，同时禁止该令牌创建新项目。

你可以为此用例编写 bouncer 能力，如下所示。

:::note

`user.currentAccessToken` 指的是当前 HTTP 请求期间用于身份验证的访问令牌。你可以在 [验证请求](#the-current-access-token) 部分了解更多相关信息。

:::

```ts
import { AccessToken } from '@adonisjs/auth/access_tokens'
import { Bouncer } from '@adonisjs/bouncer'

export const createProject = Bouncer.ability(
  (user: User & { currentAccessToken?: AccessToken }) => {
    /**
     * 如果没有 "currentAccessToken" 令牌属性，这意味着
     * 用户在没有访问令牌的情况下进行了身份验证
     */
    if (!user.currentAccessToken) {
      return user.isAdmin
    }

    /**
     * 否则，检查用户是否为管理员以及他们用于身份验证的令牌
     * 是否允许 "project:create" 能力。
     */
    return user.isAdmin && user.currentAccessToken.allows('project:create')
  }
)
```

### 令牌过期

默认情况下，令牌是长效的，并且永远不会过期。但是，你可以在 [配置令牌 provider](#configuring-the-user-model) 时或在生成令牌时定义过期时间。

过期时间可以定义为表示秒的数值或基于字符串的时间表达式。

```ts
await User.accessTokens.create(
  user, // 为用户
  ['*'], // 具有所有能力
  {
    expiresIn: '30 days' // 30 天后过期
  }
)
```

### 命名令牌

默认情况下，令牌未命名。但是，你可以在生成令牌时为其分配名称。例如，如果你允许应用程序的用户自行生成令牌，你也可以要求他们指定一个可识别的名称。

```ts
await User.accessTokens.create(
  user,
  ['*'],
  {
    name: request.input('token_name'),
    expiresIn: '30 days'
  }
)
```

## 配置 guard

现在我们可以颁发令牌了，让我们配置身份验证 guard 来验证请求并验证用户。guard 必须在 `config/auth.ts` 文件中的 `guards` 对象下配置。

```ts
// title: config/auth.ts
import { defineConfig } from '@adonisjs/auth'
// highlight-start
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
// highlight-end

const authConfig = defineConfig({
  default: 'api',
  guards: {
    // highlight-start
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user'),
      })
    }),
    // highlight-end
  },
})

export default authConfig
```

`tokensGuard` 方法创建 [AccessTokensGuard](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/guard.ts) 类的实例。它接受一个用户 provider，可用于验证令牌和查找用户。

`tokensUserProvider` 方法接受以下选项并返回 [AccessTokensLucidUserProvider](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/user_providers/lucid.ts) 类的实例。

- `model`: 用于查找用户的 Lucid 模型。
- `tokens`: 模型上引用令牌 provider 的静态属性名称。

## 验证请求

配置 guard 后，你可以使用 `auth` 中间件或手动调用 `auth.authenticate` 方法开始验证请求。

`auth.authenticate` 方法返回已认证用户的 User 模型实例，或者在无法验证请求时抛出 [E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access) 异常。

```ts
import router from '@adonisjs/core/services/router'

router.post('projects', async ({ auth }) => {
  // 使用默认 guard 进行身份验证
  const user = await auth.authenticate()

  // 使用命名 guard 进行身份验证
  const user = await auth.authenticateUsing(['api'])
})
```

### 使用 auth 中间件

你可以使用 `auth` 中间件来验证请求或抛出异常，而不是手动调用 `authenticate` 方法。

auth 中间件接受用于验证请求的 guards 数组。身份验证过程在提到的 guards 之一验证请求后停止。

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .post('projects', async ({ auth }) => {
    console.log(auth.user) // User
    console.log(auth.authenticatedViaGuard) // 'api'
    console.log(auth.user!.currentAccessToken) // AccessToken
  })
  .use(middleware.auth({
    guards: ['api']
  }))
```

### 检查请求是否已通过身份验证

你可以使用 `auth.isAuthenticated` 标志检查请求是否已通过身份验证。对于经过身份验证的请求，`auth.user` 的值将始终已定义。

```ts
import { HttpContext } from '@adonisjs/core/http'

class PostsController {
  async store({ auth }: HttpContext) {
    if (auth.isAuthenticated) {
      await auth.user!.related('posts').create(postData)
    }
  }
}
```

### 获取已认证用户或失败

如果你不喜欢在 `auth.user` 属性上使用 [非空断言运算符](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-)，可以使用 `auth.getUserOrFail` 方法。此方法将返回用户对象或抛出 [E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access) 异常。

```ts
import { HttpContext } from '@adonisjs/core/http'

class PostsController {
  async store({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.related('posts').create(postData)
  }
}
```

## 当前访问令牌

Access tokens guard 在成功验证请求后在用户对象上定义 `currentAccessToken` 属性。`currentAccessToken` 属性是 [AccessToken](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/access_token.ts) 类的实例。

你可以使用 `currentAccessToken` 对象获取令牌的能力或检查令牌是否过期。此外，在身份验证期间，guard 将更新 `last_used_at` 列以反映当前时间戳。

如果你在代码库的其他部分引用带有 `currentAccessToken` 类型的 User 模型，你可能需要在模型本身上声明此属性。

:::caption{for="error"}

**不要合并 `currentAccessToken`**

:::

```ts
import { AccessToken } from '@adonisjs/auth/access_tokens'

Bouncer.ability((
  user: User & { currentAccessToken?: AccessToken }
) => {
})
```

:::caption{for="success"}

**将其声明为模型上的属性**

:::

```ts
import { AccessToken } from '@adonisjs/auth/access_tokens'

export default class User extends BaseModel {
  currentAccessToken?: AccessToken
}
```

```ts
Bouncer.ability((user: User) => {
})
```

## 列出所有令牌

你可以使用令牌 provider 的 `accessTokens.all` 方法获取所有令牌的列表。返回值将是 `AccessToken` 类实例的数组。

```ts
router
  .get('/tokens', async ({ auth }) => {
    return User.accessTokens.all(auth.user!)
  })
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
```

`all` 方法还会返回已过期的令牌。你可能希望在渲染列表之前过滤它们，或者在令牌旁边显示 **"Token expired"** 消息。例如

```edge
@each(token in tokens)
  <h2> {{ token.name }} </h2>
  @if(token.isExpired())
    <p> Expired </p>
  @end

  <p> Abilities: {{ token.abilities.join(',') }} </p>
@end
```

## 删除令牌

你可以使用 `accessTokens.delete` 方法删除令牌。该方法接受用户作为第一个参数，令牌 id 作为第二个参数。

```ts
await User.accessTokens.delete(user, token.identifier)
```

你也可以使用 `accessTokens.deleteAll` 方法删除用户的所有令牌。此方法仅接受用户作为参数。例如，在密码重置后很有用。

```ts
await User.accessTokens.deleteAll(user)
```

## 事件

请查看 [事件参考指南](../references/events.md#access_tokens_authauthentication_attempted) 以查看 access tokens guard 发出的可用事件列表。

## 登录和注销

访问令牌有时是用户登录和注销的首选方法 - 例如在对本机应用程序进行身份验证时。

为了适应这些情况，access tokens guard 提供了类似于 [session guard](./session_guard.md) 的 [login](./session_guard.md#performing-login) 和 [logout](./session_guard.md#performing-logout) 方法的 API。

登录：

```ts
const token = await auth.use('api').createToken(user)
```

注销（当前已认证的令牌）：

```ts
await auth.use('api').invalidateToken()
```

### Session 控制器示例

假设 access tokens guard `api` 已经就位（例如，你已设置：[User 模型](#configuring-the-user-model)、[access tokens](#creating-the-access-tokens-database-table) 和 [auth guard](#configuring-the-guard)），session 控制器可以按以下方式实现：

```ts
// title: app/controllers/session_controller.ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)

    return await auth.use('api').createToken(user)
  }

  async destroy({ request, auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()
  }
}
```

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'

const SessionController = () => import('#controllers/session_controller')

router.post('session', [SessionController, 'store'])
router.delete('session', [SessionController, 'destroy'])
  .use(middleware.auth({ guards: ['api'] }))
```

:::warning

当 `User.verifyCredentials` 失败（并抛出 [E_INVALID_CREDENTIALS](../references/exceptions#e_invalid_credentials)）时，使用 [内容协商](../authentication/verifying_user_credentials.md#handling-exceptions) 来获取适当的响应。

在上述示例的情况下，客户端应在对 `/session` 的 post 请求中包含 `Accept=application/json` 标头。这确保了失败将导致 JSON 格式的响应而不是重定向。

:::

:::tip

如果你使用访问令牌从外部来源（如移动应用程序）登录，你可能希望禁用 [CSRF 保护](../security/securing_ssr_applications.md#csrf-protection)。
你可以全局禁用 CSRF 保护（如果你的应用程序仅用作 API），或者为 API 路由（包括 `/session` 路由）添加例外。请参阅 [shield 配置参考](https://docs.adonisjs.com/guides/security/securing-ssr-applications#config-reference)

:::
