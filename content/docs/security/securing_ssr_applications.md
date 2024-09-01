---
summary: '`@adonisjs/shield`パッケージを使用して、サーバーレンダリングアプリケーションを保護する方法を学びます。'
---

# サーバーレンダリングアプリケーションの保護

AdonisJSを使用してサーバーレンダリングアプリケーションを作成している場合は、**CSRF**、**XSS**、**コンテンツスニッフィング**などの一般的なWeb攻撃からアプリケーションを保護するために、`@adonisjs/shield`パッケージを使用する必要があります。

このパッケージは**ウェブスターターキット**として事前に設定されています。ただし、以下の手順にしたがってパッケージを手動でインストールおよび設定することもできます。

:::note
`@adonisjs/shield`パッケージは`@adonisjs/session`パッケージに依存しているため、[セッションパッケージを設定](../basics/session.md)することを忘れないでください。
:::

```sh
node ace add @adonisjs/shield
```

:::disclosure{title="addコマンドによって実行される手順を参照"}

1. 検出されたパッケージマネージャーを使用して`@adonisjs/shield`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に以下のサービスプロバイダーを登録します。

   ```ts
   {
     providers: [
       // ...other providers
       () => import('@adonisjs/shield/shield_provider'),
     ]
   }
   ```

3. `config/shield.ts`ファイルを作成します。

4. `start/kernel.ts`ファイル内に以下のミドルウェアを登録します。

   ```ts
   router.use([() => import('@adonisjs/shield/shield_middleware')])
   ```

:::

## CSRF保護

[CSRF（クロスサイトリクエストフォージェリ）](https://owasp.org/www-community/attacks/csrf)は、悪意のあるウェブサイトがユーザーに明示的な同意なしにフォームの送信を行わせる攻撃です。

CSRF攻撃に対抗するためには、ウェブサイトだけが生成および検証できるCSRFトークン値を持つ非表示の入力フィールドを定義する必要があります。したがって、悪意のあるウェブサイトによってトリガーされるフォームの送信は失敗します。

### フォームの保護

`@adonisjs/shield`パッケージを設定すると、CSRFトークンのないすべてのフォームの送信は自動的に失敗します。したがって、CSRFトークンを持つ非表示の入力フィールドを定義するために`csrfField`エッジヘルパーを使用する必要があります。

:::caption{for="info"}
**エッジヘルパー**
:::

```edge
<form method="POST" action="/">
  // highlight-start
  {{ csrfField() }}
  // highlight-end
  <input type="name" name="name" placeholder="名前を入力してください">
  <button type="submit"> 送信 </button>
</form>
```

:::caption{for="info"}
**出力されるHTML**
:::

```html

<form method="POST" action="/">
    // highlight-start
    <input type="hidden" name="_csrf" value="Q9ghWSf0-3FD9eCiu5YxvKaxLEZ6F_K4DL8o"/>
    // highlight-end
    <input type="name" name="name" placeholder="名前を入力してください"/>
    <button type="submit">送信</button>
</form>
```

フォームの送信時、`shield_middleware`は自動的に`_csrf`トークンを検証し、有効なCSRFトークンを持つフォームの送信のみを許可します。

### 例外の処理

CSRFトークンが存在しないか無効な場合、Shieldは`E_BAD_CSRF_TOKEN`例外を発生させます。デフォルトでは、AdonisJSは例外をキャプチャし、エラーフラッシュメッセージを含んだフォームにユーザーをリダイレクトします。

Edgeテンプレート内でフラッシュメッセージにアクセスするには、次のようにします。

```edge
// highlight-start
@error('E_BAD_CSRF_TOKEN')
  <p> {{ $message }} </p>
@end
// highlight-end

<form method="POST" action="/">
  {{ csrfField() }}
  <input type="name" name="name" placeholder="名前を入力してください">
  <button type="submit"> 送信 </button>
</form>
```

また、[グローバル例外ハンドラ](../basics/exception_handling.md#handling-exceptions)内で`E_BAD_CSRF_TOKEN`例外を自己処理することもできます。

```ts
import app from '@adonisjs/core/services/app'
import { errors } from '@adonisjs/shield'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_BAD_CSRF_TOKEN) {
      return ctx.response
        .status(error.status)
        .send('ページの有効期限が切れました')
    }
    // highlight-end
    return super.handle(error, ctx)
  }
}
```

### 設定リファレンス

CSRFガードの設定は`config/shield.ts`ファイルに保存されます。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csrf: {
    enabled: true,
    exceptRoutes: [],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },
})

export default shieldConfig
```

<dl>

<dt>

enabled

</dt>

<dd>

CSRFガードをオンまたはオフにします。

</dd>

<dt>

exceptRoutes

</dt>

<dd>

CSRF保護から除外するルートパターンの配列です。アプリケーションにAPI経由でフォームの送信を受け入れるルートがある場合は、除外する必要があります。

より高度な使用例では、特定のルートを動的に除外するために関数を登録することもできます。

```ts
{
  exceptRoutes: (ctx) => {
    // /api/で始まるすべてのルートを除外
    return ctx.request.url().includes('/api/')
  }
}
```

</dd>

<dt>

enableXsrfCookie

</dt>

<dd>

有効にすると、Shieldは`XSRF-TOKEN`という名前の暗号化されたクッキーにCSRFトークンを保存します。これにより、Axiosなどのフロントエンドのリクエストライブラリが自動的に`XSRF-TOKEN`を読み取り、サーバーレンダリングされたフォームなしでAjaxリクエストを行う際にヘッダーとして設定できます。

Ajaxリクエストをプログラムでトリガーしない場合は、`enableXsrfCookie`を無効にしておく必要があります。

</dd>

<dt>

methods

</dt>

<dd>

保護するHTTPメソッドの配列です。指定されたメソッドのすべての受信リクエストは有効なCSRFトークンを提供する必要があります。

</dd>

<dt>

cookieOptions

</dt>

<dd>

`XSRF-TOKEN`クッキーの設定です。使用可能なオプションについては、[クッキーの設定](../basics/cookies.md#configuration)を参照してください。

</dd>

</dl>

## CSPポリシーの定義
[CSP（コンテンツセキュリティポリシー）](https://web.dev/csp/)は、JavaScript、CSS、フォント、画像などの信頼できるソースを定義することによって、XSS攻撃からアプリケーションを保護します。

CSPガードはデフォルトで無効になっています。ただし、有効にし、ポリシーディレクティブを`config/shield.ts`ファイル内で設定することをオススメします。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    directives: {
      // ポリシーディレクティブをここに記述
    },
    reportOnly: false,
  },
})

export default shieldConfig
```

<dl>

<dt>

enabled

</dt>

<dd>

CSPガードをオンまたはオフにします。

</dd>

<dt>

directives

</dt>

<dd>

CSPディレクティブを設定します。使用可能なディレクティブのリストは[https://content-security-policy.com/](https://content-security-policy.com/#directive)で確認できます。

```ts
const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    // highlight-start
    directives: {
      defaultSrc: [`'self'`],
      scriptSrc: [`'self'`, 'https://cdnjs.cloudflare.com'],
      fontSrc: [`'self'`, 'https://fonts.googleapis.com']
    },
    // highlight-end
    reportOnly: false,
  },
})

export default shieldConfig
```

</dd>

<dt>

reportOnly

</dt>

<dd>

`reportOnly`フラグが有効になっている場合、CSPポリシーはリソースをブロックしません。代わりに、違反を`reportUri`ディレクティブで設定されたエンドポイントに報告します。

```ts
const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    directives: {
      defaultSrc: [`'self'`],
      // highlight-start
      reportUri: ['/csp-report']
      // highlight-end
    },
    // highlight-start
    reportOnly: true,
    // highlight-end
  },
})
```

また、違反レポートを収集するために`csp-report`エンドポイントを登録します。

```ts
router.post('/csp-report', async ({ request }) => {
  const report = request.input('csp-report')
})
```
</dd>

</dl>

### Nonceの使用
インラインの`script`タグと`style`タグを許可するには、それらに[nonce属性](https://content-security-policy.com/nonce/)を定義できます。nonce属性の値は、`cspNonce`プロパティを使用してEdgeテンプレート内でアクセスできます。

```edge
<script nonce="{{ cspNonce }}">
  // インラインJavaScript
</script>
<style nonce="{{ cspNonce }}">
  /* インラインCSS */
</style>
```

また、ディレクティブの設定内で`@nonce`キーワードを使用してnonceベースのインラインスクリプトとスタイルを許可します。

```ts
const shieldConfig = defineConfig({
  csp: {
    directives: {
      defaultSrc: [`'self'`, '@nonce'],
    },
  },
})
```

### Vite Devサーバーからアセットを読み込む
[Viteの統合](../basics/vite.md)を使用している場合、Vite Devサーバーが提供するアセットを許可するために次のCSPキーワードを使用できます。

- `@viteDevUrl`はVite DevサーバーのURLを許可リストに追加します。
- `@viteHmrUrl`はVite HMRウェブソケットサーバーのURLを許可リストに追加します。

```ts
const shieldConfig = defineConfig({
  csp: {
    directives: {
      defaultSrc: [`'self'`, '@viteDevUrl'],
      connectSrc: ['@viteHmrUrl']
    },
  },
})
```

Viteのバンドル出力をCDNサーバーにデプロイしている場合は、`@viteDevUrl`を`@viteUrl`キーワードに置き換えて、開発サーバーとCDNサーバーの両方からのアセットを許可する必要があります。

```ts
directives: {
  // delete-start
  defaultSrc: [`'self'`, '@viteDevUrl'],
  // delete-end
  // insert-start
  defaultSrc: [`'self'`, '@viteUrl'],
  // insert-end
  connectSrc: ['@viteHmrUrl']
},
```

### Viteによって注入されるスタイルにNonceを追加する
現在、ViteはDOM内に注入される`style`タグに`nonce`属性を定義することを許可していません。これに関しては[オープンなPR](https://github.com/vitejs/vite/pull/11864)があり、近々解決されることを期待しています。

## HSTSの設定
[**Strict-Transport-Security（HSTS）**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)レスポンスヘッダーは、ブラウザに常にHTTPSを使用してウェブサイトを読み込むように指示します。

`config/shield.ts`ファイルを使用してヘッダーディレクティブを設定できます。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  hsts: {
    enabled: true,
    maxAge: '180 days',
    includeSubDomains: true,
  },
})
```

<dl>

<dt>

enabled

</dt>

<dd>

HSTSガードをオンまたはオフにします。

</dd>

<dt>

maxAge

</dt>

<dd>

`max-age`属性を定義します。値は秒単位の数値または文字列形式の時間表現である必要があります。

```ts
{
  // 10秒間記憶する
  maxAge: 10,
}
```

```ts
{
  // 2日間記憶する
  maxAge: '2 days',
}
```

</dd>

<dt>

includeSubDomains

</dt>

<dd>

`includeSubDomains`ディレクティブを定義して、サブドメインに設定を適用します。

</dd>

</dl>

## X-Frame保護の設定
[**X-Frame-Options**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)ヘッダーは、ブラウザが`iframe`、`frame`、`embed`、`object`タグ内に埋め込まれたウェブサイトをレンダリングすることが許可されているかどうかを示すために使用されます。

:::note

もしCSPを設定している場合は、代わりに[frame-ancestors](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)ディレクティブを使用し、`xFrame`ガードを無効にできます。

:::

`config/shield.ts`ファイルを使用してヘッダーディレクティブを設定できます。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  xFrame: {
    enabled: true,
    action: 'DENY'
  },
})
```

<dl>

<dt>

enabled

</dt>

<dd>

xFrameガードをオンまたはオフにします。

</dd>

<dt>

action

</dt>

<dd>

`action`プロパティはヘッダーの値を定義します。`DENY`、`SAMEORIGIN`、または`ALLOW-FROM`のいずれかを指定できます。

```ts
{
  action: 'DENY'
}
```

`ALLOW-FROM`の場合、`domain`プロパティも定義する必要があります。

```ts
{
  action: 'ALLOW-FROM',
  domain: 'https://foo.com',
}
```

</dd>

</dl>

## MIMEスニッフィングの無効化
[**X-Content-Type-Options**](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Content-Type-Options)ヘッダーは、ブラウザに対して`content-type`ヘッダーに従い、HTTPレスポンスの内容を検査してMIMEスニッフィングを行わないよう指示します。

このガードを有効にすると、ShieldはすべてのHTTPレスポンスに対して`X-Content-Type-Options: nosniff`ヘッダーを定義します。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  contentTypeSniffing: {
    enabled: true,
  },
})
```
