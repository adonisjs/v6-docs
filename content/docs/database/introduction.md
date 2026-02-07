---
summary: AdonisJS 应用中可用的 SQL 库和 ORM 选项。
---

# SQL 与 ORM

SQL 数据库是存储应用程序持久化数据的常用选择。你可以在 AdonisJS 应用程序中使用任何 SQL 库和 ORM 来执行 SQL 查询。

:::note
AdonisJS 核心团队构建了 [Lucid ORM](./lucid.md)，但并不强制你使用它。你可以在 AdonisJS 应用程序中使用任何你喜欢的其他 SQL 库和 ORM。
:::

## 热门选项

以下是可以在 AdonisJS 应用程序中使用的其他热门 SQL 库和 ORM（就像在任何其他 Node.js 应用程序中一样）。

- [**Lucid**](./lucid.md) 是一个 SQL 查询构建器和 **Active Record ORM**，它构建在 [Knex](https://knexjs.org) 之上，由 AdonisJS 核心团队创建和维护。
- [**Prisma**](https://prisma.io/orm) Prisma ORM 是 Node.js 生态系统中另一个流行的 ORM。它拥有庞大的社区支持。它提供了直观的数据模型、自动化迁移、类型安全和自动补全。
- [**Kysely**](https://kysely.dev/docs/getting-started) 是一个用于 Node.js 的端到端类型安全查询构建器。如果你需要一个不需要任何模型的精简查询构建器，Kysely 是一个很好的选择。我们写了一篇文章解释 [如何在 AdonisJS 应用程序中集成 Kysely](https://adonisjs.com/blog/kysely-with-adonisjs)。
- [**Drizzle ORM**](https://orm.drizzle.team/) 被我们社区中的许多 AdonisJS 开发者所使用。我们没有任何使用此 ORM 的经验，但你可以查看一下，看看它是否非常适合你的用例。
- [**Mikro ORM**](https://mikro-orm.io/docs/guide/first-entity) 是 Node.js 生态系统中一个被低估的 ORM。与 Lucid 相比，MikroORM 稍微繁琐一些。但是，它维护积极，并且也是构建在 Knex 之上的。
- [**TypeORM**](https://typeorm.io) 是 TypeScript 生态系统中流行的 ORM。

## 使用其他 SQL 库和 ORM

当使用其他 SQL 库或 ORM 时，你必须手动更改某些包的配置。

### 身份验证

[AdonisJS 身份验证模块](../authentication/introduction.md) 内置了对 Lucid 的支持以获取经过身份验证的用户。当使用其他 SQL 库或 ORM 时，你必须实现 `SessionUserProviderContract` 或 `AccessTokensProviderContract` 接口来获取用户。

以下是使用 `Kysely` 时如何实现 `SessionUserProviderContract` 接口的示例。

```ts
import { symbols } from '@adonisjs/auth'
import type { SessionGuardUser, SessionUserProviderContract } from '@adonisjs/auth/types/session'
import type { Users } from '../../types/db.js' // Specific to Kysely

export class SessionKyselyUserProvider implements SessionUserProviderContract<Users> {
  /**
   * 用于事件发射器向会话守卫发出的事件添加类型信息。
   */   
  declare [symbols.PROVIDER_REAL_USER]: Users

  /**
   * 会话守卫和你的提供者之间的桥梁。
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
   * 使用自定义 SQL 库或 ORM 通过用户 id 查找用户。
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

一旦实现了 `UserProvider` 接口，就可以在配置中使用它。

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
          '../app/auth/session_user_provider.js' // 文件路径
        )

        return new SessionKyselyUserProvider()
      }),
    }),
  },
})
```
