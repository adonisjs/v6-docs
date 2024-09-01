---
summary: '`adonisrc.ts`ファイルは、アプリケーションのワークスペース設定を構成するために使用されます。'
---

# AdonisRCファイル

`adonisrc.ts`ファイルは、アプリケーションのワークスペース設定を構成するために使用されます。このファイルでは、[プロバイダの登録](#providers)、[コマンドのエイリアスの定義](#commandsaliases)、[プロダクションビルドにコピーするファイル](#metafiles)の指定などが行えます。

:::warning

`adonisrc.ts`ファイルは、AdonisJSアプリケーション以外のツールによってインポートされます。そのため、このファイルにはアプリケーション固有のコードや環境固有の条件分岐を記述しないでください。

:::

このファイルには、アプリケーションを実行するために必要な最小限の設定が含まれています。ただし、`node ace inspect:rcfile`コマンドを実行することで、完全なファイルの内容を表示することもできます。

```sh
node ace inspect:rcfile
```

`app`サービスを使用して解析されたRCFileの内容にアクセスできます。

```ts
import app from '@adonisjs/core/services/app'

console.log(app.rcFile)
```

## typescript

`typescript`プロパティは、フレームワークとAceコマンドに、アプリケーションがTypeScriptを使用していることを通知します。現在、この値は常に`true`に設定されています。ただし後でJavaScriptでアプリケーションを記述することも可能にする予定です。

## directories

スキャフォールディングコマンドで使用されるディレクトリとそのパスのセットです。特定のディレクトリの名前を変更する場合は、`directories`オブジェクト内の新しいパスを更新してスキャフォールディングコマンドに通知してください。

```ts
{
  directories: {
    config: 'config',
    commands: 'commands',
    contracts: 'contracts',
    public: 'public',
    providers: 'providers',
    languageFiles: 'resources/lang',
    migrations: 'database/migrations',
    seeders: 'database/seeders',
    factories: 'database/factories',
    views: 'resources/views',
    start: 'start',
    tmp: 'tmp',
    tests: 'tests',
    httpControllers: 'app/controllers',
    models: 'app/models',
    services: 'app/services',
    exceptions: 'app/exceptions',
    mails: 'app/mails',
    middleware: 'app/middleware',
    policies: 'app/policies',
    validators: 'app/validators',
    events: 'app/events',
    listeners: 'app/listeners',
    stubs: 'stubs',
  }
}
```

## preloads
アプリケーションの起動時にインポートするファイルの配列です。これらのファイルは、サービスプロバイダの起動直後に即座にインポートされます。

ファイルをインポートする環境を定義することもできます。有効なオプションは次のとおりです。

- `web`環境は、HTTPサーバーのために開始されたプロセスを指します。
- `console`環境は、`repl`コマンドを除くAceコマンドを指します。
- `repl`環境は、`node ace repl`コマンドを使用して開始されたプロセスを指します。
- 最後に、`test`環境は、テストを実行するために開始されたプロセスを指します。

:::note

`node ace make:preload`コマンドを使用して、プリロードファイルを作成および登録できます。


:::


```ts
{
  preloads: [
    () => import('./start/view.js')
  ]
}
```

```ts
{
  preloads: [
    {
      file: () => import('./start/view.js'),
      environment: [
        'web',
        'console',
        'test'
      ]
    },
  ]
}
```

## metaFiles

`metaFiles`配列は、プロダクションビルド時に`build`フォルダにコピーする必要がある、TypeScript/JavaScript以外のファイルのコレクションです。

これらは、アプリケーションが動作するためにプロダクションビルドに存在する必要がある非TypeScript/JavaScriptファイルです。たとえばEdgeテンプレート、i18n言語ファイルなどです。

- `pattern`：一致するファイルを検索するための[globパターン](https://github.com/sindresorhus/globby#globbing-patterns)です。
- `reloadServer`：一致するファイルが変更された場合に開発サーバーを再読み込みします。

```ts
{
  metaFiles: [
    {
      pattern: 'public/**',
      reloadServer: false
    },
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false
    }
  ]
}
```

## commands
インストールされたパッケージからaceコマンドを遅延インポートするための関数の配列です。アプリケーションのコマンドは自動的にインポートされるため、明示的に登録する必要はありません。

参照：[aceコマンドの作成](../ace/creating_commands.md)

```ts
{
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands')
  ]
}
```

## commandsAliases
コマンドのエイリアスのキーと値のペアです。これは通常、入力が難しいまたは覚えにくいコマンドに対して覚えやすいエイリアスを作成するのに役立ちます。

参照：[コマンドエイリアスの作成](../ace/introduction.md#creating-command-aliases)

```ts
{
  commandsAliases: {
    migrate: 'migration:run'
  }
}
```

同じコマンドに対して複数のエイリアスを定義することもできます。

```ts
{
  commandsAliases: {
    migrate: 'migration:run',
    up: 'migration:run'
  }
}
```

## tests

`tests`オブジェクトは、テストスイートとテストランナーの一部のグローバル設定を登録します。

参照：[テストの概要](../testing/introduction.md)

```ts
{
  tests: {
    timeout: 2000,
    forceExit: false,
    suites: [
      {
        name: 'functional',
        files: [
          'tests/functional/**/*.spec.ts'
        ],
        timeout: 30000
      }
    ]
  }
}
```

- `timeout`：すべてのテストのデフォルトのタイムアウトを定義します。
- `forceExit`：テストが完了したらアプリケーションプロセスを強制的に終了します。通常、正常な終了を行うことが良いプラクティスです。
- `suite.name`：テストスイートの一意の名前。
- `suite.files`：テストファイルをインポートするためのグロブパターンの配列。
- `suite.timeout`：スイート内のすべてのテストのデフォルトのタイムアウト。

## providers

アプリケーションの起動フェーズでロードするサービスプロバイダの配列です。

デフォルトでは、プロバイダはすべての環境でロードされます。ただし、プロバイダをインポートするための明示的な環境の配列を定義することもできます。

- `web`環境は、HTTPサーバーのために開始されたプロセスを指します。
- `console`環境は、`repl`コマンドを除くAceコマンドを指します。
- `repl`環境は、`node ace repl`コマンドを使用して開始されたプロセスを指します。
- 最後に、`test`環境は、テストを実行するために開始されたプロセスを指します。

:::note
プロバイダは、`providers`配列内で登録された順序でロードされます。
:::

参照：[サービスプロバイダ](./service_providers.md)

```ts
{
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/http_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('./providers/app_provider.js'),
  ]
}
```

```ts
{
  providers: [
    {
      file: () => import('./providers/app_provider.js'),
      environment: [
        'web',
        'console',
        'test'
      ]
    },
    {
      file: () => import('@adonisjs/core/providers/http_provider'),
      environment: [
        'web'
      ]
    },
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/app_provider')
  ]
}
```

## assetsBundler

`serve`コマンドと`build`コマンドは、フロントエンドアセットをコンパイルするためにアプリケーションで使用されるアセットを検出しようとします。

検出は、`vite.config.js`ファイルを検索して[vite](https://vitejs.dev)の場合と、`webpack.config.js`ファイルを検索して[Webpack encore](https://github.com/symfony/webpack-encore)の場合に実行されます。

ただし、異なるアセットバンドラを使用する場合は、`adonisrc.ts`ファイル内で次のように設定できます。

```ts
{
  assetsBundler: {
    name: 'vite',
    devServer: {
      command: 'vite',
      args: []
    },
    build: {
      command: 'vite',
      args: ["build"]
    },
  }
}
```

- `name` - 使用しているアセットバンドラの名前。表示目的のために必要です。
- `devServer.*` - 開発サーバーを起動するためのコマンドとその引数。
- `build.*` - プロダクションビルドを作成するためのコマンドとその引数。
