# Introduction

Ace is a command line framework used by AdonisJS to create and run console commands. The entry point file for Ace is stored in the root of your project, and you can execute it as follows.

```sh
node ace
```

Since the `node` binary cannot run the TypeScript source code directly, we have to keep the ace file in pure JavaScript and use the `.js` extension.

Under the hood, the `ace.js` file registers TS Node as an [ESM module loader hook](https://nodejs.org/api/module.html#customization-hooks) to execute the TypeScript code and imports the `bin/console.ts` file.

## Help and list commands

You can view the list of available commands by running the ace entry point file without any arguments or using the `list` command.

```sh
node ace

# Same as above
node ace list
```

![](./ace_help_screen.jpeg)

You can view help for a single command by typing the command name with the `--help` flag.

```sh
node ace make:controller --help
```

:::note

The output of the help screen is formatted as per the [docopt](http://docopt.org/) standard.

:::


## Enabling/disabling colors

Ace detects the CLI environment in which it is running and disables the colorful output if the terminal does not support colors. However, you can manually enable or disable colors using the `--ansi` flag.

```sh
# Disable colors
node ace list --no-ansi

# Force enable colors
node ace list --ansi
```

## Creating command aliases

Command aliases provide a convenience layer to define aliases for commonly used commands. For example, if you often create singular resourceful controllers, you may create an alias for it inside the `adonisrc.ts` file.

```ts
{
  commandsAliases: {
    resource: 'make:controller --resource --singular'
  }
}
```

Once the alias is defined, you can use the alias to run the command.

```sh
node ace resource admin
```

### How alias expansion works?

- Every time you run a command, Ace will check for aliases inside the `commandsAliases` object. 
- If an alias exists, the first segment (before the space) will be used to look up the command.
- If a command exists, the rest of the alias value segments will be appended to the command name.

    For example, if you run the following command

    ```sh
    node ace resource admin --help
    ```
    
    It will be expanded to
    
    ```sh
    make:controller --resource --singular admin --help
    ```

## Passing Node options
Certain ace commands like `serve` and 

The ace commands are executed inside a child process, therefore the options passed to the `node` binary are not shared with the child process. 

In the following example, the `--inspect` flag is set for the `ace.js` file and not for the `serve` command running as a child process.

```sh
node --inspect ace serve
```

With `ace` commands, you have to pass the Node options after `node ace` in order for them to be shared with the child process.

```sh
node ace --inspect serve
```

## Running commands programmatically

You can use the `ace` service to execute commands programmatically. The ace service is available after the application has been booted.

The `ace.exec` method accepts the command name as the first parameter and an array of command line arguments as the second parameter. For example:

```ts
import ace from '@adonisjs/core/services/ace'

const command = await ace.exec('make:controller', [
  'user',
  '--resource',
])
    
console.log(command.exitCode)
console.log(command.result)
console.log(command.error)
```

You may use the `ace.hasCommand` method to check if a command exists before executing it.

```ts
import ace from '@adonisjs/core/services/ace'

/**
 * Boot method will load commands (if not already loaded)
 */
await ace.boot()

if (ace.hasCommand('make:controller')) {
  await ace.exec('make:controller', [
    'user',
    '--resource',
  ])
}
```
