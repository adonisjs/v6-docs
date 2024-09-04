---
summary: Verify user credentials in an AdonisJS application using the AuthFinder mixin.
---

# Verifying user credentials

In an AdonisJS application, verifying user credentials is decoupled from the authentication layer. This ensures you can continue using the auth guards without limiting the options to verify the user credentials.

By default, we provide secure APIs to find users and verify their passwords. However, you can also implement additional ways to verify a user, like sending an OTP to their phone number or using 2FA.

In this guide, we will cover the process of finding a user by a UID and verifying their password before marking them as logged in.

## Basic example
You can use the User model directly to find a user and verify their password. In the following example, we find a user by email and use the [hash](../security/hashing.md) service to verify the password hash.

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
     * Find a user by email. Return error if a user does
     * not exists
     */
    const user = await User.findBy('email', email)

    if (!user) {
      return response.abort('Invalid credentials')
    }
    // highlight-end

    // highlight-start
    /**
     * Verify the password using the hash service
     */
    const isPasswordValid = await hash.verify(user.password, password)

    if (!isPasswordValid) {
      return response.abort('Invalid credentials')
    }
    // highlight-end

    /**
     * Now login the user or create a token for them
     */
    // ...
  }
}
```

:::caption{for="error"}

**Issues with the above approach**

:::

<div class="card">

The code we have written in the above example is prone to [timing attacks](https://en.wikipedia.org/wiki/Timing_attack). In the case of authentication, an attacker can observe the application response time to find whether the email or the password is incorrect in their provided credentials. We recommend you use the [AuthFinder mixin](#using-the-auth-finder-mixin) to prevent timing attacks and have a better developer experience.

As per the above implementation:

- The request will take less time if the user's email is incorrect. This is because we do not verify the password hash when we cannot find a user.

- The request will take longer if the email exists and the password is incorrect. This is because password hashing algorithms are slow in nature.

The difference in response time is enough for an attacker to find a valid email address and try different password combinations.

</div>

## Using the Auth finder mixin
To prevent the timing attacks, we recommend you use the [AuthFinder mixin](https://github.com/adonisjs/auth/blob/main/src/mixins/lucid.ts) on the User model.

The Auth finder mixin adds `findForAuth` and `verifyCredentials` methods to the applied model. The `verifyCredentials` method offers a timing attack safe API for finding a user and verifying their password.

You can import and apply the mixin on a model as follows.

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

- The `withAuthFinder` method accepts a callback that returns a hasher as the first argument. We use the `scrypt` hasher in the above example. However, you can replace it with a different hasher.

- Next, it accepts a configuration object with the following properties.
  - `uids`: An array of model properties that can be used to identify a user uniquely. If you assign a user a username or phone number, you can also use them as a UID.
  - `passwordColumnName`: The model property name that holds the user password.

- Finally, you can use the return value of the `withAuthFinder` method as a [mixin](../references/helpers.md#compose) on the User model.

### Verifying credentials
Once you have applied the Auth finder mixin, you can replace all the code from the `SessionController.store` method with the following code snippet.

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

### Handling exceptions
In case of invalid credentials, the `verifyCredentials` method will throw [E_INVALID_CREDENTIALS](../references/exceptions.md#e_invalid_credentials) exception.

The exception is self-handled and will be converted to a response using the following content negotiation rules.

- HTTP requests with the `Accept=application/json` header will receive an array of error messages. Each array element will be an object with the message property.

- HTTP requests with the `Accept=application/vnd.api+json` header will receive an array of error messages formatted per the JSON API spec.

- If you use sessions, the user will be redirected to the form and receive the errors via [session flash messages](../basics/session.md#flash-messages).

- All other requests will receive errors back as plain text.

However, if needed, you can handle the exception inside the [global exception handler](../basics/exception_handling.md) as follows.

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

## Hashing user password
The `AuthFinder` mixin registers a [beforeSave](https://github.com/adonisjs/auth/blob/main/src/mixins/lucid.ts#L40-L50) hook to automatically hash the user passwords during `INSERT` and `UPDATE` calls. Therefore, you do not have to manually perform password hashing in your models.
