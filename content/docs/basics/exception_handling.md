---
summary: 例外はHTTPリクエストのライフサイクル中に発生するエラーです。AdonisJSは、例外をHTTPレスポンスに変換し、ロガーに報告するための堅牢な例外処理メカニズムを提供しています。
---

# 例外処理

HTTPリクエスト中に発生した例外は、`./app/exceptions/handler.ts`ファイル内で定義された`HttpExceptionHandler`によって処理されます。このファイル内では、例外をレスポンスに変換し、ロガーを使用してログに記録するか、外部のログプロバイダに報告する方法を決定できます。

`HttpExceptionHandler`は[ExceptionHandler](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts)クラスを拡張しており、エラーの処理とレンダリングの振る舞いを調整するための高レベルのAPIを提供しています。

```ts
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
```

## サーバーにエラーハンドラを割り当てる

エラーハンドラは、AdonisJSのHTTPサーバーに`start/kernel.ts`ファイル内で登録されます。`package.json`ファイルで定義された`#exceptions`エイリアスを使用して、HTTPハンドラを遅延読み込みしています。

```ts
server.errorHandler(() => import('#exceptions/handler'))
```

## 例外の処理

例外は例外ハンドラクラスの`handle`メソッドによって処理されます。デフォルトでは、エラーの処理中には次のステップが実行されます。

- エラーインスタンスに`handle`メソッドがあるかどうかをチェックします。ある場合は、[error.handle](#handle%E3%83%A1%E3%82%BD%E3%83%83%E3%83%89%E3%81%AE%E5%AE%9A%E7%BE%A9)メソッドを呼び出してそのレスポンスを返します。
- `error.status`コードに対してステータスページが定義されているかどうかをチェックします。ある場合は、ステータスページをレンダリングします。
- それ以外の場合は、コンテンツネゴシエーションレンダラを使用して例外をレンダリングします。

特定の例外を異なる方法で処理したい場合は、`handle`メソッド内でそれを行うことができます。ただし、`handle`メソッドの戻り値は破棄されるため、レスポンスを送信するために`ctx.response.send`メソッドを使用することを確認してください。

```ts
import { errors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      ctx.response.status(422).send(error.messages)
      return
    }

    return super.handle(error, ctx)
  }
}
```

### ステータスページ

ステータスページは、特定のステータスコードまたはステータスコードの範囲に対してレンダリングするテンプレートのコレクションです。

ステータスコードの範囲は文字列式で定義できます。開始と終了のステータスコードは2つのドット（`..`）で区切られます。

JSONサーバーを作成している場合は、ステータスページは必要ありません。

```ts
import { StatusPageRange, StatusPageRenderer } from '@adonisjs/http-server/types'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { view }) => view.render('errors/not-found'),
    '500..599': (_, { view }) => view.render('errors/server-error')
  }
}
```

### デバッグモード

コンテンツネゴシエーションレンダラは、自己処理されずステータスページに変換されない例外を処理します。

コンテンツネゴシエーションレンダラはデバッグモードをサポートしています。[Youch](https://www.npmjs.com/package/youch) npmパッケージを使用して、デバッグモードでエラーを解析し、きれいに表示できます。

デバッグモードは、例外ハンドラクラスの`debug`プロパティを使用して切り替えることができます。ただし、本番環境ではデバッグモードをオフにすることをオススメします。なぜなら、アプリに関する機密情報が公開されるためです。

```ts
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
}
```

## 例外の報告

例外ハンドラクラスの`report`メソッドは、例外の報告を処理します。

このメソッドは、最初の引数としてエラー、2番目の引数として[HTTPコンテキスト](../concepts/http_context.md)を受け取ります。`report`メソッドからレスポンスを書き込むことはせず、リクエスト情報を読み取るためにコンテキストのみを使用するようにしてください。

### 例外のログ記録

デフォルトでは、すべての例外は[ロガー](../digging_deeper/logger.md)を使用して報告されます。

- `400..499`のステータスコードを持つ例外は`warning`レベルでログに記録されます。
- `500`以上のステータスコードを持つ例外は`error`レベルでログに記録されます。
- その他のすべての例外は`info`レベルでログに記録されます。

`context`メソッドからオブジェクトを返すことで、ログメッセージにカスタムプロパティを追加できます。

```ts
export default class HttpExceptionHandler extends ExceptionHandler {
  protected context(ctx: HttpContext) {
    return {
      requestId: ctx.requestId,
      userId: ctx.auth.user?.id,
      ip: ctx.request.ip(),
    }
  }
}
```

### ステータスコードの無視

`ignoreStatuses`プロパティを使用して、報告を無視するステータスコードの配列を定義できます。

```ts
export default class HttpExceptionHandler extends ExceptionHandler {
  protected ignoreStatuses = [
    401,
    400,
    422,
    403,
  ]
}
```

### エラーの無視

`ignoreCodes`プロパティを使用して、無視するエラーコードまたはエラークラスの配列を定義することもできます。

```ts
import { errors } from '@adonisjs/core'
import { errors as sessionErrors } from '@adonisjs/session'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected ignoreCodes = [
    'E_ROUTE_NOT_FOUND',
    'E_INVALID_SESSION'
  ]
}
```

`ignoreExceptions`プロパティを使用して、例外クラスの配列を無視することもできます。

```ts
import { errors } from '@adonisjs/core'
import { errors as sessionErrors } from '@adonisjs/session'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected ignoreExceptions = [
    errors.E_ROUTE_NOT_FOUND,
    sessionErrors.E_INVALID_SESSION,
  ]
}
```

### カスタムな`shouldReport`メソッド

例外を無視するためのロジックは、[`shouldReport`メソッド](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts#L155)内に記述されています。必要に応じて、このメソッドをオーバーライドして、例外を無視するためのカスタムロジックを定義できます。

```ts
import { HttpError } from '@adonisjs/core/types/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected shouldReport(error: HttpError) {
    // booleanを返す
  }
}
```

## カスタム例外

`make:exception`エースコマンドを使用して、例外クラスを作成できます。例外は`@adonisjs/core`パッケージの`Exception`クラスを拡張します。

参照: [例外の作成コマンド](../references/commands.md#makeexception)

```sh
node ace make:exception UnAuthorized
```

```ts
import { Exception } from '@adonisjs/core/exceptions'

export default class UnAuthorizedException extends Exception {}
```

例外のインスタンスを作成することで例外を発生させることができます。例外を発生させる際に、カスタムの**エラーコード**と**ステータスコード**を例外に割り当てることができます。

```ts
import UnAuthorizedException from '#exceptions/unauthorized_exception'

throw new UnAuthorizedException('You are not authorized', {
  status: 403,
  code: 'E_UNAUTHORIZED'
})
```

エラーコードとステータスコードは、例外クラス上の静的プロパティとしても定義できます。例外をスローする際にカスタムの値が定義されていない場合は、静的な値が使用されます。

```ts
import { Exception } from '@adonisjs/core/exceptions'
export default class UnAuthorizedException extends Exception {
  static status = 403
  static code = 'E_UNAUTHORIZED'
}
```

### `handle`メソッドの定義

例外を自己処理するためには、例外クラス上に`handle`メソッドを定義できます。このメソッドは、`ctx.response.send`メソッドを使用してエラーをHTTPレスポンスに変換する必要があります。

`error.handle`メソッドは、最初の引数としてエラーのインスタンス、2番目の引数としてHTTPコンテキストを受け取ります。

```ts
import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class UnAuthorizedException extends Exception {
  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send(error.message)
  }
}
```

### `report`メソッドの定義

例外の報告を自己処理するためには、例外クラス上に`report`メソッドを実装できます。`report`メソッドは、最初の引数としてエラーのインスタンス、2番目の引数としてHTTPコンテキストを受け取ります。

```ts
import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class UnAuthorizedException extends Exception {
  async report(error: this, ctx: HttpContext) {
    ctx.logger.error({ err: error }, error.message)
  }
}
```

## エラータイプの絞り込み
フレームワークのコアおよびその他の公式パッケージは、それらによって発生する例外をエクスポートしています。`instanceof`チェックを使用して、エラーが特定の例外のインスタンスであるかどうかを確認できます。例:

```ts
import { errors } from '@adonisjs/core'

try {
  router.builder().make('articles.index')
} catch (error: unknown) {
  if (error instanceof errors.E_CANNOT_LOOKUP_ROUTE) {
    // エラーを処理する
  }
}
```

## 既知のエラー
既知のエラーのリストについては、[例外リファレンスガイド](../references/exceptions.md)を参照してください。
