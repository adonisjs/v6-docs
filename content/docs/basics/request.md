---
summary: Requestクラスは、リクエストボディ、アップロードされたファイルへの参照、クッキー、リクエストヘッダなど、進行中のHTTPリクエストのデータを保持します。
---

# Request

[requestクラス](https://github.com/adonisjs/http-server/blob/main/src/request.ts)のインスタンスは、リクエストボディ、アップロードされたファイルへの参照、クッキー、リクエストヘッダなど、進行中のHTTPリクエストのデータを保持します。requestインスタンスは、`ctx.request`プロパティを使用してアクセスできます。

## クエリ文字列とルートパラメータ

`request.qs`メソッドは、パースされたクエリ文字列をオブジェクトとして返します。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts', async ({ request }) => {
  /*
   * URL: /?sort_by=id&direction=desc
   * qs: { sort_by: 'id', direction: 'desc' }
   */
  request.qs()
})
```

`request.params`メソッドは、[ルートパラメータ](./routing.md#route-params)のオブジェクトを返します。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts/:slug/comments/:id', async ({ request }) => {
  /*
   * URL: /posts/hello-world/comments/2
   * params: { slug: 'hello-world', id: '2' }
   */
  request.params()
})
```

`request.param`メソッドを使用して、単一のパラメータにアクセスできます。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts/:slug/comments/:id', async ({ request }) => {
  const slug = request.param('slug')
  const commentId = request.param('id')
})
```

## リクエストボディ

AdonisJSは、`start/kernel.ts`ファイルに登録された[body-parserミドルウェア](../basics/body_parser.md)を使用して、リクエストボディをパースします。

`request.body()`メソッドを使用して、リクエストボディにアクセスできます。パースされたリクエストボディがオブジェクトとして返されます。

```ts
import router from '@adonisjs/core/services/router'

router.post('/', async ({ request }) => {
  console.log(request.body())
})
```

`request.all`メソッドは、リクエストボディとクエリ文字列の両方をマージしたコピーを返します。

```ts
import router from '@adonisjs/core/services/router'

router.post('/', async ({ request }) => {
  console.log(request.all())
})
```

### 特定の値を選択する

`request.input`、`request.only`、および`request.except`メソッドを使用して、リクエストデータから特定のプロパティを選択できます。すべての選択メソッドは、リクエストボディとクエリ文字列の両方から値を検索します。

`request.only`メソッドは、指定されたプロパティのみを持つオブジェクトを返します。

```ts
import router from '@adonisjs/core/services/router'

router.post('login', async ({ request }) => {
  const credentials = request.only(['email', 'password'])

  console.log(credentials)
})
```

`request.except`メソッドは、指定されたプロパティを除外したオブジェクトを返します。

```ts
import router from '@adonisjs/core/services/router'

router.post('register', async ({ request }) => {
  const userDetails = request.except(['password_confirmation'])

  console.log(userDetails)
})
```

`request.input`メソッドは、特定のプロパティの値を返します。オプションで、2番目の引数としてデフォルト値を渡すこともできます。実際の値が存在しない場合には、デフォルト値が返されます。

```ts
import router from '@adonisjs/core/services/router'

router.post('comments', async ({ request }) => {
  const email = request.input('email')
  const commentBody = request.input('body')
})
```

### 型安全なリクエストボディ

`request.all`、`request.body`、または選択メソッドは、リクエストボディの期待されるデータ型をAdonisJSが直接知る方法がないため、型安全ではありません。

ただし、[バリデータ](./validation.md)を使用してリクエストボディを検証し、静的な型安全性を確保できます。

## リクエストURL

`request.url`メソッドは、ホスト名に対するリクエストURLを返します。デフォルトでは、返される値にはクエリ文字列は含まれません。ただし、`request.url(true)`を呼び出すことで、クエリ文字列を含むURLを取得できます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/users', async ({ request }) => {
  /*
   * URL: /users?page=1&limit=20
   * url: /users
   */
  request.url()

  /*
   * URL: /users?page=1&limit=20
   * url: /users?page=1&limit=20
   */
  request.url(true) // クエリ文字列を返す
})
```

`request.completeUrl`メソッドは、ホスト名を含む完全なURLを返します。再度、明示的に指定しない限り、返される値にはクエリ文字列は含まれません。

```ts
import router from '@adonisjs/core/services/router'

router.get('/users', async ({ request }) => {
  request.completeUrl()
  request.completeUrl(true) // クエリ文字列を返す
})
```

## リクエストヘッダ

`request.headers`メソッドは、リクエストヘッダをオブジェクトとして返します。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.headers())
})
```

`request.header`メソッドを使用して、個々のヘッダの値にアクセスできます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  request.header('x-request-id')

  // ヘッダ名は大文字小文字を区別しません
  request.header('X-REQUEST-ID')
})
```

## リクエストメソッド

`request.method`メソッドは、現在のリクエストのHTTPメソッドを返します。このメソッドは、[フォームメソッドスプーフィング](#form-method-spoofing)が有効になっている場合にスプーフィングされたメソッドを返し、元のリクエストメソッドを取得するために`request.intended`メソッドを使用できます。

```ts
import router from '@adonisjs/core/services/router'

router.patch('posts', async ({ request }) => {
  /**
   * ルートマッチングに使用されたメソッド
   */
  console.log(request.method())

  /**
   * 実際のリクエストメソッド
   */
  console.log(request.intended())
})
```

## ユーザーのIPアドレス

`request.ip`メソッドは、現在のHTTPリクエストのユーザーのIPアドレスを返します。このメソッドは、NginxやCaddyなどのプロキシサーバーが設定した[`X-Forwarded-For`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)ヘッダーに依存しています。

:::note

アプリケーションが信頼するプロキシを設定するために、[信頼されたプロキシ](#configuring-trusted-proxies)セクションを読んでください。

:::

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.ip())
})
```

`request.ips`メソッドは、中間プロキシによって設定されたすべてのIPアドレスの配列を返します。配列は最も信頼性の高いIPアドレスから最も信頼性の低いIPアドレスの順に並べられます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.ips())
})
```

### カスタム`getIp`メソッドの定義

信頼されたプロキシの設定が不十分で正しいIPアドレスを判断できない場合は、カスタムの`getIp`メソッドを実装することができます。

このメソッドは、`config/app.ts`ファイルの`http`設定オブジェクト内に定義されます。

```ts
http: {
  getIp(request) {
    const ip = request.header('X-Real-Ip')
    if (ip) {
      return ip
    }

    return request.ips()[0]
  }
}
```

## コンテンツネゴシエーション

AdonisJSは、一般的にサポートされているすべての`Accept`ヘッダーをパースすることで、[コンテンツネゴシエーション](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation#server-driven_content_negotiation)を行うためのいくつかのメソッドを提供しています。たとえば、`request.types`メソッドを使用して、特定のリクエストで受け入れられるコンテンツタイプのリストを取得できます。

`request.types`メソッドの戻り値は、クライアントの優先順位に従って並べ替えられたものです（最も優先されるものが最初になります）。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request }) => {
  console.log(request.types())
})
```

以下は、コンテンツネゴシエーションメソッドの完全なリストです。

| メソッド    | 使用されるHTTPヘッダー                                                                           |
|-----------|----------------------------------------------------------------------------------------------|
| types     | [Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)                   |
| languages | [Accept-language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language) |
| encodings | [Accept-encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding) |
| charsets  | [Accept-charset](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Charset)   |

サーバーがサポートできるコンテンツタイプに基づいて、最も好ましいコンテンツタイプを見つけたい場合があります。

そのために、`request.accepts`メソッドを使用できます。このメソッドは、サポートされているコンテンツタイプの配列を受け取り、`Accept`ヘッダーを調査して最も好ましいコンテンツタイプを返します。一致が見つからない場合は、`null`が返されます。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts', async ({ request, view }) => {
  const posts = [
    {
      title: 'Adonis 101',
    },
  ]

  const bestMatch = request.accepts(['html', 'json'])

  switch (bestMatch) {
    case 'html':
      return view.render('posts/index', { posts })
    case 'json':
      return posts
    default:
      return view.render('posts/index', { posts })
  }
})
```

`request.accept`と同様に、次のメソッドを使用して他の`Accept`ヘッダーの最適な値を見つけることができます。

```ts
// 優先される言語
const language = request.language(['fr', 'de'])

// 優先されるエンコーディング
const encoding = request.encoding(['gzip', 'br'])

// 優先される文字セット
const charset = request.charset(['utf-8', 'hex', 'ascii'])
```

## リクエストIDの生成

リクエストIDは、ログからアプリケーションの問題をデバッグおよびトレースするために、各HTTPリクエストに一意のIDを割り当てることで役立ちます。デフォルトでは、リクエストIDの作成は無効になっています。ただし、`config/app.ts`ファイルで有効にできます。

:::note

リクエストIDは、[cuid2](https://github.com/paralleldrive/cuid2)パッケージを使用して生成されます。IDを生成する前に、`X-Request-Id`リクエストヘッダーが存在する場合はその値を使用します。

:::

```ts
// title: config/app.ts
{
  http: {
    generateRequestId: true
  }
}
```

有効になった場合、`request.id`メソッドを使用してIDにアクセスできます。

```ts
router.get('/', ({ request }) => {
  // ckk9oliws0000qt3x9vr5dkx7
  console.log(request.id())
})
```

同じリクエストIDは、`ctx.logger`インスタンスを使用して生成されたすべてのログにも追加されます。

```ts
router.get('/', ({ logger }) => {
  // { msg: 'hello world', request_id: 'ckk9oliws0000qt3x9vr5dkx7' }
  logger.info('hello world')
})
```

## 信頼されたプロキシの設定

ほとんどのNode.jsアプリケーションは、NginxやCaddyなどのプロキシサーバーの背後にデプロイされます。そのため、リクエストURLのクエリ文字列などのHTTPヘッダーを使用して、実際のエンドクライアントがHTTPリクエストを行っていることを知る必要があります。

これらのヘッダーは、AdonisJSアプリケーションがソースIPアドレスを信頼できる場合にのみ使用されます。

`config/app.ts`ファイル内の`http.trustProxy`設定オプションを使用して、信頼するIPアドレスを設定できます。

```ts
import proxyAddr from 'proxy-addr'

{
  http: {
    trustProxy: proxyAddr.compile(['127.0.0.1/8', '::1/128'])
  }
}
```

`trustProxy`の値は関数にすることもできます。メソッドは、IPアドレスが信頼できる場合は`true`を返し、それ以外の場合は`false`を返す必要があります。

```ts
{
  http: {
    trustProxy: (address) => {
      return address === '127.0.0.1' || address === '123.123.123.123'
    }
  }
}
```

もしNginxをアプリケーションコードと同じサーバーで実行している場合、ループバックIPアドレス（つまり、127.0.0.1）を信頼する必要があります。

```ts
import proxyAddr from 'proxy-addr'

{
  http: {
    trustProxy: proxyAddr.compile('loopback')
  }
}
```

アプリケーションがロードバランサーを介してのみアクセス可能で、そのロードバランサーのIPアドレスのリストを持っていない場合は、常に`true`を返すコールバックを定義することでプロキシサーバーを信頼できます。

```ts
{
  http: {
    trustProxy: () => true
  }
}
```

## クエリ文字列パーサーの設定

リクエストURLのクエリ文字列は、[qs](http://npmjs.com/qs)モジュールを使用してパースされます。パーサーの設定は`config/app.ts`ファイル内で行うことができます。

[利用可能なオプションのリスト](https://github.com/adonisjs/http-server/blob/main/src/types/qs.ts#L11)を参照してください。

```ts
http: {
  qs: {
    parse: {
    },
  }
}
```

## フォームメソッドスプーフィング

HTMLフォームのフォームメソッドは、`GET`または`POST`にのみ設定できるため、[RESTfulなHTTPメソッド](https://restfulapi.net/http-methods/)を活用することはできません。

ただし、AdonisJSでは**フォームメソッドスプーフィング**を使用してこの制限を回避できます。フォームメソッドスプーフィングとは、`_method`クエリ文字列を使用してフォームメソッドを指定する方法のことです。

フォームメソッドスプーフィングを使用するには、フォームのアクションを`POST`に設定し、`config/app.ts`ファイルでこの機能を有効にする必要があります。

```ts
// title: config/app.ts
export const http = defineConfig({
  allowMethodSpoofing: true,
})
```

有効になったら、次のようにフォームメソッドをスプーフィングできます。

```html
<form method="POST" action="/articles/1?_method=PUT">
  <!-- 更新フォーム -->
</form>
```

```html
<form method="POST" action="/articles/1?_method=DELETE">
  <!-- 削除フォーム -->
</form>
```

## Requestクラスの拡張

マクロやゲッターを使用して、Requestクラスにカスタムプロパティを追加できます。マクロの概念についてはじめての場合は、[AdonisJSの拡張ガイド](../concepts/extending_the_framework.md)を先に読んでください。

```ts
import { Request } from '@adonisjs/core/http'

Request.macro('property', function (this: Request) {
  return value
})
Request.getter('property', function (this: Request) {
  return value
})
```

マクロやゲッターは実行時に追加されるため、TypeScriptにその型について知らせる必要があります。

```ts
declare module '@adonisjs/core/http' {
  export interface Request {
    property: valueType
  }
}
```
