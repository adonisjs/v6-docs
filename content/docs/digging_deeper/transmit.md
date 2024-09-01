---
summary: AdonisJSサーバーを使用してTransmitパッケージを使ってSSEを介してリアルタイムの更新を送信する方法を学びます
---

# Transmit

Transmitは、AdonisJS向けに作られたネイティブな意見のあるServer-Sent-Event（SSE）モジュールです。通知、ライブチャットメッセージ、またはその他のリアルタイムデータなど、クライアントへのリアルタイムの更新を送信するためのシンプルで効率的な方法です。

:::note
データの送信はサーバーからクライアントへのみ行われます。クライアントからサーバーへの通信にはフォームまたはフェッチリクエストを使用する必要があります。
:::

## インストール

次のコマンドを使用してパッケージをインストールおよび設定します：

```sh
node ace add @adonisjs/transmit
```

:::disclosure{title="addコマンドによって実行されるステップを参照"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/transmit`パッケージをインストールします。

2. `adonisrc.ts`ファイル内で`@adonisjs/transmit/transmit_provider`サービスプロバイダを登録します。

3. `config`ディレクトリ内に新しい`transmit.ts`ファイルを作成します。

:::

また、クライアント側でイベントを受信するためにTransmitクライアントパッケージもインストールする必要があります。

```sh
npm install @adonisjs/transmit-client
```

## 設定

Transmitパッケージの設定は`config/transmit.ts`ファイルに保存されます。

参照：[Config stub](https://github.com/adonisjs/transmit/blob/main/stubs/config/transmit.stub)

```ts
import { defineConfig } from '@adonisjs/transmit'

export default defineConfig({
  pingInterval: false,
  transport: null
  // routeHandlerModifier(route: Route) {}
})
```

<dl>

<dt>

pingInterval

</dt>

<dd>

クライアントにpingメッセージを送信するために使用される間隔です。値はミリ秒または文字列の`Duration`形式（例：`10s`）で指定します。pingメッセージを無効にするには`false`に設定します。

</dd>

<dt>

transport

</dt>

<dd>

Transmitは複数のサーバーやインスタンス間でイベントを同期できます。この機能を有効にするには、必要なトランスポートレイヤー（現在は`redis`のみサポート）を参照するように設定します。同期を無効にするには`null`に設定します。

```ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/transmit'
import { redis } from '@adonisjs/transmit/transports'

export default defineConfig({
  transport: {
    driver: redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD'),
    })
  }
})
```

:::note
`redis`トランスポートを使用する場合は、`ioredis`がインストールされていることを確認してください。
:::

</dd>

<dt>

routeHandlerModifier

</dt>

<dd>

トランスミットルートを登録する前に呼び出される関数です。ルートインスタンスが渡されます。この関数を使用してカスタムミドルウェアを追加したり、ルートハンドラを変更したりするために使用します。

たとえば、[`Rate Limiter`](../security/rate_limiting.md)と認証ミドルウェアを使用して、一部のトランスミットルートの乱用を防ぐために使用できます。

```ts
import { defineConfig } from '@adonisjs/transmit'
import { throttle } from '#start/limiter'

export default defineConfig({
  async routeHandlerModifier(route) {
    const { middleware } = await import('#start/kernel')
    
    // クライアントを登録するために認証されていることを確認してください
    if (route.getPattern() === '__transmit/events') {
      route.middleware(middleware.auth())
      return
    }
    
    // 他のトランスミットルートにスロットルミドルウェアを追加します
    route.use(throttle)
  }
})
```

</dd>

</dl>

## チャンネル

チャンネルはイベントをグループ化するために使用されます。たとえば、通知用のチャンネル、チャットメッセージ用の別のチャンネルなどがあります。クライアントがチャンネルに登録すると、チャンネルが動的に作成されます。

### チャンネル名

チャンネル名はチャンネルを識別するために使用されます。大文字と小文字が区別され、文字列である必要があります。チャンネル名には`/`以外の特殊文字やスペースは使用できません。以下は有効なチャンネル名の例です：

```ts
import transmit from '@adonisjs/transmit/services/main'

transmit.broadcast('global', { message: 'Hello' })
transmit.broadcast('chats/1/messages', { message: 'Hello' })
transmit.broadcast('users/1', { message: 'Hello' })
```

:::tip
チャンネル名はAdonisJSのルートと同じ構文を使用しますが、それらとは関係ありません。同じキーでHTTPルートとチャンネルを自由に定義できます。
:::

### チャンネルの認証

`authorizeChannel`メソッドを使用して、チャンネルへの接続を承認または拒否できます。このメソッドはチャンネル名と`HttpContext`を受け取り、真偽値を返す必要があります。

```ts
// title: start/transmit.ts

import transmit from '@adonisjs/transmit/services/main'
import Chat from '#models/chat'
import type { HttpContext } from '@adonisjs/core/http'

transmit.authorizeChannel<{ id: string }>('users/:id', (ctx: HttpContext, { id }) => {
  return ctx.auth.user?.id === +id
})

transmit.authorizeChannel<{ id: string }>('chats/:id/messages', async (ctx: HttpContext, { id }) => {
  const chat = await Chat.findOrFail(+id)
  
  return ctx.bouncer.allows('accessChat', chat)
})
```

## イベントのブロードキャスト

`broadcast`メソッドを使用して、チャンネルにイベントをブロードキャストできます。このメソッドはチャンネル名と送信するデータを受け取ります。

```ts
import transmit from '@adonisjs/transmit/services/main'

transmit.broadcast('global', { message: 'Hello' })
```

また、`broadcastExcept`メソッドを使用して、特定のUIDを除くすべてのチャンネルにイベントをブロードキャストすることもできます。このメソッドはチャンネル名、送信するデータ、および無視するUIDを受け取ります。

```ts
transmit.broadcastExcept('global', { message: 'Hello' }, 'uid-of-sender')
```

### 複数のサーバーやインスタンス間での同期

デフォルトでは、イベントのブロードキャストはHTTPリクエストのコンテキスト内でのみ動作します。ただし、設定で`transport`を登録することで、バックグラウンドからイベントをブロードキャストすることもできます。

トランスポートレイヤーは、複数のサーバーやインスタンス間でイベントを同期する責任を持ちます。これは、ブロードキャストされたイベント、サブスクリプション、およびアンサブスクリプションなどのイベントを、接続されているすべてのサーバーやインスタンスに対して`Message Bus`を使用してブロードキャストすることによって機能します。

クライアント接続に対して責任を持つサーバーまたはインスタンスは、イベントを受信し、クライアントにブロードキャストします。

## Transmitクライアント

`@adonisjs/transmit-client`パッケージを使用して、クライアント側でイベントを受信できます。このパッケージは`Transmit`クラスを提供します。クライアントはデフォルトで[`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) APIを使用してサーバーに接続します。

```ts
import { Transmit } from '@adonisjs/transmit-client'

export const transmit = new Transmit({
  baseUrl: window.location.origin
})
```

:::tip
`Transmit`クラスのインスタンスは1つだけ作成し、アプリケーション全体で再利用するべきです。
:::

### Transmitインスタンスの設定

`Transmit`クラスは、次のプロパティを持つオブジェクトを受け入れます：

<dl>

<dt>

baseUrl

</dt>

<dd>

サーバーのベースURLです。URLにはプロトコル（httpまたはhttps）とドメイン名を含める必要があります。

</dd>

<dt>

uidGenerator

</dt>

<dd>

クライアントのための一意の識別子を生成する関数です。関数は文字列を返す必要があります。デフォルトでは`crypto.randomUUID`です。

</dd>

<dt>

eventSourceFactory

</dt>

<dd>

新しい`EventSource`インスタンスを作成する関数です。デフォルトではWebAPIの[`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)を使用します。`EventSource` APIをサポートしていない`Node.js`、`React Native`、または他の環境でクライアントを使用する場合は、カスタムの実装を提供する必要があります。

</dd>

<dt>

eventTargetFactory 

</dt>

<dd>

新しい`EventTarget`インスタンスを作成する関数です。デフォルトではWebAPIの[`EventTarget`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)を使用します。`EventTarget` APIをサポートしていない`Node.js`、`React Native`、または他の環境でクライアントを使用する場合は、カスタムの実装を提供する必要があります。`EventTarget` APIを無効にするには`null`を返します。

</dd>

<dt>

httpClientFactory

</dt>

<dd>

新しい`HttpClient`インスタンスを作成する関数です。主にテスト目的で使用されます。

</dd>

<dt>

beforeSubscribe

</dt>

<dd>

チャンネルに登録する前に呼び出される関数です。チャンネル名とサーバーに送信される`Request`オブジェクトが渡されます。この関数を使用してカスタムヘッダーを追加したり、リクエストオブジェクトを変更したりするために使用します。

</dd>

<dt>

beforeUnsubscribe

</dt>

<dd>

チャンネルから登録解除する前に呼び出される関数です。チャンネル名とサーバーに送信される`Request`オブジェクトが渡されます。この関数を使用してカスタムヘッダーを追加したり、リクエストオブジェクトを変更したりするために使用します。

</dd>

<dt>

maxReconnectAttempts

</dt>

<dd>

再接続試行の最大回数です。デフォルトは`5`です。

</dd>

<dt>

onReconnectAttempt

</dt>

<dd>

各再接続試行の前に呼び出される関数で、これまでに行われた試行回数が渡されます。カスタムロジックを追加するためにこの関数を使用します。

</dd>

<dt>

onReconnectFailed

</dt>

<dd>

再接続試行が失敗したときに呼び出される関数です。カスタムロジックを追加するためにこの関数を使用します。

</dd>

<dt>

onSubscribeFailed

</dt>

<dd>

サブスクリプションが失敗したときに呼び出される関数です。`Response`オブジェクトが渡されます。カスタムロジックを追加するためにこの関数を使用します。

</dd>

<dt>

onSubscription

</dt>

<dd>

サブスクリプションが成功したときに呼び出される関数です。チャンネル名が渡されます。カスタムロジックを追加するためにこの関数を使用します。

</dd>

<dt>

onUnsubscription

</dt>

<dd>

アンサブスクリプションが成功したときに呼び出される関数です。チャンネル名が渡されます。カスタムロジックを追加するためにこの関数を使用します。

</dd>

</dl>


### サブスクリプションの作成

`subscription`メソッドを使用して、チャンネルに対するサブスクリプションを作成できます。このメソッドはチャンネル名を受け取ります。

```ts
const subscription = transmit.subscription('chats/1/messages')
await subscription.create()
```

`create`メソッドはサブスクリプションをサーバーに登録します。`await`または`void`できるプロミスを返します。

:::note
`create`メソッドを呼び出さない場合、サブスクリプションはサーバーに登録されず、イベントを受信しません。
:::

### イベントのリスニング

`onMessage`メソッドを使用して、サブスクリプションでイベントをリスンできます。このメソッドはコールバック関数を受け取ります。異なるコールバックを追加するために、`onMessage`メソッドを複数回呼び出すことができます。

```ts
subscription.onMessage((data) => {
  console.log(data)
})
```

また、`onMessageOnce`メソッドを使用して、コールバック関数を受け取ることで、チャンネルを一度だけリスンすることもできます。

```ts
subscription.onMessageOnce(() => {
  console.log('一度だけ呼び出されます')
})
```

### イベントのリスニングを停止する

`onMessage`および`onMessageOnce`メソッドは、特定のコールバックのリスニングを停止するために呼び出すことができる関数を返します。

```ts
const stopListening = subscription.onMessage((data) => {
  console.log(data)
})

// リスニングを停止する
stopListening()
```

### サブスクリプションの削除

`delete`メソッドを使用して、サブスクリプションを削除できます。このメソッドは`await`または`void`できるプロミスを返します。このメソッドはサーバー上でサブスクリプションの登録を解除します。

```ts
await subscription.delete()
```
