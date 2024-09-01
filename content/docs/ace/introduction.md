---
summary: Aceは、AdonisJSがコンソールコマンドを作成および実行するために使用するコマンドラインフレームワークです。
---


# イントロダクション

Aceは、AdonisJSがコンソールコマンドを作成および実行するために使用するコマンドラインフレームワークです。プロジェクトのルートにAceのエントリーポイントファイルが保存されており、次のように実行できます。

```sh
node ace
```

`node`バイナリはTypeScriptのソースコードを直接実行できないため、aceファイルを純粋なJavaScriptで保持し、`.js`拡張子を使用する必要があります。

内部では、`ace.js`ファイルは[ESMモジュールローダーフック](https://nodejs.org/api/module.html#customization-hooks)としてTS Nodeを登録し、TypeScriptコードを実行し、`bin/console.ts`ファイルをインポートします。

## ヘルプとコマンドの一覧表示

引数なしでaceエントリーポイントファイルを実行するか、`list`コマンドを使用して利用可能なコマンドの一覧を表示できます。

```sh
node ace

# 上記と同じ
node ace list
```

![](./ace_help_screen.jpeg)

`--help`フラグを使用して、単一のコマンドのヘルプを表示できます。

```sh
node ace make:controller --help
```

:::note

ヘルプ画面の出力は、[docopt](http://docopt.org/)の標準にしたがってフォーマットされています。

:::


## カラーの有効化/無効化

Aceは、実行環境がカラーをサポートしていない場合、カラフルな出力を無効にします。ただし、`--ansi`フラグを使用して手動でカラーを有効化または無効化することもできます。

```sh
# カラーを無効にする
node ace list --no-ansi

# カラーを強制的に有効にする
node ace list --ansi
```

## コマンドのエイリアス作成

コマンドのエイリアスは、よく使用するコマンドのエイリアスを定義する便利なレイヤーを提供します。たとえば、単数のリソースフルなコントローラを頻繁に作成する場合、`adonisrc.ts`ファイル内にエイリアスを作成できます。

```ts
{
  commandsAliases: {
    resource: 'make:controller --resource --singular'
  }
}
```

エイリアスが定義されると、エイリアスを使用してコマンドを実行できます。

```sh
node ace resource admin
```

### エイリアスの展開方法

- コマンドを実行するたびに、Aceは`commandsAliases`オブジェクト内をエイリアスをチェックします。
- エイリアスが存在する場合、スペースの前のセグメントがコマンドの検索に使用されます。
- コマンドが存在する場合、エイリアスの値の残りのセグメントがコマンド名に追加されます。

    たとえば、次のコマンドを実行する場合

    ```sh
    node ace resource admin --help
    ```
    
    それは展開されます
    
    ```sh
    make:controller --resource --singular admin --help
    ```

## プログラムでコマンドを実行する

`ace`サービスを使用してプログラムでコマンドを実行できます。aceサービスは、アプリケーションが起動された後に利用可能になります。

`ace.exec`メソッドは、最初のパラメータとしてコマンド名を、2番目のパラメータとしてコマンドライン引数の配列を受け取ります。

例:
```ts
import ace from '@adonisjs/core/services/ace'

const command = await ace.exec('make:controller', [
  'user',
  '--resource',
])
    
console.log(command.exitCode)
console.log(command.result)
console.log(command.error)
```

コマンドを実行する前に、`ace.hasCommand`メソッドを使用してコマンドが存在するかどうかを確認できます。

```ts
import ace from '@adonisjs/core/services/ace'

/**
 * Bootメソッドは、コマンドをロードします（まだロードされていない場合）
 */
await ace.boot()

if (ace.hasCommand('make:controller')) {
  await ace.exec('make:controller', [
    'user',
    '--resource',
  ])
}
```
