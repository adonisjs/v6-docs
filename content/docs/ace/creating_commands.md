---
summary: Learn how to create custom Ace commands in AdonisJS
---

# Creating commands

Alongside using Ace commands, you may also create custom commands as part of your application codebase. The commands are stored inside the `commands` directory (at the root level). You may create a command by running the following command.

See also: [Make command](../references/commands.md#makecommand)

```sh
node ace make:command greet
```

The above command will create a `greet.ts` file inside the `commands` directory. Ace commands are represented by a class and must implement the `run` method to execute the command instructions.

## Command metadata

The command metadata consists of the **command name**, **description**, **help text**, and the **options** to configure the command behavior.

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

The `commandName` property is used to define the command name. A command name should not contain spaces. Also, it is recommended to avoid using unfamiliar special characters like `*`, `&`, or slashes in the command name.

The command names can be under a namespace. For example, to define a command under the `make` namespace, you may prefix it with `make:`.

</dd>

<dt>
  description
</dt>

<dd>

The command description is shown inside the commands list and on the command help screen. You must keep the description short and use the **help text** for longer descriptions.

</dd>

<dt>
  help
</dt>

<dd>

The help text is used to write a longer description or show usage examples.

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

> The `{{ binaryName }}` variable substitution is a reference to the binary used to execute ace commands.

</dd>

<dt>
  aliases
</dt>

<dd>

You may define one or more aliases for the command name using the `aliases` property.

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

By default, AdonisJS does not boot the application when running an Ace command. This ensures that the commands are quick to run and do not go through the application boot phase to perform simple tasks.

However, if your command relies on the application state, you can tell Ace to start the app before executing the command.

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

By default, Ace prints an error if you pass an unknown flag to the command. However, you can disable strict flags parsing at the command level using the `options.allowUnknownFlags` property.

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

AdonisJS implicitly terminates the app after executing the command's `run` command. However, if you want to start a long-running process in a command, you must tell Ace not to kill the process.

See also: [Terminating app](#terminating-application) and [cleaning up before the app terminates](#cleaning-up-before-the-app-terminates) sections.

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

## Command lifecycle methods

You may define the following lifecycle methods on a command class, and Ace will execute them in a pre-defined order.

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
    <tr>
      <th width="120px">Method</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <code>prepare</code>
      </td>
      <td>This is the first method Ace executes on a command. This method can set up the state or data needed to run the command.</td>
    </tr>
    <tr>
      <td>
        <code>interact</code>
      </td>
      <td>The interact method is executed after the <code>prepare</code> method. It can be used to display prompts to the user. </td>
    </tr>
    <tr>
      <td>
        <code>run</code>
      </td>
      <td>The command main logic goes inside the <code>run</code> method. This method is called after the <code>interact</code> method. </td>
    </tr>
    <tr>
      <td>
        <code>completed</code>
      </td>
      <td>The completed method is called after running all other lifecycle methods. This method can be used to perform cleanup or handle/display thrown raised by other methods.</td>
    </tr>
  </tbody>
</table>

## Dependency injection

Ace commands are constructed and executed using the [IoC container](../concepts/dependency_injection.md). Therefore, you can type-hint dependencies on command lifecycle methods and use the `@inject` decorator to resolve them.

For demonstration, let's inject the `UserService` class in all the lifecycle methods.

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

## Handling errors and exit code

Exceptions raised by commands are displayed using the CLI logger, and the command `exitCode` is set to `1` (a non-zero error code means the command failed).

However, you may also capture errors by wrapping your code inside a `try/catch` block or using the `completed` lifecycle method to handle errors. In either situation, remember to update the command `exitCode` and `error` properties.

### Handling errors with try/catch

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

### Handling errors inside the completed method

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
       * Notify Ace that error has been handled
       */
      return true
    }
  }
}
```

## Terminating application

By default, Ace will terminate the application after executing the command. However, if you have enabled the `staysAlive` option, you will have to explicitly terminate the application using the `this.terminate` method.

Let's assume we make a redis connection to monitor the server memory. We listen for the `error` event on the redis connection and terminate the app when the connection fails.

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

## Cleaning up before the app terminates

Multiple events can trigger an application to terminate, including the [`SIGTERM` signal](https://www.howtogeek.com/devops/linux-signals-hacks-definition-and-more/). Therefore, you must listen for the `terminating` hook in your commands to perform the cleanup.

You can listen for the terminating hook inside the `prepare` lifecycle method.

```ts
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class GreetCommand extends BaseCommand {
  static options: CommandOptions = {
    staysAlive: true
  }
  
  prepare() {
    this.app.terminating(() => {
      // perform the cleanup
    })
  }
  
  async run() {
  }
}
```
