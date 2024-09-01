---
summary: アプリケーション内で暗号化サービスを使用して値を暗号化および復号化します。
---

# 暗号化

暗号化サービスを使用すると、アプリケーション内で値を暗号化および復号化できます。暗号化は[aes-256-cbcアルゴリズム](https://www.n-able.com/blog/aes-256-encryption-algorithm)に基づいており、最終出力に整合性ハッシュ（HMAC）を追加して値の改ざんを防止します。

`encryption`サービスは、`config/app.ts`ファイル内に格納されている`appKey`を秘密鍵として値を暗号化します。

- `appKey`を安全に保持し、[環境変数](../getting_started/environment_variables.md)を使用してアプリケーションに注入することをオススメします。このキーにアクセスできる人は値を復号化できます。

- キーは少なくとも16文字以上であり、暗号的に安全なランダムな値を持つ必要があります。`node ace generate:key`コマンドを使用してキーを生成できます。

- 後でキーを変更することを決定した場合、既存の値を復号化することはできません。これにより、既存のクッキーやユーザーセッションが無効になります。

## 値の暗号化

`encryption.encrypt`メソッドを使用して値を暗号化できます。メソッドは暗号化する値と、値の有効期限として考慮するオプションの時間間隔を受け入れます。

```ts
import encryption from '@adonisjs/core/services/encryption'

const encrypted = encryption.encrypt('hello world')
```

値が期限切れとなり、復号化できなくなるまでの時間間隔を定義します。

```ts
const encrypted = encryption.encrypt('hello world', '2 hours')
```

## 値の復号化

`encryption.decrypt`メソッドを使用して暗号化された値を復号化できます。メソッドは暗号化された値を最初の引数として受け入れます。

```ts
import encryption from '@adonisjs/core/services/encryption'

encryption.decrypt(encryptedValue)
```

## サポートされるデータ型

`encrypt`メソッドに与えられる値は、`JSON.stringify`を使用して文字列にシリアライズされます。したがって、次のJavaScriptのデータ型を使用できます。

- 文字列
- 数値
- bigInt
- ブール値
- null
- オブジェクト
- 配列

```ts
import encryption from '@adonisjs/core/services/encryption'

// オブジェクト
encryption.encrypt({
  id: 1,
  fullName: 'virk',
})

// 配列
encryption.encrypt([1, 2, 3, 4])

// ブール値
encryption.encrypt(true)

// 数値
encryption.encrypt(10)

// bigInt
encryption.encrypt(BigInt(10))

// データオブジェクトはISO文字列に変換されます
encryption.encrypt(new Date())
```

## カスタム秘密鍵の使用

カスタム秘密鍵を使用するためには、[Encryptionクラスのインスタンス](https://github.com/adonisjs/encryption/blob/main/src/encryption.ts)を直接作成できます。

```ts
import { Encryption } from '@adonisjs/core/encryption'

const encryption = new Encryption({
  secret: 'alongrandomsecretkey',
})
```
