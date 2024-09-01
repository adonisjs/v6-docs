---
summary: AdonisJSでテンプレートエンジンのEdge.jsを使い方を学びます
---

# EdgeJS

Edgeは、Node.js向けにAdonisJSのコアチームによって作成およびメンテナンスされている、**シンプル**で**モダン**かつ**機能満載**のテンプレートエンジンです。EdgeはJavaScriptのように書くことができます。JavaScriptを知っていれば、Edgeも知っています。

:::note
Edgeのドキュメントは[https://edgejs.dev](https://edgejs.dev)で利用できます。
:::

## インストール

以下のコマンドを使用してEdgeをインストールおよび設定します。

```sh
node ace add edge
```

:::disclosure{title="addコマンドによって実行されるステップを確認"}

1. 検出されたパッケージマネージャを使用して`edge.js`パッケージをインストールします。

2. `adonisrc.ts`ファイル内に以下のサービスプロバイダを登録します。

  ```ts
  {
    providers: [
    // ...other providers
    () => import('@adonisjs/core/providers/edge_provider')
    ]
  }
  ```

:::

## 最初のテンプレートのレンダリング

設定が完了したら、Edgeを使用してテンプレートをレンダリングすることができます。`resources/views`ディレクトリ内に`welcome.edge`ファイルを作成しましょう。

```sh
node ace make:view welcome
```

新しく作成されたファイルを開き、以下のマークアップを記述します。

```edge
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <h1>
  Hello world from {{ request.url() }} endpoint
  </h1>
</body>
</html>
```

最後に、テンプレートをレンダリングするためのルートを登録しましょう。

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ view }) => {
  return view.render('welcome')
})
```

また、`router.on().render`メソッドを使用して、コールバックをルートに割り当てずにテンプレートをレンダリングすることもできます。

```ts
router.on('/').render('welcome')
```

### テンプレートへのデータの渡し方

`view.render`メソッドの第2引数としてオブジェクトを渡すことで、テンプレートにデータを渡すことができます。

```ts
router.get('/', async ({ view }) => {
  return view.render('welcome', { username: 'romainlanz' })
})
```

## Edgeの設定
Edgeにはプラグインを使用したり、グローバルヘルパーを追加したりすることができます。`start`ディレクトリ内に[preloadファイル](../concepts/adonisrc_file.md#preloads)を作成することで設定できます。

```sh
node ace make:preload view
```

```ts
// title: start/view.ts
import edge from 'edge.js'
import env from '#start/env'
import { edgeIconify } from 'edge-iconify'

/**
 * プラグインを登録する
 */
edge.use(edgeIconify)

/**
 * グローバルプロパティを定義する
 */
edge.global('appUrl', env.get('APP_URL'))
```

## グローバルヘルパー

AdonisJSが提供するヘルパーのリストは、[Edgeヘルパーのリファレンスガイド](../references/edge.md)を参照してください。

## 詳細を学ぶ

- [Edge.jsのドキュメント](https://edgejs.dev)
- [コンポーネント](https://edgejs.dev/docs/components/introduction)
- [SVGアイコン](https://edgejs.dev/docs/edge-iconify)
- [Adocasts Edgeシリーズ](https://adocasts.com/topics/edge)
