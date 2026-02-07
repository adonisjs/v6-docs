---
summary: 使用加密服务在你的应用中加密和解密值。
---

# 加密 (Encryption)

使用加密服务，你可以在应用中加密和解密值。加密基于 [aes-256-cbc 算法](https://www.n-able.com/blog/aes-256-encryption-algorithm)，我们将完整性哈希 (HMAC) 附加到最终输出以防止值篡改。

`encryption` 服务使用存储在 `config/app.ts` 文件中的 `appKey` 作为加密值的密钥。

- 建议保持 `appKey` 安全，并使用 [环境变量](../getting_started/environment_variables.md) 将其注入到你的应用中。任何有权访问此密钥的人都可以解密值。

- 密钥长度至少为 16 个字符，并且具有加密安全的随机值。你可以使用 `node ace generate:key` 命令生成密钥。

- 如果你决定稍后更改密钥，你将无法解密现有值。这将导致现有的 cookie 和用户会话失效。

## 加密值

你可以使用 `encryption.encrypt` 方法加密值。该方法接受要加密的值和一个可选的持续时间，在此之后该值将被视为过期。

```ts
import encryption from '@adonisjs/core/services/encryption'

const encrypted = encryption.encrypt('hello world')
```

定义一个时间持续时间，在此之后该值将被视为过期且无法解密。

```ts
const encrypted = encryption.encrypt('hello world', '2 hours')
```

## 解密值

可以使用 `encryption.decrypt` 方法解密加密值。该方法接受加密值作为第一个参数。

```ts
import encryption from '@adonisjs/core/services/encryption'

encryption.decrypt(encryptedValue)
```

## 支持的数据类型

传递给 `encrypt` 方法的值使用 `JSON.stringify` 序列化为字符串。因此，你可以使用以下 JavaScript 数据类型。

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

## 使用自定义密钥

你可以直接创建 [Encryption 类的一个实例](https://github.com/adonisjs/encryption/blob/main/src/encryption.ts) 来使用自定义密钥。

```ts
import { Encryption } from '@adonisjs/core/encryption'

const encryption = new Encryption({
  secret: 'alongrandomsecretkey',
})
```
