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
- [**Drizzle ORM**](https://orm.drizzle.team/) is used by many AdonisJS developers in our community. We do not have any experience using this ORM, but you want to check it out and see if it's an excellent fit for your use case.
- [**Mikro ORM**](https://mikro-orm.io/docs/guide/first-entity) is an underrated ORM in the Node.js ecosystem. MikroORM is a little verbose in comparison to Lucid. However, it is actively maintained and also built on top of Knex.
