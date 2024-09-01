---
summary: AdonisJSでセッションガードを使用してユーザーの認証を行う方法を学びます。
---

# セッションガード
セッションガードは、HTTPリクエスト中にユーザーのログインと認証を行うために[@adonisjs/session](../basics/session.md)パッケージを使用します。

セッションとクッキーは長い間インターネット上で使用されており、ほとんどのアプリケーションで非常に優れた機能を提供しています。したがって、サーバーレンダリングされるアプリケーションや同じトップレベルドメインのSPAウェブクライアントでは、セッションガードの使用を推奨します。

## ガードの設定
認証ガードは`config/auth.ts`ファイル内で定義されます。このファイル内の`guards`オブジェクトの下に複数のガードを設定できます。

```ts
// title: config/auth.ts
import { defineConfig } from '@adonisjs/auth'
// highlight-start
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
// highlight-end

const authConfig = defineConfig({
  default: 'web',
  guards: {
    // highlight-start
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    })
    // highlight-end
  },
})

export default authConfig
```

`sessionGuard`メソッドは[SessionGuard](https://github.com/adonisjs/auth/blob/main/modules/session_guard/guard.ts)クラスのインスタンスを作成します。これは、認証中にユーザーを検索するために使用できるユーザープロバイダと、リメンバートークンの動作を設定するためのオプションの設定オブジェクトを受け入れます。

`sessionUserProvider`メソッドは[SessionLucidUserProvider](https://github.com/adonisjs/auth/blob/main/modules/session_guard/user_providers/lucid.ts)クラスのインスタンスを作成します。これは、認証に使用するモデルへの参照を受け入れます。

## ログインの実行
`guard.login`メソッドを使用してユーザーをログインできます。このメソッドはUserモデルのインスタンスを受け入れ、ユーザーのログインセッションを作成します。

次の例：

- [AuthFinder mixin](./verifying_user_credentials.md#using-the-auth-finder-mixin)から`verifyCredentials`メソッドを使用して、メールアドレスとパスワードでユーザーを検索します。

- `auth.use('web')`は、`config/auth.ts`ファイルで設定された[SessionGuard](https://github.com/adonisjs/auth/blob/main/modules/session_guard/guard.ts)のインスタンスを返します。

- 次に、`guard.login(user)`メソッドを呼び出して、ユーザーのログインセッションを作成します。

- 最後に、ユーザーを`/dashboard`エンドポイントにリダイレクトします。リダイレクトエンドポイントをカスタマイズしてください。

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    // highlight-start
    /**
     * ステップ1：リクエストボディから資格情報を取得します。
     */
    const { email, password } = request.only(['email', 'password'])

    /**
     * ステップ2：資格情報を検証します。
     */
    const user = await User.verifyCredentials(email, password)

    /**
     * ステップ3：ユーザーをログインさせます。
     */
    await auth.use('web').login(user)

    /**
     * ステップ4：保護されたルートにリダイレクトします。
     */
    response.redirect('/dashboard')
    // highlight-end
  }
}
```

## ルートの保護

`auth`ミドルウェアを使用して、未認証のユーザーからルートを保護できます。このミドルウェアは、名前付きミドルウェアコレクションの`start/kernel.ts`ファイル内で登録されます。

```ts
import router from '@adonisjs/core/services/router'

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware')
})
```

未認証のユーザーから保護したいルートに`auth`ミドルウェアを適用します。

```ts
// highlight-start
import { middleware } from '#start/kernel'
// highlight-end
import router from '@adonisjs/core/services/router'

router
 .get('dashboard', () => {})
 // highlight-start
 .use(middleware.auth())
 // highlight-end
```

デフォルトでは、authミドルウェアは`default`ガード（設定ファイルで定義されている）を使用してユーザーを認証します。ただし、`auth`ミドルウェアを割り当てる際にガードの配列を指定することもできます。

次の例では、authミドルウェアは`web`ガードと`api`ガードを使用してリクエストを認証しようとします。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
 .get('dashboard', () => {})
 // highlight-start
 .use(
   middleware.auth({
     guards: ['web', 'api']
   })
 )
 // highlight-end
```

### 認証例外の処理

認証ミドルウェアは、ユーザーが認証されていない場合に[E_UNAUTHORIZED_ACCESS](https://github.com/adonisjs/auth/blob/main/src/auth/errors.ts#L18)をスローします。この例外は、次のコンテンツネゴシエーションルールを使用して自動的に処理されます。

- `Accept=application/json`ヘッダーを持つリクエストは、`message`プロパティを持つエラーの配列を受け取ります。

- `Accept=application/vnd.api+json`ヘッダーを持つリクエストは、[JSON API](https://jsonapi.org/format/#errors)仕様に従ったエラーの配列を受け取ります。

- サーバーレンダリングされるアプリケーションの場合、ユーザーは`/login`ページにリダイレクトされます。リダイレクトエンドポイントは、`auth`ミドルウェアクラス内で設定できます。

## ログイン済みのユーザーへのアクセス

`auth.user`プロパティを使用して、ログイン済みのユーザーインスタンスにアクセスできます。この値は、`auth`ミドルウェアを使用するか、`auth.authenticate`または`auth.check`メソッドを手動で呼び出した場合にのみ利用できます。

```ts
// title: authミドルウェアを使用する
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    await auth.user!.getAllMetrics()
    // highlight-end
  })
  .use(middleware.auth())
```

```ts
// title: 手動でauthenticateメソッドを呼び出す
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    /**
     * まず、ユーザーを認証します。
     */
    await auth.authenticate()

    /**
     * 次に、ユーザーオブジェクトにアクセスします。
     */ 
    await auth.user!.getAllMetrics()
    // highlight-end
  })
```

### リクエストが認証されているかどうかを確認する
`auth.isAuthenticated`フラグを使用して、リクエストが認証されているかどうかを確認できます。認証されたリクエストでは、`auth.user`の値は常に定義されています。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    if (auth.isAuthenticated) {
      await auth.user!.getAllMetrics()
    }
    // highlight-end
  })
  .use(middleware.auth())
```

### 認証されたユーザーを取得するか失敗する

`auth.user`プロパティに対して[non-null assertion operator](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-)を使用することが好きではない場合は、`auth.getUserOrFail`メソッドを使用できます。このメソッドは、ユーザーオブジェクトを返すか、[E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access)例外をスローします。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .get('dashboard', async ({ auth }) => {
    // highlight-start
    const user = auth.getUserOrFail()
    await user.getAllMetrics()
    // highlight-end
  })
  .use(middleware.auth())
```

### Edgeテンプレート内でユーザーにアクセスする
[InitializeAuthMiddleware](./introduction.md#the-initialize-auth-middleware)は、Edgeテンプレートと`ctx.auth`プロパティを共有します。したがって、現在ログインしているユーザーには`auth.user`プロパティを使用してアクセスできます。

```edge
@if(auth.isAuthenticated)
  <p>こんにちは{{ auth.user.email }}さん</p>
@end
```

保護されていないルートでログイン済みのユーザー情報を取得したい場合は、`auth.check`メソッドを使用してユーザーがログインしているかどうかを確認し、`auth.user`プロパティにアクセスできます。これは、公開ページのウェブサイトヘッダーにログイン済みのユーザー情報を表示する場合に非常に便利です。

```edge
{{--
  これは公開ページです。したがって、authミドルウェアによって保護されていません。
  ただし、ウェブサイトのヘッダーにログイン済みのユーザー情報を表示したい場合があります。

  そのために、`auth.check`メソッドを使用してユーザーがログインしているかどうかを
  静かにチェックし、ヘッダーにメールアドレスを表示します。

  アイデアがわかりますね！
--}}

@eval(await auth.check())

<header>
  @if(auth.isAuthenticated)
    <p>こんにちは{{ auth.user.email }}さん</p>
  @end
</header>
```

## ログアウトの実行
`guard.logout`メソッドを使用してユーザーをログアウトできます。ログアウト時には、ユーザーの状態がセッションストアから削除されます。現在アクティブなリメンバートークンも削除されます（リメンバートークンを使用している場合）。

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .post('logout', async ({ auth, response }) => {
    await auth.use('web').logout()
    return response.redirect('/login')
  })
  .use(middleware.auth())
```

## リメンバーミー機能の使用
リメンバーミー機能は、セッションの有効期限が切れた後に自動的にユーザーをログインさせる機能です。これは、暗号的に安全なトークンを生成し、ユーザーのブラウザにクッキーとして保存することで実現されます。

ユーザーのセッションが期限切れになった後、AdonisJSはリメンバーミークッキーを使用してトークンの有効性を検証し、自動的にユーザーのログインセッションを再作成します。

### リメンバーミートークンテーブルの作成

リメンバーミートークンはデータベースに保存されるため、`remember_me_tokens`テーブルを作成するために新しいマイグレーションを作成する必要があります。

```sh
node ace make:migration remember_me_tokens
```

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'remember_me_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments()
      table
        .integer('tokenable_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('hash').notNullable().unique()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.timestamp('expires_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### トークンプロバイダの設定
トークンの読み書きには、[DbRememberMeTokensProvider](https://github.com/adonisjs/auth/blob/main/modules/session_guard/token_providers/db.ts)をUserモデルに割り当てる必要があります。

```ts
import { BaseModel } from '@adonisjs/lucid/orm'
// highlight-start
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
// highlight-end

export default class User extends BaseModel {
  // ...モデルの残りのプロパティ

  // highlight-start
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
  // highlight-end
}
```

### 設定ファイルでリメンバーミートークンを有効にする
最後に、`config/auth.ts`ファイル内のセッションガード設定で`useRememberTokens`フラグを有効にします。

```ts
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      // highlight-start
      useRememberMeTokens: true,
      rememberMeTokensAge: '2 years',
      // highlight-end
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    })
  },
})

export default authConfig
```

### ログイン時にユーザーを記憶する

セットアップが完了したら、次のように`guard.login`メソッドを使用して、リメンバーミートークンとクッキーを生成できます。

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)

    await auth.use('web').login(
      user,
      // highlight-start
      /**
       * "remember_me"の入力が存在する場合にトークンを生成します
       */
      !!request.input('remember_me')
      // highlight-end
    )
    
    response.redirect('/dashboard')
  }
}
```

## guestミドルウェアの使用
authパッケージには、ログインしているユーザーが`/login`ページにアクセスできないようにリダイレクトするために使用できるguestミドルウェアが付属しています。これは、1つのデバイス上の1人のユーザーに対して複数のセッションを作成するのを避けるために行う必要があります。

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .get('/login', () => {})
  .use(middleware.guest())
```

デフォルトでは、guestミドルウェアは`default`ガード（設定ファイルで定義されている）を使用してユーザーのログイン状態をチェックします。ただし、`guest`ミドルウェアを割り当てる際にガードの配列を指定することもできます。

```ts
router
  .get('/login', () => {})
  .use(middleware.guest({
    guards: ['web', 'admin_web']
  }))
```

最後に、ログインしているユーザーのリダイレクトルートを`./app/middleware/guest_middleware.ts`ファイル内で設定できます。

## イベント
利用可能なイベントのリストを表示するには、[イベントリファレンスガイド](../references/events.md#session_authcredentials_verified)を参照してください。
