---
summary: Responseクラスは、HTTPレスポンスを送信するために使用されます。HTMLフラグメント、JSONオブジェクト、ストリームなどの送信をサポートしています。
---

# レスポンス

[responseクラス](https://github.com/adonisjs/http-server/blob/main/src/response.ts)のインスタンスは、HTTPリクエストに対してレスポンスを返すために使用されます。AdonisJSは、**HTMLフラグメント**、**JSONオブジェクト**、**ストリーム**などの送信をサポートしています。レスポンスインスタンスは、`ctx.response`プロパティを使用してアクセスできます。

## レスポンスの送信

レスポンスを送信するもっとも簡単な方法は、ルートハンドラから値を返すことです。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  /** プレーンな文字列 */
  return 'これはホームページです。'

  /** HTMLフラグメント */
  return '<p>これはホームページです。</p>'

  /** JSONレスポンス */
  return { page: 'home' }

  /** ISO文字列に変換 */
  return new Date()
})
```

ルートハンドラから値を返すだけでなく、`response.send`メソッドを使用して明示的にレスポンスボディを設定することもできます。ただし、`response.send`メソッドを複数回呼び出すと、古いボディは上書きされ、最新のボディのみが保持されます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  /** プレーンな文字列 */
  response.send('これはホームページです。')

  /** HTMLフラグメント */
  response.send('<p>これはホームページです。</p>')

  /** JSONレスポンス */
  response.send({ page: 'home' })

  /** ISO文字列に変換 */
  response.send(new Date())
})
```

レスポンスのカスタムステータスコードは、`response.status`メソッドを使用して設定できます。

```ts
response.status(200).send({ page: 'home' })

// 空の201レスポンスを送信
response.status(201).send('')
```

## コンテンツのストリーミング

`response.stream`メソッドを使用すると、ストリームをレスポンスにパイプできます。このメソッドは、ストリームを内部的に破棄します。

`response.stream`メソッドは、`content-type`ヘッダと`content-length`ヘッダを設定しません。ストリーミングコンテンツをストリーミングする前に、これらのヘッダを明示的に設定する必要があります。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  const image = fs.createReadStream('./some-file.jpg')
  response.stream(image)
})
```

エラーが発生した場合、500ステータスコードがクライアントに送信されます。ただし、2番目のパラメータとしてコールバックを定義することで、エラーコードとメッセージをカスタマイズできます。

```ts
const image = fs.createReadStream('./some-file.jpg')

response.stream(image, () => {
  const message = 'ファイルの提供に失敗しました。もう一度お試しください。'
  const status = 400

  return [message, status]
})
```

## ファイルのダウンロード

ディスクからファイルをストリーミングする場合は、`response.download`メソッドを`response.stream`メソッドよりも使用することをオススメします。これは、`download`メソッドが自動的に`content-type`ヘッダと`content-length`ヘッダを設定するためです。

```ts
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'

router.get('/uploads/:file', async ({ response, params }) => {
  const filePath = app.makePath(`uploads/${params.file}`)

  response.download(filePath)
})
```

オプションとして、ファイルの内容に対して[Etag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)を生成することもできます。Etagを使用すると、ブラウザは前回のリクエストからのキャッシュされたレスポンスを再利用するのに役立ちます。

```ts
const filePath = app.makePath(`uploads/${params.file}`)
const generateEtag = true

response.download(filePath, generateEtag)
```

`response.stream`メソッドと同様に、最後のパラメータとしてコールバックを定義することで、カスタムエラーメッセージとステータスコードを送信することもできます。

```ts
const filePath = app.makePath(`uploads/${params.file}`)
const generateEtag = true

response.download(filePath, generateEtag, (error) => {
  if (error.code === 'ENOENT') {
    return ['ファイルが存在しません', 404]
  }

  return ['ファイルをダウンロードできません', 400]
})
```

### ファイルの強制ダウンロード

`response.attachment`メソッドは、`response.download`メソッドと似ていますが、[Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)ヘッダを設定することで、ブラウザにファイルをユーザーのコンピュータに保存させるように強制します。

```ts
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'

router.get('/uploads/:file', async ({ response, params }) => {
  const filePath = app.makePath(`uploads/${params.file}`)

  response.attachment(filePath, 'custom-filename.jpg')
})
```

## レスポンスのステータスとヘッダの設定

### ステータスの設定

`response.status`メソッドを使用してレスポンスのステータスを設定できます。このメソッドを呼び出すと、既存のレスポンスステータスが上書きされます（すでに設定されている場合）。ただし、ステータスが`undefined`の場合にのみ、`response.safeStatus`メソッドを使用してステータスを設定できます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  /**
   * ステータスを200に設定します
   */
  response.safeStatus(200)

  /**
   * 既に設定されているため、ステータスは設定されません
   */
  response.safeStatus(201)
})
```

### ヘッダの設定

`response.header`メソッドを使用してレスポンスヘッダを設定できます。このメソッドは、既存のヘッダ値を上書きします（すでに存在する場合）。ただし、ヘッダが`undefined`の場合にのみ、`response.safeHeader`メソッドを使用してヘッダを設定できます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ response }) => {
  /**
   * content-typeヘッダを定義します
   */
  response.safeHeader('Content-type', 'text/html')

  /**
   * 既に設定されているため、content-typeヘッダは設定されません
   */
  response.safeHeader('Content-type', 'text/html')
})
```

`response.append`メソッドを使用して既存のヘッダ値に値を追加できます。

```ts
response.append('Set-cookie', 'cookie-value')
```

`response.removeHeader`メソッドを使用して既存のヘッダを削除できます。

```ts
response.removeHeader('Set-cookie')
```

## リダイレクト

`response.redirect`メソッドは、[Redirect](https://github.com/adonisjs/http-server/blob/main/src/redirect.ts)クラスのインスタンスを返します。リダイレクトクラスは、フルエントAPIを使用してリダイレクトURLを構築します。

リダイレクトを実行するもっとも簡単な方法は、`redirect.toPath`メソッドをリダイレクトパスとともに呼び出すことです。

```ts
import router from '@adonisjs/core/services/router'

router.get('/posts', async ({ response }) => {
  response.redirect().toPath('/articles')
})
```

リダイレクトクラスは、事前に登録されたルートからURLを構築することもできます。`redirect.toRoute`メソッドは、[ルート識別子](./routing.md#route-identifier)を第1パラメータとして、ルートパラメータを第2パラメータとして受け入れます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/articles/:id', async () => {}).as('articles.show')

router.get('/posts/:id', async ({ response, params }) => {
  response.redirect().toRoute('articles.show', { id: params.id })
})
```

### 前のページにリダイレクトする

バリデーションエラーの場合にフォームの送信時にユーザーを前のページにリダイレクトしたい場合は、`redirect.back`メソッドを使用できます。

```ts
response.redirect().back()
```

### リダイレクトステータスコード

リダイレクトレスポンスのデフォルトステータスは`302`です。`redirect.status`メソッドを呼び出すことで、ステータスを変更できます。

```ts
response.redirect().status(301).toRoute('articles.show', { id: params.id })
```

### クエリ文字列付きのリダイレクト

`withQs`メソッドを使用してリダイレクトURLにクエリ文字列を追加できます。このメソッドは、キーと値のペアのオブジェクトを受け入れ、それを文字列に変換します。

```ts
response.redirect().withQs({ page: 1, limit: 20 }).toRoute('articles.index')
```

現在のリクエストURLのクエリ文字列を転送するには、パラメータなしで`withQs`メソッドを呼び出します。

```ts
// 現在のURLのクエリ文字列を転送
response.redirect().withQs().toRoute('articles.index')
```

前のページにリダイレクトする場合、`withQs`メソッドは前のページのクエリ文字列を転送します。

```ts
// 現在のURLのクエリ文字列を転送
response.redirect().withQs().back()
```

## エラーによるリクエストの中止

`response.abort`メソッドを使用して、例外を発生させることでリクエストを終了できます。このメソッドは、`E_HTTP_REQUEST_ABORTED`例外をスローし、[例外処理](./exception_handling.md)フローをトリガーします。

```ts
router.get('posts/:id/edit', async ({ response, auth, params }) => {
  const post = await Post.findByOrFail(params.id)

  if (!auth.user.can('editPost', post)) {
    response.abort({ message: '投稿を編集することはできません' })
  }

  // 残りのロジックを続行する
})
```

デフォルトでは、例外は`400`ステータスコードを持つHTTPレスポンスを作成します。ただし、2番目のパラメータとしてカスタムステータスコードを指定することもできます。

```ts
response.abort({ message: '投稿を編集することはできません' }, 403)
```

## レスポンスの書き込み完了後のアクションの実行

`response.onFinish`メソッドを使用すると、Node.jsがレスポンスをTCPソケットに書き込み終了したときのイベントをリッスンできます。内部的には、[on-finished](https://github.com/jshttp/on-finished)パッケージを使用していますので、詳細な技術的な説明についてはパッケージのREADMEファイルを参照してください。

```ts
router.get('posts', ({ response }) => {
  response.onFinish(() => {
    // クリーンアップロジック
  })
})
```

## Node.jsの`res`オブジェクトへのアクセス

`response.response`プロパティを使用すると、[Node.jsのresオブジェクト](https://nodejs.org/dist/latest-v19.x/docs/api/http.html#class-httpserverresponse)にアクセスできます。

```ts
router.get('posts', ({ response }) => {
  console.log(response.response)
})
```

## レスポンスボディのシリアライズ

`response.send`メソッドで設定されたレスポンスボディは、出力メッセージストリームに[書き込まれる前に](https://nodejs.org/dist/latest-v18.x/docs/api/http.html#responsewritechunk-encoding-callback)文字列にシリアライズされます。

以下は、サポートされているデータ型とそのシリアライズルールのリストです。

- 配列とオブジェクトは、[安全な文字列化関数](https://github.com/poppinss/utils/blob/main/src/json/safe_stringify.ts)を使用して文字列化されます。このメソッドは、`JSON.stringify`と似ていますが、循環参照を削除し、`BigInt`をシリアライズします。
- 数値とブール値は文字列に変換されます。
- Dateクラスのインスタンスは、`toISOString`メソッドを呼び出して文字列に変換されます。
- 正規表現とエラーオブジェクトは、`toString`メソッドを呼び出して文字列に変換されます。
- その他のデータ型は例外が発生します。

### コンテンツタイプの推論

レスポンスをシリアライズした後、レスポンスクラスは自動的に`content-type`ヘッダと`content-length`ヘッダを推論して設定します。

以下は、`content-type`ヘッダを設定するために私たちが従うルールのリストです。

- 配列とオブジェクトの場合、`content-type`は`application/json`に設定されます。
- HTMLフラグメントの場合、`content-type`は`text/html`に設定されます。
- JSONPレスポンスは`text/javascript`のコンテンツタイプで送信されます。
- それ以外の場合、`content-type`は`text/plain`に設定されます。

## Responseクラスの拡張

マクロやゲッターを使用して、Responseクラスにカスタムプロパティを追加できます。マクロの概念についてはじめての場合は、[AdonisJSの拡張ガイド](../concepts/extending_the_framework.md)を先に読んでください。

```ts
import { Response } from '@adonisjs/core/http'

Response.macro('property', function (this: Response) {
  return value
})
Response.getter('property', function (this: Response) {
  return value
})
```

マクロとゲッターは実行時に追加されるため、TypeScriptにその型について通知する必要があります。

```ts
declare module '@adonisjs/core/http' {
  export interface Response {
    property: valueType
  }
}
```
