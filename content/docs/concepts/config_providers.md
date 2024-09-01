---
summary: コンフィグプロバイダについて学び、アプリケーションの起動後に設定を遅延計算する方法を理解しましょう。
---

# コンフィグプロバイダ

一部の設定ファイル（`config/hash.ts`など）は、設定を単なるオブジェクトとしてエクスポートするのではなく、[コンフィグプロバイダ](https://github.com/adonisjs/core/blob/main/src/config_provider.ts#L16)としてエクスポートされます。コンフィグプロバイダは、アプリケーションの起動後に設定を遅延計算するための透過的なAPIを提供します。

## コンフィグプロバイダを使用しない場合

コンフィグプロバイダを理解するために、コンフィグプロバイダを使用しない場合の`config/hash.ts`ファイルを見てみましょう。

```ts
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'

export default {
  default: 'scrypt',
  list: {
    scrypt: () => new Scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    })
  }
}
```

これまでは問題ありません。`drivers`コレクションから`scrypt`ドライバーを参照する代わりに、直接インポートしてファクトリ関数を使用してインスタンスを返しています。

`Scrypt`ドライバーが値をハッシュするたびにイベントを発行するために、`Scrypt`ドライバーが`Emitter`クラスのインスタンスを必要とするとしましょう。

```ts
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
// insert-start
import emitter from '@adonisjs/core/services/emitter'
// insert-end

export default {
  default: 'scrypt',
  list: {
    scrypt: () => new Scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    // insert-start
    }, emitter)
    // insert-end
  }
}
```

**🚨 上記の例は失敗します**。なぜなら、AdonisJSの[コンテナサービス](./container_services.md)は、アプリケーションが起動し、設定ファイルがインポートされる前に利用できないからです。

### それはAdonisJSのアーキテクチャの問題ではありません 🤷🏻‍♂️
実際にはそうではありません。コンテナサービスを使用せずに、設定ファイル内で`Emitter`クラスのインスタンスを直接作成しましょう。

```ts
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
// delete-start
import emitter from '@adonisjs/core/services/emitter'
// delete-end
// insert-start
import { Emitter } from '@adonisjs/core/events'
// insert-end

// insert-start
const emitter = new Emitter()
// insert-end

export default {
  default: 'scrypt',
  list: {
    scrypt: () => new Scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }, emitter)
  }
}
```

これで新たな問題が発生しました。`Scrypt`ドライバーのために作成した`emitter`インスタンスは、ドライバーが発行するイベントをインポートしてリッスンするためにグローバルに利用できません。

そのため、`Emitter`クラスの構築をそのファイルに移動し、そのインスタンスをエクスポートすることが望ましいかもしれません。これにより、エミッターインスタンスをドライバーに渡してイベントをリッスンするために使用できます。

```ts
// title: start/emitter.ts
import { Emitter } from '@adonisjs/core/events'
export const emitter = new Emitter()
```

```ts
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
// delete-start
import { Emitter } from '@adonisjs/core/events'
// delete-end
// insert-start
import { emitter } from '#start/emitter'
// insert-end

// delete-start
const emitter = new Emitter()
// delete-end

export default {
  default: 'scrypt',
  list: {
    scrypt: () => new Scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }, emitter)
  }
}
```

上記のコードは正常に動作します。ただし、今回はアプリケーションが必要とする依存関係を手動で構築しています。その結果、アプリケーションにはすべてを結びつけるための大量のボイラープレートコードが必要になります。

AdonisJSでは、最小限のボイラープレートコードを書き、依存関係の検索にIoCコンテナを使用することを目指しています。

## コンフィグプロバイダを使用する場合
さて、`config/hash.ts`ファイルを書き直して、今度はコンフィグプロバイダを使用しましょう。コンフィグプロバイダは、[Applicationクラスのインスタンス](./application.md)を受け取り、コンテナを使用して依存関係を解決する関数のことです。

```ts
// highlight-start
import { configProvider } from '@adonisjs/core'
// highlight-end
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'

export default {
  default: 'scrypt',
  list: {
    // highlight-start
    scrypt: configProvider.create(async (app) => {
      const emitter = await app.container.make('emitter')

      return () => new Scrypt({
        cost: 16384,
        blockSize: 8,
        parallelization: 1,
        maxMemory: 33554432,
      }, emitter)
    })
    // highlight-end
  }
}
```

ハッシュサービスを使用すると、`scrypt`ドライバーのコンフィグプロバイダが依存関係を解決するために実行されます。その結果、コードの他の場所でハッシュサービスを使用するまで、`emitter`を参照しようとはしません。

コンフィグプロバイダは非同期なので、動的インポートを使用して`Scrypt`ドライバーを遅延してインポートできます。

```ts
import { configProvider } from '@adonisjs/core'
// delete-start
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
// delete-end

export default {
  default: 'scrypt',
  list: {
    scrypt: configProvider.create(async (app) => {
      // insert-start
      const { Scrypt } = await import('@adonisjs/core/hash/drivers/scrypt')
      // insert-end
      const emitter = await app.container.make('emitter')

      return () => new Scrypt({
        cost: 16384,
        blockSize: 8,
        parallelization: 1,
        maxMemory: 33554432,
      }, emitter)
    })
  }
}
```

## 解決されたコンフィグにはどのようにアクセスしますか？
サービスから直接解決されたコンフィグには、次のようにしてアクセスできます。たとえば、ハッシュサービスの場合、次のようにして解決されたコンフィグへの参照を取得できます。

```ts
import hash from '@adonisjs/core/services/hash'
console.log(hash.config)
```
