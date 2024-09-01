---
summary: '`@adonisjs/static`パッケージを使用して指定されたディレクトリから静的ファイルを提供します。'
---

# 静的ファイルサーバー

`@adonisjs/static`パッケージを使用して、指定されたディレクトリから静的ファイルを提供できます。このパッケージには、HTTPリクエストをインターセプトしてファイルを提供するために、[サーバーミドルウェアスタック](./middleware.md#server-middleware-stack)に登録する必要があるミドルウェアが付属しています。

## インストール

パッケージは`web`スターターキットとして事前に設定されています。ただし、他のスターターキットでも以下のコマンドを使用してインストールおよび設定できます。

以下のコマンドを使用してパッケージをインストールおよび設定します：

```sh
node ace add @adonisjs/static
```

:::disclosure{title="addコマンドによって実行される手順を確認する"}

1. 検出されたパッケージマネージャーを使用して`@adonisjs/static`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に以下のサービスプロバイダーを登録します。

    ```ts
    {
      providers: [
        // ...他のプロバイダー
        () => import('@adonisjs/static/static_provider')
      ]
    }
    ```

3. `config/static.ts`ファイルを作成します。

4. `start/kernel.ts`ファイル内に以下のミドルウェアを登録します。

    ```ts
    server.use([
      () => import('@adonisjs/static/static_middleware')
    ])
    ```

:::

## 設定

静的ミドルウェアの設定は`config/static.ts`ファイルに保存されます。

```ts
import { defineConfig } from '@adonisjs/static'

const staticServerConfig = defineConfig({
  enabled: true,
  etag: true,
  lastModified: true,
  dotFiles: 'ignore',
})

export default staticServerConfig
```

<dl>

<dt>

  enabled

</dt>

<dd>

ミドルウェアを一時的に有効または無効にすることなく、ミドルウェアスタックから一時的に削除するかどうかを設定します。

</dd>

<dt>

  acceptRanges

</dt>

<dd>

`Accept-Range`ヘッダーは、ブラウザがダウンロードを再開する代わりにダウンロードを再開しようとする代わりに、中断されたファイルのダウンロードを再開することを許可します。`acceptsRanges`を`false`に設定することで、再開可能なダウンロードを無効にできます。

デフォルトは`true`です。

</dd>

<dt>

  cacheControl

</dt>

<dd>

[Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)ヘッダーを有効または無効にします。`cacheControl`が無効になっている場合、`immutable`および`maxAge`プロパティは無視されます。


```ts
{
  cacheControl: true
}
```
</dd>


<dt>

  dotFiles

</dt>

<dd>

`public`ディレクトリ内のドットファイルのリクエストの扱い方を定義します。次のオプションのいずれかを設定できます。

- `allow`：他のファイルと同じようにドットファイルを提供します。
- `deny`：`403`ステータスコードでリクエストを拒否します。
- `ignore`：ファイルが存在しないかのように見せかけて`404`ステータスコードで応答します。

```ts
{
  dotFiles: 'ignore'
}
```

</dd>


<dt>

  etag

</dt>

<dd>


[etag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)の生成を有効または無効にします。

```ts
{
  etag: true,
}
```

</dd>

<dt>

  lastModified

</dt>

<dd>


[Last-Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)ヘッダーを有効または無効にします。ファイルの[stat.mtime](https://nodejs.org/api/fs.html#statsmtime)プロパティがヘッダーの値として使用されます。

```ts
{
  lastModified: true,
}
```

</dd>


<dt>

  immutable

</dt>

<dd>


`Cache-Control`ヘッダーの[immutable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#immutable)ディレクティブを有効または無効にします。デフォルトでは、`immutable`プロパティは無効になっています。

`immutable`プロパティが有効になっている場合、キャッシュを有効にするために`maxAge`プロパティを定義する必要があります。

```ts
{
  immutable: true
}
```

</dd>

<dt>

  maxAge

</dt>

<dd>

`Cache-Control`ヘッダーの[max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#max-age)ディレクティブを定義します。値はミリ秒または時間表現文字列である必要があります。

```ts
{
  maxAge: '30 mins'
}
```

</dd>

<dt>

  headers

</dt>

<dd>

レスポンスに設定するヘッダーのオブジェクトを返す関数です。関数は第1引数としてファイルパス、第2引数として[file stats](https://nodejs.org/api/fs.html#class-fsstats)オブジェクトを受け取ります。

```ts
{
  headers: (path, stats) => {
    if (path.endsWith('.mc2')) {
      return {
        'content-type': 'application/octet-stream'
      }
    }
  }
}
```

</dd>


</dl>

## 静的ファイルの提供

ミドルウェアが登録されると、`public`ディレクトリ内にファイルを作成し、ブラウザからファイルパスを使用してアクセスできます。たとえば、`./public/css/style.css`ファイルは`http://localhost:3333/css/style.css`のURLを使用してアクセスできます。

`public`ディレクトリ内のファイルはアセットバンドラーを使用してコンパイルまたはビルドされません。フロントエンドのアセットをコンパイルする場合は、それらを`resources`ディレクトリに配置し、[アセットバンドラー](../basics/vite.md)を使用する必要があります。

## 静的ファイルの本番ビルドへのコピー
`/public`ディレクトリ内に格納されている静的ファイルは、`node ace build`コマンドを実行すると自動的に`build`フォルダにコピーされます。

パブリックファイルのコピーのルールは`adonisrc.ts`ファイルで定義されています。

```ts
{
  metaFiles: [
    {
      pattern: 'public/**',
      reloadServer: false
    }
  ]
}
```
