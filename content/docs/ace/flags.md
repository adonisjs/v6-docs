---
summary: Learn about defining flags for your Ace commands
---

# Command flags

Flags are named parameters mentioned with either two hyphens (`--`) or a single hyphen (`-`) (known as the flag alias). The flags can be mentioned in any order.

You must define flags as class properties and decorate them using the `@flags` decorator. In the following example, we define `resource` and `singular` flags, and both represent a boolean value.

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeControllerCommand extends BaseCommands {
  @flags.boolean()
  declare resource: boolean

  @flags.boolean()
  declare singular: boolean
}
```

## Flag types

Ace allows defining flags for one of the following types.

### Boolean flag

A boolean flag is defined using the `@flags.boolean` decorator. Mentioning the flag will set its value to `true`. Otherwise, the flag value is `undefined`.

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

The last example shows that the boolean flags can be negated with the `--no-` prefix. 

By default, the negated option is not shown in the help output. However, you may enable it using the `showNegatedVariantInHelp` option.

```ts
export default class MakeControllerCommand extends BaseCommands {
  @flags.boolean({
    showNegatedVariantInHelp: true,
  })
  declare resource: boolean
}
```

### String flag

A string flag accepts a value after the flag name. You may define a string flag using the `@flags.string` method.

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

If the flag value has spaces or special characters, it must be wrapped inside the quotes `""`.

```sh
make:controller --model blog user
# this.model = 'blog'

make:controller --model "blog user"
# this.model = 'blog user'
```

An error is displayed if the flag is mentioned but no value is provided (even when the flag is optional).

```sh
make:controller
# Works! The optional flag is not mentioned

make:controller --model
# Error! Missing value
```

### Number flag

The parsing of a number flag is similar to the string flag. However, the value is validated to ensure it is a valid number.

You can create a number flag using the `@flags.number` decorator.

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeUserCommand extends BaseCommands {
  @flags.number()
  declare score: number
}
```

### Array flag

The array flag allows the usage of the flag multiple times when running a command. You can define an array flag using the `@flags.array` method.

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

## Flag name and description

By default, the flag name is a dashed case representation of the class property name. However, you can define a custom name via the `flagName` option.

```ts
@flags.boolean({
  flagName: 'server'
})
declare startServer: boolean
```

The flag description is displayed on the help screen. You can define it using the `description` option.

```ts
@flags.boolean({
  flagName: 'server',
  description: 'Starts the application server'
})
declare startServer: boolean
```

## Flag aliases

Aliases the shorthand names for a flag mentioned using a single hyphen (`-`). An alias must be a single character.

```ts
@flags.boolean({
  aliases: ['r']
})
declare resource: boolean

@flags.boolean({
  aliases: ['s']
})
declare singular: boolean
```

Flag aliases can be combined when running the command.

```ts
make:controller -rs

# Same as
make:controller --resource --singular
```

## Default value

You can define the default value for a flag using the `default` option. The default value is used when the flag is not mentioned or mentioned without a value.

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


## Processing flag value

Using the `parse` method, you can process the flag value before it is defined as the class property.

```ts
@flags.string({
  parse (value) {
    return value ? connections[value] : value
  }
})
declare connection: string
```

## Accessing all flags

You can access all flags mentioned while running the command using the `this.parsed.flags` property. The flags property is an object of key-value pair.

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeControllerCommand extends BaseCommands {
  @flags.boolean()
  declare resource: boolean

  @flags.boolean()
  declare singular: boolean
  
  async run() {
    console.log(this.parsed.flags)
    
    /**
     * Names of flags mentioned but not
     * accepted by the command
     */
    console.log(this.parsed.unknownFlags)
  }
}
```
