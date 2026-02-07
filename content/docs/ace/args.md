---
summary: 了解如何在 Ace 命令中定义和处理命令参数。
---

# 命令参数

参数是指在命令名称之后提到的位置参数。由于参数是位置性的，因此必须按正确的顺序传递它们。

你必须将命令参数定义为类属性，并使用 `args` 装饰器对它们进行装饰。参数将按它们在类中定义的顺序被接受。

在下面的示例中，我们使用 `@args.string` 装饰器定义了一个接受字符串值的参数。

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a user by name'
  
  @args.string()
  declare name: string

  run() {
    console.log(this.name)
  }
}
```

要在同一个参数名称下接受多个值，你可以使用 `@args.spread` 装饰器。请注意，spread 参数必须是最后一个。

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a user by name'
  
  // highlight-start
  @args.spread()
  declare names: string[]
  // highlight-start

  run() {
    console.log(this.names)
  }
}
```

## 参数名称和描述

参数名称显示在帮助屏幕上。默认情况下，参数名称是类属性名称的短横线连接形式 (dashed case)。但是，你也可以定义一个自定义值。

```ts
@args.string({
  argumentName: 'user-name'
})
declare name: string
``` 

参数描述显示在帮助屏幕上，可以使用 `description` 选项进行设置。

```ts
@args.string({
  argumentName: 'user-name',
  description: 'Name of the user'
})
declare name: string
```

## 带有默认值的可选参数

默认情况下，所有参数都是必需的。但是，你可以通过将 `required` 选项设置为 `false` 来使它们变为可选。可选参数必须位于末尾。

```ts
@args.string({
  description: 'Name of the user',
  required: false,
})
declare name?: string
```

你可以使用 `default` 属性设置可选参数的默认值。

```ts
@args.string({
  description: 'Name of the user',
  required: false,
  default: 'guest'
})
declare name: string
```

## 处理参数值

使用 `parse` 方法，你可以在参数值被定义为类属性之前对其进行处理。

```ts
@args.string({
  argumentName: 'user-name',
  description: 'Name of the user',
  parse (value) {
    return value ? value.toUpperCase() : value
  }
})
declare name: string
```

## 访问所有参数

你可以使用 `this.parsed.args` 属性访问运行命令时提到的所有参数。

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a user by name'
  
  @args.string()
  declare name: string

  run() {
    console.log(this.parsed.args)
  }
}
```
