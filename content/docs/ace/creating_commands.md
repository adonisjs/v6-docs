---
summary: 了解如何在 AdonisJS 中创建自定义 Ace 命令
---

# 创建命令

除了使用 Ace 命令外，你还可以创建自定义命令作为应用程序代码库的一部分。这些命令存储在 `commands` 目录（位于根级别）中。你可以通过运行以下命令来创建一个命令。

另请参阅：[Make command](../references/commands.md#makecommand)

```sh
node ace make:command greet
```

上述命令将在 `commands` 目录中创建一个 `greet.ts` 文件。Ace 命令由一个类表示，必须实现 `run` 方法来执行命令指令。

## 命令元数据

命令元数据包括 **命令名称**、**描述**、**帮助文本** 以及配置命令行为的 **选项**。

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a user by name'

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

`commandName` 属性用于定义命令名称。命令名称不应包含空格。此外，建议避免在命令名称中使用不熟悉的特殊字符，如 `*`、`&` 或斜杠。

命令名称可以位于命名空间下。例如，要定义 `make` 命名空间下的命令，可以在其前缀加上 `make:`。

</dd>

<dt>
  description
</dt>

<dd>

命令描述显示在命令列表和命令帮助屏幕上。你必须保持描述简短，并使用 **帮助文本** 进行更长的描述。

</dd>

<dt>
  help
</dt>

<dd>

帮助文本用于编写更长的描述或显示用法示例。

```ts
export default class GreetCommand extends BaseCommand {
  static help = [
    'The greet command is used to greet a user by name',
    '',
    'You can also send flowers to a user, if they have an updated address',
    '{{ binaryName }} greet --send-flowers',
  ]
}
```

> `{{ binaryName }}` 变量替换是对用于执行 ace 命令的二进制文件的引用。

</dd>

<dt>
  aliases
</dt>

<dd>

你可以使用 `aliases` 属性为命令名称定义一个或多个别名。

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

默认情况下，AdonisJS 在运行 Ace 命令时不会启动应用程序。这确保了命令运行迅速，并且不会为了执行简单任务而经过应用程序启动阶段。

但是，如果你的命令依赖于应用程序状态，你可以告诉 Ace 在执行命令之前启动应用程序。

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

默认情况下，如果你向命令传递未知的标志，Ace 会打印错误。但是，你可以使用 `options.allowUnknownFlags` 属性在命令级别禁用严格的标志解析。

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

AdonisJS 在执行命令的 `run` 命令后会隐式终止应用程序。但是，如果你想在命令中启动一个长时间运行的进程，你必须告诉 Ace 不要杀死该进程。

另请参阅：[终止应用程序](#terminating-application) 和 [在应用程序终止前清理](#cleaning-up-before-the-app-terminates) 部分。

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

## 命令生命周期方法

你可以在命令类上定义以下生命周期方法，Ace 将按预定义顺序执行它们。

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async prepare() {
    console.log('preparing')
  }

  async interact() {
    console.log('interacting')
  }
  
  async run() {
    console.log('running')
  }

  async completed() {
    console.log('completed')
  }
}
```

<table>
  <thead>
