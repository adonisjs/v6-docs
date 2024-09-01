---
summary: \@adonisjs/limiterパッケージを使用して、ウェブアプリケーションやAPIサーバーでレート制限を実装して、悪用から保護しましょう。
---

# レート制限

AdonisJSは、ウェブアプリケーションやAPIサーバーでレート制限を実装するための第一パーティパッケージを提供しています。レート制限は、`redis`、`mysql`、`postgresql`、`memory`をストレージオプションとして提供し、[カスタムストレージプロバイダの作成](#creating-a-custom-storage-provider)も可能です。

`@adonisjs/limiter`パッケージは、[node-rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible)パッケージをベースにしており、最速のレート制限APIの1つを提供し、競合状態を避けるためにアトミックインクリメントを使用しています。

## インストール

次のコマンドを使用してパッケージをインストールし、設定します：

```sh
node ace add @adonisjs/limiter
```

:::disclosure{title="addコマンドによって実行されるステップを確認する"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/limiter`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に以下のサービスプロバイダを登録します。
    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/limiter/limiter_provider')
      ]
    }
    ```

3. `config/limiter.ts`ファイルを作成します。

4. `start/limiter.ts`ファイルを作成します。このファイルはHTTPスロットルミドルウェアを定義するために使用されます。

5. `start/env.ts`ファイル内で、以下の環境変数とそのバリデーションを定義します。
   ```ts
   LIMITER_STORE=redis
   ```

6. `database`ストアを使用する場合は、`rate_limits`テーブルのデータベースマイグレーションを作成することもできます（オプション）。

:::

## 設定
レート制限の設定は、`config/limiter.ts`ファイル内に保存されます。

参照：[レート制限の設定スタブ](https://github.com/adonisjs/limiter/blob/main/stubs/config/limiter.stub)

```ts
import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),

  stores: {
    redis: stores.redis({}),

    database: stores.database({
      tableName: 'rate_limits'
    }),

    memory: stores.memory({}),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
```

<dl>

<dt>

default

</dt>

<dd>

レート制限を適用するために使用する`default`ストアです。ストアは同じ設定ファイル内の`stores`オブジェクトで定義されます。

</dd>

<dt>

stores

</dt>

<dd>

アプリケーション内で使用するストアのコレクションです。テスト中に使用できる`memory`ストアを常に設定することをオススメします。

</dd>

</dl>

---

### 環境変数
デフォルトのレート制限は、`LIMITER_STORE`環境変数を使用して定義されています。したがって、異なるストアを異なる環境で切り替えることができます。たとえば、テスト中に`memory`ストアを使用し、開発および本番環境では`redis`ストアを使用できます。

また、環境変数は、`start/env.ts`ファイル内で`Env.schema.enum`ルールを使用して事前に設定されたストアのいずれかを許可するように検証する必要があります。

```ts
{
  LIMITER_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),
}
```

### 共有オプション
以下は、すべてのバンドルされたストアで共有されるオプションのリストです。

<dl>


<dt>

keyPrefix

</dt>

<dd>

データベースストア内に格納されるキーのプレフィックスを定義します。データベースストアは異なるデータベーステーブルを使用してデータを分離できるため、`keyPrefix`は無視されます。

</dd>

<dt>

execEvenly

</dt>

<dd>

`execEvenly`オプションは、リクエストのスロットリング時に遅延を追加し、すべてのリクエストが指定された期間の終わりに消費されるようにします。

たとえば、ユーザーに1分間に**10リクエスト**を許可する場合、すべてのリクエストに人工的な遅延が追加され、10番目のリクエストが1分の終わりに終了します。`rate-limiter-flexible`リポジトリの[smooth out traffic peaks](https://github.com/animir/node-rate-limiter-flexible/wiki/Smooth-out-traffic-peaks)記事を読んで、`execEvenly`オプションについて詳しく学びましょう。

</dd>

<dt>

inMemoryBlockOnConsumed

</dt>

<dd>

メモリ内でキーをブロックするリクエスト数を定義します。たとえば、ユーザーには**1分間に10リクエスト**を許可しますが、最初の10秒ですべてのリクエストを消費しました。

しかし、ユーザーはサーバーに対してリクエストを続けるため、レート制限はリクエストを拒否する前にデータベースに問い合わせる必要があります。

データベースへの負荷を軽減するために、指定されたリクエスト数を定義し、その後はデータベースへの問い合わせを停止し、メモリ内でキーをブロックできます。

```ts
{
  duration: '1 minute',
  requests: 10,

  /**
   * 12リクエスト後にキーをメモリ内でブロックし、
   * データベースへの問い合わせを停止します。
   */
  inMemoryBlockOnConsumed: 12,
}
```

</dd>

<dt>

inMemoryBlockDuration

</dt>

<dd>

メモリ内でキーをブロックする期間を定義します。このオプションにより、バックエンドストアはまずメモリ内をチェックしてキーがブロックされているかどうかを確認するため、データベースへの負荷が軽減されます。

```ts
{
  inMemoryBlockDuration: '1 min'
}
```

</dd>

</dl>

---


### Redisストア
`redis`ストアは、`@adonisjs/redis`パッケージに依存しています。そのため、Redisストアを使用する前にこのパッケージを設定する必要があります。

以下は、redisストアが受け入れるオプションのリストです（共有オプションも含む）。

```ts
{
  redis: stores.redis({
    connectionName: 'main',
    rejectIfRedisNotReady: false,
  }),
}
```

<dl>

<dt>

connectionName

</dt>

<dd>

`connectionName`プロパティは、`config/redis.ts`ファイルで定義された接続を参照します。レート制限用には別のRedisデータベースを使用することをオススメします。

</dd>

<dt>

rejectIfRedisNotReady

</dt>

<dd>

Redis接続の状態が`ready`でない場合、レート制限リクエストを拒否します。

</dd>

</dl>

---

### データベースストア
`database`ストアは、`@adonisjs/lucid`パッケージに依存しています。そのため、データベースストアを使用する前にこのパッケージを設定する必要があります。

以下は、データベースストアが受け入れるオプションのリストです（共有オプションも含む）。

:::note

データベースストアでは、MySQLとPostgreSQLのみを使用できます。

:::

```ts
{
  database: stores.database({
    connectionName: 'mysql',
    dbName: 'my_app',
    tableName: 'rate_limits',
    schemaName: 'public',
    clearExpiredByTimeout: false,
  }),
}
```

<dl>

<dt>

connectionName

</dt>

<dd>

`config/database.ts`ファイルで定義されたデータベース接続への参照です。定義されていない場合は、デフォルトのデータベース接続が使用されます。

</dd>

<dt>

dbName

</dt>

<dd>

SQLクエリを実行するために使用するデータベースです。`config/database.ts`ファイルで定義された接続設定から`dbName`の値を推測しようとします。ただし、接続文字列を使用する場合は、このプロパティを介してデータベース名を指定する必要があります。

</dd>

<dt>

tableName

</dt>

<dd>

レート制限を保存するために使用するデータベーステーブルです。

</dd>

<dt>

schemaName

</dt>

<dd>

SQLクエリを実行するために使用するスキーマ（PostgreSQLのみ）です。

</dd>

<dt>

clearExpiredByTimeout

</dt>

<dd>

有効期限が切れたキーを5分ごとにクリアするようにデータベースストアが設定されています。ただし、1時間以上有効期限が切れているキーのみがクリアされます。

</dd>

</dl>


## HTTPリクエストのスロットリング
レート制限が設定された後、`limiter.define`メソッドを使用してHTTPスロットルミドルウェアを作成できます。`limiter`サービスは、`config/limiter.ts`ファイルで定義された設定を使用して作成された[LimiterManager](https://github.com/adonisjs/limiter/blob/main/src/limiter_manager.ts)クラスのシングルトンインスタンスです。

`start/limiter.ts`ファイルを開くと、ルートまたはルートグループに適用できる事前定義されたグローバルスロットルミドルウェアが見つかります。同様に、アプリケーション内で必要な数だけスロットルミドルウェアを作成することもできます。

次の例では、グローバルスロットルミドルウェアがIPアドレスに基づいてユーザーが1分間に**10リクエスト**を行うことを許可します。

```ts
// title: start/limiter.ts
import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})
```

次のように`throttle`ミドルウェアをルートに適用できます。

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'
// highlight-start
import { throttle } from '#start/limiter'
// highlight-end

router
  .get('/', () => {})
  // highlight-start
  .use(throttle)
  // highlight-end
```

### ダイナミックレート制限

別のミドルウェアを作成してAPIエンドポイントを保護するために、認証状態に基づいて動的なレート制限を適用することもできます。

```ts
// title: start/limiter.ts
export const apiThrottle = limiter.define('api', (ctx) => {
  /**
   * ログイン済みのユーザーは、ユーザーIDごとに100リクエストを許可します。
   */
  if (ctx.auth.user) {
    return limiter
      .allowRequests(100)
      .every('1 minute')
      .usingKey(`user_${ctx.auth.user.id}`)
  }

  /**
   * ゲストユーザーは、IPアドレスごとに10リクエストを許可します。
   */
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`)
})
```

```ts
// title: start/routes.ts
import { apiThrottle } from '#start/limiter'

router
  .get('/api/repos/:id/stats', [RepoStatusController])
  .use(apiThrottle)
```

### バックエンドストアの切り替え
`store`メソッドを使用して、スロットルミドルウェアに特定のバックエンドストアを使用できます。

例：
```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  .store('redis')
  // highlight-end
```


### カスタムキーの使用
デフォルトでは、リクエストはユーザーのIPアドレスによってレート制限されます。ただし、`usingKey`メソッドを使用してカスタムキーを指定することもできます。

```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  .usingKey(`user_${ctx.auth.user.id}`)
  // highlight-end
```

### ユーザーのブロック
クォータを使い果たした後もリクエストを続けるユーザーを指定した期間ブロックする場合は、`blockFor`メソッドを使用します。このメソッドは、秒または時間表現の形式で期間を受け入れます。

```ts
limiter
  .allowRequests(10)
  .every('1 minute')
  // highlight-start
  /**
   * 1分間に10リクエストを超える場合、30分間ブロックされます。
   */
  .blockFor('30 mins')
  // highlight-end
```

## ThrottleExceptionの処理
ユーザーが指定された時間枠内ですべてのリクエストを使い果たした場合、スロットルミドルウェアは[E_TOO_MANY_REQUESTS](../references/exceptions.md#e_too_many_requests)例外をスローします。この例外は、以下のコンテンツネゴシエーションルールにしたがってHTTPレスポンスに自動的に変換されます。

## ThrottleExceptionの処理
throttleミドルウェアは、指定された時間枠内ですべてのリクエストを使い果たした場合、[E_TOO_MANY_REQUESTS](../references/exceptions.md#e_too_many_requests)例外をスローします。この例外は、以下のコンテンツネゴシエーションルールにしたがってHTTPレスポンスに自動的に変換されます。

- `Accept=application/json`ヘッダーを持つHTTPリクエストは、エラーメッセージの配列を受け取ります。各配列要素はメッセージプロパティを持つオブジェクトです。

- `Accept=application/vnd.api+json`ヘッダーを持つHTTPリクエストは、JSON API仕様に従ってフォーマットされたエラーメッセージの配列を受け取ります。

- その他のリクエストは、プレーンテキストの応答メッセージを受け取ります。ただし、limiterエラーのカスタムエラーページを表示するために[status pages](../basics/exception_handling.md#status-pages)を使用することもできます。

また、[global exception handler](../basics/exception_handling.md#handling-exceptions)内でエラーを自己処理することもできます。

```ts
import { errors } from '@adonisjs/limiter'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_TOO_MANY_REQUESTS) {
      const message = error.getResponseMessage(ctx)
      const headers = error.getDefaultHeaders()

      Object.keys(headers).forEach((header) => {
        ctx.response.header(header, headers[header])
      })

      return ctx.response.status(error.status).send(message)
    }
    // highlight-end

    return super.handle(error, ctx)
  }
}
```

### エラーメッセージのカスタマイズ
例外をグローバルで処理する代わりに、`limitExceeded`フックを使用してエラーメッセージ、ステータス、およびレスポンスヘッダーをカスタマイズすることもできます。

```ts
import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    // highlight-start
    .limitExceeded((error) => {
      error
        .setStatus(400)
        .setMessage('リクエストを処理できません。後でもう一度お試しください')
    })
    // highlight-end
})
```

### エラーメッセージの翻訳の使用
[@adonisjs/i18n](../digging_deeper/i18n.md)パッケージを設定している場合、`errors.E_TOO_MANY_REQUESTS`キーを使用してエラーメッセージの翻訳を定義できます。例えば：

```json
// title: resources/lang/fr/errors.json
{
  "E_TOO_MANY_REQUESTS": "リクエストが多すぎます"
}
```

最後に、`error.t`メソッドを使用してカスタム翻訳キーを定義することもできます。

```ts
limitExceeded((error) => {
  error.t('errors.rate_limited', {
    limit: error.response.limit,
    remaining: error.response.remaining,
  })
})
```

## 直接の使用
HTTPリクエストのスロットリングと並行して、アプリケーションの他の部分にレート制限を適用するためにlimiterを使用することもできます。例えば、ログイン時に無効な資格情報を複数回提供した場合にユーザーをブロックするか、ユーザーが実行できる同時ジョブの数を制限するなどがあります。

### リミッターの作成

アクションにレート制限を適用する前に、`limiter.use`メソッドを使用して[Limiter](https://github.com/adonisjs/limiter/blob/main/src/limiter.ts)クラスのインスタンスを取得する必要があります。`use`メソッドは、バックエンドストアの名前と以下のレート制限オプションを受け入れます。

- `requests`: 指定された期間に許可するリクエストの数。
- `duration`: 秒または[時間表現](../references/helpers.md#seconds)文字列の期間。
- `block (オプション)`: すべてのリクエストが使い果たされた後にキーをブロックする期間。
- `inMemoryBlockOnConsumed (オプション)`: [共有オプション](#共有オプション)を参照。
- `inMemoryBlockDuration (オプション)`: [共有オプション](#共有オプション)を参照。

```ts
import limiter from '@adonisjs/limiter/services/main'

const reportsLimiter = limiter.use('redis', {
  requests: 1,
  duration: '1 hour'
})
```

デフォルトのストアを使用する場合は、最初のパラメータを省略できます。例えば：

```ts
const reportsLimiter = limiter.use({
  requests: 1,
  duration: '1 hour'
})
```

### アクションにレート制限を適用する

リミッターのインスタンスを作成したら、`attempt`メソッドを使用してアクションにレート制限を適用できます。
このメソッドは、以下のパラメータを受け入れます。

- レート制限に使用する一意のキー。
- すべての試行が使い果たされるまで実行されるコールバック関数。

`attempt`メソッドは、コールバック関数の結果を返します（実行された場合）。それ以外の場合は`undefined`を返します。

```ts
const key = 'user_1_reports'

/**
 * 指定されたキーでアクションを実行しようとします。
 * 結果はコールバック関数の戻り値または、コールバックが実行されなかった場合はundefinedになります。
 */ 
const executed = reportsLimiter.attempt(key, async () => {
  await generateReport()
  return true
})

/**
 * 制限を超えたことをユーザーに通知します。
 */
if (!executed) {
  const availableIn = await reportsLimiter.availableIn(key)
  return `${availableIn}秒後に再試行してください`
}

return 'レポートが生成されました'
```

### 多数のログイン失敗を防止する
直接の使用の別の例として、ログインフォームで複数回の無効な試行を行った場合にIPアドレスからのログインを許可しないことがあります。

次の例では、`limiter.penalize`メソッドを使用して、ユーザーが無効な資格情報を提供した場合に1つのリクエストを消費し、すべての試行が使い果たされた後に20分間ブロックするようにします。

`limiter.penalize`メソッドは、次の引数を受け入れます。

- レート制限に使用する一意のキー。
- 実行された場合に1つのリクエストが消費されるコールバック関数。

`penalize`メソッドは、コールバック関数の結果または`ThrottleException`のインスタンスを返します。例外を使用して、次の試行までの残り時間を取得できます。

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'

export default class SessionController {
  async store({ request, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'passwords'])

    /**
     * リミッターを作成する
     */
    const loginLimiter = limiter.use({
      requests: 5,
      duration: '1 min',
      blockDuration: '20 mins'
    })

    /**
     * IPアドレス+メールの組み合わせを使用します。これにより、
     * 攻撃者がメールを悪用している場合、実際のユーザーが
     * ログインできなくなることなく、攻撃者のIPアドレスのみをペナルティとします。
     */
    const key = `login_${request.ip()}_${email}`

    /**
     * User.verifyCredentialsを"penalize"メソッドでラップして、
     * 無効な資格情報のエラーごとに1つのリクエストを消費します。
     */
    const [error, user] = await loginLimiter.penalize(key, () => {
      return User.verifyCredentials(email, password)
    })

    /**
     * ThrottleExceptionの場合、カスタムエラーメッセージを含む
     * ユーザーを元のページにリダイレクトします。
     */
    if (error) {
      session.flashAll()
      session.flashErrors({
        E_TOO_MANY_REQUESTS: `${error.response.availableIn}秒後に再試行してください`
      })
      return response.redirect().back()
    }

    /**
     * それ以外の場合は、ユーザーをログインします。
     */
  }
}
```

## リクエストの手動消費
`attempt`メソッドと`penalize`メソッドの他にも、残りのリクエストを確認し、手動で消費するためにリミッターと対話できます。

次の例では、`remaining`メソッドを使用して、指定されたキーがすべてのリクエストを消費したかどうかを確認します。それ以外の場合は、`increment`メソッドを使用して1つのリクエストを消費します。

```ts
import limiter from '@adonisjs/limiter/services/main'

const requestsLimiter = limiter.use({
  requests: 10,
  duration: '1 minute'
})

// highlight-start
if (await requestsLimiter.remaining('unique_key') > 0) {
  await requestsLimiter.increment('unique_key')
  await performAction()
} else {
  return 'リクエストが多すぎます'
}
// highlight-end
```

上記の例では、`remaining`メソッドと`increment`メソッドの間で競合状態が発生する可能性があります。そのため、代わりに`consume`メソッドを使用することをお勧めします。`consume`メソッドはリクエスト数を増やし、すべてのリクエストが消費された場合に例外をスローします。

```ts
import { errors } from '@adonisjs/limiter'

try {
  await requestsLimiter.consume('unique_key')
  await performAction()
} catch (error) {
  if (error instanceof errors.E_TOO_MANY_REQUESTS) {
    return 'リクエストが多すぎます'
  }
}
```

## キーのブロック
リクエストがすべて消費された後にユーザーがリクエストを続ける場合、キーをより長い期間ブロックできます。

ブロックは、`consume`メソッド、`attempt`メソッド、および`penalize`メソッドが自動的に実行します。`blockDuration`オプションを使用してリミッターのインスタンスを作成することで、ブロックが実行されます。例えば：

```ts
import limiter from '@adonisjs/limiter/services/main'

const requestsLimiter = limiter.use({
  requests: 10,
  duration: '1 minute',
  // highlight-start
  blockDuration: '30 mins'
  // highlight-end
})

/**
 * ユーザーは1分間に10リクエストを行うことができます。ただし、
 * 11番目のリクエストを送信すると、キーを30分間ブロックします。
 */ 
await requestLimiter.consume('a_unique_key')

/**
 * consumeと同じ動作
 */
await requestLimiter.attempt('a_unique_key', () => {
})

/**
 * 10回の失敗を許可し、その後30分間キーをブロックします。
 */
await requestLimiter.penalize('a_unique_key', () => {
})
```

最後に、`block`メソッドを使用して指定された期間の間キーをブロックできます。

```ts
const requestsLimiter = limiter.use({
  requests: 10,
  duration: '1 minute',
})

await requestsLimiter.block('a_unique_key', '30 mins')
```

## 試行のリセット
リクエスト数を減らすか、キー全体をストレージから削除するために次のいずれかのメソッドを使用できます。

`decrement`メソッドはリクエスト数を1減らし、`delete`メソッドはキーを削除します。ただし、`decrement`メソッドはアトミックではなく、並行性が高い場合にリクエスト数を-1に設定する可能性があります。

```ts
// title: リクエスト数の減少
import limiter from '@adonisjs/limiter/services/main'

const jobsLimiter = limiter.use({
  requests: 2,
  duration: '5 mins',
})

await jobsLimiter.attempt('unique_key', async () => {
  await processJob()

  /**
   * ジョブの処理が完了した後に消費されたリクエストを減らします。
   * これにより、他のワーカーがスロットを使用できるようになります。
   */
  // highlight-start
  await jobsLimiter.decrement('unique_key')
  // highlight-end
})
```

```ts
// title: キーの削除
import limiter from '@adonisjs/limiter/services/main'

const requestsLimiter = limiter.use({
  requests: 2,
  duration: '5 mins',
})

await requestsLimiter.delete('unique_key')
```

## テスト
レート制限に単一の（つまり、デフォルトの）ストアを使用している場合は、テスト中に`memory`ストアに切り替えるために`.env.test`ファイル内で`LIMITER_STORE`環境変数を定義できます。

```dotenv
// title: .env.test
LIMITER_STORE=memory
```

テスト間でレート制限ストレージをクリアするには、`limiter.clear`メソッドを使用します。`clear`メソッドはストア名の配列を受け入れ、データベースをフラッシュします。

Redisを使用する場合、レートリミッター用に別のデータベースを使用することをオススメします。そうしないと、`clear`メソッドがデータベース全体をフラッシュし、アプリケーションの他の部分に影響を与える可能性があります。

```ts
import limiter from '@adonisjs/limiter/services/main'

test.group('Reports', (group) => {
  // highlight-start
  group.each.setup(() => {
    return () => limiter.clear(['redis', 'memory'])
  })
  // highlight-end
})
```

または、引数なしで`clear`メソッドを呼び出すこともできます。すると、すべての設定されたストアがクリアされます。

```ts
test.group('Reports', (group) => {
  group.each.setup(() => {
    // highlight-start
    return () => limiter.clear()
    // highlight-end
  })
})
```

## カスタムストレージプロバイダの作成
カスタムストレージプロバイダは、[LimiterStoreContract](https://github.com/adonisjs/limiter/blob/main/src/types.ts#L163)インターフェイスを実装し、以下のプロパティ/メソッドを定義する必要があります。

実装は任意のファイル/フォルダ内に記述できます。カスタムストアを作成するためには、サービスプロバイダは必要ありません。

```ts
import string from '@adonisjs/core/helpers/string'
import { LimiterResponse } from '@adonisjs/limiter'
import {
  LimiterStoreContract,
  LimiterConsumptionOptions
} from '@adonisjs/limiter/types'

/**
 * 受け入れるカスタムオプションのセット
 */
export type MongoDbLimiterConfig = {
  client: MongoDBConnection
}

export class MongoDbLimiterStore implements LimiterStoreContract {
  readonly name = 'mongodb'
  declare readonly requests: number
  declare readonly duration: number
  declare readonly blockDuration: number

  constructor(public config: MongoDbLimiterConfig & LimiterConsumptionOptions) {
    this.requests = this.config.requests
    this.duration = string.seconds.parse(this.config.duration)
    this.blockDuration = string.seconds.parse(this.config.blockDuration)
  }

  /**
   * 指定されたキーのリクエストを1つ消費します。すべてのリクエストが既に消費されている場合は、エラーをスローする必要があります。
   */
  async consume(key: string | number): Promise<LimiterResponse> {
  }

  /**
   * 指定されたキーのリクエストを1つ消費しますが、すべてのリクエストが消費されている場合はエラーをスローしません。
   */
  async increment(key: string | number): Promise<LimiterResponse> {}

  /**
   * 指定されたキーのリクエストを1つ減らします。可能な場合は、リクエスト数を負の値に設定しないようにします。
   */
  async decrement(key: string | number): Promise<LimiterResponse> {}

  /**
   * 指定された期間キーをブロックします。
   */ 
  async block(
    key: string | number,
    duration: string | number
  ): Promise<LimiterResponse> {}
  
  /**
   * 指定されたキーの消費されたリクエスト数を設定します。明示的な期間が指定されていない場合は、設定ファイルから期間を推測する必要があります。
   */ 
  async set(
    key: string | number,
    requests: number,
    duration?: string | number
  ): Promise<LimiterResponse> {}

  /**
   * キーをストレージから削除します。
   */
  async delete(key: string | number): Promise<boolean> {}

  /**
   * データベースからすべてのキーをフラッシュします。
   */
  async clear(): Promise<void> {}

  /**
   * 指定されたキーに対するレートリミットのレスポンスを取得します。キーが存在しない場合は`null`を返します。
   */
  async get(key: string | number): Promise<LimiterResponse | null> {}
}
```

### 設定ヘルパーの定義

実装が完了したら、設定ファイル内でプロバイダを使用するための設定ヘルパーを作成する必要があります。設定ヘルパーは`LimiterManagerStoreFactory`関数を返す必要があります。

`MongoDbLimiterStore`の実装と同じファイル内に以下の関数を記述できます。

```ts
import { LimiterManagerStoreFactory } from '@adonisjs/limiter/types'

/**
 * 設定ファイル内でmongoDbストアを使用するための設定ヘルパー
 */
export function mongoDbStore(config: MongoDbLimiterConfig) {
  const storeFactory: LimiterManagerStoreFactory = (runtimeOptions) => {
    return new MongoDbLimiterStore({
      ...config,
      ...runtimeOptions
    })
  }
}
```

### 設定ヘルパーの使用

完了したら、次のように`mongoDbStore`ヘルパーを使用できます。

```ts
// title: config/limiter.ts
import env from '#start/env'
// highlight-start
import { mongoDbStore } from 'my-custom-package'
// highlight-end
import { defineConfig } from '@adonisjs/limiter'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),

  stores: {
    // highlight-start
    mongodb: mongoDbStore({
      client: mongoDb // create mongoDb client
    })
    // highlight-end
  },
})
```

### rate-limiter-flexibleドライバのラップ
[node-rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible?tab=readme-ov-file#docs-and-examples)パッケージから既存のドライバをラップする場合は、[RateLimiterBridge](https://github.com/adonisjs/limiter/blob/main/src/stores/bridge.ts)を使用できます。

今度はブリッジを使用して同じ`MongoDbLimiterStore`を再実装してみましょう。

```ts
import { RateLimiterBridge } from '@adonisjs/limiter'
import { RateLimiterMongo } from 'rate-limiter-flexible'

export class MongoDbLimiterStore extends RateLimiterBridge {
  readonly name = 'mongodb'

  constructor(public config: MongoDbLimiterConfig & LimiterConsumptionOptions) {
    super(
      new RateLimiterMongo({
        storeClient: config.client,
        points: config.requests,
        duration: string.seconds.parse(config.duration),
        blockDuration: string.seconds.parse(this.config.blockDuration)
        // ... 他のオプションも提供します
      })
    )
  }

  /**
   * clearメソッドを自己実装します。理想的には、
   * config.clientを使用して削除クエリを発行します
   */
  async clear() {}
}
```
