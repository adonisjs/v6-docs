---
summary: "AdonisJSは、Node.js向けのTypeScriptファーストのウェブフレームワークです。フルスタックのウェブアプリケーションやJSON APIサーバーを作成することができます。"
---

# はじめに

::include{template="partials/introduction_cards"}

## AdonisJSとは？

AdonisJSは、Node.js向けのTypeScriptファーストのウェブフレームワークです。これを使用して、フルスタックのウェブアプリケーションやJSON APIサーバーを作成できます。

基本レベルでは、AdonisJSはアプリケーションに構造を提供し、シームレスなTypeScript開発環境を設定し、バックエンドコードのHMRを設定しメンテナンスが行き届いて詳細にドキュメント化されたパッケージの広範なコレクションを提供します。

私たちは、AdonisJSを使用するチームが、npmパッケージの細かい機能ごとの選択やグルーコードの作成、完璧なフォルダ構造の議論などの些細な決定に時間を費やすことなく、ビジネスニーズに重要な実世界の機能を提供するためにより多くの時間を費やすことを想定しています。

### フロントエンドに対してはフレキシブル

AdonisJSはバックエンドに焦点を当て、フロントエンドスタックを選択できるようにします。

シンプルにする場合は、AdonisJSを[従来のテンプレートエンジン](../views-and-templates/introduction.md)と組み合わせてサーバー上で静的なHTMLを生成します。または、フロントエンドのVue/Reactアプリケーションに対してJSON APIを作成します。

AdonisJSは、電子メールの送信、ユーザー入力の検証、CRUD操作の実行、ユーザーの認証など、ゼロから堅牢なバックエンドアプリケーションを作成するためのバッテリーを提供することを目指しています。すべてを私たちが世話します。

### モダンで型安全

AdonisJSは、モダンなJavaScriptプリミティブの上に構築されています。ESモジュール、Node.jsのサブパスインポートエイリアス、TypeScriptソースの実行にはSWC、アセットのバンドリングにはViteを使用しています。


また、TypeScriptはフレームワークのAPIを設計する際に重要な役割を果たしています。たとえば、AdonisJSには次のようなものがあります。

- [型安全なイベントエミッター](../digging_deeper/emitter.md#making-events-type-safe)
- [型安全な環境変数](../getting_started/environment_variables.md)
- [型安全なバリデーションライブラリ](../basics/validation.md)

### MVCを採用

AdonisJSは、クラシックなMVCデザインパターンを採用しています。まず、JavaScriptの関数型APIを使用してルートを定義し、それらにコントローラをバインドし、コントローラ内でHTTPリクエストを処理するためのロジックを記述します。

```ts
import router from '@adonisjs/core/services/router'
import PostsController from '#controllers/posts_controller'

router.get('posts', [PostsController, 'index'])
```

コントローラはモデルを使用してデータベースからデータを取得し、ビュー（テンプレート）をレスポンスとしてレンダリングできます。

```ts
import { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.all()
    return view.render('pages/posts/list', { posts })
  }
}
```

APIサーバーを構築している場合は、ビューレイヤーをJSONレスポンスに置き換えることができます。ただし、HTTPリクエストの処理と応答のフローは同じままです。

```ts
import { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.all()
    // delete-start
    return view.render('pages/posts/list', { posts })
    // delete-end
    // insert-start
    /**
     * 投稿配列は自動的にJSONにシリアライズされます。
     */
    return posts
    // insert-end
  }
}
```

## ガイドの前提条件

AdonisJSのドキュメントは、コアチームがメンテナンスしているいくつかのパッケージとモジュールの使用方法とAPIをカバーするリファレンスガイドとして書かれています。

**このガイドでは、ゼロからアプリケーションを構築する方法を教えるものではありません**。チュートリアルをお探しの場合は、[Adocasts](https://adocasts.com/)からの旅を始めることをオススメします。Tom（Adocastsの作成者）は、AdonisJSの最初のステップを踏み出すのに役立つ、非常に質の高いスクリーンキャストを作成しています。

それにもかかわらず、ドキュメントは利用可能なモジュールの使用方法とフレームワークの内部動作について詳細に説明しています。

## 最近のリリース
以下は最近のリリースのリストです。[ここをクリックして](./releases.md)すべてのリリースを表示します。

::include{template="partials/recent_releases"}

## スポンサー

::include{template="partials/sponsors"}
