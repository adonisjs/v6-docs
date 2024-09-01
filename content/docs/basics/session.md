---
summary: AdonisJSアプリケーション内で@adonisjs/sessionパッケージを使用して、ユーザーセッションを管理します。
---

# セッション

`@adonisjs/session`パッケージを使用して、AdonisJSアプリケーション内でユーザーセッションを管理できます。セッションパッケージは、さまざまなストレージプロバイダー間でセッションデータを保存するための統一されたAPIを提供します。

**以下はバンドルされたストアのリストです。**

- `cookie`: セッションデータは暗号化されたクッキー内に保存されます。クッキーストアは、データがクライアント側に保存されるため、マルチサーバーデプロイメントで優れたパフォーマンスを発揮します。

- `file`: セッションデータはサーバー内のファイルに保存されます。ファイルストアは、ロードバランサーとスティッキーセッションを実装する場合にのみ、マルチサーバーデプロイメントにスケールアウトします。

- `redis`: セッションデータはRedisデータベース内に保存されます。Redisストアは、大量のセッションデータを持つアプリケーションに推奨され、マルチサーバーデプロイメントにスケールアウトできます。

- `memory`: セッションデータはグローバルメモリストア内に保存されます。メモリストアはテスト中に使用されます。

組み込みのバックエンドストアに加えて、[カスタムセッションストアを作成して登録](#creating-a-custom-session-store)することもできます。

## インストール

次のコマンドを使用してパッケージをインストールし、設定します：

```sh
node ace add @adonisjs/session
```

:::disclosure{title="addコマンドによって実行されるステップを参照"}

1. 検出されたパッケージマネージャーを使用して`@adonisjs/session`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に次のサービスプロバイダーを登録します。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/session/session_provider')
      ]
    }
    ```

3. `config/session.ts`ファイルを作成します。

4. 次の環境変数とそのバリデーションを定義します。

    ```dotenv
    SESSION_DRIVER=cookie
    ```

5. `start/kernel.ts`ファイル内に次のミドルウェアを登録します。

    ```ts
    router.use([
      () => import('@adonisjs/session/session_middleware')
    ])
    ```

:::

## 設定
セッションパッケージの設定は、`config/session.ts`ファイルに保存されます。

参照: [セッション設定スタブ](https://github.com/adonisjs/session/blob/main/stubs/config/session.stub)

```ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  age: '2h',
  enabled: true,
  cookieName: 'adonis-session',
  clearWithBrowser: false,

  cookie: {
    path: '/',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },

  store: env.get('SESSION_DRIVER'),
  stores: {
    cookie: stores.cookie(),
  }
})
```

<dl>

<dt>

  enabled

</dt>

<dd>

ミドルウェアを一時的に有効または無効にします。ミドルウェアスタックから削除することなく、一時的に無効にできます。

</dd>


<dt>

  cookieName

</dt>

<dd>

セッションIDを保存するためのクッキー名です。必要に応じて名前を変更してください。

</dd>

<dt>

  clearWithBrowser

</dt>

<dd>

trueに設定すると、ユーザーがブラウザウィンドウを閉じた後にセッションIDクッキーが削除されます。このクッキーは、技術的には[セッションクッキー](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_the_lifetime_of_a_cookie)として知られています。

</dd>

<dt>

  age

</dt>

<dd>

`age`プロパティは、ユーザーアクティビティなしでセッションデータの有効性を制御します。指定された期間が経過すると、セッションデータは期限切れと見なされます。

</dd>

<dt>

  cookie

</dt>

<dd>

セッションIDクッキーの属性を制御します。[cookieの設定](./cookies.md#configuration)も参照してください。

</dd>

<dt>

store

</dt>

<dd>

セッションデータを保存するために使用するストアを定義します。固定値または環境変数から読み取ることができます。

</dd>

<dt>

  stores

</dt>

<dd>

`stores`オブジェクトは、1つまたは複数のバックエンドストアを設定するために使用されます。

ほとんどのアプリケーションでは、単一のストアを使用します。ただし、複数のストアを設定し、アプリケーションが実行される環境に基づいて切り替えることもできます。

</dd>

</dl>

---

### ストアの設定
`@adonisjs/session`パッケージにバンドルされたバックエンドストアのリストは次のとおりです。

```ts
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  store: env.get('SESSION_DRIVER'),

  // highlight-start
  stores: {
    cookie: stores.cookie(),

    file: stores.file({
      location: app.tmpPath('sessions')
    }),

    redis: stores.redis({
      connection: 'main'
    })
  }
  // highlight-end
})
```

<dl>

<dt>

  stores.cookie

</dt>

<dd>

`cookie`ストアは、セッションデータを暗号化してクッキー内に保存します。

</dd>


<dt>

  stores.file

</dt>

<dd>

`file`ストアの設定を定義します。このメソッドは、セッションファイルの保存場所として`location`パスを受け入れます。

</dd>


<dt>

  stores.redis

</dt>

<dd>

`redis`ストアの設定を定義します。このメソッドは、セッションデータの保存に使用する`connection`名を受け入れます。

`redis`ストアを使用する前に、[@adonisjs/redis](../database/redis.md)パッケージをインストールして設定する必要があります。

</dd>

</dl>

---

### 環境変数のバリデーションの更新
デフォルト以外のセッションストアを使用する場合は、`SESSION_DRIVER`環境変数のバリデーションも更新する必要があります。

次の例では、`cookie`ストアと`redis`ストアを設定しています。したがって、`SESSION_DRIVER`環境変数もこれらのいずれかになるように許可する必要があります。

```ts
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  // highlight-start
  store: env.get('SESSION_DRIVER'),

  stores: {
  cookie: stores.cookie(),
  redis: stores.redis({
    connection: 'main'
  })
  }
  // highlight-end
})
```

```ts
// title: start/env.ts
{
  SESSION_DRIVER: Env.schema.enum(['cookie', 'redis', 'memory'] as const)
}
```

## 基本的な例
セッションパッケージが登録されたら、[HTTPコンテキスト](../concepts/http_context.md)から`session`プロパティにアクセスできます。`session`プロパティは、セッションストアへのデータの読み書きに使用するAPIを公開します。

```ts
import router from '@adonisjs/core/services/router'

router.get('/theme/:color', async ({ params, session, response }) => {
  // highlight-start
  session.put('theme', params.color)
  // highlight-end
  response.redirect('/')
})

router.get('/', async ({ session }) => {
  // highlight-start
  const colorTheme = session.get('theme')
  // highlight-end
  return `You are using ${colorTheme} color theme`
})
```

セッションデータはリクエストの開始時にセッションストアから読み取られ、リクエストの終了時にストアに書き戻されます。そのため、すべての変更はリクエストが完了するまでメモリに保持されます。

## サポートされるデータ型
セッションデータは`JSON.stringify`を使用して文字列にシリアライズされるため、次のJavaScriptのデータ型をセッションの値として使用できます。

- 文字列
- 数値
- bigInt
- ブール値
- null
- オブジェクト
- 配列

```ts
// オブジェクト
session.put('user', {
  id: 1,
  fullName: 'virk',
})

// 配列
session.put('product_ids', [1, 2, 3, 4])

// ブール値
session.put('is_logged_in', true)

// 数値
session.put('visits', 10)

// bigInt
session.put('visits', BigInt(10))

// 日付オブジェクトはISO文字列に変換されます
session.put('visited_at', new Date())
```

## データの読み書き
`session`オブジェクトからデータとのやり取りするためのメソッドのリストは次のとおりです。

### get
ストアからキーの値を返します。ネストされた値を読み取るためにドット記法を使用できます。

```ts
session.get('key')
session.get('user.email')
```

2番目のパラメータとしてデフォルト値を定義することもできます。キーがストアに存在しない場合、デフォルト値が返されます。

```ts
session.get('visits', 0)
```

### has
セッションストアにキーが存在するかどうかを確認します。

```ts
if (session.has('visits')) {
}
```

### all
セッションストアからすべてのデータを返します。返される値は常にオブジェクトです。

```ts
session.all()
```

### put
キーと値のペアをセッションストアに追加します。ドット記法を使用してネストされた値を持つオブジェクトを作成できます。

```ts
session.put('user', { email: 'foo@bar.com' })

// 上記と同じ
session.put('user.email', 'foo@bar.com')
```

### forget
セッションストアからキーと値のペアを削除します。

```ts
session.forget('user')

// ユーザーオブジェクトからemailを削除します
session.forget('user.email')
```

### pull
`pull`メソッドはキーの値を返し、同時にストアから削除します。

```ts
const user = session.pull('user')
session.has('user') // false
```

### increment
`increment`メソッドはキーの値を増やします。キーが存在しない場合は新しいキー値が定義されます。

```ts
session.increment('visits')

// 4増やす
session.increment('visits', 4)
```

### decrement
`decrement`メソッドはキーの値を減らします。キーが存在しない場合は新しいキー値が定義されます。

```ts
session.decrement('visits')

// 4減らす
session.decrement('visits', 4)
```

### clear
`clear`メソッドはセッションストアからすべてのデータを削除します。

```ts
session.clear()
```

## セッションのライフサイクル
AdonisJSは最初のHTTPリクエスト時に空のセッションストアを作成し、一意のセッションIDに割り当てます。セッションリクエスト/レスポンスのライフサイクルがセッションに関与しない場合でも、`maxAge`プロパティを更新してセッションIDクッキーが期限切れにならないようにします。また、セッションストアに変更がある場合は、変更を更新および永続化するために通知されます。

次のリクエストごとに、セッションIDクッキーの`maxAge`プロパティを更新して、期限切れにならないようにします。また、セッションストアには変更がある場合には通知され、変更が更新されて永続化されます。

`sessionId`プロパティを使用して一意のセッションIDにアクセスできます。訪問者のセッションIDは期限切れになるまで変わりません。

```ts
console.log(session.sessionId)
```

### セッションIDの再生成
セッションIDを再生成することで、アプリケーション内の[セッション固定攻撃](https://owasp.org/www-community/attacks/Session_fixation)を防ぐことができます。匿名セッションをログイン済みユーザーに関連付ける場合は、セッションIDを再生成する必要があります。

`@adonisjs/auth`パッケージはセッションIDを自動的に再生成するため、手動で行う必要はありません。

```ts
/**
 * リクエストの最後に新しいセッションIDが割り当てられます
 */
session.regenerate()
```

## フラッシュメッセージ
フラッシュメッセージは、2つのHTTPリクエスト間でデータを渡すために使用されます。特定のアクションの後にユーザーにフィードバックを提供するためによく使用されます。たとえば、フォームの送信後に成功メッセージを表示したり、バリデーションエラーメッセージを表示したりします。

以下の例では、連絡フォームの表示とフォームの詳細をデータベースに送信するためのルートを定義しています。フォームの送信後、フラッシュメッセージを使用してユーザーをフォームに戻し、成功通知を表示します。

```ts
import router from '@adonisjs/core/services/router'

router.post('/contact', ({ session, request, response }) => {
  const data = request.all()
  // 連絡先データを保存
  
  // highlight-start
  session.flash('notification', {
    type: 'success',
    message: 'お問い合わせいただきありがとうございます。後ほどご連絡いたします。'
  })
  // highlight-end

  response.redirect().back()
})

router.get('/contact', ({ view }) => {
  return view.render('contact')
})
```

Edgeテンプレート内でフラッシュメッセージにアクセスするには、`flashMessage`タグまたは`flashMessages`プロパティを使用できます。

```edge
@flashMessage('notification')
  <div class="notification {{ $message.type }}">
    {{ $message.message }}
  </div>
@end

<form method="POST" action="/contact">
  <!-- フォームの残りの部分 -->
</form>
```

コントローラ内でフラッシュメッセージにアクセスするには、`session.flashMessages`プロパティを使用できます。

```ts
router.get('/contact', ({ view, session }) => {
  // highlight-start
  console.log(session.flashMessages.all())
  // highlight-end
  return view.render('contact')
})
```

### バリデーションエラーとフラッシュメッセージ
セッションミドルウェアは自動的に[バリデーション例外](./validation.md#error-handling)をキャプチャし、ユーザーをフォームにリダイレクトします。バリデーションエラーとフォームの入力データはフラッシュメッセージ内に保持され、Edgeテンプレート内でアクセスできます。

次の例では、以下のことを行っています。

- `title`入力フィールドの値には[`old`メソッド](../references/edge.md#old)を使用してアクセスします。
- エラーメッセージには[`@inputError`タグ](../references/edge.md#inputerror)を使用してアクセスします。

```edge
<form method="POST" action="/posts">
  <div>
    <label for="title"> タイトル </label>
    <input 
      type="text"
      id="title"
      name="title"
      value="{{ old('title') || '' }}"
    />

    @inputError('title')
      @each(message in $messages)
        <p> {{ message }} </p>
      @end
    @end
  </div>
</form>
```

### フラッシュメッセージの書き込み
フラッシュメッセージストアにデータを書き込むためのメソッドは次のとおりです。`session.flash`メソッドはキーと値のペアを受け取り、それをセッションストア内のフラッシュメッセージプロパティに書き込みます。

```ts
session.flash('key', value)
session.flash({
  key: value
})
```

リクエストデータを手動で読み取り、フラッシュメッセージに保存する代わりに、次のいずれかのメソッドを使用してフォームデータをフラッシュできます。

```ts
// title: flashAll
/**
 * リクエストデータをフラッシュするためのショートハンド
 */
session.flashAll()

/**
 * "flashAll"と同じ
 */
session.flash(request.all())
```

```ts
// title: flashOnly
/**
 * リクエストデータから選択したプロパティをフラッシュするためのショートハンド
 */
session.flashOnly(['username', 'email'])

/**
 * "flashOnly"と同じ
 */
session.flash(request.only(['username', 'email']))
```

```ts
// title: flashExcept
/**
 * リクエストデータから選択したプロパティをフラッシュするためのショートハンド
 */
session.flashExcept(['password'])

/**
 * "flashExcept"と同じ
 */
session.flash(request.except(['password']))
```

最後に、現在のフラッシュメッセージを再度フラッシュする場合は、`session.reflash`メソッドを使用できます。

```ts
session.reflash()
session.reflashOnly(['notification', 'errors'])
session.reflashExcept(['errors'])
```

### フラッシュメッセージの読み取り
フラッシュメッセージはリダイレクト後の次のリクエストでのみ利用可能です。これらには`session.flashMessages`プロパティを使用してアクセスできます。

```ts
console.log(session.flashMessages.all())
console.log(session.flashMessages.get('key'))
console.log(session.flashMessages.has('key'))
```

同じ`flashMessages`プロパティはEdgeテンプレートでも共有されており、次のようにアクセスできます。

参照: [Edgeヘルパーリファレンス](../references/edge.md#flashmessages)

```edge
{{ flashMessages.all() }}
{{ flashMessages.get('key') }}
{{ flashMessages.has('key') }}
```

最後に、次のEdgeタグを使用して特定のフラッシュメッセージまたはバリデーションエラーにアクセスできます。

```edge
{{-- キーによって任意のフラッシュメッセージを読み取る --}}
@flashMessage('key')
  {{ inspect($message) }}
@end

{{-- 一般的なエラーを読み取る --}}
@error('key')
  {{ inspect($message) }}
@end

{{-- バリデーションエラーを読み取る --}}
@inputError('key')
  {{ inspect($messages) }}
@end
```

## イベント
`@adonisjs/session`パッケージがディスパッチするイベントのリストは、[イベントリファレンスガイド](../references/events.md#sessioninitiated)を参照してください。

## カスタムセッションストアの作成
セッションストアは、[SessionStoreContract](https://github.com/adonisjs/session/blob/main/src/types.ts#L23C18-L23C38)インターフェイスを実装し、次のメソッドを定義する必要があります。

```ts
import {
  SessionData,
  SessionStoreFactory,
  SessionStoreContract,
} from '@adonisjs/session/types'

/**
 * 受け入れる設定
 */
export type MongoDBConfig = {}

/**
 * ドライバの実装
 */
export class MongoDBStore implements SessionStoreContract {
  constructor(public config: MongoDBConfig) {
  }

  /**
   * セッションIDに対するセッションデータを返します。メソッドはnullまたはキーと値のペアのオブジェクトを返さなければなりません。
   */
  async read(sessionId: string): Promise<SessionData | null> {
  }

  /**
   * セッションデータを提供されたセッションIDに対して保存します。
   */
  async write(sessionId: string, data: SessionData): Promise<void> {
  }

  /**
   * 指定されたセッションIDのセッションデータを削除します。
   */
  async destroy(sessionId: string): Promise<void> {
  }

  /**
   * セッションの有効期限をリセットします。
   */
  async touch(sessionId: string): Promise<void> {
  }
}

/**
 * ストアを参照するためのファクトリ関数
 */
export function mongoDbStore (config: MongoDbConfig): SessionStoreFactory {
  return (ctx, sessionConfig) => {
    return new MongoDBStore(config)
  }
}
```

上記のコード例では、次の値をエクスポートしています。

- `MongoDBConfig`: 受け入れる設定のTypeScriptの型です。

- `MongoDBStore`: クラスとしてのストアの実装です。`SessionStoreContract`インターフェイスに準拠する必要があります。

- `mongoDbStore`: 最後に、HTTPリクエストごとにストアのインスタンスを作成するためのファクトリ関数です。

### ストアの使用

ストアが作成されたら、`mongoDbStore`ファクトリ関数を使用して設定ファイル内で参照できます。

```ts
// title: config/session.ts
import { defineConfig } from '@adonisjs/session'
import { mongDbStore } from 'my-custom-package'

export default defineConfig({
  stores: {
    mongodb: mongoDbStore({
      // 設定はここに記述します
    })
  }
})
```

### データのシリアライズについて

`write`メソッドはセッションデータをオブジェクトとして受け取り、保存する前に文字列に変換する必要がある場合があります。これには任意のシリアライズパッケージを使用するか、AdonisJSヘルパーモジュールが提供する[MessageBuilder](../references/helpers.md#message-builder)ヘルパーを使用できます。インスピレーションのために、公式の[セッションストア](https://github.com/adonisjs/session/blob/main/src/stores/redis.ts#L59)を参照してください。
