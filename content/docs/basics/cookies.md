---
summary: AdonisJSでクッキーの読み取り、書き込み、クリア方法を学びます。
---

# クッキー

リクエストのクッキーは、HTTPリクエスト中に自動的に解析されます。[request](./request.md)オブジェクトを使用してクッキーを読み取り、[response](./response.md)オブジェクトを使用してクッキーを設定/クリアできます。

```ts
// title: クッキーの読み取り
import router from '@adonisjs/core/services/router'

router.get('cart', async ({ request }) => {
  // highlight-start
  const cartItems = request.cookie('cart_items', [])
  // highlight-end
  console.log(cartItems)
})
```

```ts
// title: クッキーの設定
import router from '@adonisjs/core/services/router'

router.post('cart', async ({ request, response }) => {
  const id = request.input('product_id')
  // highlight-start
  response.cookie('cart_items', [{ id }])
  // highlight-end
})
```

```ts
// title: クッキーのクリア
import router from '@adonisjs/core/services/router'

router.delete('cart', async ({ request, response }) => {
  // highlight-start
  response.clearCookie('cart_items')
  // highlight-end
})
```

## 設定

クッキーの設定のデフォルト値は、`config/app.ts`ファイル内で定義されています。アプリケーションの要件に応じてオプションを調整してください。

```ts
http: {
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    /**
     * 実験的なプロパティ
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#partitioned
     */
    partitioned: false,
    priority: 'medium',
  }
}
```

これらのオプションは、[set-cookie属性](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes)に変換されます。`maxAge`プロパティは、文字列形式の時間表現を受け入れ、その値は秒に変換されます。

クッキーを設定する際には、同じオプションセットを上書きすることもできます。

```ts
response.cookie('key', value, {
  domain: '',
  path: '/',
  maxAge: '2h',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
})
```

## サポートされるデータ型

クッキーの値は、`JSON.stringify`を使用して文字列にシリアライズされます。したがって、次のJavaScriptのデータ型をクッキーの値として使用できます。

- 文字列
- 数値
- bigInt
- ブール値
- null
- オブジェクト
- 配列

```ts
// オブジェクト
response.cookie('user', {
  id: 1,
  fullName: 'virk',
})

// 配列
response.cookie('product_ids', [1, 2, 3, 4])

// ブール値
response.cookie('is_logged_in', true)

// 数値
response.cookie('visits', 10)

// bigInt
response.cookie('visits', BigInt(10))

// 日付オブジェクトはISO文字列に変換されます
response.cookie('visits', new Date())
```

## 署名付きクッキー

`response.cookie`メソッドを使用して設定されたクッキーは署名付きです。署名付きクッキーは改ざん防止されており、内容を変更すると署名が無効になり、クッキーは無視されます。

クッキーは、`config/app.ts`ファイルで定義された`appKey`を使用して署名されます。


:::note

署名付きクッキーはBase64でデコードすることで読み取ることができます。クッキーの値を読み取れないようにするには、暗号化されたクッキーを使用できます。


:::


```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request, response }) => {
  // 署名付きクッキーを設定する
  response.cookie('user_id', 1)

  // 署名付きクッキーを読み取る
  request.cookie('user_id')
})
```

## 暗号化されたクッキー

署名付きクッキーとは異なり、暗号化されたクッキーの値は平文に復号化することはできません。そのため、誰にも読み取れないような機密情報を含む値に対して暗号化されたクッキーを使用できます。

暗号化されたクッキーは、`response.encryptedCookie`メソッドを使用して設定し、`request.encryptedCookie`メソッドを使用して読み取ります。これらのメソッドは、[Encryptionモジュール](../security/encryption.md)を使用しています。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request, response }) => {
  // 暗号化されたクッキーを設定する
  response.encryptedCookie('user_id', 1)

  // 暗号化されたクッキーを読み取る
  request.encryptedCookie('user_id')
})
```

## 通常のクッキー

通常のクッキーは、`document.cookie`の値を使用してフロントエンドのコードからアクセスする場合に使用されます。

デフォルトでは、生の値に対して`JSON.stringify`を呼び出し、それらをBase64エンコードされた文字列に変換します。これは、クッキーの値に`オブジェクト`や`配列`を使用できるようにするためです。ただし、エンコーディングをオフにすることもできます。

通常のクッキーは、`response.plainCookie`メソッドを使用して定義し、`request.plainCookie`メソッドを使用して読み取ることができます。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request, response }) => {
  // 通常のクッキーを設定する
  response.plainCookie('user', { id: 1 }, {
    httpOnly: true
  })

  // 通常のクッキーを読み取る
  request.plainCookie('user')
})
``` 

エンコーディングをオフにするには、オプションオブジェクト内で`encoding: false`を設定します。

```ts
response.plainCookie('token', tokenValue, {
  httpOnly: true,
  encoding: false,
})

// エンコーディングをオフにして通常のクッキーを読み取る
request.plainCookie('token', {
  encoded: false
})
```

## テスト中のクッキーの設定
以下のガイドでは、テストを書く際にクッキーの使用方法について説明しています。

- [Japa APIクライアントでクッキーを定義する](../testing/http_tests.md#readingwriting-cookies)。
- [Japaブラウザクライアントでクッキーを定義する](../testing/browser_tests.md#readingwriting-cookies)。
