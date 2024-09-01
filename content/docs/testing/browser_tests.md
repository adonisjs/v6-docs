---
summary: AdonisJSアプリケーション内でのPlaywrightとJapaを使用したブラウザテスト。
---

# ブラウザテスト

ブラウザテストは、Chrome、Firefox、またはSafariなどの実際のブラウザ内で実行されます。私たちは、ウェブページとのプログラム的なやり取りに[Playwright](https://playwright.dev/)（ブラウザ自動化ツール）を使用します。

Playwrightは、ブラウザとのやり取りにJavaScriptのAPIを公開するテストフレームワークであり、ライブラリでもあります。私たちは**Playwrightのテストフレームワークは使用しません**。なぜなら、すでにJapaを使用しているため、1つのプロジェクト内で複数のテストフレームワークを使用すると混乱と設定の肥大化につながるからです。

代わりに、Japaとうまく統合し、素晴らしいテスト体験を提供する[JapaのBrowser Client](https://japa.dev/docs/plugins/browser-client)プラグインを使用します。

## セットアップ
最初のステップは、npmパッケージレジストリから次のパッケージをインストールすることです。

:::codegroup

```sh
// title: npm
npm i -D playwright @japa/browser-client
```

:::

### ブラウザスイートの登録
まず、`adonisrc.ts`ファイル内にブラウザテスト用の新しいテストスイートを作成します。ブラウザスイートのテストファイルは`tests/browser`ディレクトリに保存されます。

```ts
{
  tests: {
    suites: [
      // highlight-start
      {
        files: [
          'tests/browser/**/*.spec(.ts|.js)'
        ],
        name: 'browser',
        timeout: 300000
      }
      // highlight-end
    ]
  }
}
```

### プラグインの設定
テストを書き始める前に、`tests/bootstrap.ts`ファイル内で`browserClient`プラグインを登録する必要があります。

```ts
import { browserClient } from '@japa/browser-client'

export const plugins: Config['plugins'] = [
  assert(),
  apiClient(),
  // highlight-start
  browserClient({
    runInSuites: ['browser']
  }),
  // highlight-end
  pluginAdonisJS(app)
]
```

## 基本的な例
AdonisJSアプリケーションのホームページを開き、ページの内容を検証する例のテストを作成しましょう。[`visit`](https://japa.dev/docs/plugins/browser-client#browser-api)ヘルパーは新しいページを開き、URLにアクセスします。戻り値は[ページオブジェクト](https://playwright.dev/docs/api/class-page)です。

参考：[アサーションメソッドの一覧](https://japa.dev/docs/plugins/browser-client#assertions)

```sh
node ace make:test pages/home --suite=browser
# DONE:    create tests/browser/pages/home.spec.ts
```

```ts
// title: tests/browser/pages/home.spec.ts
import { test } from '@japa/runner'

test.group('ホームページ', () => {
  test('ウェルカムメッセージを表示する', async ({ visit }) => {
    const page = await visit('/')
    await page.assertTextContains('body', 'It works!')
  })
})
```

最後に、上記のテストを`test`コマンドを使用して実行しましょう。`--watch`フラグを使用して、ファイルの変更ごとにテストを再実行することもできます。

```sh
node ace test browser
```

![](./browser_tests_output.jpeg)

## クッキーの読み書き
実際のブラウザ内でテストを実行する場合、クッキーは[ブラウザコンテキスト](https://playwright.dev/docs/api/class-browsercontext)のライフサイクル全体で永続化されます。

Japaは各テストごとに新しいブラウザコンテキストを作成します。したがって、1つのテストのクッキーは他のテストに漏れることはありません。ただし、1つのテスト内で複数回のページ訪問を行う場合、同じ`browserContext`を使用するため、クッキーが共有されます。

```ts
test.group('ホームページ', () => {
  test('ウェルカムメッセージを表示する', async ({ visit, browserContext }) => {
    // highlight-start
    await browserContext.setCookie('username', 'virk')
    // highlight-end
    
    // リクエスト時に「username」クッキーが送信されます
    const homePage = await visit('/')

    // このリクエスト時にも「username」クッキーが送信されます
    const aboutPage = await visit('/about')
  })
})
```

同様に、サーバーが設定したクッキーは`browserContext.getCookie`メソッドを使用してアクセスできます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  // highlight-start
  response.cookie('cartTotal', '100')
  // highlight-end

  return 'It works!'
})
```

```ts
test.group('ホームページ', () => {
  test('ウェルカムメッセージを表示する', async ({ visit, browserContext }) => {
    const page = await visit('/')
    // highlight-start
    console.log(await browserContext.getCookie('cartTotal'))
    // highlight-end
  })
})
```

次のメソッドを使用して、暗号化されたクッキーとプレーンなクッキーの読み書きを行うことができます。

```ts
// 書き込み
await browserContext.setEncryptedCookie('username', 'virk')
await browserContext.setPlainCookie('username', 'virk')

// 読み込み
await browserContext.getEncryptedCookie('cartTotal')
await browserContext.getPlainCookie('cartTotal')
```

## セッションストアの設定
アプリケーション内でセッションデータの読み書きを行うために[`@adonisjs/session`](../basics/session.md)パッケージを使用している場合、テストを作成する際にセッションストアを準備するために`sessionBrowserClient`プラグインを使用することもできます。

### セットアップ
最初のステップは、`tests/bootstrap.ts`ファイル内でプラグインを登録することです。

```ts
// insert-start
import { sessionBrowserClient } from '@adonisjs/session/plugins/browser_client'
// insert-end

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  // insert-start
  sessionBrowserClient(app)
  // insert-end
]
```

次に、`.env.test`ファイル（存在しない場合は作成）を更新し、`SESSON_DRIVER`を`memory`に設定します。

```dotenv
// title: .env.test
SESSION_DRIVER=memory
```

### セッションデータの書き込み
`browserContext.setSession`メソッドを使用して、現在のブラウザコンテキストのセッションデータを定義できます。

同じブラウザコンテキストを使用して行われるすべてのページ訪問は、同じセッションデータにアクセスできます。ただし、ブラウザまたはコンテキストが閉じられるとセッションデータは削除されます。

```ts
test('カートアイテムをチェックアウトする', async ({ browserContext, visit }) => {
  // highlight-start
  await browserContext.setSession({
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

  const page = await visit('/checkout')
})
```

`setSession`メソッドと同様に、`browser.setFlashMessages`メソッドを使用してフラッシュメッセージを定義することもできます。

```ts
/**
 * フラッシュメッセージを定義する
 */
await browserContext.setFlashMessages({
  success: '投稿が正常に作成されました',
})

const page = await visit('/posts/1')

/**
 * ポストページがフラッシュメッセージを表示していることをアサートする
 * ".alert-success" div内に。
 */
await page.assertExists(page.locator(
  'div.alert-success',
  { hasText: '投稿が正常に作成されました' }
))
```

### セッションデータの読み込み
`browserContext.getSession`および`browser.getFlashMessages`メソッドを使用して、セッションストア内のデータを読み取ることができます。これらのメソッドは、特定のブラウザコンテキストインスタンスに関連付けられたセッションIDのすべてのデータを返します。

```ts
const session = await browserContext.getSession()
const flashMessages = await browserContext.getFlashMessages()
```

## ユーザーの認証
アプリケーションでユーザーの認証に`@adonisjs/auth`パッケージを使用している場合、`authBrowserClient` Japaプラグインを使用して、HTTPリクエストを行う際にユーザーを認証できます。

最初のステップは、`tests/bootstrap.ts`ファイル内でプラグインを登録することです。

```ts
// title: tests/bootstrap.ts
// insert-start
import { authBrowserClient } from '@adonisjs/auth/plugins/browser_client'
// insert-end

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  // insert-start
  authBrowserClient(app)
  // insert-end
]
```

セッションベースの認証を使用している場合は、セッションドライバをインメモリストアに切り替えてください。

```dotenv
// title: .env.test
SESSION_DRIVER=memory
```

以上です。`loginAs`メソッドを使用してユーザーをログインできます。このメソッドは、ユーザーオブジェクトを唯一の引数として受け取り、ユーザーを現在のブラウザコンテキストにログインします。

同じブラウザコンテキストを使用して行われるすべてのページ訪問は、ログインしたユーザーにアクセスできます。ただし、ブラウザまたはコンテキストが閉じられるとユーザーセッションは破棄されます。

```ts
import User from '#models/user'

test('支払いリストを取得する', async ({ browserContext, visit }) => {
  // highlight-start
  const user = await User.create(payload)
  await browserContext.loginAs(user)
  // highlight-end

  const page = await visit('/dashboard')
})
```

`loginAs`メソッドは、認証に`config/auth.ts`ファイルで設定されたデフォルトのガードを使用します。ただし、`withGuard`メソッドを使用してカスタムガードを指定することもできます。

例：
```ts
const user = await User.create(payload)
await browserContext
  .withGuard('admin')
  .loginAs(user)
```


## ルートヘルパー
テストコンテキストの`route`ヘルパーを使用して、ルートのURLを作成できます。`route`ヘルパーを使用すると、ルートを更新するたびにテスト内のすべてのURLを修正する必要がなくなります。

`route`ヘルパーは、グローバルテンプレートメソッド[route](../basics/routing.md#url-builder)と同じ引数を受け入れます。

```ts
test('ユーザーリストを表示する', async ({ visit, route }) => {
  const page = await visit(
    // highlight-start
    route('users.list')
    // highlight-end
  )
})
```
