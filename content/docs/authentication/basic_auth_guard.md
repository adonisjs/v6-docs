# Basic authentication guard

The basic auth guard is an implementation of the [HTTP authentication framework](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication), in which the client must pass the user credentials as a base64 encoded string via the `Authorization` header. The server allows the request if the credentials are valid. Otherwise, a web-native prompt is displayed to re-enter the credentials.

## Configuring the guard
The authentication guards are defined inside the `config/auth.ts` file. You can configure multiple guards inside this file under the `guards` object.

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

The `basicAuthGuard` method creates an instance of the [BasicAuthGuard](https://github.com/adonisjs/auth/blob/main/modules/basic_auth_guard/guard.ts) class. It accepts a user provider that can be used to find users during authentication.

The `basicAuthUserProvider` method creates an instance of the [BasicAuthLucidUserProvider](https://github.com/adonisjs/auth/blob/main/modules/basic_auth_guard/user_providers/lucid.ts) class. It accepts a reference to the model to use for verifying user credentials.


## Preparing the User model
The model (`User` model in this example) configured with the `basicAuthUserProvider` must use the [AuthFinder](verifying_user_credentials.md#using-the-auth-finder-mixin) mixin to verify the user credentials during authentication.

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

## Protecting routes
Once you have configured the guard, you can use the `auth` middleware to protect routes from unauthenticated requests. The middleware is registered inside the `start/kernel.ts` file under the named middleware collection.

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

### Handling authentication exception

The auth middleware throws the [E_UNAUTHORIZED_ACCESS](https://github.com/adonisjs/auth/blob/main/src/auth/errors.ts#L18) if the user is not authenticated. The exception is automatically converted to an HTTP response with the [WWW-Authenticate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate) header in the response. The `WWW-Authenticate` challenges the authentication and triggers a web-native prompt to re-enter the credentials.

## Getting access to the authenticated user
You may access the logged-in user instance using the `auth.user` property. Since, you are using the `auth` middleware, the `auth.user` property will always be available.

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

### Get authenticated user or fail
If you do not like using the [non-null assertion operator](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-) on the `auth.user` property, you may use the `auth.getUserOrFail` method. This method will return the user object or throw [E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access) exception.

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
