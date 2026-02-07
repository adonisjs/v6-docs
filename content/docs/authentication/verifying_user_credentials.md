---
summary: 使用 AuthFinder mixin 在 AdonisJS 应用程序中验证用户凭据。
---

# 验证用户凭据

在 AdonisJS 应用程序中，验证用户凭据与身份验证层是解耦的。这确保了你可以在不限制验证用户凭据选项的情况下继续使用 auth guards。

默认情况下，我们提供安全的 API 来查找用户并验证他们的密码。但是，你也可以实现其他方式来验证用户，例如向他们的手机号码发送 OTP 或使用 2FA。

在本指南中，我们将介绍在将用户标记为已登录之前，通过 UID 查找用户并验证其密码的过程。

## 基本示例

你可以直接使用 User 模型来查找用户并验证其密码。在下面的示例中，我们通过电子邮件查找用户，并使用 [hash](../security/hashing.md) 服务来验证密码哈希。

```ts
// highlight-start
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
// highlight-end
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async store({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    // highlight-start
    /**
     * 通过电子邮件查找用户。如果用户不存在，
     * 则返回错误
     */
    const user = await User.findBy('email', email)

    if (!user) {
      return response.abort('Invalid credentials')
    }
    // highlight-end

    // highlight-start
    /**
     * 使用 hash 服务验证密码
     */
    const isPasswordValid = await hash.verify(user.password, password)

    if (!isPasswordValid) {
      return response.abort('Invalid credentials')
    }
    // highlight-end

    /**
     * 现在登录用户或为他们创建令牌
     */
    // ...
  }
}
```

:::caption{for="error"}

**上述方法的问题**

:::

<div class="card">

我们在上面的示例中编写的代码容易受到 [时序攻击](https://en.wikipedia.org/wiki/Timing_attack)。在身份验证的情况下，攻击者可以观察应用程序的响应时间，以找出他们提供的凭据中的电子邮件或密码是否不正确。我们建议你使用 [AuthFinder mixin](#using-the-auth-finder-mixin) 来防止时序攻击并获得更好的开发人员体验。

根据上述实现：

- 如果用户的电子邮件不正确，请求将花费更少的时间。这是因为当我们找不到用户时，我们不会验证密码哈希。

- 如果电子邮件存在且密码不正确，请求将花费更长的时间。这是因为密码哈希算法本质上很慢。

响应时间的差异足以让攻击者找到有效的电子邮件地址并尝试不同的密码组合。

</div>

## 使用 Auth finder mixin

为了防止时序攻击，我们建议你在 User 模型上使用 [AuthFinder mixin](https://github.com/adonisjs/auth/blob/main/src/mixins/lucid.ts)。

Auth finder mixin 向应用的模型添加了 `findForAuth` 和 `verifyCredentials` 方法。`verifyCredentials` 方法提供了一个时序攻击安全的 API，用于查找用户并验证其密码。

你可以按如下方式导入并在模型上应用 mixin。

```ts
import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
// highlight-start
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
// highlight-end

// highlight-start
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})
// highlight-end

// highlight-start
export default class User extends compose(BaseModel, AuthFinder) {
  // highlight-end
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

- `withAuthFinder` 方法接受一个回调，该回调返回一个 hasher 作为第一个参数。我们在上面的示例中使用了 `scrypt` hasher。但是，你可以将其替换为不同的 hasher。

- 接下来，它接受一个具有以下属性的配置对象。
  - `uids`: 可用于唯一标识用户的模型属性数组。如果你为用户分配用户名或电话号码，你也可以将它们用作 UID。
  - `passwordColumnName`: 保存用户密码的模型属性名称。

- 最后，你可以使用 `withAuthFinder` 方法的返回值作为 User 模型上的 [mixin](../references/helpers.md#compose)。

### 验证凭据

应用 Auth finder mixin 后，你可以将 `SessionController.store` 方法中的所有代码替换为以下代码片段。

```ts
import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
// delete-start
import hash from '@adonisjs/core/services/hash'
// delete-end

export default class SessionController {
  // delete-start
  async store({ request, response }: HttpContext) {
  // delete-end
  // insert-start
  async store({ request }: HttpContext) {
  // insert-end
    const { email, password } = request.only(['email', 'password'])

    // delete-start
    /**
     * Find a user by email. Return error if a user does
     * not exists
     */ 
    const user = await User.findBy('email', email)
    if (!user) {
      response.abort('Invalid credentials')
    }

    /**
     * Verify the password using the hash service
     */
    await hash.verify(user.password, password)
    // delete-end
    // insert-start
    const user = await User.verifyCredentials(email, password)
    // insert-end

    /**
     * Now login the user or create a token for them
     */
  }
}
```

### 处理异常

如果凭据无效，`verifyCredentials` 方法将抛出 [E_INVALID_CREDENTIALS](../references/exceptions.md#e_invalid_credentials) 异常。

该异常是自处理的，并将使用以下内容协商规则转换为响应。

- 带有 `Accept=application/json` 标头的 HTTP 请求将收到一个错误消息数组。每个数组元素都是一个具有 message 属性的对象。

- 带有 `Accept=application/vnd.api+json` 标头的 HTTP 请求将收到一个根据 JSON API 规范格式化的错误消息数组。

- 如果你使用会话，用户将被重定向到表单并通过 [会话闪存消息](../basics/session.md#flash-messages) 接收错误。

- 所有其他请求将以纯文本形式接收错误。

但是，如果需要，你可以在 [全局异常处理程序](../basics/exception_handling.md) 中处理该异常，如下所示。

```ts
// highlight-start
import { errors } from '@adonisjs/auth'
// highlight-end
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_INVALID_CREDENTIALS) {
      return ctx
        .response
        .status(error.status)
        .send(error.getResponseMessage(error, ctx))
    }
    // highlight-end

    return super.handle(error, ctx)
  }
}
```

## 哈希用户密码

`AuthFinder` mixin 注册了一个 [beforeSave](https://github.com/adonisjs/auth/blob/main/src/mixins/lucid.ts#L40-L50) 钩子，以便在 `INSERT` 和 `UPDATE` 调用期间自动哈希用户密码。因此，你不必在模型中手动执行密码哈希。
