# Authentication

AdonisJS ships with a robust and secure authentication system you can use to log in and authenticate users of your application. Be it a server-rendered application, an SPA client, or a mobile app, you can setup authentication for all of them.

The authentication package is built around **guards** and **providers**. 

- Guards are end-to-end implementations of a specific login type. For example, the `session` guard allows you to authenticate users using cookies and session. Whereas the `opaque_tokens` guard allows you to authenticate clients using tokens.

- Providers are used to look up users and tokens from a database. You can either use the inbuilt providers or implement your own.


:::note

To ensure the security of your applications, we properly hash user passwords and tokens. Moreover, the security primitives of AdonisJS are protected from [timing attacks](https://en.wikipedia.org/wiki/Timing_attack) and [session fixation attacks](https://owasp.org/www-community/attacks/Session_fixation).


:::

## Features NOT supported by the Auth package

The AdonisJS auth package has a narrow focus on performing user login and authenticating subsequent requests. Therefore, the following features set are outside the scope of the auth package.

- User registration features like **registration forms**, **email verification**, and **account activation**.
- Account management features like **password recovery** or **email update**.
- Assigning roles or verifying permissions. 
<!-- Instead, [use bouncer]() to implement authorization checks in your application. -->


<!-- :::note

**Looking for a fully-fledged user management system?**\

Checkout persona. Persona is an official package and a starter kit that comes with a fully-fledged user management system. 

It provides ready to use actions for user registration, email management, session tracking, profile management and 2FA.

::: -->


## Choosing an auth guard

The following inbuilt authentication guards provide you with the most straightforward workflow for authenticating users without compromising the security of your applications. Also, you can [build your authentication guards](./custom_auth_guards.md) for custom requirements.

### Session

The session guard uses the [@adonisjs/session](../http/session.md) package to track the logged-in user state inside the session store. 

Sessions and cookies have been long on the internet and work great for most applications. We recommend using the session guard:

- If you are creating a server-rendered web application.
- Or, an AdonisJS API with its client on the same top-level domain. For example, `api.example.com` and `example.com`.

### Opaque tokens

Opaque tokens (OAT) are cryptographically secure random tokens issued to users after successful login. Use Opaque tokens for apps where your AdonisJS server cannot write/read cookies. For example:

- A native mobile app.
- Or a web application hosted on a different domain than your AdonisJS API server.

When using Opaque tokens, it becomes the responsibility of your client-side application to store them securely. OATs provide unrestricted access to your application (on behalf of a user), and leaking them can lead to security issues.

### Why not JWTs?

JWTs have become the darling of the internet lately. However, for most applications, JWTs are overkill and need complicated setups to keep them secure.

The internet is full of articles covering "Why you should not JWT?". We will not repeat the same concerns. You can read the following articles to understand our point of view.

- [Why you should not use JWT](https://apibakery.com/blog/tech/no-jwt/)
- [Stop using JWTs for sessions](http://cryto.net/~joepie91/blog/2016/06/19/stop-using-jwt-for-sessions-part-2-why-your-solution-doesnt-work/)

That said, we are not saying that JWTs are never the right choice. If you decide to use JWT, you can implement a custom guard for it. 

## Choosing a user provider

As covered earlier in this guide, a user provider is responsible for finding users during the login and the authentication process.

The auth package ships the following user providers that needs the `@adonisjs/lucid` package to be installed first.

### Lucid user provider

Lucid user providers uses a model class for authentication and password verification.

See also: [Configuring Lucid provider](./lucid_user_provider.md)

### Database user provider

Database user provider queries a SQL database directly using the Lucid query builder. You might want to use the DB user provider if you are not using models in your application.

See also: [Configuring Database provider](./database_user_provider.md)

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
node ace configure @adonisjs/auth
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

2. Registers the following middleware inside the `start/kernel.ts` file.

    ```ts
    router.use([
      () => import('@adonisjs/auth/initialize_auth_middleware')
    ])
    ```

    ```ts
    router.named([
      auth: () => import('#middleware/auth_middleware'),
      guest: () => import('#middleware/guest_middleware')
    ])
    ```

:::


Initial setup does not create a config file. Instead, you must read the following guides and manually configure guards you want to use in your application.

- [Session guard setup and usage](./session_guard.md).
<!-- - [API tokens guard setup and usage]().
- [Personal tokens guard setup and usage]().
- [Basic auth guard setup and usage](). -->
