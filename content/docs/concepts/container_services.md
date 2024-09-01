---
summary: コンテナサービスについて学び、コードベースをクリーンでテスト可能に保つ方法を知りましょう。
---

# コンテナサービス

[IoCコンテナガイド](./dependency_injection.md#container-bindings)で説明したように、コンテナバインディングはAdonisJSのIoCコンテナが存在する主な理由の1つです。

コンテナバインディングは、オブジェクトを使用する前に構築するために必要なボイラープレートコードからコードベースをクリーンに保ちます。

次の例では、`Database`クラスを使用する前に、そのインスタンスを作成する必要があります。構築するクラスによっては、すべての依存関係を取得するために多くのボイラープレートコードを記述する必要があります。

```ts
import { Database } from '@adonisjs/lucid'
export const db = new Database(
  // configやその他の依存関係を注入
)
```

しかし、IoCコンテナを使用すると、クラスの構築タスクをコンテナにオフロードし、事前に構築されたインスタンスを取得できます。

```ts
import app from '@adonisjs/core/services/app'
const db = await app.container.make('lucid.db')
```

## コンテナサービスの必要性

コンテナを使用して事前に設定済みのオブジェクトを解決することは素晴らしいことです。ただし、`container.make`メソッドを使用することにはいくつかのデメリットがあります。

- エディターは自動インポートに優れています。変数を使用しようとすると、エディターが変数のインポートパスを推測できれば、インポートステートメントを自動的に書き込んでくれます。**ただし、これは`container.make`呼び出しでは機能しません。**

- インポートステートメントと`container.make`呼び出しの組み合わせは、モジュールのインポート/使用に統一された構文がないため、直感的ではありません。

これらのデメリットを克服するために、`container.make`呼び出しを通常のJavaScriptモジュール内にラップし、`import`ステートメントを使用してそれらを取得できるようにします。

たとえば、`@adonisjs/lucid`パッケージには、`services/db.ts`というファイルがあり、このファイルにはおおよそ以下の内容が含まれています。

```ts
const db = await app.container.make('lucid.db')
export { db as default }
```

アプリケーション内では、`container.make`呼び出しを`services/db.ts`ファイルを指すインポートに置き換えることができます。

```ts
// delete-start
import app from '@adonisjs/core/services/app'
const db = await app.container.make('lucid.db')
// delete-end
// insert-start
import db from '@adonisjs/lucid/services/db'
// insert-end
```

ご覧のように、私たちはまだコンテナに依存してDatabaseクラスのインスタンスを解決しています。ただし、間接的なレイヤーを追加することで、`container.make`呼び出しを通常の`import`ステートメントで置き換えることができます。

**`container.make`呼び出しをラップするJavaScriptモジュールは、コンテナサービスとして知られています。** コンテナとやり取りするほとんどのパッケージには、1つ以上のコンテナサービスが含まれています。

## コンテナサービスと依存性の注入

コンテナサービスは依存性の注入の代替手段です。たとえば、`Disk`クラスを依存関係として受け入れる代わりに、`drive`サービスにディスクインスタンスを要求します。いくつかのコード例を見てみましょう。

次の例では、`@inject`デコレータを使用して`Disk`クラスのインスタンスを注入しています。

```ts
import { Disk } from '@adonisjs/drive'
import { inject } from '@adonisjs/core'

  // highlight-start
@inject()
export default class PostService {
  constructor(protected disk: Disk) {
  }
  // highlight-end  

  async save(post: Post, coverImage: File) {
    const coverImageName = 'random_name.jpg'

    // highlight-start
    await this.disk.put(coverImageName, coverImage)
    // highlight-end
    
    post.coverImage = coverImageName
    await post.save()
  }
}
```

`drive`サービスを使用する場合、`drive.use`メソッドを呼び出して`s3`ドライバーを使用した`Disk`のインスタンスを取得します。

```ts
import drive from '@adonisjs/drive/services/main'

export default class PostService {
  async save(post: Post, coverImage: File) {
    const coverImageName = 'random_name.jpg'

    // highlight-start
    const disk = drive.use('s3')
    await disk.put(coverImageName, coverImage)
    // highlight-end
    
    post.coverImage = coverImageName
    await post.save()
  }
}
```

コンテナサービスはコードを簡潔に保つために優れています。一方、依存性の注入は異なるアプリケーションパーツ間の緩い結合を作成します。

どちらを選ぶかは、個人の選択とコードの構造を決めるアプローチによります。

## コンテナサービスを使用したテスト

依存性の注入の明白な利点は、テストを書く際に依存関係を交換できる能力です。

コンテナサービスと同様のテストエクスペリエンスを提供するために、AdonisJSはテストを書く際に実装をフェイクするための一流のAPIを提供しています。

次の例では、`drive.fake`メソッドを呼び出してドライブディスクをインメモリドライバーで置き換えます。フェイクが作成されると、`drive.use`メソッドへのすべての呼び出しはフェイクの実装を受け取ります。

```ts
import drive from '@adonisjs/drive/services/main'
import PostService from '#services/post_service'

test('save post', async ({ assert }) => {
  /**
   * Fake s3 disk
   */
  drive.fake('s3')
 
  const postService = new PostService()
  await postService.save(post, coverImage)
  
  /**
   * Write assertions
   */
  assert.isTrue(await drive.use('s3').exists(coverImage.name))
  
  /**
   * Restore fake
   */
  drive.restore('s3')
})
```

## コンテナバインディングとサービス

以下の表は、フレームワークコアとファーストパーティパッケージがエクスポートするコンテナバインディングと関連するサービスの一覧です。

<table>
  <thead>
    <tr>
      <th width="100px">バインディング</th>
      <th width="140px">クラス</th>
      <th>サービス</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <code>app</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/application/blob/main/src/application.ts">Application</a>
      </td>
      <td>
        <code>@adonisjs/core/services/app</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>ace</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/core/blob/main/modules/ace/kernel.ts">Kernel</a>
      </td>
      <td>
        <code>@adonisjs/core/services/kernel</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>config</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/config/blob/main/src/config.ts">Config</a>
      </td>
      <td>
        <code>@adonisjs/core/services/config</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>encryption</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/encryption/blob/main/src/encryption.ts">Encryption</a>
      </td>
      <td>
        <code>@adonisjs/core/services/encryption</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>emitter</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/events/blob/main/src/emitter.ts">Emitter</a>
      </td>
      <td>
        <code>@adonisjs/core/services/emitter</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>hash</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/hash/blob/main/src/hash_manager.ts">HashManager</a>
      </td>
      <td>
        <code>@adonisjs/core/services/hash</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>logger</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/logger/blob/main/src/logger_manager.ts">LoggerManager</a>
      </td>
      <td>
        <code>@adonisjs/core/services/logger</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>repl</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/repl/blob/main/src/repl.ts">Repl</a>
      </td>
      <td>
        <code>@adonisjs/core/services/repl</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>router</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/http-server/blob/main/src/router/main.ts">Router</a>
      </td>
      <td>
        <code>@adonisjs/core/services/router</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>server</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/http-server/blob/main/src/server/main.ts">Server</a>
      </td>
      <td>
        <code>@adonisjs/core/services/server</code>
      </td>
    </tr>
    <tr>
      <td>
        <code> testUtils</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/core/blob/main/src/test_utils/main.ts">TestUtils</a>
      </td>
      <td>
        <code>@adonisjs/core/services/test_utils</code>
      </td>
    </tr>
  </tbody>
</table>
