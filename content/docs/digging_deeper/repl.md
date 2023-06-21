# REPL

REPL stands for read–eval–printloop - a way to quickly execute single-line instructions and print the output to the terminal.

Just like Node.js, AdonisJS also has its own application-aware REPL, giving you the access to your application code inside the REPL session.

The main differences between Node.js and AdonisJS REPL are:

- AdonisJS REPL has syntax highlighting and bracket matching out of the box.
- Support for Typescript and ESM modules out of the box.
- Tailored for AdonisJS applications, so you can access the application code without any extra setup. 
- Also includes some extra global methods to make your life easier.

## Starting the REPL

You can start the REPL by running the following command.

```sh
node ace repl
```

// TBD : video

## Importing modules

Since Node.js REPL isn't executed in a ESM context, you can't directly use the `import` statement. Instead, all modules should be imported with dynamic imports.

:::warning
Note that when using dynamic import with default exports, you need to use `.default` to access the exported value.
:::

:::caption{for="error"}
Do not use `import` statement inside the REPL.
:::


```ts
import MyController from '#controllers/my_controller.js'
import mailer from '@adonisjs/mail/services/main'
```

:::caption{for="success"}
Instead use dynamic imports.
:::

```ts
const { default: MyController } = await import('#controllers/my_controller.js')
const { default: mailer } = await import('@adonisjs/mail/services/main')
``` 

## Helper methods

Writing the import statements inside the REPL requires a little bit of extra typing and therefore we have added a bunch of shortcut methods to import the commonly required modules.

Let's test the encryption module again, but this time we will use the shortcut method to import the module.

// TBD: video

You can view the list of helper methods by typing the `.ls` command.

// TBD : image

Just like everything else, the REPL also has an extensible API and as you will install new packages you will see the list of helper methods growing.

For example: The Lucid ORM comes with the loadModels helper to recursively load models from the app/Models directory.

## Adding custom helpers

You can add your custom helpers by creating a preload file inside the start directory. Begin by creating a new file by running the following command.

:::note
Make sure to select the environment as repl by pressing the <SPACE> key and hit enter.
:::

```sh
node ace make:prldfile repl
```

Then you can add your custom helpers inside the `start/repl.ts` file using the `repl.addMethod` method.


```ts
// title: start/repl.ts
import repl from '@adonisjs/repl/services/main'

repl.addMethod(
  'sayHi',
  (instance) => {
    console.log(instance.colors.green('hi'))
  },
  { description: 'A test method that prints "hi"' }
)
```

Finally, start the REPL session and type `sayHi()` to execute the method. Currently, we are writing to the console, however, you can perform any action inside this function.

## History file

The REPL session keeps a history of all the executed commands inside the `{homedir()}.adonis_repl_history` file. You can use the up and down arrow keys to navigate in the history between sessions.

:::note
You can also save a specific session history by using the Node.js built-in `.save` command. And load it later using the `.load` command. See the [Node.js docs](https://nodejs.org/api/repl.html#commands-and-special-keys) for more info.
:::

## Multi-line input

You can use the `.editor` command to enter the multi-line input mode. The REPL will let you write multiple lines of code and execute them all at once.

```bash
> .editor
# Enters the multi-line input mode
> function sayHi() {
>  console.log('hi')
> }
> sayHi()
# Press CTRL + D to execute the code
> hi
```

