---
summary: AdonisJSでHTTPコントローラについて学び、専用のファイル内でルートハンドラーを整理する方法を学びます。
---

# コントローラ

HTTPコントローラは、ルートハンドラーを専用のファイル内で整理するための抽象化レイヤーを提供します。ルートファイル内ですべてのリクエスト処理ロジックを表現する代わりに、コントローラクラスに移動します。

コントローラは、`./app/controllers`ディレクトリ内に格納され、各コントローラをプレーンなJavaScriptクラスとして表現します。次のコマンドを実行して新しいコントローラを作成できます。

参照も: [コントローラ作成コマンド](../references/commands.md#makecontroller)

```sh
node ace make:controller users
```

新しく作成されたコントローラは、`class`宣言でscaffoldされ、手動でメソッドを作成することもできます。この例では、`index`メソッドを作成し、ユーザーの配列を返します。

```ts
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index(ctx: HttpContext) {
    return [
      {
        id: 1,
        username: 'virk',
      },
      {
        id: 2,
        username: 'romain',
      },
    ]
  }
}
```

最後に、このコントローラをルートにバインドしましょう。`#controllers`エイリアスを使用してコントローラをインポートします。エイリアスは、[Node.jsのサブパスインポート機能](../getting_started/folder_structure.md#the-sub-path-imports)を使用して定義されます。

```ts
// title: start/routes.ts
import router from '@adonisjs/core/services/router'
const UsersController = () => import('#controllers/users_controller')

router.get('users', [UsersController, 'index'])
```

お気づきかもしれませんが、コントローラクラスのインスタンスを作成せずに、直接ルートに渡しています。これにより、AdonisJSが次のことができます。

- 各リクエストのたびにコントローラの新しいインスタンスを作成します。
- また、[IoCコンテナ](../concepts/dependency_injection.md)を使用してクラスを構築します。これにより、自動的な依存性の注入を活用できます。

:::caption{for="error"}

#### 非推奨

必要な場合、コントローラのインスタンスを手動で作成し、メソッドを実行することもできます。ただし、IoCコンテナの利点を失い、冗長なコードが増えるため、おすすめしません。

:::

```ts
// 🫤 いやいや
router.get('users', (ctx) => {
  return new UsersController().index(ctx)
})
```

また、関数を使用してコントローラを遅延ロードしていることにも注意してください。

:::warning

[HMR](../concepts/hmr.md)を使用している場合は、コントローラを遅延ロードする必要があります。

:::

コードベースが成長するにつれて、アプリケーションの起動時間に影響を与えることがわかるでしょう。その一因は、すべてのコントローラをルートファイル内でインポートしているためです。

コントローラはHTTPリクエストを処理するため、モデル、バリデータ、またはサードパーティのパッケージなど、他のモジュールをインポートすることがよくあります。その結果、ルートファイルはコードベース全体をインポートする中心地となります。

遅延ロードは、インポートステートメントを関数の後ろに移動し、動的インポートを使用するだけの簡単な方法です。

:::tip

[ESLintプラグイン](https://github.com/adonisjs/tooling-config/tree/main/packages/eslint-plugin)を使用して、標準的なコントローラのインポートを強制し、自動的に遅延ダイナミックインポートに変換することができます。

:::


## シングルアクションコントローラ

AdonisJSでは、シングルアクションコントローラを定義する方法が用意されています。これは、機能を明確に名前付けられたクラスにまとめる効果的な方法です。これを実現するには、コントローラ内に`handle`メソッドを定義する必要があります。

```ts
import type { HttpContext } from '@adonisjs/core/http'

export default class RegisterNewsletterSubscriptionController {
  async handle({}: HttpContext) {
    // ...
  }
}
```

次に、次のようにコントローラをルートに参照できます。

```ts
router.post('newsletter/subscriptions', [RegisterNewsletterSubscriptionController])
```


### マジックストリングの使用

コントローラを遅延ロードする別の方法は、コントローラとそのメソッドを文字列として参照することです。これはマジックストリングと呼ばれます。文字列自体には意味がなく、ルーターがコントローラを参照し、内部でインポートするために使用します。

次の例では、ルートファイル内にインポートステートメントがなく、コントローラのインポートパス+メソッドを文字列としてルートにバインドしています。

```ts
import router from '@adonisjs/core/services/router'

router.get('users', '#controllers/users_controller.index')
```

マジックストリングの唯一の欠点は、タイプセーフではないことです。インポートパスにタイプミスをすると、エディターからフィードバックが得られません。

一方、マジックストリングは、インポートステートメントのおかげで、ルートファイル内の視覚的な雑音をすべてクリーンアップすることができます。

マジックストリングの使用は主観的であり、個人的に使用するか、チームで使用するかは自由です。


## 依存性の注入

コントローラクラスは、[IoCコンテナ](../concepts/dependency_injection.md)を使用してインスタンス化されるため、コントローラのコンストラクターまたはコントローラメソッド内で依存関係をタイプヒントできます。

`UserService`クラスがある場合、次のようにコントローラ内でそのインスタンスを注入できます。

```ts
export default class UserService {
  async all() {
    // データベースからユーザーを返す
  }
}
```

```ts
import { inject } from '@adonisjs/core'
import UserService from '#services/user_service'

@inject()
export default class UsersController {
  constructor(protected userService: UserService) {}

  index() {
    return this.userService.all()
  }
}
```

### メソッドインジェクション

[メソッドインジェクション](../concepts/dependency_injection.md#using-method-injection)を使用して、コントローラメソッド内で`UserService`のインスタンスを直接注入することもできます。この場合、メソッド名に`@inject`デコレーターを適用する必要があります。

コントローラメソッドに渡される最初のパラメータは常にHttpContextです。したがって、2番目のパラメータとして`UserService`をタイプヒントする必要があります。

```ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

import UserService from '#services/user_service'

export default class UsersController {
  @inject()
  index(ctx: HttpContext, userService: UserService) {
    return userService.all()
  }
}
```

### 依存関係のツリー

依存関係の自動解決は、コントローラに限定されるわけではありません。コントローラ内でインジェクトされたクラスは、依存関係をタイプヒントでき、IoCコンテナが依存関係のツリーを自動的に構築します。

たとえば、`UserService`クラスを変更して、[HttpContext](../concepts/http_context.md)のインスタンスをコンストラクターの依存関係として受け入れるようにします。

```ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UserService {
  constructor(protected ctx: HttpContext) {}

  async all() {
    console.log(this.ctx.auth.user)
    // データベースからユーザーを返す
  }
}
```

この変更後、`UserService`は自動的に`HttpContext`クラスのインスタンスを受け取ります。また、コントローラには変更は必要ありません。

## リソース駆動型コントローラ

従来の[RESTful](https://en.wikipedia.org/wiki/Representational_state_transfer)アプリケーションでは、コントローラは単一のリソースを管理するために設計されるべきです。リソースは通常、**ユーザーリソース**や**投稿リソース**のようなアプリケーション内のエンティティです。

投稿リソースの例を取り上げ、そのCRUD操作を処理するエンドポイントを定義してみましょう。まず、最初にコントローラを作成します。

`--resource`フラグを使用して、リソースに対するコントローラを作成できます。次のメソッドが含まれたコントローラが作成されます。

```sh
node ace make:controller posts --resource
```

```ts
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  /**
   * すべての投稿のリストまたはページネーションを返す
   */
  async index({}: HttpContext) {}

  /**
   * 新しい投稿を作成するためのフォームを表示する
   *
   * APIサーバーを作成している場合は不要です。
   */
  async create({}: HttpContext) {}

  /**
   * 投稿を作成するためのフォームの送信を処理する
   */
  async store({ request }: HttpContext) {}

  /**
   * IDによって単一の投稿を表示する
   */
  async show({ params }: HttpContext) {}

  /**
   * IDによって既存の投稿を編集するためのフォームを表示する
   *
   * APIサーバーを作成している場合は不要です。
   */
  async edit({ params }: HttpContext) {}

  /**
   * 特定の投稿をIDで更新するためのフォームの送信を処理する
   */
  async update({ params, request }: HttpContext) {}

  /**
   * 特定の投稿をIDで削除するためのフォームの送信を処理する
   */
  async destroy({ params }: HttpContext) {}
}
```

次に、`router.resource`メソッドを使用して`PostsController`をリソースフルなルートにバインドしましょう。メソッドは、リソース名を第1引数として、コントローラの参照を第2引数として受け入れます。

```ts
import router from '@adonisjs/core/services/router'
const PostsController = () => import('#controllers/posts_controller')

router.resource('posts', PostsController)
```

`resource`メソッドによって登録されるルートのリストは、`node ace list:routes`コマンドを実行することで表示できます。

![](./post_resource_routes_list.png)

### ネストされたリソース

ドット`.`表記法を使用して、親リソースと子リソースの名前を指定することで、ネストされたリソースを作成できます。

次の例では、`comments`リソースを`posts`リソースの下にネストしたルートを作成しています。

```ts
router.resource('posts.comments', CommentsController)
```

![](./post_comments_resource_routes_list.png)

### シャローリソース

ネストされたリソースを使用する場合、子リソースのルートは常に親リソース名とそのIDで接頭辞が付けられます。たとえば：

- `/posts/:post_id/comments`ルートは、指定された投稿のすべてのコメントのリストを表示します。
- そして、`/posts/:post_id/comments/:id`ルートは、IDによって単一のコメントを表示します。

2番目のルートの`/posts/:post_id`の存在は無関係であり、IDによってコメントを参照できます。

シャローリソースは、URL構造をフラットに保ちながら（可能な限り）、そのルートを登録します。今回は、`posts.comments`をシャローリソースとして登録しましょう。

```ts
router.shallowResource('posts.comments', CommentsController)
```

![](./shallow_routes_list.png)

### リソースルートの名前付け

`router.resource`メソッドで作成されるルートは、リソース名とコントローラアクションの後に名前が付けられます。まず、リソース名をスネークケースに変換し、ドット`.`セパレーターを使用してアクション名を連結します。

| リソース         | アクション名 | ルート名               |
|------------------|-------------|--------------------------|
| posts            | index       | `posts.index`            |
| userPhotos       | index       | `user_photos.index`      |
| group-attributes | show        | `group_attributes.index` |

`resource.as`メソッドを使用して、すべてのルートのプレフィックス名を変更できます。次の例では、`group_attributes.index`ルート名を`attributes.index`に変更しています。

```ts
router.resource('group-attributes', GroupAttributesController).as('attributes')
```

`resource.as`メソッドに指定されたプレフィックスは、スネークケースに変換されます。必要な場合は、変換をオフにすることもできます。

```ts
router.resource('group-attributes', GroupAttributesController).as('groupAttributes', false)
```

### API専用ルートの登録

APIサーバーを作成する場合、リソースの作成と更新のフォームはフロントエンドクライアントやモバイルアプリによってレンダリングされます。そのため、これらのエンドポイントのルートを作成することは冗長です。

`resource.apiOnly`メソッドを使用して、`create`と`edit`のルートを削除することができます。その結果、5つのルートのみが作成されます。

```ts
router.resource('posts', PostsController).apiOnly()
```

### 特定のルートのみの登録

特定のルートのみを登録する場合は、`resource.only`または`resource.except`メソッドを使用できます。

`resource.only`メソッドは、アクション名の配列を受け入れ、それ以外のすべてのルートを削除します。次の例では、`index`、`store`、`destroy`アクションのルートのみが登録されます。

```ts
router
  .resource('posts', PostsController)
  .only(['index', 'store', 'destroy'])
```

`resource.except`メソッドは、`only`メソッドの逆で、指定されたルート以外のすべてのルートを削除します。

```ts
router
  .resource('posts', PostsController)
  .except(['destroy'])
```

### リソースパラメータの名前変更

`router.resource`メソッドによって生成されるルートは、パラメータ名として`id`を使用します。たとえば、単一の投稿を表示するための`GET /posts/:id`や投稿を削除するための`DELETE /post/:id`などです。

`resource.params`メソッドを使用して、パラメータ名を`id`から別の名前に変更できます。

```ts
router.resource('posts', PostsController).params({
  posts: 'post',
})
```

上記の変更により、次のルートが生成されます（一部のみ表示）。

| HTTPメソッド | ルート               | コントローラメソッド |
|-------------|---------------------|-------------------|
| GET         | `/posts/:post`      | show              |
| GET         | `/posts/:post/edit` | edit              |
| PUT         | `/posts/:post`      | update            |
| DELETE      | `/posts/:post`      | destroy           |

ネストされたリソースを使用する場合も、パラメータ名を変更できます。

```ts
router.resource('posts.comments', PostsController).params({
  posts: 'post',
  comments: 'comment',
})
```

### リソースルートにミドルウェアを割り当てる
リソースによって登録されるルートにミドルウェアを割り当てるには、`resource.use`メソッドを使用します。このメソッドは、アクション名の配列とそれに割り当てるミドルウェアを受け入れます。例えば：

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .resource('posts')
  .use(
    ['create', 'store', 'update', 'destroy'],
    middleware.auth()
  )
```

ワイルドカード(*)キーワードを使用して、すべてのルートにミドルウェアを割り当てることもできます。

```ts
router
  .resource('posts')
  .use('*', middleware.auth())
```

最後に、`.use`メソッドを複数回呼び出して複数のミドルウェアを割り当てることもできます。例えば：

```ts
router
  .resource('posts')
  .use(
    ['create', 'store', 'update', 'destroy'],
    middleware.auth()
  )
  .use(
    ['update', 'destroy'],
    middleware.someMiddleware()
  )
```
