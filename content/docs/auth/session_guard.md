# Session guard

The session guard uses the [@adonisjs/session](../http/session.md) package to log in and authenticate users. We recommend using the session guard for **server-rendered web apps** or **an AdonisJS API with its client on the same top-level domain**.

## Configuration

The configuration for the auth package is stored within the `config/auth.ts` file. You can configure multiple authentication guards in this file based on your application requirements.

You can copy-paste the following example configuration examples to the `config/auth.ts` file. Feel free to create the config file if it's missing.

:::disclosure{title="Session guard with Lucid provider"}

```ts
import { defineConfig, providers } from '@adonisjs/auth'
import { sessionGuard } from '@adonisjs/auth/session'
import { InferAuthEvents, Authenticators } from '@adonisjs/auth/types'

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      provider: providers.lucid({
        model: () => import('#models/user'),
        uids: ['email'],
      }),
    }),
  },
})

export default authConfig

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
  interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
```


:::


## Configuring session guard

The session guard accepts the following properties.

<dl>

<dt>

provider

</dt>

<dd>

Reference to the user provider to lookup users. [Learn more about the Lucid provider](./lucid_user_provider.md).

</dd>

<dt>

tokens (optional)

</dt>

<dd>

Reference to a remember me tokens provider. You must configure a tokens provider to use the remember me feature. [Learn more](#remember-me-feature)

</dd>

<dt>

rememberMeTokenAge (optional)

</dt>

<dd>

Define the expiry age of the remember me token. Defaults to `2 years`.

</dd>

</dl>

## Remember Me feature

The Remember Me feature automatically login user after their session expires. This is done by generating a cryptographically secure token and saving it as a cookie inside the user's browser.

After the user session has expired, AdonisJS will use the remember me cookie, verify the token's validity, and automatically re-create the logged-in session for the user.

When using remember me tokens, you must generate the migration to create the `remember_me_tokens` database table, and the table must have the following columns.


:::note


In the following migration, we define a foreign key constraint for the `user_id` column. However, change the migration and remove the foreign key constraint if you are fetching users from a different source (not the same database). 


:::

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'remember_me_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('series').notNullable().unique()
      table
        .string('user_id')
        .unsigned()
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE')

      table.string('type').notNullable()
      table.string('guard').notNullable()
      table.string('token').notNullable().unique()
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

Finally, you must define a token provider within the config file and register it with the session guard.

```ts
import {
  sessionGuard,
  // insert-start
  tokenProviders,
  // insert-end
} from '@adonisjs/auth/session'

// insert-start
const rememberTokensProvider = tokenProviders.db({
  table: 'remember_me_tokens',
})
// insert-end

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      provider: userProvider,
      // insert-start
      tokens: rememberMeTokensProvider,
      rememberMeTokenAge: '2 years',
      // insert-end
    }),
  },
})
```

## Getting access to the guard

You can access the guard instance using the `ctx.auth.use` method. The auth property is an instance of the [Authenticator class](https://github.com/adonisjs/auth/blob/next/src/auth/authenticator.ts), created for every HTTP request using the [InitializeAuthMiddleware](https://github.com/adonisjs/auth/blob/next/src/auth/middleware/initialize_auth_middleware.ts).

The `auth.use` method accepts the guard name (as mentioned inside the config file) and returns a singleton instance.

```ts
import router from '@adonisjs/core/services/router'

router.post('login', async ({ auth }) => {
  const guard = auth.use('web')
  // guard instanceof SessionGuard = true
})
```

## How to login a user

As shown in the following example, you can login a user using the `guard.attempt` method. The `attempt` method will verify the user credentials and create a login session.

```ts
import router from '@adonisjs/core/services/router'

router.post('login', async ({ auth, request, response }) => {
  const email = request.input('email')
  const password = request.input('password')

  await auth.use('web').attempt(email, password)

  response.redirect('/dashboard')
})
```

- The `guard.attempt` method accepts the value for a [`UID` column](./lucid_user_provider.md) and the account password. Under the hood, it will query the user from the database and verify the password using the [hash](../security/hash.md) module.

- An [InvalidCredentialsException](#handling-login-errors) will be raised when unable to find the user or if the password is incorrect.

- Otherwise, the session guard will create a login session for the user. 

- Finally, you can redirect the user to the home page or dashboard (depending on your application workflow).

### How to create a login form?

The `guard.attempt` method does not care how you ask for the user credentials. If you can provide valid credentials, it will create a login session for the authenticated user.

If you are creating an SPA, you can create the login form inside your frontend app and send the credentials via an AJAX/fetch request. Make sure to implement [CORS](../security/cors.md) to protect your APIs from unwanted access. 

If you are creating a server-rendered application with Edge templates, you can create a regular HTML form. However, configure [CSRF protection](../security/web-security.md#csrf-protection) to protect the login form.

### How to log in without a password?

If you are creating a passwordless authentication system, you will have to verify the authenticity of a user manually. 

After you have verified a user, you can call the `guard.login` method with an instance of the `User` model.

```ts
router.post('verify/otp', async ({ auth, request, response }) => {
  /**
   * Imaginary method call to verify OTP and get
   * the user for whom the OTP was generated
   */
  const userId = await verifyMobileOtp(otp)

  /**
   * Find user by ID user the User model
   */
  const user = await User.findOrFail(userId)

  /**
   * Mark the user as logged-in
   */
  await auth.use('web').login(user)

  response.redirect('/dashboard')
})
```

Similar to the login method, you may also use the `guard.loginViaId` method to login a user by id. The `loginViaId` method will query the database to ensure a user with the given id exists and create a login session for them.

```ts
router.post('verify/otp', async ({ auth, request, response }) => {
  /**
   * Imaginary method call to verify OTP and get
   * the user for whom the OTP was generated
   */
  const userId = await verifyMobileOtp(otp)

  /**
   * Mark the user as logged-in
   */
  await auth.use('web').login(userId)

  response.redirect('/dashboard')
})
```

### Handling login errors

The `guard.attempt` and `guard.loginViaId` methods will raise [InvalidCredentialsException](https://github.com/adonisjs/auth/blob/next/src/auth/errors.ts#L126) when unable to find a user or when the password is incorrect. The exception is handled automatically using the following content-negotiation rules.

- Request with `Accept=application/json` header will receive an array of errors with the `message` property.
- Request with `Accept=application/vnd.api+json` header will receive an array of errors as per the [JSON API](https://jsonapi.org/format/#errors) spec.
- The user will be redirected to the login page with a flash error message for server-rendered applications. You can access the flash message inside edge templates as follows.

    ```edge
    @error('auth.login')
      @each(message in messages)
        <p> {{ message }} </p>
      @end
    @end
    
    <form>
      <!-- Login form goes here -->
    </form>
    ```

## How to logout a user

You can logout a user using the `guard.logout` method. During logout, the user state will be deleted from the session store. The currently active token will also be deleted if using remember me tokens.

```ts
import router from '@adonisjs/core/services/router'

router.post('logout', async ({ auth, response }) => {
  await auth.use('web').logout()

  return response.redirect('/login')
})
```

## Protecting routes

You can protect routes from unauthenticated users using the `auth` middleware. The middleware should be registered under the named middleware collection inside the `start/kernel.ts` file.

```ts
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware')
})
```

```ts
// title: app/middleware/auth.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used to authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
    return next()
  }
}
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

The auth middleware will attempt to authenticate the request using the `web` and the `basic_auth` guards in the following example.

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
 .get('dashboard', () => {})
 // highlight-start
 .use(
   middleware.auth({
     guards: ['web', 'basic_auth']
   })
 )
 // highlight-end
```

### Handling AuthenticationException

The auth middleware throws the [AuthenticationException](https://github.com/adonisjs/auth/blob/next/src/auth/errors.ts#L18) if the user is not authenticated. The exception is handled automatically using the following content-negotiation rules.

- Request with `Accept=application/json` header will receive an array of errors with the `message` property.

- Request with `Accept=application/vnd.api+json` header will receive an array of errors as per the [JSON API](https://jsonapi.org/format/#errors) spec.

- The user will be redirected to the `/login` page for server-rendered applications. You can configure the redirect endpoint within the `auth` middleware class.

## Getting access to the logged-in user

You can access the logged-in user instance using the `auth.user` property. The value is only available when using the `auth` middleware or manually calling the `auth.authenticate` method.

```ts
// title: Using auth middleware
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
 .get('dashboard', ({ auth }) => {
   // highlight-start
   console.log(auth.user) // User
   // highlight-end
 })
 .use(middleware.auth())
```

```ts
// title: Manually calling authenticate method
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
 .get('dashboard', ({ auth }) => {
   // highlight-start
   console.log(auth.user) // undefined
   await auth.authenticate()
   console.log(auth.user) // User
   // highlight-end
 })
```

The `auth.user` property refers to the guard's user object for which the authentication succeeded. For example:

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
 .get('dashboard', ({ auth }) => {
   if (auth.authenticatedViaGuard === 'web') {
     auth.user // instance of web guard's user
   }

   if (auth.authenticatedViaGuard === 'basic_auth') {
     auth.user // instance of basic_auth guard's user
   }
 })
 .use(
   middleware.auth({
     guards: ['web', 'basic_auth']
   })
 )
```

## Remembering users

If you have configured the [remember me feature](#remember-me-feature), you can display a "remember me checkbox" in your login forms to keep the users logged in indefinitely until they manually logout.

You can pass the boolean state of the checkbox to the `guard.attempt`, `guard.loginViaId`, and `guard.login` methods as follows.

```ts
import router from '@adonisjs/core/services/router'

router.post('login', async ({ auth, request, response }) => {
  const email = request.input('email')
  const password = request.input('password')

  // highlight-start
  const rememberMe = !!request.input('remember_me')
  await auth
    .use('web')
    .attempt(email, password, rememberMe)
  // highlight-end

  response.redirect('/dashboard')
})
```

```ts
await auth.use('web').login(user, rememberMe)
await auth.use('web').loginViaId(userId, rememberMe)
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
Please check the [events reference guide](../reference/events.md#session_authcredentials_verified) to view the list of available events emitted by the Auth package.
