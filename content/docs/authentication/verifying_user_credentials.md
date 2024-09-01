---
$SELECTION_PLACEHOLDER$summary: AuthFinderミックスインを使用して、AdonisJSアプリケーションでユーザーの資格情報を検証できます。
---

# ユーザーの資格情報の検証

AdonisJSアプリケーションでは、ユーザーの資格情報の検証は認証レイヤーから切り離されています。これにより、認証ガードを使用しながらユーザーの資格情報を検証するオプションが制限されることなく続けることができます。

デフォルトでは、安全なAPIを提供してユーザーを検索し、パスワードを検証できます。ただし、電話番号にOTPを送信したり、2FAを使用したりするなど、ユーザーを検証するための追加の方法も実装できます。

このガイドでは、UIDでユーザーを検索し、ログイン前にパスワードを検証するプロセスについて説明します。

## 基本的な例
Userモデルを直接使用してユーザーを検索し、パスワードを検証できます。次の例では、メールアドレスでユーザーを検索し、[hash](../security/hashing.md)サービスを使用してパスワードハッシュを検証しています。

```ts
import { HttpContext } from '@adonisjs/core/http'
// highlight-start
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
// highlight-end

export default class SessionController {
  async store({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    // highlight-start
    /**
     * メールアドレスでユーザーを検索します。ユーザーが存在しない場合はエラーを返します。
     */ 
    const user = await User.findBy('email', email)
    if (!user) {
      response.abort('無効な資格情報')
    }
    // highlight-end

    // highlight-start
    /**
     * ハッシュサービスを使用してパスワードを検証します。
     */
    await hash.verify(user.password, password)
    // highlight-end

    /**
     * ユーザーをログインさせるか、トークンを作成します。
     */
  }
}
```

:::caption{for="error"}

**上記のアプローチの問題点**

:::

<div class="card">

上記の例で書かれたコードは、[タイミング攻撃](https://en.wikipedia.org/wiki/Timing_attack)のリスクがあります。認証の場合、攻撃者はアプリケーションの応答時間を観察して、提供された資格情報のメールアドレスまたはパスワードが正しくないかどうかを判断できます。

上記の実装により、次のような結果が得られます。

- ユーザーのメールアドレスが間違っている場合、リクエストは短時間で完了します。これは、ユーザーが見つからない場合にパスワードハッシュを検証しないためです。

- メールアドレスが存在し、パスワードが間違っている場合、リクエストは長時間かかります。これは、パスワードのハッシュ化アルゴリズムが時間がかかるためです。

応答時間の差は、攻撃者が有効なメールアドレスを見つけ、異なるパスワードの組み合わせを試すのに十分な情報となります。

</div>

## Auth finderミックスインの使用
タイミング攻撃を防ぐために、Userモデルに[AuthFinderミックスイン](https://github.com/adonisjs/auth/blob/main/src/mixins/lucid.ts)を使用することをオススメします。

Auth finderミックスインは、適用されたモデルに`findForAuth`メソッドと`verifyCredentials`メソッドを追加します。`verifyCredentials`メソッドは、ユーザーを見つけてパスワードを検証するためのタイミング攻撃に対して安全なAPIを提供します。

次のように、ミックスインをインポートしてモデルに適用できます。

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

- `withAuthFinder`メソッドは、最初の引数としてハッシャーを返すコールバックを受け入れます。上記の例では`scrypt`ハッシャーを使用していますが、別のハッシャーに置き換えることもできます。

- 次に、以下のプロパティを持つ構成オブジェクトを受け入れます。
  - `uids`: ユーザーを一意に識別するために使用できるモデルのプロパティの配列です。ユーザーにユーザー名や電話番号を割り当てた場合、それらもUIDとして使用できます。
  - `passwordColumnName`: ユーザーパスワードを保持するモデルのプロパティ名です。

- 最後に、`withAuthFinder`メソッドの戻り値をUserモデルの[mixin](../references/helpers.md#compose)として使用できます。

### 資格情報の検証
Auth finderミックスインを適用した後は、`SessionController.store`メソッドのコードを次のコードスニペットで置き換えることができます。

```ts
import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
// delete-start
import hash from '@adonisjs/core/services/hash'
// delete-end

export default class SessionController {
  // delete-start
  async store({ request, response }: HttpContext) {
  // delete-end
  // insert-start
  async store({ request }: HttpContext) {
  // insert-end
    const { email, password } = request.only(['email', 'password'])

    // delete-start
    /**
     * メールアドレスでユーザーを検索します。ユーザーが存在しない場合はエラーを返します。
     */ 
    const user = await User.findBy('email', email)
    if (!user) {
      response.abort('無効な資格情報')
    }

    /**
     * ハッシュサービスを使用してパスワードを検証します。
     */
    await hash.verify(user.password, password)
    // delete-end
    // insert-start
    const user = await User.verifyCredentials(email, password)
    // insert-end

    /**
     * ユーザーをログインさせるか、トークンを作成します。
     */
  }
}
```

### 例外の処理
資格情報が無効な場合、`verifyCredentials`メソッドは[E_INVALID_CREDENTIALS](../references/exceptions.md#e_invalid_credentials)例外をスローします。

この例外は自動的に処理され、以下のコンテンツネゴシエーションルールにしたがってレスポンスに変換されます。

- `Accept=application/json`ヘッダーを持つHTTPリクエストは、エラーメッセージの配列を受け取ります。各配列要素はメッセージプロパティを持つオブジェクトです。

- `Accept=application/vnd.api+json`ヘッダーを持つHTTPリクエストは、JSON API仕様にしたがってフォーマットされたエラーメッセージの配列を受け取ります。

- セッションを使用している場合、ユーザーはフォームにリダイレクトされ、[セッションフラッシュメッセージ](../basics/session.md#flash-messages)を介してエラーを受け取ります。

- その他のリクエストは、プレーンテキストとしてエラーを受け取ります。

ただし、必要に応じて、[グローバル例外ハンドラ](../basics/exception_handling.md)内で例外を処理することもできます。

```ts
// highlight-start
import { errors } from '@adonisjs/auth'
// highlight-end
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_INVALID_CREDENTIALS) {
      return ctx
        .response
        .status(error.status)
        .send(error.getResponseMessage(error, ctx))
    }
    // highlight-end

    return super.handle(error, ctx)
  }
}
```

## ユーザーパスワードのハッシュ化
`AuthFinder`ミックスインは、`INSERT`および`UPDATE`呼び出し時に自動的にユーザーパスワードをハッシュ化するための[beforeSave](https://github.com/adonisjs/auth/blob/main/src/mixins/lucid.ts#L40-L50)フックを登録します。そのため、モデル内でパスワードのハッシュ化を手動で行う必要はありません。
