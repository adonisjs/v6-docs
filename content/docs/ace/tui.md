# Terminal UI

Ace terminal UI is powered by the [@poppinss/cliui](https://github.com/poppinss/cliui) package. The package exports helpers to display logs, render tables, render animated tasks UI, and much more.

The terminal UI primitives are built with testing in mind. When writing tests, you may turn on the `raw` mode to disable colors and formatting and collect all logs in memory to write assertions against them.

See also: [Testing Ace commands](../../testing/console_tests)

## Displaying log messages

You may display log messages using the CLI logger. Following is the list of available log methods.

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    this.logger.debug('Something just happened')
    this.logger.info('This is an info message')
    this.logger.success('Account created')
    this.logger.warning('Running out of disk space')

    // Writes to stderr
    this.logger.error(new Error('Unable to write. Disk full'))
    this.logger.fatal(new Error('Unable to write. Disk full'))
  }
}
```

### Adding prefix and suffix

Using the options object, you may define the `prefix` and `suffix` for the log message. The prefix and suffix are displayed with lower opacity.

```ts
this.logger.info('installing packages', {
  suffix: 'npm i --production'
})

this.logger.info('installing packages', {
  prefix: process.pid
})
```

### Loading animation

A log message with loading animation appends animated three dots (...) to the message. You may update the log message using the `animation.update` method and stop the animation using the `animation.stop` method.

```ts
const animation = this.logger.await('installing packages', {
  suffix: 'npm i'
})

animation.start()

// Update the message
animation.update('unpacking packages', {
  suffix: undefined
})

// Stop animation
animation.stop()
```

### Logger actions

Logger actions can display the state of action with consistent styling and colors. 

You may create an action using the `logger.action` method. The method accepts the action title as the first parameter.

```ts
const createFile = this.logger.action('creating config/auth.ts')

try {
  await performTasks()
  createFile.displayDuration().succeeded()  
} catch (error) {
  createFile.failed(error)
}
```

You can mark an action as either `succeeded`, `failed`, or `skipped`.

```ts
action.succeeded()
action.skipped('Skip reason')
action.failed(new Error())
```

## Formatting text with ANSI colors

Ace uses [kleur](https://www.npmjs.com/package/kleur) for formatting text with ANSI colors. Using the `this.colors` property, you can access kleur's chained API.

```ts
this.colors.red('[ERROR]')
this.colors.bgGreen().white(' CREATED ')
```

## Rendering tables

A table can be created using the `this.ui.table` method. The method returns an instance of the `Table` class that you can use to define the table head and rows.

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

You may apply color transforms to any value when rendering the table. For example:

```ts
table.row([
  '1590595949171_entities.ts',
  '2',
  this.colors.green('DONE')
])
```

### Right-align columns

You may right-align the columns by defining them as objects and using the hAlign property. Make sure to also right-align the header column.

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

### Full-width rendering

By default, tables are rendered with width `auto`, taking only the space required by the contents of each column.

However, you may render tables at full-width (taking all the terminal space) using the `fullWidth` method. In full-width mode:

- We will render all columns as per the size of the content.
- Except for the first column, which takes all the available space.

```ts
table.fullWidth().render()
```

You may change the column index for the fluid column (the one that takes all the space) by calling the `table.fluidColumnIndex` method.

```ts
table
  .fullWidth()
  .fluidColumnIndex(1)
```

## Printing stickers

Stickers allow you to render content inside a box with a border. They are helpful when you want to draw the user's attention to an essential piece of information.

You can create an instance of a sticker using the `this.ui.sticker` method.

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

If you want to display a set of instructions inside a box, you can use the `this.ui.instructions` method. Each line in the instructions output will be prefixed with an arrow sign `>`.

## Rendering tasks

The tasks widget provides an excellent UI for sharing the progress of multiple time-taking tasks. The widget has the following two rendering modes:

- In `minimal` mode, the UI for the currently running task is expanded to show one log line at a time.
- In `verbose` mode, each log statement is rendered in its line. The verbose renderer must be used for debugging tasks.

You can create an instance of the tasks widget using the `this.ui.tasks` method. 

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const tasks = this.ui.tasks()
    
    // ... rest of the code to follow
  }
}
```

Individual tasks are added using the `tasks.add` method. The method accepts the task title as the first parameter and the implementation callback as the second parameter.

You must return the status of the task from the callback. All return values are considered success messages until you wrap them inside the `task.error` method or throw an exception inside the callback.

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const tasks = this.ui.tasks()

    // highlight-start
    await tasks
      .add('clone repo', async (task) => {
        return 'Completed'
      })
      .add('update package file', async (task) => {
        return task.error('Unable to update package file')
      })
      .add('install dependencies', async (task) => {
        return 'Installed'
      })
      .run()
    // highlight-end
  }
}
```

### Reporting task progress

Instead of writing the task progress messages to the console, it is recommended to call the `task.update` method.

The `update` method displays the latest log message using the `minimal` renderer and logs all messages using the `verbose` renderer.

```ts
const sleep = () => new Promise<void>((resolve) => setTimeout(resolve, 50))

tasks
  .add('clone repo', async (task) => {
    for (let i = 0; i <= 100; i = i + 2) {
      await sleep()
      task.update(`Downloaded ${i}%`)
    }

    return 'Completed'
  })
```

### Switching to the verbose renderer

You may switch to a verbose renderer when creating the tasks widget. You might consider allowing the command's user to pass a flag to turn on the `verbose` mode.

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
