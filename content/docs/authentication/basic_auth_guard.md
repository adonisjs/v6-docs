---
summary: HTTP認証フレームワークを使用してユーザーを認証するための基本認証ガードの使い方を学びます。
---

# 基本認証ガード

基本認証ガードは、[HTTP認証フレームワーク](https://developer.mozilla.org/ja/docs/Web/HTTP/Authentication)の実装です。クライアントはユーザーの資格情報をBase64エンコードされた文字列として`Authorization`ヘッダーを介して送信する必要があります。サーバーは資格情報が有効であればリクエストを許可します。それ以外の場合は、Webネイティブのプロンプトが表示され、資格情報の再入力を求めます。

## ガードの設定
認証ガードは`config/auth.ts`ファイル内で定義されます。このファイルの`guards`オブジェクトの下に複数のガードを設定できます。

```ts
import { defineConfig } from '@adonisjs/auth'
// highlight-start
import { basicAuthGuard, basicAuthUserProvider } from '@adonisjs/auth/build/src/Providers/BasicAuth'
// highlight-end

const authConfig = defineConfig({
  default: 'basicAuth',
  guards: {
    // highlight-start
    basicAuth: basicAuthGuard({
      provider: basicAuthUserProvider({
        model: () => import('#models/user'),
      }),
    })
    // highlight-end
  },
})

export default authConfig
```

`basicAuthGuard`メソッドは[BasicAuthGuard](https://github.com/adonisjs/auth/blob/main/modules/basic_auth_guard/guard.ts)クラスのインスタンスを作成します。これは認証中にユーザーを検索するために使用できるユーザープロバイダーを受け入れます。

`basicAuthUserProvider`メソッドは[BasicAuthLucidUserProvider](https://github.com/adonisjs/auth/blob/main/modules/basic_auth_guard/user_providers/lucid.ts)クラスのインスタンスを作成します。これはユーザーの資格情報を検証するために使用するモデルへの参照を受け入れます。


## ユーザーモデルの準備
`basicAuthUserProvider`で設定されたモデル（この例では`User`モデル）は、認証中にユーザーの資格情報を検証するために[AuthFinder](./verifying_user_credentials.md#using-the-auth-finder-mixin)ミックスインを使用する必要があります。

```ts
import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
// highlight-start
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
// highlight-end

// highlight-start
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})
// highlight-end

// highlight-start
export default class User extends compose(BaseModel, AuthFinder) {
  // highlight-end
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

## ルートの保護
ガードを設定したら、`auth`ミドルウェアを使用して未認証のリクエストからルートを保護できます。ミドルウェアは`start/kernel.ts`ファイルの名前付きミドルウェアコレクション内に登録されます。

```ts
import router from '@adonisjs/core/services/router'

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware')
})
```

```ts
// highlight-start
import { middleware } from '#start/kernel'
// highlight-end
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', ({ auth }) => {
    return auth.user
  })
  .use(middleware.auth({
    // highlight-start
    guards: ['basicAuth']
    // highlight-end
  }))
```

### 認証例外の処理

認証ミドルウェアは、ユーザーが認証されていない場合に[E_UNAUTHORIZED_ACCESS](https://github.com/adonisjs/auth/blob/main/src/auth/errors.ts#L18)をスローします。この例外は、レスポンスの[WWW-Authenticate](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/WWW-Authenticate)ヘッダーとともに自動的にHTTPレスポンスに変換されます。`WWW-Authenticate`は認証を要求し、資格情報の再入力をトリガーします。

## 認証されたユーザーへのアクセス
`auth.user`プロパティを使用してログイン済みのユーザーインスタンスにアクセスできます。`auth`ミドルウェアを使用しているため、`auth.user`プロパティは常に利用可能です。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', ({ auth }) => {
    return `あなたは${auth.user!.email}として認証されています`
  })
  .use(middleware.auth({
    guards: ['basicAuth']
  }))
```

### 認証されたユーザーの取得または失敗
`auth.user`プロパティに対して[非nullアサーション演算子](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-)を使用することが好きでない場合は、`auth.getUserOrFail`メソッドを使用できます。このメソッドはユーザーオブジェクトを返すか、[E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access)例外をスローします。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', ({ auth }) => {
    // highlight-start
    const user = auth.getUserOrFail()
    return `あなたは${user.email}として認証されています`
    // highlight-end
  })
  .use(middleware.auth({
    guards: ['basicAuth']
  }))
```
