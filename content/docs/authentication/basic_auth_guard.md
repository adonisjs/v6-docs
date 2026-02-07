---
summary: 了解如何使用 basic auth guard 通过 HTTP 身份验证框架对用户进行身份验证。
---

# 基本身份验证守卫

Basic auth guard 是 [HTTP 身份验证框架](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication) 的实现，其中客户端必须通过 `Authorization` 标头将用户凭据作为 base64 编码字符串传递。如果凭据有效，服务器将允许请求。否则，将显示本机 Web 提示以重新输入凭据。

## 配置 guard

身份验证 guards 在 `config/auth.ts` 文件中定义。你可以在此文件中的 `guards` 对象下配置多个 guards。

```ts
import { defineConfig } from '@adonisjs/auth'
// highlight-start
import { basicAuthGuard, basicAuthUserProvider } from '@adonisjs/auth/basic_auth'
// highlight-end

const authConfig = defineConfig({
  default: 'basicAuth',
  guards: {
    // highlight-start
    basicAuth: basicAuthGuard({
      provider: basicAuthUserProvider({
        model: () => import('#models/user'),
      }),
    })
    // highlight-end
  },
})

export default authConfig
```

`basicAuthGuard` 方法创建 [BasicAuthGuard](https://github.com/adonisjs/auth/blob/main/modules/basic_auth_guard/guard.ts) 类的实例。它接受一个用户 provider，可用于在身份验证期间查找用户。

`basicAuthUserProvider` 方法创建 [BasicAuthLucidUserProvider](https://github.com/adonisjs/auth/blob/main/modules/basic_auth_guard/user_providers/lucid.ts) 类的实例。它接受对用于验证用户凭据的模型的引用。


## 准备 User 模型

使用 `basicAuthUserProvider` 配置的模型（本例中为 `User` 模型）必须使用 [AuthFinder](./verifying_user_credentials.md#using-the-auth-finder-mixin) mixin 来在身份验证期间验证用户凭据。

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

## 保护路由

配置 guard 后，你可以使用 `auth` 中间件来保护路由免受未经身份验证的请求的影响。中间件在 `start/kernel.ts` 文件中的命名中间件集合下注册。

```ts
import router from '@adonisjs/core/services/router'

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware')
})
```

```ts
// highlight-start
import { middleware } from '#start/kernel'
// highlight-end
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', ({ auth }) => {
    return auth.user
  })
  .use(middleware.auth({
    // highlight-start
    guards: ['basicAuth']
    // highlight-end
  }))
```

### 处理身份验证异常

如果用户未通过身份验证，auth 中间件将抛出 [E_UNAUTHORIZED_ACCESS](https://github.com/adonisjs/auth/blob/main/src/errors.ts#L21)。异常会自动转换为带有响应中 [WWW-Authenticate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate) 标头的 HTTP 响应。`WWW-Authenticate` 挑战身份验证并触发本机 Web 提示以重新输入凭据。

## 获取已认证用户

你可以使用 `auth.user` 属性访问已登录的用户实例。由于你使用的是 `auth` 中间件，因此 `auth.user` 属性将始终可用。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', ({ auth }) => {
    return `You are authenticated as ${auth.user!.email}`
  })
  .use(middleware.auth({
    guards: ['basicAuth']
  }))
```

### 获取已认证用户或失败

如果你不喜欢在 `auth.user` 属性上使用 [非空断言运算符](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-)，可以使用 `auth.getUserOrFail` 方法。此方法将返回用户对象或抛出 [E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access) 异常。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', ({ auth }) => {
    // highlight-start
    const user = auth.getUserOrFail()
    return `You are authenticated as ${user.email}`
    // highlight-end
  })
  .use(middleware.auth({
    guards: ['basicAuth']
  }))
```
