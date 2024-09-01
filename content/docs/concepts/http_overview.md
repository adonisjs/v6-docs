---
summary: AdonisJSがHTTPサーバーを起動し、受信したリクエストを処理し、HTTPレイヤーで利用可能なモジュールについて学びます。
---

# HTTPの概要

AdonisJSは主にHTTPリクエストに応答するアプリケーションを作成するためのウェブフレームワークです。このガイドでは、AdonisJSがHTTPサーバーを起動し、受信したリクエストを処理し、HTTPレイヤーで利用可能なモジュールについて学びます。

## HTTPレイヤー
AdonisJSアプリケーション内のHTTPレイヤーは、以下のモジュールで構成されています。AdonisJSのHTTPレイヤーは、マイクロフレームワークを使用せずに独自に構築されています。


<dl>

<dt>

[ルーター](../basics/routing.md)

</dt>

<dd>

[ルーターモジュール](https://github.com/adonisjs/http-server/blob/main/src/router/main.ts)は、アプリケーションのエンドポイントであるルートを定義する責任を持ちます。ルートは、リクエストを処理するためのハンドラーを定義する必要があります。ハンドラーはクロージャーまたはコントローラへの参照であることができます。

</dd>

<dt>

[コントローラ](../basics/controllers.md)

</dt>

<dd>

コントローラは、HTTPリクエストを処理するためにルートにバインドされるJavaScriptクラスです。コントローラは組織レイヤーとして機能し、アプリケーションのビジネスロジックを異なるファイル/クラスに分割するのに役立ちます。

</dd>

<dt>

[HttpContext](./http_context.md)

</dt>


<dd>

AdonisJSは、受信したHTTPリクエストごとに[HttpContext](https://github.com/adonisjs/http-server/blob/main/src/http_context/main.ts)クラスのインスタンスを作成します。HttpContext（または`ctx`）は、リクエストのリクエストボディ、ヘッダー、認証されたユーザーなどの情報を保持します。

</dd>

<dt>

[ミドルウェア](../basics/middleware.md)

</dt>

<dd>

AdonisJSのミドルウェアパイプラインは、[Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility)デザインパターンの実装です。ミドルウェアを使用して、ルートハンドラーに到達する前にHTTPリクエストをインターセプトして応答できます。

</dd>

<dt>

[グローバル例外ハンドラー](../basics/exception_handling.md)

</dt>

<dd>

グローバル例外ハンドラーは、HTTPリクエスト中に発生した例外を中央の場所で処理します。グローバル例外ハンドラーを使用して例外をHTTPレスポンスに変換したり、外部のログサービスに報告したりできます。

</dd>

<dt>

サーバー

</dt>

<dd>

[サーバーモジュール](https://github.com/adonisjs/http-server/blob/main/src/server/main.ts)は、ルーター、ミドルウェア、グローバル例外ハンドラーを結び付け、リクエストを処理するためにNode.jsのHTTPサーバーにバインドするための[ハンドル関数](https://github.com/adonisjs/http-server/blob/main/src/server/main.ts#L330)をエクスポートします。

</dd>

</dl>

## AdonisJSがHTTPサーバーを起動する方法
HTTPサーバーは、Serverクラスの`boot`メソッドを呼び出すと起動されます。このメソッドは、以下のアクションを実行します。

- ミドルウェアパイプラインの作成
- ルートのコンパイル
- グローバル例外ハンドラーのインポートとインスタンス化

通常のAdonisJSアプリケーションでは、`boot`メソッドは`bin/server.ts`ファイル内の[Ignitor](https://github.com/adonisjs/core/blob/main/src/ignitor/http.ts)モジュールによって呼び出されます。

また、`boot`メソッドが呼び出される前に、ルート、ミドルウェア、およびグローバル例外ハンドラーを定義することが重要です。AdonisJSは、`start/routes.ts`および`start/kernel.ts`の[プリロードファイル](./adonisrc_file.md#preloads)を使用してこれを実現しています。

![](./server_boot_lifecycle.png)

## HTTPリクエストのライフサイクル
受信したHTTPリクエストを処理するためにHTTPサーバーがリスニングしていることがわかりました。次に、AdonisJSが与えられたHTTPリクエストをどのように処理するかを見てみましょう。

:::note

**参考:**\
[ミドルウェアの実行フロー](../basics/middleware.md#middleware-execution-flow)\
[ミドルウェアと例外処理](../basics/middleware.md#middleware-and-exception-handling)

:::


<dl>

<dt> HttpContextの作成 </dt>


<dd>

最初のステップとして、サーバーモジュールは[HttpContext](./http_context.md)クラスのインスタンスを作成し、ミドルウェア、ルートハンドラー、およびグローバル例外ハンドラーに参照として渡します。

[AsyncLocalStorage](./async_local_storage.md#usage)を有効にしている場合、同じインスタンスがローカルストレージ状態として共有されます。

</dd>

<dt> サーバーミドルウェアスタックの実行 </dt>

<dd>

次に、[サーバーミドルウェアスタック](../basics/middleware.md#server-middleware-stack)からミドルウェアが実行されます。これらのミドルウェアは、ルートハンドラーに到達する前にリクエストをインターセプトして応答できます。

また、HTTPリクエストは、与えられたエンドポイントに対してルーターが定義されていない場合でも、サーバーミドルウェアスタックを通過します。これにより、サーバーミドルウェアはルーティングシステムに依存せずにアプリに機能を追加できます。

</dd>

<dt> 一致するルートの検索 </dt>

<dd>

サーバーミドルウェアがリクエストを終了しない場合、`req.url`プロパティに一致するルートを検索します。一致するルートが存在しない場合、リクエストは`404 - Not found`の例外で中断されます。それ以外の場合は、リクエストを続行します。

</dd>

<dt> ルートミドルウェアの実行 </dt>

<dd>

一致するルートがある場合、[ルーターグローバルミドルウェア](../basics/middleware.md#router-middleware-stack)と[名前付きミドルウェアスタック](../basics/middleware.md#named-middleware-collection)を実行します。再度、ミドルウェアはルートハンドラーに到達する前にリクエストをインターセプトできます。

</dd>

<dt> ルートハンドラーの実行 </dt>

<dd>

最後のステップとして、リクエストはルートハンドラーに到達し、レスポンスとともにクライアントに返されます。

プロセスのいずれかのステップで例外が発生した場合、リクエストはグローバル例外ハンドラーに渡され、例外をレスポンスに変換する責任を持ちます。

</dd>

<dt> レスポンスのシリアライズ </dt>

<dd>

`response.send`メソッドを使用してレスポンスボディを定義するか、ルートハンドラーから値を返すことで、レスポンスのシリアライズプロセスが開始され、適切なヘッダーが設定されます。

[レスポンスボディのシリアライズについて詳しく見る](../basics/response.md#response-body-serialization)

</dd>

</dl>
