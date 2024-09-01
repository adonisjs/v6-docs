---
summary: AdonisJSのロガーを使用して、コンソール、ファイル、外部サービスにログを書き込む方法を学びます。ロガーは高速で、複数のターゲットをサポートしています。
---

# Logger

AdonisJSには、**ファイル**、**標準出力**、**外部のログサービス**にログを書き込むための組み込みのロガーがあります。内部では、[pino](https://getpino.io/#/ja/)を使用しています。Pinoは、Node.jsエコシステムで最も高速なログライブラリの1つであり、[NDJSON形式](https://github.com/ndjson/ndjson-spec)でログを生成します。

## 使用方法

まず、アプリケーション内のどこからでもログを書き込むために、Loggerサービスをインポートすることができます。ログは`stdout`に書き込まれ、ターミナルに表示されます。

```ts
import logger from '@adonisjs/core/services/logger'

logger.info('これは情報メッセージです')
logger.error({ err: error }, '何かが間違っています')
```

HTTPリクエスト中には、`ctx.logger`プロパティを使用することを推奨します。HTTPコンテキストには、現在のリクエストIDがすべてのログステートメントに追加されるリクエスト対応のロガーのインスタンスが含まれています。

```ts
import router from '@adonisjs/core/services/router'
import User from '#models/user'

router.get('/users/:id', async ({ logger, params }) => {
  logger.info('ID %sのユーザーを取得しています', params.id)
  const user = await User.find(params.id)
})
```

## 設定

ロガーの設定は、`config/logger.ts`ファイルに保存されます。デフォルトでは、1つのロガーのみが設定されています。ただし、アプリケーションで複数のロガーを使用する場合は、複数のロガーの設定を定義することもできます。


```ts
// title: config/logger.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/core/logger'

export default defineConfig({
  default: 'app',
  
  loggers: {
    app: {
      enabled: true,
      name: Env.get('APP_NAME'),
      level: Env.get('LOG_LEVEL', 'info')
    },
  }
})
```

<dl>
<dt>

default

<dt>

<dd>

`default`プロパティは、同じファイル内の`loggers`オブジェクトの設定されたロガーの参照です。

デフォルトのロガーは、ロガーAPIを使用する際に特定のロガーを選択しない限り、ログを書き込むために使用されます。

</dd>

<dt>

loggers

<dt>

<dd>

`loggers`オブジェクトは、複数のロガーを設定するためのキーと値のペアです。キーはロガーの名前であり、値は[pino](https://getpino.io/#/ja/docs/api?id=options)で受け入れられる設定オブジェクトです。

</dd>
</dl>



## トランスポートターゲット
Pinoのトランスポートは、ログを送信先に書き込む重要な役割を果たします。設定ファイル内で[複数のターゲット](https://getpino.io/#/ja/docs/api?id=transport-object)を構成し、pinoはそれらすべてにログを配信します。各ターゲットは、ログを受け取るために受け入れたいレベルを指定することもできます。

:::note

ターゲットの設定内で`level`を定義していない場合、設定されたターゲットは親ロガーからそれを継承します。

この動作はPinoとは異なります。Pinoでは、ターゲットは親ロガーからレベルを継承しません。

:::

```ts
{
  loggers: {
    app: {
      enabled: true,
      name: Env.get('APP_NAME'),
      level: Env.get('LOG_LEVEL', 'info'),
      
      // highlight-start
      transport: {
        targets: [
          {
            target: 'pino/file',
            level: 'info',
            options: {
              destination: 1
            }
          },
          {
            target: 'pino-pretty',
            level: 'info',
            options: {}
          },
        ]
      }
      // highlight-end
    }
  }
}
```

<dl>
<dt>

ファイルターゲット

<dt>

<dd>

`pino/file`ターゲットは、ログをファイルディスクリプタに書き込みます。`destination = 1`は、ログを`stdout`に書き込むことを意味します（これは標準の[UNIXのファイルディスクリプタの規則](https://en.wikipedia.org/wiki/File_descriptor)です）。

</dd>

<dt>

Prettyターゲット

<dt>

<dd>

`pino-pretty`ターゲットは、[pino-pretty npmモジュール](http://npmjs.com/package/pino-pretty)を使用してログをファイルディスクリプタにきれいに表示します。

</dd>
</dl>

## 条件付きでターゲットを定義する

コードが実行される環境に基づいてターゲットを登録することは一般的です。たとえば、開発環境では`pino-pretty`ターゲットを使用し、本番環境では`pino/file`ターゲットを使用する場合などです。

以下のように、条件付きで`targets`配列を構築すると、設定ファイルが見づらくなります。

```ts
import app from '@adonisjs/core/services/app'

loggers: {
  app: {
    transport: {
      targets: [
        ...(!app.inProduction
          ? [{ target: 'pino-pretty', level: 'info' }]
          : []
        ),
        ...(app.inProduction
          ? [{ target: 'pino/file', level: 'info' }]
          : []
        ),
      ]
    }
  } 
}
```

したがって、`targets.pushIf`メソッドを使用して、条件付きの配列アイテムを定義することができます。次の例では、`targets.pushIf`メソッドを使用して同じ条件を表現しています。

```ts
import { targets, defineConfig } from '@adonisjs/core/logger'

loggers: {
  app: {
    transport: {
      targets: targets()
       .pushIf(
         !app.inProduction,
         { target: 'pino-pretty', level: 'info' }
       )
       .pushIf(
         app.inProduction,
         { target: 'pino/file', level: 'info' }
       )
       .toArray()
    }
  } 
}
```

さらにコードを簡素化するために、`targets.pretty`メソッドと`targets.file`メソッドを使用して、`pino/file`と`pino-pretty`のターゲットのための設定オブジェクトを定義することもできます。

```ts
import { targets, defineConfig } from '@adonisjs/core/logger'

loggers: {
  app: {
    transport: {
      targets: targets()
       .pushIf(app.inDev, targets.pretty())
       .pushIf(app.inProduction, targets.file())
       .toArray()
    }
  }
}
```

## 複数のロガーを使用する

AdonisJSは、複数のロガーを設定するための一流のサポートを提供しています。ロガーの一意の名前と設定は、`config/logger.ts`ファイルで定義されます。

```ts
export default defineConfig({
  default: 'app',
  
  loggers: {
    // highlight-start
    app: {
      enabled: true,
      name: Env.get('APP_NAME'),
      level: Env.get('LOG_LEVEL', 'info')
    },
    payments: {
      enabled: true,
      name: 'payments',
      level: Env.get('LOG_LEVEL', 'info')
    },
    // highlight-start
  }
})
```

設定が完了したら、`logger.use`メソッドを使用して名前付きのロガーにアクセスできます。

```ts
import logger from '@adonisjs/core/services/logger'

logger.use('payments')
logger.use('app')

// デフォルトのロガーのインスタンスを取得する
logger.use()
```

## 依存性の注入

依存性の注入を使用する場合、`Logger`クラスを依存関係として型指定することができます。すると、IoCコンテナは設定ファイルで定義されたデフォルトのロガーのインスタンスを解決します。

クラスがHTTPリクエスト中に構築される場合、コンテナはリクエスト対応のLoggerのインスタンスを注入します。

```ts
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

// highlight-start
@inject()
// highlight-end
class UserService {
  // highlight-start
  constructor(protected logger: Logger) {}
  // highlight-end

  async find(userId: string | number) {
    this.logger.info('ID %sのユーザーを取得しています', userId)
    const user = await User.find(userId)
  }
}
```

## ロギングメソッド

Logger APIは、Pinoとほぼ同じですが、AdonisJSのロガーはイベントエミッターのインスタンスではありません（Pinoはイベントエミッターのインスタンスです）。それ以外の点では、ログのメソッドはpinoと同じAPIを持っています。

```ts
import logger from '@adonisjs/core/services/logger'

logger.trace(config, '設定を使用しています')
logger.debug('ユーザーの詳細: %o', { username: 'virk' })
logger.info('こんにちは %s', '世界')
logger.warn('データベースに接続できません')
logger.error({ err: Error }, '何かが間違っています')
logger.fatal({ err: Error }, '何かが間違っています')
```

追加のマージオブジェクトを最初の引数として渡すこともできます。その場合、オブジェクトのプロパティは出力JSONに追加されます。

```ts
logger.info({ user: user }, 'ID %sのユーザーを取得しました', user.id)
```

エラーを表示するには、[`err`キーを使用](https://getpino.io/#/ja/docs/api?id=serializers-object)してエラー値を指定できます。

```ts
logger.error({ err: error }, 'ユーザーを検索できません')
```

## 条件付きでログを出力する

ロガーは、設定ファイルで設定されたレベル以上のログを生成します。たとえば、レベルが`warn`に設定されている場合、`info`、`debug`、`trace`レベルのログは無視されます。

ログメッセージのデータを計算するのにコストがかかる場合は、指定したログレベルが有効かどうかを事前にチェックする必要があります。

```ts
import logger from '@adonisjs/core/services/logger'

if (logger.isLevelEnabled('debug')) {
  const data = await getLogData()
  logger.debug(data, 'デバッグメッセージ')
}
```

同じ条件を`ifLevelEnabled`メソッドを使用して表現することもできます。このメソッドは、指定したログレベルが有効な場合に実行されるコールバックを2番目の引数として受け入れます。

```ts
logger.ifLevelEnabled('debug', async () => {
  const data = await getLogData()
  logger.debug(data, 'デバッグメッセージ')
})
```

## 子ロガー

子ロガーは、親ロガーから設定とバインディングを継承した独立したインスタンスです。

子ロガーのインスタンスは、`logger.child`メソッドを使用して作成できます。メソッドは、最初の引数としてバインディング、2番目の引数としてオプションの設定オブジェクトを受け入れます。

```ts
import logger from '@adonisjs/core/services/logger'

const requestLogger = logger.child({ requestId: ctx.request.id() })
```

子ロガーは、異なるログレベルでログを記録することもできます。

```ts
logger.child({}, { level: 'warn' })
```

## Pinoの静的メソッド

[Pinoの静的メソッド](https://getpino.io/#/ja/docs/api?id=statics)とプロパティは、`@adonisjs/core/logger`モジュールからエクスポートされます。

```ts
import { 
  multistream,
  destination,
  transport,
  stdSerializers,
  stdTimeFunctions,
  symbols,
  pinoVersion
} from '@adonisjs/core/logger'
```

## ログをファイルに書き込む

Pinoには、ログをファイルに書き込むための`pino/file`ターゲットが付属しています。ターゲットのオプション内でログファイルの宛先パスを指定できます。

```ts
app: {
  enabled: true,
  name: Env.get('APP_NAME'),
  level: Env.get('LOG_LEVEL', 'info')

  transport: {
    targets: targets()
      .push({
         transport: 'pino/file',
         level: 'info',
         options: {
           destination: '/var/log/apps/adonisjs.log'
         }
      })
      .toArray()
  }
}
```

### ファイルのローテーション
Pinoにはファイルのローテーションをサポートする機能はありませんので、[logrotateのようなシステムレベルのツール](https://getpino.io/#/docs/help?id=rotate)を使用するか、[pino-roll](https://github.com/feugy/pino-roll)のようなサードパーティのパッケージを使用する必要があります。

```sh
npm i pino-roll
```

```ts
app: {
  enabled: true,
  name: Env.get('APP_NAME'),
  level: Env.get('LOG_LEVEL', 'info')

  transport: {
    targets: targets()
      // highlight-start
      .push({
        target: 'pino-roll',
        level: 'info',
        options: {
          file: '/var/log/apps/adonisjs.log',
          frequency: 'daily',
          mkdir: true
        }
      })
      // highlight-end
     .toArray()
  }
}
```


## 機密情報の非表示

ログは、機密データの漏洩元になる可能性があります。したがって、ログを監視し、出力から機密情報を削除/非表示にすることがオススメです。

Pinoでは、`redact`オプションを使用してログから機密なキーと値のペアを非表示/削除することができます。内部では、[fast-redact](https://github.com/davidmarkclements/fast-redact)パッケージが使用されており、利用可能な式についてはそのドキュメントを参照できます。

```ts
// title: config/logger.ts
app: {
  enabled: true,
  name: Env.get('APP_NAME'),
  level: Env.get('LOG_LEVEL', 'info')

  // highlight-start
  redact: {
    paths: ['password', '*.password']
  }
  // highlight-end
}
```

```ts
import logger from '@adonisjs/core/services/logger'

const username = request.input('username')
const password = request.input('password')

logger.info({ username, password }, 'ユーザー登録')
// output: {"username":"virk","password":"[非表示]","msg":"ユーザー登録"}
```

デフォルトでは、値は`[非表示]`のプレースホルダーで置き換えられます。カスタムのプレースホルダーを定義するか、キーと値のペアを削除することもできます。

```ts
redact: {
  paths: ['password', '*.password'],
  censor: '[非公開]'
}

// プロパティを削除する
redact: {
  paths: ['password', '*.password'],
  remove: true
}
```

### Secretデータ型の使用
非表示にする代わりに、機密な値をSecretクラスでラップする方法もあります。例えば:

参考: [Secretクラスの使用方法](../references/helpers.md#secret)

```ts
import { Secret } from '@adonisjs/core/helpers'

const username = request.input('username')
// delete-start
const password = request.input('password')
// delete-end
// insert-start
const password = new Secret(request.input('password'))
// insert-end

logger.info({ username, password }, 'ユーザー登録')
// output: {"username":"virk","password":"[非表示]","msg":"ユーザー登録"}
```
