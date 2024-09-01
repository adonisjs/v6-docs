---
summary: Ace Terminal UIは、@poppinss/cliuiパッケージを利用してログ、テーブル、アニメーションを表示するツールを提供します。テスト用に設計されており、「raw」モードを使用してログの収集とアサーションを簡素化できます。
---

# ターミナルUI

AceターミナルUIは、[@poppinss/cliui](https://github.com/poppinss/cliui)パッケージによって提供されます。このパッケージは、ログの表示、テーブルのレンダリング、アニメーションタスクUIのレンダリングなどのヘルパーをエクスポートします。

ターミナルUIのプリミティブは、テストを意識して構築されています。テストを書く際には、`raw`モードをオンにして色やフォーマットを無効にし、すべてのログをメモリに収集してアサーションを行うことができます。

参考: [Aceコマンドのテスト](../testing/console_tests.md)

## ログメッセージの表示

CLIロガーを使用してログメッセージを表示できます。以下は利用可能なログメソッドのリストです。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    this.logger.debug('何かが起こりました')
    this.logger.info('これは情報メッセージです')
    this.logger.success('アカウントが作成されました')
    this.logger.warning('ディスク容量が不足しています')

    // stderrに書き込みます
    this.logger.error(new Error('書き込めません。ディスクがいっぱいです'))
    this.logger.fatal(new Error('書き込めません。ディスクがいっぱいです'))
  }
}
```

### プレフィックスとサフィックスの追加

オプションオブジェクトを使用して、ログメッセージの`prefix`と`suffix`を定義できます。プレフィックスとサフィックスは、低い不透明度で表示されます。

```ts
this.logger.info('パッケージをインストールしています', {
  suffix: 'npm i --production'
})

this.logger.info('パッケージをインストールしています', {
  prefix: process.pid
})
```

### ローディングアニメーション

ローディングアニメーション付きのログメッセージは、メッセージの末尾にアニメーション化された3つのドット（...）が追加されます。`animation.update`メソッドを使用してログメッセージを更新し、`animation.stop`メソッドを使用してアニメーションを停止できます。

```ts
const animation = this.logger.await('パッケージをインストールしています', {
  suffix: 'npm i'
})

animation.start()

// メッセージを更新
animation.update('パッケージを展開しています', {
  suffix: undefined
})

// アニメーションを停止
animation.stop()
```

### ロガーアクション

ロガーアクションは、一貫したスタイルと色でアクションの状態を表示できます。

`logger.action`メソッドを使用してアクションを作成できます。メソッドはアクションのタイトルを第一パラメータとして受け入れます。

```ts
const createFile = this.logger.action('config/auth.tsを作成しています')

try {
  await performTasks()
  createFile.displayDuration().succeeded()  
} catch (error) {
  createFile.failed(error)
}
```

アクションを`succeeded`、`failed`、または`skipped`としてマークできます。

```ts
action.succeeded()
action.skipped('スキップの理由')
action.failed(new Error())
```

## ANSIカラーでテキストをフォーマットする

Aceは、テキストをANSIカラーでフォーマットするために[kleur](https://www.npmjs.com/package/kleur)を使用しています。`this.colors`プロパティを使用することで、kleurのチェインAPIにアクセスできます。

```ts
this.colors.red('[ERROR]')
this.colors.bgGreen().white(' CREATED ')
```

## テーブルのレンダリング

`this.ui.table`メソッドを使用してテーブルを作成できます。このメソッドは`Table`クラスのインスタンスを返し、テーブルのヘッダーと行を定義するために使用できます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const table = this.ui.table()
    
    table
      .head([
        'マイグレーション',
        '実行時間',
        'ステータス',
      ])
      .row([
        '1590591892626_tenants.ts',
        '2ms',
        '完了'
      ])
      .row([
        '1590595949171_entities.ts',
        '2ms',
        '完了'
      ])
      .render()
  }
}
```

テーブルのレンダリング時に任意の値にカラートランスフォームを適用できます。

例:
```ts
table.row([
  '1590595949171_entities.ts',
  '2',
  this.colors.green('完了')
])
```

### 列を右揃えにする

列を右揃えにするには、オブジェクトとして定義し、`hAlign`プロパティを使用します。ヘッダーの列も右揃えにすることを忘れないでください。

```ts
table
  .head([
    'マイグレーション',
    'バッチ',
    {
      content: 'ステータス',
      hAlign: 'right'
    },
  ])

table.row([
  '1590595949171_entities.ts',
  '2',
  {
    content: this.colors.green('完了'),
    hAlign: 'right'
  }
])
```

### フル幅のレンダリング

デフォルトでは、テーブルは`auto`の幅でレンダリングされ、各列の内容に応じたスペースのみを取ります。

ただし、`fullWidth`メソッドを使用してテーブルをフル幅でレンダリングできます（ターミナルのすべてのスペースを使用します）。フル幅モードでは:

- コンテンツのサイズに応じてすべての列がレンダリングされます。
- 最初の列を除いて、利用可能なスペースをすべて取ります。

```ts
table.fullWidth().render()
```

フル幅モードで流体カラム（すべてのスペースを取るカラム）の列インデックスを変更するには、`table.fluidColumnIndex`メソッドを呼び出します。

```ts
table
  .fullWidth()
  .fluidColumnIndex(1)
```

## ステッカーの印刷

ステッカーを使用すると、ボーダー付きのボックス内にコンテンツをレンダリングできます。重要な情報をユーザーの注意を引くために使用すると便利です。

`this.ui.sticker`メソッドを使用してステッカーのインスタンスを作成できます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const sticker = this.ui.sticker()

    sticker
      .add('HTTPサーバーを起動しました')
      .add('')
      .add(`ローカルアドレス:   ${this.colors.cyan('http://localhost:3333')}`)
      .add(`ネットワークアドレス: ${this.colors.cyan('http://192.168.1.2:3333')}`)
      .render()
  }
}
```

ボックス内に一連の手順を表示したい場合は、`this.ui.instructions`メソッドを使用できます。指示の出力の各行は矢印記号`>`で接頭辞が付けられます。

## タスクのレンダリング

タスクウィジェットは、複数の時間のかかるタスクの進捗状況を共有するための優れたUIを提供します。ウィジェットには次の2つのレンダリングモードがあります。

- `minimal`モードでは、現在実行中のタスクのUIが展開され、1つのログ行が表示されます。
- `verbose`モードでは、各ログステートメントが独自の行にレンダリングされます。デバッグタスクには、verboseレンダラを使用する必要があります。

`this.ui.tasks`メソッドを使用してタスクウィジェットのインスタンスを作成できます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const tasks = this.ui.tasks()
    
    // ... コードの残り部分を記述
  }
}
```

個々のタスクは、`tasks.add`メソッドを使用して追加されます。メソッドはタスクのタイトルを第一パラメータとして受け入れ、実装コールバックを第二パラメータとして受け入れます。

コールバックからタスクのステータスを返す必要があります。すべての戻り値は、`task.error`メソッドでラップするか、コールバック内で例外をスローするまで、成功メッセージとして扱われます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const tasks = this.ui.tasks()

    // highlight-start
    await tasks
      .add('リポジトリをクローンする', async (task) => {
        return '完了'
      })
      .add('パッケージファイルを更新する', async (task) => {
        return task.error('パッケージファイルを更新できません')
      })
      .add('依存関係をインストールする', async (task) => {
        return 'インストール済み'
      })
      .run()
    // highlight-end
  }
}
```

### タスクの進捗報告

タスクの進捗メッセージをコンソールに書き込む代わりに、`task.update`メソッドを呼び出すことをオススメします。

`update`メソッドは、`minimal`レンダラを使用して最新のログメッセージを表示し、すべてのメッセージを`verbose`レンダラを使用してログに記録します。

```ts
const sleep = () => new Promise<void>((resolve) => setTimeout(resolve, 50))

tasks
  .add('リポジトリをクローンする', async (task) => {
    for (let i = 0; i <= 100; i = i + 2) {
      await sleep()
      task.update(`ダウンロード中 ${i}%`)
    }

    return '完了'
  })
```

### verboseレンダラに切り替える

タスクウィジェットを作成する際に、verboseレンダラに切り替えることができます。`verbose`モードをオンにするためのフラグをコマンドのユーザーに渡すことを検討すると良いでしょう。

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  @flags.boolean()
  declare verbose: boolean

  async run() {
    const tasks = this.ui.tasks({
      verbose: this.verbose
    })
  }
}
```
