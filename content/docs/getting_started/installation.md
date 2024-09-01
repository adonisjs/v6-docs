---
summary: 新しいAdonisJSアプリケーションを作成して設定する方法。
---

# インストール

新しいアプリケーションを作成する前に、コンピュータにNode.jsとnpmがインストールされていることを確認してください。AdonisJSは`Node.js >= 20.6`が必要です。

Node.jsは[公式のインストーラー](https://nodejs.org/en/download/)または[Volta](https://docs.volta.sh/guide/getting-started)を使用してインストールできます。Voltaはクロスプラットフォームのパッケージマネージャーであり、コンピュータに複数のNode.jsバージョンをインストールして実行できます。

```sh
// title: Node.jsのバージョンを確認する
node -v
# v22.0.0
```

:::tip
**視覚的な学習が好きですか？** - Adocastsの友達たちが提供する[Let's Learn AdonisJS 6](https://adocasts.com/series/lets-learn-adonisjs-6)無料のスクリーンキャストシリーズをチェックしてみてください。
:::


## 新しいアプリケーションの作成

[npm init](https://docs.npmjs.com/cli/v7/commands/npm-init)を使用して新しいプロジェクトを作成できます。これらのコマンドは[create-adonisjs](http://npmjs.com/create-adonisjs)イニシャライザーパッケージをダウンロードし、インストールプロセスを開始します。

次のCLIフラグのいずれかを使用して、初期プロジェクトの出力をカスタマイズできます。

- `--kit`: プロジェクトの[スターターキット](#スターターキット)を選択します。**web**、**api**、**slim**、または**inertia**のいずれかを選択できます。

- `--db`: 使用するデータベースの方言を指定します。**sqlite**、**postgres**、**mysql**、または**mssql**のいずれかを選択できます。デフォルトは`sqlite`です。

- `--git-init`: Gitリポジトリを初期化します。デフォルトは`false`です。

- `--auth-guard`: 使用する認証ガードを指定します。**session**、**access_tokens**、または**basic_auth**のいずれかを選択できます。デフォルトは`session`です。

- `--install`: 依存関係のインストールのプロンプトをスキップします。

:::codegroup

```sh
// title: npm
npm init adonisjs@latest hello-world
```

:::

`npm init`コマンドを使用してCLIフラグを渡す場合は、[二重ダッシュを2回使用する](https://stackoverflow.com/questions/43046885/what-does-do-when-running-an-npm-command)必要があります。そうしないと、`npm init`はフラグを`create-adonisjs`イニシャライザーパッケージに渡さないため、正しく動作しません。

例:
```sh
# MYSQLでプロジェクトを作成する
npm init adonisjs@latest hello-world -- --db=mysql

# PostgreSQLとAPIスターターキットでプロジェクトを作成する
npm init adonisjs@latest hello-world -- --db=postgres --kit=api

# APIスターターキットとアクセストークンガードでプロジェクトを作成する
npm init adonisjs@latest hello-world -- --kit=api --auth-guard=access_tokens
```

## スターターキット

スターターキットはAdonisJSを使用してアプリケーションを作成するための出発点となります。これらには、[意見のあるフォルダ構造](./folder_structure.md)、事前に設定されたAdonisJSパッケージ、および開発中に必要なツールが含まれています。


:::note

公式のスターターキットはESモジュールとTypeScriptを使用しています。この組み合わせにより、モダンなJavaScriptの構造を使用し、静的型の安全性を活用できます。

:::

### Webスターターキット

Webスターターキットは、従来のサーバーレンダラーウェブアプリケーションを作成するためにカスタマイズされています。キーワード**"traditional"**に惑わされないでください。限られたフロントエンドの相互作用を持つWebアプリを作成する場合は、このスターターキットをオススメします。

[Edge.js](https://edgejs.dev)を使用してサーバー上でHTMLをレンダリングするシンプルさは、いくつかのHTMLをレンダリングするための複雑なビルドシステムに対処する必要がないため、生産性を向上させます。

後で、[Hotwire](https://hotwired.dev)、[HTMX](http://htmx.org)、または[Unpoly](http://unpoly.com)を使用してアプリケーションをSPAのようにナビゲートし、[Alpine.js](http://alpinejs.dev)を使用してドロップダウンやモーダルなどのインタラクティブなウィジェットを作成できます。

```sh
npm init adonisjs@latest -- -K=web

# データベースの方言を切り替える
npm init adonisjs@latest -- -K=web --db=mysql
```

Webスターターキットには、次のパッケージが含まれています。

<table>
<thead>
<tr>
<th width="180px">パッケージ</th>
<th>説明</th>
</tr>
</thead>
<tbody><tr>
<td><code>@adonisjs/core</code></td>
<td>バックエンドアプリケーションを作成する際に必要な基本機能を提供するフレームワークのコアです。</td>
</tr>
<tr>
<td><code>edge.js</code></td>
<td>HTMLページを構成するための<a href="https://edgejs.dev">edge</a>テンプレートエンジンです。</td>
</tr>
<tr>
<td><code>@vinejs/vine</code></td>
<td><a href="https://vinejs.dev">VineJS</a>は、Node.jsエコシステムで最も高速なバリデーションライブラリの1つです。</td>
</tr>
<tr>
<td><code>@adonisjs/lucid</code></td>
<td>Lucidは、AdonisJSコアチームによってメンテナンスされているSQL ORMです。</td>
</tr>
<tr>
<td><code>@adonisjs/auth</code></td>
<td>フレームワークの認証レイヤーです。セッションを使用するように設定されています。</td>
</tr>
<tr>
<td><code>@adonisjs/shield</code></td>
<td><strong>CSRF</strong>や<strong>‌XSS</strong>などの攻撃からWebアプリを安全に保つためのセキュリティプリミティブのセットです。</td>
</tr>
<tr>
<td><code>@adonisjs/static</code></td>
<td>アプリケーションの<code>/public</code>ディレクトリから静的アセットを提供するミドルウェアです。</td>
</tr>
<tr>
<td><code>vite</code></td>
<td><a href="https://vitejs.dev/">Vite</a>は、フロントエンドアセットをコンパイルするために使用されます。</td>
</tr>
</tbody></table>

---

### APIスターターキット

APIスターターキットは、JSON APIサーバーを作成するためにカスタマイズされています。これは`web`スターターキットの簡略版です。ReactやVueを使用してフロントエンドアプリを構築する予定の場合は、APIスターターキットを使用してAdonisJSバックエンドを作成できます。

```sh
npm init adonisjs@latest -- -K=api

# データベースの方言を切り替える
npm init adonisjs@latest -- -K=api --db=mysql
```

このスターターキットでは、次のことを行っています。

- 静的ファイルの提供をサポートしません。
- ビューレイヤーとviteの設定を行いません。
- XSSとCSRFの保護をオフにし、CORSの保護を有効にします。
- ContentNegotiationミドルウェアを使用してJSONでHTTPレスポンスを送信します。

APIスターターキットはセッションベースの認証で構成されています。ただし、トークンベースの認証を使用する場合は、`--auth-guard`フラグを使用できます。

参照: [どの認証ガードを使用すべきですか？](../authentication/introduction.md#choosing-an-auth-guard)

```sh
npm init adonisjs@latest -- -K=api --auth-guard=access_tokens
```

---

### Slimスターターキット
最小限主義者のために、`slim`スターターキットを作成しました。これにはフレームワークのコアとデフォルトのフォルダ構造のみが含まれています。AdonisJSの余分な機能は必要ない場合に使用できます。

```sh
npm init adonisjs@latest -- -K=slim

# データベースの方言を切り替える
npm init adonisjs@latest -- -K=slim --db=mysql
```

---

### Inertiaスターターキット

[Inertia](https://inertiajs.com/)は、サーバードリブンのシングルページアプリケーションを構築する方法です。お気に入りのフロントエンドフレームワーク（React、Vue、Solid、Svelte）を使用して、アプリケーションのフロントエンドを構築できます。

`--adapter`フラグを使用して使用するフロントエンドフレームワークを選択できます。利用可能なオプションは`react`、`vue`、`solid`、`svelte`です。

また、サーバーサイドレンダリングをオンまたはオフにするために`--ssr`および`--no-ssr`フラグを使用することもできます。

```sh
# サーバーサイドレンダリングを使用したReact
npm init adonisjs@latest -- -K=inertia --adapter=react --ssr

# サーバーサイドレンダリングを使用しないVue
npm init adonisjs@latest -- -K=inertia --adapter=vue --no-ssr
```

---

### 独自のスターターキットを持ち込む
スターターキットは、GitHub、Bitbucket、またはGitlabなどのGitリポジトリプロバイダでホストされた事前に構築されたプロジェクトです。また、次のようにして独自のスターターキットを作成してダウンロードすることもできます。

```sh
npm init adonisjs@latest -- -K="github_user/repo"

# GitLabからダウンロード
npm init adonisjs@latest -- -K="gitlab:user/repo"

# BitBucketからダウンロード
npm init adonisjs@latest -- -K="bitbucket:user/repo"
```

`git`モードを使用してGit+SSH認証でプライベートリポジトリをダウンロードすることもできます。

```sh
npm init adonisjs@latest -- -K="user/repo" --mode=git
```

最後に、タグ、ブランチ、またはコミットを指定することもできます。

```sh
# ブランチ
npm init adonisjs@latest -- -K="user/repo#develop"

# タグ
npm init adonisjs@latest -- -K="user/repo#v2.1.0"
```

## 開発サーバーの起動
AdonisJSアプリケーションを作成したら、`node ace serve`コマンドを実行して開発サーバーを起動できます。

Aceは、フレームワークのコアにバンドルされたコマンドラインフレームワークです。`--hmr`フラグはファイルシステムを監視し、コードベースの一部に対して[ホットモジュールリプレースメント（HMR）](../concepts/hmr.md)を実行します。

```sh
node ace serve --hmr
```

開発サーバーが実行されると、ブラウザでアプリケーションを表示するために[http://localhost:3333](http://localhost:3333)にアクセスできます。

## 本番用のビルド

AdonisJSアプリケーションはTypeScriptで書かれているため、本番で実行する前にJavaScriptにコンパイルする必要があります。

`node ace build`コマンドを使用してJavaScriptの出力を作成できます。JavaScriptの出力は`build`ディレクトリに書き込まれます。

Viteが設定されている場合、このコマンドはViteを使用してフロントエンドアセットをコンパイルし、出力を`build/public`フォルダに書き込みます。

参照: [TypeScriptのビルドプロセス](../concepts/typescript_build_process.md)。

```sh
node ace build
```

## 開発環境の設定

AdonisJSはエンドユーザーアプリケーションのビルドを担当してくれますが、開発プロセスを楽しむために追加のツールが必要になる場合があります。また、コーディングスタイルの一貫性を保つために、コードのリントに**[ESLint](https://eslint.org/)**を使用し、コードのフォーマットに**[Prettier](https://prettier.io)**を使用することを強くオススメします。

コードのリントには**[ESLint](https://eslint.org/)**を使用し、コードのフォーマットのために**[Prettier](https://prettier.io)**を使用することを強くオススメします。

公式のスターターキットには、ESLintとPrettierの両方が事前に設定されており、AdonisJSコアチームの意見に基づいたプリセットが使用されています。これについては、ドキュメントの[ツール設定](../concepts/tooling_config.md)セクションで詳しく説明しています。

最後に、コードエディタにESLintとPrettierのプラグインをインストールすることをオススメします。これにより、アプリケーション開発中のフィードバックループがより密になります。また、次のコマンドを使用してコマンドラインからコードを「リント」および「フォーマット」することもできます。

```sh
# ESLintを実行
npm run lint

# ESLintを実行し、問題を自動修正
npm run lint -- --fix

# Prettierを実行
npm run format
```

## VSCode拡張機能
AdonisJSアプリケーションはTypeScriptをサポートする任意のコードエディタで開発できます。ただし、開発体験をさらに向上させるために、いくつかのVSCode拡張機能を開発しました。

- [**AdonisJS**](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension) - アプリケーションのルートを表示し、aceコマンドを実行し、データベースをマイグレーションし、コードエディタから直接ドキュメントを読むことができます。

- [**Edge**](https://marketplace.visualstudio.com/items?itemName=AdonisJS.vscode-edge) - 構文のハイライト、自動補完、コードスニペットのサポートを備えた開発ワークフローを強化します。

- [**Japa**](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode) - キーボードショートカットを使用してコードエディタを離れずにテストを実行するか、アクティビティサイドバーから直接実行します。
