---
summary: アクセストークンガードを使用して、アクセストークンを使用してHTTPリクエストを認証する方法を学びます。
---

# アクセストークンガード
アクセストークンガードは、エンドユーザデバイスにクッキーを永続化できないAPIコンテキストで、HTTPリクエストを認証します。例えば、APIへのサードパーティのアクセスやモバイルアプリの認証などです。

アクセストークンは任意の形式で生成できます。たとえば、JWT標準に準拠したトークンはJWTアクセストークンと呼ばれ、プロプライエタリな形式のトークンは不透明なアクセストークンと呼ばれます。

AdonisJSでは、次のように構造化され、保存される不透明なアクセストークンを使用しています。

- トークンは、CRC32チェックサムで終わる暗号的に安全なランダムな値で表されます。
- トークン値のハッシュはデータベースに永続化されます。このハッシュは認証時にトークンを検証するために使用されます。
- 最終的なトークン値はbase64エンコードされ、`oat_`で接頭辞が付けられます。接頭辞はカスタマイズ可能です。
- 接頭辞とCRC32チェックサムの接尾辞は、[シークレットスキャンツール](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)がトークンを識別し、コードベース内での漏洩を防止するのに役立ちます。

## ユーザーモデルの設定
アクセストークンガードを使用する前に、ユーザーモデルにトークンプロバイダを設定する必要があります。**トークンプロバイダは、アクセストークンの作成、リスト、および検証に使用されます**。

authパッケージには、トークンをSQLデータベースに永続化するデータベーストークンプロバイダが付属しています。次のように設定できます。

```ts
import { BaseModel } from '@adonisjs/lucid/orm'
// highlight-start
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
// highlight-end

export default class User extends BaseModel {
  // ...モデルの残りのプロパティ

  // highlight-start
  static accessTokens = DbAccessTokensProvider.forModel(User)
  // highlight-end
}
```

`DbAccessTokensProvider.forModel`は、最初の引数としてUserモデル、2番目の引数としてオプションオブジェクトを受け入れます。

```ts
export default class User extends BaseModel {
  // ...モデルの残りのプロパティ

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })
}
```

<dl>

<dt>

expiresIn

</dt>

<dd>

トークンの有効期限。秒単位の数値または[時間表現](https://github.com/poppinss/utils?tab=readme-ov-file#secondsparseformat)の文字列を渡すことができます。

デフォルトでは、トークンは長寿命で期限切れになりません。また、トークンの有効期限は生成時に指定することもできます。

</dd>

<dt>

prefix

</dt>

<dd>

公開共有トークン値の接頭辞。接頭辞を定義することで、[シークレットスキャンツール](https://github.blog/2021-04-05-behind-githubs-new-authentication-token-formats/#identifiable-prefixes)がトークンを識別し、コードベース内での漏洩を防止できます。

トークンを発行したあとで接頭辞を変更すると、トークンは無効になります。したがって、接頭辞を慎重に選択し、頻繁に変更しないでください。

デフォルトは`oat_`です。

</dd>

<dt>

table

</dt>

<dd>

アクセストークンを保存するためのデータベーステーブル名。デフォルトは`auth_access_tokens`です。

</dd>

<dt>

type

</dt>

<dd>

トークンのバケットを識別するための一意のタイプ。単一のアプリケーション内で複数のタイプのトークンを発行する場合、それぞれに一意のタイプを定義する必要があります。

デフォルトは`auth_token`です。

</dd>

<dt>

tokenSecretLength

</dt>

<dd>

ランダムなトークン値の長さ（文字数）。デフォルトは`40`です。

</dd>

</dl>

---

トークンプロバイダを設定したら、ユーザーの代わりに[トークンを発行](#トークンの発行)できます。トークンを発行するためには、トークンの発行には認証ガードの設定は必要ありません。ガードはトークンを検証するために必要です。

## アクセストークンデータベーステーブルの作成
初期設定時に`auth_access_tokens`テーブルのマイグレーションファイルを作成します。マイグレーションファイルは`database/migrations`ディレクトリに保存されます。

`migration:run`コマンドを実行してデータベーステーブルを作成できます。

```sh
node ace migration:run
```

ただし、何らかの理由でauthパッケージを手動で設定している場合は、マイグレーションファイルを手動で作成し、次のコードスニペットをコピーして貼り付けることもできます。

```sh
node ace make:migration auth_access_tokens
```

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('tokenable_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

## トークンの発行
アプリケーションに応じて、ログイン時またはログイン後にトークンを発行する場合があります。いずれの場合でも、トークンを発行するためにはユーザーオブジェクト（トークンが生成されるユーザー）が必要であり、`User`モデルを直接使用して生成できます。

次の例では、**idでユーザーを検索**し、`User.accessTokens.create`メソッドを使用してアクセストークンを発行しています。もちろん、実際のアプリケーションでは、このエンドポイントは認証によって保護されているでしょうが、今はシンプルにしておきましょう。

`.create`メソッドはUserモデルのインスタンスを受け入れ、[AccessToken](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/access_token.ts)クラスのインスタンスを返します。

`token.value`プロパティには、ユーザーと共有する必要のある値（[Secret](../references/helpers.md#secret)としてラップされた値）が含まれています。この値はトークンを生成する際にのみ利用可能であり、ユーザーはそれを再度見ることはできません。

```ts
import router from '@adonisjs/core/services/router'
import User from '#models/user'

router.post('users/:id/tokens', ({ params }) => {
  const user = await User.findOrFail(params.id)
  const token = await User.accessTokens.create(user)

  return {
    type: 'bearer',
    value: token.value!.release(),
  }
})
```

また、レスポンスで`token`を直接返すこともできます。これにより、次のJSONオブジェクトにシリアル化されます。

```ts
router.post('users/:id/tokens', ({ params }) => {
  const user = await User.findOrFail(params.id)
  const token = await User.accessTokens.create(user)

  // delete-start
  return {
    type: 'bearer',
    value: token.value!.release(),
  }
  // delete-end
  // insert-start
  return token
  // insert-end
})

/**
 * response: {
 *   type: 'bearer',
 *   value: 'oat_MTA.aWFQUmo2WkQzd3M5cW0zeG5JeHdiaV9rOFQzUWM1aTZSR2xJaDZXYzM5MDE4MzA3NTU',
 *   expiresAt: null,
 * }
 */
```

### アビリティの定義
構築中のアプリケーションに応じて、アクセストークンを特定のタスクのみに制限したい場合があります。たとえば、プロジェクトの作成や削除なしで読み取りやリストのみを許可するトークンを発行する場合です。

次の例では、2番目のパラメータとしてアビリティの配列を定義しています。アビリティはJSON文字列にシリアル化され、データベース内に保存されます。

authパッケージでは、アビリティには実際の意味はありません。アクションを実行する前に、アプリケーションがトークンのアビリティをチェックする必要があります。

```ts
await User.accessTokens.create(user, ['server:create', 'server:read'])
```

### トークンアビリティとBouncerアビリティの比較

トークンアビリティと[bouncerの認可チェック](../security/authorization.md#defining-abilities)を混同しないでください。実際の例を使用して、その違いを理解しましょう。

- 管理者ユーザーが新しいプロジェクトを作成できるようにする**bouncerアビリティを定義**します。

- 同じ管理者ユーザーが自分自身のためにトークンを作成しますが、トークンの乱用を防ぐために、トークンのアビリティを**プロジェクトの読み取り**に制限します。

- さて、アプリケーション内でアクセス制御を実装する必要があります。これにより、管理者ユーザーは新しいプロジェクトを作成できる一方、トークンは新しいプロジェクトの作成を許可されません。

このようなユースケースのために、次のようなbouncerアビリティを作成できます。

:::note

`user.currentAccessToken`は、現在のHTTPリクエストの認証に使用されるアクセストークンを参照します。詳細については、[リクエストの認証](#リクエストの認証)セクションを参照してください。

:::

```ts
import { AccessToken } from '@adonisjs/auth/access_tokens'
import { Bouncer } from '@adonisjs/bouncer'

export const createProject = Bouncer.ability(
  (user: User & { currentAccessToken?: AccessToken }) => {
    /**
     * "currentAccessToken"トークンプロパティが存在しない場合、
     * ユーザーはアクセストークンなしで認証されたことを意味します
     */
    if (!user.currentAccessToken) {
      return user.isAdmin
    }

    /**
     * それ以外の場合、ユーザーがisAdminであり、
     * 認証に使用されたトークンが"project:create"アビリティを許可しているかどうかを確認します。
     */
    return user.isAdmin && user.currentAccessToken.allows('project:create')
  }
)
```

### トークンの有効期限
デフォルトでは、トークンは長寿命で期限切れになりません。ただし、トークンプロバイダの設定時またはトークンの生成時に有効期限を定義できます。

有効期限は、秒単位の数値または文字列形式の時間表現として定義できます。

```ts
await User.accessTokens.create(
  user, // ユーザー
  ['*'], // すべてのアビリティを持つ
  {
    expiresIn: '30 days' // 30日後に期限切れになる
  }
)
```

### トークンの名前付け
デフォルトでは、トークンには名前がありません。ただし、トークンを生成する際に名前を割り当てることもできます。たとえば、アプリケーションのユーザーがトークンを自己生成できる場合、認識しやすい名前も指定するように求めることができます。

```ts
await User.accessTokens.create(
  user,
  ['*'],
  {
    name: request.input('token_name'),
    expiresIn: '30 days'
  }
)
```

## ガードの設定
トークンを検証し、リクエストを認証するための認証ガードを設定しましょう。ガードは`config/auth.ts`ファイルの`guards`オブジェクトの下に設定する必要があります。

```ts
// title: config/auth.ts
import { defineConfig } from '@adonisjs/auth'
// highlight-start
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
// highlight-end

const authConfig = defineConfig({
  default: 'api',
  guards: {
    // highlight-start
    api: tokensGuard({
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user'),
      })
    }),
    // highlight-end
  },
})

export default authConfig
```

`tokensGuard`メソッドは、[AccessTokensGuard](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/guard.ts)クラスのインスタンスを作成します。トークンの検証とユーザーの検索に使用するユーザープロバイダを受け入れます。

`tokensUserProvider`メソッドは、次のオプションを受け入れ、[AccessTokensLucidUserProvider](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/user_providers/lucid.ts)クラスのインスタンスを返します。

- `model`: ユーザーの検索に使用するLucidモデル。
- `tokens`: モデルでトークンプロバイダを参照するための静的プロパティ名。

## リクエストの認証
ガードが設定されたら、`auth`ミドルウェアを使用するか、`auth.authenticate`メソッドを手動で呼び出すことで、リクエストの認証を開始できます。

`auth.authenticate`メソッドは、認証されたユーザーのUserモデルのインスタンスを返します。認証できない場合は[E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access)例外がスローされます。

```ts
import router from '@adonisjs/core/services/router'

router.post('projects', async ({ auth }) => {
  // デフォルトのガードを使用して認証する
  const user = await auth.authenticate()

  // 名前付きガードを使用して認証する
  const user = await auth.authenticateUsing(['api'])
})
```

### authミドルウェアの使用

`authenticate`メソッドを手動で呼び出す代わりに、`auth`ミドルウェアを使用してリクエストを認証するか、例外をスローできます。

authミドルウェアは、リクエストの認証に使用するガードの配列を受け入れます。指定したガードのいずれかがリクエストを認証すると、認証プロセスは停止します。

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .post('projects', async ({ auth }) => {
    console.log(auth.user) // User
    console.log(auth.authenticatedViaGuard) // 'api'
    console.log(auth.user!.currentAccessToken) // AccessToken
  })
  .use(middleware.auth({
    guards: ['api']
  }))
```

### リクエストが認証されているかどうかの確認
`auth.isAuthenticated`フラグを使用して、リクエストが認証されているかどうかを確認できます。`auth.user`の値は、認証されたリクエストでは常に定義されています。

```ts
import { HttpContext } from '@adonisjs/core/http'

class PostsController {
  async store({ auth }: HttpContext) {
    if (auth.isAuthenticated) {
      await auth.user!.related('posts').create(postData)
    }
  }
}
```

### 認証されたユーザーの取得または失敗

`auth.user`プロパティに対して[non-null assertion operator](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-)を使用するのが好きではない場合は、`auth.getUserOrFail`メソッドを使用できます。このメソッドは、ユーザーオブジェクトを返すか、[E_UNAUTHORIZED_ACCESS](../references/exceptions.md#e_unauthorized_access)例外をスローします。

```ts
import { HttpContext } from '@adonisjs/core/http'

class PostsController {
  async store({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.related('posts').create(postData)
  }
}
```

## 現在のアクセストークン
アクセストークンガードは、リクエストの認証に成功した後、ユーザーオブジェクトに`currentAccessToken`プロパティを定義します。`currentAccessToken`プロパティは[AccessToken](https://github.com/adonisjs/auth/blob/main/modules/access_tokens_guard/access_token.ts)クラスのインスタンスです。

`currentAccessToken`オブジェクトを使用して、トークンのアビリティを取得したり、トークンの有効期限をチェックしたりできます。また、認証中にガードは`last_used_at`カラムを現在のタイムスタンプに更新します。

コードベースの他の部分で`currentAccessToken`を型として参照する場合は、モデル自体でこのプロパティを宣言できます。

:::caption{for="error"}

**`currentAccessToken`をマージする代わりに**

:::

```ts
import { AccessToken } from '@adonisjs/auth/access_tokens'

Bouncer.ability((
  user: User & { currentAccessToken?: AccessToken }
) => {
})
```

:::caption{for="success"}

**モデルでプロパティとして宣言する**

:::

```ts
import { AccessToken } from '@adonisjs/auth/access_tokens'

export default class User extends BaseModel {
  currentAccessToken?: AccessToken
}
```

```ts
Bouncer.ability((user: User) => {
})
```

## すべてのトークンのリスト表示
`accessTokens.all`メソッドを使用して、トークンのリストを取得できます。戻り値は`AccessToken`クラスのインスタンスの配列です。

```ts
router
  .get('/tokens', async ({ auth }) => {
    return User.accessTokens.all(auth.user!)
  })
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
```

`all`メソッドは期限切れのトークンも返します。リストをレンダリングする前にそれらをフィルタリングしたり、トークンの横に**「トークンの有効期限が切れました」**というメッセージを表示したりできます。

例:
```edge
@each(token in tokens)
  <h2> {{ token.name }} </h2>
  @if(token.isExpired())
    <p> 有効期限切れ </p>
  @end

  <p> アビリティ: {{ token.abilities.join(',') }} </p>
@end
```

## トークンの削除
`accessTokens.delete`メソッドを使用して、トークンを削除できます。メソッドは最初のパラメータとしてユーザー、2番目のパラメータとしてトークンのIDを受け入れます。

```ts
await User.accessTokens.delete(user, token.identifier)
```

## イベント
アクセストークンガードで発行される利用可能なイベントのリストを表示するには、[イベントリファレンスガイド](../references/events.md#access_tokens_authauthentication_attempted)を参照してください。
