---
summary: Learn how to authenticate users using the session guard in AdonisJS.
---

# Session guard
The session guard uses the [@adonisjs/session](../basics/session.md) package to login and authenticate users during an HTTP request.

Sessions and cookies have been on the internet for a long time and work great for most applications. Therefore, we recommend using the session guard for server-rendered applications or an SPA web client on the same top-level domain.

## Configuring the guard
The authentication guards are defined inside the `config/auth.ts` file. You can configure multiple guards inside this file under the `guards` object.

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

The `sessionGuard` method creates an instance of the [SessionGuard](https://github.com/adonisjs/auth/blob/main/modules/session_guard/guard.ts) class. It accepts a user provider that can be used to find users during authentication and an optional config object to configure the remember tokens behavior.

The `sessionUserProvider` method creates an instance of the [SessionLucidUserProvider](https://github.com/adonisjs/auth/blob/main/modules/session_guard/user_providers/lucid.ts) class. It accepts a reference to the model to use for authentication.

## Performing login
You can login a user using the `guard.login` method. The method accepts an instance of the User model and creates a login session for them.

In the following example:

- We use the `verifyCredentials` from the [AuthFinder mixin](./verifying_user_credentials.md#using-the-auth-finder-mixin) to find a user by email and password.

- The `auth.use('web')` returns an instance of the [SessionGuard](https://github.com/adonisjs/auth/blob/main/modules/session_guard/guard.ts) configured inside the `config/auth.ts` file.

- Next, we call the `guard.login(user)` method to create a login session for the user.

- Finally, we redirect the user to the `/dashboard` endpoint. Feel free to customize the redirect endpoint.

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    // highlight-start
    /**
     * Step 1: Get credentials from the request body
     */
    const { email, password } = request.only(['email', 'password'])

    /**
     * Step 2: Verify credentials
     */
    const user = await User.verifyCredentials(email, password)

    /**
     * Step 3: Login user
     */
    await auth.use('web').login(user)

    /**
     * Step 4: Send them to a protected route
     */
    response.redirect('/dashboard')
    // highlight-end
  }
}
```

## Protecting routes

You can protect routes from unauthenticated users using the `auth` middleware. The middleware is registered inside the `start/kernel.ts` file under the named middleware collection.

```ts
import router from '@adonisjs/core/services/router'

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware')
})
```

Apply the `auth` middleware to the routes you want to protect from unauthenticated users. 

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

By default, the auth middleware will authenticate the user against the `default` guard (as defined in the config file). However, you can specify an array of guards when assigning the `auth` middleware.

In the following example, the auth middleware will attempt to authenticate the request using the `web` and the `api` guards.

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

### Handling authentication exception

The auth middleware throws the [E_UNAUTHORIZED_ACCESS](https://github.com/adonisjs/auth/blob/main/src/auth/errors.ts#L18) if the user is not authenticated. The exception is handled automatically using the following content-negotiation rules.

- Request with `Accept=application/json` header will receive an array of errors with the `message` property.

- Request with `Accept=application/vnd.api+json` header will receive an array of errors as per the [JSON API](https://jsonapi.org/format/#errors) spec.

- The user will be redirected to the `/login` page for server-rendered applications. You can configure the redirect endpoint within the `auth` middleware class.

## Getting access to the logged-in user

You may access the logged-in user instance using the `auth.user` property. The value is only available when using the `auth` middleware or if you call the `auth.authenticate` or `auth.check` methods manually.

```ts
// title: Using auth middleware
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
// title: Manually calling authenticate method
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    /**
     * First, authenticate the user
     */
    await auth.authenticate()

    /**
     * Then access the user object
     */ 
    await auth.user!.getAllMetrics()
    // highlight-end
  })
```

### Check if the request is authenticated
You can check if a request has been authenticated using the `auth.isAuthenticated` flag. The value of `auth.user` will always be defined for an authenticated request.

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

### Get authenticated user or fail

If you do not like using the [non-null assertion operator](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-) on the `auth.user` property, you may use the `auth.getUserOrFail` method. This method will return the user object or throw [E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access) exception.

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

### Access user within Edge templates
The [InitializeAuthMiddleware](./introduction.md#the-initialize-auth-middleware) also shares the `ctx.auth` property with Edge templates. Therefore, you can access the currently logged-in user via the `auth.user` property.

```edge
@if(auth.isAuthenticated)
  <p> Hello {{ auth.user.email }} </p>
@end
```

If you want to fetch logged-in user information on a non-protected route, you can use the `auth.check` method to check if the user is logged-in and then access the `auth.user` property. A great use case for this is displaying the logged-in user information on the website header of a public page.

```edge
{{--
  This is a public page; therefore, it is not protected by the auth
  middleware. However, we still want to display the logged-in
  user info in the header of the website.

  For that, we use the `auth.check` method to silently check if the
  user is logged in and then displays their email in the header.

  You get the idea!
--}}

@eval(await auth.check())

<header>
  @if(auth.isAuthenticated)
    <p> Hello {{ auth.user.email }} </p>
  @end
</header>
```

## Performing logout
You can logout a user using the `guard.logout` method. During logout, the user state will be deleted from the session store. The currently active remember me token will also be deleted (if using remember me tokens).

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

## Using the Remember Me feature
The Remember Me feature automatically login user after their session expires. This is done by generating a cryptographically secure token and saving it as a cookie inside the user's browser.

After the user session has expired, AdonisJS will use the remember me cookie, verify the token's validity, and automatically re-create the logged-in session for the user.

### Creating the Remember Me Tokens table

The remember me tokens are saved inside the database, and therefore, you must create a new migration to create the `remember_me_tokens` table.

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

### Configuring the tokens provider
To read-write tokens, you will have to assign the [DbRememberMeTokensProvider](https://github.com/adonisjs/auth/blob/main/modules/session_guard/token_providers/db.ts) to the User model.

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

### Enabling Remember Me tokens inside the config
Finally, let's enable the `useRememberTokens` flag on the session guard config inside the `config/auth.ts` file.

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

### Remembering users during login
Once the setup is completed, you can generate the remember me token and cookie using the `guard.login` method as follows.

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
       * Generate token when "remember_me" input exists
       */
      !!request.input('remember_me')
      // highlight-end
    )
    
    response.redirect('/dashboard')
  }
}
```

## Using the guest middleware
The auth package ships with a guest middleware you can use to redirect the logged-in users from accessing the `/login` page. This should be done to avoid creating multiple sessions for a single user on a single device.

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .get('/login', () => {})
  .use(middleware.guest())
```

By default, the guest middleware will check the user logged-in status using the `default` guard (as defined in the config file). However, you can specify an array of guards when assigning the `guest` middleware.

```ts
router
  .get('/login', () => {})
  .use(middleware.guest({
    guards: ['web', 'admin_web']
  }))
```

Finally, you can configure the redirect route for the logged-in users inside the `./app/middleware/guest_middleware.ts` file.

## Events
Please check the [events reference guide](../references/events.md#session_authcredentials_verified) to view the list of available events emitted by the Auth package.
