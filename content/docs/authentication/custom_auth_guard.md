---
summary: AdonisJSのカスタム認証ガードを作成する方法を学びます。
---

# カスタム認証ガードの作成

authパッケージを使用すると、組み込みのガードでは対応できないユースケースのためのカスタム認証ガードを作成できます。このガイドでは、JWTトークンを使用した認証のためのガードを作成します。

認証ガードは次の概念を中心に展開されます。

- **ユーザープロバイダー**: ガードはユーザーに依存しないようにする必要があります。データベースからユーザーをクエリして検索するための関数をハードコードすべきではありません。代わりに、ガードはユーザープロバイダーに依存し、その実装をコンストラクタの依存関係として受け入れるべきです。

- **ガードの実装**: ガードの実装は`GuardContract`インターフェイスに準拠する必要があります。このインターフェイスは、ガードをAuthレイヤーの他の部分と統合するために必要なAPIを記述しています。

## `UserProvider`インターフェイスの作成

ガードは`UserProvider`インターフェイスと、それが含むべきメソッド/プロパティを定義する責任があります。たとえば、[セッションガード](https://github.com/adonisjs/auth/blob/develop/modules/session_guard/types.ts#L153-L166)が受け入れるUserProviderは、[アクセストークンガード](https://github.com/adonisjs/auth/blob/develop/modules/access_tokens_guard/types.ts#L192-L222)が受け入れるUserProviderよりもはるかにシンプルです。

したがって、すべてのガードの実装に準拠するUser Providerを作成する必要はありません。各ガードは、受け入れるUserプロバイダーの要件を指定できます。

この例では、`user ID`を使用してデータベース内のユーザーを検索するためのプロバイダーが必要です。使用するデータベースやクエリの方法は問いません。それは、Userプロバイダーを実装する開発者の責任です。

:::note

このガイドで書くすべてのコードは、最初は`app/auth/guards`ディレクトリ内に格納された単一のファイルに記述することができます。

:::

```ts
// title: app/auth/guards/jwt.ts
import { symbols } from '@adonisjs/auth'

/**
 * ユーザープロバイダーとガードの橋渡し
 */
export type JwtGuardUser<RealUser> = {
  /**
   * ユーザーの一意のIDを返します
   */
  getId(): string | number | BigInt

  /**
   * オリジナルのユーザーオブジェクトを返します
   */
  getOriginal(): RealUser
}

/**
 * JWTガードが受け入れるUserProviderのインターフェイス
 */
export interface JwtUserProviderContract<RealUser> {
  /**
   * ガードの実装が実際のユーザーのデータ型（RealUser）を推論するために使用できるプロパティ
   */
  [symbols.PROVIDER_REAL_USER]: RealUser

  /**
   * ガードと実際のユーザー値の間のアダプターとして機能するユーザーオブジェクトを作成します
   */
  createUserForGuard(user: RealUser): Promise<JwtGuardUser<RealUser>>

  /**
   * IDによってユーザーを検索します
   */
  findById(identifier: string | number | BigInt): Promise<JwtGuardUser<RealUser> | null>
}
```

上記の例では、`JwtUserProviderContract`インターフェイスは、`RealUser`というジェネリックユーザープロパティを受け入れます。このインターフェイスは、実際のユーザー（データベースから取得するユーザー）の形式を知りませんので、ジェネリックとして受け入れます。

例：
- Lucidモデルを使用する実装では、Modelのインスタンスを返します。したがって、`RealUser`の値はそのインスタンスになります。

- Prismaを使用する実装では、特定のプロパティを持つユーザーオブジェクトを返します。したがって、`RealUser`の値はそのオブジェクトになります。

要約すると、`JwtUserProviderContract`は、ユーザープロバイダーの実装にユーザーのデータ型を決定する権限を委ねています。

### `JwtGuardUser`タイプの理解
`JwtGuardUser`タイプは、ユーザープロバイダーとガードの間の橋渡しとして機能します。ガードは`getId`メソッドを使用してユーザーの一意のIDを取得し、`getOriginal`メソッドを使用してリクエストの認証後のユーザーオブジェクトを取得します。

## ガードの実装
`JwtGuard`クラスを作成し、[`GuardContract`](https://github.com/adonisjs/auth/blob/main/src/types.ts#L30)インターフェイスで必要なメソッド/プロパティを定義しましょう。最初はこのファイルには多くのエラーがありますが、進めるにつれてすべてのエラーが消えていきます。

:::note

次の例のすべてのプロパティ/メソッドの横にあるコメントを読んでください。

:::

```ts
import { symbols } from '@adonisjs/auth'
import { AuthClientResponse, GuardContract } from '@adonisjs/auth/types'

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * ガードによって発行されるイベントとそのタイプのリスト
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {}

  /**
   * ガードドライバーの一意の名前
   */
  driverName: 'jwt' = 'jwt'

  /**
   * 現在のHTTPリクエスト中に認証が試行されたかどうかを知るためのフラグ
   */
  authenticationAttempted: boolean = false

  /**
   * 現在のリクエストが認証されたかどうかを知るためのブール値
   */
  isAuthenticated: boolean = false

  /**
   * 現在認証されたユーザーへの参照
   */
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER]

  /**
   * 指定されたユーザーのためにJWTトークンを生成します。
   */
  async generate(user: UserProvider[typeof symbols.PROVIDER_REAL_USER]) {
  }

  /**
   * 現在のHTTPリクエストを認証し、有効なJWTトークンがある場合はユーザーインスタンスを返し、それ以外の場合は例外をスローします。
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
  }

  /**
   * authenticateと同じですが、例外をスローしません
   */
  async check(): Promise<boolean> {
  }

  /**
   * 認証されたユーザーを返すか、エラーをスローします
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
  }

  /**
   * このメソッドは、テスト中に「loginAs」メソッドを使用してユーザーをログインするときにJapaによって呼び出されます。
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
  }
}
```

## ユーザープロバイダーの受け入れ
ガードは認証中にユーザープロバイダーを受け入れる必要があります。コンストラクタパラメータとして受け入れ、プライベートな参照を保存します。

```ts
export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  // insert-start
  #userProvider: UserProvider

  constructor(
    userProvider: UserProvider
  ) {
    this.#userProvider = userProvider
  }
  // insert-end
}
```

## トークンの生成
`generate`メソッドを実装し、指定されたユーザーのためにトークンを生成しましょう。トークンを生成するために、npmから`jsonwebtoken`パッケージをインストールして使用します。

```sh
npm i jsonwebtoken @types/jsonwebtoken
```

また、トークンに署名するために**シークレットキー**を使用する必要があるため、`constructor`メソッドを更新し、オプションオブジェクトを介してシークレットキーを受け入れるようにします。

```ts
// insert-start
import jwt from 'jsonwebtoken'

export type JwtGuardOptions = {
  secret: string
}
// insert-end

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  #userProvider: UserProvider
  // insert-start
  #options: JwtGuardOptions
  // insert-end

  constructor(
    userProvider: UserProvider
    // insert-start
    options: JwtGuardOptions
    // insert-end
  ) {
    this.#userProvider = userProvider
    // insert-start
    this.#options = options
    // insert-end
  }

  /**
   * 指定されたユーザーのためにJWTトークンを生成します。
   */
  async generate(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ) {
    // insert-start
    const providerUser = await this.#userProvider.createUserForGuard(user)
    const token = jwt.sign({ userId: providerUser.getId() }, this.#options.secret)

    return {
      type: 'bearer',
      token: token
    }
    // insert-end
  }
}
```

- まず、`userProvider.createUserForGuard`メソッドを使用してプロバイダーユーザーのインスタンス（実際のユーザーとガードの間のブリッジ）を作成します。

- 次に、`jwt.sign`メソッドを使用してペイロード内の`userId`を持つ署名付きトークンを作成し、それを返します。

## リクエストの認証

リクエストの認証には次の手順が含まれます。

- リクエストヘッダーまたはクッキーからJWTトークンを読み取る。
- トークンの正当性を検証する。
- トークンが生成されたユーザーを取得する。
私たちのガードは、[HttpContext](../concepts/http_context.md)にアクセスする必要がありますので、クラスの`constructor`を更新して引数として受け入れましょう。

```ts
// insert-start
import type { HttpContext } from '@adonisjs/core/http'
// insert-end

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  // insert-start
  #ctx: HttpContext
  // insert-end
  #userProvider: UserProvider
  #options: JwtGuardOptions

  constructor(
    // insert-start
    ctx: HttpContext,
    // insert-end
    userProvider: UserProvider,
    options: JwtGuardOptions
  ) {
    // insert-start
    this.#ctx = ctx
    // insert-end
    this.#userProvider = userProvider
    this.#options = options
  }
}
```

この例では、トークンを`authorization`ヘッダーから読み取ります。ただし、実装を調整してクッキーもサポートするようにすることもできます。


```ts
import {
  symbols,
  // insert-start
  errors
  // insert-end
} from '@adonisjs/auth'

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * 現在のHTTPリクエストを認証し、有効なJWTトークンがある場合はユーザーインスタンスを返し、それ以外の場合は例外をスローします。
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    /**
     * すでに指定されたリクエストに対して認証が行われている場合は、再認証を回避します
     */
    if (this.authenticationAttempted) {
      return this.getUserOrFail()
    }
    this.authenticationAttempted = true

    /**
     * authヘッダーが存在することを確認します
     */
    const authHeader = this.#ctx.request.header('authorization')
    if (!authHeader) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * ヘッダーの値を分割し、トークンを読み取ります
     */
    const [, token] = authHeader.split('Bearer ')
    if (!token) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * トークンを検証します
     */
    const payload = jwt.verify(token, this.#options.secret)
    if (typeof payload !== 'object' || !('userId' in payload)) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * ユーザーIDでユーザーを検索し、それに対する参照を保存します
     */
    const providerUser = await this.#userProvider.findById(payload.userId)
    if (!providerUser) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    this.user = providerUser.getOriginal()
    return this.getUserOrFail()
  }
}
```

## `check`メソッドの実装
`check`メソッドは`authenticate`メソッドのサイレントバージョンであり、次のように実装できます。

```ts
export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * Same as authenticate, but does not throw an exception
   */
  async check(): Promise<boolean> {
    // insert-start
    try {
      await this.authenticate()
      return true
    } catch {
      return false
    }
    // insert-end
  }
}
```

## `getUserOrFail`メソッドの実装
最後に、`getUserOrFail`メソッドを実装しましょう。ユーザーのインスタンスを返すか、エラーをスローします（ユーザーが存在しない場合）。

```ts
export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * 認証されたユーザーを返すか、エラーをスローします
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    // insert-start
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    return this.user
    // insert-end
  }
}
```

## `authenticateAsClient`メソッドの実装
`authenticateAsClient`メソッドは、テスト中に[`loginAs`メソッド](../testing/http_tests.md#authenticating-users)を使用してユーザーをログインする場合に使用されます。JWTの実装では、このメソッドはJWTトークンを含む`authorization`ヘッダーを返す必要があります。

```ts
export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  /**
   * このメソッドは、テスト中に「loginAs」メソッドを使用してユーザーをログインするときにJapaによって呼び出されます。
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    // insert-start
    const token = await this.generate(user)
    return {
      headers: {
        authorization: `Bearer ${token.token}`,
      },
    }
    // insert-end
  }
}
```

## ガードの使用
`config/auth.ts`に移動し、`guards`リスト内でガードを登録しましょう。

```ts
import { defineConfig } from '@adonisjs/auth'
// insert-start
import { sessionUserProvider } from '@adonisjs/auth/session'
import env from '#start/env'
import { JwtGuard } from '../app/auth/jwt/guard.js'
// insert-end

// insert-start
const jwtConfig = {
  secret: env.get('APP_KEY'),
}
const userProvider = sessionUserProvider({
  model: () => import('#models/user'),
})
// insert-end

const authConfig = defineConfig({
  default: 'jwt',
  guards: {
    // insert-start
    jwt: (ctx) => {
      return new JwtGuard(ctx, userProvider, jwtConfig)
    },
    // insert-end
  },
})

export default authConfig
```

ご覧のように、`sessionUserProvider`を`JwtGuard`の実装と共に使用しています。これは、`JwtUserProviderContract`インターフェイスがセッションガードで作成されたユーザープロバイダーと互換性があるためです。

したがって、独自のユーザープロバイダーの実装を作成する代わりに、セッションガードから作成されたものを再利用しています。

## 最終的な例
実装が完了したら、`jwt`ガードを他の組み込みガードと同様に使用できます。以下は、JWTトークンの生成と検証の例です。

```ts
import User from '#models/user'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.post('login', async ({ request, auth }) => {
  const { email, password } = request.all()
  const user = await User.verifyCredentials(email, password)

  return await auth.use('jwt').generate(user)
})

router
  .get('/', async ({ auth }) => {
    return auth.getUserOrFail()
  })
  .use(middleware.auth())
```
