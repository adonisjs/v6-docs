---
summary: AdonisJSでの依存性注入について学び、IoCコンテナを使用して依存関係を解決する方法を学びます。
---

# 依存性注入

AdonisJSアプリケーションの中心には、ほぼゼロの設定でクラスを構築し、依存関係を解決できるIoCコンテナがあります。

IoCコンテナは次の2つの主要なユースケースを提供します。

- コンテナからバインディングを登録および解決するための、第一および第三者パッケージ向けのAPIの公開（後述の[バインディング](#コンテナのバインディング)を参照）。
- クラスのコンストラクタまたはクラスメソッドに対して自動的に依存関係を解決し、注入する。

まずはクラスに依存関係を注入する方法から始めましょう。

## 基本的な例

自動的な依存性注入は、[TypeScriptのレガシーデコレータの実装](https://www.typescriptlang.org/docs/handbook/decorators.html)と[リフレクションメタデータ](https://www.npmjs.com/package/reflect-metadata)APIに依存しています。

次の例では、`EchoService`クラスを作成し、それを`HomeController`クラスにインスタンスとして注入します。コード例をコピーして一緒に進めることができます。

### ステップ1. サービスクラスを作成する
`app/services`フォルダ内に`EchoService`クラスを作成します。

```ts
// title: app/services/echo_service.ts
export default class EchoService {
  respond() {
    return 'hello'
  }
}
```

### ステップ2. コントローラ内でサービスを注入する

`app/controllers`フォルダ内に新しいHTTPコントローラを作成します。または、`node ace make:controller home`コマンドを使用することもできます。

コントローラファイルで`EchoService`をインポートし、コンストラクタの依存関係として受け入れます。

```ts
// title: app/controllers/home_controller.ts
import EchoService from '#services/echo_service'

export default class HomeController {
  constructor(protected echo: EchoService) {
  }
  
  handle() {
    return this.echo.respond()
  }
}
```

### ステップ3. injectデコレータの使用

自動的な依存関係の解決を行うために、`HomeController`クラスに`@inject`デコレータを使用する必要があります。

```ts
import EchoService from '#services/echo_service'
// insert-start
import { inject } from '@adonisjs/core'
// insert-end

// insert-start
@inject()
// insert-end
export default class HomeController {
  constructor(protected echo: EchoService) {
  }
  
  handle() {
    return this.echo.respond()
  }
}
```

以上です！`HomeController`クラスをルートにバインドすると、自動的に`EchoService`クラスのインスタンスが受け取られます。

### 結論

`@inject`デコレータは、クラスのコンストラクタやメソッドの依存関係を観察し、コンテナにその情報を伝えるスパイのようなものと考えることができます。

AdonisJSルータが`HomeController`の構築をコンテナに依頼するとき、コンテナは既にコントローラの依存関係を知っています。

## 依存関係のツリーの構築

現時点では、`EchoService`クラスには依存関係がありませんし、コンテナを使用してそのインスタンスを作成することは過剰に思えるかもしれません。

クラスのコンストラクタを更新し、`HttpContext`クラスのインスタンスを受け入れるようにしましょう。

```ts
// title: app/services/echo_service.ts
// insert-start
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
// insert-end

// insert-start
@inject()
// insert-end
export default class EchoService {
  // insert-start
  constructor(protected ctx: HttpContext) {
  }
  // insert-end

  respond() {
    return `Hello from ${this.ctx.request.url()}`
  }
}
```

再び、私たちはスパイ（`@inject`デコレータ）を`EchoService`クラスに配置して、その依存関係を検査する必要があります。

できます。それだけです。コントローラ内のコードを1行も変更せずに、コードを再実行すると、`EchoService`クラスに`HttpContext`クラスのインスタンスが渡されます。


:::note

コンテナを使用する利点の1つは、深くネストされた依存関係を持つことができ、コンテナがそのツリー全体を解決できることです。ただし、`@inject`デコレータを使用する必要があります。


:::

## メソッドインジェクションの使用

メソッドインジェクションは、クラスメソッド内に依存関係を注入するために使用されます。メソッドインジェクションを使用するには、メソッドシグネチャの前に`@inject`デコレータを配置する必要があります。

前の例を続けて、`EchoService`の依存関係を`HomeController`のコンストラクタから`handle`メソッドに移動しましょう。

:::note

コントローラ内でメソッドインジェクションを使用する場合、最初のパラメータは固定値（つまり、HTTPコンテキスト）を受け取り、残りのパラメータはコンテナを使用して解決されます。

:::

```ts
// title: app/controllers/home_controller.ts
import EchoService from '#services/echo_service'
import { inject } from '@adonisjs/core'

// delete-start
@inject()
// delete-end
export default class HomeController {
  // delete-start
  constructor(private echo: EchoService) {
  }
  // delete-end
  
  // insert-start
  @inject()
  handle(ctx, echo: EchoService) {
    return echo.respond()
  }
  // insert-end
}
```

以上です！今度は、`EchoService`クラスのインスタンスが`handle`メソッド内に注入されます。

## いつ依存性注入を使用するか

プロジェクトで依存性注入を活用することをオススメします。DIにより、アプリケーションのさまざまな部分間の緩い結合が作成されます。その結果、コードベースはテストやリファクタリングが容易になります。

ただし、依存性注入のアイデアを極端に取りすぎて、その利点を失わないように注意する必要があります。たとえば：

- `lodash`のようなヘルパーライブラリをクラスの依存関係として注入するべきではありません。直接インポートして使用してください。
- コンポーネントが交換または置換される可能性のないコンポーネントには、緩い結合が必要ない場合があります。たとえば、`logger`サービスをインポートするか、`Logger`クラスを依存関係として注入するかを選択できます。

## コンテナを直接使用する

AdonisJSアプリケーション内のほとんどのクラス（**Controllers**、**Middleware**、**Event listeners**、**Validators**、**Mailers**など）は、コンテナを使用して構築されます。そのため、`@inject`デコレータを使用して自動的な依存性注入を活用できます。

コンテナを使用してクラスのインスタンスを自己構築する場合は、`container.make`メソッドを使用できます。

`container.make`メソッドは、クラスのコンストラクタを受け取り、その依存関係を解決した後にインスタンスを返します。

```ts
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'

class EchoService {}

@inject()
class SomeService {
  constructor(public echo: EchoService) {}
}

/**
 * 新しいクラスのインスタンスを作成するのと同じですが、
 * 自動的なDIの利点があります
 */
const service = await app.container.make(SomeService)

console.log(service instanceof SomeService)
console.log(service.echo instanceof EchoService)
```

メソッド内で依存関係を注入するために`container.call`メソッドを使用できます。`container.call`メソッドは、次の引数を受け入れます。

1. クラスのインスタンス。
2. クラスインスタンスで実行するメソッドの名前。コンテナは依存関係を解決し、メソッドに渡します。
3. メソッドに渡す固定パラメータのオプションの配列。

```ts
class EchoService {}

class SomeService {
  @inject()
  run(echo: EchoService) {
  }
}

const service = await app.container.make(SomeService)

/**
 * Echoクラスのインスタンスが
 * runメソッドに渡されます
 */
await app.container.call(service, 'run')
```

## コンテナのバインディング

コンテナのバインディングは、AdonisJSのIoCコンテナの存在理由の1つです。バインディングは、インストールしたパッケージとアプリケーション間の橋渡しとして機能します。

バインディングは、キーと値のペアであり、キーはバインディングの一意の識別子であり、値は値を返すファクトリ関数です。

- バインディング名は`string`、`symbol`、またはクラスのコンストラクタであることができます。
- ファクトリ関数は非同期であることができ、値を返さなければなりません。

コンテナバインディングを登録するには、`container.bind`メソッドを使用できます。以下は、コンテナからバインディングを登録および解決する簡単な例です。

```ts
import app from '@adonisjs/core/services/app'

class MyFakeCache {
  get(key: string) {
    return `${key}!`
  }
}

app.container.bind('cache', function () {
  return new MyCache()
})

const cache = await app.container.make('cache')
console.log(cache.get('foo')) // foo! を返します
```

### コンテナバインディングを使用するタイミング

コンテナバインディングは、パッケージがエクスポートするシングルトンサービスを登録したり、自動的な依存性注入だけでは不十分な場合に使用されます。

すべてをコンテナに登録してアプリケーションを不必要に複雑にすることはオススメしません。代わりに、コンテナバインディングに手を出す前に、アプリケーションコード内の特定のユースケースを探してください。

以下は、フレームワークパッケージ内でコンテナバインディングを使用しているいくつかの例です。

- [コンテナ内でBodyParserMiddlewareを登録する](https://github.com/adonisjs/core/blob/main/providers/app_provider.ts#L134-L139)：ミドルウェアクラスは、`config/bodyparser.ts`ファイルに格納された構成が必要なため、自動的な依存性注入では機能しません。この場合、ミドルウェアクラスインスタンスを手動で構築するために、バインディングとして登録します。
- [Encryptionサービスをシングルトンとして登録する](https://github.com/adonisjs/core/blob/main/providers/app_provider.ts#L97-L100)：Encryptionクラスは、`config/app.ts`ファイルに格納された`appKey`が必要です。そのため、ユーザーアプリケーションから`appKey`を読み取り、Encryptionクラスのシングルトンインスタンスを設定するためのブリッジとしてコンテナバインディングを使用します。


:::important

コンテナバインディングのコンセプトは、JavaScriptエコシステムでは一般的に使用されません。そのため、疑問点を明確にするために、[Discordコミュニティに参加](https://discord.gg/vDcEjq6)してください。


:::


### ファクトリ関数内でバインディングを解決する

バインディングファクトリ関数内で、コンテナから他のバインディングを解決できます。たとえば、`MyFakeCache`クラスが`config/cache.ts`ファイルから設定を必要とする場合、次のようにアクセスできます。

```ts
this.app.container.bind('cache', async (resolver) => {
  const configService = await resolver.make('config')
  const cacheConfig = configService.get<any>('cache')

  return new MyFakeCache(cacheConfig)
})
```

### シングルトン

シングルトンは、ファクトリ関数が1回呼び出され、その戻り値がアプリケーションのライフサイクルでキャッシュされるバインディングです。

`container.singleton`メソッドを使用してシングルトンバインディングを登録できます。

```ts
this.app.container.singleton('cache', async (resolver) => {
  const configService = await resolver.make('config')
  const cacheConfig = configService.get<any>('cache')

  return new MyFakeCache(cacheConfig)
})
```

### 値のバインディング

`container.bindValue`メソッドを使用して、値を直接コンテナにバインドできます。

```ts
this.app.container.bindValue('cache', new MyFakeCache())
```

### エイリアス

`container.alias`メソッドを使用して、バインディングにエイリアスを定義できます。メソッドは、エイリアス名を最初のパラメータとして受け入れ、既存のバインディングまたはクラスのコンストラクタをエイリアス値として受け入れます。

```ts
this.app.container.singleton(MyFakeCache, async () => {
  return new MyFakeCache()
})

this.app.container.alias('cache', MyFakeCache)
```

### バインディングの静的な型を定義する

[TypeScriptの宣言マージ](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)を使用して、バインディングの静的な型情報を定義できます。

型は`ContainerBindings`インターフェイス上でキーと値のペアとして定義されます。

```ts
declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    cache: MyFakeCache
  }
}
```

パッケージを作成する場合は、上記のコードブロックをサービスプロバイダファイル内に記述できます。

AdonisJSアプリケーションでは、上記のコードブロックを`types/container.ts`ファイル内に記述できます。


## 抽象化レイヤーの作成

コンテナを使用すると、アプリケーションのための抽象化レイヤーを作成できます。インターフェイスをバインディングとして定義し、具体的な実装に解決できます。

:::note
この方法は、Hexagonal Architecture（ポートとアダプタの原則）をアプリケーションに適用したい場合に便利です。
:::

TypeScriptのインターフェイスは実行時に存在しないため、インターフェイスの代わりに抽象クラスのコンストラクタを使用する必要があります。

```ts
export abstract class PaymentService {
  abstract charge(amount: number): Promise<void>
  abstract refund(amount: number): Promise<void>
}
```

次に、`PaymentService`インターフェイスの具体的な実装を作成できます。

```ts
import { PaymentService } from '#contracts/payment_service'

export class StripePaymentService implements PaymentService {
  async charge(amount: number) {
    // Stripeを使用して金額を請求する
  }

  async refund(amount: number) {
    // Stripeを使用して金額を返金する
  }
}
```

これで、`PaymentService`インターフェイスと`StripePaymentService`具体的な実装をコンテナ内に登録できます。`AppProvider`内で行います。

```ts
// title: providers/app_provider.ts
import { PaymentService } from '#contracts/payment_service'

export default class AppProvider {
  async boot() {
    const { StripePaymentService } = await import('#services/stripe_payment_service')
    
    this.app.container.bind(PaymentService, () => {
      return this.app.container.make(StripePaymentService)
    })
  }
}
```

最後に、コンテナから`PaymentService`インターフェイスを解決し、アプリケーション内で使用できます。

```ts
import { PaymentService } from '#contracts/payment_service'

@inject()
export default class PaymentController {
  constructor(private paymentService: PaymentService) {
  }

  async charge() {
    await this.paymentService.charge(100)
    
    // ...
  }
}
```

## テスト中の実装の切り替え

コンテナを使用して依存関係のツリーを解決する場合、そのツリー内のクラスに対してはほとんど/まったく制御を持っていません。そのため、それらのクラスをモック/フェイクすることはより困難になる場合があります。

次の例では、`UsersController`のインスタンスメソッド`index`は、`UserService`クラスのインスタンスを受け入れ、`@inject`デコレータを使用して依存関係を解決し`index`メソッドに渡します。

```ts
import UserService from '#services/user_service'
import { inject } from '@adonisjs/core'

export default class UsersController {
  @inject()
  index(service: UserService) {}
}
```

テスト中に、実際の`UserService`を使用したくない場合があります。なぜなら、それは外部のHTTPリクエストを行うためです。代わりに、フェイクな実装を使用したいと思います。

しかし、まずは`UsersController`をテストするために書く可能性のあるコードを見てみましょう。

```ts
import UserService from '#services/user_service'

test('すべてのユーザーを取得する', async ({ client }) => {
  const response = await client.get('/users')

  response.assertBody({
    data: [{ id: 1, username: 'virk' }]
  })
})
```

上記のテストでは、HTTPリクエストを介して`UsersController`とやり取りし、直接制御することはありません。

コンテナは、クラスをフェイクな実装と交換するための簡単なAPIを提供します。`container.swap`メソッドを使用して交換を定義できます。

`container.swap`メソッドは、交換したいクラスのコンストラクタを受け入れ、代替実装を返すファクトリ関数を続けて指定します。

```ts
import UserService from '#services/user_service'
// insert-start
import app from '@adonisjs/core/services/app'
// insert-end

test('すべてのユーザーを取得する', async ({ client }) => {
  // insert-start
  class FakeService extends UserService {
    all() {
      return [{ id: 1, username: 'virk' }]
    }
  }
    
  app.container.swap(UserService, () => {
    return new FakeService()
  })
  // insert-end
  
  const response = await client.get('users')
  response.assertBody({
    data: [{ id: 1, username: 'virk' }]
  })
})
```

交換が定義されると、コンテナは実際のクラスの代わりにそれを使用します。元の実装に戻すには、`container.restore`メソッドを使用します。

```ts
app.container.restore(UserService)

// 全てを元に戻す
app.container.restore()
```

## コンテキスト依存関係

コンテキスト依存関係を使用すると、特定のクラスの依存関係をどのように解決するかを定義できます。たとえば、2つのサービスが`Drive Disk`クラスに依存している場合を考えてみましょう。

```ts
import { Disk } from '@adonisjs/drive'

export default class UserService {
  constructor(protected disk: Disk) {}
}
``` 

```ts
import { Disk } from '@adonisjs/drive'

export default class PostService {
  constructor(protected disk: Disk) {}
}
```

`UserService`にはGCSドライバを使用するディスクインスタンスを渡し、`PostService`にはS3ドライバを使用するディスクインスタンスを渡したいとします。これは、コンテキスト依存関係を使用して行うことができます。

次のコードは、サービスプロバイダの`register`メソッド内に書かれる必要があります。

```ts
import { Disk } from '@adonisjs/drive'
import UserService from '#services/user_service'
import PostService from '#services/post_service'
import { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container
      .when(UserService)
      .asksFor(Disk)
      .provide(async (resolver) => {
        const driveManager = await resolver.make('drive')
        return drive.use('gcs')
      })

    this.app.container
      .when(PostService)
      .asksFor(Disk)
      .provide(async (resolver) => {
        const driveManager = await resolver.make('drive')
        return drive.use('s3')
      })
  }
}
```

## コンテナフック

コンテナの`resolving`フックを使用して、`container.make`メソッドの戻り値を変更/拡張できます。

通常、特定のバインディングを拡張しようとするときに、サービスプロバイダ内でフックを使用します。たとえば、データベースプロバイダは、追加のデータベース駆動型のバリデーションルールを登録するために`resolving`フックを使用します。

```ts
import { ApplicationService } from '@adonisjs/core/types'

export default class DatabaseProvider {
  constructor(protected app: ApplicationService) {
  }

  async boot() {
    this.app.container.resolving('validator', (validator) => {
      validator.rule('unique', implementation)
      validator.rule('exists', implementation)
    })
  }
}
```

## コンテナイベント

コンテナは、バインディングの解決またはクラスインスタンスの構築後に`container_binding:resolved`イベントを発行します。`event.binding`プロパティは文字列（バインディング名）またはクラスコンストラクタであり、`event.value`プロパティは解決された値です。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('container_binding:resolved', (event) => {
  console.log(event.binding)
  console.log(event.value)
})
```

## 関連情報

- [The container README file](https://github.com/adonisjs/fold/blob/develop/README.md) は、フレームワークに依存しない方法でコンテナのAPIをカバーしています。
- [Why do you need an IoC container?](https://github.com/thetutlage/meta/discussions/4) この記事では、フレームワークの作成者がIoCコンテナを使用する理由について説明しています。
