---
summary: Prompts are terminal widgets for user input, using the @poppinss/prompts package. They support various types like input, password, and select, and are designed for easy testing integration.
---


# Prompts

Prompts are interactive terminal widgets you can use to accept user input. Ace prompts are powered by the [@poppinss/prompts](https://github.com/poppinss/prompts) package, which supports the following prompt types.

- input
- list
- password
- confirm
- toggle
- select
- multi-select
- autocomplete

Ace prompts are built with testing in mind. When writing tests, you may trap prompts and respond to them programmatically.

See also: [Testing ace commands](../../testing/console_tests)

## Displaying a prompt

You may display prompts using the `this.prompt` property available on all Ace commands.

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const modelName = await this.prompt.ask('Enter the model name')
    
    console.log(modelName)
  }
}
```

## Prompt options

Following is the list of options accepted by prompts. You may reference this table as the single source of truth.


<table>
<tr>
<td width="110px">Option</td>
<td width="120px">Accepted by</td>
<td>Description</td>
</tr>
<tr>
<td>

`default` (String) 

</td>

<td>

All prompts

</td>

<td>

The default value to use when no value is entered. In the case of `select`, `multiselect`, and `autocomplete` prompts, the value must be the choices array index.

</td>
</tr>

<tr>
<td>

`name` (String)

</td>

<td>

All prompts

</td>

<td>

The unique name for the prompt

</td>
</tr>

<tr>
<td>

`hint` (String)

</td>

<td>

All prompts

</td>

<td>

The hint text to display next to the prompt

</td>
</tr>
<tr>
<td>

`result` (Function)

</td>

<td>All prompts</td>
<td>

Transform the prompt return value. The input value of the `result` method depends on the prompt. For example, the `multiselect` prompt value will be an array of selected choices.

```ts
{
  result(value) {
    return value.toUpperCase()
  }
}
```

</td>
</tr>

<tr>
<td>

`format` (Function)

</td>

<td>All prompts</td>

<td>

Live format the input value as the user types. The formatting is only applied to the CLI output, not the return value.

```ts
{
  format(value) {
    return value.toUpperCase()
  }
}
```

</td>
</tr>

<tr>
<td>

`validate` (Function)

</td>

<td>All prompts</td>

<td>

Validate the user input. Returning `true` from the method will pass the validation. Returning `false` or an error message string will be considered a failure.

```ts
{
  format(value) {
    return value.length > 6
    ? true
    : 'Model name must be 6 characters long'
  }
}
```

</tr>

<tr>
<td>

`limit` (Number)

</td>

<td>

`autocomplete`

</td>

<td>

Limit the number of options to display. You will have to scroll to see the rest of the options.

</td>
</tr>
</table>


## Text input

You may render the prompt to accept text input using the `prompt.ask` method. The method accepts the prompt message as the first parameter and the [options object](#prompt-options) as the second parameter.

```ts
await this.prompt.ask('Enter the model name')
```

```ts
// Validate input
await this.prompt.ask('Enter the model name', {
  validate(value) {
    return value.length > 0
  }
})
```

```ts
// Default value
await this.prompt.ask('Enter the model name', {
  default: 'User'
})
```

## Masked input

As the name suggests, the masked input prompt masks the user input in the terminal. You may display the masked prompt using the `prompt.secure` method.

The method accepts the prompt message as the first parameter and the [options object](#prompt-options) as the second parameter.

```ts
await this.prompt.secure('Enter account password')
```

```ts
await this.prompt.secure('Enter account password', {
  validate(value) {
    return value.length < 6
      ? 'Password must be 6 characters long'
      : true
  }
})
```

## List of choices

You may display a list of choices for a single selection using the `prompt.choice` method. The method accepts the following parameters.

1. Prompt message.
2. An array of choices.
3. Optional [options object](#prompt-options).

```ts
await this.prompt.choice('Select package manager', [
  'npm',
  'yarn',
  'pnpm'
])
```

To mention a different display value, you can define options as objects. The `name` property is returned as the prompt result, and the `message` property is displayed in the terminal.

```ts
await this.prompt.choice('Select database driver', [
  {
    name: 'sqlite',
    message: 'SQLite'
  },
  {
    name: 'mysql',
    message: 'MySQL'
  },
  {
    name: 'pg',
    message: 'PostgreSQL'
  }
])
```

## Multi-select choices

You may use the `prompt.multiple` method to allow multiple selections in the choices list. The accepted parameters are the same as the `choice` prompt.

```ts
await this.prompt.multiple('Select database drivers', [
  {
    name: 'sqlite',
    message: 'SQLite'
  },
  {
    name: 'mysql',
    message: 'MySQL'
  },
  {
    name: 'pg',
    message: 'PostgreSQL'
  }
])
```

## Confirm action

You can display a confirmation prompt with `Yes/No` options using the `prompt.confirm` method. The method accepts the prompt message as the first parameter and the [options object](#prompt-options) as the second parameter.

The `confirm` prompt returns a boolean value.

```ts
const deleteFiles = await this.prompt.confirm(
  'Want to delete all files?'
)

if (deleteFiles) {
}
```

To customize the `Yes/No` options display value, you may use the `prompt.toggle` method. 

```ts
const deleteFiles = await this.prompt.toggle(
  'Want to delete all files?',
  ['Yup', 'Nope']
)

if (deleteFiles) {
}
```

## Autocomplete

The `autocomplete` prompt is a combination of the select and the multi-select prompt, but with the ability to fuzzy search the choices.

```ts
const selectedCity = await this.prompt.autocomplete(
  'Select your city',
  await getCitiesList()
)
```
