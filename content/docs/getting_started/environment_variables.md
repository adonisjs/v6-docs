---
summary: AdonisJSアプリケーション内で環境変数を使用する方法を学びます。
---

# 環境変数

環境変数は、データベースのパスワード、アプリケーションのシークレット、またはAPIキーなどの秘密情報をアプリケーションのコードベースの外部に保存するためのものです。

また、環境変数は、異なる環境に対して異なる設定を持つことができます。たとえば、テスト中にはメモリメーラーを使用し、開発中にはSMTPメーラーを使用し、本番環境ではサードパーティのサービスを使用できます。

環境変数は、すべてのオペレーティングシステム、デプロイメントプラットフォーム、CI/CDパイプラインでサポートされているため、シークレットや環境固有の設定を保存するための事実上の標準となっています。

このガイドでは、AdonisJSアプリケーション内で環境変数を活用する方法を学びます。

## 環境変数の読み取り

Node.jsは、すべての環境変数を[`process.env`グローバルプロパティ](https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_process_env)としてオブジェクトとして公開しており、次のようにアクセスできます。

```dotenv
process.env.NODE_ENV
process.env.HOST
process.env.PORT
```

## AdonisJSのenvモジュールの使用

`process.env`オブジェクトを介して環境変数を読み取ることは、AdonisJS側でのセットアップは必要ありません。ただし、このドキュメントの残りの部分では、次の理由からAdonisJSのenvモジュールを使用します。

- 複数の`.env`ファイルから環境変数を保存および解析する機能。
- アプリケーションの起動時に環境変数を検証する機能。
- 検証された環境変数に対する静的型の安全性。

envモジュールは、`start/env.ts`ファイル内でインスタンス化され、アプリケーション内の他の場所から次のようにアクセスできます。

```ts
import env from '#start/env'

env.get('NODE_ENV')
env.get('HOST')
env.get('PORT')

// PORTが未定義の場合は3333を返します
env.get('PORT', 3333)
```

### Edgeテンプレートでのenvモジュールの共有
Edgeテンプレート内で環境変数にアクセスする場合は、`env`モジュールをEdgeテンプレートとのグローバル変数として共有する必要があります。

`start`ディレクトリ内に[preloadファイルとして`view.ts`を作成](../concepts/adonisrc_file.md#preloads)し、次のコードを記述します。

```ts
// title: start/view.ts
import env from '#start/env'
import edge from 'edge.js'

edge.global('env', env)
```

## 環境変数の検証

環境変数の検証ルールは、`start/env.ts`ファイル内で`Env.create`メソッドを使用して定義されます。

このファイルを最初にインポートすると、検証が自動的に実行されます。通常、`start/env.ts`ファイルはプロジェクトの構成ファイルの1つによってインポートされます。そうでない場合は、AdonisJSがアプリケーションの起動[前にこのファイルを暗黙的にインポート](https://github.com/adonisjs/slim-starter-kit/blob/main/bin/server.ts#L34-L36)します。

`Env.create`メソッドは、検証スキーマをキーと値のペアとして受け入れます。

- キーは環境変数の名前です。
- 値は検証を実行する関数です。カスタムのインライン関数または`schema.string`や`schema.number`などの事前定義されたスキーマメソッドへの参照などが使用できます。

```ts
import Env from '@adonisjs/core/env'

/**
 * App root is used to locate .env files inside
 * the project root.
 */
const APP_ROOT = new URL('../', import.meta.url)

export default await Env.create(APP_ROOT, {
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  CACHE_VIEWS: Env.schema.boolean(),
  SESSION_DRIVER: Env.schema.string(),
  NODE_ENV: Env.schema.enum([
    'development',
    'production',
    'test'
  ] as const),
})
```

### 静的型情報
同じ検証ルールは、envモジュールを使用する場合に静的型情報を推論するために使用されます。環境変数を使用する際に型情報が利用できます。

![](./env_intellisense.jpeg)

## バリデータスキーマAPI

### schema.string

`schema.string`メソッドは、値が有効な文字列であることを保証します。空の文字列は検証に失敗し、空の文字列を許可するためにオプションのバリエーションを使用する必要があります。

```ts
{
  APP_KEY: Env.schema.string()
}

// APP_KEYをオプションにする
{
  APP_KEY: Env.schema.string.optional()
}
```

文字列の値は、そのフォーマットに対して検証できます。次に、使用可能なフォーマットのリストを示します。

#### host
値が有効なURLまたはIPアドレスであることを検証します。

```ts
{
  HOST: Env.schema.string({ format: 'host' })
}
```

#### url
値が有効なURLであることを検証します。オプションで、`protocol`または`tld`を持たないURLを許可することもできます。

```ts
{
  S3_ENDPOINT: Env.schema.string({ format: 'url' })

  // プロトコルなしのURLを許可
  S3_ENDPOINT: Env.schema.string({ format: 'url', protocol: false })

  // TLDなしのURLを許可
  S3_ENDPOINT: Env.schema.string({ format: 'url', tld: false })
}
```
  
#### email
値が有効なメールアドレスであることを検証します。

```ts
{
  SENDER_EMAIL: Env.schema.string({ format: 'email' })
}
```

### schema.boolean

`schema.boolean`メソッドは、値が有効なブール値であることを保証します。空の値は検証に失敗し、空の値を許可するためにオプションのバリエーションを使用する必要があります。

文字列の表現`'true'`、`'1'`、`'false'`、および`'0'`は、ブール型にキャストされます。

```ts
{
  CACHE_VIEWS: Env.schema.boolean()
}

// オプションにする
{
  CACHE_VIEWS: Env.schema.boolean.optional()
}
```

### schema.number

`schema.number`メソッドは、値が有効な数値であることを保証します。数値の文字列表現は数値データ型にキャストされます。

```ts
{
  PORT: Env.schema.number()
}

// オプションにする
{
  PORT: Env.schema.number.optional()
}
```

### schema.enum

`schema.enum`メソッドは、環境変数を事前定義された値のいずれかと照合します。列挙型のオプションは、値の配列またはTypeScriptのネイティブな列挙型として指定できます。

```ts
{
  NODE_ENV: Env
    .schema
    .enum(['development', 'production'] as const)
}

// オプションにする
{
  NODE_ENV: Env
    .schema
    .enum
    .optional(['development', 'production'] as const)
}

// ネイティブな列挙型の使用
enum NODE_ENV {
  development = 'development',
  production = 'production'
}

{
  NODE_ENV: Env.schema.enum(NODE_ENV)
}
```

### カスタム関数
カスタム関数は、スキーマAPIではカバーされていない検証を実行できます。

関数は、環境変数の名前を第1引数として、値を第2引数として受け取ります。検証後の最終値を返す必要があります。

```ts
{
  PORT: (name, value) => {
    if (!value) {
      throw new Error('PORTの値が必要です')
    }
    
    if (isNaN(Number(value))) {
      throw new Error('PORTの値は有効な数値である必要があります')
    }

    return Number(value)
  }
}
```

## 環境変数の定義

### 開発環境で
環境変数は、開発中に`.env`ファイル内に定義されます。envモジュールは、このファイルをプロジェクトのルート内で検索し、自動的に解析します（存在する場合）。

```dotenv
// title: .env
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
APP_KEY=sH2k88gojcp3PdAJiGDxof54kjtTXa3g
SESSION_DRIVER=cookie
CACHE_VIEWS=false
```

### 本番環境で
本番環境では、デプロイメントプラットフォームを使用して環境変数を定義することをオススメします。ほとんどの現代のデプロイメントプラットフォームは、Web UIから環境変数の定義をサポートしています。

デプロイメントプラットフォームが環境変数の定義手段を提供していない場合は、プロジェクトのルートまたは本番サーバーの別の場所に`.env`ファイルを作成できます。

AdonisJSは、プロジェクトのルートから`.env`ファイルを自動的に読み取ります。ただし、`.env`ファイルが別の場所に保存されている場合は、`ENV_PATH`変数を設定する必要があります。

```sh
# プロジェクトのルートから.envファイルを読み取ろうとします
node server.js

# "/etc/secrets"ディレクトリから.envファイルを読み取ります
ENV_PATH=/etc/secrets node server.js
```

### テスト中に
テスト環境固有の環境変数は、`.env.test`ファイル内で定義する必要があります。このファイルの値は、`.env`ファイルの値を上書きします。

```dotenv
// title: .env
NODE_ENV=development
SESSION_DRIVER=cookie
ASSETS_DRIVER=vite
```

```dotenv
// title: .env.test
NODE_ENV=test
SESSION_DRIVER=memory
ASSETS_DRIVER=fake
```

```ts
// テスト中
import env from '#start/env'

env.get('SESSION_DRIVER') // memory
```

## その他のdot-envファイル

`.env`ファイルと並行して、AdonisJSは次のdot-envファイルから環境変数を処理します。したがって、これらのファイルを作成することもできます（必要な場合）。

上位ランクのファイルが下位ランクのファイルの値を上書きします。

<table>
    <thead>
        <tr>
            <th width="40px">ランク</th>
            <th width="220px">ファイル名</th>
            <th>ノート</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1位</td>
            <td><code>.env.[NODE_ENV].local</code></td>
            <td>
            現在の<code>NODE_ENV</code>に対してロードされます。たとえば、<code>NODE_ENV</code>が<code>development</code>に設定されている場合、<code>.env.development.local</code>ファイルがロードされます。
            </td>
        </tr>
        <tr>
            <td>2位</td>
            <td><code>.env.local</code></td>
            <td><code>test</code>および<code>testing</code>以外のすべての環境でロードされます</td>
        </tr>
        <tr>
            <td>3位</td>
            <td><code>.env.[NODE_ENV]</code></td>
            <td>
            現在の<code>NODE_ENV</code>に対してロードされます。たとえば、<code>NODE_ENV</code>が<code>development</code>に設定されている場合、<code>.env.development</code>ファイルがロードされます。
            </td>
        </tr>
        <tr>
            <td>4位</td>
            <td><code>.env</code></td>
            <td>すべての環境でロードされます。このファイルにはシークレットを格納する場合は<code>.gitignore</code>に追加する必要があります。</td>
        </tr>
    </tbody>
</table>

## dot-envファイル内での変数の使用

dot-envファイル内では、変数の置換構文を使用して他の環境変数を参照できます。

次の例では、`HOST`と`PORT`のプロパティから`APP_URL`を計算しています。

```dotenv
HOST=localhost
PORT=3333
// highlight-start
URL=$HOST:$PORT
// highlight-end
```

`$`記号の後に続く**文字**、**数字**、**アンダースコア (_)**は、変数名を形成するために使用されます。アンダースコア以外の特殊文字を含む場合は、変数名を中括弧 `{}`で囲む必要があります。

```dotenv
REDIS-USER=admin
REDIS-URL=localhost@${REDIS-USER}
```

### `$`記号のエスケープ

`$`記号を値として使用する場合は、変数の置換を防ぐためにエスケープする必要があります。

```dotenv
PASSWORD=pa\$\$word
```
