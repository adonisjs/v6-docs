---
summary: BodyParserミドルウェアを使用してリクエストボディをパースする方法を学びます。
---

# Body parserミドルウェア

リクエストデータは、`start/kernel.ts`ファイル内で登録された`BodyParser`ミドルウェアを使用してパースされます。

ミドルウェアの設定は、`config/bodyparser.ts`ファイルに格納されています。このファイルでは、**JSONペイロード**、**ファイルアップロードを伴うマルチパートフォーム**、**URLエンコードされたフォーム**のパーサーを設定できます。

参照も: [リクエストボディの読み取り](./request.md#request-body)\
参照も: [ファイルアップロード](./file_uploads.md)

```ts
import { defineConfig } from '@adonisjs/core/bodyparser'

export const defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: {
    // HTMLフォームのパース設定
  },

  json: {
    // JSONボディのパース設定
  },

  multipart: {
    // マルチパートパーサーの設定
  },

  raw: {
    // 生のテキストパーサーの設定
  },
})
```

## 許可されたメソッド

ボディパーサーミドルウェアがリクエストボディをパースしようとするメソッドの配列を定義できます。デフォルトでは、以下のメソッドが設定されています。ただし、メソッドを削除したり追加したりすることも自由です。

```ts
{
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE']
}
```

## 空の文字列をnullに変換する

HTMLフォームでは、入力フィールドに値がない場合、リクエストボディに空の文字列が送信されます。このHTMLフォームの動作は、データの正規化をデータベースレイヤーで難しくします。

たとえば、`country`という名前のデータベースカラムがnullableに設定されている場合、ユーザーが国を選択しない場合には、このカラムに`null`という値を格納したいと思うでしょう。

しかし、HTMLフォームでは、バックエンドは空の文字列を受け取り、カラムを`null`のままにせずに空の文字列をデータベースに挿入する可能性があります。

`BodyParser`ミドルウェアは、この不整合を処理するために、設定内の`convertEmptyStringsToNull`フラグが有効になっている場合、すべての空の文字列値を`null`に変換できます。

```ts
{
  form: {
    // ...その他の設定
    convertEmptyStringsToNull: true
  },

  json: {
    // ...その他の設定
    convertEmptyStringsToNull: true
  },

  multipart: {
    // ...その他の設定
    convertEmptyStringsToNull: true
  }
}
```

## JSONパーサー

JSONパーサーは、`Content-type`ヘッダーが事前に定義された`types`のいずれかと一致するJSONエンコードされた文字列として定義されたリクエストボディをパースするために使用されます。

```ts
json: {
  encoding: 'utf-8',
  limit: '1mb',
  strict: true,
  types: [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report',
  ],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

encoding

</dt>

<dd>

リクエストボディのバッファを文字列に変換する際に使用するエンコーディングです。おそらく`utf-8`を使用したいと思うでしょう。ただし、[iconv-liteパッケージ](https://www.npmjs.com/package/iconv-lite#readme)でサポートされているエンコーディングを使用することもできます。

</dd>

<dt>

limit

</dt>

<dd>

パーサーが許可するリクエストボディデータの最大制限です。リクエストボディが設定された制限を超える場合、`413`エラーが返されます。

</dd>

<dt>

strict

</dt>

<dd>

厳密なパースは、JSONエンコードされた文字列のトップレベルでのみ`オブジェクト`と`配列`を許可します。

</dd>

<dt>

types

</dt>

<dd>

`Content-type`ヘッダーの値がJSONパーサーを使用してパースする必要がある場合の値の配列です。

</dd>

</dl>

## URLエンコードされたフォームパーサー

`form`パーサーは、`Content-type`ヘッダーが`application/x-www-form-urlencoded`に設定されたURLエンコードされた文字列をパースするために使用されます。つまり、HTMLフォームデータは`form`パーサーを使用してパースされます。

```ts
form: {
  encoding: 'utf-8',
  limit: '1mb',
  queryString: {},
  types: ['application/x-www-form-urlencoded'],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

encoding

<dt>

<dd>

リクエストボディのバッファを文字列に変換する際に使用するエンコーディングです。おそらく`utf-8`を使用したいと思うでしょう。ただし、[iconv-liteパッケージ](https://www.npmjs.com/package/iconv-lite#readme)でサポートされているエンコーディングを使用することもできます。

</dd>

<dt>

limit

<dt>

<dd>

マルチパートリクエストを処理する際に、フィールド（ファイルではない）の最大制限です。フィールドサイズが設定された制限を超える場合、`413`エラーが返されます。

</dd>

<dt>

queryString

<dt>

<dd>

URLエンコードされたリクエストボディは、[qsパッケージ](https://www.npmjs.com/package/qs)を使用してパースされます。`queryString`プロパティを使用してパッケージのオプションを定義できます。

```ts
  form: {
    queryString: {
      allowDots: true,
      allowSparse: true,
    },
  }
```

</dd>

</dl>

## マルチパートパーサー

`multipart`パーサーは、ファイルアップロードを伴うHTMLフォームリクエストのパースに使用されます。

参照も: [ファイルアップロード](./file_uploads.md)

```ts
multipart: {
  autoProcess: true,
  processManually: [],
  encoding: 'utf-8',
  fieldsLimit: '2mb',
  limit: '20mb',
  types: ['multipart/form-data'],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

autoProcess

</dt>

<dd>

`autoProcess`を有効にすると、すべてのユーザーがアップロードしたファイルがオペレーティングシステムの`tmp`ディレクトリに移動されます。

後でコントローラー内でファイルを検証し、永続的な場所やクラウドサービスに移動できます。

`autoProcess`フラグを無効にすると、ストリームを手動で処理し、リクエストボディからファイル/フィールドを読み取る必要があります。参照も: [自己処理マルチパートストリーム](./file_uploads.md#self-processing-multipart-stream)。

`autoProcess`のファイルを自動処理するルートの配列を定義できます。値は**ルートパターン**である必要があり、URLではありません。

```ts
{
  autoProcess: [
    '/uploads',
    '/post/:id'
  ]
}
```

</dd>

<dt>

processManually

</dt>

<dd>

`processManually`配列を使用すると、選択したルートのファイルの自動処理をオフにできます。値は**ルートパターン**である必要があり、URLではありません。

```ts
multipart: {
  autoProcess: true,
  processManually: [
    '/file_manager',
    '/projects/:id/assets'
  ],
}
```

</dd>

<dt>

encoding

</dt>

<dd>

リクエストボディのバッファを文字列に変換する際に使用するエンコーディングです。おそらく`utf-8`を使用したいと思うでしょう。ただし、[iconv-liteパッケージ](https://www.npmjs.com/package/iconv-lite#readme)でサポートされているエンコーディングを使用することもできます。

</dd>

<dt>

limit

</dt>

<dd>

すべてのファイルを処理する際に許可されるバイト数の最大制限です。個々のファイルサイズ制限は、[request.file](./file_uploads.md)メソッドを使用して定義できます。

</dd>

<dt>

fieldsLimit

</dt>

<dd>

マルチパートリクエストを処理する際に、フィールド（ファイルではない）のバイト数の最大制限です。フィールドサイズが設定された制限を超える場合、`413`エラーが返されます。

</dd>

</dl>
