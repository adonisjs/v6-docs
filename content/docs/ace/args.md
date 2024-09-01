---
summary: Aceコマンドでの引数の定義と処理について学びます。
---

# コマンド引数

引数は、コマンド名の後に記述される位置引数を指します。引数は位置に依存するため、正しい順序で渡す必要があります。

引数はクラスのプロパティとして定義し、`args`デコレータを使用してデコレートする必要があります。引数はクラス内で定義された順序で受け入れられます。

次の例では、`@args.string`デコレータを使用して、文字列値を受け入れる引数を定義しています。

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'ユーザーを名前で挨拶する'
  
  @args.string()
  declare name: string

  run() {
    console.log(this.name)
  }
}
```

同じ引数名の下で複数の値を受け入れるには、`@agrs.spread`デコレータを使用できます。ただし、スプレッド引数は最後に配置する必要があります。

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'ユーザーを名前で挨拶する'
  
  // highlight-start
  @args.spread()
  declare names: string[]
  // highlight-start

  run() {
    console.log(this.names)
  }
}
```

## 引数名と説明

引数名はヘルプ画面に表示されます。デフォルトでは、引数名はクラスのプロパティ名のダッシュ区切り表記です。ただし、カスタムの値を定義することもできます。

```ts
@args.string({
  argumentName: 'user-name'
})
declare name: string
``` 

引数の説明はヘルプ画面に表示され、`description`オプションを使用して設定できます。

```ts
@args.string({
  argumentName: 'user-name',
  description: 'ユーザーの名前'
})
declare name: string
```

## デフォルト値を持つオプション引数

デフォルトでは、すべての引数は必須です。ただし、`required`オプションを`false`に設定することでオプション引数にできます。オプション引数は最後に配置する必要があります。

```ts
@args.string({
  description: 'ユーザーの名前',
  required: false,
})
declare name?: string
```

オプション引数のデフォルト値は、`default`プロパティを使用して設定できます。

```ts
@args.string({
  description: 'ユーザーの名前',
  required: false,
  default: 'guest'
})
declare name: string
```

## 引数値の処理

`parse`メソッドを使用すると、引数値をクラスのプロパティとして定義する前に処理できます。

```ts
@args.string({
  argumentName: 'user-name',
  description: 'ユーザーの名前',
  parse (value) {
    return value ? value.toUpperCase() : value
  }
})
declare name: string
```

## すべての引数へのアクセス

`this.parsed.args`プロパティを使用して、コマンドを実行する際に指定されたすべての引数にアクセスできます。

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'ユーザーを名前で挨拶する'
  
  @args.string()
  declare name: string

  run() {
    console.log(this.parsed.args)
  }
}
```
