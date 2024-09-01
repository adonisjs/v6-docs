---
summary: AdonisJSアプリケーションでフロントエンドアセットをバンドルするためにViteを使用する方法を学びます。
---

# Vite

AdonisJSは、アプリケーションのフロントエンドアセットをバンドルするために[Vite](https://vitejs.dev/)を使用しています。私たちは公式の統合を提供しており、ViteをAdonisJSのようなバックエンドフレームワークと統合するために必要なすべての重い作業を行います。以下を含みます：

- AdonisJS内にVite開発サーバーを埋め込むこと。
- 設定オプションを簡素化するための専用のViteプラグイン。
- Viteによって処理されたアセットのURLを生成するためのEdgeヘルパーとタグ。
- サーバーサイドレンダリング（SSR）を実行するための[ViteランタイムAPI](https://vitejs.dev/guide/api-vite-runtime.html#vite-runtime-api)へのアクセス。

ViteはAdonisJSの開発サーバーに埋め込まれており、Viteが処理する必要のあるすべてのリクエストは、AdonisJSのミドルウェアを介してViteにプロキシされます。これにより、サーバーサイドレンダリング（SSR）を実行したり、単一の開発サーバーを管理したりするために、ViteのランタイムAPIに直接アクセスできます。また、アセットはAdonisJSによって直接提供され、別のプロセスでは提供されません。

:::tip
まだ@adonisjs/vite 2.xを使用していますか？[マイグレーションガイド](https://github.com/adonisjs/vite/releases/tag/v3.0.0)を参照して最新バージョンにアップグレードしてください。
:::

## インストール

まず、少なくとも以下のバージョンのAdonisJSがインストールされていることを確認してください：

- `@adonisjs/core`: 6.9.1以降
- `@adonisjs/assembler`: 7.7.0以降

次に、`@adonisjs/vite`パッケージをインストールして設定します。以下のコマンドは、パッケージと`vite`をインストールし、必要な設定ファイルを作成してプロジェクトを構成します。

```sh
// title: npm
node ace add @adonisjs/vite
```

:::disclosure{title="configureコマンドによって実行される手順を参照"}

1. `adonisrc.ts`ファイル内で次のサービスプロバイダーを登録します。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/vite/vite_provider')
      ]
    }
    ```

2. `vite.config.ts`と`config/vite.ts`の設定ファイルを作成します。

3. フロントエンドのエントリーポイントファイル（`resources/js/app.js`など）を作成します。

:::

完了したら、`adonisrc.ts`ファイルに以下を追加してください。

```ts
import { defineConfig } from '@adonisjs/core/build/standalone'

export default defineConfig({
  // highlight-start
  assetsBundler: false,
  hooks: {
    onBuildStarting: [() => import('@adonisjs/vite/build_hook')],
  },
  // highlight-end
})
```

`assetsBundler`プロパティは`false`に設定されており、AdonisJS Assemblerによるアセットバンドラーの管理をオフにします。

`hooks`プロパティは`@adonisjs/vite/build_hook`を登録してViteのビルドプロセスを実行します。詳細については、[Assembler hooks](../concepts/assembler_hooks.md)を参照してください。


## 設定
セットアッププロセスでは、2つの設定ファイルが作成されます。`vite.config.ts`ファイルはViteバンドラーを設定するために使用され、`config/vite.ts`はAdonisJSのバックエンドで使用されます。

### Vite設定ファイル
`vite.config.ts`ファイルは、Viteによって使用される通常の設定ファイルです。プロジェクトの要件に応じて、このファイル内で追加のViteプラグインをインストールおよび登録できます。

デフォルトでは、`vite.config.ts`ファイルはAdonisJSプラグインを使用しており、次のオプションを受け入れます。

```ts
// title: vite.config.ts
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    adonisjs({
      entrypoints: ['resources/js/app.js'],
      reload: ['resources/views/**/*.edge'],
    }),
  ]
})
```

<dl>

<dt>
entrypoints
</dt>

<dd>

`entrypoints`は、フロントエンドのコードベースのエントリーポイントファイルを指します。通常、追加のインポートを含むJavaScriptまたはTypeScriptファイルになります。各エントリーポイントは、個別の出力バンドルとして結果をもたらします。

また、必要に応じて複数のエントリーポイントを定義することもできます。たとえば、ユーザー向けのアプリと管理パネル向けの別個のエントリーポイントなどです。

</dd>

<dt>
buildDirectory
</dt>

<dd>

`buildDirectory`オプションは、出力ディレクトリへの相対パスを定義します。このオプションの値は、Viteの[`build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir)オプションに供給されます。

デフォルト値を変更する場合は、`config/vite.ts`ファイル内の`buildDirectory`パスも更新する必要があります。

**デフォルト：public/assets**

</dd>

<dt>
reload
</dt>

<dd>

ファイルの変更時にブラウザを監視してリロードするためのグロブパターンの配列を含みます。デフォルトでは、Edgeテンプレートを監視しますが、追加のパターンを設定することもできます。

</dd>

<dt>
assetsUrl
</dt>

<dd>

本番環境でアセットのリンクを生成する際に接頭辞とするURLを含みます。Viteの出力をCDNにアップロードする場合は、このプロパティの値をCDNサーバーのURLに設定する必要があります。

バックエンドの設定でも同じ`assetsUrl`の値を使用するようにバックエンドの設定を更新してください。

</dd>
</dl>

---

### AdonisJS設定ファイル
AdonisJSは、Viteのビルドプロセスの出力パスに関する情報を知るために、バックエンドで`config/vite.ts`ファイルを使用します。

```ts
// title: config/vite.ts
import { defineConfig } from '@adonisjs/vite'

const viteBackendConfig = defineConfig({
  buildDirectory: 'public/assets',
  assetsUrl: '/assets',
})

export default viteBackendConfig
```

<dl>

<dt>
buildDirectory
</dt>

<dd>

Viteのビルド出力ディレクトリへのパスを含みます。`vite.config.ts`ファイル内のデフォルト値を変更した場合は、このバックエンドの設定も更新する必要があります。

</dd>

<dt>
assetsUrl
</dt>

<dd>

本番環境でアセットのリンクを生成する際に接頭辞とするURLを含みます。Viteの出力をCDNにアップロードする場合は、このプロパティの値をCDNサーバーのURLに設定する必要があります。

</dd>

<dt>
scriptAttributes
</dt>

<dd>

`scriptAttributes`プロパティを使用して、`@vite`タグを使用して生成されたスクリプトタグに属性を設定できます。属性はキーと値のコレクションです。

```ts
// title: config/vite.ts
defineConfig({
  scriptAttributes: {
    defer: true,
    async: true,
  }
})
```

</dd>

<dt>
styleAttributes
</dt>

<dd>

`styleAttributes`プロパティを使用して、`@vite`タグを使用して生成されたリンクタグに属性を設定できます。属性はキーと値のコレクションです。

```ts
// title: config/vite.ts
defineConfig({
  styleAttributes: {
    'data-turbo-track': 'reload'
  }
})
```

また、`styleAttributes`オプションに関数を割り当てることで、条件付きで属性を適用することもできます。

```ts
defineConfig({
  styleAttributes: ({ src, url }) => {
    if (src === 'resources/css/admin.css') {
      return {
        'data-turbo-track': 'reload'
      }
    }
  }
})
```

</dd>

</dl>

## フロントエンドアセットのフォルダ構造
AdonisJSは、フロントエンドアセットを格納するための特定のフォルダ構造を強制しません。自由に組織化できます。

ただし、`resources`フォルダ内にフロントエンドアセットを格納し、各アセットクラスをそれぞれのサブディレクトリ内に配置することをオススメします。

```
resources
└── css
└── js
└── fonts
└── images
```

Viteの出力は`public/assets`フォルダになります。`/assets`サブディレクトリを選択したのは、Viteを使用せずに処理したい他の静的ファイルを`public`フォルダに引き続き使用できるようにするためです。

## 開発サーバーの起動

通常どおりアプリケーションを起動すると、AdonisJSが必要なリクエストを自動的にViteにプロキシします。

```sh
node ace serve --hmr
```

## Edgeテンプレートにエントリーポイントを含める
`vite.config.ts`ファイルで定義されたエントリーポイントのスクリプトタグとスタイルタグを、`@vite` Edgeタグを使用してレンダリングできます。このタグはエントリーポイントの配列を受け入れ、`script`タグと`link`タグを返します。

```edge
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    // highlight-start
    @vite(['resources/js/app.js'])
    // highlight-end
</head>
<body>

</body>
</html>
```

CSSファイルはJavaScriptファイル内でインポートし、別個のエントリーポイントとして登録することをオススメします。例：

```
resources
└── css
    └── app.css
└── js
    └── app.js
```

```js
// title: resources/js/app.js
import '../css/app.css'
```

## Edgeテンプレート内でアセットを参照する
Viteは、エントリーポイントによってインポートされたファイルの依存関係グラフを作成し、バンドルされた出力に応じてパスを自動的に更新します。ただし、ViteはEdgeテンプレートを認識せず、参照されたアセットを検出することはできません。

そのため、Viteによって処理されたファイルのURLを作成するために使用できるEdgeヘルパーを提供しています。次の例では：

- `asset`ヘルパーは、開発中にVite開発サーバーを指すURLを返します。
- 本番環境では、出力ファイルを指すURLを返します。

```edge
<link rel="stylesheet" href="{{ asset('resources/css/app.css') }}">
```

```html
// title: 開発環境の出力
<link rel="stylesheet" href="http://localhost:5173/resources/css/app.css">
```

```html
// title: 本番環境の出力
<link rel="stylesheet" href="/assets/app-3bc29777.css">
```

## Viteで追加のアセットを処理する
Viteは、フロントエンドのコードによってインポートされない静的アセット（静的な画像、フォント、またはEdgeテンプレート内でのみ参照されるSVGアイコンなど）は無視します。

そのため、これらのアセットの存在をViteに通知する必要があります。そのためには、[Glob imports](https://vitejs.dev/guide/features.html#glob-import) APIを使用します。

次の例では、`resources/images`ディレクトリ内のすべてのファイルをViteに処理するように指示しています。このコードはエントリーポイントファイル内に記述する必要があります。

```js
// title: resources/js/app.js
import.meta.glob(['../images/**'])
```

これで、Edgeテンプレート内で次のように画像を参照できます。

```edge
<img src="{{ asset('resources/images/hero.jpg') }}" />
```

## TypeScriptの設定
フロントエンドのコードベースでTypeScriptを使用する場合は、`resources`ディレクトリ内に追加の`tsconfig.json`ファイルを作成してください。Viteとコードエディタは、`resources`ディレクトリ内のTypeScriptソースコードに自動的にこの設定ファイルを使用します。

```json
// title: resources/tsconfig.json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "lib": ["DOM"],
    "jsx": "preserve", // Reactを使用している場合
    "paths": {
      "@/*": ["./js/*"]
    }
  }
}
```

## ReactでHMRを有効にする
開発中に[react-refresh](https://www.npmjs.com/package/react-refresh)を有効にするには、`@viteReactRefresh` Edgeタグを使用する必要があります。エントリーポイントを含む前に、`@vite`タグを使用してください。

```edge
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    // highlight-start
    @viteReactRefresh()
    @vite(['resources/js/app.js'])
    // highlight-end
</head>
<body>
    
</body>
</html>
```

一度完了したら、Reactプラグインを通常通りViteプロジェクトで設定できます。

```ts
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    adonisjs({
      entrypoints: ["resources/js/app.js"],
    }),
    // highlight-start
    react(),
    // highlight-end
  ],
})
```

## CDNへのアセットのデプロイ
Viteを使用して本番ビルドを作成した後、バンドルされた出力をCDNサーバーにアップロードしてファイルを提供できます。

ただし、それを行う前に、`manifest.json`ファイル内の出力URLがCDNサーバーを指すように、ViteとAdonisJSの両方でCDNサーバーのURLを登録する必要があります。

`vite.config.ts`ファイルと`config/vite.ts`ファイル内で`assetsUrl`を定義する必要があります。

```ts
// title: vite.config.ts
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    adonisjs({
      entrypoints: ['resources/js/app.js'],
      reloads: ['resources/views/**/*.edge'],
      // highlight-start
      assetsUrl: 'https://cdn.example.com/',
      // highlight-end
    }),
  ]
})
```

```ts
// title: config/vite.ts
import { defineConfig } from '@adonisjs/vite'

const viteBackendConfig = defineConfig({
  buildDirectory: 'public/assets',
  // highlight-start
  assetsUrl: 'https://cdn.example.com/',
  // highlight-end
})

export default viteBackendConfig
```

## 高度なコンセプト

### ミドルウェアモード

古いバージョンのAdonisJSでは、Viteは別のプロセスとして起動され、独自の開発サーバーを持っていました。

3.xバージョンでは、ViteはAdonisJSの開発サーバーに埋め込まれ、Viteが処理する必要のあるすべてのリクエストは、AdonisJSのミドルウェアを介してViteにプロキシされます。

ミドルウェアモードの利点は、ViteのランタイムAPIに直接アクセスしてサーバーサイドレンダリング（SSR）を実行したり、単一の開発サーバーを管理したりできることです。

ミドルウェアモードについて詳しくは、[Viteのドキュメント](https://vitejs.dev/guide/ssr#setting-up-the-dev-server)を参照してください。

### マニフェストファイル
Viteは、アセットの本番ビルドとともに[マニフェストファイル](https://vitejs.dev/guide/backend-integration.html)を生成します。

マニフェストファイルには、Viteによって処理されたアセットへのURLが含まれており、AdonisJSはこのファイルを使用して、`asset`ヘルパーや`@vite`タグを使用してEdgeテンプレート内で参照されるアセットのURLを作成します。
