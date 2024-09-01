---
summary: AdonisJSフレームワークコアと公式パッケージによってディスパッチされるイベントについて学びましょう。
---

# イベントリファレンス

このガイドでは、フレームワークコアと公式パッケージによってディスパッチされるイベントのリストを見ていきます。使用方法については、[emitter](../digging_deeper/emitter.md)のドキュメントを参照してください。

## http\:request_completed

HTTPリクエストが完了した後に[`http:request_completed`](https://github.com/adonisjs/http-server/blob/main/src/types/server.ts#L65)イベントがディスパッチされます。イベントには[HttpContext](../concepts/http_context.md)のインスタンスとリクエストの実行時間が含まれます。`duration`の値は`process.hrtime`メソッドの出力です。

```ts
import emitter from '@adonisjs/core/services/emitter'
import string from '@adonisjs/core/helpers/string'

emitter.on('http:request_completed', (event) => {
  const method = event.ctx.request.method()
  const url = event.ctx.request.url(true)
  const duration = event.duration

  console.log(`${method} ${url}: ${string.prettyHrTime(duration)}`)
})
```

## http\:server_ready
AdonisJS HTTPサーバーが受信可能な状態になった後にイベントがディスパッチされます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('http:server_ready', (event) => {
  console.log(event.host)
  console.log(event.port)

  /**
   * アプリの起動とHTTPサーバーの開始にかかった時間です。
   */
  console.log(event.duration)
})
```

## container_binding\:resolved

IoCコンテナがバインディングを解決したりクラスのインスタンスを構築した後にイベントがディスパッチされます。`event.binding`プロパティは文字列（バインディング名）またはクラスのコンストラクタであり、`event.value`プロパティは解決された値です。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('container_binding:resolved', (event) => {
  console.log(event.binding)
  console.log(event.value)
})
```

## session\:initiated
HTTPリクエスト中にセッションストアが初期化されたときに`@adonisjs/session`パッケージがイベントを発行します。`event.session`プロパティは[Sessionクラス](https://github.com/adonisjs/session/blob/main/src/session.ts)のインスタンスです。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:initiated', (event) => {
  console.log(`セッションストアが初期化されました: ${event.session.sessionId}`)
})
```

## session\:committed
HTTPリクエスト中にセッションデータがセッションストアに書き込まれたときに`@adonisjs/session`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:committed', (event) => {
  console.log(`データがセッションストアに永続化されました: ${event.session.sessionId}`)
})
```

## session\:migrated
`@adonisjs/session`パッケージは、`session.regenerate()`メソッドを使用して新しいセッションIDが生成されたときにイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:migrated', (event) => {
  console.log(`データを${event.toSessionId}に移行中`)
  console.log(`セッション${event.fromSessionId}を破棄中`)
})
```

## i18n\:missing\:translation
特定のキーとロケールの翻訳が見つからなかった場合に`@adonisjs/i18n`パッケージがイベントを発行します。このイベントをリッスンして、指定されたロケールの不足している翻訳を見つけることができます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('i18n:missing:translation', function (event) {
  console.log(event.identifier)
  console.log(event.hasFallback)
  console.log(event.locale)
})
```

## mail\:sending
メールを送信する前に`@adonisjs/mail`パッケージがイベントを発行します。`mail.sendLater`メソッドの呼び出しの場合、イベントはメールキューがジョブを処理するときに発行されます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:sending', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail\:sent
メールの送信後に`@adonisjs/mail`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:sent', (event) => {
  console.log(event.response)

  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail\:queueing
メールをキューに入れる前に`@adonisjs/mail`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:queueing', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail\:queued
メールがキューに入った後に`@adonisjs/mail`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:queued', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## queued\:mail\:error
`@adonisjs/mail`パッケージの[MemoryQueue](https://github.com/adonisjs/mail/blob/main/src/messengers/memory_queue.ts)実装が`mail.sendLater`メソッドを使用してキューに入れたメールを送信できなかった場合にイベントが発行されます。

カスタムキューの実装を使用している場合は、ジョブのエラーをキャプチャしてこのイベントを発行する必要があります。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('queued:mail:error', (event) => {
  console.log(event.error)
  console.log(event.mailerName)
})
```

## session_auth\:login_attempted

`auth.login`メソッドが直接またはセッションガードによって内部的に呼び出されたときに、`@adonisjs/auth`パッケージの[SessionGuard](https://github.com/adonisjs/auth/blob/main/src/guards/session/guard.ts)実装がイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:login_attempted', (event) => {
  console.log(event.guardName)
  console.log(event.user)
})
```

## session_auth\:login_succeeded

ユーザーが正常にログインした後に、`@adonisjs/auth`パッケージの[SessionGuard](https://github.com/adonisjs/auth/blob/main/src/guards/session/guard.ts)実装がイベントを発行します。

特定のユーザーに関連付けられたセッションを追跡するためにこのイベントを使用できます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:login_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)
  console.log(event.user)
  console.log(event.rememberMeToken) // (作成された場合)
})
```

## session_auth\:authentication_attempted
リクエストセッションの検証とログインユーザーのチェックが試行されたときに`@adonisjs/auth`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_attempted', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)
})
```

## session_auth\:authentication_succeeded
リクエストセッションが検証され、ユーザーがログインした後に`@adonisjs/auth`パッケージがイベントを発行します。`event.user`プロパティを使用してログインしたユーザーにアクセスできます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  console.log(event.user)
  console.log(event.rememberMeToken) // トークンを使用して認証された場合
})
```

## session_auth\:authentication_failed
認証チェックが失敗し、現在のHTTPリクエスト中にユーザーがログインしていない場合に`@adonisjs/auth`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_failed', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  console.log(event.error)
})
```

## session_auth\:logged_out
ユーザーがログアウトした後に`@adonisjs/auth`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:logged_out', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  /**
   * リクエスト中にユーザーがログインしていない場合、ユーザーの値はnullになります。
   */
  console.log(event.user)
})
```

## access_tokens_auth\:authentication_attempted
HTTPリクエスト中にアクセストークンの検証が試行されたときに`@adonisjs/auth`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_attempted', (event) => {
  console.log(event.guardName)
})
```

## access_tokens_auth\:authentication_succeeded
アクセストークンが検証された後に`@adonisjs/auth`パッケージがイベントを発行します。`event.user`プロパティを使用して認証されたユーザーにアクセスできます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.user)
  console.log(event.token)
})
```

## access_tokens_auth\:authentication_failed
認証チェックが失敗したときに`@adonisjs/auth`パッケージがイベントを発行します。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_failed', (event) => {
  console.log(event.guardName)
  console.log(event.error)
})
```


## authorization\:finished
認証チェックが実行された後に`@adonisjs/bouncer`パッケージがイベントを発行します。イベントのペイロードには、チェックのステータスを知るために調査できる最終的なレスポンスが含まれます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('authorization:finished', (event) => {
  console.log(event.user)
  console.log(event.response)
  console.log(event.parameters)
  console.log(event.action) 
})
```
