# Authentication

AdonisJS ships with a robust and secure authentication system you can use to log in and authenticate users of your application. Be it a server-rendered application, a SPA client, or a mobile app, you can set up authentication for all of them.

The authentication package is built around **guards** and **providers**. 

- Guards are end-to-end implementations of a specific login type. For example, the `session` guard allows you to authenticate users using cookies and session. Meanwhile, the `access_tokens` guard allows you to authenticate clients using tokens.

- Providers are used to look up users and tokens from a database. You can either use the inbuilt providers or implement your own.


:::note

To ensure the security of your applications, we properly hash user passwords and tokens. Moreover, the security primitives of AdonisJS are protected from [timing attacks](https://en.wikipedia.org/wiki/Timing_attack) and [session fixation attacks](https://owasp.org/www-community/attacks/Session_fixation).


:::

## Features not supported by the Auth package

The auth package narrowly focuses on authenticating HTTP requests, and the following features are outside its scope.

- User registration features like **registration forms**, **email verification**, and **account activation**.
- Account management features like **password recovery** or **email update**.
- Assigning roles or verifying permissions. Instead, [use bouncer](../digging_deeper/authorization.md) to implement authorization checks in your application.


<!-- :::note

**Looking for a fully-fledged user management system?**\

Checkout persona. Persona is an official package and a starter kit with a fully-fledged user management system. 

It provides ready-to-use actions for user registration, email management, session tracking, profile management, and 2FA.

::: -->


## Choosing an auth guard

The following inbuilt authentication guards provide you with the most straightforward workflow for authenticating users without compromising the security of your applications. Also, you can [build your authentication guards](./custom_auth_guards.md) for custom requirements.

### Session

The session guard uses the [@adonisjs/session](../http/session.md) package to track the logged-in user state inside the session store. 

Sessions and cookies have been on the internet for a long time and work great for most applications. We recommend using the session guard:

- If you are creating a server-rendered web application.
- Or, an AdonisJS API with its client on the same top-level domain. For example, `api.example.com` and `example.com`.

### Access tokens

Access tokens are cryptographically secure random tokens (also known as Opaque access tokens) issued to users after successful login. You may use access tokens for apps where your AdonisJS server cannot write/read cookies. For example:

- A native mobile app.
- A web application hosted on a different domain than your AdonisJS API server.

When using access tokens, it becomes the responsibility of your client-side application to store them securely. Access tokens provide unrestricted access to your application (on behalf of a user), and leaking them can lead to security issues.

### Basic auth

The basic auth guard is an implementation of the [HTTP authentication framework](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication), in which the client must pass the user credentials as base64 encoded via the `Authorization` header.

There are better ways to implement a secure login system than basic authentication. However, you may use it temporarily while your application is in active development.

### Why not JWTs?

JWTs have become the darling of the internet lately. However, for most applications, JWTs are overkill and need complicated setups to keep them secure.

The internet is full of articles covering "Why you should not JWT?". We will not repeat the same concerns. You can read the following articles to understand our point of view.

- [Why you should not use JWT](https://apibakery.com/blog/tech/no-jwt/)
- [Stop using JWTs for sessions](http://cryto.net/~joepie91/blog/2016/06/19/stop-using-jwt-for-sessions-part-2-why-your-solution-doesnt-work/)

That said, we are not saying that JWTs are never the right choice. If you decide to use JWT, you can [implement a custom guard for it](./custom_auth_guards.md). 

## Choosing a user provider
As covered earlier in this guide, a user provider is responsible for finding users during the authentication process.

The user providers are guards specific; for example, The user provider for the session guard is responsible for finding users by their ID, and the user provider for the access tokens guard is also responsible for verifying access tokens.

We ship with a Lucid user provider for the inbuilt guards, which uses Lucid models to find users, generate tokens, and verify tokens. If you are not using Lucid, you must [implement a custom user provider]().

## Installation

The auth system comes pre-configured with the `web` and the `api` starter kits. However, you can configure it manually inside an application as follows.

:::codegroup

```sh
// title: npm
npm i @adonisjs/auth@next
```

```sh
// title: yarn
yarn add @adonisjs/auth@next
```

```sh
// title: pnpm
pnpm add @adonisjs/auth@next
```

:::

Once done, you must run the following command to configure the auth package.

```sh
# Configure with session guard (default)
node ace configure @adonisjs/auth --guard=session

# Configure with access tokens guard
node ace configure @adonisjs/auth --guard=tokens

# Configure with basic auth guard
node ace configure @adonisjs/auth --guard=basic_auth
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider inside the `adonisrc.ts` file.

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/auth/auth_provider')
      ]
    }
    ```

2. Creates and registers the following middleware inside the `start/kernel.ts` file.

    ```ts
    router.use([
      () => import('@adonisjs/auth/initialize_auth_middleware')
    ])
    ```

    ```ts
    router.named([
      auth: () => import('#middleware/auth_middleware'),
      // only if using the session guard
      guest: () => import('#middleware/guest_middleware')
    ])
    ```

3. Creates the user model inside the `app/models` directory.
4. Creates database migration for the `users` table.
5. Creates database migrations for the selected guard.
:::

## Creating the users table
The `configure` command creates a database migration for the `users` table inside the `database/migrations` directory. Feel free to open this file and make changes per your application requirements.

By default, the following columns are created.

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

Also, update the `User` model if you define, rename, or remove columns from the `users` table.

## Configuring the Auth finder mixin
The Auth finder mixin adds `findForAuth` and `verifyCredentials` methods to the applied model. The `verifyCredentials` method is used to find a user inside the database and verify their password during login.

The main reason for using the `verifyCredentials` method is to keep your application secure from [timing attacks](https://en.wikipedia.org/wiki/Timing_attack). Learn more about [user login and timing attacks]().

```ts
import { DateTime } from 'luxon'
// highlight-start
import { useWithFinder } from '@adonisjs/auth'
import hash from '@adonisjs/core/services/hash'
// highlight-end
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'

// highlight-start
const AuthFinder = useWithFinder(hash.use('scrypt'), {
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

## Next steps

- Learn how to [verify user credentials]() without compromising the security of your application.
- Use [session guard](./session_guard.md) for stateful authentication.
- Use [access tokens guard](./access_tokens_guard.md) for tokens based authentication.
