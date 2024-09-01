---
summary: 本番環境でのAdonisJSアプリケーションのデプロイについての一般的なガイドラインを学びます。
---

# デプロイ

AdonisJSアプリケーションのデプロイは、標準的なNode.jsアプリケーションのデプロイと同じです。本番環境で実行するために、`Node.js >= 20.6`が動作するサーバーと、本番環境の依存関係をインストールするための`npm`が必要です。

このガイドでは、AdonisJSアプリケーションを本番環境でデプロイして実行するための一般的なガイドラインについて説明します。

## 本番ビルドの作成

まず、`build`コマンドを実行してAdonisJSアプリケーションの本番ビルドを作成する必要があります。

詳細はこちらを参照してください：[TypeScriptビルドプロセス](../concepts/typescript_build_process.md)

```sh
node ace build
```

コンパイルされた出力は`./build`ディレクトリ内に書き込まれます。Viteを使用している場合、その出力は`./build/public`ディレクトリ内に書き込まれます。

本番ビルドを作成したら、`./build`フォルダを本番サーバーにコピーできます。**これ以降、ビルドフォルダはアプリケーションのルートとなります**。

### Dockerイメージの作成

アプリケーションのデプロイにDockerを使用している場合、次の`Dockerfile`を使用してDockerイメージを作成できます。

```dockerfile
FROM node:20.12.2-alpine3.18 as base

# All deps stage
FROM base as deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci

# Production only deps stage
FROM base as production-deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci --omit=dev

# Build stage
FROM base as build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN node ace build

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app
EXPOSE 8080
CMD ["node", "./bin/server.js"]
```

必要に応じてDockerfileを変更してください。

## 逆プロキシの設定

Node.jsアプリケーションは通常、Nginxのような逆プロキシサーバーの背後にデプロイされます。したがって、ポート`80`および`443`の着信トラフィックはまずNginxで処理され、その後Node.jsアプリケーションに転送されます。

以下は、出発点として使用できるNginxの設定ファイルの例です。

:::warning
角括弧`<>`内の値を置き換えてください。
:::

```nginx
server {
  listen 80;
  listen [::]:80;

  server_name <APP_DOMAIN.COM>;

  location / {
    proxy_pass http://localhost:<ADONIS_PORT>;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## 環境変数の定義

DigitalOcean DropletやEC2インスタンスなどのベアボーンサーバーにアプリケーションをデプロイする場合、`.env`ファイルを使用して環境変数を定義できます。ファイルが安全に保存され、認可されたユーザーのみがアクセスできるようにしてください。

:::note
HerokuやCleavrなどのデプロイメントプラットフォームを使用している場合は、コントロールパネルを使用して環境変数を定義できます。
:::

`/etc/secrets`ディレクトリに`.env`ファイルを作成したと仮定すると、以下のように本番サーバーを起動する必要があります。

```sh
ENV_PATH=/etc/secrets node build/bin/server.js
```

`ENV_PATH`環境変数は、AdonisJSに`.env`ファイルを指定したディレクトリ内で検索するように指示します。

## 本番サーバーの起動

`node server.js`ファイルを実行することで本番サーバーを起動できます。ただし、[pm2](https://pm2.keymetrics.io/docs/usage/quick-start)のようなプロセスマネージャーを使用することを推奨します。

- PM2は、現在のターミナルセッションをブロックせずにアプリケーションをバックグラウンドで実行します。
- アプリケーションがリクエストを処理している間にアプリケーションがクラッシュした場合、自動的に再起動します。
- また、PM2を使用すると、[クラスターモード](https://nodejs.org/api/cluster.html#cluster)でアプリケーションを実行することも非常に簡単です。

以下は、出発点として使用できる[pm2エコシステムファイル](https://pm2.keymetrics.io/docs/usage/application-declaration)の例です。

```js
// title: ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'web-app',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
    },
  ],
}
```

```sh
// title: Start server
pm2 start ecosystem.config.js
```

## データベースのマイグレーション

SQLデータベースを使用している場合、本番サーバーでデータベースマイグレーションを実行して必要なテーブルを作成する必要があります。

Lucidを使用している場合、次のコマンドを実行できます。

```sh
node ace migration:run --force
```

マイグレーションを本番環境で実行する場合は、`--force`フラグが必要です。

### マイグレーションを実行するタイミング

また、サーバーを再起動する前に常にマイグレーションを実行することをオススメします。マイグレーションが失敗した場合は、サーバーを再起動しないでください。

CleavrやHerokuなどの管理されたサービスを使用すると、このようなケースを自動的に処理できます。それ以外の場合は、CI/CDパイプライン内でマイグレーションスクリプトを実行するか、SSHを介して手動で実行する必要があります。

### 本番環境でのロールバックは避ける

本番環境でのマイグレーションのロールバックはリスクが伴います。マイグレーションファイルの`down`メソッドには、テーブルの削除やカラムの削除などの破壊的なアクションが含まれる場合があります。

本番環境では、config/database.tsファイル内でロールバックを無効にし、代わりに問題を修正するための新しいマイグレーションを作成して本番サーバーで実行することをオススメします。

本番環境でのロールバックの無効化により、`node ace migration:rollback`コマンドがエラーを返すようになります。

```js
{
  pg: {
    client: 'pg',
    migrations: {
      disableRollbacksInProduction: true,
    }
  }
}
```

### 並行マイグレーション

複数のインスタンスを持つサーバーでマイグレーションを実行する場合、同時にマイグレーションを実行することができるインスタンスは1つだけであることを確認する必要があります。

MySQLとPostgreSQLでは、Lucidは同時マイグレーションを許可しないようにアドバイザリロックを取得します。ただし、最初から複数のサーバーでマイグレーションを実行するのを避ける方が良いです。

## ファイルのアップロードのための永続ストレージ

Amazon EKS、Google Kubernetes、Heroku、DigitalOcean Appsなどの環境では、AdonisJSアプリケーションのコードを[一時ファイルシステム](https://devcenter.heroku.com/articles/dynos#ephemeral-filesystem)内で実行します。これは、デプロイごとに既存のファイルシステムを削除し、新しいものを作成することを意味します。

ユーザーがファイルをアップロードできる場合、ローカルファイルシステムに頼らずに、Amazon S3、Google Cloud Storage、またはDigitalOcean Spacesなどの永続ストレージサービスを使用する必要があります。

## ログの記録

AdonisJSはデフォルトで[`pino`ロガー](../digging_deeper/logger.md)を使用し、ログをJSON形式でコンソールに書き込みます。ログをstdout/stderrから読み取るための外部のログサービスを設定するか、同じサーバーのローカルファイルに転送できます。

## 静的アセットの提供

静的アセットの効率的な提供は、アプリケーションのパフォーマンスにとって重要です。AdonisJSアプリケーションがどれだけ高速であっても、静的アセットの配信はユーザーエクスペリエンスの向上に大きな役割を果たします。

### CDNの使用

最良の方法は、AdonisJSアプリケーションから静的アセットをCDN（コンテンツデリバリーネットワーク）を使用して配信することです。

[Vite](../basics/vite.md)を使用してコンパイルされたフロントエンドアセットは、デフォルトでフィンガープリントが付けられています。これは、ファイル名がその内容に基づいてハッシュ化されることを意味します。これにより、アセットを永久にキャッシュし、CDNから提供できます。

使用しているCDNサービスとデプロイ方法によっては、静的ファイルをCDNサーバーに移動するためのデプロイプロセスにステップを追加する必要があります。以下は、その概要です。

1. `vite.config.js`と`config/vite.ts`の設定を更新して、[CDNのURLを使用](../basics/vite.md#deploying-assets-to-a-cdn)するようにします。

2. `build`コマンドを実行してアプリケーションとアセットをコンパイルします。

3. `public/assets`の出力をCDNサーバーにコピーします。たとえば、[ここ](https://github.com/adonisjs-community/polls-app/blob/main/commands/PublishAssets.ts)には、Amazon S3バケットにアセットを公開するために使用するコマンドがあります。

### Nginxを使用して静的アセットを提供する

別のオプションは、アセットの提供タスクをNginxにオフロードすることです。フロントエンドアセットをViteでコンパイルする場合、フィンガープリントが付けられているため、すべての静的ファイルを積極的にキャッシュする必要があります。

以下のブロックをNginxの設定ファイルに追加してください。**角括弧`<>`内の値を置き換えることを忘れないでください**。

```nginx
location ~ \.(jpg|png|css|js|gif|ico|woff|woff2) {
  root <PATH_TO_ADONISJS_APP_PUBLIC_DIRECTORY>;
  sendfile on;
  sendfile_max_chunk 2m;
  add_header Cache-Control "public";
  expires 365d;
}
```

### AdonisJSの静的ファイルサーバーの使用

AdonisJSの組み込み静的ファイルサーバーを利用することもできます。これにより、通常どおりAdonisJSアプリケーションをデプロイし、静的アセットのリクエストが自動的に提供されます。

追加の設定は必要ありません。単純にAdonisJSアプリケーションをデプロイし、静的アセットのリクエストが自動的に提供されます。

:::warn
静的ファイルサーバーは本番環境での使用はオススメしません。CDNやNginxを使用して静的アセットを提供することをオススメします。
:::
