---
summary: Aceコマンドフレームワークを使用したAdonisJSのコマンドラインテスト。
---

# コンソールテスト

コンソールテストは、アプリケーションまたはパッケージのコードベースに含まれるカスタムAceコマンドのテストを指します。

このガイドでは、コマンドのテスト方法、ロガーの出力のモック、CLIのプロンプトのトラップ方法について学びます。

## 基本的な例

まず、`greet`という新しいコマンドを作成しましょう。

```sh
node ace make:command greet
```

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class Greet extends BaseCommand {
  static commandName = 'greet'
  static description = 'ユーザー名でユーザーに挨拶する'

  static options: CommandOptions = {}

  async run() {
    this.logger.info('Hello world from "Greet"')
  }
}
```

`tests/unit`ディレクトリ内に**ユニット**テストを作成しましょう。すでに定義されていない場合は、[ユニットテストスイートを定義](./introduction.md#suites)してください。

```sh
node ace make:test commands/greet --suite=unit

# DONE:    create tests/unit/commands/greet.spec.ts
```

新しく作成されたファイルを開き、次のテストを書きましょう。`ace`サービスを使用して`Greet`コマンドのインスタンスを作成し、正常に終了することをアサートします。

```ts
import { test } from '@japa/runner'
import Greet from '#commands/greet'
import ace from '@adonisjs/core/services/ace'

test.group('Commands greet', () => {
  test('ユーザーに挨拶し、終了コード1で終了することをアサートする', async () => {
    /**
     * Greetコマンドクラスのインスタンスを作成する
     */
    const command = await ace.create(Greet, [])

    /**
     * コマンドを実行する
     */
    await command.exec()

    /**
     * 終了コードが0であることをアサートする
     */
    command.assertSucceeded()
  })
})
```

次のaceコマンドを使用してテストを実行しましょう。

```sh
node ace test --files=commands/greet
```

## ロガーの出力のテスト

`Greet`コマンドは現在、ログメッセージをターミナルに書き込んでいます。このメッセージをキャプチャし、アサーションを行うために、aceのUIライブラリを`raw`モードに切り替える必要があります。

`raw`モードでは、aceはログをターミナルに書き込まず、アサーションのためにメモリ内に保持します。

Japaの`each.setup`フックを使用して、`raw`モードに切り替えることができます。

```ts
test.group('Commands greet', (group) => {
  // highlight-start
  group.each.setup(() => {
    ace.ui.switchMode('raw')
    return () => ace.ui.switchMode('normal')
  })
  // highlight-end
  
  // テストはここに記述します
})
```

フックが定義されたら、テストを次のように更新できます。

```ts
test('ユーザーに挨拶し、終了コード1で終了することをアサートする', async () => {
  /**
   * Greetコマンドクラスのインスタンスを作成する
   */
  const command = await ace.create(Greet, [])

  /**
   * コマンドを実行する
   */
  await command.exec()

  /**
   * 終了コードが0であることをアサートする
   */
  command.assertSucceeded()

  // highlight-start
  /**
   * コマンドが次のログメッセージを出力したことをアサートする
   */
  command.assertLog('[ blue(info) ] Hello world from "Greet"')
  // highlight-end
})
```

## テーブルの出力のテスト

ログメッセージのテストと同様に、UIライブラリを`raw`モードに切り替えることで、テーブルの出力に対してアサーションを行うことができます。

```ts
async run() {
  const table = this.ui.table()
  table.head(['Name', 'Email'])

  table.row(['Harminder Virk', 'virk@adonisjs.com'])
  table.row(['Romain Lanz', 'romain@adonisjs.com'])
  table.row(['Julien-R44', 'julien@adonisjs.com'])
  table.row(['Michaël Zasso', 'targos@adonisjs.com'])

  table.render()
}
```

上記のテーブルを使用して、次のようにアサーションを行うことができます。

```ts
const command = await ace.create(Greet, [])
await command.exec()

command.assertTableRows([
  ['Harminder Virk', 'virk@adonisjs.com'],
  ['Romain Lanz', 'romain@adonisjs.com'],
  ['Julien-R44', 'julien@adonisjs.com'],
  ['Michaël Zasso', 'targos@adonisjs.com'],
])
```

## プロンプトのトラップ

[プロンプト](../ace/prompts.md)は、手動での入力を待つため、テストを書く際にはプログラムでトラップして応答する必要があります。

プロンプトは`prompt.trap`メソッドを使用してトラップされます。このメソッドはプロンプトのタイトル（大文字と小文字を区別）を受け入れ、追加の動作を設定するためのチェーン可能なAPIを提供します。

トラップは、プロンプトがトリガーされると自動的に解除されます。トラップがトリガーされずにテストが終了した場合、エラーがスローされます。

次の例では、「What is your name?」というタイトルのプロンプトにトラップを設定し、`replyWith`メソッドを使用して回答します。

```ts
const command = await ace.create(Greet, [])

// highlight-start
command.prompt
  .trap('What is your name?')
  .replyWith('Virk')
// highlight-end

await command.exec()

command.assertSucceeded()
```

### オプションの選択

セレクトまたはマルチセレクトのプロンプトでオプションを選択するには、`chooseOption`および`chooseOptions`メソッドを使用します。

```ts
command.prompt
  .trap('Select package manager')
  .chooseOption(0)
```

```ts
command.prompt
  .trap('Select database manager')
  .chooseOptions([1, 2])
```

### 確認プロンプトの承認または拒否

`toggle`メソッドと`confirm`メソッドを使用して表示されるプロンプトを承認または拒否できます。

```ts
command.prompt
  .trap('Want to delete all files?')
  .accept()
```

```ts
command.prompt
  .trap('Want to delete all files?')
  .reject()
```

### バリデーションのアサーション

プロンプトのバリデーションの動作をテストするために、`assertPasses`メソッドと`assertFails`メソッドを使用できます。これらのメソッドは、プロンプトの値を受け入れ、[プロンプトのvalidate](../ace/prompts.md#prompt-options)メソッドに対してテストを行います。

```ts
command.prompt
  .trap('What is your name?')
  // 空の値が提供された場合にプロンプトが失敗することをアサートする
  .assertFails('', 'Please enter your name')
  
command.prompt
  .trap('What is your name?')
  .assertPasses('Virk')
```

次の例は、アサーションとプロンプトへの回答を組み合わせた例です。

```ts
command.prompt
  .trap('What is your name?')
  .assertFails('', 'Please enter your name')
  .assertPasses('Virk')
  .replyWith('Romain')
```

## 利用可能なアサーション

コマンドインスタンスで利用可能なアサーションメソッドのリストは次のとおりです。

### assertSucceeded

コマンドが`exitCode=0`で終了したことをアサートします。

```ts
await command.exec()
command.assertSucceeded()
```

### assertFailed

コマンドが非ゼロの`exitCode`で終了したことをアサートします。

```ts
await command.exec()
command.assertSucceeded()
```

### assertExitCode

コマンドが特定の`exitCode`で終了したことをアサートします。

```ts
await command.exec()
command.assertExitCode(2)
```

### assertNotExitCode

コマンドが任意の`exitCode`で終了したことをアサートしますが、指定された終了コードではないことをアサートします。

```ts
await command.exec()
command.assertNotExitCode(0)
```

### assertLog

コマンドが`this.logger`プロパティを使用してログメッセージを書き込んだことをアサートします。オプションで出力ストリームを`stdout`または`stderr`としてアサートすることもできます。

```ts
await command.exec()

command.assertLog('Hello world from "Greet"')
command.assertLog('Hello world from "Greet"', 'stdout')
```

### assertLogMatches

コマンドが指定された正規表現に一致するログメッセージを書き込んだことをアサートします。

```ts
await command.exec()

command.assertLogMatches(/Hello world/)
```

### assertTableRows

コマンドがテーブルを`stdout`に出力したことをアサートします。テーブルの行を、列の配列として提供できます。列はセルの配列として表されます。

```ts
await command.exec()

command.assertTableRows([
  ['Harminder Virk', 'virk@adonisjs.com'],
  ['Romain Lanz', 'romain@adonisjs.com'],
  ['Julien-R44', 'julien@adonisjs.com'],
])
```
