---
summary: Learn about defining and processing command arguments in Ace commands.
---

# Command arguments

Arguments refer to the positional arguments mentioned after the command name. Since arguments are positional, passing them in the correct order is necessary.

You must define command arguments as class properties and decorate them using the `args` decorator. The arguments will be accepted in the same order as they are defined in the class.

In the following example, we use the `@args.string` decorator to define an argument that accepts a string value.

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a user by name'
  
  @args.string()
  declare name: string

  async run() {
    console.log(this.name)
  }
}
```

To accept multiple values under the same argument name, you may use the `@agrs.spread` decorator. Do note, the spread argument must be the last.

```ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a user by name'
  
  // highlight-start
  @args.spread()
  declare names: string[]
  // highlight-start

  async run() {
    console.log(this.names)
  }
}
```

## Argument name and description

The argument name is displayed on the help screen. By default, the argument name is a dashed case representation of the class property name. However, you can define a custom value as well.

```ts
@args.string({
  argumentName: 'user-name'
})
declare name: string
``` 

The argument description is shown on the help screen and can be set using the `description` option. 

```ts
@args.string({
  argumentName: 'user-name',
  description: 'Name of the user'
})
declare name: string
```

## Optional arguments with a default value

By default, all arguments are required. However, you can make them optional by setting the `required` option to `false`. The optional arguments must be at the end.

```ts
@args.string({
  description: 'Name of the user',
  required: false,
})
declare name?: string
```

You may set the default value of an optional argument using the `default` property.

```ts
@args.string({
  description: 'Name of the user',
  required: false,
  default: 'guest'
})
declare name: string
```

## Processing argument value

Using the `parse` method, you can process the argument value before it is defined as the class property.

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

## Accessing all arguments

You can access all the arguments mentioned while running the command using the `this.parsed.args` property. 

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
