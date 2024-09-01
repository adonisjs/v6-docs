---
summary: アプリケーションクラスについて学び、環境、状態、プロジェクトファイルへのURLとパスを取得する方法を学びます。
---

# アプリケーション

[Application](https://github.com/adonisjs/application/blob/main/src/application.ts)クラスは、AdonisJSアプリケーションを組み立てるための重要な役割を果たします。このクラスを使用して、アプリケーションが実行されている環境について知ることや、アプリケーションの現在の状態を取得すること、特定のディレクトリへのパスを作成できます。

参考: [アプリケーションライフサイクル](./application_lifecycle.md)

## 環境

環境はアプリケーションの実行環境を指します。アプリケーションは常に以下のいずれかの環境で起動されます。

- `web`環境は、HTTPサーバーのために起動されたプロセスを指します。

- `console`環境は、REPLコマンドを除くAceコマンドを指します。

- `repl`環境は、`node ace repl`コマンドを使用して起動されたプロセスを指します。

- 最後に、`test`環境は、`node ace test`コマンドを使用して起動されたプロセスを指します。

`getEnvironment`メソッドを使用してアプリケーションの環境にアクセスできます。

```ts
import app from '@adonisjs/core/services/app'

console.log(app.getEnvironment())
```

アプリケーションの環境を起動前に切り替えることもできます。これの素晴らしい例は、REPLコマンドです。

`node ace repl`コマンドはアプリケーションを`console`環境で起動しますが、コマンドは内部的にREPLプロンプトを表示する前に環境を`repl`に切り替えます。

```ts
if (!app.isBooted) {
  app.setEnvironment('repl')
}
```

## Node環境

`nodeEnvironment`プロパティを使用して、Node.jsの環境にアクセスできます。この値は`NODE_ENV`環境変数への参照です。ただし、値は一貫性を持たせるために正規化されます。

```ts
import app from '@adonisjs/core/services/app'

console.log(app.nodeEnvironment)
```

| NODE_ENV | 正規化された値 |
|----------|---------------|
| dev      | development   |
| develop  | development   |
| stage    | staging       |
| prod     | production    |
| testing  | test          |

また、以下のプロパティを使用して現在の環境を簡潔に知ることもできます。

- `inProduction`: アプリケーションが本番環境で実行されているかどうかをチェックします。
- `inDev`: アプリケーションが開発環境で実行されているかどうかをチェックします。
- `inTest`: アプリケーションがテスト環境で実行されているかどうかをチェックします。

```ts
import app from '@adonisjs/core/services/app'

// 本番環境で実行されているかどうか
app.inProduction
app.nodeEnvironment === 'production'

// 開発環境で実行されているかどうか
app.inDev
app.nodeEnvironment === 'development'

// テスト環境で実行されているかどうか
app.inTest
app.nodeEnvironment === 'test'
```

## 状態

状態はアプリケーションの現在の状態を指します。アプリケーションの現在の状態によって、利用可能なフレームワークの機能が大きく異なります。たとえば、アプリケーションが`booted`状態でない限り、[コンテナバインディング](./dependency_injection.md#container-bindings)や[コンテナサービス](./container_services.md)にアクセスすることはできません。

アプリケーションは常に以下のいずれかの状態にあります。

- `created`: アプリケーションのデフォルトの状態です。

- `initiated`: この状態では、環境変数を解析/検証し、`adonisrc.ts`ファイルを処理します。

- `booted`: この状態では、アプリケーションのサービスプロバイダが登録および起動されます。

- `ready`: ready状態は環境によって異なります。たとえば、`web`環境では、ready状態は新しいHTTPリクエストを受け付ける準備ができていることを意味します。

- `terminated`: アプリケーションが終了し、プロセスがまもなく終了します。`web`環境では新しいHTTPリクエストを受け付けません。

```ts
import app from '@adonisjs/core/services/app'

console.log(app.getState())
```

また、以下の短縮プロパティを使用して、アプリケーションが特定の状態にあるかどうかを知ることもできます。

```ts
import app from '@adonisjs/core/services/app'

// アプリケーションがbooted状態かどうか
app.isBooted
app.getState() !== 'created' && app.getState() !== 'initiated'

// アプリケーションがready状態かどうか
app.isReady
app.getState() === 'ready'

// gracefully attempting to terminate the app
app.isTerminating

// アプリケーションがterminated状態かどうか
app.isTerminated
app.getState() === 'terminated'
```

## プロセスシグナルのリスニング

`app.listen`または`app.listenOnce`メソッドを使用して、[POSIXシグナル](https://man7.org/linux/man-pages/man7/signal.7.html)をリスンできます。内部的には、Node.jsの`process`オブジェクトにリスナーが登録されます。

```ts
import app from '@adonisjs/core/services/app'

// SIGTERMシグナルのリスニング
app.listen('SIGTERM', () => {
})

// SIGTERMシグナルのリスニング（一度だけ）
app.listenOnce('SIGTERM', () => {
})
```

場合によっては、リスナーを条件付きで登録したい場合があります。たとえば、pm2環境内で`SIGINT`シグナルをリスンする場合があります。

`listenIf`または`listenOnceIf`メソッドを使用して、リスナーを条件付きで登録できます。最初の引数の値がtruthyである場合にのみリスナーが登録されます。

```ts
import app from '@adonisjs/core/services/app'

app.listenIf(app.managedByPm2, 'SIGTERM', () => {
})

app.listenOnceIf(app.managedByPm2, 'SIGTERM', () => {
})
```

## 親プロセスへの通知

アプリケーションが子プロセスとして起動する場合、`app.notify`メソッドを使用して親プロセスにメッセージを送信できます。内部的には、`process.send`メソッドを使用しています。

```ts
import app from '@adonisjs/core/services/app'

app.notify('ready')

app.notify({
  isReady: true,
  port: 3333,
  host: 'localhost'
})
```

## プロジェクトファイルへのURLとパスの作成

絶対URLやプロジェクトファイルへのパスを自己構築する代わりに、以下のヘルパーを使用することを強くオススメします。

### makeURL

makeURLメソッドは、プロジェクトルート内の指定されたファイルまたはディレクトリへのファイルURLを返します。たとえば、ファイルをインポートする際にURLを生成できます。

```ts
import app from '@adonisjs/core/services/app'

const files = [
  './tests/welcome.spec.ts',
  './tests/maths.spec.ts'
]

await Promise.all(files.map((file) => {
  return import(app.makeURL(file).href)
}))
```

### makePath

`makePath`メソッドは、プロジェクトルート内の指定されたファイルまたはディレクトリへの絶対パスを返します。

```ts
import app from '@adonisjs/core/services/app'

app.makePath('app/middleware/auth.ts')
```

### configPath

プロジェクトのconfigディレクトリ内のファイルへのパスを返します。

```ts
app.configPath('shield.ts')
// /project_root/config/shield.ts

app.configPath()
// /project_root/config
```

### publicPath

プロジェクトのpublicディレクトリ内のファイルへのパスを返します。

```ts
app.publicPath('style.css')
// /project_root/public/style.css

app.publicPath()
// /project_root/public
```

### providersPath

プロバイダディレクトリ内のファイルへのパスを返します。

```ts
app.providersPath('app_provider')
// /project_root/providers/app_provider.ts

app.providersPath()
// /project_root/providers
```

### factoriesPath

データベースファクトリディレクトリ内のファイルへのパスを返します。

```ts
app.factoriesPath('user.ts')
// /project_root/database/factories/user.ts

app.factoriesPath()
// /project_root/database/factories
```

### migrationsPath

データベースマイグレーションディレクトリ内のファイルへのパスを返します。

```ts
app.migrationsPath('user.ts')
// /project_root/database/migrations/user.ts

app.migrationsPath()
// /project_root/database/migrations
```

### seedersPath
データベースシーダディレクトリ内のファイルへのパスを返します。

```ts
app.seedersPath('user.ts')
// /project_root/database/seeders/users.ts

app.seedersPath()
// /project_root/database/seeders
```

### languageFilesPath
言語ファイルディレクトリ内のファイルへのパスを返します。

```ts
app.languageFilesPath('en/messages.json')
// /project_root/resources/lang/en/messages.json

app.languageFilesPath()
// /project_root/resources/lang
```

### viewsPath
ビューディレクトリ内のファイルへのパスを返します。

```ts
app.viewsPath('welcome.edge')
// /project_root/resources/views/welcome.edge

app.viewsPath()
// /project_root/resources/views
```

### startPath
startディレクトリ内のファイルへのパスを返します。

```ts
app.startPath('routes.ts')
// /project_root/start/routes.ts

app.startPath()
// /project_root/start
```

### tmpPath

プロジェクトルート内の`tmp`ディレクトリ内のファイルへのパスを返します。

```ts
app.tmpPath('logs/mail.txt')
// /project_root/tmp/logs/mail.txt

app.tmpPath()
// /project_root/tmp
```

### httpControllersPath

HTTPコントローラディレクトリ内のファイルへのパスを返します。

```ts
app.httpControllersPath('users_controller.ts')
// /project_root/app/controllers/users_controller.ts

app.httpControllersPath()
// /project_root/app/controllers
```

### modelsPath

モデルディレクトリ内のファイルへのパスを返します。

```ts
app.modelsPath('user.ts')
// /project_root/app/models/user.ts

app.modelsPath()
// /project_root/app/models
```

### servicesPath

サービスディレクトリ内のファイルへのパスを返します。

```ts
app.servicesPath('user.ts')
// /project_root/app/services/user.ts

app.servicesPath()
// /project_root/app/services
```

### exceptionsPath

例外ディレクトリ内のファイルへのパスを返します。

```ts
app.exceptionsPath('handler.ts')
// /project_root/app/exceptions/handler.ts

app.exceptionsPath()
// /project_root/app/exceptions
```

### mailsPath

メールディレクトリ内のファイルへのパスを返します。

```ts
app.mailsPath('verify_email.ts')
// /project_root/app/mails/verify_email.ts

app.mailsPath()
// /project_root/app/mails
```

### middlewarePath

ミドルウェアディレクトリ内のファイルへのパスを返します。

```ts
app.middlewarePath('auth.ts')
// /project_root/app/middleware/auth.ts

app.middlewarePath()
// /project_root/app/middleware
```

### policiesPath

ポリシーディレクトリ内のファイルへのパスを返します。

```ts
app.policiesPath('posts.ts')
// /project_root/app/polices/posts.ts

app.policiesPath()
// /project_root/app/polices
```

### validatorsPath

バリデータディレクトリ内のファイルへのパスを返します。

```ts
app.validatorsPath('create_user.ts')
// /project_root/app/validators/create_user.ts

app.validatorsPath()
// /project_root/app/validators/create_user.ts
```

### commandsPath

コマンドディレクトリ内のファイルへのパスを返します。

```ts
app.commandsPath('greet.ts')
// /project_root/commands/greet.ts

app.commandsPath()
// /project_root/commands
```

### eventsPath

イベントディレクトリ内のファイルへのパスを返します。

```ts
app.eventsPath('user_created.ts')
// /project_root/app/events/user_created.ts

app.eventsPath()
// /project_root/app/events
```

### listenersPath

リスナーディレクトリ内のファイルへのパスを返します。

```ts
app.listenersPath('send_invoice.ts')
// /project_root/app/listeners/send_invoice.ts

app.listenersPath()
// /project_root/app/listeners
```

## ジェネレーター

ジェネレーターは、さまざまなエンティティのクラス名やファイル名を作成するために使用されます。たとえば、`generators.controllerFileName`メソッドを使用して、コントローラのファイル名を生成できます。

```ts
import app from '@adonisjs/core/services/app'

app.generators.controllerFileName('user')
// 出力 - users_controller.ts

app.generators.controllerName('user')
// 出力 - UsersController
```

[利用可能なジェネレーターのリストを表示するには、`generators.ts`のソースコードを参照してください。](https://github.com/adonisjs/application/blob/main/src/generators.ts)
