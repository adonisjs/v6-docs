# Session guard
The session guard uses the [@adonisjs/session](../http/session.md) package to login and authenticate users during an HTTP request.

Sessions and cookies have been long on the internet and work great for most applications. Therefore, we recommend using the session guard for server rendered applications or an SPA web-client on the same top-level domain.

## Configuring the guard
The authentication guards are defined inside the `config/auth.ts` file. You can configure multiple guards inside this file under the `guards` object.

```ts
// title: config/auth.ts
import { defineConfig } from '@adonisjs/auth'
// highlight-start
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
// highlight-end

const authConfig = defineConfig({
  default: 'session',
  guards: {
    // highlight-start
    session: sessionGuard({
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
      rememberMeTokensAge: '2 years',
    })
    // highlight-end
  },
})

export default authConfig
```

The `sessionGuard` method creates an instance of the [SessionGuard](https://github.com/adonisjs/auth/blob/main/modules/session_guard/guard.ts) class. It accepts a user provider that can be used for finding users during authentication and an optional config object to configure the remember tokens behavior.

The `sessionUserProvider` method creates an instance of the [SessionLucidUserProvider](https://github.com/adonisjs/auth/blob/next/modules/session_guard/user_providers/lucid.ts) class. It accepts a reference to the model to use for authentication.

