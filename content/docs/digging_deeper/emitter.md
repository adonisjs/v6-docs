---
summary: Node.jsのデフォルトのイベントエミッターに関する多くの一般的な問題を修正し、非同期でイベントをディスパッチする組み込みのイベントエミッター。
---

# イベントエミッター

AdonisJSには、[emittery](https://github.com/sindresorhus/emittery)の上に作られた組み込みのイベントエミッターがあります。Emitteryはイベントを非同期でディスパッチし、Node.jsのデフォルトのイベントエミッターの多くの一般的な問題を修正します。

AdonisJSは、追加の機能を備えたemitteryをさらに強化しています。

- イベントとそれに関連するデータ型のリストを定義することで、静的な型安全性を提供します。
- クラスベースのイベントとリスナーのサポート。リスナーを専用のファイルに移動することで、コードベースを整理し、テストしやすくします。
- テスト中にイベントを偽装する機能。

## 基本的な使用法

イベントリスナーは`start/events.ts`ファイル内で定義されます。`make:preload`エースコマンドを使用してこのファイルを作成できます。

```sh
node ace make:preload events
```

イベントをリッスンするには`emitter.on`を使用する必要があります。このメソッドは、最初の引数としてイベントの名前、2番目の引数としてリスナーを受け入れます。

```ts
// title: start/events.ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('user:registered', function (user) {
  console.log(user)
})
```

イベントリスナーを定義したら、`emitter.emit`メソッドを使用して`user:registered`イベントを発行できます。このメソッドは、最初の引数としてイベント名、2番目の引数としてイベントデータを受け入れます。

```ts
import emitter from '@adonisjs/core/services/emitter'

export default class UsersController {
  async store() {
    const user = await User.create(data)
    emitter.emit('user:registered', user)
  }
}
```

イベントを一度だけリッスンするには、`emitter.once`を使用できます。

```ts
emitter.once('user:registered', function (user) {
  console.log(user)
})
```

## イベントの型安全性の確保

AdonisJSでは、アプリケーション内で発行するすべてのイベントに対して静的な型を定義必須です。これらの型は`types/events.ts`ファイルに登録されます。

次の例では、`User`モデルを`user:registered`イベントのデータ型として登録しています。


:::note

すべてのイベントに対して型を定義するのが煩雑な場合は、[クラスベースのイベント](#class-based-events)に切り替えることもできます。


:::


```ts
import User from '#models/User'

declare module '@adonisjs/core/types' {
  interface EventsList {
    'user:registered': User
  }
}
```

## クラスベースのリスナー

HTTPコントローラーと同様に、リスナークラスはインラインのイベントリスナーを専用のファイルに移動するための抽象化レイヤーを提供します。リスナークラスは`app/listeners`ディレクトリに保存され、`make:listener`コマンドを使用して新しいリスナーを作成できます。

参照: [リスナーの作成コマンド](../references/commands.md#makelistener)

```sh
node ace make:listener sendVerificationEmail
```

リスナーファイルは`class`宣言と`handle`メソッドでスキャフォールディングされます。このクラスでは、必要に応じて複数のイベントをリッスンするための追加のメソッドを定義できます。

```ts
import User from '#models/user'

export default class SendVerificationEmail {
  handle(user: User) {
    // メールを送信する
  }
}
```

最後のステップとして、リスナークラスを`start/events.ts`ファイル内のイベントにバインドする必要があります。`#listeners`エイリアスを使用してリスナーをインポートできます。エイリアスは、Node.jsの[サブパスインポート機能](../getting_started/folder_structure.md#the-sub-path-imports)を使用して定義されます。

```ts
// title: start/events.ts
import emitter from '@adonisjs/core/services/emitter'
import SendVerificationEmail from '#listeners/send_verification_email'

emitter.on('user:registered', [SendVerificationEmail, 'handle'])
```

### 遅延ロードリスナー

アプリケーションの起動フェーズを高速化するために、リスナーを遅延ロードすることをオススメします。遅延ロードは、インポートステートメントを関数の後ろに移動し、動的インポートを使用するだけの簡単な操作です。

```ts
import emitter from '@adonisjs/core/services/emitter'
// delete-start
import SendVerificationEmail from '#listeners/send_verification_email'
// delete-end
// insert-start
const SendVerificationEmail = () => import('#listeners/send_verification_email')
// insert-end

emitter.on('user:registered', [SendVerificationEmail, 'handle'])
```

### 依存性の注入

:::warning

リスナークラス内で`HttpContext`をインジェクトすることはできません。イベントは非同期で処理されるため、リスナーはHTTPリクエストが終了した後に実行される可能性があります。


:::

リスナークラスは[IoCコンテナ](../concepts/dependency_injection.md)を使用してインスタンス化されるため、クラスのコンストラクターまたはイベントを処理するメソッド内で依存関係を型ヒントできます。

次の例では、`TokensService`をコンストラクターの引数として型ヒントしています。このリスナーを呼び出すとき、IoCコンテナは`TokensService`クラスのインスタンスをインジェクトします。

```ts
// title: コンストラクターのインジェクション
import { inject } from '@adonisjs/core'
import TokensService from '#services/tokens_service'

@inject()
export default class SendVerificationEmail {
  constructor(protected tokensService: TokensService) {}

  handle(user: User) {
    const token = this.tokensService.generate(user.email)
  }
}
```

次の例では、`TokensService`を`handle`メソッド内でインジェクトしています。ただし、最初の引数は常にイベントペイロードになることに注意してください。

```ts
// title: メソッドのインジェクション
import { inject } from '@adonisjs/core'
import TokensService from '#services/tokens_service'
import UserRegistered from '#events/user_registered'

export default class SendVerificationEmail {
  @inject()
  handle(event: UserRegistered, tokensService: TokensService) {
    const token = tokensService.generate(event.user.email)
  }
}
```

## クラスベースのイベント

イベントは、イベント識別子（通常は文字列ベースのイベント名）と関連するデータの組み合わせです。

例:
- `user:registered`はイベント識別子（またはイベント名）です。
- Userモデルのインスタンスはイベントデータです。

クラスベースのイベントは、イベント識別子とイベントデータを同じクラス内にカプセル化します。クラスのコンストラクターは識別子として機能し、クラスのインスタンスはイベントデータを保持します。

`make:event`コマンドを使用してイベントクラスを作成できます。

参照: [イベントの作成コマンド](../references/commands.md#makeevent)

```sh
node ace make:event UserRegistered
```

イベントクラスには動作はありません。代わりに、イベントのデータコンテナとなります。イベントデータをクラスのコンストラクターを介して受け入れ、インスタンスプロパティとして利用できるようにできます。
 
```ts
// title: app/events/user_registered.ts
import { BaseEvent } from '@adonisjs/core/events'
import User from '#models/user'

export default class UserRegistered extends BaseEvent {
  constructor(public user: User) {} 
}
```

### クラスベースのイベントのリスニング

`emitter.on`メソッドを使用してクラスベースのイベントにリスナーをアタッチできます。最初の引数はイベントクラスの参照であり、2番目の引数はリスナーです。

```ts
import emitter from '@adonisjs/core/services/emitter'
import UserRegistered from '#events/user_registered'

emitter.on(UserRegistered, function (event) {
  console.log(event.user)
})
```

次の例では、クラスベースのイベントとリスナーの両方を使用しています。

```ts
import emitter from '@adonisjs/core/services/emitter'

import UserRegistered from '#events/user_registered'
const SendVerificationEmail = () => import('#listeners/send_verification_email')

emitter.on(UserRegistered, [SendVerificationEmail])
```

### クラスベースのイベントの発行

`static dispatch`メソッドを使用してクラスベースのイベントを発行できます。`dispatch`メソッドは、イベントクラスのコンストラクターが受け入れる引数を取ります。

```ts
import User from '#models/user'
import UserRegistered from '#events/user_registered'

export default class UsersController {
  async store() {
    const user = await User.create(data)
    
    /**
     * イベントをディスパッチ/発行する
     */
    UserRegistered.dispatch(user)
  }
}
```

## イベントリスニングの簡素化

クラスベースのイベントとリスナーを使用することを決めた場合、`emitter.listen`メソッドを使用してリスナーをバインドするプロセスを簡素化できます。

`emitter.listen`メソッドは、最初の引数としてイベントクラス、2番目の引数としてクラスベースのリスナーの配列を受け入れます。また、登録されたリスナーは`handle`メソッドを持つ必要があります。

```ts
import emitter from '@adonisjs/core/services/emitter'
import UserRegistered from '#events/user_registered'

emitter.listen(UserRegistered, [
  () => import('#listeners/send_verification_email'),
  () => import('#listeners/register_with_payment_provider'),
  () => import('#listeners/provision_account')
])
```

## エラーのハンドリング
デフォルトでは、リスナーが発生させる例外は[unhandledRejection](https://nodejs.org/api/process.html#event-unhandledrejection)によって処理されます。したがって、`emitter.onError`メソッドを使用してエラーを自己キャプチャして処理することをオススメします。

`emitter.onError`メソッドは、イベント名、エラー、およびイベントデータを受け取るコールバックを受け入れます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.onError((event, error, eventData) => {
})
```

## すべてのイベントをリッスンする

`emitter.onAny`メソッドを使用すると、すべてのイベントをリッスンできます。メソッドは、リスナーコールバックを唯一のパラメータとして受け入れます。

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.onAny((name, event) => {
  console.log(name)
  console.log(event)
})
```

## イベントの購読解除

`emitter.on`メソッドは、イベントリスナーの購読を解除するために呼び出すことができる購読解除関数を返します。

```ts
import emitter from '@adonisjs/core/services/emitter'

const unsubscribe = emitter.on('user:registered', () => {})

// リスナーを削除する
unsubscribe()
```

また、`emitter.off`メソッドを使用してイベントリスナーの購読を解除することもできます。メソッドは、最初の引数としてイベント名/クラス、2番目の引数としてリスナーへの参照を受け入れます。

```ts
import emitter from '@adonisjs/core/services/emitter'

function sendEmail () {}

// イベントをリッスンする
emitter.on('user:registered', sendEmail)

// リスナーを削除する
emitter.off('user:registered', sendEmail)
```

### emitter.offAny

`emitter.offAny`は、ワイルドカードリスナーを削除します。

```ts
emitter.offAny(callback)
```

### emitter.clearListeners

`emitter.clearListeners`メソッドは、指定されたイベントのすべてのリスナーを削除します。

```ts
//文字列ベースのイベント
emitter.clearListeners('user:registered')

//クラスベースのイベント
emitter.clearListeners(UserRegistered)
```

### emitter.clearAllListeners

`emitter.clearAllListeners`メソッドは、すべてのイベントのすべてのリスナーを削除します。

```ts
emitter.clearAllListeners()
```

## 利用可能なイベントの一覧
利用可能なイベントの一覧については、[イベントリファレンスガイド](../references/events.md)を参照してください。

## テスト中のイベントの偽装

イベントリスナーは、特定のアクションの後に副作用を実行するためによく使用されます。たとえば、新しく登録されたユーザーにメールを送信したり、注文のステータス更新後に通知を送信したりします。

テストを書く際には、テスト中に作成されたユーザーにメールを送信するのを避けたい場合があります。

イベントエミッターを偽装することで、イベントリスナーを無効にできます。次の例では、ユーザーのサインアップのHTTPリクエストを行う前に`emitter.fake`を呼び出しています。リクエストの後、`events.assertEmitted`メソッドを使用して`SignupController`が特定のイベントを発行することを確認しています。

```ts
import emitter from '@adonisjs/core/services/emitter'
import UserRegistered from '#events/user_registered'

test.group('ユーザーのサインアップ', () => {
  test('ユーザーアカウントを作成する', async ({ client, cleanup }) => {
    // highlight-start
    const events = emitter.fake()
    cleanup(() => {
      emitter.restore()
    })
    // highlight-end
  
    await client
      .post('signup')
      .form({
        email: 'foo@bar.com',
        password: 'secret',
      })
  })
  
  // highlight-start
  // イベントが発行されたことをアサートする
  events.assertEmitted(UserRegistered)
  // highlight-end
})
```

- `event.fake`メソッドは[EventBuffer](https://github.com/adonisjs/events/blob/main/src/events_buffer.ts)クラスのインスタンスを返し、アサーションや発行されたイベントの検索に使用できます。
- `emitter.restore`メソッドは偽装を元に戻します。偽装を元に戻した後、イベントは通常通り発行されます。

### 特定のイベントの偽装

`emitter.fake`メソッドは、引数なしでメソッドを呼び出すとすべてのイベントを偽装します。特定のイベントを偽装する場合は、最初の引数としてイベント名またはクラスを渡します。

```ts
// user:registeredイベントのみを偽装する
emitter.fake('user:registered')

// 複数のイベントを偽装する
emitter.fake([UserRegistered, OrderUpdated])
```

`emitter.fake`メソッドを複数回呼び出すと、古い偽装が削除されます。

### イベントのアサーション
偽装されたイベントに対してアサーションを行うために、`assertEmitted`、`assertNotEmitted`、`assertNoneEmitted`、`assertEmittedCount`メソッドを使用できます。

`assertEmitted`メソッドと`assertNotEmitted`メソッドは、最初の引数としてイベント名またはクラスのコンストラクターを受け入れ、オプションのファインダー関数を受け入れます。ファインダー関数は、イベントが発行されたことを示すために真偽値を返す必要があります。

```ts
const events = emitter.fake()

events.assertEmitted('user:registered')
events.assertNotEmitted(OrderUpdated)
```

```ts
// title: コールバックを使用したアサーション
events.assertEmitted(OrderUpdated, ({ data }) => {
  /**
   * orderIdが一致する場合にのみ
   * イベントが発行されたとみなす
   */
  return data.order.id === orderId
})
```

```ts
// title: イベントの数をアサートする
// 特定のイベントの数をアサートする
events.assertEmittedCount(OrderUpdated, 1)

// イベントが発行されなかったことをアサートする
events.assertNoneEmitted()
```
