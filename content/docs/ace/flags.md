---
summary: Aceコマンドでコマンドフラグを定義して処理する方法を学びます。
---

# コマンドフラグ

フラグは、ハイフン2つ（`--`）またはハイフン1つ（`-`）（フラグのエイリアスとして知られる）で指定される名前付きパラメータです。フラグは任意の順序で指定できます。

フラグはクラスのプロパティとして定義し、`@flags`デコレータを使用してデコレートする必要があります。次の例では、`resource`と`singular`のフラグを定義し、両方がブール値を表します。

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeControllerCommand extends BaseCommands {
  @flags.boolean()
  declare resource: boolean

  @flags.boolean()
  declare singular: boolean
}
```

## フラグの種類

Aceでは、次のいずれかのタイプのフラグを定義できます。

### ブールフラグ

ブールフラグは、`@flags.boolean`デコレータを使用して定義されます。フラグを指定すると、その値が`true`に設定されます。それ以外の場合、フラグの値は`undefined`です。

```sh
make:controller --resource

# this.resource === true
```

```sh
make:controller

# this.resource === undefined
```

```sh
make:controller --no-resource

# this.resource === false
```

最後の例では、ブールフラグは`--no-`接頭辞で否定することができることを示しています。

デフォルトでは、否定されたオプションはヘルプ出力に表示されません。ただし、`showNegatedVariantInHelp`オプションを使用して有効にすることもできます。

```ts
export default class MakeControllerCommand extends BaseCommands {
  @flags.boolean({
    showNegatedVariantInHelp: true,
  })
  declare resource: boolean
}
```

### 文字列フラグ

文字列フラグは、フラグ名の後に値を受け入れます。`@flags.string`メソッドを使用して文字列フラグを定義できます。

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeControllerCommand extends BaseCommands {
  @flags.string()
  declare model: string
}
```

```sh
make:controller --model user

# this.model = 'user'
```

フラグの値にスペースや特殊文字が含まれる場合は、引用符`""`で囲む必要があります。

```sh
make:controller --model blog user
# this.model = 'blog'

make:controller --model "blog user"
# this.model = 'blog user'
```

フラグが指定されているが値が提供されていない場合（フラグがオプションの場合でも）、エラーが表示されます。

```sh
make:controller
# できます！オプションのフラグは指定されていません

make:controller --model
# エラー！値が不足しています
```

### 数値フラグ

数値フラグの解析は文字列フラグと似ています。ただし、値が有効な数値であることを検証します。

`@flags.number`デコレータを使用して数値フラグを作成できます。

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeUserCommand extends BaseCommands {
  @flags.number()
  declare score: number
}
```

### 配列フラグ

配列フラグは、コマンドを実行する際にフラグを複数回使用できるようにします。`@flags.array`メソッドを使用して配列フラグを定義できます。

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeUserCommand extends BaseCommands {
  @flags.array()
  declare groups: string[]
}
```

```sh
make:user --groups=admin --groups=moderators --groups=creators

# this.groups = ['admin', 'moderators', 'creators']
```

## フラグ名と説明

デフォルトでは、フラグ名はクラスのプロパティ名のダッシュケース表記です。ただし、`flagName`オプションを使用してカスタム名を定義できます。

```ts
@flags.boolean({
  flagName: 'server'
})
declare startServer: boolean
```

フラグの説明はヘルプ画面に表示されます。`description`オプションを使用して定義できます。

```ts
@flags.boolean({
  flagName: 'server',
  description: 'アプリケーションサーバーを起動します'
})
declare startServer: boolean
```

## フラグのエイリアス

エイリアスは、単一のハイフン（`-`）を使用して指定されるフラグの省略名です。エイリアスは1文字である必要があります。

```ts
@flags.boolean({
  aliases: ['r']
})
declare resource: boolean

@flags.boolean({
  aliases: ['s']
})
declare singular: boolean
```

フラグのエイリアスは、コマンドを実行する際に組み合わせることができます。

```ts
make:controller -rs

# 以下と同じです
make:controller --resource --singular
```

## デフォルト値

`default`オプションを使用してフラグのデフォルト値を定義できます。デフォルト値は、フラグが指定されていないか値がない場合に使用されます。

```ts
@flags.boolean({
  default: true,
})
declare startServer: boolean

@flags.string({
  default: 'sqlite',
})
declare connection: string
```


## フラグ値の処理

`parse`メソッドを使用すると、フラグの値をクラスのプロパティとして定義する前に処理できます。

```ts
@flags.string({
  parse (value) {
    return value ? connections[value] : value
  }
})
declare connection: string
```

## すべてのフラグへのアクセス

`this.parsed.flags`プロパティを使用すると、コマンドを実行する際に指定されたすべてのフラグにアクセスできます。フラグプロパティはキーと値のペアのオブジェクトです。

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeControllerCommand extends BaseCommands {
  @flags.boolean()
  declare resource: boolean

  @flags.boolean()
  declare singular: boolean
  
  async run() {
    console.log(this.parsed.flags)
    
    /**
     * コマンドに指定されたが
     * コマンドで受け入れられなかったフラグの名前
     */
    console.log(this.parsed.unknownFlags)
  }
}
```
