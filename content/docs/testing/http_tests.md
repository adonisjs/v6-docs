---
summary: Japa APIクライアントプラグインを使用してAdonisJSでのHTTPテストを行います。
---

# HTTPテスト

HTTPテストは、実際のHTTPリクエストを使用してアプリケーションのエンドポイントをテストし、レスポンスのボディ、ヘッダー、クッキー、セッションなどをアサートすることを指します。

HTTPテストは、Japaの[APIクライアントプラグイン](https://japa.dev/docs/plugins/api-client)を使用して実行されます。APIクライアントプラグインは、`Axios`や`fetch`に似た状態を持たないリクエストライブラリであり、テストに適しています。

実際のブラウザ内でWebアプリをテストし、プログラムで対話する場合は、Playwrightを使用した[ブラウザクライアント](./browser_tests.md)を使用することをおすすめします。

## セットアップ
最初のステップは、npmパッケージレジストリから次のパッケージをインストールすることです。

:::codegroup

```sh
// title: npm
npm i -D @japa/api-client
```

:::

### プラグインの登録

次に、`tests/bootstrap.ts`ファイル内でプラグインを登録します。

```ts
// title: tests/bootstrap.ts
import { apiClient } from '@japa/api-client'

export const plugins: Config['plugins'] = [
  assert(),
  // highlight-start
  apiClient(),
  // highlight-end
  pluginAdonisJS(app),
]
```

`apiClient`メソッドは、オプションでサーバーの`baseURL`を受け入れます。指定しない場合、`HOST`と`PORT`の環境変数が使用されます。

```ts
import env from '#start/env'

export const plugins: Config['plugins'] = [
  apiClient({
    baseURL: `http://${env.get('HOST')}:${env.get('PORT')}`
  })
]
```

## 基本的な例

`apiClient`プラグインが登録されると、[TestContext](https://japa.dev/docs/test-context)から`client`オブジェクトにアクセスしてHTTPリクエストを行うことができます。

HTTPテストは、`functional`テストスイートに設定されたフォルダ内に記述する必要があります。次のコマンドを使用して新しいテストファイルを作成できます。

```sh
node ace make:test users/list --suite=functional
```

```ts
import { test } from '@japa/runner'

test.group('ユーザーリスト', () => {
  test('ユーザーのリストを取得する', async ({ client }) => {
    const response = await client.get('/users')

    response.assertStatus(200)
    response.assertBody({
      data: [
        {
          id: 1,
          email: 'foo@bar.com',
        }
      ]
    })
  })
})
```

利用可能なリクエストとアサーションのメソッドの詳細については、[Japaのドキュメント](https://japa.dev/docs/plugins/api-client)を参照してください。

## Open APIテスト
アサーションとAPIクライアントプラグインを使用すると、Open APIスキーマファイルを使用してアサーションを記述できます。固定のペイロードに対してレスポンスを手動でテストする代わりに、スペックファイルを使用してHTTPレスポンスの形状をテストできます。

これは、Open APIスペックとサーバーのレスポンスを同期させるための素晴らしい方法です。なぜなら、スペックファイルから特定のエンドポイントを削除したり、レスポンスデータの形状を変更したりすると、テストが失敗するからです。

### スキーマの登録
AdonisJSには、コードからOpen APIスキーマファイルを生成するためのツールは提供されていません。スキーマを手動で作成するか、グラフィカルツールを使用して作成することができます。

スペックファイルがある場合は、`resources`ディレクトリ（存在しない場合は作成）に保存し、`tests/bootstrap.ts`ファイル内の`assert`プラグインで登録します。

```ts
// title: tests/bootstrap.ts
import app from '@adonisjs/core/services/app'

export const plugins: Config['plugins'] = [
  // highlight-start
  assert({
    openApi: {
      schemas: [app.makePath('resources/open_api_schema.yaml')]
    }
  }),
  // highlight-end
  apiClient(),
  pluginAdonisJS(app)
]
```

### アサーションの記述
スキーマが登録されたら、`response.assertAgainstApiSpec`メソッドを使用してAPIスペックに対してアサートできます。

```ts
test('ページネーションされた投稿', async ({ client }) => {
  const response = await client.get('/posts')
  response.assertAgainstApiSpec()
})
```

- `response.assertAgainstApiSpec`メソッドは、**リクエストメソッド**、**エンドポイント**、**レスポンスステータスコード**を使用して、期待されるレスポンススキーマを検索します。
- レスポンススキーマが見つからない場合は例外が発生します。それ以外の場合は、レスポンスボディがスキーマに対して検証されます。

レスポンスの形状のみがテストされ、実際の値はテストされません。そのため、追加のアサーションを記述する必要がある場合があります。例えば:

```ts
// レスポンスがスキーマに従っていることをアサートする
response.assertAgainstApiSpec()

// 期待される値に対してアサートする
response.assertBodyContains({
  data: [{ title: 'Adonis 101' }, { title: 'Lucid 101' }]
})
```


## クッキーの読み取り/書き込み
`withCookie`メソッドを使用して、HTTPリクエスト中にクッキーを送信することができます。メソッドは、最初の引数としてクッキーの名前、2番目の引数として値を受け入れます。

```ts
await client
  .get('/users')
  .withCookie('user_preferences', { limit: 10 })
```

`withCookie`メソッドは、[署名付きクッキー](../basics/cookies.md#署名付きクッキー)を定義します。さらに、`withEncryptedCookie`メソッドまたは`withPlainCookie`メソッドを使用して、他のタイプのクッキーをサーバーに送信することもできます。

```ts
await client
  .get('/users')
  .witEncryptedCookie('user_preferences', { limit: 10 })
```

```ts
await client
  .get('/users')
  .withPlainCookie('user_preferences', { limit: 10 })
```

### レスポンスからクッキーを読み取る
AdonisJSサーバーが設定したクッキーには、`response.cookies`メソッドを使用してアクセスできます。メソッドは、クッキーをキーと値のペアとして返します。

```ts
const response = await client.get('/users')
console.log(response.cookies())
```

`response.cookie`メソッドを使用して、クッキーの名前で単一のクッキー値にアクセスすることもできます。または、`assertCookie`メソッドを使用してクッキーの値をアサートすることもできます。

```ts
const response = await client.get('/users')

console.log(response.cookie('user_preferences'))

response.assertCookie('user_preferences')
```

## セッションストアのポピュレート
アプリケーションでセッションデータを読み取り/書き込みするために[`@adonisjs/session`](../basics/session.md)パッケージを使用している場合、テストを作成する際にセッションストアをポピュレートするために`sessionApiClient`プラグインを使用することもできます。

### セットアップ
最初のステップは、`tests/bootstrap.ts`ファイル内でプラグインを登録することです。

```ts
// title: tests/bootstrap.ts
// insert-start
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
// insert-end

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  // insert-start
  sessionApiClient(app)
  // insert-end
]
```

次に、`.env.test`ファイルを更新し（存在しない場合は作成）、`SESSON_DRIVER`を`memory`に設定します。

```dotenv
// title: .env.test
SESSION_DRIVER=memory
```

### セッションデータを使用したリクエストの作成
Japa APIクライアントの`withSession`メソッドを使用して、あらかじめ定義されたセッションデータを使用してHTTPリクエストを行うことができます。

`withSession`メソッドは、新しいセッションIDを作成し、データをメモリストアにポピュレートし、AdonisJSアプリケーションコードは通常どおりセッションデータを読み取ることができます。

リクエストが完了すると、セッションIDとそのデータは破棄されます。

```ts
test('カートアイテムを持つチェックアウト', async ({ client }) => {
  await client
    .post('/checkout')
    // highlight-start
    .withSession({
      cartItems: [
        {
          id: 1,
          name: 'South Indian Filter Press Coffee'
        },
        {
          id: 2,
          name: 'Cold Brew Bags',
        }
      ]
    })
    // highlight-end
})
```

`withSession`メソッドと同様に、`withFlashMessages`メソッドを使用してHTTPリクエスト時にフラッシュメッセージを設定することもできます。

```ts
const response = await client
  .get('posts/1')
  .withFlashMessages({
    success: '投稿が正常に作成されました'
  })

response.assertTextIncludes(`投稿が正常に作成されました`)
```

### レスポンスからセッションデータを読み取る
AdonisJSサーバーが設定したセッションデータには、`response.session()`メソッドを使用してアクセスできます。メソッドは、セッションデータをキーと値のペアのオブジェクトとして返します。

```ts
const response = await client
  .post('/posts')
  .json({
    title: 'some title',
    body: 'some description',
  })

console.log(response.session()) // すべてのセッションデータ
console.log(response.session('post_id')) // post_idの値
```

`response.flashMessage`メソッドまたは`response.flashMessages`メソッドを使用して、レスポンスからフラッシュメッセージを読み取ることもできます。

```ts
const response = await client.post('/posts')

response.flashMessages()
response.flashMessage('errors')
response.flashMessage('success')
```

最後に、次のいずれかのメソッドを使用してセッションデータに対するアサーションを記述できます。

```ts
const response = await client.post('/posts')

/**
 * 特定のキー（オプションで値）がセッションストアに存在することをアサートする
 */
response.assertSession('cart_items')
response.assertSession('cart_items', [{
  id: 1,
}, {
  id: 2,
}])

/**
 * 特定のキーがセッションストアに存在しないことをアサートする
 */
response.assertSessionMissing('cart_items')

/**
 * フラッシュメッセージストアにフラッシュメッセージが存在することをアサートする
 */
response.assertFlashMessage('success')
response.assertFlashMessage('success', '投稿が正常に作成されました')

/**
 * 特定のキーがフラッシュメッセージストアに存在しないことをアサートする
 */
response.assertFlashMissing('errors')

/**
 * フラッシュメッセージストアにバリデーションエラーが存在することをアサートする
 */
response.assertHasValidationError('title')
response.assertValidationError('title', '投稿タイトルを入力してください')
response.assertValidationErrors('title', [
  '投稿タイトルを入力してください',
  '投稿タイトルは10文字でなければなりません。'
])
response.assertDoesNotHaveValidationError('title')
```

## ユーザーの認証
アプリケーションでユーザーの認証に`@adonisjs/auth`パッケージを使用している場合、`authApiClient` Japaプラグインを使用して、HTTPリクエスト時にユーザーを認証することもできます。

最初のステップは、`tests/bootstrap.ts`ファイル内でプラグインを登録することです。

```ts
// title: tests/bootstrap.ts
// insert-start
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
// insert-end

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  // insert-start
  authApiClient(app)
  // insert-end
]
```

セッションベースの認証を使用している場合は、[セッションドライバをインメモリストアに切り替える](#セットアップ-1)必要があります。

```dotenv
// title: .env.test
SESSION_DRIVER=memory
```

以上です。`loginAs`メソッドを使用してユーザーをログインすることができます。メソッドは、ユーザーオブジェクトを唯一の引数として受け入れ、現在のHTTPリクエストのためにユーザーをログイン済みとしてマークします。

```ts
import User from '#models/user'

test('支払いリストを取得する', async ({ client }) => {
  const user = await User.create(payload)

  await client
    .get('/me/payments')
    // highlight-start
    .loginAs(user)
    // highlight-end
})
```

`loginAs`メソッドは、認証に`config/auth.ts`ファイルで設定されたデフォルトのガードを使用します。ただし、`withGuard`メソッドを使用してカスタムガードを指定することもできます。例:

```ts
await client
    .get('/me/payments')
    // highlight-start
    .withGuard('api_tokens')
    .loginAs(user)
    // highlight-end
```

## CSRFトークンを使用したリクエストの作成

もしアプリケーションのフォームが[CSRF保護](../security/securing_ssr_applications.md)を使用している場合、`withCsrfToken`メソッドを使用してCSRFトークンを生成し、リクエスト中にヘッダーとして渡すことができます。

`withCsrfToken`メソッドを使用する前に、`tests/bootstrap.ts`ファイル内で以下のJapaプラグインを登録し、また[セッションドライバの`SESSION_DRIVER`環境変数](#セットアップ-1)を`memory`に切り替えることを確認してください。

```ts
// title: tests/bootstrap.ts
// insert-start
import { shieldApiClient } from '@adonisjs/shield/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
// insert-end

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  // insert-start
  sessionApiClient(app),
  shieldApiClient()
  // insert-end
]
```

```ts
test('投稿を作成する', async ({ client }) => {
  await client
    .post('/posts')
    .form(dataGoesHere)
    .withCsrfToken()
})
```

## ルートヘルパー

TestContextの`route`ヘルパーを使用すると、ルートのURLを作成することができます。`route`ヘルパーを使用することで、ルートを更新する際にテスト内のすべてのURLを修正する必要がなくなります。

`route`ヘルパーは、[route](../basics/routing.md#url-builder)と同じ引数を受け入れます。

```ts
test('ユーザーのリストを取得する', async ({ client, route }) => {
  const response = await client.get(
    // highlight-start
    route('users.list')
    // highlight-end
  )

  response.assertStatus(200)
  response.assertBody({
    data: [
      {
        id: 1,
        email: 'foo@bar.com',
      }
    ]
  })
})
```
