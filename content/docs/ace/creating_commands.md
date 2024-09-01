---
summary: AdonisJSでカスタムAceコマンドを作成する方法を学びます
---

# コマンドの作成

Aceコマンドを使用するだけでなく、アプリケーションのコードベースの一部としてカスタムコマンドを作成することもできます。コマンドは`commands`ディレクトリ（ルートレベル）に格納されます。次のコマンドを実行してコマンドを作成できます。

参考：[makeコマンド](../references/commands.md#makecommand)

```sh
node ace make:command greet
```

上記のコマンドは`commands`ディレクトリ内に`greet.ts`ファイルを作成します。Aceコマンドはクラスで表され、コマンドの指示を実行するために`run`メソッドを実装する必要があります。

## コマンドのメタデータ

コマンドのメタデータには、**コマンド名**、**説明**、**ヘルプテキスト**、およびコマンドの動作を設定する**オプション**が含まれます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'ユーザーを名前で挨拶する'

  static options: CommandOptions = {
    startApp: false,
    allowUnknownFlags: false,
    staysAlive: false,
  }
}
```

<dl>
<dt>
  commandName
</dt>

<dd>

`commandName`プロパティはコマンド名を定義するために使用されます。コマンド名にはスペースを含めることはできません。また、コマンド名に`*`、`&`、またはスラッシュなどの不慣れな特殊文字を使用しないことをオススメします。

コマンド名はネームスペースの下に配置することもできます。たとえば、`make`ネームスペースの下にコマンドを定義するには、`make:`を接頭辞として付けることができます。

</dd>

<dt>
  description
</dt>

<dd>

コマンドの説明はコマンドリストとコマンドのヘルプ画面に表示されます。説明は短く保ち、より長い説明には**ヘルプテキスト**を使用してください。

</dd>

<dt>
  help
</dt>

<dd>

ヘルプテキストはより長い説明や使用例を表示するために使用されます。

```ts
export default class GreetCommand extends BaseCommand {
  static help = [
    '挨拶コマンドはユーザーを名前で挨拶するために使用されます',
    '',
    'ユーザーに花を送ることもできます。更新された住所がある場合は',
    '{{ binaryName }} greet --send-flowers',
  ]
}
```

> `{{ binaryName }}`変数の置換は、aceコマンドを実行するために使用されるバイナリへの参照です。

</dd>

<dt>
  aliases
</dt>

<dd>

`aliases`プロパティを使用して、コマンド名に1つ以上のエイリアスを定義できます。

```ts
export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static aliases = ['welcome', 'sayhi']
}
```

</dd>

<dt>
  options.startApp
</dt>

<dd>

デフォルトでは、AdonisJSはAceコマンドを実行する際にアプリケーションを起動しません。これにより、コマンドの実行が迅速に行われ、シンプルなタスクにアプリケーションの起動フェーズを経由しないようになります。

ただし、コマンドがアプリケーションの状態に依存する場合は、Aceにコマンドを実行する前にアプリを起動するように指示できます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class GreetCommand extends BaseCommand {
  // highlight-start
  static options: CommandOptions = {
    startApp: true
  }
  // highlight-end
}
```

</dd>

<dt>
  options.allowUnknownFlags
</dt>

<dd>

デフォルトでは、Aceはコマンドに未知のフラグを渡すとエラーを表示します。ただし、`options.allowUnknownFlags`プロパティを使用して、コマンドレベルで厳密なフラグの解析を無効にできます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class GreetCommand extends BaseCommand {
  // highlight-start
  static options: CommandOptions = {
    allowUnknownFlags: true
  }
  // highlight-end
}
```

</dd>

<dt>
  options.staysAlive
</dt>

<dd>

AdonisJSは、コマンドの`run`メソッドを実行した後にアプリを終了します。ただし、コマンド内で長時間実行されるプロセスを開始する場合は、プロセスを終了しないようにAceに指示する必要があります。

参考：[アプリの終了](#アプリの終了)および[アプリの終了前のクリーンアップ](#アプリの終了前のクリーンアップ)セクション。

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class GreetCommand extends BaseCommand {
  // highlight-start
  static options: CommandOptions = {
    staysAlive: true
  }
  // highlight-end
}
```
</dd>
</dl>

## コマンドのライフサイクルメソッド

コマンドクラスで以下のライフサイクルメソッドを定義でき、Aceはそれらを事前に定義された順序で実行します。

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async prepare() {
    console.log('準備中')
  }

  async interact() {
    console.log('対話中')
  }
  
  async run() {
    console.log('実行中')
  }

  async completed() {
    console.log('完了')
  }
}
```

<table>
  <thead>
    <tr>
      <th width="120px">メソッド</th>
      <th>説明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <code>prepare</code>
      </td>
      <td>これはコマンドで最初に実行されるメソッドです。このメソッドでは、コマンドを実行するために必要な状態やデータを設定できます。</td>
    </tr>
    <tr>
      <td>
        <code>interact</code>
      </td>
      <td><code>prepare</code>メソッドの後に実行される<code>interact</code>メソッドです。ユーザーにプロンプトを表示するために使用できます。</td>
    </tr>
    <tr>
      <td>
        <code>run</code>
      </td>
      <td>コマンドのメインロジックは<code>run</code>メソッドに記述します。このメソッドは<code>interact</code>メソッドの後に呼び出されます。</td>
    </tr>
    <tr>
      <td>
        <code>completed</code>
      </td>
      <td>他のライフサイクルメソッドの実行後に<code>completed</code>メソッドが呼び出されます。このメソッドはクリーンアップを実行したり、他のメソッドで発生したエラーを処理したりするために使用できます。</td>
    </tr>
  </tbody>
</table>

## 依存性の注入

Aceコマンドは[IoCコンテナ](../concepts/dependency_injection.md)を使用して構築および実行されます。そのため、コマンドのライフサイクルメソッドに依存関係を型指定し、`@inject`デコレータを使用して解決できます。

デモンストレーションのために、すべてのライフサイクルメソッドに`UserService`クラスを注入してみましょう。

```ts
import { inject } from '@adonisjs/core'
import { BaseCommand } from '@adonisjs/core/ace'
import UserService from '#services/user_service'

export default class GreetCommand extends BaseCommand {
  @inject()
  async prepare(userService: UserService) {
  }

  @inject()
  async interact(userService: UserService) {
  }
  
  @inject()
  async run(userService: UserService) {
  }

  @inject()
  async completed(userService: UserService) {
  }
}
```

## エラーの処理と終了コード

コマンドで発生した例外はCLIロガーを使用して表示され、コマンドの`exitCode`は`1`に設定されます（非ゼロのエラーコードはコマンドが失敗したことを意味します）。

ただし、`try/catch`ブロックでコードをラップするか、`completed`ライフサイクルメソッドを使用してエラーを処理することで、エラーをキャプチャすることもできます。いずれの場合でも、コマンドの`exitCode`と`error`プロパティを更新することを忘れないでください。

### try/catchでエラーを処理する

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    try {
      await runSomeOperation()
    } catch (error) {
      this.logger.error(error.message)
      this.error = error
      this.exitCode = 1
    }
  }
}
```

### completedメソッド内でエラーを処理する

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    await runSomeOperation()
  }
  
  async completed() {
    if (this.error) {
      this.logger.error(this.error.message)
      
      /**
       * エラーが処理されたことをAceに通知します
       */
      return true
    }
  }
}
```

## アプリの終了

デフォルトでは、Aceはコマンドの実行後にアプリケーションを終了します。ただし、`staysAlive`オプションを有効にしている場合は、`this.terminate`メソッドを使用して明示的にアプリケーションを終了する必要があります。

たとえば、サーバーメモリを監視するためにRedis接続を作成し、接続が失敗した場合にアプリを終了するとします。

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class GreetCommand extends BaseCommand {
  static options: CommandOptions = {
    staysAlive: true
  }
  
  async run() {
    const redis = createRedisConnection()
    
    // highlight-start
    redis.on('error', (error) => {
      this.logger.error(error)
      this.terminate()
    })
    // highlight-end
  }
}
```

## アプリの終了前のクリーンアップ

アプリケーションの終了は、[`SIGTERM`シグナル](https://www.howtogeek.com/devops/linux-signals-hacks-definition-and-more/)を含む複数のイベントによってトリガーされる場合があります。そのため、コマンド内で`terminating`フックをリッスンしてクリーンアップを実行する必要があります。

`prepare`ライフサイクルメソッド内で`terminating`フックをリッスンできます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class GreetCommand extends BaseCommand {
  static options: CommandOptions = {
    staysAlive: true
  }
  
  prepare() {
    this.app.terminating(() => {
      // クリーンアップを実行する
    })
  }
  
  async run() {
  }
}
```
