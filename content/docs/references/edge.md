---
summary: AdonisJS 公式パッケージによって提供される Edge テンプレートエンジンへのヘルパーとタグについて学びましょう。
---

# Edge ヘルパーとタグ

このガイドでは、AdonisJS公式パッケージによってEdgeに貢献された **ヘルパーとタグ** について学びます。Edgeに同梱されているヘルパーについては、このガイドではカバーされていませんので、同じものについては [Edge](https://edgejs.dev/docs/helpers) のドキュメントを参照してください。

## request
進行中の [HTTP リクエスト](../basics/request.md) のインスタンスへの参照です。このプロパティは、`ctx.view.render` メソッドを使用してテンプレートをレンダリングする場合にのみ利用できます。

```edge
{{ request.url() }}
{{ request.input('signature') }}
```

## route/signedRoute
[URL ビルダー](../basics/routing.md#url-builder) を使用してルートのURLを作成するためのヘルパー関数です。URLビルダーとは異なり、ビューヘルパーにはフルエントAPIはありません。以下のパラメータを受け入れます。

<table>
    <tr>
        <td>位置</td>
        <td>説明</td>
    </tr>
    <tr>
        <td>1番目</td>
        <td>ルート識別子またはルートパターン</td>
    </tr>
    <tr>
        <td>2番目</td>
        <td>ルートパラメータは配列またはオブジェクトとして定義されます。</td>
    </tr>
    <tr>
        <td>3番目</td>
        <td>
          <p>以下のプロパティを持つオプションオブジェクト。</p>
          <ul>
            <li><code>qs</code>: クエリ文字列パラメータをオブジェクトとして定義します。</li>
            <li><code>domain</code>: 特定のドメインの下でルートを検索します。</li>
            <li><code>prefixUrl</code>: 出力に URL をプレフィックスします。</li>
            <li><code>disableRouteLookup</code>: ルートの検索を有効化/無効化します。</li>
          </ul>
        </td>
    </tr>
</table>

```edge
<a href="{{ route('posts.show', [post.id]) }}">
  投稿を表示
</a>
```

```edge
<a href="{{
  signedRoute('unsubscribe', [user.id], {
    expiresIn: '3 days',
    prefixUrl: 'https://blog.adonisjs.com'    
  })
}}">
  退会する
</a>
```

## app
[Application インスタンス](../concepts/application.md) への参照です。

```edge
{{ app.getEnvironment() }}
```

## config
Edgeテンプレート内で設定値を参照するための [ヘルパー関数](../getting_started/configuration.md#reading-config-inside-edge-templates) です。`config.has` メソッドを使用してキーの値が存在するかどうかを確認できます。

```edge
@if(config.has('app.appUrl'))
  <a href="{{ config('app.appUrl') }}"> ホーム </a>
@else
  <a href="/"> ホーム </a>
@end
```

## session
[セッションオブジェクト](../basics/session.md#reading-and-writing-data) の読み取り専用コピーです。Edgeテンプレート内ではセッションデータを変更することはできません。`session` プロパティは、`ctx.view.render` メソッドを使用してテンプレートをレンダリングする場合にのみ利用できます。

```edge
投稿の閲覧数: {{ session.get(`post.${post.id}.visits`) }}
```

## flashMessages
[セッションフラッシュメッセージ](../basics/session.md#flash-messages) の読み取り専用コピーです。`flashMessages` プロパティは、`ctx.view.render` メソッドを使用してテンプレートをレンダリングする場合にのみ利用できます。

```edge
@if(flashMessages.has('inputErrorsBag.title'))
  <p>{{ flashMessages.get('inputErrorsBag.title') }}</p>
@end

@if(flashMessages.has('notification'))
  <div class="notification {{ flashMessages.get('notification').type }}">
    {{ flashMessages.get('notification').message }}
  </div>
@end
```

## old
`old` メソッドは `flashMessages.get` メソッドの省略形です。

```edge
<input
  type="text"
  name="email"
  value="{{ old('name') || '' }}"
/>
```

## t
`@adonisjs/i18n` パッケージによって提供される `t` メソッドは、[i18n クラス](../digging_deeper/i18n.md#resolving-translations) を使用して翻訳を表示するためのものです。このメソッドは、翻訳キーの識別子、メッセージデータ、およびフォールバックメッセージをパラメータとして受け入れます。

```edge
<h1> {{ t('messages.greeting') }} </h1>
```

## i18n
アプリケーションのデフォルトロケールで構成されたI18nクラスのインスタンスへの参照です。ただし、[`DetectUserLocaleMiddleware`](../digging_deeper/i18n.md#detecting-user-locale-during-an-http-request) は、現在のHTTPリクエストのロケール用に作成されたインスタンスでこのプロパティをオーバーライドします。

```edge
{{ i18n.formatCurrency(200, { currency: 'USD' }) }}
```

## auth
[InitializeAuthMiddleware](https://github.com/adonisjs/auth/blob/main/src/auth/middleware/initialize_auth_middleware.ts#L14) によって共有される [ctx.auth](../concepts/http_context.md#http-context-properties) プロパティへの参照です。このプロパティを使用して、ログインユーザーに関する情報にアクセスできます。

```edge
@if(auth.isAuthenticated)
  <p> {{ auth.user.email }} </p>
@end
```

ログインユーザーの情報を公開ページ（認証ミドルウェアで保護されていない）で表示する場合は、まずユーザーがログインしているかどうかをサイレントにチェックすることをオススメします。

```edge
{{-- ユーザーがログインしているかどうかをチェック --}}
@eval(await auth.use('web').check())

@if(auth.use('web').isAuthenticated)
  <p> {{ auth.use('web').user.email }} </p>
@end
```

## asset
Viteによって処理されたアセットのURLを解決します。Edgeテンプレート内で [アセットの参照](../basics/vite.md#referencing-assets-inside-edge-templates) について詳しく学びましょう。

```edge
<img src="{{ asset('resources/images/hero.jpg') }}" />
```

## embedImage / embedImageData
`embedImage` と `embedImageData` ヘルパーは [mail](../digging_deeper/mail.md#embedding-images) パッケージによって追加され、メールを送信するためにテンプレートをレンダリングする場合にのみ利用できます。

```edge
<img src="{{
  embedImage(app.makePath('assets/hero.jpg'))
}}" />
```

## @flashMessage
`@flashMessage` タグは、特定のキーに基づいて条件付きでフラッシュメッセージを読み取るためのより良いDXを提供します。

:::caption{for="error"}
**条件文を書く代わりに**
:::

```edge
@if(flashMessages.has('notification'))
  <div class="notification {{ flashMessages.get('notification').type }}">
    {{ flashMessages.get('notification').message }}
  </div>
@end
```

:::caption{for="success"}
**タグを使用することをオススメします**
:::

```edge
@flashMessage('notification')
  <div class="notification {{ $message.type }}">
    {{ $message.message }}
  </div>
@end
```

## @error
`@error` タグは、`flashMessages` の `errorsBag` キーに格納されたエラーメッセージを読み取るためのより良いDXを提供します。

:::caption{for="error"}
**条件文を書く代わりに**
:::

```edge
@if(flashMessages.has('errorsBag.E_BAD_CSRF_TOKEN'))
  <p>{{ flashMessages.get('errorsBag.E_BAD_CSRF_TOKEN') }}</p>
@end
```

:::caption{for="success"}
**タグを使用することをオススメします**
:::

```edge
@error('E_BAD_CSRF_TOKEN')
  <p>{{ $message }}</p>
@end
```

## @inputError
`@inputError` タグは、`flashMessages` の `inputErrorsBag` キーに格納されたバリデーションエラーメッセージを読み取るためのより良いDXを提供します。

:::caption{for="error"}
**条件文を書く代わりに**
:::

```edge
@if(flashMessages.has('inputErrorsBag.title'))
  @each(message in flashMessages.get('inputErrorsBag.title'))
    <p>{{ message }}</p>
  @end
@end
```

:::caption{for="success"}
**タグを使用することをオススメします**
:::

```edge
@inputError('title')
  @each(message in $messages)
    <p>{{ message }}</p>
  @end
@end
```

## @vite
`@vite` タグは、エントリーポイントのパスの配列を受け入れ、それに対応する `script` タグと `link` タグを返します。`@vite` タグに指定するパスは、`vite.config.js` ファイルに登録されているパスと完全に一致する必要があります。

```ts
export default defineConfig({
  plugins: [
    adonisjs({
      // highlight-start
      entrypoints: ['resources/js/app.js'],
      // highlight-end
    }),
  ]
})
```

```edge
@vite(['resources/js/app.js'])
```

2番目の引数としてスクリプトタグの属性を定義することもできます。例:

```edge
@vite(['resources/js/app.js'], {
  defer: true,
})
```

## @viteReactRefresh
`@viteReactRefresh` タグは、[@vitejs/plugin-react](https://www.npmjs.com/package/@vitejs/plugin-react) パッケージを使用しているプロジェクトに対して [React HMR を有効にするためのスクリプトタグ](https://vitejs.dev/guide/backend-integration.html#:~:text=you%27ll%20also%20need%20to%20add%20this%20before%20the%20above%20scripts) を返します。

```edge
@viteReactRefresh()
```

出力されるHTML

```html
<script type="module">
  import RefreshRuntime from 'http://localhost:5173/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
</script>
```

## @can/@cannot
`@can` および `@cannot` タグを使用すると、文字列として能力名またはポリシー名を参照することで、Edgeテンプレート内で認可チェックを行うことができます。

最初の引数は能力またはポリシーの参照であり、それに続く引数はチェックで受け入れられる引数です。

参考: [能力とポリシーの事前登録](../security/authorization.md#pre-registering-abilities-and-policies)

```edge
@can('editPost', post)
  {{-- 投稿を編集できます。 --}}
@end

@can('PostPolicy.edit', post)
  {{-- 投稿を編集できます。 --}}
@end
```

```edge
@cannot('editPost', post)
  {{-- 投稿を編集できません。 --}}
@end

@cannot('editPost', post)
  {{-- 投稿を編集できません。 --}}
@end
```
