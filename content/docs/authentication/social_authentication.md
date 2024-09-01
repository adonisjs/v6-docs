---
summary: '`@adonisjs/ally`パッケージを使用して、AdonisJSアプリケーションでソーシャル認証を実装します。'
---

# ソーシャル認証

`@adonisjs/ally`パッケージを使用して、AdonisJSアプリケーションでソーシャル認証を実装することができます。
Allyには、以下の組み込みドライバが付属しており、[カスタムドライバの登録](#カスタムソーシャルドライバの作成)も可能です。

- Twitter
- Facebook
- Spotify
- Google
- GitHub
- Discord
- LinkedIn

Allyは、ユーザーまたはアクセストークンを代理で保存しません。OAuth2およびOAuth1プロトコルを実装し、ソーシャルサービスでユーザーを認証し、ユーザーの詳細情報を提供します。その情報をデータベースに保存し、[auth](./introduction.md)パッケージを使用してアプリケーション内でユーザーをログインさせることができます。

## インストール

次のコマンドを使用してパッケージをインストールおよび設定します：

```sh
node ace add @adonisjs/ally

# CLIフラグとしてプロバイダを定義する
node ace add @adonisjs/ally --providers=github --providers=google
```

:::disclosure{title="addコマンドによって実行されるステップを確認"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/ally`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に以下のサービスプロバイダを登録します。

    ```ts
    {
      providers: [
        // ...他のプロバイダ
        () => import('@adonisjs/ally/ally_provider')
      ]
    }
    ```

3. `config/ally.ts`ファイルを作成します。このファイルには選択したOAuthプロバイダの設定が含まれます。

4. 選択したOAuthプロバイダの`CLIENT_ID`と`CLIENT_SECRET`を保存するための環境変数を定義します。

:::

## 設定
`@adonisjs/ally`パッケージの設定は`config/ally.ts`ファイルに保存されます。1つの設定ファイル内で複数のサービスの設定を定義することができます。

参照: [Config stub](https://github.com/adonisjs/ally/blob/main/stubs/config/ally.stub)

```ts
import { defineConfig, services } from '@adonisjs/ally'

defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID')!,
    clientSecret: env.get('GITHUB_CLIENT_SECRET')!,
    callbackUrl: '',
  }),
  twitter: services.twitter({
    clientId: env.get('TWITTER_CLIENT_ID')!,
    clientSecret: env.get('TWITTER_CLIENT_SECRET')!,
    callbackUrl: '',
  }),
})
```

### コールバックURLの設定
OAuthプロバイダは、ユーザーがログインリクエストを承認した後のリダイレクトレスポンスを処理するために、コールバックURLの登録を要求します。

コールバックURLはOAuthサービスプロバイダに登録する必要があります。例えば、GitHubを使用している場合は、GitHubアカウントにログインし、[新しいアプリを作成](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)し、GitHubのインターフェイスを使用してコールバックURLを定義する必要があります。

また、同じコールバックURLを`config/ally.ts`ファイル内にも`callbackUrl`プロパティを使用して登録する必要があります。

## 使用方法
パッケージが設定されたら、`ctx.ally`プロパティを使用してAlly APIとやり取りすることができます。`ally.use()`メソッドを使用して設定された認証プロバイダを切り替えることができます。例：

```ts
router.get('/github/redirect', ({ ally }) => {
  // GitHubドライバのインスタンス
  const gh = ally.use('github')
})

router.get('/twitter/redirect', ({ ally }) => {
  // Twitterドライバのインスタンス
  const twitter = ally.use('twitter')
})

// ドライバを動的に取得することもできます
router.get('/:provider/redirect', ({ ally, params }) => {
  const driverInstance = ally.use(params.provider)
}).where('provider', /github|twitter/)
```

### ユーザーを認証するためにユーザーをリダイレクトする
ソーシャル認証の最初のステップは、ユーザーをOAuthサービスにリダイレクトし、ユーザーが認証リクエストを承認するか拒否するのを待つことです。

`.redirect()`メソッドを使用してリダイレクトを実行できます。

```ts
router.get('/github/redirect', ({ ally }) => {
  return ally.use('github').redirect()
})
```

リダイレクト時にカスタムスコープやクエリ文字列の値を定義するために、コールバック関数を渡すこともできます。

```ts
router.get('/github/redirect', ({ ally }) => {
  return ally
    .use('github')
    .redirect((request) => {
      // highlight-start
      request.scopes(['user:email', 'repo:invite'])
      request.param('allow_signup', false)
      // highlight-end
    })
})
```

### コールバックレスポンスの処理
ユーザーは、認証リクエストを承認または拒否した後、アプリケーションの`callbackUrl`にリダイレクトされます。

このルート内では、`.user()`メソッドを呼び出してログイン済みのユーザーの詳細とアクセストークンを取得することができます。ただし、レスポンスにエラーが含まれていないかも確認する必要があります。

```ts
router.get('/github/callback', async ({ ally }) => {
  const gh = ally.use('github')

  /**
   * ユーザーがログインフローをキャンセルしてアクセスを拒否した場合
   */
  if (gh.accessDenied()) {
  return 'ログインプロセスをキャンセルしました'
  }

  /**
   * OAuthの状態検証に失敗しました。これは、
   * CSRFクッキーが期限切れになった場合に発生します。
   */
  if (gh.stateMisMatch()) {
  return 'リクエストを検証できません。もう一度お試しください'
  }

  /**
   * GitHubからエラーが返されました
   */
  if (gh.hasError()) {
  return gh.getError()
  }

  /**
   * ユーザー情報にアクセス
   */
  const user = await gh.user()
  return user
})
```

## ユーザープロパティ
`.user()`メソッドの戻り値からアクセスできるプロパティのリストは以下の通りです。これらのプロパティは、すべての基礎となるドライバで一貫しています。

```ts
const user = await gh.user()

user.id
user.email
user.emailVerificationState
user.name
user.nickName
user.avatarUrl
user.token
user.original
```

### id
OAuthプロバイダから返される一意のIDです。

### email
OAuthプロバイダから返されるメールアドレスです。OAuthリクエストでユーザーのメールアドレスを要求しない場合、値は`null`になります。

### emailVerificationState
多くのOAuthプロバイダは、未確認のメールを持つユーザーがログインし、OAuthリクエストを認証することを許可しています。このフラグを使用して、確認済みのメールを持つユーザーのみがログインできるようにする必要があります。

以下は、可能な値のリストです。

- `verified`：ユーザーのメールアドレスはOAuthプロバイダで確認済みです。
- `unverified`：ユーザーのメールアドレスは確認されていません。
- `unsupported`：OAuthプロバイダはメールの確認状態を共有しません。

### name
OAuthプロバイダから返されるユーザーの名前です。

### nickName
ユーザーの公開ニックネームです。OAuthプロバイダにニックネームの概念がない場合、`nickName`と`name`の値は同じになります。

### avatarUrl
ユーザーの公開プロフィール画像へのHTTP(s) URLです。

### token
`token`プロパティは、基礎となるアクセストークンオブジェクトへの参照です。トークンオブジェクトには以下のサブプロパティがあります。

```ts
user.token.token
user.token.type
user.token.refreshToken
user.token.expiresAt
user.token.expiresIn
```

| プロパティ | プロトコル | 説明 |
|---------|------------|------------|
| `token` | OAuth2 / OAuth1 | アクセストークンの値。`OAuth2`および`OAuth1`プロトコルで利用できます。 |
| `secret` | OAuth1 | `OAuth1`プロトコル専用のトークンシークレット。現在、Twitterが唯一の公式ドライバでOAuth1を使用しています。 |
| `type` | OAuth2 | トークンのタイプ。通常、[ベアラトークン](https://oauth.net/2/bearer-tokens/)です。
| `refreshToken` | OAuth2 | リフレッシュトークンを使用して新しいアクセストークンを作成できます。OAuthプロバイダがリフレッシュトークンをサポートしていない場合、値は`undefined`になります。 |
| `expiresAt` | OAuth2 | アクセストークンの有効期限が切れる絶対時間を表すluxon DateTimeクラスのインスタンスです。 |
| `expiresIn` | OAuth2 | トークンの有効期限を秒単位で表します。これは静的な値であり、時間が経過しても変化しません。 |

### original
OAuthプロバイダからの元のレスポンスへの参照です。正規化されたユーザープロパティのセットに必要な情報がすべて含まれていない場合に、元のレスポンスを参照する必要がある場合があります。

```ts
const user = await github.user()
console.log(user.original)
```

## スコープの定義
スコープは、ユーザーが認証リクエストを承認した後にアクセスしたいデータを指します。スコープの名前とアクセスできるデータはOAuthプロバイダによって異なるため、ドキュメントを参照する必要があります。

スコープは`config/ally.ts`ファイル内で定義することも、ユーザーをリダイレクトする際に定義することもできます。

TypeScriptのおかげで、利用可能なスコープに対して自動補完の提案が表示されます。

![](../digging_deeper/ally_autocomplete.png)

```ts
// title: config/ally.ts
github: {
  driver: 'github',
  clientId: env.get('GITHUB_CLIENT_ID')!,
  clientSecret: env.get('GITHUB_CLIENT_SECRET')!,
  callbackUrl: '',
  // highlight-start
  scopes: ['read:user', 'repo:invite'],
  // highlight-end
}
```

```ts
// title: リダイレクト時
ally
  .use('github')
  .redirect((request) => {
    // highlight-start
    request.scopes(['read:user', 'repo:invite'])
    // highlight-end
  })
```

## リダイレクトクエリパラメータの定義
スコープと同時に、リダイレクトリクエストのクエリパラメータをカスタマイズできます。次の例では、[Googleプロバイダ](https://developers.google.com/identity/protocols/oauth2/web-server#httprest)で適用される`prompt`と`access_type`パラメータを定義しています。

```ts
router.get('/google/redirect', async ({ ally }) => {
  return ally
    .use('google')
    .redirect((request) => {
      // highlight-start
      request
        .param('access_type', 'offline')
        .param('prompt', 'select_account')
      // highlight-end
    })
})
```

## アクセストークンからユーザーの詳細を取得する
データベースに保存されたアクセストークンからユーザーの詳細を取得したり、別のOAuthフローを介して提供されたアクセストークンからユーザーの詳細を取得したりする場合があります。たとえば、モバイルアプリを介したネイティブOAuthフローを使用し、アクセストークンを受け取った場合です。

`.userFromToken()`メソッドを使用してユーザーの詳細を取得できます。

```ts
const user = await ally
  .use('github')
  .userFromToken(accessToken)
```

OAuth1ドライバの場合は、`.userFromTokenAndSecret`メソッドを使用してユーザーの詳細を取得できます。

```ts
const user = await ally
  .use('github')
  .userFromTokenAndSecret(token, secret)
```

## ステートレス認証
多くのOAuthプロバイダは、[CSRFステートトークンの使用を推奨しています](https://developers.google.com/identity/openid-connect/openid-connect?hl=en#createxsrftoken)。これにより、アプリケーションがリクエスト偽造攻撃から保護されます。

AllyはCSRFトークンを作成し、暗号化されたクッキーに保存し、ユーザーが認証リクエストを承認した後に検証します。


ただし、何らかの理由でクッキーを使用できない場合は、ステートレスモードを有効にできます。ステートレスモードでは、ステートの検証が行われず、したがってCSRFクッキーは生成されません。

```ts
// title: リダイレクト
ally.use('github').stateless().redirect()
```

```ts
// title: コールバックレスポンスの処理
const gh = ally.use('github').stateless()
await gh.user()
```


## 完全な設定リファレンス
すべてのドライバの完全な設定リファレンスは以下の通りです。以下のオブジェクトをそのまま`config/ally.ts`ファイルにコピー＆ペーストできます。

<div class="disclosure_wrapper">

:::disclosure{title="GitHubの設定"}

```ts
{
  github: services.github({
    clientId: '',
    clientSecret: '',
    callbackUrl: '',

    // GitHubの設定
    login: 'adonisjs',
    scopes: ['user', 'gist'],
    allowSignup: true,
  })
}
```

:::

:::disclosure{title="Googleの設定"}

```ts
{
  google: services.google({
    clientId: '',
    clientSecret: '',
    callbackUrl: '',

    // Googleの設定
    prompt: 'select_account',
    accessType: 'offline',
    hostedDomain: 'adonisjs.com',
    display: 'page',
    scopes: ['userinfo.email', 'calendar.events'],
  })
}
```

:::

:::disclosure{title="Twitterの設定"}

```ts
{
  twitter: services.twitter({
    clientId: '',
    clientSecret: '',
    callbackUrl: '',
  })
}
```

:::

:::disclosure{title="Discordの設定"}

```ts
{
  discord: services.discord({
    clientId: '',
    clientSecret: '',
    callbackUrl: '',

    // Discordの設定
    prompt: 'consent' | 'none',
    guildId: '',
    disableGuildSelect: false,
    permissions: 10,
    scopes: ['identify', 'email'],
  })
}
```

:::

:::disclosure{title="LinkedInの設定"}

```ts
{
  linkedin: services.linkedin({
    clientId: '',
    clientSecret: '',
    callbackUrl: '',

    // LinkedInの設定
    scopes: ['r_emailaddress', 'r_liteprofile'],
  })
}
```

:::

:::disclosure{title="Facebookの設定"}

```ts
{
  facebook: services.facebook({
    clientId: '',
    clientSecret: '',
    callbackUrl: '',

    // Facebookの設定
    scopes: ['email', 'user_photos'],
    userFields: ['first_name', 'picture', 'email'],
    display: '',
    authType: '',
  })
}
```

:::

:::disclosure{title="Spotifyの設定"}

```ts
{
  spotify: services.spotify({
    clientId: '',
    clientSecret: '',
    callbackUrl: '',

    // Spotifyの設定
    scopes: ['user-read-email', 'streaming'],
    showDialog: false
  })
}
```

:::


</div>

## カスタムソーシャルドライバの作成
カスタムソーシャルドライバを実装してnpmで公開するための[スターターキット](https://github.com/adonisjs-community/ally-driver-boilerplate)を作成しました。詳しい手順については、スターターキットのREADMEを参照してください。
