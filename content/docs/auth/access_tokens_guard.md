# Access tokens guard
Access tokens authenticate HTTP requests in API contexts where the server cannot persist cookies on the end-user device, for example, third-party access to an API or authentication for a mobile app.

Access tokens can be generated in any format; for instance, the tokens that conform to the JWT standard are known as JWT access tokens, and tokens in a proprietary format are known as opaque access tokens.

AdonisJS uses opaque access tokens that are structured and stored as follows.

- A token is represented by a cryptographically secure random value suffixed with a CRC32 checksum.
- A hash of the token value is persisted in the database. This hash is used to verify the token at the time of authentication.
- The final token value is base64 encoded and prefixed with `oat_`. The prefix can be customized.
- The prefix and the CRC32 checksum suffix help [secret scanning tools](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning) identify a token and prevent them from leaking inside a codebase. 

## Configuring the user model
Before using the access tokens guard, you must set up a tokens provider with the User model. **The tokens provider is used to create, list, and verify access tokens**.

The auth package comes with a database tokens provider, which persists tokens inside an SQL database. You can configure it as follows.

```ts
import { BaseModel } from '@adonisjs/lucid/orm'
// highlight-start
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
// highlight-end

export default class User extends BaseModel {
  // ...rest of the model properties

  // highlight-start
  static authTokens = DbAccessTokensProvider.forModel(User)
  // highlight-end
}
```

The `DbAccessTokensProvider.forModel` accepts the User model as the first argument and an options object as the second argument.

```ts
export default class User extends BaseModel {
  // ...rest of the model properties

  static authTokens = DbAccessTokensProvider.forModel(User, {
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

The duration after which the token will expire. You can pass a numeric value in seconds or a [time expression](https://github.com/poppinss/utils?tab=readme-ov-file#secondsparseformat) as a string.

By default, tokens are long-lived and do not expire. Also, you can specify the expiry of a token at the time it is generated.

</dd>

<dt>

prefix

</dt>

<dd>

The prefix for the publicly shared token value. Defining a prefix helps [secret scanning tools](https://github.blog/2021-04-05-behind-githubs-new-authentication-token-formats/#identifiable-prefixes) identify a token and prevent it from leaking inside the codebases.

Changing the prefix after issuing tokens will make them invalid. Therefore, choose the prefix carefully and do not change them often.

Defaults to `oat_`.

</dd>

<dt>

table

</dt>

<dd>

The database table name for storing the access tokens. Defaults to `auth_access_tokens`. 

</dd>

<dt>

type

</dt>

<dd>

A unique type to identify a bucket of tokens. If you issue multiple types of tokens within a single application, you must define a unique type for all of them.

Defaults to `auth_token`.

</dd>

<dt>

tokenSecretLength

</dt>

<dd>

The length (in characters) of the random token value. Defaults to `40`.

</dd>

</dl>

---

Once you have configured a token provider, you can start [issuing tokens](#issuing-a-token) on behalf of a user. You do not have to set up an authentication guard for issuing tokens. The guard is needed to verify tokens.

## Creating the access tokens database table
We create the migration file for the `auth_access_tokens` table during the initial setup. The migration file is stored inside the `database/migrations` directory.

You may create the database table by executing the `migration:run` command.

```sh
node ace migration:run
```

However, if you are configuring the auth package manually for some reason, you can create a migration file manually and copy-paste the following code snippet inside it.

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
      table.integer('tokenable_id').notNullable().unsigned().references('id').inTable('users')
      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.json('abilities').notNullable()
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

## Issuing tokens
Depending upon your application, you might issue a token during login or after login from the application dashboard. In either case, issuing a token requires a user object (for whom the token will be generated), and you can generate them directly using the `User` model.

In the following example, we **find a user by id** and **issue them an access token** using the `User.authTokens.create` method. Of course, in a real-world application, you will have this endpoint guarded by authentication, but let's keep it simple for now.

The `.create` method accepts an instance of the User model and returns an instance of the [AccessToken](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/access_token.ts) class. 

The `token.value` property contains the value (wrapped as a [Secret](../reference/helpers.md#secret)) that must be shared with the user. The value is only available when generating the token, and the user will not be able to see it again.

```ts
import router from '@adonisjs/core/services/router'
import User from '#models/user'

router.post('users/:id/tokens', ({ params }) => {
  const user = await User.findOrFail(params.id)
  const token = await User.authTokens.create(user)

  return {
    type: 'bearer',
    value: token.value!.release(),
  }
})
```

You can also return the `token` directly in response, which will be serialized to the following JSON object.

```ts
router.post('users/:id/tokens', ({ params }) => {
  const user = await User.findOrFail(params.id)
  const token = await User.authTokens.create(user)

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

### Defining abilities
Depending upon the application you are building, you might want to limit access tokens to only perform specific tasks. For example, issue a token that allows reading and listing projects without creating or deleting them.

In the following example, we define an array of abilities as the second parameter. The abilities are serialized to a JSON string and persisted inside the database.

For the auth package, the abilities have no real meaning. It is up to your application to check for token abilities before performing a given action.

```ts
await User.authTokens.create(user, ['server:create', 'server:read'])
```

### Token abilities vs. Bouncer abilities

You should not confuse token abilities with [bouncer authorization checks](../digging_deeper/authorization.md#defining-abilities). Let's try to understand the difference with a practical example.

- Let's say you define a **bouncer ability that allows admin users to create new projects**.

- The same admin user creates a token for themselves, but to prevent token abuse, they limit the token abilities to **read projects**.

- Now, within your application, you will have to implement access control, which allows the admin users to create new projects while disallowing the token from creating new projects.

You can write a bouncer ability for this use case as follows.

:::note

The `user.currentAccessToken` refers to the access token used for authentication during the current HTTP request. You can learn more about it inside the [authenticating requests](#the-current-access-token) section.

:::

```ts
import { AccessToken } from '@adonisjs/auth/access_tokens'

export const createProject = Bouncer.ability(
  (user: User & { currentAccessToken?: AccessToken }) => {
    /**
     * If there is no "currentAccessToken" token property, it means
     * the user authenticated without an access token
     */
    if (!user.currentAccessToken) {
      return user.isAdmin
    }

    /**
     * Otherwise, check the user isAdmin and the token they
     * used for authentication allows "project:create"
     * ability.
     */
    return user.isAdmin && user.currentAccessToken.allows('project:create')
  }
)
```

### Expiring tokens
By default, the tokens are long-lived, and they never expire. However, you define the expiration at the time of [configuring the tokens provider](#configuring-the-user-model) or when generating a token.

The expiry can be defined as a numeric value representing seconds or a string-based time expression.

```ts
await User.authTokens.create(
  user, // for user
  ['*'], // with all abilities
  {
    expiresIn: '30 days' // expires in 30 days
  }
)
```

### Naming tokens
By default, the tokens are not named. However, you can assign them a name when generating the token. For example, if you allow the users of your application to self-generate tokens, you may ask them also to specify a recognizable name.

```ts
await User.authTokens.create(
  user,
  ['*'],
  {
    name: request.input('token_name'),
    expiresIn: '30 days'
  }
)
```

## Configuring the guard
Now that we can issue tokens, let's configure an authentication guard to verify requests and authenticate users. The guard must be configured inside the `config/auth.ts` file under the `guards` object.

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
        tokens: 'authTokens',
        model: () => import('#models/user'),
      })
    }),
    // highlight-end
  },
})

export default authConfig
```

The `tokensGuard` method creates an instance of the [AccessTokensGuard](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/guard.ts) class. It accepts a user provider that can be used for verifying tokens and finding users.

The `tokensUserProvider` method accepts the following options and returns an instance of the [AccessTokensLucidUserProvider](https://github.com/adonisjs/auth/blob/next/modules/access_tokens_guard/user_providers/lucid.ts) class.

- `model`: The Lucid model to use for finding users.
- `tokens`: The static property name of the model to reference the tokens provider.

## Authenticating requests
Once the guard has been configured, you can start authenticating requests using the `auth` middleware or manually calling the `auth.authenticate` method.

The `auth.authenticate` method returns an instance of the User model for the authenticated user, or it throws an [E_UNAUTHORIZED_ACCESS](../reference/exceptions.md#e_unauthorized_access) exception when unable to authenticate the request.

```ts
import router from '@adonisjs/core/services/router'

router.post('projects', async ({ auth }) => {
  // Authenticate using the default guard
  const user = await auth.authenticate()

  // Authenticate using a named guard
  const user = await auth.authenticateUsing('api')
})
```

### Using the auth middleware

Instead of manually calling the `authenticate` method. You can use the `auth` middleware to authenticate the request or throw an exception.

The auth middleware accepts an array of guards to use for authenticating the request. The authentication process stops after one of the mentioned guards authenticates the request.

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

### Check if the request is authenticated
You can check if a request has been authenticated using the `auth.isAuthenticated` flag. The value of `auth.user` will always be defined for an authenticated request.

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

### Get authenticated user or fail

If you do not like using the [non-null assertion operator](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-) on the `auth.user` property, you may use the `auth.getUserOrFail` method. This method will return the user object or throw [E_UNAUTHORIZED_ACCESS](../reference/exceptions.md#e_unauthorized_access) exception.

```ts
import { HttpContext } from '@adonisjs/core/http'

class PostsController {
  async store({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.related('posts').create(postData)
  }
}
```

## The current access token
The access token guard defines the `currentAccessToken` property on the user object after successfully authenticating the request. The `currentAccessToken` property is an instance of the [AccessToken](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/access_token.ts) class. 

You may use the `currentAccessToken` object to get the token's abilities or check the expiration of the token. Also, during authentication, the guard will update the `last_used_at` column to reflect the current timestamp.

If you reference the User model with `currentAccessToken` as a type in the rest of the codebase, you may want to declare this property on the model itself.

:::caption{for="error"}

**Instead of merging `currentAccessToken`**

:::

```ts
import { AccessToken } from '@adonisjs/auth/access_tokens'

Bouncer.ability((
  user: User & { currentAccessToken?: AccessToken }
) => {
})
```

:::caption{for="success"}

**Declare it as a property on the model**

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

## Listing all tokens
You may use the tokens provider to get a list of all the tokens using the `authTokens.all` method. The return value will be an array of `AccessToken` class instances.

```ts
router
  .get('/tokens', async ({ auth }) => {
    return User.authTokens.all(auth.user!)
  })
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
```

The `all` method also returns expired tokens. You may want to filter them before rendering the list or display a **"Token expired"** message next to the token. For example

```edge
@each(token in tokens)
  <h2> {{ token.name }} </h2>
  @if(token.isExpired())
    <p> Expired </p>
  @end

  <p> Abilities: {{ token.abilities.join(',') }} </p>
@end
```

## Deleting tokens
You may delete a token using the `authTokens.delete` method. The method accepts the user as the first parameter and the token id as the second parameter.

```ts
await User.authTokens.delete(user, token.identifier)
```

## Events
Please check the [events reference guide]() to view the list of available events emitted by the access tokens guard.
