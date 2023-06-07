# Command-line tests

Command-line tests refers to testing custom Ace commands. Ace has first class support for testing with ability to capture logs in memory and mock prompts.

## Basic example

Let's create a new command named `greet` and write tests for it.

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

