---
summary: AdonisJSフレームワークコアと公式パッケージによって発生する例外について学びましょう。
---

# 例外リファレンス

このガイドでは、フレームワークコアと公式パッケージによって発生する既知の例外のリストを説明します。いくつかの例外は**自己処理**としてマークされています。[自己処理例外](../basics/exception_handling.md#defining-the-handle-method)は、HTTPレスポンスに自身を変換できます。

<div style="--prose-h2-font-size: 22px;">

## E_ROUTE_NOT_FOUND
この例外は、HTTPサーバーが存在しないルートに対するリクエストを受け取った場合に発生します。デフォルトでは、クライアントは404のレスポンスを受け取り、オプションで[ステータスページ](../basics/exception_handling.md#status-pages)をレンダリングすることもできます。

- **ステータスコード**: 404
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_ROUTE_NOT_FOUND) {
  // エラーを処理する
}
```

## E_AUTHORIZATION_FAILURE
この例外は、バウンサーの認証チェックが失敗した場合に発生します。この例外は自己処理であり、[コンテンツネゴシエーション](../security/authorization.md#throwing-authorizationexception)を使用してクライアントに適切なエラーレスポンスを返します。

- **ステータスコード**: 403
- **自己処理**: オススメ
- **翻訳識別子**: `errors.E_AUTHORIZATION_FAILURE`

```ts
import { errors as bouncerErrors } from '@adonisjs/bouncer'
if (error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE) {
}
```

## E_TOO_MANY_REQUESTS
この例外は、[@adonisjs/rate-limiter](../security/rate_limiting.md)パッケージが指定された期間内に許可されたリクエストを使い果たした場合に発生します。この例外は自己処理であり、[コンテンツネゴシエーション](../security/rate_limiting.md#handling-throttleexception)を使用してクライアントに適切なエラーレスポンスを返します。

- **ステータスコード**: 429
- **自己処理**: オススメ
- **翻訳識別子**: `errors.E_TOO_MANY_REQUESTS`

```ts
import { errors as limiterErrors } from '@adonisjs/limiter'
if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) {
}
```

## E_BAD_CSRF_TOKEN
この例外は、[CSRF保護](../security/securing_ssr_applications.md#csrf-protection)を使用しているフォームがCSRFトークンなしで送信された場合、またはCSRFトークンが無効な場合に発生します。

- **ステータスコード**: 403
- **自己処理**: オススメ
- **翻訳識別子**: `errors.E_BAD_CSRF_TOKEN`

```ts
import { errors as shieldErrors } from '@adonisjs/shield'
if (error instanceof shieldErrors.E_BAD_CSRF_TOKEN) {
}
```

`E_BAD_CSRF_TOKEN`例外は[自己処理](https://github.com/adonisjs/shield/blob/main/src/errors.ts#L20)され、ユーザーはフォームにリダイレクトされ、フラッシュメッセージを使用してエラーにアクセスできます。

```edge
@error('E_BAD_CSRF_TOKEN')
  <p>{{ message }}</p>
@end
```

## E_OAUTH_MISSING_CODE
`@adonisjs/ally`パッケージは、OAuthサービスがリダイレクト時にOAuthコードを提供しない場合にこの例外を発生させます。

`.accessToken`または`.user`メソッドを呼び出す前に、[エラーを処理](../authentication/social_authentication.md#handling-callback-response)することで、この例外を回避できます。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors as allyErrors } from '@adonisjs/bouncer'
if (error instanceof allyErrors.E_OAUTH_MISSING_CODE) {
}
```

## E_OAUTH_STATE_MISMATCH
`@adonisjs/ally`パッケージは、リダイレクト時に定義されたCSRFステートが欠落している場合にこの例外を発生させます。

`.accessToken`または`.user`メソッドを呼び出す前に、[エラーを処理](../authentication/social_authentication.md#handling-callback-response)することで、この例外を回避できます。

- **ステータスコード**: 400
- **自己処理**: できます。

```ts
import { errors as allyErrors } from '@adonisjs/bouncer'
if (error instanceof allyErrors.E_OAUTH_STATE_MISMATCH) {
}
```

## E_UNAUTHORIZED_ACCESS
この例外は、認証ガードのいずれかがリクエストを認証できない場合に発生します。この例外は自己処理であり、[コンテンツネゴシエーション](../authentication/session_guard.md#handling-authentication-exception)を使用してクライアントに適切なエラーレスポンスを返します。

- **ステータスコード**: 401
- **自己処理**: オススメ
- **翻訳識別子**: `errors.E_UNAUTHORIZED_ACCESS`

```ts
import { errors as authErrors } from '@adonisjs/auth'
if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
}
```

## E_INVALID_CREDENTIALS
この例外は、認証ファインダーがユーザーの資格情報を検証できない場合に発生します。この例外は処理され、[コンテンツネゴシエーション](../authentication/verifying_user_credentials.md#handling-exceptions)を使用してクライアントに適切なエラーレスポンスを返します。

- **ステータスコード**: 400
- **自己処理**: オススメ
- **翻訳識別子**: `errors.E_INVALID_CREDENTIALS`

```ts
import { errors as authErrors } from '@adonisjs/auth'
if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
}
```

## E_CANNOT_LOOKUP_ROUTE
この例外は、[URLビルダー](../basics/routing.md#url-builder)を使用してルートのURLを作成しようとした場合に発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_CANNOT_LOOKUP_ROUTE) {
  // エラーを処理する
}
```

## E_HTTP_EXCEPTION
`E_HTTP_EXCEPTION`は、HTTPリクエスト中にエラーをスローするための汎用的な例外です。この例外を直接使用するか、それを拡張したカスタム例外を作成できます。

- **ステータスコード**: 例外発生時に定義されます
- **自己処理**: オススメ

```ts
// タイトル: 例外をスローする
import { errors } from '@adonisjs/core'

throw errors.E_HTTP_EXCEPTION.invoke(
  {
    errors: ['リクエストを処理できません']
  },
  422
)
```

```ts
// タイトル: 例外を処理する
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_HTTP_EXCEPTION) {
  // エラーを処理する
}
```

## E_HTTP_REQUEST_ABORTED
`E_HTTP_REQUEST_ABORTED`は、`E_HTTP_EXCEPTION`例外のサブクラスです。この例外は、[response.abort](../basics/response.md#aborting-request-with-an-error)メソッドによって発生します。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_HTTP_REQUEST_ABORTED) {
  // エラーを処理する
}
```

## E_INSECURE_APP_KEY
この例外は、`appKey`の長さが16文字未満の場合に発生します。セキュアなアプリキーを生成するために[generate:key](./commands.md#generatekey)エースコマンドを使用できます。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INSECURE_APP_KEY) {
  // エラーを処理する
}
```

## E_MISSING_APP_KEY
この例外は、`config/app.ts`ファイル内で`appKey`プロパティが定義されていない場合に発生します。デフォルトでは、`appKey`の値は`APP_KEY`環境変数を使用して設定されます。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_APP_KEY) {
  // エラーを処理する
}
```

## E_INVALID_ENV_VARIABLES
この例外は、1つ以上の環境変数がバリデーションに失敗した場合に発生します。詳細なバリデーションエラーは、`error.help`プロパティを使用してアクセスできます。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INVALID_ENV_VARIABLES) {
  console.log(error.help)
}
```

## E_MISSING_COMMAND_NAME
この例外は、コマンドが`commandName`プロパティを定義していないか、その値が空の文字列である場合に発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_COMMAND_NAME) {
  console.log(error.commandName)
}
```

## E_COMMAND_NOT_FOUND
この例外は、Aceがコマンドを見つけることができない場合に発生します。

- **ステータスコード**: 404
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_COMMAND_NOT_FOUND) {
  console.log(error.commandName)
}
```

## E_MISSING_FLAG
この例外は、必須のCLIフラグを指定せずにコマンドを実行した場合に発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_FLAG) {
  console.log(error.commandName)
}
```

## E_MISSING_FLAG_VALUE
この例外は、非ブール型のCLIフラグに値を指定せずにコマンドを実行しようとした場合に発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_FLAG_VALUE) {
  console.log(error.commandName)
}
```

## E_MISSING_ARG
この例外は、必須の引数を定義せずにコマンドを実行した場合に発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_ARG) {
  console.log(error.commandName)
}
```

## E_MISSING_ARG_VALUE
この例外は、必須の引数に値を定義せずにコマンドを実行しようとした場合に発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_ARG_VALUE) {
  console.log(error.commandName)
}
```

## E_UNKNOWN_FLAG
この例外は、未知のCLIフラグを使用してコマンドを実行した場合に発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_UNKNOWN_FLAG) {
  console.log(error.commandName)
}
```

## E_INVALID_FLAG
この例外は、CLIフラグに提供された値が無効な場合に発生します。たとえば、数値を受け入れるフラグに文字列値を渡す場合などです。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INVALID_FLAG) {
  console.log(error.commandName)
}
```

## E_MULTIPLE_REDIS_SUBSCRIPTIONS
`@adonisjs/redis`パッケージは、[指定されたパブ/サブチャネルに購読](../database/redis.md#pubsub)しようとすると、この例外を発生させます。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors as redisErrors } from '@adonisjs/redis'
if (error instanceof redisErrors.E_MULTIPLE_REDIS_SUBSCRIPTIONS) {
}
```

## E_MULTIPLE_REDIS_PSUBSCRIPTIONS
`@adonisjs/redis`パッケージは、[指定されたパブ/サブパターンに購読](../database/redis.md#pubsub)しようとすると、この例外を発生させます。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors as redisErrors } from '@adonisjs/redis'
if (error instanceof redisErrors.E_MULTIPLE_REDIS_PSUBSCRIPTIONS) {
}
```

## E_MAIL_TRANSPORT_ERROR
`@adonisjs/mail`パッケージは、指定されたトランスポートを使用してメールを送信できない場合にこの例外を発生させます。通常、これはメールサービスのHTTP APIが非200のHTTPレスポンスを返した場合に発生します。

`error.cause`プロパティを使用してネットワークリクエストエラーにアクセスできます。`cause`プロパティは、`got`（npmパッケージ）によって返される[エラーオブジェクト](https://github.com/sindresorhus/got/blob/main/documentation/8-errors.md)です。

- **ステータスコード**: 400
- **自己処理**: できます。

```ts
import { errors as mailErrors } from '@adonisjs/mail'
if (error instanceof mailErrors.E_MAIL_TRANSPORT_ERROR) {
  console.log(error.cause)
}
```

## E_SESSION_NOT_MUTABLE
この例外は、セッションストアが読み取り専用モードで初期化された場合に、`@adonisjs/session`パッケージによって発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors as sessionErrors } from '@adonisjs/session'
if (error instanceof sessionErrors.E_SESSION_NOT_MUTABLE) {
  console.log(error.message)
}
```

## E_SESSION_NOT_MUTABLE
この例外は、セッションストアが読み取り専用モードで初期化された場合に、`@adonisjs/session`パッケージによって発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors as sessionErrors } from '@adonisjs/session'
if (error instanceof sessionErrors.E_SESSION_NOT_MUTABLE) {
  console.log(error.message)
}
```

## E_SESSION_NOT_READY
この例外は、セッションストアがまだ初期化されていない場合に、`@adonisjs/session`パッケージによって発生します。これは、セッションミドルウェアを使用していない場合に発生します。

- **ステータスコード**: 500
- **自己処理**: できます。

```ts
import { errors as sessionErrors } from '@adonisjs/session'
if (error instanceof sessionErrors.E_SESSION_NOT_READY) {
  console.log(error.message)
}
```

</div>
