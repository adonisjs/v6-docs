---
summary: AdonisJSハッシュサービスを使用して値をハッシュ化する方法を学びます。
---

# ハッシュ化

`hash`サービスを使用して、アプリケーション内でユーザーパスワードをハッシュ化できます。AdonisJSは、`bcrypt`、`scrypt`、`argon2`のハッシュアルゴリズムをサポートしており、[カスタムドライバーを追加することもできます](#カスタムハッシュドライバーの作成)。

ハッシュ化された値は、[PHC文字列形式](https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md)で保存されます。PHCは、ハッシュをフォーマットするための決定論的エンコーディング仕様です。


## 使用方法

`hash.make`メソッドは、プレーンな文字列値（ユーザーパスワードの入力）を受け取り、ハッシュ出力を返します。

```ts
import hash from '@adonisjs/core/services/hash'

const hash = await hash.make('user_password')
// $scrypt$n=16384,r=8,p=1$iILKD1gVSx6bqualYqyLBQ$DNzIISdmTQS6sFdQ1tJ3UCZ7Uun4uGHNjj0x8FHOqB0pf2LYsu9Xaj5MFhHg21qBz8l5q/oxpeV+ZkgTAj+OzQ
```

ハッシュ値を平文に変換することはできません。ハッシュ化は一方向のプロセスであり、ハッシュが生成された後に元の値を取得する方法はありません。

ただし、ハッシュを使用して、与えられた平文値が既存のハッシュと一致するかどうかを検証することはできます。`hash.verify`メソッドを使用してこのチェックを実行できます。

```ts
import hash from '@adonisjs/core/services/hash'

if (await hash.verify(existingHash, plainTextValue)) {
  // パスワードが正しいです
}
```

## 設定

ハッシュ化の設定は、`config/hash.ts`ファイルに保存されます。デフォルトのドライバーは`scrypt`に設定されています。なぜなら、scryptはNode.jsのネイティブなcryptoモジュールを使用しており、サードパーティのパッケージは必要ありません。

```ts
// title: config/hash.ts
import { defineConfig, drivers } from '@adonisjs/core/hash'

export default defineConfig({
  default: 'scrypt',

  list: {
    scrypt: drivers.scrypt(),

    /**
     * argon2を使用する場合はコメントを外してください
       argon: drivers.argon2(),
     */

    /**
     * bcryptを使用する場合はコメントを外してください
       bcrypt: drivers.bcrypt(),
     */
  }
})
```

### Argon

Argonは、ユーザーパスワードをハッシュ化するための推奨されるハッシュアルゴリズムです。AdonisJSハッシュサービスでargonを使用するには、[argon2](https://npmjs.com/argon2) npmパッケージをインストールする必要があります。

```sh
npm i argon2
```

以下は利用可能なオプションのリストです。

```ts
export default defineConfig({
  // highlight-start
  // デフォルトドライバーをargonに更新してください
  default: 'argon',
  // highlight-end

  list: {
    argon: drivers.argon2({
      version: 0x13, // 19の16進数コード
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

使用するargonハッシュのバリアントです。

- `d`はより高速で、GPU攻撃に対して非常に耐性があります。これは仮想通貨に役立ちます。
- `i`はより遅く、トレードオフ攻撃に対して耐性があります。これはパスワードのハッシュ化やキーの派生に適しています。
- `id` *(デフォルト)* は上記の両方のハイブリッド組み合わせで、GPU攻撃とトレードオフ攻撃に対して耐性があります。

</dd>

<dt>

version

</dt>

<dd>

使用するargonのバージョンです。利用可能なオプションは`0x10 (1.0)`と`0x13 (1.3)`です。デフォルトでは最新バージョンを使用する必要があります。

</dd>

<dt>

iterations

</dt>

<dd>

ハッシュの強度を上げるための`iterations`カウントです。ハッシュの計算には時間がかかります。

デフォルト値は`3`です。

</dd>

<dt>

memory

</dt>

<dd>

値のハッシュ化に使用するメモリの量です。各並列スレッドはこのサイズのメモリプールを持ちます。

デフォルト値は`65536 (KiB)`です。

</dd>

<dt>

parallelism

</dt>

<dd>

ハッシュの計算に使用するスレッド数です。

デフォルト値は`4`です。

</dd>

<dt>

saltSize

</dt>

<dd>

ソルトの長さ（バイト単位）です。argonは、ハッシュの計算時にこのサイズの暗号的に安全なランダムなソルトを生成します。

パスワードのハッシュ化にはデフォルトで`16`が推奨されます。

</dd>

<dt>

hashLength

</dt>

<dd>

生のハッシュの最大長（バイト単位）です。出力値は、PHC形式にさらにエンコードされるため、上記のハッシュ長よりも長くなります。

デフォルト値は`32`です。

</dd>

</dl>

### Bcrypt

AdonisJSハッシュサービスでBcryptを使用するには、[bcrypt](http://npmjs.com/bcrypt) npmパッケージをインストールする必要があります。

```sh
npm i bcrypt
```

以下は利用可能な設定オプションのリストです。

```ts
export default defineConfig({
  // highlight-start
  // デフォルトドライバーをbcryptに更新してください
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

ハッシュの計算コストです。`rounds`値がハッシュの計算にかかる時間にどのような影響を与えるかについては、Bcryptのドキュメントの[A Note on Rounds](https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds)セクションを参照してください。

デフォルト値は`10`です。

</dd>

<dt>

saltSize

</dt>

<dd>

ソルトの長さ（バイト単位）です。ハッシュの計算時に、このサイズの暗号的に安全なランダムなソルトを生成します。

デフォルト値は`16`です。

</dd>

<dt>

version

</dt>

<dd>

ハッシュアルゴリズムのバージョンです。サポートされている値は`2a`と`2b`です。最新バージョンである`2b`を使用することを推奨します。

</dd>

</dl>

### Scrypt

scryptドライバーは、パスワードハッシュの計算にNode.jsのcryptoモジュールを使用します。設定オプションは、[Node.jsの`scrypt`メソッド](https://nodejs.org/dist/latest-v19.x/docs/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback)で受け入れられるものと同じです。

```ts
export default defineConfig({
  // highlight-start
  // デフォルトドライバーをscryptに更新してください
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

## モデルフックを使用してパスワードをハッシュ化する

ユーザーパスワードをハッシュ化するために`hash`サービスを使用するのであれば、ロジックを`beforeSave`モデルフック内に配置役立つ場合があります。

:::note

`@adonisjs/auth`モジュールを使用している場合、モデル内でパスワードのハッシュ化を行う必要はありません。`AuthFinder`が自動的にパスワードのハッシュ化を処理し、ユーザーの資格情報を安全に処理します。このプロセスについては、[こちら](../authentication/verifying_user_credentials.md#ユーザーパスワードのハッシュ化)で詳しく説明しています。

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

## ドライバーの切り替え

アプリケーションが複数のハッシュドライバーを使用している場合は、`hash.use`メソッドを使用してドライバーを切り替えることができます。

`hash.use`メソッドは、設定ファイル内のマッピング名を受け取り、一致するドライバーのインスタンスを返します。

```ts
import hash from '@adonisjs/core/services/hash'

// 設定ファイルの"list.scrypt"マッピングを使用します
await hash.use('scrypt').make('secret')

// 設定ファイルの"list.bcrypt"マッピングを使用します
await hash.use('bcrypt').make('secret')

// 設定ファイルの"list.argon"マッピングを使用します
await hash.use('argon').make('secret')
```

## パスワードの再ハッシュが必要かどうかの確認

最新の設定オプションを使用してパスワードを安全に保つことが推奨されます。とくに、古いバージョンのハッシュアルゴリズムに関する脆弱性が報告された場合には、再ハッシュを行う必要があります。

最新のオプションで設定を更新した後、`hash.needsReHash`メソッドを使用してパスワードハッシュが古いオプションを使用しているかどうかを確認し、再ハッシュを行うことができます。

このチェックは、ユーザーログイン時に行う必要があります。なぜなら、平文パスワードにアクセスできるのはその時だけだからです。

```ts
import hash from '@adonisjs/core/services/hash'

if (await hash.needsReHash(user.password)) {
  user.password = await hash.make(plainTextPassword)
  await user.save()
}
```

モデルフックを使用してハッシュを計算する場合、`user.password`に平文値を割り当てることができます。

```ts
if (await hash.needsReHash(user.password)) {
  // モデルフックによってパスワードが再ハッシュされます
  user.password = plainTextPassword
  await user.save()
}
```

## テスト中にハッシュサービスを偽装する

値をハッシュ化することは通常遅いプロセスであり、テストを遅くする可能性があります。そのため、パスワードのハッシュ化を無効にするために`hash.fake`メソッドを使用してハッシュサービスを偽装することを検討するかもしれません。

以下の例では、`UserFactory`を使用して20人のユーザーを作成しています。パスワードのハッシュ化をモデルフックで行っているため、5〜7秒かかる場合があります（設定によって異なります）。

```ts
import hash from '@adonisjs/core/services/hash'

test('ユーザーリストを取得する', async ({ client }) => {
  await UserFactory().createMany(20)    
  const response = await client.get('users')
})
```

ただし、一度ハッシュサービスを偽装すると、同じテストが桁違いに高速に実行されます。

```ts
import hash from '@adonisjs/core/services/hash'

test('ユーザーリストを取得する', async ({ client }) => {
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

## カスタムハッシュドライバーの作成
ハッシュドライバーは、[HashDriverContract](https://github.com/adonisjs/hash/blob/main/src/types.ts#L13)インターフェイスを実装する必要があります。また、公式のハッシュドライバーはハッシュをストレージに保存するために[PHC形式](https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md)を使用しています。ハッシュの作成と検証方法を確認するために、既存のドライバーの実装を確認できます。

```ts
import {
  HashDriverContract,
  ManagerDriverFactory
} from '@adonisjs/core/types/hash'

/**
 * ハッシュドライバーが受け入れる設定
 */
export type PbkdfConfig = {
}

/**
 * ドライバーの実装
 */
export class Pbkdf2Driver implements HashDriverContract {
  constructor(public config: PbkdfConfig) {
  }

  /**
   * ハッシュ値がハッシュアルゴリズムに従ってフォーマットされているかどうかをチェックします。
   */
  isValidHash(value: string): boolean {
  }

  /**
   * 生の値をハッシュに変換します。
   */
  async make(value: string): Promise<string> {
  }

  /**
   * 平文の値が提供されたハッシュと一致するかどうかを検証します。
   */
  async verify(
    hashedValue: string,
    plainValue: string
  ): Promise<boolean> {
  }

  /**
   * ハッシュが再ハッシュされる必要があるかどうかを検証します。
   * 設定パラメータが変更された場合に再ハッシュが必要です。
   */
  needsReHash(value: string): boolean {
  }
}

/**
* 設定ファイル内でドライバーを参照するためのファクトリ関数です。
 * できます。
 */
export function pbkdf2Driver (config: PbkdfConfig): ManagerDriverFactory {
  return () => {
    return new Pbkdf2Driver(config)
  }
}
```

前述のコード例では、次の値をエクスポートしています。

- `PbkdfConfig`: 受け入れる設定のTypeScript型。

- `Pbkdf2Driver`: ドライバーの実装。`HashDriverContract`インターフェイスに準拠する必要があります。

- `pbkdf2Driver`: 最後に、ドライバーのインスタンスを遅延して作成するためのファクトリ関数。

### ドライバーの使用

実装が完了したら、`pbkdf2Driver`ファクトリ関数を使用して、設定ファイル内でドライバーを参照できます。

```ts
// title: config/hash.ts
import { defineConfig } from '@adonisjs/core/hash'
import { pbkdf2Driver } from 'my-custom-package'

export default defineConfig({
  list: {
    pbkdf2: pbkdf2Driver({
      // 設定はここに記述します
    }),
  }
})
```
