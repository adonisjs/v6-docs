# Hashing

<<<<<<< HEAD
You may hash user passwords in your application using the `hash` service. AdonisJS has first-class support for `bcrypt`, `scrypt`, and `argon2` hashing algorithms and the ability to [add custom drivers](#creating-a-custom-hash-driver).
=======
You may hash user passwords in your application using the `hash` service. AdonisJS has first-class support for `bcrypt`, `scrypt`, and `argon2` hashing algorithms and the ability to [add custom drivers](../concepts/extending_the_framework.md#creating-a-hash-driver).
>>>>>>> a7aa500 (docs: first draft of new structure)

The hashed values are stored in [PHC string format](https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md). PHC is a deterministic encoding specification for formatting hashes.


## Usage

The `hash.make` method accepts a plain string value (the user password input) and returns a hash output.

```ts
import hash from '@adonisjs/core/services/hash'

const hash = await hash.make('user_password')
// $scrypt$n=16384,r=8,p=1$iILKD1gVSx6bqualYqyLBQ$DNzIISdmTQS6sFdQ1tJ3UCZ7Uun4uGHNjj0x8FHOqB0pf2LYsu9Xaj5MFhHg21qBz8l5q/oxpeV+ZkgTAj+OzQ
```

You [cannot convert a hash value to plain text](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#hashing-vs-encryption), hashing is a one-way process, and there is no way to retrieve the original value after a hash has been generated.

However, hashing provides a way to verify if a given plain text value matches against an existing hash, and you can perform this check using the `hash.verify` method.

```ts
import hash from '@adonisjs/core/services/hash'

if (await hash.verify(existingHash, plainTextValue)) {
  // password is correct
}
```

## Configuration

The configuration for hashing is stored inside the `config/hash.ts` file. The default driver is set to `scrypt` because scrypt uses the Node.js native crypto module and does not require any third-party packages.

```ts
// title: config/hash.ts
import { defineConfig, drivers } from '@adonisjs/core/hash'

export default defineConfig({
  default: 'scrypt',

  list: {
    scrypt: drivers.scrypt(),

    /**
     * Uncomment when using argon2
       argon: drivers.argon2(),
     */

    /**
     * Uncomment when using bcrypt
       bcrypt: drivers.bcrypt(),
     */
  }
})
```

### Argon

Argon is the recommended hashing algorithm to hash user passwords. To use argon with the AdonisJS hash service, you must install the [argon2](https://npmjs.com/argon2) npm package.

```sh
npm i argon2
```

We configure the argon driver with secure defaults but feel free to tweak the configuration options per your application requirements. Following is the list of available options.

```ts
export default defineConfig({
  // highlight-start
  // Make sure to update the default driver to argon
  default: 'argon',
  // highlight-end

  list: {
    argon: drivers.argon2({
      version: 0x13, // hex code for 19
      variant: 'id',
      iterations: 3,
      memory: 65536,
      parallelism: 4,
      saltSize: 16,
      hashLength: 32,
    })
  }
})
```

<dl>

<dt>

variant

</dt>

<dd>

The argon hash variant to use.

- `d` is faster and highly resistant against GPU attacks, which is useful for cryptocurrency
- `i` is slower and resistant against tradeoff attacks, which is preferred for password hashing and key derivation.
- `id` *(default)* is a hybrid combination of the above, resistant against GPU and tradeoff attacks.

</dd>

<dt>

version

</dt>

<dd>

The argon version to use. The available options are `0x10 (1.0)` and `0x13 (1.3)`. The latest version should be used by default.

</dd>

<dt>

iterations

</dt>

<dd>

The `iterations` count increases the hash strength but takes more time to compute. 

The default value is `3`.

</dd>

<dt>

memory

</dt>

<dd>

The amount of memory to be used for hashing the value. Each parallel thread will have a memory pool of this size. 

The default value is `65536 (KiB)`.

</dd>

<dt>

parallelism

</dt>

<dd>

The number of threads to use for computing the hash. 

The default value is `4`.

</dd>

<dt>

saltSize

</dt>

<dd>

The length of salt (in bytes). Argon generates a cryptographically secure random salt of this size when computing the hash.

The default and recommended value for password hashing is `16`.

</dd>

<dt>

hashLength

</dt>

<dd>

Maximum length for the raw hash (in bytes). The output value will be longer than the mentioned hash length because the raw hash output is further encoded to PHC format.

The default value is `32`

</dd>

</dl>

### Bcrypt

To use Bcrypt with the AdonisJS hash service, you must install the [bcrypt](http://npmjs.com/bcrypt) npm package.

```sh
npm i bcrypt
```

Following is the list of available configuration options.

```ts
export default defineConfig({
  // highlight-start
  // Make sure to update the default driver to bcrypt
  default: 'bcrypt',
  // highlight-end

  list: {
    bcrypt: drivers.bcrypt({
      rounds: 10,
      saltSize: 16,
      version: '2b'
    })
  }
})
```

<dl>

<dt>

rounds

</dt>

<dd>

The cost for computing the hash. We recommend reading the [A Note on Rounds](https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds) section from Bcrypt docs to learn how the `rounds` value has an impact on the time it takes to compute the hash.

The default value is `10`.

</dd>

<dt>

saltSize

</dt>

<dd>

The length of salt (in bytes). When computing the hash, we generate a cryptographically secure random salt of this size.

The default value is `16`.

</dd>

<dt>

version

</dt>

<dd>

The version for the hashing algorithm. The supported values are `2a` and `2b`. Using the latest version, i.e., `2b` is recommended.

</dd>

</dl>

### Scrypt

The scrypt driver uses the Node.js crypto module for computing the password hash. The configuration options are the same as those accepted by the [Node.js `scrypt` method](https://nodejs.org/dist/latest-v19.x/docs/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback).

```ts
export default defineConfig({
  // highlight-start
  // Make sure to update the default driver to scrypt
  default: 'scrypt',
  // highlight-end

  list: {
    scrypt: drivers.scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      saltSize: 16,
      maxMemory: 33554432,
      keyLength: 64
    })
  }
})
```

## Using model hooks to hash password

Since you will be using the `hash` service to hash user passwords, you may find placing the logic inside the `beforeSave` model hook helpful.

:::note

If you are using the `@adonisjs/auth` module, hashing passwords within your model is unnecessary. The `AuthFinder` automatically handles password hashing, ensuring your user credentials are securely processed. Learn more about this process [here](../authentication/verifying_user_credentials.md#hashing-user-password).

:::

```ts
import { BaseModel, beforeSave } from '@adonisjs/lucid'
import hash from '@adonisjs/core/services/hash'

export default class User extends BaseModel {
  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }
}
```

## Switching between drivers

If your application uses multiple hashing drivers, you can switch between them using the `hash.use` method. 

The `hash.use` method accepts the mapping name from the config file and returns an instance of the matching driver.

```ts
import hash from '@adonisjs/core/services/hash'

// uses "list.scrypt" mapping from the config file
await hash.use('scrypt').make('secret')

// uses "list.bcrypt" mapping from the config file
await hash.use('bcrypt').make('secret')

// uses "list.argon" mapping from the config file
await hash.use('argon').make('secret')
```

## Checking if a password needs to be rehashed

The latest configuration options are recommended to keep passwords secure, especially when a vulnerability is reported with an older version of the hashing algorithm.

After you update the config with the latest options, you can use the `hash.needsReHash` method to check if a password hash uses old options and perform a re-hash.

The check must be performed during user login because that is the only time you can access the plain text password.

```ts
import hash from '@adonisjs/core/services/hash'

if (await hash.needsReHash(user.password)) {
  user.password = await hash.make(plainTextPassword)
  await user.save()
}
```

You can assign a plain text value to `user.password` if you use model hooks to compute the hash.

```ts
if (await hash.needsReHash(user.password)) {
  // Let the model hook rehash the password
  user.password = plainTextPassword
  await user.save()
}
```

## Faking hash service during tests

Hashing a value is usually a slow process, and it will make your tests slow. Therefore, you might consider faking the hash service using the `hash.fake` method to disable password hashing.

We create 20 users using the `UserFactory` in the following example. Since you are using a model hook to hash passwords, it might take 5-7 seconds (depending on the configuration).

```ts
import hash from '@adonisjs/core/services/hash'

test('get users list', async ({ client }) => {
  await UserFactory().createMany(20)    
  const response = await client.get('users')
})
```

However, once you fake the hash service, the same test will run in order of magnitude faster.

```ts
import hash from '@adonisjs/core/services/hash'

test('get users list', async ({ client }) => {
  // highlight-start
  hash.fake()
  // highlight-end
  
  await UserFactory().createMany(20)    
  const response = await client.get('users')

  // highlight-start
  hash.restore()
  // highlight-end
})
```

## Creating a custom hash driver
A hash driver must implement the [HashDriverContract](https://github.com/adonisjs/hash/blob/main/src/types.ts#L13) interface. Also, the official Hash drivers use [PHC format](https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md) to serialize the hash output for storage. You can check the existing driver's implementation to see how they use the [PHC formatter](https://github.com/adonisjs/hash/blob/main/src/drivers/bcrypt.ts) to make and verify hashes.

```ts
import {
  HashDriverContract,
  ManagerDriverFactory
} from '@adonisjs/core/types/hash'

/**
 * Config accepted by the hash driver
 */
export type PbkdfConfig = {
}

/**
 * Driver implementation
 */
export class Pbkdf2Driver implements HashDriverContract {
  constructor(public config: PbkdfConfig) {
  }

  /**
   * Check if the hash value is formatted as per
   * the hashing algorithm.
   */
  isValidHash(value: string): boolean {
  }

  /**
   * Convert raw value to Hash
   */
  async make(value: string): Promise<string> {
  }

  /**
   * Verify if the plain value matches the provided
   * hash
   */
  async verify(
    hashedValue: string,
    plainValue: string
  ): Promise<boolean> {
  }

  /**
   * Check if the hash needs to be re-hashed because
   * the config parameters have changed
   */
  needsReHash(value: string): boolean {
  }
}

/**
 * Factory function to reference the driver
 * inside the config file.
 */
export function pbkdf2Driver (config: PbkdfConfig): ManagerDriverFactory {
  return () => {
    return new Pbkdf2Driver(config)
  }
}
```

In the above code example, we export the following values.

- `PbkdfConfig`: TypeScript type for the configuration you want to accept.

- `Pbkdf2Driver`: Driver's implementation. It must adhere to the `HashDriverContract` interface.

- `pbkdf2Driver`: Finally, a factory function to lazily create an instance of the driver.

### Using the driver

Once the implementation is completed, you can reference the driver inside the config file using the `pbkdf2Driver` factory function.

```ts
// title: config/hash.ts
import { defineConfig } from '@adonisjs/core/hash'
import { pbkdf2Driver } from 'my-custom-package'

export default defineConfig({
  list: {
    pbkdf2: pbkdf2Driver({
      // config goes here
    }),
  }
})
```
