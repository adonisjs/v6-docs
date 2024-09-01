---
summary: '`@adonisjs/redis`パッケージを使用してAdonisJSアプリケーション内でRedisを利用します。'
---

# Redis

`@adonisjs/redis`パッケージを使用してAdonisJSアプリケーション内でRedisを利用できます。このパッケージは、Pub/SubのDXの向上と複数のRedis接続の自動管理を提供する[ioredis](https://github.com/redis/ioredis)の薄いラッパーです。

## インストール

以下のコマンドを使用してパッケージをインストールし、設定します：

```sh
node ace add @adonisjs/redis
```

:::disclosure{title="addコマンドによって実行されるステップを確認する"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/redis`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に次のサービスプロバイダを登録します。

    ```ts
    {
      providers: [
        // ...他のプロバイダ
        () => import('@adonisjs/redis/redis_provider')
      ]
    }
    ```

3. `config/redis.ts`ファイルを作成します。このファイルにはRedisサーバーの接続設定が含まれます。

4. 次の環境変数とそのバリデーションルールを定義します。

    ```dotenv
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    REDIS_PASSWORD=
    ```

:::


## 設定

Redisパッケージの設定は`config/redis.ts`ファイルに保存されます。

参照：[Config file stub](https://github.com/adonisjs/redis/blob/main/stubs/config/redis.stub)

```ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: '',
    },
  },
})

export default redisConfig
```

<dl>
<dt>

connection

<dt>

<dd>

`connection`プロパティはデフォルトで使用する接続を定義します。明示的な接続を選択せずにRedisコマンドを実行すると、デフォルトの接続に対して実行されます。

</dd>

<dt>

connections

<dt>

<dd>

`connections`プロパティは複数の名前付き接続のコレクションです。このオブジェクト内で1つ以上の接続を定義し、`redis.connection()`メソッドを使用してそれらの間を切り替えることができます。

名前付き接続の設定は、[ioredisが受け入れる設定](https://redis.github.io/ioredis/index.html#RedisOptions)と同じです。

</dd>
</dl>

---

### クラスタの設定

`@adonisjs/redis`パッケージは、接続設定内にホストの配列を定義すると[クラスタ接続](https://github.com/redis/ioredis#cluster)を作成します。例：

```ts
const redisConfig = defineConfig({
  connections: {
    main: {
      // ハイライト開始
      clusters: [
        { host: '127.0.0.1', port: 6380 },
        { host: '127.0.0.1', port: 6381 },
      ],
      clusterOptions: {
        scaleReads: 'slave',
        slotsRefreshTimeout: 10 * 1000,
      },
      // ハイライト終了
    },
  },
})
```

### Sentinelの設定
接続設定内にセンチネルノードの配列を定義することで、Redis接続をセンチネルを使用するように設定できます。例：

参照：[IORedis docs on Sentinels config](https://github.com/redis/ioredis?tab=readme-ov-file#sentinel)

```ts
const redisConfig = defineConfig({
  connections: {
    main: {
      // ハイライト開始
      sentinels: [
        { host: 'localhost', port: 26379 },
        { host: 'localhost', port: 26380 },
      ],
      name: 'mymaster',
      // ハイライト終了
    },
  },
})
```

## 使用方法

`config/redis.ts`ファイルで定義した設定を使用して、`redis`サービスを介してRedisコマンドを実行できます。`redis`サービスは、シングルトンオブジェクトであり、`config/redis.ts`ファイルで定義した設定を使用して構成されます。

:::note

利用可能なメソッドのリストを表示するには、[ioredis](https://redis.github.io/ioredis/classes/Redis.html)のドキュメントを参照してください。IORedisのラッパーであるため、コマンドAPIは同じです。

:::

```ts
import redis from '@adonisjs/redis/services/main'

await redis.set('username', 'virk')
const username = await redis.get('username')
```

### 接続の切り替え
`redis`サービスを使用して実行されるコマンドは、設定ファイルで定義された**デフォルトの接続**に対して実行されます。ただし、特定の接続でコマンドを実行するには、まずその接続のインスタンスを取得する必要があります。

`.connection()`メソッドは、プロセスのライフタイムにわたって接続インスタンスを作成してキャッシュします。

```ts
import redis from '@adonisjs/redis/services/main'

// ハイライト開始
// 接続インスタンスを取得
const redisMain = redis.connection('main')
// ハイライト終了

await redisMain.set('username', 'virk')
const username = await redisMain.get('username')
```

### 接続の終了

接続は長寿命であり、`.connection()`メソッドを呼び出すたびに同じインスタンスが返されます。`quit`メソッドを使用して接続を終了し、`disconnect`メソッドを使用して接続を強制的に終了できます。

```ts
import redis from '@adonisjs/redis/services/main'

await redis.quit('main') // メイン接続を終了
await redis.disconnect('main') // メイン接続を強制的に終了
```

```ts
import redis from '@adonisjs/redis/services/main'

const redisMain = redis.connection('main')
redisMain.quit() // 接続インスタンスを使用して終了
redisMain.disconnect() // 接続インスタンスを使用して強制終了
```

## エラーハンドリング

Redis接続は、アプリケーションのライフサイクル中にいつでも失敗する可能性があります。そのため、エラーをキャプチャし、リトライ戦略を持つことが重要です。

デフォルトでは、AdonisJSはRedis接続エラーを[アプリケーションロガー](../digging_deeper/logger.md)を使用してログに記録し、接続を永久に閉じる前に10回のリトライを行います。リトライ戦略は、`config/redis.ts`ファイル内の各接続に定義されています。

参照：[IORedis docs on auto reconnect](https://github.com/redis/ioredis#auto-reconnect)

```ts
// title: config/redis.ts
{
  main: {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT'),
    password: env.get('REDIS_PASSWORD', ''),
    // ハイライト開始
    retryStrategy(times) {
      return times > 10 ? null : times * 50
    },
    // ハイライト終了
  },
}
```

`.doNotLogErrors`メソッドを使用して、デフォルトのエラーレポーターを無効にできます。これにより、Redis接続から`error`イベントリスナーが削除されます。

```ts
import redis from '@adonisjs/redis/services/main'

/**
 * デフォルトのエラーレポーターを無効にする
 */
redis.doNotLogErrors()

redis.on('connection', (connection) => {
  /**
   * 常にエラーリスナーが定義されていることを確認してください。
   * そうしないと、アプリケーションがクラッシュします
   */
  connection.on('error', (error) => {
  console.log(error)
  })
})
```

## Pub/Sub

Redisは、チャネルにパブリッシュおよびサブスクライブするために複数の接続が必要です。サブスクライバ接続は、新しいチャネル/パターンの購読と購読解除以外の操作を実行することはできません。

`@adonisjs/redis`パッケージを使用する場合、サブスクライバ接続を手動で作成する必要はありません。最初に`subscribe`メソッドを呼び出すと、自動的に新しいサブスクライバ接続が作成されます。

```ts
import redis from '@adonisjs/redis/services/main'

redis.subscribe('user:add', function (message) {
  console.log(message)
})
```

### IORedisとAdonisJSのAPIの違い

`ioredis`を使用する場合、チャネルにサブスクライブして新しいメッセージを受信するために2つの異なるAPIを使用する必要があります。しかし、AdonisJSのラッパーでは、`subscribe`メソッドが両方を処理します。

:::caption{for="info"}
**IORedisを使用する場合**
:::

```ts
redis.on('message', (channel, messages) => {
  console.log(message)
})

redis.subscribe('user:add', (error, count) => {
  if (error) {
    console.log(error)
  }
})
```

:::caption{for="info"}
**AdonisJSを使用する場合**
:::

```ts
redis.subscribe('user:add', (message) => {
  console.log(message)
},
{
  onError(error) {
    console.log(error)
  },
  onSubscription(count) {
    console.log(count)
  },
})
```

### メッセージのパブリッシュ

`publish`メソッドを使用してメッセージをパブリッシュできます。最初のパラメータにチャネル名、2番目のパラメータにパブリッシュするデータを指定します。

```ts
redis.publish(
  'user:add',
  JSON.stringify({
    id: 1,
    username: 'virk',
  })
)
```

### パターンの購読

`psubscribe`メソッドを使用してパターンに購読できます。`subscribe`メソッドと同様に、サブスクライバ接続が作成されます（存在しない場合）。

```ts
redis.psubscribe('user:*', (channel, message) => {
  console.log(channel)
  console.log(message)
})

redis.publish(
  'user:add',
  JSON.stringify({
    id: 1,
    username: 'virk',
  })
)
```

### 購読の解除

`unsubscribe`メソッドおよび`punsubscribe`メソッドを使用してチャネルまたはパターンの購読を解除できます。

```ts
await redis.unsubscribe('user:add')
await redis.punsubscribe('user:*add*')
```

## Luaスクリプトの使用

RedisサービスにLuaスクリプトをコマンドとして登録し、すべての接続に適用できます。

参照：[IORedis docs on Lua Scripting](https://github.com/redis/ioredis#lua-scripting)

```ts
import redis from '@adonisjs/redis/services/main'

redis.defineCommand('release', {
  numberOfKeys: 2,
  lua: `
    redis.call('zrem', KEYS[2], ARGV[1])
    redis.call('zadd', KEYS[1], ARGV[2], ARGV[1])
    return true
  `,
})
```

コマンドを定義したら、`runCommand`メソッドを使用して実行できます。まず、すべてのキーを定義し、次に引数を指定します。

```ts
redis.runCommand(
  'release', // コマンド名
  'jobs:completed', // キー1
  'jobs:running', // キー2
  '11023', // argv 1
  100 // argv 2
)
```

同じコマンドを明示的な接続で実行することもできます。

```ts
redis.connection('jobs').runCommand(
  'release', // コマンド名
  'jobs:completed', // キー1
  'jobs:running', // キー2
  '11023', // argv 1
  100 // argv 2
)
```

最後に、特定の接続インスタンスでコマンドを定義することもできます。例：

```ts
redis.on('connection', (connection) => {
  if (connection.connectionName === 'jobs') {
    connection.defineCommand('release', {
      numberOfKeys: 2,
      lua: `
        redis.call('zrem', KEYS[2], ARGV[1])
        redis.call('zadd', KEYS[1], ARGV[2], ARGV[1])
        return true
      `,
    })
  }
})
```

## 引数と応答の変換

`redis.Command`プロパティを使用して、引数の変換関数と応答の変換関数を定義できます。APIは、[IORedis API](https://github.com/redis/ioredis#transforming-arguments--replies)と同じです。

```ts
// title: 引数の変換関数
import redis from '@adonisjs/redis/services/main'

redis.Command.setArgumentTransformer('hmset', (args) => {
  if (args.length === 2) {
    if (args[1] instanceof Map) {
      // utilsはioredisの内部モジュールです
      return [args[0], ...utils.convertMapToArray(args[1])]
    }
    if (typeof args[1] === 'object' && args[1] !== null) {
      return [args[0], ...utils.convertObjectToArray(args[1])]
    }
  }
  return args
})
```

```ts
// title: 応答の変換関数
import redis from '@adonisjs/redis/services/main'

redis.Command.setReplyTransformer('hgetall', (result) => {
  if (Array.isArray(result)) {
    const obj = {}
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1]
    }
    return obj
  }
  return result
})
```

## イベント

以下は、Redis接続インスタンスによって発行されるイベントのリストです。

### connect / subscriber\:connect
接続が確立されたときにイベントが発行されます。`subscriber:connect`イベントは、サブスクライバ接続が確立されたときに発行されます。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('connect', () => {})
  connection.on('subscriber:connect', () => {})
})
```

### wait
`lazyConnect`オプションが設定されているため、接続が`wait`モードになっているときに発行されます。最初のコマンドを実行すると、接続は`wait`状態から移動します。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('wait', () => {})
})
```

### ready / subscriber\:ready
`enableReadyCheck`フラグが有効になっている場合を除き、`connect`イベントの直後に発行されます。その場合、Redisサーバーがコマンドを受け付ける準備ができたと報告するまで待機します。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('ready', () => {})
  connection.on('subscriber:ready', () => {})
})
```

### error / subscriber\:error
Redisサーバーに接続できない場合に発行されます。接続エラーの処理方法については、[エラーハンドリング](#エラーハンドリング)を参照してください。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('error', () => {})
  connection.on('subscriber:error', () => {})
})
```

### close / subscriber\:close
接続が閉じられたときに発行されます。IORedisは、`close`イベントを発行した後、再接続を試みる場合があります（再接続戦略による）。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('close', () => {})
  connection.on('subscriber:close', () => {})
})
```

### reconnecting / subscriber\:reconnecting
`close`イベントの後、Redisサーバーに再接続しようとしているときに発行されます。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('reconnecting', ({ waitTime }) => {
    console.log(waitTime)
  })
  connection.on('subscriber:reconnecting', ({ waitTime }) => {
    console.log(waitTime)
  })
})
```

### end / subscriber\:end
接続が閉じられ、さらなる再接続は行われないときに発行されます。接続ライフサイクルの終了です。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('end', () => {})
  connection.on('subscriber:end', () => {})
})
```

### node\:added
新しいクラスターノードに接続されたときに発行されます（クラスターインスタンスにのみ適用されます）。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:added', () => {})
})
```

### node\:removed
クラスターノードが削除されたときに発行されます（クラスターインスタンスにのみ適用されます）。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:removed', () => {})
})
```

### node\:error
クラスターノードに接続できない場合に発行されます（クラスターインスタンスにのみ適用されます）。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('node:error', ({ error, address }) => {
    console.log(error, address)
  })
})
```

### subscription\:ready / psubscription\:ready
指定されたチャネルまたはパターンの購読が確立されたときに発行されます。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('subscription:ready', ({ count }) => {
    console.log(count)
  })
  connection.on('psubscription:ready', ({ count }) => {
    console.log(count)
  })
})
```

### subscription\:error / psubscription\:error
チャネルまたはパターンの購読に失敗したときに発行されます。

```ts
import redis from '@adonisjs/redis/services/main'

redis.on('connection', (connection) => {
  connection.on('subscription:error', () => {})
  connection.on('psubscription:error', () => {})
})
```
