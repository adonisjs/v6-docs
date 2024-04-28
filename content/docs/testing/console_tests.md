<<<<<<< HEAD
# Console tests
=======
# Console Tests
>>>>>>> a7aa500 (docs: first draft of new structure)

Command-line tests refer to testing custom Ace commands that are part of your application or the package codebase.

In this guide, we will learn how to write tests for a command, mock the logger output, and trap CLI prompts.

## Basic example

Let's start by creating a new command named `greet`.

```sh
node ace make:command greet
```

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class Greet extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a username by name'

  static options: CommandOptions = {}

  async run() {
    this.logger.info('Hello world from "Greet"')
  }
}
```

Let's create a **unit** test inside the `tests/unit` directory. Feel free to [define the unit test suite](introduction.md#suites) if it is not already defined.

```sh
node ace make:test commands/greet --suite=unit

# DONE:    create tests/unit/commands/greet.spec.ts
```

Let's open the newly created file and write the following test. We will use the `ace` service to create an instance of the `Greet` command and assert that it exits successfully.

```ts
import { test } from '@japa/runner'
import Greet from '#commands/greet'
import ace from '@adonisjs/core/services/ace'

test.group('Commands greet', () => {
  test('should greet the user and finish with exit code 1', async () => {
    /**
     * Create an instance of the Greet command class
     */
    const command = await ace.create(Greet, [])

    /**
     * Execute command
     */
    await command.exec()

    /**
     * Assert command exited with status code 0
     */
    command.assertSucceeded()
  })
})
```

Let's run the test using the following ace command.

```sh
node ace test --files=commands/greet
```

## Testing logger output

The `Greet` command currently writes the log message to the terminal. To capture this message and write an assertion for it, we will have to switch the UI library of ace into `raw` mode.

In `raw` mode, the ace will not write any logs to the terminal. Instead, keep them within memory for writing assertions.

We will use the Japa `each.setup` hook to switch into and out of the `raw` mode.

```ts
test.group('Commands greet', (group) => {
  // highlight-start
  group.each.setup(() => {
    ace.ui.switchMode('raw')
    return () => ace.ui.switchMode('normal')
  })
  // highlight-end
  
  // test goes here
})
```

Once the hook has been defined, you can update your test as follows.

```ts
test('should greet the user and finish with exit code 1', async () => {
  /**
   * Create an instance of the Greet command class
   */
  const command = await ace.create(Greet, [])

  /**
   * Execute command
   */
  await command.exec()

  /**
   * Assert command exited with status code 0
   */
  command.assertSucceeded()

  // highlight-start
  /**
   * Assert the command printed the following log message
   */
  command.assertLog('[ blue(info) ] Hello world from "Greet"')
  // highlight-end
})
```

## Testing tables output

Similar to testing the log messages, you can write assertions for the table output by switching the UI library into `raw` mode.

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

Given the above table, you can write an assertion for it as follows.

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

## Trapping prompts

Since [prompts](../ace/prompts.md) blocks the terminal waiting for manual input, you must trap and respond to them programmatically when writing tests.

Prompts are trapped using the `prompt.trap` method. The method accepts the prompt title (case sensitive) and offers a chainable API for configuring additional behavior.

The traps are removed automatically after the prompt gets triggered. An error will be thrown if the test finishes without triggering the prompt with a trap.

In the following example, we place a trap on a prompt titled `"What is your name?"` and answer it using the `replyWith` method.

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

### Choosing options

You can choose options with a select or a multi-select prompt using the `chooseOption` and `chooseOptions` methods.

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

### Accepting or rejecting confirmation prompts

You can accept or reject prompts displayed using the `toggle` and the `confirm` methods.

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

### Asserting against validations

To test the validation behavior of a prompt, you can use the `assertPasses` and `assertFails` methods. These methods accept the value of the prompt and test it against the [prompt's validate](../ace/prompts.md#prompt-options) method.

```ts
command.prompt
  .trap('What is your name?')
  // assert the prompt fails when an empty value is provided
  .assertFails('', 'Please enter your name')
  
command.prompt
  .trap('What is your name?')
  .assertPasses('Virk')
```

Following is an example of using assertions and replying to a prompt together.

```ts
command.prompt
  .trap('What is your name?')
  .assertFails('', 'Please enter your name')
  .assertPasses('Virk')
  .replyWith('Romain')
```

## Available assertions

Following is the list of assertion methods available on a command instance.

### assertSucceeded

Assert the command exited with `exitCode=0`.

```ts
await command.exec()
command.assertSucceeded()
```

### assertFailed

Assert the command exited with non-zero `exitCode`.

```ts
await command.exec()
command.assertSucceeded()
```

### assertExitCode

Assert the command exited with a specific `exitCode`.

```ts
await command.exec()
command.assertExitCode(2)
```

### assertNotExitCode

Assert the command exited with any `exitCode`, but not the given exit code.

```ts
await command.exec()
command.assertNotExitCode(0)
```

### assertLog

Assert the command writes a log message using the `this.logger` property. You can optionally assert the output stream as `stdout` or `stderr`.

```ts
await command.exec()

command.assertLog('Hello world from "Greet"')
command.assertLog('Hello world from "Greet"', 'stdout')
```

### assertLogMatches

Assert the command writes a log message that matches the given regular expression.

```ts
await command.exec()

command.assertLogMatches(/Hello world/)
```

### assertTableRows

Assert the command prints a table to the `stdout`. You can provide the table rows as an array of columns. The columns are represented as an array of cells.

```ts
await command.exec()

command.assertTableRows([
  ['Harminder Virk', 'virk@adonisjs.com'],
  ['Romain Lanz', 'romain@adonisjs.com'],
  ['Julien-R44', 'julien@adonisjs.com'],
])
```
