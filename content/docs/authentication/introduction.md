---
summary: AdonisJSでの認証システムについて学び、アプリケーションでユーザーの認証を行う方法を学びます。
---

# 認証

AdonisJSには、アプリケーションのユーザーをログインして認証するために使用できる堅牢で安全な認証システムが付属しています。サーバーレンダリングされたアプリケーション、SPAクライアント、モバイルアプリなど、すべてのアプリケーションに対して認証を設定できます。

認証パッケージは、**ガード**と**プロバイダ**を中心に構築されています。

- ガードは、特定のログインタイプのエンドツーエンドの実装です。たとえば、`session`ガードを使用すると、クッキーとセッションを使用してユーザーを認証できます。一方、`access_tokens`ガードを使用すると、トークンを使用してクライアントを認証できます。

- プロバイダは、データベースからユーザーやトークンを検索するために使用されます。組み込みのプロバイダを使用するか、独自のプロバイダを実装できます。

:::note

アプリケーションのセキュリティを確保するために、ユーザーのパスワードとトークンは適切にハッシュ化されています。さらに、AdonisJSのセキュリティプリミティブは[タイミング攻撃](https://en.wikipedia.org/wiki/Timing_attack)や[セッション固定攻撃](https://owasp.org/www-community/attacks/Session_fixation)から保護されています。

:::

## Authパッケージでサポートされていない機能

authパッケージは、HTTPリクエストの認証に焦点を当てており、次の機能はその範囲外です。

- **登録フォーム**、**メールの確認**、**アカウントの有効化**などのユーザー登録機能。
- **パスワードの回復**や**メールの更新**などのアカウント管理機能。
- ロールの割り当てや権限の検証。代わりに、[bouncerを使用](../security/authorization.md)してアプリケーションで認可チェックを実装してください。

<!-- :::note

**完全なユーザー管理システムをお探しですか？**\

公式のパッケージであるPersonaをチェックしてください。Personaは、完全なユーザー管理システムを備えたスターターキットです。

ユーザー登録、メール管理、セッショントラッキング、プロファイル管理、2FAのための使用準備が整っています。

::: -->


## 認証ガードの選択

次の組み込みの認証ガードは、アプリケーションのセキュリティを損なうことなく、ユーザーの認証を行うためのもっとも簡単なワークフローを提供します。また、カスタムの認証ガードを[作成することもできます](./custom_auth_guard.md)。

### セッション

セッションガードは、[@adonisjs/session](../basics/session.md)パッケージを使用してセッションストア内のログイン状態を追跡します。

セッションとクッキーはインターネット上で長い間使用されており、ほとんどのアプリケーションでうまく機能します。セッションガードを使用することをお勧めします。

- サーバーレンダリングされたWebアプリケーションを作成している場合。
- または、AdonisJS APIとそのクライアントが同じトップレベルドメインにある場合。たとえば、`api.example.com`と`example.com`。

### アクセストークン

アクセストークンは、ログイン成功後にユーザーに発行される暗号的に安全なランダムトークン（不透明なアクセストークンとも呼ばれる）です。AdonisJSサーバーがクッキーの書き込み/読み取りができない場合にアクセストークンを使用できます。例：

- ネイティブモバイルアプリ。
- AdonisJS APIサーバーと異なるドメインにホストされたWebアプリケーション。

アクセストークンを使用する場合、クライアント側のアプリケーションがそれらを安全に保存する責任があります。アクセストークンは、アプリケーションへの制限なしに（ユーザーを代表して）アプリケーションへのアクセスを提供し、漏洩するとセキュリティの問題につながる可能性があります。

### ベーシック認証

ベーシック認証ガードは、[HTTP認証フレームワーク](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)の実装であり、クライアントはユーザーの資格情報をbase64エンコードされた文字列として`Authorization`ヘッダーを介して渡す必要があります。

ベーシック認証よりも安全なログインシステムを実装するためのより良い方法があります。ただし、アプリケーションがアクティブな開発中である間は、一時的に使用できます。

## ユーザープロバイダの選択
このガイドの前半で説明したように、ユーザープロバイダは認証プロセス中にユーザーを検索する責任を持ちます。

ユーザープロバイダはガードごとに固有です。たとえば、セッションガードのユーザープロバイダは、IDによってユーザーを検索し、アクセストークンガードのユーザープロバイダもアクセストークンを検証する責任があります。

組み込みのガード用には、Lucidユーザープロバイダが付属しており、Lucidモデルを使用してユーザーを検索し、トークンを生成し、トークンを検証します。

<!-- Lucidを使用していない場合は、[カスタムユーザープロバイダを実装する必要があります](). -->

## インストール

authシステムは、`web`と`api`のスターターキットで事前に設定されています。ただし、次のように手動でインストールおよび設定することもできます。

```sh
# セッションガード（デフォルト）で設定する
node ace add @adonisjs/auth --guard=session

# アクセストークンガードで設定する
node ace add @adonisjs/auth --guard=access_tokens

# ベーシック認証ガードで設定する
node ace add @adonisjs/auth --guard=basic_auth
```

:::disclosure{title="addコマンドによって実行される手順を参照"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/auth`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に次のサービスプロバイダを登録します。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/auth/auth_provider')
      ]
    }
    ```

3. `start/kernel.ts`ファイル内に次のミドルウェアを作成および登録します。

    ```ts
    router.use([
      () => import('@adonisjs/auth/initialize_auth_middleware')
    ])
    ```

    ```ts
    router.named({
      auth: () => import('#middleware/auth_middleware'),
      // セッションガードを使用している場合のみ
      guest: () => import('#middleware/guest_middleware')
    })
    ```

4. `app/models`ディレクトリ内にユーザーモデルを作成します。
5. `users`テーブルのためのデータベースマイグレーションを作成します。
6. 選択したガードのためのデータベースマイグレーションを作成します。
:::

## 初期化認証ミドルウェア
セットアップ中に、`@adonisjs/auth/initialize_auth_middleware`をアプリケーションに登録します。このミドルウェアは、[Authenticator](https://github.com/adonisjs/auth/blob/main/src/authenticator.ts)クラスのインスタンスを作成し、リクエストの残りの部分と共有する責任を持ちます。

なお、初期化認証ミドルウェアはリクエストを認証したり、ルートを保護したりするものではありません。それは、認証を初期化し、リクエストの残りの部分と共有するためにのみ使用されます。ルートを保護するには、[auth](./session_guard.md#protecting-routes)ミドルウェアを使用する必要があります。

また、同じ認証インスタンスはEdgeテンプレート（アプリケーションがEdgeを使用している場合）と共有され、`auth`プロパティを使用してアクセスできます。例：

```edge
@if(auth.isAuthenticated)
  <p>こんにちは{{ auth.user.email }}さん</p>
@end
```

## ユーザーテーブルの作成
`configure`コマンドは、`database/migrations`ディレクトリ内に`users`テーブルのデータベースマイグレーションを作成します。アプリケーションの要件に応じて、このファイルを開いて変更を加えてください。

デフォルトでは、次のカラムが作成されます。

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

また、`users`テーブルからカラムを定義、名前変更、または削除した場合は、`User`モデルも更新してください。

## 次のステップ

- [ユーザーの資格情報を検証](./verifying_user_credentials.md)する方法を学びます。
- [セッションガード](./session_guard.md)を使用して状態を保持する認証を行います。
- [アクセストークンガード](./access_tokens_guard.md)を使用してトークンベースの認証を行います。
