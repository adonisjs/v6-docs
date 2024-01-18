# Lucid user provider

The Lucid user provider uses Lucid models to look up users during authentication. You may configure the provider within the `config/auth.ts` file as follows.

```ts
import { defineConfig, providers } from '@adonisjs/auth'

const userProvider = providers.lucid({
  model: () => import('#models/user'),
  uids: ['email'],
  passwordColumnName: 'password',
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

passwordColumnName

</dt>

<dd>

Reference to the property that has user password hash. The password hash is used to verify the plain text password during login.

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

The Lucid user provider uses the [hash service](../security/hash.md) (with default driver) to verify the user's password. If you want to use a different driver, you can define the `hasher` property within the provider's config. The `hasher` property is a reference to the list of hashers defined within the `config/hash.ts` file.

```ts
// title: config/hash.ts
import { defineConfig, drivers } from '@adonisjs/core/hash'

export default defineConfig({
  default: 'scrypt',
  list: {
    scrypt: drivers.scrypt(),
    // highlight-start
    argon: drivers.argon2(),
    // highlight-end
  }
})
```

```ts
// title: config/auth.ts
const userProvider = providers.lucid({
  model: () => import('#models/user'),
  uids: ['email'],
  passwordColumnName: 'password',
  // highlight-start
  hasher: 'argon'
  // highlight-end
})
```

## Finding user during login
During the `guard.attempt` method call, the Lucid provider queries the model for all the `uids` with an `orWhere` clause. However, if you need more control, you can define `getUserForAuth` static method on the model to customize the user lookup query.

The `getUserForAuth` will receive an array of UID column names and the value for the search. It must return an instance of the model or `null` when unable to find the user.

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
