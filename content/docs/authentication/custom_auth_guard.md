---
summary: Learn to create a custom authentication guard for AdonisJS.
---

# Creating a custom auth guard

The auth package enables you to create custom authentication guards for use cases not served by the built-in guards. In this guide, we will create a guard for using JWT tokens for authentication.

The authentication guard revolves around the following concepts.

- **User Provider**: Guards must be user agnostic. They should not hardcode the functions to query and find users from the database. Instead, a guard should rely on a User Provider and accept its implementation as a constructor dependency.

- **Guard implementation**: The guard implementation must adhere to the `GuardContract` interface. This interface describes the APIs needed to integrate the guard with the rest of the Auth layer.

## Creating the `UserProvider` interface

A guard is responsible for defining the `UserProvider` interface and the methods/properties it should contain. For example, the UserProvider accepted by the [Session guard](https://github.com/adonisjs/auth/blob/develop/modules/session_guard/types.ts#L153-L166) is far simpler than the UserProvider accepted by the [Access tokens guard](https://github.com/adonisjs/auth/blob/develop/modules/access_tokens_guard/types.ts#L192-L222).

So, there is no need to create User Providers that satisfy every guard implementation. Each guard can dictate the requirements for the User provider they accept.

For this example, we need a provider to look up users inside the database using the `user ID`. We do not care which database is used or how the query is performed. That's the responsibility of the developer implementing the User provider.

:::note

All the code we will write in this guide can initially live inside a single file stored within the `app/auth/guards` directory.

:::

```ts
// title: app/auth/guards/jwt.ts
import { symbols } from '@adonisjs/auth'

/**
 * The bridge between the User provider and the
 * Guard
 */
export type JwtGuardUser<RealUser> = {
  /**
   * Returns the unique ID of the user
   */
  getId(): string | number | BigInt

  /**
   * Returns the original user object
   */
  getOriginal(): RealUser
}

/**
 * The interface for the UserProvider accepted by the
 * JWT guard.
 */
export interface JwtUserProviderContract<RealUser> {
  /**
   * A property the guard implementation can use to infer
   * the data type of the actual user (aka RealUser)
   */
  [symbols.PROVIDER_REAL_USER]: RealUser

  /**
   * Create a user object that acts as an adapter between
   * the guard and real user value.
   */
  createUserForGuard(user: RealUser): Promise<JwtGuardUser<RealUser>>

  /**
   * Find a user by their id.
   */
  findById(identifier: string | number | BigInt): Promise<JwtGuardUser<RealUser> | null>
}
```

In the above example, the `JwtUserProviderContract` interface accepts a generic user property named `RealUser`. Since this interface does not know what the actual user (the one we fetch from the database) looks like, it accepts it as a generic. For example:

- An implementation using Lucid models will return an instance of the Model. Hence, the value of `RealUser` will be that instance.

- An implementation using Prisma will return a user object with specific properties; therefore, the value of `RealUser` will be that object.

To summarize, the `JwtUserProviderContract` leaves it to the User Provider implementation to decide the User's data type.

### Understanding the `JwtGuardUser` type
The `JwtGuardUser` type acts as a bridge between the User provider and the guard. The guard uses the `getId` method to get the user's unique ID and the `getOriginal` method to get the user's object after authenticating the request.

## Implementing the guard
Let's create the `JwtGuard` class and define the methods/properties needed by the [`GuardContract`](https://github.com/adonisjs/auth/blob/main/src/types.ts#L30) interface. Initially, we will have many errors in this file, but that's okay; as we progress, all the errors will disappear.

:::note

Please take some time and read the comments next to every property/method in
the following example.

:::

```ts
import { symbols } from '@adonisjs/auth'
import { AuthClientResponse, GuardContract } from '@adonisjs/auth/types'

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * A list of events and their types emitted by
   * the guard.
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {}

  /**
   * A unique name for the guard driver
   */
  driverName: 'jwt' = 'jwt'

  /**
   * A flag to know if the authentication was an attempt
   * during the current HTTP request
   */
  authenticationAttempted: boolean = false

  /**
   * A boolean to know if the current request has
   * been authenticated
   */
  isAuthenticated: boolean = false

  /**
   * Reference to the currently authenticated user
   */
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER]

  /**
   * Generate a JWT token for a given user.
   */
  async generate(user: UserProvider[typeof symbols.PROVIDER_REAL_USER]) {
  }

  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid JWT token
   * or throw an exception
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
  }

  /**
   * Same as authenticate, but does not throw an exception
   */
  async check(): Promise<boolean> {
  }

  /**
   * Returns the authenticated user or throws an error
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
  }

  /**
   * This method is called by Japa during testing when "loginAs"
   * method is used to login the user.
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
  }
}
```

## Accepting a user provider
A guard must accept a user provider to look up users during authentication. You can accept it as a constructor parameter and store a private reference.

```ts
export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  // insert-start
  #userProvider: UserProvider

  constructor(
    userProvider: UserProvider
  ) {
    this.#userProvider = userProvider
  }
  // insert-end
}
```

## Generating a token
Let's implement the `generate` method and create a token for a given user. We will install and use the `jsonwebtoken` package from npm to generate a token.

```sh
npm i jsonwebtoken @types/jsonwebtoken
```

Also, we will have to use a **secret key** to sign a token, so let's update the `constructor` method and accept the secret key as an option via the options object.

```ts
// insert-start
import jwt from 'jsonwebtoken'

export type JwtGuardOptions = {
  secret: string
}
// insert-end

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  #userProvider: UserProvider
  // insert-start
  #options: JwtGuardOptions
  // insert-end

  constructor(
    userProvider: UserProvider
    // insert-start
    options: JwtGuardOptions
    // insert-end
  ) {
    this.#userProvider = userProvider
    // insert-start
    this.#options = options
    // insert-end
  }

  /**
   * Generate a JWT token for a given user.
   */
  async generate(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ) {
    // insert-start
    const providerUser = await this.#userProvider.createUserForGuard(user)
    const token = jwt.sign({ userId: providerUser.getId() }, this.#options.secret)

    return {
      type: 'bearer',
      token: token
    }
    // insert-end
  }
}
```

- First, we use the `userProvider.createUserForGuard` method to create an instance of the provider user (aka the bridge between the real user and the guard).

- Next, we use the `jwt.sign` method to create a signed token with the `userId` in the payload and return it.

## Authenticating a request

Authenticating a request includes:

- Reading the JWT token from the request header or cookie.
- Verifying its authenticity.
- Fetching the user for whom the token was generated.

Our guard will need access to the [HttpContext](../concepts/http_context.md) to read request headers and cookies, so let's update the class `constructor` and accept it as an argument.

```ts
// insert-start
import type { HttpContext } from '@adonisjs/core/http'
// insert-end

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  // insert-start
  #ctx: HttpContext
  // insert-end
  #userProvider: UserProvider
  #options: JwtGuardOptions

  constructor(
    // insert-start
    ctx: HttpContext,
    // insert-end
    userProvider: UserProvider,
    options: JwtGuardOptions
  ) {
    // insert-start
    this.#ctx = ctx
    // insert-end
    this.#userProvider = userProvider
    this.#options = options
  }
}
```

We will read the token from the `authorization` header for this example. However, you can adjust the implementation to support cookies as well.

```ts
import {
  symbols,
  // insert-start
  errors
  // insert-end
} from '@adonisjs/auth'

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid JWT token
   * or throw an exception
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    /**
     * Avoid re-authentication when it has been done already
     * for the given request
     */
    if (this.authenticationAttempted) {
      return this.getUserOrFail()
    }
    this.authenticationAttempted = true

    /**
     * Ensure the auth header exists
     */
    const authHeader = this.#ctx.request.header('authorization')
    if (!authHeader) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Split the header value and read the token from it
     */
    const [, token] = authHeader.split('Bearer ')
    if (!token) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Verify token
     */
    const payload = jwt.verify(token, this.#options.secret)
    if (typeof payload !== 'object' || !('userId' in payload)) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Fetch the user by user ID and save a reference to it
     */
    const providerUser = await this.#userProvider.findById(payload.userId)
    if (!providerUser) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    this.user = providerUser.getOriginal()
    return this.getUserOrFail()
  }
}
```

## Implementing the `check` method
The `check` method is a silent version of the `authenticate` method, and you can implement it as follows.

```ts
export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * Same as authenticate, but does not throw an exception
   */
  async check(): Promise<boolean> {
    // insert-start
    try {
      await this.authenticate()
      return true
    } catch {
      return false
    }
    // insert-end
  }
}
```

## Implementing the `getUserOrFail` method
Finally, let's implement the `getUserOrFail` method. It should return the user instance or throw an error (if the user does not exist).

```ts
export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * Returns the authenticated user or throws an error
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    // insert-start
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    return this.user
    // insert-end
  }
}
```

## Implementing the `authenticateAsClient` method
The `authenticateAsClient` method is used during tests when you want to login a user during tests via the [`loginAs` method](../testing/http_tests.md#authenticating-users). For the JWT implementation, this method should return the `authorization` header containing the JWT token.

```ts
export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * This method is called by Japa during testing when "loginAs"
   * method is used to login the user.
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    // insert-start
    const token = await this.generate(user)
    return {
      headers: {
        authorization: `Bearer ${token.token}`,
      },
    }
    // insert-end
  }
}
```

## Using the guard
Let's head over to the `config/auth.ts` and register the guard within the `guards` list.

```ts
import { defineConfig } from '@adonisjs/auth'
// insert-start
import { sessionUserProvider } from '@adonisjs/auth/session'
import env from '#start/env'
import { JwtGuard } from '../app/auth/jwt/guard.js'
// insert-end

// insert-start
const jwtConfig = {
  secret: env.get('APP_KEY'),
}
const userProvider = sessionUserProvider({
  model: () => import('#models/user'),
})
// insert-end

const authConfig = defineConfig({
  default: 'jwt',
  guards: {
    // insert-start
    jwt: (ctx) => {
      return new JwtGuard(ctx, userProvider, jwtConfig)
    },
    // insert-end
  },
})

export default authConfig
```

As you can notice, we are using the `sessionUserProvider` with our `JwtGuard` implementation. This is because the `JwtUserProviderContract` interface is compatible with the User Provider created by the Session guard.

So, instead of creating our own implementation of a User Provider, we re-use one from the Session guard.

## Final example
Once the implementation is completed, you can use the `jwt` guard like other inbuilt guards. The following is an example of how to generate and verify JWT tokens.

```ts
import User from '#models/user'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.post('login', async ({ request, auth }) => {
  const { email, password } = request.all()
  const user = await User.verifyCredentials(email, password)

  return await auth.use('jwt').generate(user)
})

router
  .get('/', async ({ auth }) => {
    return auth.getUserOrFail()
  })
  .use(middleware.auth())
```
