# Lucid user provider

The Lucid user provider uses Lucid models to look up users during authentication. You may configure the provider within the `config/auth.ts` file as follows.

```ts
import { defineConfig, providers } from '@adonisjs/auth'

const userProvider = providers.lucid({
  model: () => import('#models/user'),
  uids: ['email'],
  connection: 'pg',
})
```

<dl>

<dt>

model

</dt>

<dd>

Lazily import the model you want to use for finding users.

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

## Verifying user password

The Lucid user provider uses the [hash service](../security/hash.md) (with default driver) to verify the user's password. If you want to use a different driver, you can define the `verifyPasswordForAuth` method on the User model to manually verify the password hash. For example:

```ts
import { BaseModel } from '@adonisjs/lucid/orm'
import hash from '@adonisjs/core/services/hash'

export default class User extends BaseModel {
  // ...rest of the model properties

  async verifyPasswordForAuth(plainTextPassword: string) {
    return hash.verify(this.password, plainTextPassword)
  }
}
```

## Finding user during login

You can customize the behavior of user lookup during the `guard.attempt` method call by defining the `getUserForAuth` method on the User model.

The method will receive an array of UID column names and the value for the search. It must return an instance of the model or `null` when unable to find the user.

```ts
import { BaseModel } from '@adonisjs/lucid/orm'
import hash from '@adonisjs/core/services/hash'

export default class User extends BaseModel {
  // ...rest of the model properties

  async static getUserForAuth(uids: string[], value: string) {
    const query = this
      .query()
      .where('account_status', 'active')
      .where((builder) => {
        uids.forEach((uid) => builder.orWhere(uid, value))        
      })
    
    return query.first()
  }
}
```
