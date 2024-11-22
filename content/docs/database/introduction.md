---
summary: Available options for SQL libraries and ORMs in AdonisJS applications.
---

# SQL and ORMs

SQL databases are popular for storing the application's data in persistent storage. You can use any libraries and ORMs to make SQL queries inside an AdonisJS application.

:::note
The AdonisJS core team built the [Lucid ORM](./lucid.md) but does not force you to use it. You can use any other SQL libraries and ORMs you would like inside an AdonisJS application.
:::

## Popular options

Following is the list of other popular SQL libraries and ORMs you can use inside an AdonisJS application (just like any other Node.js application).

- [**Lucid**](./lucid.md) is a SQL query builder and an **Active Record ORM** built on top of [Knex](https://knexjs.org) created and maintained by the AdonisJS core team.
- [**Prisma**](https://prisma.io/orm) Prisma ORM is another popular ORM in the Node.js ecosystem. It has a large community following. It offers intuitive data models, automated migrations, type-safety & auto-completion.
- [**Kysely**](https://kysely.dev/docs/getting-started) is an end-to-end type safe query builder for Node.js. Kysely is a great fit if you need a lean query builder without any models. We have written an article explaining [how you can integrate Kysely inside an AdonisJS application](https://adonisjs.com/blog/kysely-with-adonisjs).
- [**Drizzle ORM**](https://orm.drizzle.team/) is used by many AdonisJS developers in our community. We do not have any experience using this ORM, but you might want to check it out and see if it's an excellent fit for your use case.
- [**Mikro ORM**](https://mikro-orm.io/docs/guide/first-entity) is an underrated ORM in the Node.js ecosystem. MikroORM is a little verbose in comparison to Lucid. However, it is actively maintained and also built on top of Knex.
- [**TypeORM**](https://typeorm.io) is a popular ORM in the TypeScript ecosystem.

## Using other SQL libraries and ORMs

When using another SQL library or ORM, you will have to change the configuration of some packages manually.

### Authentication

The [AdonisJS authentication module](../authentication/introduction.md) comes with built-in support for Lucid to fetch the authenticated user. When using another SQL library or ORM, you will have to implement the `SessionUserProviderContract` or the `AccessTokensProviderContract` interface to fetch the user.

Here is an example of how you can implement the `SessionUserProviderContract` interface when using `Kysely`.

```ts
import { symbols } from '@adonisjs/auth'
import type { SessionGuardUser, SessionUserProviderContract } from '@adonisjs/auth/types/session'
import type { Users } from '../../types/db.js' // Specific to Kysely

export class SessionKyselyUserProvider implements SessionUserProviderContract<Users> {
  /**
   * Used by the event emitter to add type information to the events emitted by the session guard.
   */   
  declare [symbols.PROVIDER_REAL_USER]: Users

  /**
   * Bridge between the session guard and your provider.
   */
  async createUserForGuard(user: Users): Promise<SessionGuardUser<Users>> {
    return {
      getId() {
        return user.id
      },
      getOriginal() {
        return user
      },
    }
  }

  /**
   * Find a user using the user id using your custom SQL library or ORM.
   */
  async findById(identifier: number): Promise<SessionGuardUser<Users> | null> {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', identifier)
      .executeTakeFirst()

    if (!user) {
      return null
    }

    return this.createUserForGuard(user)
  }
}
```

Once you have implemented the `UserProvider` interface, you can use it inside your configuration.

```ts
const authConfig = defineConfig({
  default: 'web',

  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
      
      provider: configProvider.create(async () => {
        const { SessionKyselyUserProvider } = await import(
          '../app/auth/session_user_provider.js' // Path to the file
        )

        return new SessionKyselyUserProvider()
      }),
    }),
  },
})
```
