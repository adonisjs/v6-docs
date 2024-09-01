---
summary: AdonisJSでのHTTPコンテキストについて学び、ルートハンドラ、ミドルウェア、例外ハンドラからアクセスする方法を学びます。
---

# HTTPコンテキスト

[HTTPコンテキストクラス](https://github.com/adonisjs/http-server/blob/main/src/http_context/main.ts)の新しいインスタンスは、各HTTPリクエストごとに生成され、ルートハンドラ、ミドルウェア、例外ハンドラに渡されます。

HTTPコンテキストには、HTTPリクエストに関連するすべての情報にアクセスできます。例えば：

- [ctx.request](../basics/request.md)プロパティを使用して、リクエストボディ、ヘッダー、クエリパラメータにアクセスできます。
- [ctx.response](../basics/response.md)プロパティを使用して、HTTPリクエストに応答できます。
- [ctx.auth](../authentication/introduction.md)プロパティを使用して、ログインしているユーザーにアクセスできます。
- [ctx.bouncer](../security/authorization.md)プロパティを使用して、ユーザーアクションを承認できます。
- などなど。

要するに、コンテキストは進行中のリクエストのための情報を保持するリクエスト固有のストアです。

## HTTPコンテキストへのアクセス方法

HTTPコンテキストは、ルートハンドラ、ミドルウェア、例外ハンドラに参照として渡され、次のようにアクセスできます。

### ルートハンドラ

[ルーターハンドラ](../basics/routing.md)は、HTTPコンテキストを最初のパラメータとして受け取ります。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', (ctx) => {
  console.log(ctx.inspect())
})
```

```ts
// title: プロパティの分割代入
import router from '@adonisjs/core/services/router'

router.get('/', ({ request, response }) => {
  console.log(request.url())
  console.log(request.headers())
  console.log(request.qs())
  console.log(request.body())
  
  response.send('hello world')
  response.send({ hello: 'world' })
})
```

### コントローラメソッド

[コントローラメソッド](../basics/controllers.md)（ルーターハンドラと似ています）は、HTTPコンテキストを最初のパラメータとして受け取ります。

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ request, response }: HttpContext) {
  }
}
```

### ミドルウェアクラス

[ミドルウェアクラス](../basics/middleware.md)の`handle`メソッドは、HTTPコンテキストを最初のパラメータとして受け取ります。

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class AuthMiddleware {
  async handle({ request, response }: HttpContext) {
  }
}
```

### 例外ハンドラクラス

[グローバル例外ハンドラ](../basics/exception_handling.md)クラスの`handle`メソッドと`report`メソッドは、HTTPコンテキストを2番目のパラメータとして受け取ります。最初のパラメータは`error`プロパティです。

```ts
import {
  HttpContext,
  HttpExceptionHandler
} from '@adonisjs/core/http'

export default class ExceptionHandler extends HttpExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
```

## 依存性の注入を使用してHTTPコンテキストを注入する

アプリケーション全体で依存性の注入を使用する場合、`HttpContext`クラスを型ヒントとしてクラスやメソッドに注入することで、HTTPコンテキストを注入できます。

:::warning

`kernel/start.ts`ファイル内で`#middleware/container_bindings_middleware`ミドルウェアが登録されていることを確認してください。このミドルウェアは、コンテナからリクエスト固有の値（つまり、HttpContextクラス）を解決するために必要です。

:::

参照：[IoCコンテナガイド](../concepts/dependency_injection.md)

```ts
// title: app/services/user_service.ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UserService {
  constructor(protected ctx: HttpContext) {}
  
  all() {
    // メソッドの実装
  }
}
```

自動的な依存関係の解決が機能するためには、コントローラ内で`UserService`をインジェクトする必要があります。覚えておいてください、コントローラメソッドの最初の引数は常にコンテキストであり、残りの引数はIoCコンテナを使用して注入されます。

```ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'

export default class UsersController {
  @inject()
  index(ctx: HttpContext, userService: UserService) {
    return userService.all()
  }
}
```

以上です！`UserService`は今や自動的に進行中のHTTPリクエストのインスタンスを受け取るようになりました。同じプロセスをネストされた依存関係に対しても繰り返すことができます。

## アプリケーション内のどこからでもHTTPコンテキストにアクセスする

依存性の注入は、クラスのコンストラクタやメソッドの依存関係としてHTTPコンテキストを受け入れ、コンテナに解決させる方法の1つです。

ただし、アプリケーションを再構築して依存性の注入を使用することは必須ではありません。Node.jsが提供する[Asyncローカルストレージ](https://nodejs.org/dist/latest-v21.x/docs/api/async_context.html#class-asynclocalstorage)を使用して、アプリケーション内のどこからでもHTTPコンテキストにアクセスすることもできます。

Asyncローカルストレージの動作方法とAdonisJSがHTTPコンテキストへのグローバルアクセスを提供するためにそれを使用する方法については、[専用のガイド](./async_local_storage.md)を参照してください。

次の例では、`UserService`クラスは`HttpContext.getOrFail`メソッドを使用して、進行中のリクエストのHTTPコンテキストインスタンスを取得しています。

```ts
// title: app/services/user_service.ts
import { HttpContext } from '@adonisjs/core/http'

export default class UserService {
  all() {
    const ctx = HttpContext.getOrFail()
    console.log(ctx.request.url())
  }
}
```

次のコードブロックは、`UsersController`内で`UserService`クラスを使用する例を示しています。

```ts
import { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'

export default class UsersController {
  index(ctx: HttpContext) {
    const userService = new UserService()
    return userService.all()
  }
}
```

## HTTPコンテキストのプロパティ

以下は、HTTPコンテキストを介してアクセスできるプロパティのリストです。新しいパッケージをインストールすると、追加のプロパティがコンテキストに追加される場合があります。

<dl>
<dt>

ctx.request

</dt>

<dd>

[HTTPリクエストクラス](../basics/request.md)のインスタンスへの参照。

</dd>

<dt>

ctx.response

</dt>

<dd>

[HTTPレスポンスクラス](../basics/response.md)のインスタンスへの参照。

</dd>

<dt>

ctx.logger

</dt>

<dd>

HTTPリクエストごとに作成される[ロガー](../digging_deeper/logger.md)のインスタンスへの参照。

</dd>

<dt>

ctx.route

</dt>

<dd>

現在のHTTPリクエストにマッチしたルート。`route`プロパティは[StoreRouteNode](https://github.com/adonisjs/http-server/blob/main/src/types/route.ts#L69)型のオブジェクトです。

</dd>

<dt>

ctx.params

</dt>

<dd>

ルートパラメータのオブジェクト

</dd>

<dt>

ctx.subdomains

</dt>

<dd>

ルートが動的サブドメインの一部である場合にのみ存在するルートサブドメインのオブジェクト

</dd>

<dt>

ctx.session

</dt>

<dd>

現在のHTTPリクエストに作成された[セッション](../basics/session.md)のインスタンスへの参照。

</dd>

<dt>

ctx.auth

</dt>

<dd>

[Authenticatorクラス](https://github.com/adonisjs/auth/blob/main/src/authenticator.ts)のインスタンスへの参照。[認証](../authentication/introduction.md)について詳しくはこちらをご覧ください。

</dd>

<dt>

ctx.view

</dt>

<dd>

Edgeレンダラーのインスタンスへの参照。[ビューとテンプレートガイド](../views-and-templates/introduction.md#using-edge)でEdgeについて詳しく学びましょう。

</dd>

<dt>

ctx\.ally

</dt>

<dd>

アプリケーションでソーシャルログインを実装するための[Ally Managerクラス](https://github.com/adonisjs/ally/blob/main/src/ally_manager.ts)のインスタンスへの参照。[Ally](../authentication/social_authentication.md)について詳しくはこちらをご覧ください。

</dd>

<dt>

ctx.bouncer

</dt>

<dd>

[Bouncerクラス](https://github.com/adonisjs/bouncer/blob/main/src/bouncer.ts)のインスタンスへの参照。[認可](../security/authorization.md)について詳しくはこちらをご覧ください。

</dd>

<dt>

ctx.i18n

</dt>

<dd>

[I18nクラス](https://github.com/adonisjs/i18n/blob/main/src/i18n.ts)のインスタンスへの参照。[Internationalization](../digging_deeper/i18n.md)ガイドで`i18n`について詳しく学びましょう。

</dd>

</dl>


## HTTPコンテキストの拡張

マクロやゲッターを使用して、HTTPコンテキストクラスにカスタムプロパティを追加できます。マクロの概念については、[AdonisJSの拡張ガイド](./extending_the_framework.md)を読んでから進めるようにしてください。

```ts
import { HttpContext } from '@adonisjs/core/http'

HttpContext.macro('aMethod', function (this: HttpContext) {
  return value
})

HttpContext.getter('aProperty', function (this: HttpContext) {
  return value
})
```

マクロとゲッターは実行時に追加されるため、モジュール拡張を使用してその型をTypeScriptに伝える必要があります。

```ts
import { HttpContext } from '@adonisjs/core/http'

// insert-start
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    aMethod: () => ValueType
    aProperty: ValueType
  }
}
// insert-end

HttpContext.macro('aMethod', function (this: HttpContext) {
  return value
})

HttpContext.getter('aProperty', function (this: HttpContext) {
  return value
})
```

## テスト中にダミーコンテキストを作成する

テスト中にダミーのHTTPコンテキストを作成するには、`testUtils`サービスを使用できます。

コンテキストインスタンスはどのルートにも関連付けられていないため、`ctx.route`と`ctx.params`の値は未定義になります。ただし、テスト対象のコードで必要な場合は、これらのプロパティを手動で割り当てることもできます。

```ts
import testUtils from '@adonisjs/core/services/test_utils'

const ctx = testUtils.createHttpContext()
```

デフォルトでは、`createHttpContext`メソッドは`req`と`res`オブジェクトに対してダミーの値を使用します。ただし、次の例に示すように、これらのプロパティにカスタム値を定義することもできます。

```ts
import { createServer } from 'node:http'
import testUtils from '@adonisjs/core/services/test_utils'

createServer((req, res) => {
  const ctx = testUtils.createHttpContext({
    // highlight-start
    req,
    res
    // highlight-end
  })
})
```

### HttpContextファクトリの使用
`testUtils`サービスはAdonisJSアプリケーション内でのみ利用可能です。したがって、パッケージをビルドしてテスト中にダミーのHTTPコンテキストにアクセスする必要がある場合は、[HttpContextFactory](https://github.com/adonisjs/http-server/blob/main/factories/http_context.ts#L30)クラスを使用できます。

```ts
import { HttpContextFactory } from '@adonisjs/core/factories/http'
const ctx = new HttpContextFactory().create()
```
