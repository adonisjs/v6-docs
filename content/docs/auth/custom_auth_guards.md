# Creating a custom auth guard

The auth package enables you to create custom authentication guards for use cases not served by the built-in guards. In this guide, we will create a guard for using JWT tokens for authentication.

The first step is to create a guard that implements the [`GuardContract`](https://github.com/adonisjs/auth/blob/next/src/auth/types.ts#L19) interface.

```ts
import { symbols } from '@adonisjs/auth'
import { GuardContract } from '@adonisjs/auth/types'
import { UserProviderContract } from '@adonisjs/auth/types/core'

export class JwtGuard<
  UserProvider extends UserProviderContract<unknown>
> implements GuardContract<
  UserProvider[typeof symbols.PROVIDER_REAL_USER]
> {
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
  async generate(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<string> {
  }

  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid JWT token
   * or throw an exception
   */
  async authenticate(): Promise<
    UserProvider[typeof symbols.PROVIDER_REAL_USER]
  > {}

  /**
   * Same as authenticate, but does not throw an exception
   */
  async check(): Promise<boolean> {}

  /**
   * Returns the authenticated user or throws an error
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {}
}
```

## The `UserProvider` generic
In the above code snippet, we use the `UserProvider` generic to infer the exact user type based on the [configured user provider](./introduction.md#choosing-a-user-provider).

The inbuilt user providers define a type-only property via the `PROVIDER_REAL_USER` symbol that we are using to infer the user data type.

All this may seem complicated if you are unfamiliar with TypeScript generics. So we recommend looking at the [code of the inbuilt user providers](https://github.com/adonisjs/auth/blob/next/src/core/user_providers/lucid.ts#L59-L62) to see how everything is setup.

## Accepting a user provider
A guard must accept a user provider to look up users during authentication. You can accept it as a constructor parameter and store a private reference.

```ts
export class JwtGuard<
  UserProvider extends UserProviderContract<unknown>
> implements GuardContract<
  UserProvider[typeof symbols.PROVIDER_REAL_USER]
> {
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

Also, we will have to use a **secret key** to sign a token, so let's update the `constructor` method and accept the secret key as an option.

```ts
// insert-start
import jwt from 'jsonwebtoken'

export type JwtGuardOptions = {
  secret: string
}
// insert-end

export class JwtGuard<
  UserProvider extends UserProviderContract<unknown>
> implements GuardContract<
  UserProvider[typeof symbols.PROVIDER_REAL_USER]
> {
  #options: JwtGuardOptions

  constructor(
    userProvider: UserProvider,
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
  ): Promise<string> {
    // insert-start
    const providerUser = await this.#userProvider.createUserForGuard(user)
    const token = jwt.sign({ userId: providerUser.getId() }, this.#options.secret)

    return token
    // insert-end
  }
}
```

- We use the `userProvider.createUserForGuard` method to create an instance of the provider user. 
The provider user exposes a unified API to get the user's unique ID.
- Finally, we use the `jwt.sign` method to create a signed token with the `userId` in the payload and return the token.

## Authenticating a request

Authenticating a request includes:

- Reading the JWT token from the request header or cookie.
- Verifying its authenticity.
- Fetching the user for whom the token was generated.

To read request headers and cookies, our guard will need access to the [HttpContext](../http/http_context.md), so let's update the class `constructor` and accept it as an argument.

```ts
// insert-start
import type { HttpContext } from '@adonisjs/core/http'
// insert-end

export class JwtGuard<
  UserProvider extends UserProviderContract<unknown>
> implements GuardContract<
  UserProvider[typeof symbols.PROVIDER_REAL_USER]
> {
  #ctx: HttpContext

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
  AuthenticationException
  // insert-end
} from '@adonisjs/auth'

export class JwtGuard<
  UserProvider extends UserProviderContract<unknown>
> implements GuardContract<
  UserProvider[typeof symbols.PROVIDER_REAL_USER]
> {
  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid JWT token
   * or throw an exception
   */
  async authenticate(): Promise<
    UserProvider[typeof symbols.PROVIDER_REAL_USER]
  > {
    // insert-start
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
      throw new AuthenticationException('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Split the header value and read the token from it
     */
    const [, token] = authHeader.split('Bearer ')
    if (!token) {
      throw new AuthenticationException('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Verify token
     */
    const payload = jwt.verify(token, this.#options.secret)
    if (typeof payload !== 'object' || !('userId' in payload)) {
      throw new AuthenticationException('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Fetch the user by user ID and save a reference to it
     */
    this.user = await this.#userProvider.findById(payload.userId)
    return this.getUserOrFail()
    // insert-end
  }
}
```

## Implementing the `check` method
The `check` method is a silent version of the authenticate method, and you can implement it as follows.

```ts
export class JwtGuard<
  UserProvider extends UserProviderContract<unknown>
> implements GuardContract<
  UserProvider[typeof symbols.PROVIDER_REAL_USER]
> {
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
export class JwtGuard<
  UserProvider extends UserProviderContract<unknown>
> implements GuardContract<
  UserProvider[typeof symbols.PROVIDER_REAL_USER]
> {
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    // insert-start
    if (!this.user) {
      throw new errors.AuthenticationException('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    return this.user
    // insert-end
  }
}
```

## Using the guard
To use the JWT guard within your application, you must register a factory function within the `guards` object inside the `config/auth.ts` file.

The factory function is invoked on every HTTP request. It receives an instance of the [HttpContext](../http/http_context.md) and must return an instance of the `JwtGuard`.

```ts
function jwtFactory(ctx) {
  return new JwtGuard(ctx, provider, config)
}
```

As you can notice, the `jwtFactory` does not have access to the `provider` and the `config` variables, and therefore it cannot create an instance of the `JwtGuard`. 

To solve this issue, we must create a helper method that accepts the configuration and a provider and returns the `jwtFactory` function. The final implementation will look as follows.

```ts
import { ConfigProvider } from '@adonisjs/core/types'
import {
  GuardContract,
  GuardConfigProvider
} from '@adonisjs/auth/types'

/**
 * Helper function to configure the JwtGuard
 */
export function jwtGuard<UserProvider extends UserProviderContract<unknown>>(
  config: JwtGuardOptions & {
    provider: ConfigProvider<UserProvider>
  }
): GuardConfigProvider<(ctx: HttpContext) => JwtGuard<UserProvider>> {
  return {
    async resolver(_, app) {
      const provider = await config.provider.resolver(app)
      return (ctx) => {
        return new JwtGuard(ctx, provider, config)
      }
    },
  }
}
```

Once done, you can use the `jwtGuard` helper inside the `config/auth.ts` file.

```ts
import { defineConfig, providers } from '@adonisjs/auth'

// insert-start
import env from '#start/env'
import { jwtGuard } from 'my-custom-package'
// insert-end

const userProvider = providers.lucid({
  model: () => import('#models/user'),
  uids: ['email'],
})

/**
 * Configure auth guards
 */
const authConfig = defineConfig({
  default: 'jwt',
  guards: {
    // insert-start
    jwt: jwtGuard({
      provider: userProvider,
      secret: env.get('APP_KEY'),
    }),
    // insert-end
  },
})
```

Finally, you can use the `ctx.auth` object to grab an instance of the `JwtGuard` and use its API.

```ts
import User from '#models/user'
import router from '@adonisjs/core/services/router'

router.post('/login', ({ auth, request }) => {
  const email = request.input('email')
  const user = await User.findByOrFail('email', email)

  return auth.use('jwt').generate(user)
})
```

## Implementing the `attempt` method
In the previous example, we manually fetch the user from the database and call the `generate` method to create a token.

However, we can encapsulate the logic for finding a user, verifying their password, and generating the token within the `JwtGuard` class. Let's create a new method named `attempt` for the same.

```ts
import {
  symbols,
  // insert-start
  InvalidCredentialsException
  // insert-end
} from '@adonisjs/auth'

export class JwtGuard<
  UserProvider extends UserProviderContract<unknown>
> implements GuardContract<
  UserProvider[typeof symbols.PROVIDER_REAL_USER]
> {
  // insert-start
  /**
   * Attempt to generate a token after verifying the user
   * credentials.
   */
  async attempt(uid: string, password: string): Promise<string> {
    /**
     * Find a user by uid
     */
    const providerUser = await this.#userProvider.findByUid(uid)
    if (!providerUser) {
      throw new errors.InvalidCredentialsException('Invalid credentials', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Verify user password
     */
    if (!(await providerUser.verifyPassword(password))) {
      throw new errors.InvalidCredentialsException('Invalid credentials', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Get a reference to the underlying user object
     * and call the `generate` method with it
     */
    const user = providerUser.getOriginal()
    return this.generate(user)
  }
  // insert-end
}
```
