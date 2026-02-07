---
summary: 了解如何在 Ace 命令中定义和处理命令标志。
---

# 命令标志

标志是用两个连字符 (`--`) 或单个连字符 (`-`)（称为标志别名）提到的命名参数。标志可以按任何顺序提及。

你必须将标志定义为类属性，并使用 `@flags` 装饰器对它们进行装饰。在下面的示例中，我们定义了 `resource` 和 `singular` 标志，两者都表示布尔值。

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeControllerCommand extends BaseCommands {
  @flags.boolean()
  declare resource: boolean

  @flags.boolean()
  declare singular: boolean
}
```

## 标志类型

Ace 允许定义以下类型之一的标志。

### 布尔标志

布尔标志使用 `@flags.boolean` 装饰器定义。提及该标志将其值设置为 `true`。否则，标志值为 `undefined`。

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

最后一个示例显示布尔标志可以使用 `--no-` 前缀进行否定。

默认情况下，否定的选项不显示在帮助输出中。但是，你可以使用 `showNegatedVariantInHelp` 选项启用它。

```ts
export default class MakeControllerCommand extends BaseCommands {
  @flags.boolean({
    showNegatedVariantInHelp: true,
  })
  declare resource: boolean
}
```

### 字符串标志

字符串标志在标志名称后接受一个值。你可以使用 `@flags.string` 方法定义字符串标志。

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

如果标志值包含空格或特殊字符，则必须将其包裹在引号 `""` 内。

```sh
make:controller --model blog user
# this.model = 'blog'

make:controller --model "blog user"
# this.model = 'blog user'
```

如果提及了标志但未提供值（即使标志是可选的），则会显示错误。

```sh
make:controller
# Works! The optional flag is not mentioned

make:controller --model
# Error! Missing value
```

### 数字标志

数字标志的解析类似于字符串标志。但是，会对值进行验证以确保其为有效数字。

你可以使用 `@flags.number` 装饰器创建数字标志。

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeUserCommand extends BaseCommands {
  @flags.number()
  declare score: number
}
```

### 数组标志

数组标志允许在运行命令时多次使用该标志。你可以使用 `@flags.array` 方法定义数组标志。

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

## 标志名称和描述

默认情况下，标志名称是类属性名称的短横线连接形式 (dashed case)。但是，你可以通过 `flagName` 选项定义自定义名称。

```ts
@flags.boolean({
  flagName: 'server'
})
declare startServer: boolean
```

标志描述显示在帮助屏幕上。你可以使用 `description` 选项来定义它。

```ts
@flags.boolean({
  flagName: 'server',
  description: 'Starts the application server'
})
declare startServer: boolean
```

## 标志别名

别名是使用单个连字符 (`-`) 提到的标志的简写名称。别名必须是单个字符。

```ts
@flags.boolean({
  alias: ['r']
})
declare resource: boolean

@flags.boolean({
  alias: ['s']
})
declare singular: boolean
```

在运行命令时，可以组合标志别名。

```ts
make:controller -rs

# 等同于
make:controller --resource --singular
```

## 默认值

你可以使用 `default` 选项定义标志的默认值。当未提及标志或提及标志但没有值时，将使用默认值。

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


## 处理标志值

使用 `parse` 方法，你可以在标志值被定义为类属性之前对其进行处理。
