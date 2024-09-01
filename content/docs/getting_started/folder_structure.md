---
summary: AdonisJSのインストールプロセス中に作成される重要なファイルとフォルダのツアーをご紹介します。
---

# フォルダ構造

このガイドでは、AdonisJSのインストールプロセス中に作成される重要なファイルとフォルダのツアーをご紹介します。

私たちは、プロジェクトを整理し、リファクタリングしやすくするための思慮深いデフォルトのフォルダ構造を提供しています。ただし、チームやプロジェクトに最適なフォルダ構造を自由に変更することもできます。

## `adonisrc.ts` ファイル

`adonisrc.ts` ファイルは、アプリケーションのワークスペースとランタイム設定を構成するために使用されます。

このファイルでは、プロバイダの登録、コマンドのエイリアスの定義、本番ビルドにコピーするファイルの指定などができます。

詳細はこちらを参照してください：[AdonisRCファイルリファレンスガイド](../concepts/adonisrc_file.md)

## `tsconfig.json` ファイル

`tsconfig.json` ファイルは、アプリケーションのTypeScriptの設定を保存します。プロジェクトやチームの要件に応じて、このファイルを自由に変更してください。

AdonisJSの内部で正しく動作するためには、次の設定オプションが必要です。

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "isolatedModules": true,
    "declaration": false,
    "outDir": "./build",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true
  }
}
``` 

## サブパスのインポート

AdonisJSは、Node.jsの[sub-path imports](https://nodejs.org/dist/latest-v19.x/docs/api/packages.html#subpath-imports)機能を使用して、インポートのエイリアスを定義します。

次のインポートのエイリアスは、`package.json` ファイル内で事前に設定されています。新しいエイリアスを追加したり、既存のエイリアスを編集したりしてください。

```json
// title: package.json
{
  "imports": {
    "#controllers/*": "./app/controllers/*.js",
    "#exceptions/*": "./app/exceptions/*.js",
    "#models/*": "./app/models/*.js",
    "#mails/*": "./app/mails/*.js",
    "#services/*": "./app/services/*.js",
    "#listeners/*": "./app/listeners/*.js",
    "#events/*": "./app/events/*.js",
    "#middleware/*": "./app/middleware/*.js",
    "#validators/*": "./app/validators/*.js",
    "#providers/*": "./app/providers/*.js",
    "#policies/*": "./app/policies/*.js",
    "#abilities/*": "./app/abilities/*.js",
    "#database/*": "./database/*.js",
    "#tests/*": "./tests/*.js",
    "#start/*": "./start/*.js",
    "#config/*": "./config/*.js"
  }
}
```

コードエディターがインポートの自動補完を行うために、インポートのエイリアスを `tsconfig.json` ファイル内でも再定義する必要があります。エディターが近いうちに `package.json` をエイリアスの唯一の情報源として使用するようになることを期待しています。

```json
// title: tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "#controllers/*": ["./app/controllers/*.js"],
      "#exceptions/*": ["./app/exceptions/*.js"],
      "#models/*": ["./app/models/*.js"],
      "#mails/*": ["./app/mails/*.js"],
      "#services/*": ["./app/services/*.js"],
      "#listeners/*": ["./app/listeners/*.js"],
      "#events/*": ["./app/events/*.js"],
      "#middleware/*": ["./app/middleware/*.js"],
      "#validators/*": ["./app/validators/*.js"],
      "#providers/*": ["./app/providers/*.js"],
      "#policies/*": ["./app/policies/*.js"],
      "#abilities/*": ["./app/abilities/*.js"],
      "#database/*": ["./database/*.js"],
      "#tests/*": ["./tests/*.js"],
      "#start/*": ["./start/*.js"],
      "#config/*": ["./config/*.js"]
    }
  }
}
```

## `bin` ディレクトリ

`bin` ディレクトリには、特定の環境でアプリケーションをロードするためのエントリーポイントファイルがあります。

例：
- `bin/server.ts` ファイルは、Web環境でHTTPリクエストを受け付けるためにアプリケーションを起動します。
- `bin/console.ts` ファイルは、Aceコマンドラインを起動してコマンドを実行します。
- `bin/test.ts` ファイルは、テストを実行するためにアプリケーションを起動します。

## `ace.js` ファイル

`ace` ファイルは、アプリケーション固有のコマンドラインフレームワークを起動します。したがって、aceコマンドを実行するたびに、このファイルを通過します。

`ace` ファイルの拡張子は `.js` で終わっていることに注意してください。これは、このファイルをコンパイルせずに `node` バイナリで実行したいためです。

## `app` ディレクトリ

`app` ディレクトリは、アプリケーションのドメインロジックのコードを整理するために使用されます。たとえばコントローラ、モデル、サービスなどはすべて `app` ディレクトリ内にあります。

アプリケーションコードをより良く整理するために、追加のディレクトリを作成しても構いません。

```
├── app
│  └── controllers
│  └── exceptions
│  └── middleware
│  └── models
│  └── validators
```

## `resources` ディレクトリ

`resources` ディレクトリには、Edgeテンプレートとフロントエンドコードのソースファイルが含まれています。つまり、アプリケーションのプレゼンテーション層のコードは `resources` ディレクトリ内にあります。

```
├── resources
│  └── views
│  └── js
│  └── css
│  └── fonts
│  └── images
```

## `start` ディレクトリ

`start` ディレクトリには、アプリケーションの起動ライフサイクル中にインポートしたいファイルが含まれています。たとえばルートを登録したり、イベントリスナーを定義したりするファイルは、`start` ディレクトリ内に配置する必要があります。

```
├── start
│  ├── env.ts
│  ├── kernel.ts
│  ├── routes.ts
│  ├── validator.ts
│  ├── events.ts
```

AdonisJSは、`start` ディレクトリからファイルを自動的にインポートしません。これは、類似したファイルをグループ化するための規約としてのみ使用されます。

`start` ディレクトリの下にどのファイルを配置するかについては、[preload files](../concepts/adonisrc_file.md#preloads) と [application boot lifecycle](../concepts/application_lifecycle.md) を読むことをオススメします。

## `public` ディレクトリ

`public` ディレクトリには、CSSファイル、画像、フォント、またはフロントエンドのJavaScriptなどの静的アセットがホストされます。

`public` ディレクトリと `resources` ディレクトリを混同しないでください。`resources` ディレクトリには、フロントエンドアプリケーションのソースコードが含まれており、`public` ディレクトリにはコンパイルされた出力があります。

Viteを使用している場合は、フロントエンドのアセットを `resources/<SUB_DIR>` ディレクトリ内に保存し、Viteコンパイラによって出力が `public` ディレクトリに作成されるようにします。

一方、Viteを使用していない場合は、`public` ディレクトリ内に直接ファイルを作成し、ファイル名を使用してアクセスできます。たとえば`./public/style.css` ファイルは `http://localhost:3333/style.css` のURLからアクセスできます。

## `database` ディレクトリ

`database` ディレクトリには、データベースのマイグレーションとシーディングのためのファイルが含まれています。

```
├── database
│  └── migrations
│  └── seeders
```

## `commands` ディレクトリ

[aceコマンド](../ace/introduction.md) は、`commands` ディレクトリ内に格納されます。`node ace make:command` を実行して、このフォルダ内にコマンドを作成できます。

## `config` ディレクトリ

`config` ディレクトリには、アプリケーションのランタイム設定ファイルが含まれています。

フレームワークのコアと他のインストールされたパッケージは、このディレクトリから設定ファイルを読み込みます。また、このディレクトリ内にアプリケーション固有の設定を保存することもできます。

[設定管理](./configuration.md) について詳しくはこちらをご覧ください。

```
├── config
│  ├── app.ts
│  ├── bodyparser.ts
│  ├── cors.ts
│  ├── database.ts
│  ├── drive.ts
│  ├── hash.ts
│  ├── logger.ts
│  ├── session.ts
│  ├── static.ts
```


## `types` ディレクトリ

`types` ディレクトリは、アプリケーション内で使用されるTypeScriptのインターフェイスや型を格納する場所です。

デフォルトでは、このディレクトリは空ですが、`types` ディレクトリ内にファイルやフォルダを作成して、カスタムの型やインターフェイスを定義できます。

```
├── types
│  ├── events.ts
│  ├── container.ts
```

## `providers` ディレクトリ

`providers` ディレクトリは、アプリケーションで使用される [サービスプロバイダ](../concepts/service_providers.md) を格納するために使用されます。`node ace make:provider` コマンドを使用して新しいプロバイダを作成できます。

[サービスプロバイダ](../concepts/service_providers.md) について詳しくはこちらをご覧ください。

```
├── providers
│  └── app_provider.ts
│  └── http_server_provider.ts
```

## `tmp` ディレクトリ

アプリケーションによって生成される一時ファイルは、`tmp` ディレクトリに保存されます。たとえばユーザがアップロードしたファイル（開発中に生成される）やディスクに書き込まれるログなどがこれに該当します。

`tmp` ディレクトリは `.gitignore` のルールで無視される必要があり、本番サーバにはコピーしないでください。

## `tests` ディレクトリ

`tests` ディレクトリは、アプリケーションのテストを整理します。さらに、`unit` と `functional` のサブディレクトリが作成されます。

詳細はこちらを参照してください：[テスト](../testing/introduction.md)

```
├── tests
│  ├── bootstrap.ts
│  └── functional
│  └── regression
│  └── unit
```
