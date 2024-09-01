---
summary: AdonisJSでCORSを実装してアプリケーションを保護する方法を学びます。
---

# CORS

[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)は、ブラウザ環境でスクリプトを使用してトリガーされる悪意のあるリクエストからアプリケーションを保護するのに役立ちます。

たとえば、AJAXやfetchリクエストが異なるドメインからサーバーに送信された場合、ブラウザはCORSエラーでそのリクエストをブロックし、リクエストを許可する必要があると思う場合にCORSポリシーを実装することを期待します。

AdonisJSでは、`@adonisjs/cors`パッケージを使用してCORSポリシーを実装できます。このパッケージには、受信リクエストをインターセプトし、正しいCORSヘッダーで応答するHTTPミドルウェアが含まれています。

## インストール

次のコマンドを使用してパッケージをインストールおよび設定します：

```sh
node ace add @adonisjs/cors
```

:::disclosure{title="addコマンドによって実行される手順を参照"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/cors`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に次のサービスプロバイダーを登録します。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/cors/cors_provider')
      ]
    }
    ```

3. `config/cors.ts`ファイルを作成します。このファイルにはCORSの設定が含まれています。

4. `start/kernel.ts`ファイル内に次のミドルウェアを登録します。

    ```ts
    server.use([
      () => import('@adonisjs/cors/cors_middleware')
    ])
    ```

:::

## 設定

CORSミドルウェアの設定は、`config/cors.ts`ファイルに保存されます。

```ts
import { defineConfig } from '@adonisjs/cors'

const corsConfig = defineConfig({
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
```

<dl>

<dt>

enabled

</dt>

<dd>

ミドルウェアを一時的にオンまたはオフにすることなく、ミドルウェアスタックから削除せずに、一時的にオンまたはオフにします。

</dd>

<dt>

origin

</dt>

<dd>

`origin`プロパティは、[Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)ヘッダーの値を制御します。

現在のオリジンのリクエストを許可するには、値を`true`に設定します。現在のオリジンのリクエストを許可しない場合は、`false`に設定します。

```ts
{
  origin: true
}
```

ハードコードされたオリジンのリストを指定して、ドメイン名の配列を許可することもできます。

```ts
{
  origin: ['adonisjs.com']
}
```

すべてのオリジンを許可するにはワイルドカード式`*`を使用します。ワイルドカード式の動作方法については、[MDNのドキュメント](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin#directives)を参照してください。

`credentials`プロパティが`true`に設定されている場合、ワイルドカード式は`boolean (true)`のように動作します。

```ts
{
  origin: '*'
}
```

HTTPリクエスト中に`origin`の値を計算するために、関数を使用することもできます。例：

```ts
{
  origin: (requestOrigin, ctx) => {
    return true
  }
}
```

</dd>

<dt>

methods

</dt>

<dd>

`methods`プロパティは、プリフライトリクエスト中に許可するメソッドを制御します。[Access-Control-Request-Method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method)ヘッダーの値は、許可されたメソッドと照合されます。

```sh
{
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE']
}
```

</dd>

<dt>

headers

</dt>

<dd>

`headers`プロパティは、プリフライトリクエスト中に許可するリクエストヘッダーを制御します。[Access-Control-Request-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers)ヘッダーの値は、headersプロパティと照合されます。

値を`true`に設定すると、すべてのヘッダーが許可されます。値を`false`に設定すると、すべてのヘッダーが許可されません。

```ts
{
  headers: true
}
```

文字列の配列としてヘッダーを許可するには、ヘッダーを指定します。

```ts
{
  headers: [
    'Content-Type',
    'Accept',
    'Cookie'
  ]
}
```

HTTPリクエスト中に`headers`の設定値を関数を使用して計算することもできます。例：

```ts
{
  headers: (requestHeaders, ctx) => {
    return true
  }
}
```

</dd>

<dt>

exposeHeaders

</dt>

<dd>

`exposeHeaders`プロパティは、プリフライトリクエスト中に[Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers)ヘッダーを介して公開するヘッダーを制御します。

```ts
{
  exposeHeaders: [
    'cache-control',
    'content-language',
    'content-type',
    'expires',
    'last-modified',
    'pragma',
  ]
}
```

</dd>

<dt>

credentials

</dt>

<dd>

`credentials`プロパティは、プリフライトリクエスト中に[Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials)ヘッダーを設定するかどうかを制御します。

```ts
{
  credentials: true
}
```

</dd>

<dt>

maxAge

</dt>

<dd>

`maxAge`プロパティは、[Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age)レスポンスヘッダーを制御します。値は秒単位です。

- 値を`null`に設定すると、ヘッダーは設定されません。
- `-1`に設定すると、ヘッダーは設定されますが、キャッシュは無効になります。

```ts
{
  maxAge: 90
}
```

</dd>

</dl>

## CORSエラーのデバッグ
CORSの問題をデバッグすることは難しい経験です。ただし、CORSのルールを理解し、レスポンスヘッダーをデバッグしてすべてが正しく設定されていることを確認する以外にショートカットはありません。

以下は、CORSの動作をよりよく理解するために読むことができる記事へのリンクです。

- [CORSエラーのデバッグ方法](https://httptoolkit.com/blog/how-to-debug-cors-errors/)
- [CORSできる？](https://httptoolkit.com/will-it-cors/)
- [CORSのMDNによる詳細な説明](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
