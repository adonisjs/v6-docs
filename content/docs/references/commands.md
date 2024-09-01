---
summary: AdonisJSフレームワークコアと公式パッケージに含まれるコマンドについて学びましょう。
---

# コマンドリファレンス

このガイドでは、フレームワークコアと公式パッケージに含まれるすべてのコマンドの使用方法をカバーしています。コマンドのヘルプを表示するには、`node ace list`コマンドまたは`node ace <コマンド名> --help`コマンドを使用することもできます。

```sh
node ace list
```

![](../ace/ace_help_screen.jpeg)

:::note

ヘルプ画面の出力は、[docopt](http://docopt.org/)の標準にしたがってフォーマットされています。

:::

## serve
`serve`コマンドは、開発環境でAdonisJSアプリケーションを起動するために[@adonisjs/assembler](https://github.com/adonisjs/assembler?tab=readme-ov-file#dev-server)パッケージを使用します。ファイルの変更を監視し、ファイルの変更ごとにHTTPサーバーを再起動することもできます。

```sh
node ace serve --hmr
```

`serve`コマンドは開発サーバー（`bin/server.ts`ファイル経由）を子プロセスとして起動します。子プロセスに[nodeの引数](https://nodejs.org/api/cli.html#options)を渡す場合は、コマンド名の前にそれらを定義できます。

```sh
node ace --no-warnings --inspect serve --hmr
```

以下は、`serve`コマンドに渡すことができるオプションのリストです。または、`--help`フラグを使用してコマンドのヘルプを表示することもできます。

<dl>

<dt>

--hmr

</dt>

<dd>

HMRモードでファイルシステムを監視し、サーバーをリロードします。

</dd>

<dt>

--watch

</dt>

<dd>

ファイルシステムを監視し、ファイルの変更ごとにプロセスを常に再起動します。

</dd>

<dt>

--poll

</dt>

<dd>

ファイルシステムの変更を検出するためにポーリングを使用します。開発用にDockerコンテナを使用している場合は、ポーリングを使用あります。

</dd>

<dt>

--clear | --no-clear

</dt>

<dd>

ファイルの変更ごとにターミナルをクリアし、新しいログを表示する前に古いログを保持するには、`--no-clear`フラグを使用します。

</dd>

<dt>

--assets | --no-assets

</dt>

<dd>

AdonisJS HTTPサーバーと一緒にアセットバンドル開発サーバーを起動します。アセットバンドラーの開発サーバーをオフにするには、`--no-assets`フラグを使用します。

</dd>

<dt>

--assets-args

</dt>

<dd>

アセットマネージャーの子プロセスにコマンドライン引数を渡します。たとえば、viteを使用する場合、次のようにオプションを定義できます。

```sh
node ace serve --hmr --assets-args="--cors --open"
```

</dd>

</dl>

## build
`build`コマンドは、[@adonisjs/assembler](https://github.com/adonisjs/assembler?tab=readme-ov-file#bundler)パッケージを使用してAdonisJSアプリケーションの本番ビルドを作成します。ビルドの生成には次の手順が実行されます。

参照も: [TypeScriptビルドプロセス](../concepts/typescript_build_process.md).

```sh
node ace build
```

以下は、`build`コマンドに渡すことができるオプションのリストです。または、`--help`フラグを使用してコマンドのヘルプを表示することもできます。

<dl>

<dt>

--ignore-ts-errors

</dt>

<dd>

プロジェクトにTypeScriptエラーがある場合、ビルドコマンドはビルドプロセスを終了します。ただし、`--ignore-ts-errors`フラグを使用してこれらのエラーを無視し、ビルドを完了できます。

</dd>

<dt>

--package-manager

</dt>

<dd>

ビルドコマンドは、アプリケーションで使用しているパッケージマネージャーの`package.json`ファイルとロックファイルをコピーします。

パッケージマネージャーは、[@antfu/install-pkg](https://github.com/antfu/install-pkg)パッケージを使用して検出されます。ただし、パッケージマネージャーの検出をオフにすることもできます。

</dd>

<dt>

--assets | --no-assets

</dt>

<dd>

バックエンドアプリケーションと一緒にフロントエンドアセットをバンドルします。アセットバンドラーの開発サーバーをオフにするには、`--no-assets`フラグを使用します。

</dd>

<dt>

--assets-args

</dt>

<dd>

アセットマネージャーの子プロセスにコマンドライン引数を渡します。たとえば、viteを使用する場合、次のようにオプションを定義できます。

```sh
node ace build --assets-args="--sourcemap --debug"
```

</dd>

</dl>

## add

`add`コマンドは、`npm install <パッケージ名>`と`node ace configure`コマンドを組み合わせたものです。つまり、2つの別々のコマンドを実行する代わりに、`add`コマンドを使用してパッケージをインストールして設定できます。

`add`コマンドは、アプリケーションで使用されているパッケージマネージャーを自動的に検出し、それを使用してパッケージをインストールします。ただし、`--package-manager`CLIフラグを使用して常に特定のパッケージマネージャーを選択することもできます。

```sh
# @adonisjs/lucidパッケージをインストールして設定する
node ace add @adonisjs/lucid

# パッケージを開発依存関係としてインストールし、設定する
node ace add my-dev-package --dev
```

パッケージをフラグで設定できる場合は、直接`add`コマンドに渡すことができます。不明なフラグはすべて`configure`コマンドに渡されます。

```sh
node ace add @adonisjs/lucid --db=sqlite
```

<dl>

<dt>

--verbose

</dt>

<dd>

パッケージのインストールと設定のログを表示するために詳細モードを有効にします。

</dd>

<dt>

--force

</dt>

<dd>

`configure`コマンドに渡されます。パッケージの設定時に既存のファイルを強制的に上書きします。詳細については、`configure`コマンドを参照してください。

<dt>

--package-manager

</dt>

<dd>

パッケージのインストールに使用するパッケージマネージャーを定義します。値は`npm`、`pnpm`、`bun`、または`yarn`である必要があります。

</dd>

<dt>

--dev

</dt>

<dd>

開発依存関係としてパッケージをインストールします。

</dd>

</dl>

## configure
インストール後にパッケージを設定します。コマンドの最初の引数としてパッケージ名を指定します。

```sh
node ace configure @adonisjs/lucid
```

<dl>

<dt>

--verbose

</dt>

<dd>

パッケージのインストールログを表示するために詳細モードを有効にします。

</dd>

<dt>

--force

</dt>

<dd>

AdonisJSのスタブシステムは既存のファイルを上書きしません。たとえば、`@adonisjs/lucid`パッケージを設定し、アプリケーションにすでに`config/database.ts`ファイルがある場合、設定プロセスは既存の設定ファイルを上書きしません。

ただし、`--force`フラグを使用してファイルを強制的に上書きできます。

</dd>

</dl>

## eject

指定されたパッケージのスタブをアプリケーションの`stubs`ディレクトリにコピーします。次の例では、`make/controller`スタブをアプリケーションにコピーして変更します。

参照も: [スタブのカスタマイズ](../concepts/scaffolding.md#ejecting-stubs)

```sh
# @adonisjs/coreパッケージからスタブをコピーする
node ace eject make/controller

# @adonisjs/bouncerパッケージからスタブをコピーする
node ace eject make/policy --pkg=@adonisjs/bouncer
```

## generate\:key
暗号的に安全なランダムキーを生成し、`.env`ファイルに`APP_KEY`環境変数として書き込みます。

参照も: [アプリケーションキー](../security/encryption.md)

```sh
node ace generate:key
```

<dl>

<dt>

--show

</dt>

<dd>

`.env`ファイルに書き込む代わりに、キーをターミナルに表示します。デフォルトでは、キーはenvファイルに書き込まれます。

</dd>

<dt>

--force

</dt>

<dd>

`generate:key`コマンドは、アプリケーションを本番で実行する場合にキーを`.env`ファイルに書き込みません。ただし、`--force`フラグを使用してこの動作を上書きできます。

</dd>

</dl>

## make\:controller

新しいHTTPコントローラークラスを作成します。コントローラーは`app/controllers`ディレクトリ内に作成され、次の命名規則が使用されます。

- 形式: `複数形`
- サフィックス: `controller`
- クラス名の例: `UsersController`
- ファイル名の例: `users_controller.ts`

```sh
node ace make:controller users
```

また、次の例のようにカスタムアクション名を持つコントローラーも生成できます。

```sh
# "index"、"show"、"store"メソッドを持つコントローラーを生成します
node ace make:controller users index show store
```

<dl>

<dt>

--singular

</dt>

<dd>

コントローラー名を単数形に強制します。

</dd>

<dt>

--resource

</dt>

<dd>

リソース上でCRUD操作を実行するためのメソッドを持つコントローラーを生成します。

</dd>

<dt>

--api

</dt>

<dd>

`--resource`フラグと似ていますが、フォームを表示するために使用される`create`と`edit`メソッドは定義されません。

</dd>

</dl>

## make\:middleware
HTTPリクエストのための新しいミドルウェアを作成します。ミドルウェアは`app/middleware`ディレクトリ内に保存され、次の命名規則が使用されます。

- 形式: `単数形`
- サフィックス: `middleware`
- クラス名の例: `BodyParserMiddleware`
- ファイル名の例: `body_parser_middleware.ts`

```sh
node ace make:middleware bodyparser
```

<dl>

<dt>

--stack

</dt>

<dd>

スタックの選択プロンプトをスキップし、スタックを明示的に定義します。値は`server`、`named`、または`router`である必要があります。

```sh
node ace make:middleware bodyparser --stack=router
```

</dd>

</dl>

## make\:event
新しいイベントクラスを作成します。イベントは`app/events`ディレクトリ内に保存され、次の命名規則が使用されます。

- 形式: `NA`
- サフィックス: `NA`
- クラス名の例: `OrderShipped`
- ファイル名の例: `order_shipped.ts`
- 推奨: アクションのライフサイクルを中心にイベントの名前を付ける必要があります。たとえば: `MailSending`、`MailSent`、`RequestCompleted`など。

```sh
node ace make:event orderShipped
```

## make\:validator
新しいVineJSバリデータファイルを作成します。バリデータは`app/validators`ディレクトリ内に保存され、各ファイルに複数のバリデータをエクスポートできます。

- 形式: `単数形`
- サフィックス: `NA`
- ファイル名の例: `user.ts`
- 推奨: アプリケーションのリソースを中心にバリデータファイルを作成する必要があります。

```sh
# ユーザーを管理するためのバリデータ
node ace make:validator user

# 投稿を管理するためのバリデータ
node ace make:validator post
```

<dl>

<dt>

--resource

</dt>

<dd>

`create`と`update`アクションのための事前定義されたバリデータを持つバリデータファイルを作成します。

```sh
node ace make:validator post --resource
```

</dd>

</dl>

## make\:listener

新しいイベントリスナークラスを作成します。リスナークラスは`app/listeners`ディレクトリ内に保存され、次の命名規則が使用されます。

- 形式: `NA`
- サフィックス: `NA`
- クラス名の例: `SendShipmentNotification`
- ファイル名の例: `send_shipment_notification.ts`
- Recommendation: The event listeners must be named after the action they perform. For example, a listener that sends the shipment notification email should be called `SendShipmentNotification`.

```sh
node ace make:listener sendShipmentNotification
```

<dl>

<dt>

--event

</dt>

<dd>

イベントリスナーと一緒にイベントクラスを生成できます。

```sh
node ace make:listener sendShipmentNotification --event=shipment_received
```

</dd>

</dl>

## make\:service

新しいサービスクラスを作成します。サービスクラスは`app/services`ディレクトリ内に保存され、以下の命名規則が使用されます。

:::note

サービスには事前に定義された意味はなく、アプリケーション内のビジネスロジックを抽出するために使用できます。たとえば、アプリケーションが多くのPDFを生成する場合、`PdfGeneratorService`というサービスを作成し、複数の場所で再利用できます。

:::

- 形式: `単数形`
- サフィックス: `service`
- クラス名の例: `InvoiceService`
- ファイル名の例: `invoice_service.ts`

```sh
node ace make:service invoice
```

## make\:exception

新しい[カスタム例外クラス](../basics/exception_handling.md#custom-exceptions)を作成します。例外は`app/exceptions`ディレクトリ内に保存されます。

- 形式: `NA`
- サフィックス: `exception`
- クラス名の例: `CommandValidationException`
- ファイル名の例: `command_validation_exception.ts`

```sh
node ace make:exception commandValidation
```

## make\:command

新しいAceコマンドを作成します。デフォルトでは、コマンドはアプリケーションのルートにある`commands`ディレクトリに保存されます。

このディレクトリのコマンドは、AdonisJSがAceコマンドを実行しようとすると自動的にインポートされます。このディレクトリにはAceコマンドではない追加のファイルを保存するために、ファイル名の前に`_`を付けることもできます。

- 形式: `NA`
- サフィックス: `NA`
- クラス名の例: `ListRoutes`
- ファイル名の例: `list_routes.ts`
- オススメ: コマンドは実行するアクションに基づいて名前を付ける必要があります。たとえば、`ListRoutes`、`MakeController`、`Build`などです。

```sh
node ace make:command listRoutes
```

## make\:view
新しいEdge.jsテンプレートファイルを作成します。テンプレートは`resources/views`ディレクトリ内に作成されます。

- 形式: `NA`
- サフィックス: `NA`
- ファイル名の例: `posts/view.edge`
- オススメ: リソースごとにテンプレートをサブディレクトリ内にグループ化する必要があります。たとえば: `posts/list.edge`、`posts/create.edge`などです。

```sh
node ace make:view posts/create
node ace make:view posts/list
```

## make\:provider

新しい[サービスプロバイダーファイル](../concepts/service_providers.md)を作成します。プロバイダはアプリケーションのルートにある`providers`ディレクトリに保存され、以下の命名規則が使用されます。

- 形式: `単数形`
- サフィックス: `provider`
- クラス名の例: `AppProvider`
- ファイル名の例: `app_provider.ts`

```sh
node ace make:provider app
```


<dl>

<dt>

--environments

</dt>

<dd>

プロバイダがインポートされる環境を定義します。[アプリケーションの環境について詳しくはこちらをご覧ください](../concepts/application.md#environment)

```sh
node ace make:provider app -e=web -e=console
```

</dd>

</dl>

## make\:preload

新しい[プリロードファイル](../concepts/adonisrc_file.md#preloads)を作成します。プリロードファイルは`start`ディレクトリ内に保存されます。

```sh
node ace make:preload view
```

<dl>

<dt>

--environments

</dt>

<dd>

プリロードファイルがインポートされる環境を定義します。[アプリケーションの環境について詳しくはこちらをご覧ください](../concepts/application.md#environment)

```sh
node ace make:preload view app -e=web -e=console
```

</dd>

</dl>

## make\:test
`tests/<suite>`ディレクトリ内に新しいテストファイルを作成します。

- 形式: NA
- サフィックス: `.spec`
- ファイル名の例: `posts/list.spec.ts`、`posts/update.spec.ts`

```sh
node ace make:test --suite=unit
```

<dl>

<dt>

--suite

</dt>

<dd>

作成するテストファイルのスイートを定義します。指定しない場合、コマンドはスイートの選択についてプロンプトを表示します。

</dd>

</dl>

## make\:mail

`app/mails`ディレクトリ内に新しいメールクラスを作成します。メールクラスは`Notification`キーワードでサフィックスが付けられますが、`--intent` CLIフラグを使用してカスタムサフィックスを定義することもできます。

- 形式: NA
- サフィックス: `Intent`
- クラス名の例: `ShipmentNotification`
- ファイル名の例: `shipment_notification.ts`

```sh
node ace make:mail shipment
# ./app/mails/shipment_notification.ts
```


<dl>

<dt>

--intent

</dt>

<dd>

メールのカスタムインテントを定義します。

```sh
node ace make:mail shipment --intent=confirmation
# ./app/mails/shipment_confirmation.ts

node ace make:mail storage --intent=warning
# ./app/mails/storage_warning.ts
```

</dd>

</dl>

## make\:policy

新しいBouncerポリシークラスを作成します。ポリシーは`app/policies`フォルダ内に保存され、以下の命名規則が使用されます。

- 形式: `単数形`
- サフィックス: `policy`
- クラス名の例: `PostPolicy`
- ファイル名の例: `post_policy.ts`

```sh
node ace make:policy post
```

## inspect\:rcfile
`adonisrc.ts`ファイルの内容をデフォルトとマージした後の状態で表示します。このコマンドを使用して、利用可能な設定オプションを確認し、アプリケーションの要件に応じてオーバーライドできます。

参照も: [AdonisRCファイル](../concepts/adonisrc_file.md)

```sh
node ace inspect:rcfile
```

## list\:routes
アプリケーションによって登録されたルートのリストを表示します。このコマンドはAdonisJSアプリケーションを`console`環境で起動します。

```sh
node ace list:routes
```

また、[公式のVSCode拡張機能](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension)を使用している場合、VSCodeのアクティビティバーからルートのリストを表示することもできます。

![](../basics/vscode_routes_list.png)

<dl>

<dt>

--json

</dt>

<dd>

ルートをJSON文字列として表示します。出力はオブジェクトの配列になります。

</dd>

<dt>

--table

</dt>

<dd>

CLIテーブル内にルートを表示します。デフォルトでは、ルートはコンパクトで見やすいリスト形式で表示されます。

</dd>

<dt>

--middleware

</dt>

<dd>

指定したミドルウェアを使用しているルートのリストをフィルタリングします。ミドルウェアを1つ以上指定するために`*`キーワードを使用できます。

</dd>

<dt>

--ignore-middleware

</dt>

<dd>

指定したミドルウェアを使用していないルートのリストをフィルタリングします。ミドルウェアを使用していないルートを含めるために`*`キーワードを使用できます。

</dd>

</dl>

## env\:add

`env:add`コマンドを使用すると、`.env`、`.env.example`ファイルに新しい環境変数を追加し、`start/env.ts`ファイルにバリデーションルールを定義できます。

コマンドを実行すると、変数名、値、バリデーションルールを入力するようにプロンプトが表示されます。または、引数として渡すこともできます。

```sh
# 変数名、値、バリデーションルールを入力するようにプロンプトが表示されます
node ace env:add

# 変数名、値、バリデーションルールを定義します
node ace env:add MY_VARIABLE value --type=string
```

<dl>

<dt>

--type

</dt>

<dd>

環境変数のタイプを定義します。値は次のいずれかである必要があります: `string`、`boolean`、`number`、`enum`。

</dd>

<dt>

--enum-values

</dt>

<dd>

環境変数のタイプが`enum`の場合、許可される値を定義します。

```sh
node ace env:add MY_VARIABLE foo --type=enum --enum-values=foo --enum-values=bar
```

</dd>

</dl>
