---
summary: プロダクション環境でアプリケーションを監視し、スムーズに動作していることを確認する方法を学びます
---

# ヘルスチェック

ヘルスチェックは、プロダクション環境でアプリケーションが健全な状態で実行されていることを確認するために行われます。これには、サーバー上の**利用可能なディスクスペース**、アプリケーションが消費する**メモリ**、または**データベース接続のテスト**などが含まれる場合があります。

AdonisJSでは、いくつかの組み込みの[ヘルスチェック](#利用可能なヘルスチェック)と[カスタムヘルスチェック](#カスタムヘルスチェックの作成)の作成と登録の機能が提供されています。

## ヘルスチェックの設定

次のコマンドを実行することで、アプリケーションでヘルスチェックを設定できます。このコマンドは`start/health.ts`ファイルを作成し、**メモリ使用量**と**使用済みディスクスペース**のヘルスチェックを設定します。このファイルを自由に編集して、追加のヘルスチェックを削除または追加してください。

:::note

以下のコマンドを使用する前に、`@adonisjs/core@6.12.1`がインストールされていることを確認してください。

:::

```sh
node ace configure health_checks
```

```ts
// title: start/health.ts
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
])
```

## エンドポイントの公開

ヘルスチェックを実行するための一般的な方法は、外部のモニタリングサービスがヘルスチェック結果を収集するためにpingできるHTTPエンドポイントを公開することです。

そこで、`start/routes.ts`ファイル内にルートを定義し、`HealthChecksController`をバインドしましょう。`health_checks_controller.ts`ファイルは初期セットアップ時に作成され、`app/controllers`ディレクトリ内に存在します。

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'
const HealthChecksController = () => import('#controllers/health_checks_controller')

router.get('/health', [HealthChecksController])
```

### サンプルレポート

`healthChecks.run`メソッドは、すべてのチェックを実行し、詳細な[JSONオブジェクトとしてのレポート](https://github.com/adonisjs/health/blob/develop/src/types.ts#L36)を返します。レポートには以下のプロパティが含まれます。

```json
{
  "isHealthy": true,
  "status": "warning",
  "finishedAt": "2024-06-20T07:09:35.275Z",
  "debugInfo": {
    "pid": 16250,
    "ppid": 16051,
    "platform": "darwin",
    "uptime": 16.271809083,
    "version": "v21.7.3"
  },
  "checks": [
    {
      "name": "ディスクスペースチェック",
      "isCached": false,
      "message": "ディスク使用量は75%を超えており、しきい値を超えています",
      "status": "warning",
      "finishedAt": "2024-06-20T07:09:35.275Z",
      "meta": {
        "sizeInPercentage": {
          "used": 76,
          "failureThreshold": 80,
          "warningThreshold": 75
        }
      }
    },
    {
      "name": "メモリヒープチェック",
      "isCached": false,
      "message": "ヒープ使用量は定義されたしきい値を下回っています",
      "status": "ok",
      "finishedAt": "2024-06-20T07:09:35.265Z",
      "meta": {
        "memoryInBytes": {
          "used": 41821592,
          "failureThreshold": 314572800,
          "warningThreshold": 262144000
        }
      }
    }
  ]
}
```

<dl>

<dt>

isHealthy

</dt>

<dd>

すべてのチェックが成功したかどうかを示すブール値です。1つ以上のチェックが失敗した場合、値は`false`に設定されます。

</dd>

<dt>

status

</dt>

<dd>

すべてのチェックを実行した後のレポートのステータスです。次のいずれかになります。

- `ok`：すべてのチェックが正常に完了しました。
- `warning`：1つ以上のチェックが警告を報告しました。
- `error`：1つ以上のチェックが失敗しました。

</dd>

<dt>

finishedAt

</dt>

<dd>

テストが完了した日時。

</dd>

<dt>

checks

</dt>

<dd>

実行されたすべてのチェックの詳細なレポートを含むオブジェクトの配列です。

</dd>

<dt>

debugInfo

</dt>

<dd>

デバッグ情報は、プロセスとその実行時間を識別するために使用できます。次のプロパティが含まれます。

- `pid`：プロセスID。
- `ppid`：AdonisJSアプリケーションプロセスを管理する親プロセスのプロセスID。
- `platform`：アプリケーションが実行されているプラットフォーム。
- `uptime`：アプリケーションの実行時間（秒単位）。
- `version`：Node.jsのバージョン。

</dd>

</dl>

### エンドポイントの保護
`/health`エンドポイントを公開アクセスから保護するには、認証ミドルウェアを使用するか、リクエストヘッダー内の特定のAPIシークレットをチェックするカスタムミドルウェアを作成できます。

例:
```ts
import router from '@adonisjs/core/services/router'
const HealthChecksController = () => import('#controllers/health_checks_controller')

router
  .get('/health', [HealthChecksController])
  // insert-start
  .use(({ request, response }, next) => {
    if (request.header('x-monitoring-secret') === 'some_secret_value') {
      return next()
    }
    response.unauthorized({ message: 'Unauthorized access' })
  })
  // insert-end
```

## 利用可能なヘルスチェック

`start/health.ts`ファイル内で設定できる利用可能なヘルスチェックのリストは以下の通りです。

### ディスクスペースチェック

`DiskSpaceCheck`は、サーバー上の使用済みディスクスペースを計算し、特定のしきい値を超えた場合に警告/エラーを報告します。

```ts
import { HealthChecks, DiskSpaceCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck()
])
```

デフォルトでは、警告のしきい値は75%に設定され、エラーのしきい値は80%に設定されています。ただし、カスタムのしきい値を定義することもできます。

```ts
export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck()
    // highlight-start
    .warnWhenExceeds(80) // 80%を超えた場合に警告
    .failWhenExceeds(90), // 90%を超えた場合にエラー
  // highlight-end
])
```

### メモリヒープチェック

`MemoryHeapCheck`は、[process.memoryUsage()](https://nodejs.org/api/process.html#processmemoryusage)メソッドによって報告されるヒープサイズを監視し、特定のしきい値を超えた場合に警告/エラーを報告します。

```ts
import { HealthChecks, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new MemoryHeapCheck()
])
```

デフォルトでは、警告のしきい値は**250MB**に設定され、エラーのしきい値は**300MB**に設定されています。ただし、カスタムのしきい値を定義することもできます。

```ts
export const healthChecks = new HealthChecks().register([
  new MemoryHeapCheck()
    // highlight-start
    .warnWhenExceeds('300 mb')
    .failWhenExceeds('700 mb'),
  // highlight-end
])
```

### メモリRSSチェック

`MemoryRSSCheck`は、[process.memoryUsage()](https://nodejs.org/api/process.html#processmemoryusage)メソッドによって報告されるResident Set Sizeを監視し、特定のしきい値を超えた場合に警告/エラーを報告します。

```ts
import { HealthChecks, MemoryRSSCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new MemoryRSSCheck()
])
```

デフォルトでは、警告のしきい値は**320MB**に設定され、エラーのしきい値は**350MB**に設定されています。ただし、カスタムのしきい値を定義することもできます。

```ts
export const healthChecks = new HealthChecks().register([
  new MemoryRSSCheck()
    // highlight-start
    .warnWhenExceeds('600 mb')
    .failWhenExceeds('800 mb'),
  // highlight-end
])
```

### DbCheck
`DbCheck`は、SQLデータベースとの接続を監視するために`@adonisjs/lucid`パッケージによって提供されます。以下のようにインポートして使用できます。

```ts
// insert-start
import db from '@adonisjs/lucid/services/db'
import { DbCheck } from '@adonisjs/lucid/database'
// insert-end
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  // insert-start
  new DbCheck(db.connection()),
  // insert-end
])
```

以下は、データベースヘルスチェックの例のレポートです。

```json
// title: サンプルレポート
{
  "name": "データベースヘルスチェック (postgres)",
  "isCached": false,
  "message": "データベースサーバーへの接続に成功しました",
  "status": "ok",
  "finishedAt": "2024-06-20T07:18:23.830Z",
  "meta": {
    "connection": {
      "name": "postgres",
      "dialect": "postgres"
    }
  }
}
```

`DbCheck`クラスは、監視するためのデータベース接続を受け入れます。複数の接続を監視する場合は、各接続ごとにこのチェックを複数回登録してください。例:

```ts
// title: 複数の接続の監視
export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  // insert-start
  new DbCheck(db.connection()),
  new DbCheck(db.connection('mysql')),
  new DbCheck(db.connection('pg')),
  // insert-end
])
```

### DbConnectionCountCheck
`DbConnectionCountCheck`は、データベースサーバー上のアクティブな接続を監視し、特定のしきい値を超えた場合に警告/エラーを報告します。このチェックは**PostgreSQL**と**MySQL**データベースのみサポートされています。

```ts
import db from '@adonisjs/lucid/services/db'
// insert-start
import { DbCheck, DbConnectionCountCheck } from '@adonisjs/lucid/database'
// insert-end
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  new DbCheck(db.connection()),
  // insert-start
  new DbConnectionCountCheck(db.connection())
  // insert-end
])
```

以下は、データベース接続数のヘルスチェックの例のレポートです。

```json
// title: サンプルレポート
{
  "name": "接続数ヘルスチェック (postgres)",
  "isCached": false,
  "message": "アクティブな接続は6つあり、定義されたしきい値を下回っています",
  "status": "ok",
  "finishedAt": "2024-06-20T07:30:15.840Z",
  "meta": {
    "connection": {
      "name": "postgres",
      "dialect": "postgres"
    },
    "connectionsCount": {
      "active": 6,
      "warningThreshold": 10,
      "failureThreshold": 15
    }
  }
}
```

デフォルトでは、警告のしきい値は**10接続**に設定され、エラーのしきい値は**15接続**に設定されています。ただし、カスタムのしきい値を定義することもできます。

```ts
new DbConnectionCountCheck(db.connection())
  .warnWhenExceeds(4)
  .failWhenExceeds(10)
```

### RedisCheck
`RedisCheck`は、Redisデータベース（クラスターを含む）との接続を監視するために`@adonisjs/redis`パッケージによって提供されます。以下のようにインポートして使用できます。

```ts
// insert-start
import redis from '@adonisjs/redis/services/main'
import { RedisCheck } from '@adonisjs/redis'
// insert-end
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  // insert-start
  new RedisCheck(redis.connection()),
  // insert-end
])
```

以下は、Redisデータベースのヘルスチェックの例のレポートです。

```json
// title: サンプルレポート
{
  "name": "Redisヘルスチェック (main)",
  "isCached": false,
  "message": "Redisサーバーへの接続に成功しました",
  "status": "ok",
  "finishedAt": "2024-06-22T05:37:11.718Z",
  "meta": {
    "connection": {
      "name": "main",
      "status": "ready"
    }
  }
}
```

`RedisCheck`クラスは、モニタリングするためのredis接続を受け入れます。複数の接続を監視する場合は、各接続ごとにこのチェックを複数回登録してください。例:

```ts
// title: 複数の接続の監視
export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  // insert-start
  new RedisCheck(redis.connection()),
  new RedisCheck(redis.connection('cache')),
  new RedisCheck(redis.connection('locks')),
  // insert-end
])
```

### RedisMemoryUsageCheck
`RedisMemoryUsageCheck`は、redisサーバーのメモリ消費量を監視し、特定のしきい値を超えた場合に警告/エラーを報告します。

```ts
import redis from '@adonisjs/redis/services/main'
// insert-start
import { RedisCheck, RedisMemoryUsageCheck } from '@adonisjs/redis'
// insert-end
import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  new RedisCheck(redis.connection()),
  // insert-start
  new RedisMemoryUsageCheck(redis.connection())
  // insert-end
])
```

以下は、redisメモリ使用量のヘルスチェックの例のレポートです。

```json
// title: サンプルレポート
{
  "name": "Redisメモリ消費量のヘルスチェック (main)",
  "isCached": false,
  "message": "Redisメモリ使用量は1.06MBで、定義されたしきい値を下回っています",
  "status": "ok",
  "finishedAt": "2024-06-22T05:36:32.524Z",
  "meta": {
    "connection": {
      "name": "main",
      "status": "ready"
    },
    "memoryInBytes": {
      "used": 1109616,
      "warningThreshold": 104857600,
      "failureThreshold": 125829120
    }
  }
}
```

デフォルトでは、警告のしきい値は**100MB**に設定され、エラーのしきい値は**120MB**に設定されています。ただし、カスタムのしきい値を定義することもできます。

```ts
new RedisMemoryUsageCheck(db.connection())
  .warnWhenExceeds('200MB')
  .failWhenExceeds('240MB')
```

## 結果のキャッシュ

ヘルスチェックは、`healthChecks.run`メソッド（つまり`/health`エンドポイントへのアクセス）を呼び出すたびに実行されます。`/health`エンドポイントを頻繁にpingしたい場合でも、特定のチェックを毎回実行するのを避けることができます。

たとえば、ディスクスペースを1分ごとに監視することはあまり役に立ちませんが、メモリを1分ごとに追跡することは役に立ちます。

したがって、登録する個々のヘルスチェックの結果をキャッシュできます。

例:
```ts
import {
  HealthChecks,
  MemoryRSSCheck,
  DiskSpaceCheck,
  MemoryHeapCheck,
} from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  // highlight-start
  new DiskSpaceCheck().cacheFor('1 hour'),
  // highlight-end
  new MemoryHeapCheck(), // キャッシュしない
  new MemoryRSSCheck(), // キャッシュしない
])
```

## カスタムヘルスチェックの作成

`HealthCheckContract`インターフェイスに準拠するJavaScriptクラスとしてカスタムヘルスチェックを作成できます。プロジェクトまたはパッケージ内の任意の場所でヘルスチェックを定義し、`start/health.ts`ファイル内でインポートして登録できます。

```ts
import { Result, BaseCheck } from '@adonisjs/core/health'
import type { HealthCheckResult } from '@adonisjs/core/types/health'

export class ExampleCheck extends BaseCheck {
  async run(): Promise<HealthCheckResult> {
    /**
     * 以下のチェックは参考用です
     */
    if (checkPassed) {
      return Result.ok('表示する成功メッセージ')
    }
    if (checkFailed) {
      return Result.failed('エラーメッセージ', errorIfAny)
    }
    if (hasWarning) {
      return Result.warning('警告メッセージ')
    }
  }
}
```

上記の例のように、[Result](https://github.com/adonisjs/health/blob/develop/src/result.ts)クラスを使用してヘルスチェック結果を作成できます。オプションで、以下のように結果のメタデータをマージすることもできます。

```ts
Result.ok('データベース接続は正常です').mergeMetaData({
  connection: {
    dialect: 'pg',
    activeCount: connections,
  },
})
```

### カスタムヘルスチェックの登録
`start/health.ts`ファイル内でカスタムヘルスチェッククラスをインポートし、新しいクラスインスタンスを作成して登録できます。

```ts
// highlight-start
import { ExampleCheck } from '../app/health_checks/example.js'
// highlight-end

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck().cacheFor('1 hour'),
  new MemoryHeapCheck(),
  new MemoryRSSCheck(),
  // highlight-start
  new ExampleCheck()
  // highlight-end
])
```
