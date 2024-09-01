---
summary: AsyncLocalStorageについて学び、AdonisJSでの使用方法を理解する。
---

# Async local storage

[Node.js公式ドキュメント](https://nodejs.org/docs/latest-v21.x/api/async_context.html#class-asynclocalstorage)によると、「AsyncLocalStorageは、コールバックやプロミスチェーン内で非同期の状態を作成するために使用されます。**Webリクエストやその他の非同期の期間全体にわたってデータを保存できます。他の言語のスレッドローカルストレージに似ています**。」

さらに説明を簡単にするために、AsyncLocalStorageを使用すると、非同期関数を実行する際に状態を保存し、その関数内のすべてのコードパスで利用できるようにできます。

## 基本的な例

実際に動作を確認してみましょう。まず、依存関係のない新しいNode.jsプロジェクトを作成し、参照を介さずにモジュール間で状態を共有するために`AsyncLocalStorage`を使用します。

:::note

この例の最終的なコードは、[als-basic-example](https://github.com/thetutlage/als-basic-example)のGitHubリポジトリで見つけることができます。


:::

### ステップ1. 新しいプロジェクトの作成

```sh
npm init --yes
```

`package.json`ファイルを開き、モジュールシステムをESMに設定します。

```json
{
  "type": "module"
}
```

### ステップ2. `AsyncLocalStorage`のインスタンスの作成

`storage.js`という名前のファイルを作成し、`AsyncLocalStorage`のインスタンスを作成してエクスポートします。

```ts
// title: storage.js
import { AsyncLocalStorage } from 'async_hooks'
export const storage = new AsyncLocalStorage()
```

### ステップ3. `storage.run`内でコードを実行

`main.js`というエントリーポイントファイルを作成します。このファイル内で、`./storage.js`ファイル内で作成した`AsyncLocalStorage`のインスタンスをインポートします。

`storage.run`メソッドは、最初の引数として共有したい状態を受け入れ、2番目の引数としてコールバック関数を受け入れます。このコールバック内のすべてのコードパス（インポートされたモジュールも含む）で同じ状態にアクセスできます。

```ts
// title: main.js
import { storage } from './storage.js'
import UserService from './user_service.js'
import { setTimeout } from 'node:timers/promises'

async function run(user) {
  const state = { user }

  return storage.run(state, async () => {
    await setTimeout(100)
    const userService = new UserService()
    await userService.get()
  })
}
```

デモンストレーションのために、`run`メソッドを非同期に3回実行します。以下のコードを`main.js`ファイルの末尾に貼り付けてください。

```ts
// title: main.js
run({ id: 1 })
run({ id: 2 })
run({ id: 3 })
```

### ステップ4. `user_service`モジュールから状態にアクセス

最後に、`user_service`モジュール内でストレージインスタンスをインポートし、現在の状態にアクセスします。

```ts
// title: user_service.js
import { storage } from './storage.js'

export default class UserService {
  async get() {
    const state = storage.getStore()
    console.log(`The user id is ${state.user.id}`)
  }
}
```

### ステップ5. `main.js`ファイルを実行

`main.js`ファイルを実行して、`UserService`が状態にアクセスできるかどうかを確認しましょう。

```sh
node main.js
```

## Async local storageの必要性

PHPのような他の言語とは異なり、Node.jsはスレッドベースの言語ではありません。PHPでは、各HTTPリクエストが新しいスレッドを作成し、各スレッドには独自のメモリがあります。これにより、グローバルメモリに状態を保存し、コードベース内のどこからでもアクセスできます。

一方、Node.jsでは、HTTPリクエスト間でグローバルな状態を分離することはできません。なぜなら、Node.jsは単一スレッドで動作し、共有メモリを持っているためです。その結果、すべてのNode.jsアプリケーションはデータをパラメーターとして渡すことでデータを共有します。

参照を介してデータを渡すことには技術的なデメリットはありませんが、とくにAPMツールを設定し、リクエストデータを手動で提供する必要がある場合には、コードが冗長になります。

## 使用方法

AdonisJSでは、HTTPリクエスト中に`AsyncLocalStorage`を使用し、[HTTPコンテキスト](./http_context.md)を状態として共有します。その結果、アプリケーション全体でHTTPコンテキストにアクセスできます。

まず、`config/app.ts`ファイル内で`useAsyncLocalStorage`フラグを有効にする必要があります。

```ts
// title: config/app.ts
export const http = defineConfig({
  useAsyncLocalStorage: true,
})
```

有効になったら、`HttpContext.get`または`HttpContext.getOrFail`メソッドを使用して、現在のリクエストのHTTPコンテキストのインスタンスを取得できます。

次の例では、Lucidモデル内でコンテキストを取得しています。

```ts
import { HttpContext } from '@adonisjs/core/http'
import { BaseModel } from '@adonisjs/lucid'

export default class Post extends BaseModel {
  get isLiked() {
    const ctx = HttpContext.getOrFail()
    const authUserId = ctx.auth.user.id
    
    return !!this.likes.find((like) => {
      return like.userId === authUserId
    })
  }
}
```

## 注意点
コードを簡潔にし、HTTPコンテキストを参照渡しする代わりにグローバルアクセスを選択する場合は、ALSを使用できます。

ただし、次の状況に注意してください。これらの状況では、メモリリークやプログラムの不安定な動作が発生する可能性があります。


### トップレベルのアクセス

モジュールはNode.jsでキャッシュされるため、モジュールのトップレベルでALSにアクセスしないでください。

:::caption{for="error"}
**誤った使用方法**\
`HttpContext.getOrFail()`メソッドの結果をトップレベルで変数に代入すると、最初にモジュールをインポートしたリクエストへの参照が保持されます。
:::


```ts
import { HttpContext } from '@adonisjs/core/http'
const ctx = HttpContext.getOrFail()

export default class UsersController {
  async index() {
    ctx.request
  }
}
```

:::caption[]{for="success"}
**正しい使用方法**\
代わりに、`getOrFail`メソッドの呼び出しを`index`メソッド内に移動する必要があります。
:::

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index() {
    const ctx = HttpContext.getOrFail()
  }
}
```

### 静的プロパティ内
クラスの静的プロパティ（メソッドではない）は、モジュールがインポートされるとすぐに評価されるため、静的プロパティ内でHTTPコンテキストにアクセスしないでください。

:::caption{for="error"}
**誤った使用方法**
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
import { BaseModel } from '@adonisjs/lucid'

export default class User extends BaseModel {
  static connection = HttpContext.getOrFail().tenant.name
}
```

:::caption[]{for="success"}
**正しい使用方法**\
代わりに、`HttpContext.get`の呼び出しをメソッド内に移動するか、プロパティをゲッターに変換する必要があります。
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
import { BaseModel } from '@adonisjs/lucid'

export default class User extends BaseModel {
  static query() {
    const ctx = HttpContext.getOrFail()
    return super.query({ connection: tenant.connection })
  }
}
```

### イベントハンドラー
イベントハンドラーは、HTTPリクエストが終了した後に実行されます。そのため、イベントハンドラー内でHTTPコンテキストにアクセスしようとすることは避けるべきです。

```ts
import emitter from '@adonisjs/core/services/emitter'

export default class UsersController {
  async index() {
    const user = await User.create({})
    emitter.emit('new:user', user)
  }
}
```

:::caption[]{for="error"}
**イベントリスナー内での使用を避ける**
:::

```ts
import { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'

emitter.on('new:user', () => {
  const ctx = HttpContext.getOrFail()
})
```
