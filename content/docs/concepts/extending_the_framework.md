---
summary: マクロとゲッターを使用してAdonisJSフレームワークを拡張する方法を学びます。
---

# フレームワークの拡張

AdonisJSのアーキテクチャは、フレームワークを拡張非常に簡単になっています。私たちは、フレームワークのコアAPIを使用して、第一級のパッケージのエコシステムを構築しています。

このガイドでは、パッケージまたはアプリケーションのコードベース内でフレームワークを拡張するために使用できるさまざまなAPIを探っていきます。

## マクロとゲッター

マクロとゲッターは、クラスのプロトタイプにプロパティを追加するためのAPIを提供します。これらは、`Object.defineProperty`のシンタックスシュガーと考えることができます。内部的には、[macroable](https://github.com/poppinss/macroable)パッケージを使用しており、詳細な技術的な説明については、そのREADMEを参照してください。

マクロとゲッターは実行時に追加されるため、追加されたプロパティの型情報をTypeScriptに伝えるために[declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)を使用する必要があります。

マクロを追加するためのコードは、専用のファイル（`extensions.ts`のような）に記述し、サービスプロバイダの`boot`メソッド内でそれをインポートできます。

```ts
// title: providers/app_provider.ts
export default class AppProvider {
  async boot() {
    await import('../src/extensions.js')
  }
}
```

次の例では、[Request](../basics/request.md)クラスに`wantsJSON`メソッドを追加し、同時にその型を定義しています。

```ts
// title: src/extensions.ts
import { Request } from '@adonisjs/core/http'

Request.macro('wantsJSON', function (this: Request) {
  const firstType = this.types()[0]
  if (!firstType) {
    return false
  }
  
  return firstType.includes('/json') || firstType.includes('+json')
})
```

```ts
// title: src/extensions.ts
declare module '@adonisjs/core/http' {
  interface Request {
    wantsJSON(): boolean
  }
}
```

- `declare module`の呼び出し時のモジュールパスは、クラスをインポートする際に使用するパスと同じである必要があります。
- `interface`の名前は、マクロまたはゲッターを追加するクラスの名前と同じである必要があります。

### ゲッター

ゲッターは、クラスに追加される遅延評価されるプロパティです。`Class.getter`メソッドを使用してゲッターを追加できます。第一引数はゲッターの名前であり、第二引数はプロパティの値を計算するためのコールバック関数です。

ゲッターのコールバック関数は非同期にすることはできません。なぜなら、JavaScriptの[getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)は非同期にできないからです。

```ts
import { Request } from '@adonisjs/core/http'

Request.getter('hasRequestId', function (this: Request) {
  return this.header('x-request-id')
})

// プロパティは次のように使用できます。
if (ctx.request.hasRequestId) {
}
```

ゲッターはシングルトンにすることもできます。つまり、ゲッターの値を計算する関数は一度だけ呼び出され、返り値はクラスのインスタンスごとにキャッシュされます。

```ts
const isSingleton = true

Request.getter('hasRequestId', function (this: Request) {
  return this.header('x-request-id')
}, isSingleton)
```

### マクロ可能なクラス

以下は、マクロとゲッターを使用して拡張できるクラスのリストです。

| クラス                                                                                         | インポートパス              |
|-----------------------------------------------------------------------------------------------|-----------------------------|
| [Application](https://github.com/adonisjs/application/blob/main/src/application.ts)            | `@adonisjs/core/app`        |
| [Request](https://github.com/adonisjs/http-server/blob/main/src/request.ts)                    | `@adonisjs/core/http`       |
| [Response](https://github.com/adonisjs/http-server/blob/main/src/response.ts)                  | `@adonisjs/core/http`       |
| [HttpContext](https://github.com/adonisjs/http-server/blob/main/src/http_context/main.ts)      | `@adonisjs/core/http`       |
| [Route](https://github.com/adonisjs/http-server/blob/main/src/router/route.ts)                 | `@adonisjs/core/http`       |
| [RouteGroup](https://github.com/adonisjs/http-server/blob/main/src/router/group.ts)            | `@adonisjs/core/http`       |
| [RouteResource](https://github.com/adonisjs/http-server/blob/main/src/router/resource.ts)      | `@adonisjs/core/http`       |
| [BriskRoute](https://github.com/adonisjs/http-server/blob/main/src/router/brisk.ts)            | `@adonisjs/core/http`       |
| [ExceptionHandler](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts) | `@adonisjs/core/http`       |
| [MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts)        | `@adonisjs/core/bodyparser` |


## モジュールの拡張
ほとんどのAdonisJSモジュールは、カスタムの実装を登録するための拡張可能なAPIを提供しています。以下は、同じものの集約されたリストです。

- [ハッシュドライバーの作成](../security/hashing.md#creating-a-custom-hash-driver)
- [セッションドライバーの作成](../basics/session.md#creating-a-custom-session-store)
- [ソーシャル認証ドライバーの作成](../authentication/social_authentication.md#creating-a-custom-social-driver)
- [REPLの拡張](../digging_deeper/repl.md#adding-custom-methods-to-repl)
- [i18nの翻訳ローダーの作成](../digging_deeper/i18n.md#creating-a-custom-translation-loader)
- [i18nの翻訳フォーマッターの作成](../digging_deeper/i18n.md#creating-a-custom-translation-formatter)
