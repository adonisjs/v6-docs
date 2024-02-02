# SQL and ORMs

SQL databases are popular for storing the application's data in persistent storage. You can use any libraries and ORMS to make SQL queries inside an AdonisJS application.

However, the AdonisJS core team [has created/maintains Lucid](https://lucid.adonisjs.com/docs/introduction). Lucid is a SQL query builder and an Active Record ORM built on top of [Knex](https://knexjs.org/). We created Lucid back in 2016 and maintain it to date.

## Why Lucid

Apart from the features listed on the [Lucid website](https://lucid.adonisjs.com/docs/introduction), the following are additional reasons for using Lucid inside an AdonisJS application.

- We ship first-class integrations for Lucid with the Auth package and validator. Therefore, you do not have to write these integrations yourself.

- Lucid comes pre-configured with the `api` and the `web` starter kits, providing a head start to your applications.

- One of the primary goals of Lucid is to leverage SQL to its full potential and support many advanced SQL operations like **window functions**, **recursive CTEs**, **JSON operations**, **row-based locks**, and much more.

- Both Lucid and Knex have been around for many years. Hence, they are mature and battle-tested compared to many other new ORMs.

With that said, AdonisJS does not force you to use Lucid. Just uninstall the package and install the ORM of your choice.

## Other popular options
Following is the list of other popular SQL libraries and ORMs you can use inside an AdonisJS application (just like any other Node.js application).

- [**Kysely**](https://kysely.dev/docs/getting-started) is an end-to-end type safe query builder for Node.js. Kysely is a great fit if you need a lean query builder without any models. We have written an article explaining [how you can integrate Kysely inside an AdonisJS application](https://adonisjs.com/blog/kysely-with-adonisjs).
- [**Drizzle ORM**](https://orm.drizzle.team/) is used by many AdonisJS developers in our community. We do not have any experience using this ORM, but you want to check it out and see if it's an excellent fit for your use case.
- [**Mikro ORM**](https://mikro-orm.io/docs/guide/first-entity) is an underrated ORM in the Node.js ecosystem. MikroORM is a little verbose in comparison to Lucid. However, it is actively maintained and also built on top of Knex.
