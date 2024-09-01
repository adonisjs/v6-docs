---
summary: AdonisJSでルート、ルートパラメータ、およびルートハンドラを定義する方法を学びます。
---

# ルーティング

ウェブサイトやウェブアプリケーションのユーザーは、`/`、`/about`、または`/posts/1`など、さまざまなURLにアクセスできます。これらのURLを機能させるには、ルートを定義する必要があります。

AdonisJSでは、ルートは`start/routes.ts`ファイル内で定義されます。ルートは、**URIパターン**とその特定のルートのリクエストを処理する**ハンドラ**の組み合わせです。

例：
```ts
import router from '@adonisjs/core/services/router'

router.get('/', () => {
  return 'ホームページからこんにちは世界。'
})

router.get('/about', () => {
  return 'これはaboutページです。'
})

router.get('/posts/:id', ({ params }) => {
  return `この投稿のIDは${params.id}です。`
})
```

上記の例の最後のルートでは、動的なURIパターンが使用されています。`:id`は、ルーターにIDの任意の値を受け入れるように指示する方法です。これを**ルートパラメータ**と呼びます。

## 登録されたルートの一覧を表示する
`list:routes`コマンドを実行すると、アプリケーションによって登録されたルートの一覧を表示できます。

```sh
node ace list:routes
```

また、[公式のVSCode拡張機能](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension)を使用している場合、VSCodeのアクティビティバーからルートの一覧を表示することもできます。

![](./vscode_routes_list.png)

## ルートパラメータ

ルートパラメータを使用すると、動的な値を受け入れることができるURIを定義できます。各パラメータはURIセグメントの値をキャプチャし、ルートハンドラ内でこの値にアクセスすることができます。

ルートパラメータは常にコロン`:`で始まり、その後にパラメータの名前が続きます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/posts/:id', ({ params }) => {
  return params.id
})
```

| URL              | Id        |
|------------------|-----------|
| `/posts/1`       | `1`       |
| `/posts/100`     | `100`     |
| `/posts/foo-bar` | `foo-bar` |

URIは複数のパラメータも受け入れることができます。各パラメータは一意の名前を持つ必要があります。

```ts
import router from '@adonisjs/core/services/router'

router.get('/posts/:id/comments/:commentId', ({ params }) => {
  console.log(params.id)
  console.log(params.commentId)
})
```

| URL                          | Id        | Comment Id |
|------------------------------|-----------|------------|
| `/posts/1/comments/4`        | `1`       | `4`        |
| `/posts/foo-bar/comments/22` | `foo-bar` | `22`       |

### オプションのパラメータ

ルートパラメータは、パラメータ名の末尾に疑問符`?`を追加することでオプションにすることもできます。オプションのパラメータは必須のパラメータの後に配置する必要があります。

```ts
import router from '@adonisjs/core/services/router'

router.get('/posts/:id?', ({ params }) => {
  if (!params.id) {
    return 'すべての投稿を表示しています。'
  }

  return `IDが${params.id}の投稿を表示しています。`
})
```

### ワイルドカードパラメータ

ワイルドカードパラメータを使用すると、URIのすべてのセグメントをキャプチャできます。ワイルドカードパラメータは特別な`*`キーワードを使用して指定され、最後の位置で定義する必要があります。

```ts
import router from '@adonisjs/core/services/router'

router.get('/docs/:category/*', ({ params }) => {
  console.log(params.category)
  console.log(params['*'])
})
```

| URL                  | Category | Wildcard param   |
|----------------------|----------|------------------|
| `/docs/http/context` | `http`   | `['context']`    |
| `/docs/api/sql/orm`  | `api`    | `['sql', 'orm']` |

### パラメータのマッチャー

ルーターは、受け入れるパラメータデータの形式を把握していません。例えば、URIが`/posts/foo-bar`と`/posts/1`の場合、同じルートにマッチします。ただし、パラメータの値を明示的に検証するために、パラメータマッチャーを使用することができます。

マッチャーは`route.where`メソッドを使用して登録されます。最初の引数はパラメータ名であり、2番目の引数はマッチャーオブジェクトです。

次の例では、idが有効な数値であることを検証するための正規表現を定義しています。検証に失敗した場合、ルートはスキップされます。

```ts
import router from '@adonisjs/core/services/router'

router
  .get('/posts/:id', ({ params }) => {})
  .where('id', {
    match: /^[0-9]+$/,
  })
```

`match`正規表現の他に、パラメータの値を正しいデータ型に変換するための`cast`関数を定義することもできます。この例では、idを数値に変換しています。

```ts
import router from '@adonisjs/core/services/router'

router
  .get('/posts/:id', ({ params }) => {
    console.log(typeof params.id)
  })
  .where('id', {
    match: /^[0-9]+$/,
    cast: (value) => Number(value),
  })
```

### 組み込みのマッチャー

ルーターには、よく使用されるデータ型に対して以下のヘルパーメソッドが用意されています。

```ts
import router from '@adonisjs/core/services/router'

// idを数値として検証 + 数値データ型にキャスト
router.where('id', router.matchers.number())

// idが有効なUUIDであることを検証
router.where('id', router.matchers.uuid())

// slugが指定されたスラグの正規表現に一致することを検証: regexr.com/64su0
router.where('slug', router.matchers.slug())
```

### グローバルなマッチャー

ルートマッチャーは、ルーターインスタンスでグローバルに定義することもできます。ルートレベルで明示的にオーバーライドされない限り、グローバルマッチャーはすべてのルートに適用されます。

```ts
import router from '@adonisjs/core/services/router'

// グローバルマッチャー
router.where('id', router.matchers.uuid())

router
  .get('/posts/:id', () => {})
  // ルートレベルでオーバーライド
  .where('id', router.matchers.number())
```

## HTTPメソッド

`router.get`メソッドは、[GET HTTPメソッド](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)に応答するルートを作成します。同様に、異なるHTTPメソッドのためのルートを登録するために以下のメソッドを使用できます。

```ts
// GETメソッド
router.get('users', () => {})

// POSTメソッド
router.post('users', () => {})

// PUTメソッド
router.put('users/:id', () => {})

// PATCHメソッド
router.patch('users/:id', () => {})

// DELETEメソッド
router.delete('users/:id', () => {})
```

すべての標準的なHTTPメソッドに応答するルートを作成するには、`route.any`メソッドを使用できます。

```ts
router.any('reports', () => {})
```

最後に、`route.route`メソッドを使用してカスタムHTTPメソッド用のルートを作成することもできます。

```ts
router.route('/', ['TRACE'], () => {})
```

## ルーターハンドラ

ルートハンドラは、レスポンスを返すか例外を発生させることでリクエストを処理します。

ハンドラは、インラインのコールバック（このガイドで見たようなもの）またはコントローラメソッドへの参照であることができます。

```ts
router.post('users', async () => {
})
```

次の例では、`UsersController`クラスをインポートし、ルートにバインドしています。HTTPリクエスト時、AdonisJSはIoCコンテナを使用してコントローラクラスのインスタンスを作成し、`store`メソッドを実行します。

参照：[コントローラに関する専用ガイド](./controllers.md)も参照してください。

```ts
import UsersController from '#controllers/users_controller'

router.post('users', [UsersController, 'store'])
```

## ルートミドルウェア

`route.use`メソッドを呼び出すことで、ルートにミドルウェアを定義できます。メソッドはインラインのコールバックまたは名前付きミドルウェアへの参照を受け入れます。

以下は、ルートミドルウェアを定義する最小の例です。すべての利用可能なオプションとミドルウェアの実行フローについては、[ミドルウェアの専用ガイド](./middleware.md)を参照してください。

```ts
router
  .get('posts', () => {
    console.log('ルートハンドラ内')

    return 'すべての投稿を表示しています。'
  })
  .use((_, next) => {
    console.log('ミドルウェア内')
    return next()
  })
```

## ルート識別子

すべてのルートには一意の識別子があり、この識別子を使用してアプリケーションの他の場所でルートを参照できます。たとえば、[URLビルダー](#url-builder)を使用してルートへのURLを生成したり、[response.redirect](./response.md#redirects)メソッドを使用してルートにリダイレクトしたりできます。

デフォルトでは、ルートパターンがルート識別子です。ただし、`route.as`メソッドを使用して一意で覚えやすい名前をルートに割り当てることもできます。

```ts
router.get('users', () => {}).as('users.index')

router.post('users', () => {}).as('users.store')

router.delete('users/:id', () => {}).as('users.delete')
```

これで、テンプレート内でルート名を使用してURLを構築したり、URLビルダーを使用してURLを作成したりできます。

```ts
const url = router.builder().make('users.delete', [user.id])
```

```edge
<form
  method='POST'
  action="{{
    route('users.delete', [user.id], { formAction: 'delete' })
  }}"
></form>
```

## ルートグループ

ルートグループは、ネストされたルートを一括で設定するための便利な機能を提供します。`router.group`メソッドを使用してルートグループを作成できます。

```ts
router.group(() => {
  /**
   * コールバック内で登録されたすべてのルートは、周囲のグループの一部です
   */
  router.get('users', () => {})
  router.post('users', () => {})
})
```

ルートグループはネストすることもでき、AdonisJSは適用された設定の動作に基づいてプロパティをマージまたはオーバーライドします。

```ts
router.group(() => {
  router.get('posts', () => {})

  router.group(() => {
    router.get('users', () => {})
  })
})
```

### ルートグループ内のプレフィックス

グループ内のルートのURIパターンにプレフィックスを付けることができます。次の例では、`/api/users`および`/api/payments`のURIパターンのルートが作成されます。

```ts
router
  .group(() => {
    router.get('users', () => {})
    router.get('payments', () => {})
  })
  .prefix('/api')
```

ネストされたグループの場合、プレフィックスは外側から内側のグループに適用されます。次の例では、`/api/v1/users`および`/api/v1/payments`のURIパターンのルートが作成されます。

```ts
router
  .group(() => {
    router
      .group(() => {
        router.get('users', () => {})
        router.get('payments', () => {})
      })
      .prefix('v1')
  })
  .prefix('api')
```

### グループ内のルートの名前付け

ルートパターンにプレフィックスを付けるだけでなく、group.asメソッドを使用してグループ内のルートの名前にもプレフィックスを付けることができます。

:::note

グループ内のルートには、プレフィックスを付ける前に名前を付ける必要があります。

:::

```ts
router
  .group(() => {
    route
      .get('users', () => {})
      .as('users.index') // 最終的な名前 - api.users.index
  })
  .prefix('api')
  .as('api')
```

ネストされたグループの場合、名前は外側から内側のグループにプレフィックスが付けられます。

```ts
router
  .group(() => {
    route
      .get('users', () => {})
      .as('users.index') // api.users.index

    router
      .group(() => {
        route
          .get('payments', () => {})
          .as('payments.index') // api.commerce.payments.index
      })
      .as('commerce')
  })
  .prefix('api')
  .as('api')
```

### グループ内のルートにミドルウェアを適用する

`group.use`メソッドを使用して、グループ内のルートにミドルウェアを割り当てることができます。グループのミドルウェアは、グループ内の個々のルートに適用されるミドルウェアよりも先に実行されます。

ネストされたグループの場合、もっとも外側のグループのミドルウェアが最初に実行されます。つまり、グループのミドルウェアはルートのミドルウェアスタックに先行します。

参照：[ミドルウェアガイド](./middleware.md)も参照してください。

```ts
router
  .group(() => {
    router
      .get('posts', () => {})
      .use((_, next) => {
        console.log('ルートミドルウェアからのログ')
        return next()
      })
  })
  .use((_, next) => {
    console.log('グループミドルウェアからのログ')
    return next()
  })
```

## 特定のドメインに対してルートを登録する

AdonisJSでは、特定のドメイン名の下にルートを登録できます。これは、アプリケーションが複数のドメインにマップされ、各ドメインに異なるルートが必要な場合に便利です。

次の例では、2つのセットのルートを定義しています。

- 任意のドメイン/ホスト名に対して解決されるルート。
- ドメイン/ホスト名が事前に定義されたドメイン名の値と一致する場合に一致するルート。

```ts
router.group(() => {
  router.get('/users', () => {})
  router.get('/payments', () => {})
})

router.group(() => {
  router.get('/articles', () => {})
  router.get('/articles/:id', () => {})
}).domain('blog.adonisjs.com')
```

アプリケーションをデプロイすると、明示的なドメインを持つグループ内のルートは、リクエストのホスト名が `blog.adonisjs.com` の場合にのみ一致します。

### ダイナミックなサブドメイン

`group.domain`メソッドを使用して、ダイナミックなサブドメインを指定できます。ルートパラメータと同様に、ドメインのダイナミックセグメントはコロン `:` で始まります。

次の例では、`tenant`セグメントが任意のサブドメインを受け入れるように定義されており、`HttpContext.subdomains`オブジェクトを使用してその値にアクセスできます。

```ts
router
 .group(() => {
   router.get('users', ({ subdomains }) => {
     return `${subdomains.tenant}のユーザーをリスト表示しています。`
   })
 })
 .domain(':tenant.adonisjs.com')
```

## ルートからビューをレンダリングする

ルートハンドラがビューをレンダリングするだけの場合、`router.on.render`メソッドを使用できます。これは、明示的なハンドラを定義せずにビューをレンダリングするための便利なショートカットです。

レンダリングメソッドは、レンダリングするエッジテンプレートの名前を受け入れます。オプションでテンプレートデータを第二引数として渡すこともできます。

:::warning

`route.on.render`メソッドは、[Edgeサービスプロバイダ](../views-and-templates/introduction.md#using-edge)を設定している場合にのみ存在します。

:::

```ts
import router from '@adonisjs/core/services/router'

router.on('/').render('home')
router.on('about').render('about', { title: 'About us' })
router.on('contact').render('contact', { title: 'Contact us' })
```

## ルートからリダイレクトする

リクエストを別のパスやルートにリダイレクトするためのルートハンドラを定義する場合、`router.on.redirect`または`router.on.redirectToPath`メソッドを使用できます。

`redirect`メソッドはルート識別子を受け入れます。一方、`redirectToPath`メソッドは静的なパス/URLを受け入れます。

```ts
import router from '@adonisjs/core/services/router'

// ルートにリダイレクト
router.on('/posts').redirect('/articles')

// URLにリダイレクト
router.on('/posts').redirectToPath('https://medium.com/my-blog')
```

### パラメータの転送

次の例では、元のリクエストの`id`の値を使用して`/articles/:id`ルートを構築します。したがって、`/posts/20`のリクエストは`/articles/20`にリダイレクトされます。

```ts
import router from '@adonisjs/core/services/router'

router.on('/posts/:id').redirect('/articles/:id')
```

### パラメータを明示的に指定する

第二引数としてルートパラメータを明示的に指定することもできます。この場合、現在のリクエストのパラメータは無視されます。

```ts
import router from '@adonisjs/core/services/router'

// 常に/ articles / 1にリダイレクトする
router.on('/posts/:id').redirect('/articles/:id', {
  id: 1
})
```

### クエリ文字列を含める

リダイレクトURLのクエリ文字列は、オプションオブジェクト内で定義できます。

```ts
import router from '@adonisjs/core/services/router'

router.on('/posts').redirect('/articles', {
  qs: {
    limit: 20,
    page: 1,
  }  
})
```

## 現在のリクエストのルート

現在のリクエストのルートは、[`HttpContext.route`](../concepts/http_context.md#http-context-properties)プロパティを使用してアクセスできます。これには、**ルートパターン**、**名前**、**ミドルウェアストアへの参照**、および**ルートハンドラへの参照**が含まれます。

```ts
router.get('payments', ({ route }) => {
  console.log(route)
})
```

また、`request.matchesRoute`メソッドを使用して、現在のリクエストが特定のルートかどうかを確認することもできます。メソッドはルートURIパターンまたはルート名を受け入れます。

```ts
router.get('/posts/:id', ({ request }) => {
  if (request.matchesRoute('/posts/:id')) {
  }
})
```

```ts
router
  .get('/posts/:id', ({ request }) => {
    if (request.matchesRoute('posts.show')) {
    }
  })
  .as('posts.show')
```

複数のルートに一致することもできます。メソッドは最初に一致した場合にtrueを返します。

```ts
if (request.matchesRoute(['/posts/:id', '/posts/:id/comments'])) {
  // 何かを実行する
}
```

## AdonisJSのルートのマッチング方法

ルートは、ルートファイル内で登録された順序で一致します。一致は、一番上のルートから開始し、最初に一致したルートで停止します。

似たような2つのルートがある場合、もっとも具体的なルートを最初に登録する必要があります。

次の例では、URL `/posts/archived` のリクエストは、最初のルート（つまり `/posts/:id`）で処理されます。なぜなら、動的パラメータ `id` が `archived` の値をキャプチャするからです。

```ts
import router from '@adonisjs/core/services/router'

router.get('posts/:id', () => {})
router.get('posts/archived', () => {})
```

この動作は、もっとも具体的なルートを動的パラメータを持つルートの前に配置することで修正できます。

```ts
router.get('posts/archived', () => {})
router.get('posts/:id', () => {})
```


### 404リクエストの処理

AdonisJSは、現在のリクエストのURLに一致するルートが見つからない場合、404の例外を発生させます。

ユーザーに404ページを表示するには、[グローバル例外ハンドラ](./exception_handling.md)で`E_ROUTE_NOT_FOUND`例外をキャッチし、テンプレートをレンダリングできます。

```ts
import { errors } from '@adonisjs/core'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof errors.E_ROUTE_NOT_FOUND) {
      return ctx.view.render('errors/404')
    }
    
    return super.handle(error, ctx)
  }
}
```

## URLビルダー

アプリケーション内の事前定義されたルートのURLを作成するために、URLビルダーを使用できます。たとえば、Edgeテンプレート内のフォームアクションURLを作成したり、リクエストを別のルートにリダイレクトするためのURLを作成したりできます。

`router.builder`メソッドは、[URLビルダー](https://github.com/adonisjs/http-server/blob/main/src/router/lookup_store/url_builder.ts)クラスのインスタンスを作成し、ビルダーのフルエントAPIを使用してルートを検索し、URLを作成できます。

```ts
import router from '@adonisjs/core/services/router'
const PostsController = () => import('#controllers/posts_controller')

router
  .get('posts/:id', [PostsController, 'show'])
  .as('posts.show')
```

`posts.show`ルートのURLを生成するには、次のようにします。

```ts
import router from '@adonisjs/core/services/router'

router
  .builder()
  .params([1])
  .make('posts.show') // /posts/1

router
 .builder()
 .params([20])
 .make('posts.show') // /posts/20
```

パラメータは、位置引数の配列として指定することも、キーと値のペアとして定義することもできます。

```ts
router
 .builder()
 .params({ id: 1 })
 .make('posts.show') // /posts/1
```

### クエリパラメータの定義

クエリパラメータは、`builder.qs`メソッドを使用して定義できます。メソッドはキーと値のペアのオブジェクトを受け入れ、それをクエリ文字列にシリアライズします。

```ts
router
  .builder()
  .qs({ page: 1, sort: 'asc' })
  .make('posts.index') // /posts?page=1&sort=asc
```

クエリ文字列は、[qs](https://www.npmjs.com/package/qs) npmパッケージを使用してシリアライズされます。`config/app.ts`ファイルの`http`オブジェクトの下にある`qs`を[設定](https://github.com/adonisjs/http-server/blob/main/src/define_config.ts#L49-L54)することができます。

```ts
// config/app.js
http: defineConfig({
  qs: {
    stringify: {
      // 
    }
  }
})
```

### URLのプレフィックス

`builder.prefixUrl`メソッドを使用して、出力にベースURLをプレフィックスすることができます。

```ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 1 })
  .make('posts.show')
```

### 署名付きURLの生成

署名付きURLは、署名クエリ文字列が追加されたURLです。署名は、URLが生成された後に改ざんされていないかを検証するために使用されます。

たとえば、ニュースレターからユーザーの登録解除のためのURLを持っているとします。URLには`userId`が含まれており、次のようになるかもしれません。

```
/unsubscribe/231
```

ユーザーが`231`のユーザーIDを別の値に変更することを防ぐために、このURLに署名を付け、リクエストを処理する際に署名を検証することができます。

```ts
router.get('unsubscribe/:id', ({ request, response }) => {
  if (!request.hasValidSignature()) {
    return response.badRequest('無効または期限切れのURLです')
  }
  
  // 登録解除
}).as('unsubscribe')
```

`makeSigned`メソッドを使用して署名付きURLを作成できます。

```ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 231 })
  // ハイライト開始
  .makeSigned('unsubscribe')
  // ハイライト終了
```

#### 署名付きURLの有効期限

`expiresIn`オプションを使用して、指定された期間後に期限切れになる署名付きURLを生成することができます。値はミリ秒単位の数値または時間表現文字列で指定できます。

```ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 231 })
  // ハイライト開始
  .makeSigned('unsubscribe', {
    expiresIn: '3 days'
  })
  // ハイライト終了
```

### ルートの検索を無効にする

URLビルダーは、`make`および`makeSigned`メソッドに与えられたルート識別子でルートの検索を実行します。

AdonisJSアプリケーションの外部で定義されたルートのURLを作成する場合は、ルートの検索を無効にし、`make`および`makeSigned`メソッドにルートパターンを指定することができます。

```ts
router
  .builder()
  .prefixUrl('https://your-app.com')
  .disableRouteLookup()
  .params({ token: 'foobar' })
  .make('/email/verify/:token') // /email/verify/foobar
```

### ドメインの下のルートのURLを作成する
特定のドメインに登録されたルートのURLを作成するには、`router.builderForDomain`メソッドを使用できます。このメソッドは、ルートを定義する際に使用したルートパターンを受け入れます。

```ts
import router from '@adonisjs/core/services/router'
const PostsController = () => import('#controllers/posts_controller')

router.group(() => {
  router
    .get('/posts/:id', [PostsController, 'show'])
    .as('posts.show')
}).domain('blog.adonisjs.com')
```

次のようにして、`blog.adonisjs.com`ドメインの`posts.show`ルートのURLを作成できます。

```ts
router
  .builderForDomain('blog.adonisjs.com')
  .params({ id: 1 })
  .make('posts.show')
```

### テンプレート内でのURLの生成

テンプレート内でURLを生成するためには、`route`メソッドと`signedRoute`メソッドを使用できます。これには、URLビルダーを使用してURLを生成するための便利なヘルパーメソッドが含まれます。

参照：[Edgeヘルパーリファレンス](../references/edge.md#routesignedroute)も参照してください。

```edge
<a href="{{ route('posts.show', [post.id]) }}">
  投稿を表示する
</a>
```

```edge
<a href="{{
  signedRoute('unsubscribe', [user.id], {
    expiresIn: '3 days',
    prefixUrl: 'https://blog.adonisjs.com'    
  })
}}">
  登録解除
</a>
```

## ルーターの拡張

マクロとゲッターを使用して、さまざまなルータークラスにカスタムプロパティを追加することができます。マクロの概念については、[AdonisJSの拡張ガイド](../concepts/extending_the_framework.md)を先に読んでください。

以下は、拡張できるクラスのリストです。

### Router

[Routerクラス](https://github.com/adonisjs/http-server/blob/main/src/router/main.ts)には、ルート、ルートグループ、またはルートリソースを作成するためのトップレベルのメソッドが含まれています。このクラスのインスタンスは、ルーターサービスを介して利用可能になります。

```ts
import { Router } from '@adonisjs/core/http'

Router.macro('property', function (this: Router) {
  return value
})
Router.getter('propertyName', function (this: Router) {
  return value
})
```

```ts
declare module '@adonisjs/core/http' {
  export interface Router {
    property: valueType
  }
}
```

### Route

[Routeクラス](https://github.com/adonisjs/http-server/blob/main/src/router/route.ts)は、単一のルートを表します。Routeクラスのインスタンスは、`router.get`、`router.post`などのメソッドを呼び出すと作成されます。

```ts
import { Route } from '@adonisjs/core/http'

Route.macro('property', function (this: Route) {
  return value
})
Router.getter('property', function (this: Route) {
  return value
})
```

```ts
declare module '@adonisjs/core/http' {
  export interface Route {
    property: valueType
  }
}
```

### RouteGroup

[RouteGroupクラス](https://github.com/adonisjs/http-server/blob/main/src/router/group.ts)は、複数のルートのグループを表します。`router.group`メソッドを呼び出すと、RouteGroupクラスのインスタンスが作成されます。

マクロまたはゲッターの実装内で、`this.routes`プロパティを使用してグループのルートにアクセスできます。

```ts
import { RouteGroup } from '@adonisjs/core/http'

RouteGroup.macro('property', function (this: RouteGroup) {
  return value
})
RouteGroup.getter('property', function (this: RouteGroup) {
  return value
})
```

```ts
declare module '@adonisjs/core/http' {
  export interface RouteGroup {
    property: valueType
  }
}
```

### RouteResource

[RouteResourceクラス](https://github.com/adonisjs/http-server/blob/main/src/router/resource.ts)は、リソースの複数のルートのグループを表します。`router.resource`メソッドを呼び出すと、RouteResourceクラスのインスタンスが作成されます。

マクロまたはゲッターの実装内で、`this.routes`プロパティを使用してリソースのルートにアクセスできます。

```ts
import { RouteResource } from '@adonisjs/core/http'

RouteResource.macro('property', function (this: RouteResource) {
  return value
})
RouteResource.getter('property', function (this: RouteResource) {
  return value
})
```

```ts
declare module '@adonisjs/core/http' {
  export interface RouteResource {
    property: valueType
  }
}
```

### BriskRoute

[BriskRouteクラス](https://github.com/adonisjs/http-server/blob/main/src/router/brisk.ts)は、明示的なハンドラを持たないルートを表します。`router.on`メソッドを呼び出すと、BriskRouteクラスのインスタンスが作成されます。

マクロまたはゲッターの実装内で、`this.setHandler`メソッドを呼び出してルートハンドラを割り当てることができます。

```ts
import { BriskRoute } from '@adonisjs/core/http'

BriskRoute.macro('property', function (this: BriskRoute) {
  return value
})
BriskRouter.getter('property', function (this: BriskRoute) {
  return value
})
```

```ts
declare module '@adonisjs/core/http' {
  export interface BriskRoute {
    property: valueType
  }
}
```
