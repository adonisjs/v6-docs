---
summary: VineJSを使用してAdonisJSでユーザー入力をバリデーションする方法を学びます。
---

# バリデーション

AdonisJSでのデータバリデーションは通常、コントローラーレベルで行われます。これにより、アプリケーションがリクエストを処理し、フォームフィールドの横に表示できるエラーをレスポンスで送信する前に、ユーザー入力をバリデーションできるようになります。

バリデーションが完了したら、信頼できるデータを使用してデータベースクエリ、スケジュールされたキュージョブ、メールの送信など、他の操作を実行できます。

## バリデーションライブラリの選択
AdonisJSのコアチームは、フレームワークに依存しないデータバリデーションライブラリである[VineJS](https://vinejs.dev/docs/introduction)を作成しました。VineJSを使用する理由のいくつかは以下の通りです。

- Node.jsエコシステムで**最速のバリデーションライブラリ**の1つです。

- 実行時のバリデーションとともに**静的な型安全性**を提供します。

- `web`および`api`のスターターキットには事前に構成されています。

- 公式のAdonisJSパッケージは、VineJSにカスタムルール（例：Lucidは`unique`と`exists`ルールを提供）を追加します。

ただし、AdonisJSは厳密にVineJSの使用を強制しません。自分やチームに最適なバリデーションライブラリを使用できます。単に`@vinejs/vine`パッケージをアンインストールし、使用したいパッケージをインストールしてください。

## VineJSの設定
次のコマンドを使用してVineJSをインストールおよび設定します。

参照も: [VineJSのドキュメント](https://vinejs.dev)

```sh
node ace add vinejs
```

:::disclosure{title="addコマンドによって実行されるステップを参照"}

1. 検出されたパッケージマネージャーを使用して`@vinejs/vine`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に以下のサービスプロバイダーを登録します。

    ```ts
    {
      providers: [
        // ...他のプロバイダー
        () => import('@adonisjs/core/providers/vinejs_provider')
      ]
    }
    ```

:::

## バリデータの使用
VineJSでは、バリデータのコンセプトを使用します。アプリケーションが実行できる各アクションごとにバリデータを作成します。たとえば、**新しい投稿の作成**のためのバリデータ、**投稿の更新**のための別のバリデータ、および**投稿の削除**のためのバリデータを定義します。

ブログを例にして、投稿の作成/更新のためのバリデータを定義します。まず、いくつかのルートと`PostsController`を登録しましょう。

```ts
// title: ルートの定義
import router from '@adonisjs/core/services/router'

const PostsController = () => import('#controllers/posts_controller')

router.post('posts', [PostsController, 'store'])
router.put('posts/:id', [PostsController, 'update'])
```

```sh
// title: コントローラーの作成
node ace make:controller post store update
```

```ts
// title: コントローラーのスキャフォールド
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async store({}: HttpContext) {}

  async update({}: HttpContext) {}
}
```

### バリデータの作成

`PostsController`を作成し、ルートを定義したら、次のaceコマンドを使用してバリデータを作成できます。

参照も: [バリデータの作成コマンド](../references/commands.md#makevalidator)

```sh
node ace make:validator post
```

バリデータは`app/validators`ディレクトリ内に作成されます。バリデータファイルはデフォルトでは空であり、複数のバリデータをエクスポートするために使用できます。各バリデータは、[`vine.compile`](https://vinejs.dev/docs/getting_started#pre-compiling-schema)メソッドの結果を保持する`const`変数です。

次の例では、`createPostValidator`と`updatePostValidator`を定義しています。両方のバリデータはスキーマにわずかな違いがあります。作成時には、ユーザーが投稿のためにカスタムスラッグを提供できるようにしますが、更新時には許可しません。

:::note

バリデータスキーマ内の重複についてはあまり心配しないでください。重複を避けるためにすべてのコストを払う代わりに、理解しやすいスキーマを選択することをオススメします。[WETコードベースの類推](https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase)は、重複を受け入れるのに役立つかもしれません。

:::

```ts
// title: app/validators/post_validator.ts
import vine from '@vinejs/vine'

/**
 * 投稿の作成アクションをバリデーションします
 */
export const createPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    slug: vine.string().trim(),
    description: vine.string().trim().escape()
  })
)

/**
 * 投稿の更新アクションをバリデーションします
 */
export const updatePostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    description: vine.string().trim().escape()
  })
)
```

### コントローラー内でバリデータを使用する
`PostsController`に戻り、バリデータを使用してリクエストボディをバリデーションします。`request.all()`メソッドを使用してリクエストボディにアクセスできます。

```ts
import { HttpContext } from '@adonisjs/core/http'
// insert-start
import {
  createPostValidator,
  updatePostValidator
} from '#validators/post_validator'
// insert-end

export default class PostsController {
  async store({ request }: HttpContext) {
    // insert-start
    const data = request.all()
    const payload = await createPostValidator.validate(data)
    return payload
    // insert-end
  }

  async update({ request }: HttpContext) {
    // insert-start
    const data = request.all()
    const payload = await updatePostValidator.validate(data)
    return payload
    // insert-end
  }
}
```

以上です！ユーザー入力のバリデーションは、コントローラー内の2行のコードです。バリデーションされた出力には、スキーマから推論された静的な型情報が含まれています。

また、`validate`メソッド呼び出しを`try/catch`でラップする必要はありません。エラーの場合、AdonisJSは自動的にエラーをHTTPレスポンスに変換します。

## エラーハンドリング
[HttpExceptionHandler](./exception_handling.md)は、バリデーションエラーを自動的にHTTPレスポンスに変換します。例外ハンドラはコンテンツネゴシエーションを使用し、[Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)ヘッダーの値に基づいてレスポンスを返します。

:::tip

[ExceptionHandlerのコードベース](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts#L343-L345)をのぞいて、バリデーション例外がHTTPレスポンスに変換される方法を確認してください。

また、セッションミドルウェアは、[renderValidationErrorAsHTMLメソッド](https://github.com/adonisjs/session/blob/main/src/session_middleware.ts#L30-L37)を上書きし、フラッシュメッセージを使用してフォームとバリデーションエラーを共有します。

:::

- `Accept=application/json`ヘッダーを持つHTTPリクエストは、[SimpleErrorReporter](https://github.com/vinejs/vine/blob/main/src/reporters/simple_error_reporter.ts)を使用して作成されたエラーメッセージの配列を受け取ります。

- `Accept=application/vnd.api+json`ヘッダーを持つHTTPリクエストは、[JSON API](https://jsonapi.org/format/#errors)仕様にしたがってフォーマットされたエラーメッセージの配列を受け取ります。

- セッションパッケージを使用したサーバーレンダリングされたフォームは、[セッションフラッシュメッセージ](./session.md#validation-errors-and-flash-messages)を介してエラーを受け取ります。

- その他のリクエストは、エラーをプレーンテキストで受け取ります。

## request.validateUsingメソッド
コントローラー内でバリデーションを実行する推奨される方法は、`request.validateUsing`メソッドを使用することです。`request.validateUsing`メソッドを使用する場合、バリデーションデータを明示的に定義する必要はありません。**リクエストボディ**、**クエリ文字列の値**、**ファイル**がマージされ、データがバリデータに渡されます。

```ts
import { HttpContext } from '@adonisjs/core/http'
import {
  createPostValidator,
  updatePostValidator
} from '#validators/posts_validator'

export default class PostsController {
  async store({ request }: HttpContext) {
    // delete-start
    const data = request.all()
    const payload = await createPostValidator.validate(data)
    // delete-end
    // insert-start
    const payload = await request.validateUsing(createPostValidator)
    // insert-end
  }

  async update({ request }: HttpContext) {
    // delete-start
    const data = request.all()
    const payload = await updatePostValidator.validate(data)
    // delete-end
    // insert-start
    const payload = await request.validateUsing(updatePostValidator)
    // insert-end
  }
}
```

### クッキー、ヘッダー、ルートパラメータのバリデーション
`request.validateUsing`メソッドを使用する場合、クッキー、ヘッダー、ルートパラメータを次のようにバリデーションできます。

```ts
const validator = vine.compile(
  vine.object({
    // リクエストボディのフィールド
    username: vine.string(),
    password: vine.string(),

    // クッキーのバリデーション
    cookies: vine.object({
    }),

    // ヘッダーのバリデーション
    headers: vine.object({
    }),

    // ルートパラメータのバリデーション
    params: vine.object({
    }),
  })
)

await request.validateUsing(validator)
```

## バリデータへのメタデータの渡し方
バリデータはリクエストライフサイクルの外部で定義されているため、バリデータはリクエストデータに直接アクセスできません。これは通常良いことですが、ランタイムデータにアクセスする必要がある場合は、`validate`メソッド呼び出し中にメタデータとして渡す必要があります。

ただし、バリデータがランタイムデータにアクセスする必要がある場合は、`validate`メソッド呼び出し中にメタデータとして渡す必要があります。

`unique`バリデーションルールの例を見てみましょう。データベース内でユーザーのメールアドレスが一意であることを確認したいが、現在ログインしているユーザーの行はスキップしたい場合です。

```ts
export const updateUserValidator = vine
  .compile(
    vine.object({
      email: vine.string().unique(async (db, value, field) => {
        const user = await db
          .from('users')
          // highlight-start
          .whereNot('id', field.meta.userId)
          // highlight-end
          .where('email', value)
          .first()
        return !user
      })
    })
  )
```

上記の例では、`meta.userId`プロパティを介して現在ログインしているユーザーにアクセスしています。HTTPリクエストで`userId`を渡す方法を見てみましょう。

```ts
async update({ request, auth }: HttpContext) {
  await request.validateUsing(
    updateUserValidator,
    {
      meta: {
        userId: auth.user!.id
      }
    }
  )
}
```

### メタデータの型安全性
前の例では、バリデーション時に`meta.userId`を渡すことを覚えておく必要があります。TypeScriptにそれを思い出させてもらえると素晴らしいです。

次の例では、`vine.withMetaData`関数を使用して、スキーマで使用するメタデータの静的な型を定義しています。

```ts
export const updateUserValidator = vine
  // insert-start
  .withMetaData<{ userId: number }>()
  // insert-end
  .compile(
    vine.object({
      email: vine.string().unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .whereNot('id', field.meta.userId)
          .where('email', value)
          .first()
        return !user
      })
    })
  )
```

注意してください、VineJSはランタイムでメタデータをバリデーションしません。ただし、それを行いたい場合は、`withMetaData`メソッドにコールバックを渡し、手動でバリデーションを行うことができます。

```ts
vine.withMetaData<{ userId: number }>((meta) => {
  // メタデータをバリデーションする
})
```

## VineJSの設定
`start`ディレクトリ内に[プリロードファイル](../concepts/adonisrc_file.md#preloads)を作成して、VineJSをカスタムエラーメッセージで設定するか、カスタムエラーレポーターを使用できます。

```sh
node ace make:preload validator
```

次の例では、[カスタムエラーメッセージ](https://vinejs.dev/docs/custom_error_messages)を定義しています。

```ts
// title: start/validator.ts
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  // すべてのフィールドに適用される
  'required': '{{ field }}フィールドは必須です',
  // すべてのフィールドに適用される
  'string': '{{ field }}フィールドの値は文字列である必要があります',
  // すべてのフィールドに適用される
  'email': '有効なメールアドレスではありません',

  // usernameフィールドのエラーメッセージ
  'username.required': 'アカウントのユーザー名を選択してください',
})
```

以下の例では、[カスタムエラーレポーター](https://vinejs.dev/docs/error_reporter)を登録しています。

```ts
// title: start/validator.ts
import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { JSONAPIErrorReporter } from '../app/validation_reporters.js'

vine.errorReporter = () => new JSONAPIErrorReporter()
```

## AdonisJSによって提供されるルール
以下は、AdonisJSによって提供されるVineJSルールのリストです。

- AdonisJSのコアパッケージによって追加された[`vine.file`](https://github.com/adonisjs/core/blob/main/providers/vinejs_provider.ts)スキーマタイプ。

## 次は何ですか？

- VineJSでの[カスタムメッセージ](https://vinejs.dev/docs/custom_error_messages)の使用方法について詳しく学びます。
- VineJSでの[エラーレポーター](https://vinejs.dev/docs/error_reporter)の使用方法について詳しく学びます。
- VineJSの[スキーマAPI](https://vinejs.dev/docs/schema_101)ドキュメントを読みます。
- [i18n翻訳](../digging_deeper/i18n.md#translating-validation-messages)を使用して、バリデーションエラーメッセージを定義します。
