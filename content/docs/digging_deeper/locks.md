---
summary: AdonisJSアプリケーションでアトミックロックを管理するために`@adonisjs/lock`パッケージを使用します。
---

# アトミックロック

アトミックロック（別名`mutex`）は、共有リソースへのアクセスを同期するために使用されます。つまり、複数のプロセスまたは並行コードが同時にコードの一部を実行するのを防ぎます。

AdonisJSチームは、フレームワークに依存しないパッケージである[Verrou](https://github.com/Julien-R44/verrou)を作成しました。`@adonisjs/lock`パッケージはこのパッケージに基づいていますので、**詳細については[Verrouのドキュメント](https://verrou.dev/docs/introduction)も読んでください。**

## インストール

次のコマンドを使用してパッケージをインストールおよび設定します：

```sh
node ace add @adonisjs/lock
```

:::disclosure{title="addコマンドによって実行される手順を参照"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/lock`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に次のサービスプロバイダを登録します。
    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/lock/lock_provider')
      ]
    }
    ```

3. `config/lock.ts`ファイルを作成します。

4. `start/env.ts`ファイル内で、次の環境変数とそのバリデーションを定義します。
   ```ts
   LOCK_STORE=redis
   ```

5. `database`ストアを使用する場合は、`locks`テーブルのデータベースマイグレーションを作成することもできます（オプション）。

:::

## 設定
ロックの設定は`config/lock.ts`ファイルに保存されます。

```ts
import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/lock'

const lockConfig = defineConfig({
  default: env.get('LOCK_STORE'),
  stores: {
    redis: stores.redis({}),

    database: stores.database({
      tableName: 'locks',
    }),

    memory: stores.memory()
  },
})

export default lockConfig

declare module '@adonisjs/lock/types' {
  export interface LockStoresList extends InferLockStores<typeof lockConfig> {}
}
```


<dl>

<dt>

default

</dt>

<dd>

ロックを管理するために使用する`default`ストア。ストアは同じ設定ファイル内の`stores`オブジェクトで定義されます。

</dd>

<dt>

stores

</dt>

<dd>

アプリケーション内で使用するストアのコレクション。テスト中に使用できるように常に`memory`ストアを設定することをおすすめします。

</dd>

</dl>

---


### 環境変数
デフォルトのロックストアは`LOCK_STORE`環境変数を使用して定義されており、したがって、異なるストアを異なる環境で切り替えることができます。たとえば、テスト中に`memory`ストアを使用し、開発および本番環境では`redis`ストアを使用します。

また、環境変数は事前に設定されたストアのいずれかを許可するようにバリデーションする必要があります。バリデーションは`start/env.ts`ファイル内で`Env.schema.enum`ルールを使用して定義されます。

```ts
{
  LOCK_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),
}
```

### Redisストア
`redis`ストアは`@adonisjs/redis`パッケージに依存しているため、Redisストアを使用する前にこのパッケージを設定する必要があります。

Redisストアが受け入れるオプションのリストは次のとおりです：

```ts
{
  redis: stores.redis({
    connectionName: 'main',
  }),
}
```

<dl>
<dt>
connectionName
</dt>
<dd>

`connectionName`プロパティは、`config/redis.ts`ファイルで定義された接続を参照します。

</dd>
</dl>

### データベースストア

`database`ストアは`@adonisjs/lucid`パッケージに依存しているため、データベースストアを使用する前にこのパッケージを設定する必要があります。

データベースストアが受け入れるオプションのリストは次のとおりです：

```ts
{
  database: stores.database({
    connectionName: 'postgres',
    tableName: 'my_locks',
  }),
}
```

<dl>

<dt>

connectionName

</dt>

<dd>

`config/database.ts`ファイルで定義されたデータベース接続への参照。定義されていない場合は、デフォルトのデータベース接続を使用します。

</dd>

<dt>

tableName

</dt>

<dd>

レート制限を保存するために使用するデータベーステーブル。

</dd>

</dl>

### メモリストア

`memory`ストアは、テスト目的だけでなく、現在のプロセスにのみ有効で、複数のプロセス間で共有されないロックが必要な場合に便利なシンプルなインメモリストアです。

メモリストアは[`async-mutex`](https://www.npmjs.com/package/async-mutex)パッケージをベースにしています。

```ts
{
  memory: stores.memory(),
}
```

## リソースのロック

ロックストアを設定したら、アプリケーション内のどこでもリソースを保護するためにロックを使用できます。

以下は、リソースを保護するためにロックを使用する簡単な例です。


:::codegroup

```ts
// title: 手動ロック
import { errors } from '@adonisjs/lock'
import locks from '@adonisjs/lock/services/main'
import { HttpContext } from '@adonisjs/core/http'

export default class OrderController {
  async process({ response, request }: HttpContext) {
    const orderId = request.input('order_id')

    /**
     * ロックを即座に取得しようとします（再試行なし）
     */
    const lock = locks.createLock(`order.processing.${orderId}`)
    const acquired = await lock.acquireImmediately()
    if (!acquired) {
      return 'オーダーは既に処理中です'
    }

    /**
     * ロックが取得されました。オーダーを処理できます
     */
    try {
      await processOrder()
      return 'オーダーは正常に処理されました'
    } finally {
      /**
       * ロックを解放するために`finally`ブロックを使用することで、
       * 処理中に例外がスローされてもロックが解放されることを確認します。
       */
      await lock.release()
    }
  }
}
```

```ts
// title: 自動ロック
import { errors } from '@adonisjs/lock'
import locks from '@adonisjs/lock/services/main'
import { HttpContext } from '@adonisjs/core/http'

export default class OrderController {
  async process({ response, request }: HttpContext) {
    const orderId = request.input('order_id')

    /**
     * ロックが利用可能な場合にのみ関数を実行します
     * 関数が実行された後、ロックは自動的に解放されます
     */
    const [executed, result] = await locks
      .createLock(`order.processing.${orderId}`)
      .runImmediately(async (lock) => {
        /**
         * ロックが取得されました。オーダーを処理できます
         */
        await processOrder()
        return 'オーダーは正常に処理されました'
      })

    /**
     * ロックが取得できず、関数が実行されなかった場合
     */
    if (!executed) return 'オーダーは既に処理中です'

    return result
  }
}
```

:::

これは、アプリケーション内でロックを使用する方法の簡単な例です。

`extend`メソッドを使用してロックの期間を延長したり、`getRemainingTime`メソッドを使用してロックの有効期限までの残り時間を取得したり、ロックを設定するためのオプションなど、他の多くのメソッドも利用できます。

**そのため、詳細については[Verrouのドキュメント](https://verrou.dev/docs/introduction)を必ず読んでください**。`@adonisjs/lock`パッケージは`Verrou`パッケージに基づいているため、Verrouのドキュメントで読んだ内容は`@adonisjs/lock`パッケージにも適用されます。

## 別のストアの使用

`config/lock.ts`ファイル内で複数のストアを定義した場合、`use`メソッドを使用して特定のロックに異なるストアを使用できます。

```ts
import locks from '@adonisjs/lock/services/main'

const lock = locks.use('redis').createLock('order.processing.1')
```

`default`ストアのみを使用する場合は、`use`メソッドを省略できます。

```ts
import locks from '@adonisjs/lock/services/main'

const lock = locks.createLock('order.processing.1')
```

## 複数のプロセス間でのロックの管理

場合によっては、ロックを作成および取得するプロセスと、ロックを解放する別のプロセスを持ちたい場合があります。たとえば、Webリクエスト内でロックを取得し、バックグラウンドジョブ内でロックを解放したい場合があります。これは、`restoreLock`メソッドを使用して実現できます。

```ts
// title: メインサーバー
import locks from '@adonisjs/lock/services/main'

export class OrderController {
  async process({ response, request }: HttpContext) {
    const orderId = request.input('order_id')

    const lock = locks.createLock(`order.processing.${orderId}`)
    await lock.acquire()

    /**
     * オーダーを処理するためにバックグラウンドジョブをディスパッチします。
     * 
     * ジョブがオーダーの処理が完了した後、ロックを解放するためにシリアライズされたロックをジョブに渡します。
     */
    queue.dispatch('app/jobs/process_order', {
      lock: lock.serialize()
    })
  }
}
```

```ts
// title: バックグラウンドジョブ
import locks from '@adonisjs/lock/services/main'

export class ProcessOrder {
  async handle({ lock }) {
    /**
     * シリアライズされたバージョンからロックを復元しています
     */
    const handle = locks.restoreLock(lock)

    /**
     * オーダーを処理します
     */
    await processOrder()

    /**
     * ロックを解放します
     */
    await handle.release()
  }
}
```

## テスト

テスト中は、ロックを取得するために実際のネットワークリクエストを行わないために、`memory`ストアを使用することができます。これは、`.env.testing`ファイル内で`LOCK_STORE`環境変数を`memory`に設定することで行うことができます。

```env
// title: .env.test
LOCK_STORE=memory
```

## カスタムロックストアの作成

まず、カスタムロックストアの作成については、[Verrouのドキュメント](https://verrou.dev/docs/custom-lock-store)を参照してください。AdonisJSでは、ほぼ同じです。

まず、`LockStore`インターフェイスを実装するクラスを作成する必要があります。

```ts
import type { LockStore } from '@adonisjs/lock/types'

class NoopStore implements LockStore {
  /**
   * ロックをストアに保存します。
   * このメソッドは、指定されたキーが既にロックされている場合はfalseを返す必要があります。
   *
   * @param key ロックするキー
   * @param owner オーナー
   * @param ttl ロックの有効期限（ミリ秒）。nullの場合は期限なし
   *
   * @returns ロックが取得された場合はtrue、それ以外の場合はfalse
   */
  async save(key: string, owner: string, ttl: number | null): Promise<boolean> {
    return false
  }

  /**
   * オーナーが指定された場合にのみ、ストアからロックを削除します。
   * それ以外の場合はE_LOCK_NOT_OWNEDエラーをスローする必要があります。
   *
   * @param key 削除するキー
   * @param owner オーナー
   */
  async delete(key: string, owner: string): Promise<void> {
    return false
  }

  /**
   * オーナーを確認せずにストアからロックを強制的に削除します。
   */
  async forceDelete(key: string): Promise<Void> {
    return false
  }

  /**
   * ロックが存在するかどうかをチェックします。存在する場合はtrue、それ以外の場合はfalseを返します。
   */
  async exists(key: string): Promise<boolean> {
    return false
  }

  /**
   * ロックの有効期限を延長します。ロックが指定されたオーナーによって所有されていない場合はエラーをスローします。
   * 期間はミリ秒単位です。
   */
  async extend(key: string, owner: string, duration: number): Promise<void> {
    return false
  }
}
```

### ストアファクトリの定義

ストアを作成したら、`@adonisjs/lock`がストアのインスタンスを作成するために使用する単純なファクトリ関数を定義する必要があります。

```ts
function noopStore(options: MyNoopStoreConfig) {
  return { driver: { factory: () => new NoopStore(options) } }
}
```

### カスタムストアの使用

完了したら、`noopStore`関数を次のように使用できます：

```ts
import { defineConfig } from '@adonisjs/lock'

const lockConfig = defineConfig({
  default: 'noop',
  stores: {
    noop: noopStore({}),
  },
})
```
