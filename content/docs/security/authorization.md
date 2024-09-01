---
summary: \`@adonisjs/bouncer`パッケージを使用して、AdonisJSアプリケーションでの認可チェックを行う方法を学びます。
---

# 認可

`@adonisjs/bouncer`パッケージを使用して、AdonisJSアプリケーションで認可チェックを行うことができます。Bouncerは、**アビリティ**と**ポリシー**としての認可チェックを書くためのJavaScriptファーストのAPIを提供します。

アビリティとポリシーの目的は、アクションの認可ロジックを1つの場所に抽象化し、コードベース全体で再利用することです。

- [アビリティ](#アビリティの定義)は関数として定義され、アプリケーションに少なくかつシンプルな認可チェックがある場合に適しています。

- [ポリシー](#ポリシーの定義)はクラスとして定義され、アプリケーションの各リソースごとに1つのポリシーを作成する必要があります。ポリシーはまた、[依存性の自動注入](#依存性の注入)の恩恵を受けることもできます。

:::note

BouncerはRBACやACLの実装ではありません。代わりに、AdonisJSアプリケーションでアクションを認可するための細かい制御を持つ低レベルのAPIを提供しています。

:::

## インストール

次のコマンドを使用してパッケージをインストールして設定します：

```sh
node ace add @adonisjs/bouncer
```

:::disclosure{title="addコマンドによって実行される手順を参照"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/bouncer`パッケージをインストールします。

2. 次のサービスプロバイダとコマンドを`adonisrc.ts`ファイル内に登録します。

    ```ts
    {
      commands: [
        // ...other commands
        () => import('@adonisjs/bouncer/commands')
      ],
      providers: [
        // ...other providers
        () => import('@adonisjs/bouncer/bouncer_provider')
      ]
    }
    ```

3. `app/abilities/main.ts`ファイルを作成し、アビリティを定義してエクスポートします。

4. `app/policies/main.ts`ファイルを作成し、すべてのポリシーをコレクションとしてエクスポートします。

5. `middleware`ディレクトリ内に`initialize_bouncer_middleware`を作成します。

6. `start/kernel.ts`ファイル内に次のミドルウェアを登録します。

    ```ts
    router.use([
      () => import('#middleware/initialize_bouncer_middleware')
    ])
    ```

:::

:::tip
**視覚的な学習者の方へ** - Adocastsの友達からの[AdonisJS Bouncer](https://adocasts.com/series/adonisjs-bouncer)無料スクリーンキャストシリーズをチェックしてみてください。
:::

## Bouncerの初期化ミドルウェア
セットアップ中に、アプリケーション内に`#middleware/initialize_bouncer_middleware`ミドルウェアを作成して登録します。初期化ミドルウェアは、現在の認証済みユーザーのために[Bouncer](https://github.com/adonisjs/bouncer/blob/main/src/bouncer.ts)クラスのインスタンスを作成し、リクエストの残りの部分で`ctx.bouncer`プロパティを介して共有します。

また、`ctx.view.share`メソッドを使用してEdgeテンプレートとも同じBouncerインスタンスを共有します。アプリケーション内でEdgeを使用していない場合は、ミドルウェアから次のコードを削除しても構いません。

:::note

初期セットアップ時に作成されるファイルを含め、アプリケーションのソースコードはすべてあなたのものです。そのため、それらを変更してアプリケーション環境に合わせて動作させることに躊躇しないでください。

:::

```ts
async handle(ctx: HttpContext, next: NextFn) {
  ctx.bouncer = new Bouncer(
    () => ctx.auth.user || null,
    abilities,
    policies
  ).setContainerResolver(ctx.containerResolver)

  // delete-start
  /**
   * Edgeを使用していない場合は削除してください
   */
  if ('view' in ctx) {
    ctx.view.share(ctx.bouncer.edgeHelpers)
  }
  // delete-end

  return next()
}
```

## アビリティの定義

アビリティは通常`./app/abilities/main.ts`ファイル内に記述されるJavaScript関数です。このファイルから複数のアビリティをエクスポートできます。

次の例では、`Bouncer.ability`メソッドを使用して`editPost`というアビリティを定義しています。実装コールバックは、ユーザーを認可するために`true`を返し、アクセスを拒否するために`false`を返す必要があります。

:::note

アビリティは常に認可チェックに必要な追加のパラメーターに続いて、最初のパラメーターとして`User`を受け入れるべきです。

:::

```ts
// title: app/abilities/main.ts
import User from '#models/user'
import Post from '#models/post'
import { Bouncer } from '@adonisjs/bouncer'

export const editPost = Bouncer.ability((user: User, post: Post) => {
  return user.id === post.userId
})
```

### 認可の実行
アビリティを定義したら、`ctx.bouncer.allows`メソッドを使用して認可チェックを実行できます。

Bouncerは、アビリティコールバックに現在ログインしているユーザーを自動的に最初のパラメーターとして渡し、残りのパラメーターは手動で指定する必要があります。

```ts
import Post from '#models/post'
// highlight-start
import { editPost } from '#abilities/main'
// highlight-end
import router from '@adonisjs/core/services/router'

router.put('posts/:id', async ({ bouncer, params, response }) => {
  /**
   * 認可チェックを行うために、IDで投稿を検索します。
   */
  const post = await Post.findOrFail(params.id)

  /**
   * アビリティを使用して、ログインしているユーザーが
   * アクションを実行できるかどうかを確認します。
   */
  // highlight-start
  if (await bouncer.allows(editPost, post)) {
    return '投稿を編集できます。'
  }
  // highlight-end

  return response.forbidden('投稿を編集することはできません。')
})
```

`bouncer.allows`メソッドの反対は`bouncer.denies`メソッドです。`if not`ステートメントを書く代わりに、このメソッドを使用することもできます。

```ts
if (await bouncer.denies(editPost, post)) {
  response.abort('投稿を編集することはできません。', 403)
}
```

### ゲストユーザーの許可
デフォルトでは、Bouncerはログインしていないユーザーに対して認可チェックを拒否し、アビリティコールバックを呼び出しません。

ただし、ゲストユーザーでも動作する特定のアビリティを定義する場合があります。たとえば、ゲストには公開された投稿を表示することを許可し、投稿の作成者には下書きも表示することを許可します。

`allowGuest`オプションを使用して、ゲストユーザーを許可するアビリティを定義できます。この場合、オプションは最初のパラメーターとして定義され、コールバックは2番目のパラメーターとして定義されます。

```ts
export const viewPost = Bouncer.ability(
  // highlight-start
  { allowGuest: true },
  // highlight-end
  (user: User | null, post: Post) => {
    /**
     * 公開された投稿には誰でもアクセスできるようにします。
     */
    if (post.isPublished) {
      return true
    }

    /**
     * ゲストは非公開の投稿を表示できません。
     */
    if (!user) {
      return false
    }

    /**
     * 投稿の作成者は非公開の投稿も表示できます。
     */
    return user.id === post.userId
  }
)
```

### ログインしているユーザー以外のユーザーの認可
ログインしているユーザー以外のユーザーを認可する場合は、`Bouncer`コンストラクタを使用して指定されたユーザーのために新しいBouncerインスタンスを作成できます。

```ts
import User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'

const user = await User.findOrFail(1)
// highlight-start
const bouncer = new Bouncer(user)
// highlight-end

if (await bouncer.allows(editPost, post)) {
}
```

## ポリシーの定義
ポリシーは、認可チェックをクラスとして組織化するための抽象化レイヤーを提供します。通常、リソースごとに1つのポリシーを作成することをオススメします。たとえば、アプリケーションに`Post`モデルがある場合、投稿の作成や更新などのアクションを認可するために`PostPolicy`クラスを作成する必要があります。

ポリシーは`./app/policies`ディレクトリ内に格納され、各ファイルが単一のポリシーを表します。次のコマンドを実行して新しいポリシーを作成できます。

参照：[ポリシーの作成コマンド](../references/commands.md#makepolicy)

```sh
node ace make:policy post
```

ポリシークラスは[BasePolicy](https://github.com/adonisjs/bouncer/blob/main/src/base_policy.ts)クラスを拡張し、実行したい認可チェックのためのメソッドを実装できます。次の例では、`create`、`edit`、`delete`の投稿に対する認可チェックを定義しています。

```ts
// title: app/policies/post_policy.ts
import User from '#models/user'
import Post from '#models/post'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  /**
   * すべてのログインユーザーは投稿を作成できます。
   */
  create(user: User): AuthorizerResponse {
    return true
  }

  /**
   * 投稿の作成者のみが投稿を編集できます。
   */
  edit(user: User, post: Post): AuthorizerResponse {
    return user.id === post.userId
  }

  /**
   * 投稿の作成者のみが投稿を削除できます。
   */
  delete(user: User, post: Post): AuthorizerResponse {
    return user.id === post.userId
  }
}
```

### 認可の実行
ポリシーを作成したら、`bouncer.with`メソッドを使用して認可に使用するポリシーを指定し、`bouncer.allows`または`bouncer.denies`メソッドをチェーンして認可チェックを実行できます。

:::note

`bouncer.with`メソッドの後にチェーンされた`allows`メソッドと`denies`メソッドは型安全であり、ポリシークラスで定義したメソッドに基づいて補完リストが表示されます。

:::

```ts
import Post from '#models/post'
import PostPolicy from '#policies/post_policy'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async create({ bouncer, response }: HttpContext) {
    // highlight-start
    if (await bouncer.with(PostPolicy).denies('create')) {
      return response.forbidden('投稿を作成することはできません。')
    }
    // highlight-end

    //コントローラのロジックを続行します
  }

  async edit({ bouncer, params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // highlight-start
    if (await bouncer.with(PostPolicy).denies('edit', post)) {
      return response.forbidden('投稿を編集することはできません。')
    }
    // highlight-end

    //コントローラのロジックを続行します
  }

  async delete({ bouncer, params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // highlight-start
    if (await bouncer.with(PostPolicy).denies('delete', post)) {
      return response.forbidden('投稿を削除することはできません。')
    }
    // highlight-end

    //コントローラのロジックを続行します
  }
}
```

### ゲストユーザーの許可
[アビリティと同様に](#ゲストユーザーの許可)、ポリシーも`@allowGuest`デコレータを使用してゲストユーザーのための認可チェックを定義できます。

例：
```ts
import User from '#models/user'
import Post from '#models/post'
import { BasePolicy, allowGuest } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  @allowGuest()
  view(user: User | null, post: Post): AuthorizerResponse {
    /**
     * 公開された投稿には誰でもアクセスできるようにします。
     */
    if (post.isPublished) {
      return true
    }

    /**
     * ゲストは非公開の投稿を表示できません。
     */
    if (!user) {
      return false
    }

    /**
     * 投稿の作成者は非公開の投稿も表示できます。
     */
    return user.id === post.userId
  }
}
```

### ポリシーフック
`before`メソッドと`after`メソッドをポリシークラスに定義することで、認可チェックの周りでアクションを実行できます。一般的な使用例は、特定のユーザーに常にアクセスを許可または拒否することです。

:::note

`before`メソッドと`after`メソッドは、ログインしているユーザーの有無に関係なく常に呼び出されます。そのため、`user`の値が`null`になる場合を扱う必要があります。

:::

`before`メソッドの応答は次のように解釈されます。

- `true`の値は成功した認可と見なされ、アクションメソッドは呼び出されません。
- `false`の値はアクセスが拒否されたと見なされ、アクションメソッドは呼び出されません。
- `undefined`の戻り値の場合、バウンサーはアクションメソッドを実行して認可チェックを行います。

```ts
export default class PostPolicy extends BasePolicy {
  async before(user: User | null, action: string, ...params: any[]) {
    /**
     * 管理者ユーザーは常にチェックを行わずに許可します。
     */
    if (user && user.isAdmin) {
      return true
    }
  }
}
```

`after`メソッドはアクションメソッドからの生の応答を受け取り、新しい値を返すことで以前の応答を上書きできます。`after`からの応答は次のように解釈されます。

- `true`の値は成功した認可と見なされ、以前の応答は破棄されます。
- `false`の値はアクセスが拒否されたと見なされ、以前の応答は破棄されます。
- `undefined`の戻り値の場合、バウンサーは以前の応答を引き続き使用します。

```ts
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  async after(
    user: User | null,
    action: string,
    response: AuthorizerResponse,
    ...params: any[]
  ) {
    if (user && user.isAdmin) {
      return true
    }
  }
}
```

### 依存性の注入
ポリシークラスは[IoCコンテナ](../concepts/dependency_injection.md)を使用して作成されるため、`@inject`デコレータを使用してポリシーコンストラクタ内で依存関係を型指定して注入できます。

```ts
import { inject } from '@adonisjs/core'
import { PermissionsResolver } from '#services/permissions_resolver'

// highlight-start
@inject()
// highlight-end
export class PostPolicy extends BasePolicy {
  constructor(
    // highlight-start
    protected permissionsResolver: PermissionsResolver
    // highlight-end
  ) {
    super()
  }
}
```

ポリシークラスがHTTPリクエスト中に作成される場合は、[HttpContext](../concepts/http_context.md)のインスタンスも注入できます。

```ts
// highlight-start
import { HttpContext } from '@adonisjs/core/http'
// highlight-end
import { PermissionsResolver } from '#services/permissions_resolver'

@inject()
export class PostPolicy extends BasePolicy {
  // highlight-start
  constructor(protected ctx: HttpContext) {
  // highlight-end
    super()
  }
}
```

## AuthorizationExceptionのスロー
`allows`メソッドと`denies`メソッドの代わりに、`bouncer.authorize`メソッドを使用して認可チェックを実行することもできます。このメソッドは、チェックが失敗した場合に[AuthorizationException](https://github.com/adonisjs/bouncer/blob/main/src/errors.ts#L19)をスローします。

```ts
router.put('posts/:id', async ({ bouncer, params }) => {
  const post = await Post.findOrFail(post)
  // highlight-start
  await bouncer.authorize(editPost, post)
  // highlight-end

  /**
   * 例外が発生しなかった場合、ユーザーは投稿を編集できると見なすことができます。
   */
})
```

AdonisJSは、`AuthorizationException`を使用して、次のコンテンツネゴシエーションルールにしたがって`403 - Forbidden`のHTTPレスポンスに変換します。

- `Accept=application/json`ヘッダーを持つHTTPリクエストは、エラーメッセージの配列を受け取ります。各配列要素は`message`プロパティを持つオブジェクトです。

- `Accept=application/vnd.api+json`ヘッダーを持つHTTPリクエストは、[JSON API](https://jsonapi.org/format/#errors)仕様にしたがってフォーマットされたエラーメッセージの配列を受け取ります。

- その他のリクエストは、プレーンテキストの応答メッセージを受け取ります。ただし、[ステータスページ](../basics/exception_handling.md#status-pages)を使用して、認可エラーのカスタムエラーページを表示することもできます。

また、[グローバル例外ハンドラ](../basics/exception_handling.md)内で`AuthorizationException`エラーを自己処理することもできます。

```ts
import { errors } from '@adonisjs/bouncer'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_AUTHORIZATION_FAILURE) {
      return ctx
        .response
        .status(error.status)
        .send(error.getResponseMessage(ctx))
    }
    // highlight-end

    return super.handle(error, ctx)
  }
}
```

## カスタム認可応答のカスタマイズ
アビリティやポリシーから真偽値を返す代わりに、[AuthorizationResponse](https://github.com/adonisjs/bouncer/blob/main/src/response.ts)クラスを使用してカスタムのエラーレスポンスを構築することもできます。

`AuthorizationResponse`クラスを使用すると、カスタムのHTTPステータスコードとエラーメッセージを定義できます。

```ts
import User from '#models/user'
import Post from '#models/post'
import { Bouncer, AuthorizationResponse } from '@adonisjs/bouncer'

export const editPost = Bouncer.ability((user: User, post: Post) => {
  if (user.id === post.userId) {
    return true
  }

  // highlight-start
  return AuthorizationResponse.deny('投稿が見つかりません', 404)
  // highlight-end
})
```

[@adonisjs/i18n](../digging_deeper/i18n.md)パッケージを使用している場合は、`.t`メソッドを使用してローカライズされた応答を返すこともできます。HTTPリクエストに基づいてユーザーの言語に応じて、デフォルトのメッセージよりも翻訳メッセージが使用されます。

```ts
export const editPost = Bouncer.ability((user: User, post: Post) => {
  if (user.id === post.userId) {
    return true
  }

  // highlight-start
  return AuthorizationResponse
    .deny('投稿が見つかりません', 404) // デフォルトのメッセージ
    .t('errors.not_found') // 翻訳識別子
  // highlight-end
})
```

### カスタム応答ビルダの使用

個々の認可チェックごとにカスタムエラーメッセージを定義する柔軟性は素晴らしいです。ただし、常に同じ応答を返す場合は、同じコードを繰り返すことになります。

そのため、Bouncerのデフォルトの応答ビルダを次のようにオーバーライドできます。

```ts
import { Bouncer, AuthorizationResponse } from '@adonisjs/bouncer'

Bouncer.responseBuilder = (response: boolean | AuthorizationResponse) => {
  if (response instanceof AuthorizationResponse) {
    return response
  }

  if (response === true) {
    return AuthorizationResponse.allow()
  }

  return AuthorizationResponse
    .deny('リソースが見つかりません', 404)
    .t('errors.not_found')
}
```

## アビリティとポリシーの事前登録
これまでのガイドでは、使用するたびに明示的にアビリティやポリシーをインポートしています。ただし、事前に登録すると、名前の文字列としてアビリティやポリシーを参照できます。

アビリティとポリシーを事前に登録することは、TypeScriptのコードベース内でのみ使用するよりもインポートを整理するために役立ちます。ただし、Edgeテンプレート内ではDXが向上します。

次のコード例は、ポリシーを事前に登録しない場合と登録する場合のEdgeテンプレートの比較です。

:::caption{for="error"}
**事前登録しない場合。あまりきれいではありません**
:::

```edge
{{-- 最初にアビリティをインポートします --}}
@let(editPost = (await import('#abilities/main')).editPost)

@can(editPost, post)
  {{-- 投稿を編集できます --}}
@end
```

:::caption{for="success"}
**事前登録する場合**
:::

```edge
{{-- アビリティ名を文字列として参照します --}}
@can('editPost', post)
  {{-- 投稿を編集できます --}}
@end
```

`initialize_bouncer_middleware.ts`ファイルを開くと、Bouncerインスタンスを作成する際にすでにアビリティとポリシーをインポートして事前に登録していることがわかります。

```ts
// highlight-start
import * as abilities from '#abilities/main'
import { policies } from '#policies/main'
// highlight-end

export default InitializeBouncerMiddleware {
  async handle(ctx, next) {
    ctx.bouncer = new Bouncer(
      () => ctx.auth.user,
      // highlight-start
      abilities,
      policies
      // highlight-end
    )
  }
}
```

### 注意点

- コードベースの他の部分でアビリティを定義することを決定した場合は、ミドルウェア内でインポートして事前に登録するようにしてください。

- ポリシーの場合、`make:policy`コマンドを実行するたびに、ポリシーをポリシーコレクション内に登録するようにプロンプトを受け入れることを確認してください。ポリシーコレクションは`./app/policies/main.ts`ファイル内で定義されています。

  ```ts
  // title: app/policies/main.ts
  export const policies = {
    PostPolicy: () => import('#polices/post_policy'),
    CommentPolicy: () => import('#polices/comment_policy')
  }
  ```

### 事前登録されたアビリティとポリシーの参照
次の例では、インポートを削除し、アビリティとポリシーを名前の文字列として参照しています。ただし、**文字列ベースのAPIも型安全ですが、コードエディタの「定義に移動」機能は機能しない場合があります**。

```ts
// title: アビリティの使用例
// delete-start
import { editPost } from '#abilities/main'
// delete-end

router.put('posts/:id', async ({ bouncer, params, response }) => {
  const post = await Post.findOrFail(params.id)

  // delete-start
  if (await bouncer.allows(editPost, post)) {
  // delete-end
  // insert-start
  if (await bouncer.allows('editPost', post)) {
  // insert-end
    return '投稿を編集できます。'
  }
})
```

```ts
// title: ポリシーの使用例
// delete-start
import PostPolicy from '#policies/post_policy'
// delete-end

export default class PostsController {
  async create({ bouncer, response }: HttpContext) {
    // delete-start
    if (await bouncer.with(PostPolicy).denies('create')) {
    // delete-end
    // insert-start
    if (await bouncer.with('PostPolicy').denies('create')) {
    // insert-end
      return response.forbidden('投稿を作成することはできません。')
    }

    //コントローラのロジックを続行します
  }
}
```

## インターフェイス内の認可チェック
Edgeテンプレート内で認可チェックを実行するには、[アビリティとポリシーを事前に登録](#事前登録されたアビリティとポリシーの参照)する必要があります。登録が完了したら、`@can`タグと`@cannot`タグを使用して認可チェックを実行できます。

これらのタグは、最初のパラメーターとして`ability`名または`policy.method`名を受け入れ、アビリティまたはポリシーが受け入れる残りのパラメーターを続けます。

```edge
// title: アビリティを使用した例
@can('editPost', post)
  {{-- 投稿を編集できます --}}
@end

@cannot('editPost', post)
  {{-- 投稿を編集できません --}}
@end
```

```edge
// title: ポリシーを使用した例
@can('PostPolicy.edit', post)
  {{-- 投稿を編集できます --}}
@end

@cannot('PostPolicy.edit', post)
  {{-- 投稿を編集できません --}}
@end
```

## イベント
`@adonisjs/bouncer`パッケージがディスパッチするイベントのリストを表示するには、[イベントリファレンスガイド](../references/events.md#authorizationfinished)を参照してください。
