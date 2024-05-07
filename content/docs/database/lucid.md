# Lucid ORM

Lucid is a SQL query builder, and an Active Record ORM built on top of [Knex](https://knexjs.org) created and maintained by the AdonisJS core team. Lucid strives to leverage SQL to its full potential and offers clean API for many advanced SQL operations.

:::note
The documentation for Lucid is available on [https://lucid.adonisjs.com](https://lucid.adonisjs.com)
:::

## Why Lucid

Following are some of the hand-picked Lucid features.

- A fluent query builder built on top of Knex.
- Support for read-write replicas and multiple connection management.
- Class-based models that adhere to the active record pattern (handling relations, serialization and hooks).
- Migration system to modify database schema using incremental changesets.
- Model factories to generate fake data for testing.
- Database seeders to insert initial/dummy data into the database.

Apart from those, the following are additional reasons for using Lucid inside an AdonisJS application.

- We ship first-class integrations for Lucid with the Auth package and validator. Therefore, you do not have to write these integrations yourself.

- Lucid comes pre-configured with the `api` and the `web` starter kits, providing a head start to your applications.

- One of the primary goals of Lucid is to leverage SQL to its full potential and support many advanced SQL operations like **window functions**, **recursive CTEs**, **JSON operations**, **row-based locks**, and much more.

- Both Lucid and Knex have been around for many years. Hence, they are mature and battle-tested compared to many other new ORMs.

With that said, AdonisJS does not force you to use Lucid. Just uninstall the package and install the ORM of your choice.

## Installation

Install and configure Lucid using the following command.

```sh
node ace add @adonisjs/lucid
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider inside the `adonisrc.ts` file.

   ```ts
   {
     providers: [
       // ...other providers
       () => import('@adonisjs/lucid/database_provider'),
     ]
   }
   ```

2. Register the following command inside the `adonisrc.ts` file.

   ```ts
   {
     commands: [
       // ...other commands
       () => import('@adonisjs/lucid/commands'),
     ]
   }
   ```

3. Create the `config/database.ts` file.

4. Define the environment variables and their validations for the selected dialect.

5. Install required peer dependencies.

:::


## Creating your first model

Once the configuration is completed, you can create your first model using the following command.

```sh
node ace make:model User
```

This command creates a new file inside the `app/models` directory with the following content.

```ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

Learn more about models by visiting the [official documentation](https://lucid.adonisjs.com/docs/models).

## Migrations

Migrations are a way to modify the database schema and data using incremental changesets. You can create a new migration using the following command.

```sh
node ace make:migration users
```

This command creates a new file inside the `database/migrations` directory with the following content.

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

You can run all the pending migrations using the following command.

```sh
node ace migration:run
```

Learn more about migrations by visiting the [official documentation](https://lucid.adonisjs.com/docs/migrations).

## Query Builder

Lucid ships with a fluent query builder built on top of Knex. You can use the query builder to perform CRUD operations on your database.

```ts
import db from '@adonisjs/lucid/services/db'

/**
 * Creates query builder instance
 */
const query = db.query()

/**
 * Creates query builder instance and also selects
 * the table
 */
const queryWithTableSelection = db.from('users')
```

The query builder can also be scoped to a model instance.

```ts
import User from '#models/user'

const user = await User.query().where('username', 'rlanz').first()
```

Learn more about the query builder by visiting the [official documentation](https://lucid.adonisjs.com/docs/select-query-builder).

## CRUD operations

Lucid models have built-in methods to perform CRUD operations on the database.

```ts
import User from '#models/user'

/**
 * Create a new user
 */
const user = await User.create({
  username: 'rlanz',
  email: 'romain@adonisjs.com',
})

/**
 * Find a user by primary key
 */
const user = await User.find(1)

/**
 * Update a user
 */

const user = await User.find(1)
user.username = 'romain'
await user.save()

/**
 * Delete a user
 */
const user = await User.find(1)
await user.delete()
```

Learn more about CRUD operations by visiting the [official documentation](https://lucid.adonisjs.com/docs/crud-operations).

## Learn more

- [Lucid documentation](https://lucid.adonisjs.com)
- [Installation & Usage](https://lucid.adonisjs.com/docs/installation)
- [CRUD Operations](https://lucid.adonisjs.com/docs/crud-operations)
- [Model Hooks](https://lucid.adonisjs.com/docs/model-hooks)
- [Relations](https://lucid.adonisjs.com/docs/relationships)
- [Adocasts Lucid Series](https://adocasts.com/topics/lucid)
