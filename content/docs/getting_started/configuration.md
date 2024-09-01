---
summary: AdonisJSで設定値を読み取り、更新する方法を学びます。
---

# 設定

AdonisJSアプリケーションの設定ファイルは`config`ディレクトリ内に保存されます。新しいAdonisJSアプリケーションには、フレームワークのコアとインストールされたパッケージによって使用されるいくつかの事前存在するファイルが付属しています。

`config`ディレクトリ内にアプリケーションが必要とする追加のファイルを自由に作成してください。


:::note

シークレットや環境固有の設定を保存するために、[環境変数](./environment_variables.md)の使用をオススメします。


:::

## 設定ファイルのインポート

標準のJavaScriptの`import`ステートメントを使用して、アプリケーションのコードベース内で設定ファイルをインポートできます。

例:
```ts
import { appKey } from '#config/app'
```

```ts
import databaseConfig from '#config/database'
```

## 設定サービスの使用

設定サービスは、設定値を読み取るための代替APIを提供しています。次の例では、設定サービスを使用して、`config/app.ts`ファイル内に保存されている`appKey`の値を読み取っています。

```ts
import config from '@adonisjs/core/services/config'

config.get('app.appKey')
config.get('app.http.cookie') // ネストされた値を読み取る
```

`config.get`メソッドは、ドットで区切られたキーを受け入れ、次のように解析します。

- 最初の部分は、値を読み取りたいファイルのファイル名です。たとえば`app.ts`ファイルです。
- 文字列の残りの部分は、エクスポートされた値からアクセスしたいキーです。この場合は`appKey`です。

## 設定サービスと設定ファイルの直接インポート

設定サービスを直接設定ファイルをインポートするよりも利点はありません。ただし、設定サービスは外部パッケージやエッジテンプレートで設定を読み取るための唯一の選択肢です。

### 外部パッケージ内での設定の読み取り

サードパーティのパッケージを作成している場合、ユーザーアプリケーションから設定ファイルを直接インポートするべきではありません。なぜなら、それによってパッケージがホストアプリケーションのフォルダ構造と密接に結びつくことになるからです。

代わりに、サービスプロバイダ内で設定値にアクセスするために設定サービスを使用するべきです。

例:
```ts
import { ApplicationService } from '@adonisjs/core/types'

export default class DriveServiceProvider {
  constructor(protected app: ApplicationService) {}
  
  register() {
    this.app.container.singleton('drive', () => {
      // ハイライト開始
      const driveConfig = this.app.config.get('drive')
      return new DriveManager(driveConfig)
      // ハイライト終了
    })
  }
}
```

### Edgeテンプレート内での設定の読み取り

`config`グローバルメソッドを使用して、エッジテンプレート内で設定値にアクセスできます。

```edge
<a href="{{ config('app.appUrl') }}"> ホーム </a>
```

`config.has`メソッドを使用して、指定されたキーに対して設定値が存在するかどうかを確認できます。メソッドは値が`undefined`の場合に`false`を返します。

```edge
@if(config.has('app.appUrl'))
  <a href="{{ config('app.appUrl') }}"> ホーム </a>
@else
  <a href="/"> ホーム </a>
@end
```

## 設定ディレクトリの変更

`adonisrc.ts`ファイルを変更することで、設定ディレクトリの場所を更新できます。変更後、設定ファイルは新しい場所からインポートされます。

```ts
directories: {
  config: './configurations'
}
```

`package.json`ファイル内のインポートエイリアスも更新する必要があります。

```json
{
  "imports": {
    "#config/*": "./configurations/*.js"
  }
}
```

## 設定ファイルの制限

`config`ディレクトリ内に保存されている設定ファイルは、アプリケーションの起動フェーズでインポートされます。そのため、設定ファイルはアプリケーションコードに依存することはできません。

たとえば`config/app.ts`ファイル内でルーターサービスをインポートして使用しようとすると、アプリケーションの起動に失敗します。これは、ルーターサービスが`booted`状態になるまで設定されないためです。

基本的に、この制限はコードベースにプラスの影響を与えます。なぜなら、アプリケーションコードは設定に依存すべきであり、逆ではないからです。

## 実行時に設定を更新する

設定サービスを使用して実行時に設定値を変更できます。`config.set`はメモリ内の値を更新し、ディスク上のファイルには変更が加えられません。

:::note

設定値は単一のHTTPリクエストだけでなく、アプリケーション全体に対して変更されます。これは、Node.jsがスレッド化されていないランタイムであり、Node.jsのメモリが複数のHTTPリクエスト間で共有されるためです。

:::

```ts
import env from '#start/env'
import config from '@adonisjs/core/services/config'

const HOST = env.get('HOST')
const PORT = env.get('PORT')

config.set('app.appUrl', `http://${HOST}:${PORT}`)
```
