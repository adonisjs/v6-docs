---
summary: AdonisJSはコマンドラインからアプリケーションと対話するためのアプリケーション対応のREPLを提供しています。
---

# REPL
[Node.js REPL](https://nodejs.org/api/repl.html)のように、AdonisJSはコマンドラインからアプリケーションと対話するためのアプリケーション対応のREPLを提供しています。`node ace repl`コマンドを使用してREPLセッションを開始できます。

```sh
node ace repl
```

![](../ace/ace_repl.png)

標準のNode.js REPLに加えて、AdonisJSは以下の機能を提供します。

- TypeScriptファイルのインポートと実行
- `router`、`helpers`、`hash`サービスなどのコンテナサービスをインポートするための短縮メソッド
- [IoCコンテナ](../concepts/dependency_injection.md#constructing-a-tree-of-dependencies)を使用してクラスインスタンスを作成するための短縮メソッド
- カスタムメソッドとREPLコマンドを追加するための拡張可能なAPI

## REPLとの対話
REPLセッションを開始すると、有効なJavaScriptコードを入力してEnterキーを押すことで対話型のプロンプトが表示されます。コードの出力は次の行に表示されます。

複数行のコードを入力したい場合は、`.editor`コマンドを入力してエディターモードに入ることができます。複数行のステートメントを実行するには`Ctrl+D`を押し、エディターモードをキャンセルして終了するには`Ctrl+C`を押します。

```sh
> (js) .editor
# // エディターモードに入ります (終了するにはCtrl+D、キャンセルするにはCtrl+C)
```

### 最後に実行されたコマンドの結果にアクセスする
ステートメントの値を変数に割り当てるのを忘れた場合、`_`変数を使用してアクセスすることができます。例：

```sh
> (js) helpers.string.generateRandom(32)
# 'Z3y8QQ4HFpYSc39O2UiazwPeKYdydZ6M'
> (js) _
# 'Z3y8QQ4HFpYSc39O2UiazwPeKYdydZ6M'
> (js) _.length
# 32
> (js)
```

### 最後に実行されたコマンドで発生したエラーにアクセスする
前のコマンドで発生した例外には、`_error`変数を使用してアクセスできます。例：

```sh
> (js) helpers.string.generateRandom()
> (js) _error.message
# 'The value of "size" is out of range. It must be >= 0 && <= 2147483647. Received NaN'
```

### 履歴の検索
REPLの履歴はユーザーのホームディレクトリにある`.adonisjs_v6_repl_history`ファイルに保存されます。

履歴のコマンドをループ処理するには、上矢印キー`↑`を押すか、履歴内で検索するには`Ctrl+R`を押します。

### REPLセッションの終了
REPLセッションを終了するには`.exit`を入力するか、`Ctrl+C`を2回押します。AdonisJSはREPLセッションを閉じる前に正常なシャットダウンを実行します。

また、コードベースを変更した場合は、新しい変更を反映するためにREPLセッションを終了して再起動する必要があります。

## モジュールのインポート
Node.jsではREPLセッション内で`import`ステートメントを使用することはできません。そのため、動的な`import`関数を使用して出力を変数に割り当てる必要があります。例：

```ts
const { default: User } = await import('#models/user')
```

`importDefault`メソッドを使用して、デフォルトエクスポートに分割せずにアクセスすることもできます。

```ts
const User = await importDefault('#models/user')
```

## ヘルパーメソッド
ヘルパーメソッドは特定のアクションを実行するためのショートカット関数です。`.ls`コマンドを使用して利用可能なメソッドのリストを表示できます。

```sh
> (js) .ls

# グローバルメソッド:
importDefault         モジュールのデフォルトエクスポートを返します
make                  "container.make"メソッドを使用してクラスインスタンスを作成します
loadApp               REPLコンテキストで"app"サービスをロードします
loadEncryption        REPLコンテキストで"encryption"サービスをロードします
loadHash              REPLコンテキストで"hash"サービスをロードします
loadRouter            REPLコンテキストで"router"サービスをロードします
loadConfig            REPLコンテキストで"config"サービスをロードします
loadTestUtils         REPLコンテキストで"testUtils"サービスをロードします
loadHelpers           REPLコンテキストで"helpers"モジュールをロードします
clear                 REPLコンテキストからプロパティをクリアします
p                     関数をプロミス化します。Node.jsの"util.promisify"に似ています
```

## REPLにカスタムメソッドを追加する
`repl.addMethod`を使用してREPLにカスタムメソッドを追加できます。メソッドは第1引数として名前、第2引数として実装のコールバックを受け取ります。

デモンストレーションのために、[preloadファイル](../concepts/adonisrc_file.md#preloads)を作成し、`./app/models`ディレクトリからすべてのモデルをインポートするメソッドを定義します。

```sh
node ace make:preload repl --env=repl
```

```ts
// title: start/repl.ts
import app from '@adonisjs/core/services/app'
import repl from '@adonisjs/core/services/repl'
import { fsImportAll } from '@adonisjs/core/helpers'

repl.addMethod('loadModels', async () => {
  const models = await fsImportAll(app.makePath('app/models'))
  repl.server!.context.models = models

  repl.notify('モデルをインポートしました。"models"プロパティを使用してアクセスできます')
  repl.server!.displayPrompt()
})
```

`repl.addMethod`メソッドには、第3引数として以下のオプションを渡すこともできます。

- `description`: ヘルプ出力に表示する人間が読める説明
- `usage`: メソッドの使用方法のコードスニペットを定義します。設定しない場合は、メソッド名が使用されます。

完了したら、REPLセッションを再起動し、`loadModels`メソッドを実行してすべてのモデルをインポートできます。

```sh
node ace repl

# 利用可能なコンテキストメソッド/プロパティのリストを表示するには".ls"を入力します
> (js) await loadModels()
```
