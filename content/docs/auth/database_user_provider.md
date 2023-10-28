# Database user provider

The Database user provider uses the Database query builder to look up users during authentication. You may configure the provider within the `config/auth.ts` file as follows.

```ts
import { defineConfig, providers } from '@adonisjs/auth'

const userProvider = providers.db({
  table: 'users',
  id: 'id',
  passwordColumnName: 'password',
  uids: ['email'],
  connection: 'pg',
})
```

<dl>

<dt>

table

</dt>

<dd>

The database table to query for finding the user during login and authentication.

</dd>

<dt>

id

</dt>

<dd>

The `id` column to uniquely identify a user. It could be the auto-increment id or some other unique value.

</dd>

<dt>

passwordColumnName

</dt>

<dd>

The column name for the `password` field. The password should be a hash computed using the [hash service](../security/hash.md).

</dd>


<dt>

uids

</dt>

<dd>

An array of unique IDs can be used to look up a user during login. For example, you can allow users to log in with their `email` or `username` to add these properties to the `uids` array.

</dd>

<dt>

connection (optional)

</dt>

<dd>

Optionally, define the database connection name to use when making database queries.

Do note this is a static property and will be applied to all queries a guard makes.

</dd>

</dl>
