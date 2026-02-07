---
summary: Ace 终端 UI 利用 @poppinss/cliui 包，提供显示日志、表格和动画的工具。专为测试而设计，它包括“raw”模式以简化日志收集和断言。
---

# 终端 UI

Ace 终端 UI 由 [@poppinss/cliui](https://github.com/poppinss/cliui) 包提供支持。该包导出帮助程序以显示日志、渲染表格、渲染动画任务 UI 等等。

终端 UI 原语的构建考虑了测试。在编写测试时，你可以打开 `raw` 模式以禁用颜色和格式化，并将所有日志收集在内存中以对其进行断言。

另请参阅：[测试 Ace 命令](../testing/console_tests.md)

## 显示日志消息

你可以使用 CLI 记录器显示日志消息。以下是可用日志方法的列表。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    this.logger.debug('Something just happened')
    this.logger.info('This is an info message')
    this.logger.success('Account created')
    this.logger.warning('Running out of disk space')

    // 写入 stderr
    this.logger.error(new Error('Unable to write. Disk full'))
    this.logger.fatal(new Error('Unable to write. Disk full'))
  }
}
```

### 添加前缀和后缀

使用选项对象，你可以定义日志消息的 `prefix` 和 `suffix`。前缀和后缀以较低的不透明度显示。

```ts
this.logger.info('installing packages', {
  suffix: 'npm i --production'
})

this.logger.info('installing packages', {
  prefix: process.pid
})
```

### 加载动画

带有加载动画的日志消息会在消息后附加动画的三个点 (...)。你可以使用 `animation.update` 方法更新日志消息，并使用 `animation.stop` 方法停止动画。

```ts
const animation = this.logger.await('installing packages', {
  suffix: 'npm i'
})

animation.start()

// 更新消息
animation.update('unpacking packages', {
  suffix: undefined
})

// 停止动画
animation.stop()
```

### 记录器操作

记录器操作可以以一致的样式和颜色显示操作的状态。

你可以使用 `logger.action` 方法创建一个操作。该方法接受操作标题作为第一个参数。

```ts
const createFile = this.logger.action('creating config/auth.ts')

try {
  await performTasks()
  createFile.displayDuration().succeeded()  
} catch (error) {
  createFile.failed(error)
}
```

你可以将操作标记为 `succeeded`、`failed` 或 `skipped`。

```ts
action.succeeded()
action.skipped('Skip reason')
action.failed(new Error())
```

## 使用 ANSI 颜色格式化文本

Ace 使用 [kleur](https://www.npmjs.com/package/kleur) 使用 ANSI 颜色格式化文本。使用 `this.colors` 属性，你可以访问 kleur 的链式 API。

```ts
this.colors.red('[ERROR]')
this.colors.bgGreen().white(' CREATED ')
```

## 渲染表格

可以使用 `this.ui.table` 方法创建一个表格。该方法返回 `Table` 类的一个实例，你可以使用它来定义表头和行。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const table = this.ui.table()
    
    table
      .head([
        'Migration',
        'Duration',
        'Status',
      ])
      .row([
        '1590591892626_tenants.ts',
        '2ms',
        'DONE'
      ])
      .row([
        '1590595949171_entities.ts',
        '2ms',
        'DONE'
      ])
      .render()
  }
}
```

在渲染表格时，你可以对任何值应用颜色转换。例如：

```ts
table.row([
  '1590595949171_entities.ts',
  '2',
  this.colors.green('DONE')
])
```

### 右对齐列

你可以通过将列定义为对象并使用 hAlign 属性来右对齐列。确保也右对齐标题列。

```ts
table
  .head([
    'Migration',
    'Batch'
    {
      content: 'Status',
      hAlign: 'right'
    },
  ])

table.row([
  '1590595949171_entities.ts',
  '2',
  {
    content: this.colors.green('DONE'),
    hAlign: 'right'
  }
])
```

### 全宽渲染

默认情况下，表格以宽度 `auto` 渲染，仅占用每列内容所需的空间。

但是，你可以使用 `fullWidth` 方法以全宽（占用所有终端空间）渲染表格。在全宽模式下：

- 我们将根据内容的大小渲染所有列。
- 除了第一列，它占用所有可用空间。

```ts
table.fullWidth().render()
```

你可以通过调用 `table.fluidColumnIndex` 方法更改流式列（占用所有空间的列）的列索引。

```ts
table
  .fullWidth()
  .fluidColumnIndex(1)
```

## 打印贴纸

贴纸允许你在带边框的框内渲染内容。当你想要吸引用户注意重要信息时，它们很有用。

你可以使用 `this.ui.sticker` 方法创建贴纸的实例。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const sticker = this.ui.sticker()
    sticker
      .add('Started HTTP server')
      .add('')
      .add(`Local address:   ${this.colors.cyan('http://localhost:3333')}`)
      .add(`Network address: ${this.colors.cyan('http://192.168.1.2:3333')}`)
      .render()
  }
}
```

如果你想在一个框内显示一组说明，你可以使用 `this.ui.instructions` 方法。说明块中的每一行都必须使用 `add` 方法添加。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    this.ui
      .instructions()
      .add('Run "node ace migration:run" to execute migrations')
      .add('Run "node ace db:seed" to seed the database')
      .render()
  }
}
```
