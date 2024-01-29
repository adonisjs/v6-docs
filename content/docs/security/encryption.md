# Encryption

Using the encryption service, you may encrypt and decrypt values in your application. The encryption is based on the [aes-256-cbc algorithm](https://www.n-able.com/blog/aes-256-encryption-algorithm), and we append an integrity hash (HMAC) to the final output to prevent value tampering.

The `encryption` service uses the `appKey` stored inside the `config/app.ts` file as the secret to encrypt the values.

- It is recommended to keep the `appKey` secure and inject it into your application using [environment variables](../guides/env.md). Anyone with access to this key can decrypt values.

- The key should be at least 16 characters long and have a cryptographically secure random value. You may generate the key using the `node ace generate:key` command.

- If you decide to change the key later, you will not be able to decrypt existing values. This will result in invalidating existing cookies and user sessions. 

## Encrypting values

You may encrypt values using the `encryption.encrypt` method. The method accepts the value to encrypt and an optional time duration after which to consider the value expired.

```ts
import encryption from '@adonisjs/core/services/encryption'

const encrypted = encryption.encrypt('hello world')
```

Define a time duration after which the value will be considered expired and cannot be decrypted.

```ts
const encrypted = encryption.encrypt('hello world', '2 hours')
```

## Decrypting values

Encrypted values can be decrypted using the `encryption.decrypt` method. The method accepts the encrypted value as the first argument.

```ts
import encryption from '@adonisjs/core/services/encryption'

encryption.decrypt(encryptedValue)
```

## Supported data types

The value given to the `encrypt` method is serialized to a string using `JSON.stringify`. Therefore, you can use the following JavaScript data types.

- string
- number
- bigInt
- boolean
- null
- object
- array

```ts
import encryption from '@adonisjs/core/services/encryption'

// Object
encryption.encrypt({
  id: 1,
  fullName: 'virk',
})

// Array
encryption.encrypt([1, 2, 3, 4])

// Boolean
encryption.encrypt(true)

// Number
encryption.encrypt(10)

// BigInt
encryption.encrypt(BigInt(10))

// Data objects are converted to ISO string
encryption.encrypt(new Date())
```

## Using custom secret keys

You can create an [instance of the Encryption class](https://github.com/adonisjs/encryption/blob/main/src/encryption.ts) directly to use custom secret keys.

```ts
import { Encryption } from '@adonisjs/core/encryption'

const encryption = new Encryption({
  secret: 'alongrandomsecretkey',
})
```
