---
summary: AdonisJSでミドルウェアについて学び、それらを作成し、ルートやルートグループに割り当てる方法を学びます。
---

# ミドルウェア

ミドルウェアは、HTTPリクエストがルートハンドラに到達する前に実行される一連の関数です。チェーン内の各関数はリクエストを終了させるか、次のミドルウェアに転送できます。

典型的なAdonisJSアプリケーションでは、**リクエストボディの解析**、**ユーザーセッションの管理**、**リクエストの認証**、**静的アセットの提供**などのためにミドルウェアが使用されます。

また、カスタムミドルウェアを作成してHTTPリクエスト中に追加のタスクを実行することもできます。

## ミドルウェアスタック

ミドルウェアパイプラインの実行をより制御するために、AdonisJSはミドルウェアスタックを次の3つのグループに分割しています。

### サーバーミドルウェアスタック

サーバーミドルウェアは、現在のリクエストのURLに対してルートが定義されていなくても、すべてのHTTPリクエストで実行されます。

これは、フレームワークのルーティングシステムに依存しないアプリケーションの追加機能を追加するために使用できます。たとえば、静的アセットミドルウェアはサーバーミドルウェアとして登録されています。

サーバーミドルウェアは、`start/kernel.ts`ファイル内の`serve.use`メソッドを使用して登録できます。

```ts
import server from '@adonisjs/core/services/server'

server.use([
  () => import('@adonisjs/static/static_middleware')
])
```

---

### ルーターミドルウェアスタック

ルーターミドルウェアは、一致するルートを持つすべてのHTTPリクエストで実行されるグローバルミドルウェアとしても知られています。

Bodyparser、auth、sessionミドルウェアは、ルーターミドルウェアスタックに登録されています。

ルーターミドルウェアは、`start/kernel.ts`ファイル内の`router.use`メソッドを使用して登録できます。

```ts
import router from '@adonisjs/core/services/router'

router.use([
  () => import('@adonisjs/core/bodyparser_middleware')
])
```

---

### 名前付きミドルウェアコレクション

名前付きミドルウェアは、ルートまたはグループに明示的に割り当てられない限り実行されないミドルウェアのコレクションです。

ルートファイル内でミドルウェアをインラインコールバックとして定義する代わりに、専用のミドルウェアクラスを作成し、名前付きミドルウェアコレクションに格納し、それをルートに割り当てることをオススメします。

名前付きミドルウェアは、`start/kernel.ts`ファイル内の`router.named`メソッドを使用して定義できます。名前付きコレクションを使用するためには、名前付きコレクションをエクスポートする必要があります [ルートファイル内で使用するため](#ミドルウェアのルートとルートグループへの割り当て)。

```ts
import router from '@adonisjs/core/services/router'

router.named({
  auth: () => import('#middleware/auth_middleware')
})
```

## ミドルウェアの作成

ミドルウェアは`./app/middleware`ディレクトリ内に格納され、`make:middleware`エースコマンドを実行して新しいミドルウェアファイルを作成できます。

参照: [ミドルウェア作成コマンド](../references/commands.md#makemiddleware)

```sh
node ace make:middleware user_location
```

上記のコマンドは、ミドルウェアディレクトリの下に`user_location_middleware.ts`ファイルを作成します。

ミドルウェアは`handle`メソッドを持つクラスとして表されます。実行中、AdonisJSは自動的にこのメソッドを呼び出し、最初の引数として[HttpContext](../concepts/http_context.md)を渡します。

```ts
// title: app/middleware/user_location_middleware.ts
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class UserLocationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
  }
}
```

ミドルウェア内の`handle`メソッドでは、リクエストの継続、レスポンスの送信、またはリクエストの中断のために例外を発生させるかを決定する必要があります。


### リクエストの中断

ミドルウェアが例外を発生させると、次のミドルウェアとルートハンドラは実行されず、例外はグローバルな例外ハンドラに渡されます。

```ts
import { Exception } from '@adonisjs/core/exceptions'
import { NextFn } from '@adonisjs/core/types/http'

export default class UserLocationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    throw new Exception('リクエストを中断します')
  }
}
```


### リクエストの継続

リクエストを継続するには、`next`メソッドを呼び出す必要があります。そうしないと、ミドルウェアスタック内の残りのアクションは実行されません。

```ts
export default class UserLocationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // `next`関数を呼び出して継続します
    await next()      
  }
}
```

### レスポンスを送信し、`next`メソッドを呼び出さない

最後に、レスポンスを送信してリクエストを終了することもできます。この場合、`next`メソッドを呼び出さないでください。

```ts
export default class UserLocationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // レスポンスを送信し、`next`を呼び出さない
    ctx.response.send('リクエストを終了します')
  }
}
```

## ミドルウェアのルートとルートグループへの割り当て

名前付きミドルウェアコレクションはデフォルトでは使用されず、明示的にルートまたはルートグループに割り当てる必要があります。

次の例では、`middleware`コレクションをインポートし、`userLocation`ミドルウェアをルートに割り当てています。

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .get('posts', () => {})
  .use(middleware.userLocation())
```

複数のミドルウェアは、配列として適用するか、`use`メソッドを複数回呼び出すことで適用できます。

```ts
router
  .get('posts', () => {})
  .use([
    middleware.userLocation(),
    middleware.auth()
  ])
```

同様に、ルートグループにもミドルウェアを割り当てることができます。グループミドルウェアは、グループ内のすべてのルートに自動的に適用されます。

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.group(() => {

  router.get('posts', () => {})
  router.get('users', () => {})
  router.get('payments', () => {})

}).use(middleware.userLocation())
```

## ミドルウェアのパラメータ

名前付きミドルウェアコレクションに登録されたミドルウェアは、`handle`メソッドの引数として追加のパラメータを受け入れることができます。たとえば、`auth`ミドルウェアは認証ガードを設定オプションとして受け入れます。

```ts
type AuthGuards = 'web' | 'api'

export default class AuthMiddleware {
  async handle(ctx, next, options: { guard: AuthGuards }) {
  }
}
```

ミドルウェアをルートに割り当てる際に、使用するガードを指定できます。

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.get('payments', () => {}).use(
  middleware.auth({ guard: 'web' })
)
```

## 依存性の注入

ミドルウェアクラスは[IoCコンテナ](../concepts/dependency_injection.md)を使用してインスタンス化されるため、ミドルウェアのコンストラクタ内で依存関係を型指定できます。コンテナは依存関係を自動的に注入します。

リクエストIPからユーザーの場所を検索するための`GeoIpService`クラスがある場合、`@inject`デコレータを使用してミドルウェアに注入できます。

```ts
// title: app/services/geoip_service.ts
export default class GeoIpService {
  async lookup(ipAddress: string) {
    // 場所を検索して返す
  }
}
```

```ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import GeoIpService from '#services/geoip_service'

@inject()
export default class UserLocationMiddleware {
  constructor(protected geoIpService: GeoIpService) {
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const ip = ctx.request.ip()
    ctx.location = await this.geoIpService.lookup(ip)
  }
}
```


## ミドルウェアの実行フロー

AdonisJSのミドルウェアレイヤーは、[責任連鎖](https://refactoring.guru/design-patterns/chain-of-responsibility)デザインパターンを基にして構築されています。ミドルウェアには2つの実行フェーズがあります: **ダウンストリームフェーズ**と**アップストリームフェーズ**。

- ダウンストリームフェーズは、`next`メソッドを呼び出す前に書かれたコードです。このフェーズでは、リクエストを処理します。
- アップストリームフェーズは、`next`メソッドを呼び出した後に書かれたコードです。このフェーズでは、レスポンスを検査したり、完全に変更したりできます。

![](./middleware_flow.jpeg)

## ミドルウェアと例外処理

ミドルウェアパイプラインまたはルートハンドラが例外を発生させた場合、AdonisJSは自動的に例外をHTTPレスポンスに変換し、[グローバルな例外ハンドラ](./exception_handling.md)を使用して返します。

そのため、`next`関数の呼び出しを`try/catch`ステートメントでラップする必要はありません。また、自動的な例外処理により、`next`関数呼び出し後にアップストリームのロジックが常に実行されることが保証されます。

## ミドルウェアからのレスポンスの変更

ミドルウェアのアップストリームフェーズでは、レスポンスのボディ、ヘッダー、ステータスコードを変更できます。これにより、ルートハンドラや他のミドルウェアによって設定された古いレスポンスが破棄されます。

レスポンスを変更する前に、正しいレスポンスタイプを扱っていることを確認してください。以下は、`Response`クラスのレスポンスタイプのリストです。

- **標準レスポンス**は、`response.send`メソッドを使用してデータ値を送信することを意味します。値は`Array`、`Object`、`String`、`Boolean`、または`Buffer`のいずれかです。
- **ストリーミングレスポンス**は、`response.stream`メソッドを使用してストリームをレスポンスソケットにパイプすることを意味します。
- **ファイルダウンロードレスポンス**は、`response.download`メソッドを使用してファイルをダウンロードすることを意味します。

特定のレスポンスに基づいて、特定のレスポンスプロパティにアクセスできる/できない場合があります。

### 標準レスポンスの扱い

標準レスポンスを変更する場合は、`response.content`プロパティを使用してアクセスできます。まず、`content`が存在するかどうかを確認してください。

```ts
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class {
  async handle({ response }: HttpContext, next: NextFn) {
    await next()
    
    if (response.hasContent) {
      console.log(response.content)
      console.log(typeof response.content)
      
      response.send(newResponse)
    }
  }
}
```

### ストリーミングレスポンスの扱い

`response.stream`メソッドを使用して設定されたレスポンスストリームは、直ちにアウトゴーイング[HTTPレスポンス](https://nodejs.org/api/http.html#class-httpserverresponse)にパイプされません。代わりに、AdonisJSはルートハンドラとミドルウェアパイプラインの処理が完了するのを待ちます。

その結果、ミドルウェア内では、既存のストリームを新しいストリームで置き換えたり、ストリームを監視するためのイベントハンドラを定義したりできます。

```ts
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class {
  async handle({ response }: HttpContext, next: NextFn) {
    await next()
    
    if (response.hasStream) {
      response.outgoingStream.on('data', (chunk) => {
        console.log(chunk)
      })
    }
  }
}
```
### ファイルのダウンロード処理

`response.download`や`response.attachment`メソッドを使用して行われるファイルのダウンロード処理は、ルートハンドラとミドルウェアパイプラインが完了するまでダウンロード処理を遅延させます。

そのため、ミドルウェア内では、ダウンロードするファイルのパスを置き換えることができます。


```ts
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class {
  async handle({ response }: HttpContext, next: NextFn) {
    await next()
    
    if (response.hasFileToStream) {
      console.log(response.fileToStream.generateEtag)
      console.log(response.fileToStream.path)
    }
  }
}
```

## ミドルウェアクラスのテスト

ミドルウェアをクラスとして作成することで、ミドルウェアを独立してテストすることが容易になります（ミドルウェアの単体テスト）。ミドルウェアをテストするためには、いくつかの異なる方法があります。利用可能なすべてのオプションを見てみましょう。

もっとも簡単なオプションは、ミドルウェアクラスの新しいインスタンスを作成し、HTTPコンテキストと`next`コールバック関数を使用して`handle`メソッドを呼び出すことです。

```ts
import testUtils from '@adonisjs/core/services/test_utils'
import GeoIpService from '#services/geoip_service'
import UserLocationMiddleware from '#middleware/user_location_middleware'

const middleware = new UserLocationMiddleware(
  new GeoIpService()
)

const ctx = testUtils.createHttpContext()
await middleware.handle(ctx, () => {
  console.log('Next function invoked')
})
```

`testUtils`サービスは、AdonisJSアプリケーションが起動した後にのみ利用可能です。ただし、パッケージ内でミドルウェアをテストする場合は、`HttpContextFactory`クラスを使用してアプリケーションを起動せずにダミーのHTTPコンテキストインスタンスを作成できます。

実際の例として、[CORSミドルウェアのテスト](https://github.com/adonisjs/cors/blob/main/tests/cors_middleware.spec.ts#L24-L41)を参照してください。

```ts
import {
  RequestFactory,
  ResponseFactory,
  HttpContextFactory
} from '@adonisjs/core/factories/http'

const request = new RequestFactory().create()
const response = new ResponseFactory().create()
const ctx = new HttpContextFactory()
  .merge({ request, response })
  .create()

await middleware.handle(ctx, () => {
  console.log('Next function invoked')
})
```


### サーバーパイプラインの使用

もし、あなたのミドルウェアが他のミドルウェアが先に実行されることを前提としている場合、`server.pipeline`メソッドを使用してミドルウェアのパイプラインを作成できます。

- `server.pipeline`メソッドは、ミドルウェアクラスの配列を受け入れます。
- クラスのインスタンスは、IoCコンテナを使用して作成されます。
- 実行フローは、HTTPリクエスト中のミドルウェアの元の実行フローと同じです。

```ts
import testUtils from '@adonisjs/core/services/test_utils'
import server from '@adonisjs/core/services/server'
import UserLocationMiddleware from '#middleware/user_location_middleware'

const pipeline = server.pipeline([
  UserLocationMiddleware
])

const ctx = testUtils.createHttpContext()
await pipeline.run(ctx)
```

`pipeline.run`メソッドを呼び出す前に、`finalHandler`関数と`errorHandler`関数を定義できます。

- `finalHandler`は、すべてのミドルウェアが実行された後に実行されます。ただし、ミドルウェアのいずれかが`next`メソッドを呼び出さずにチェーンを終了した場合、`finalHandler`は実行されません。
- `errorHandler`は、ミドルウェアが例外を発生させた場合に実行されます。エラーハンドラが呼び出された後、アップストリームのフローが開始されます。

```ts
const ctx = testUtils.createHttpContext()

await pipeline
 .finalHandler(() => {
   console.log('all middleware called next')
   console.log('the upstream logic starts from here')
 })
 .errorHandler((error) => {
   console.log('an exception was raised')
   console.log('the upstream logic starts from here')
 })
 .run(ctx)
 
console.log('pipeline executed')
```

`server`サービスは、アプリケーションが起動した後に利用可能です。ただし、パッケージを作成している場合は、`ServerFactory`を使用してアプリケーションを起動せずにServerクラスのインスタンスを作成できます。

```ts
import { ServerFactory } from '@adonisjs/core/factories/http'

const server = new ServerFactory().create()
const pipeline = server.pipeline([
  UserLocationMiddleware
])
```
