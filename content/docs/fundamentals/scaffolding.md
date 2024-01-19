# Scaffolding and Codemods

Scaffolding refers to the process of generating source files from static templates (aka stubs), and codemods refer to updating the TypeScript source code by parsing the AST.

AdonisJS uses both to speed up the repetitive tasks of creating new files and configuring packages. In this guide, we will go through the building blocks of Scaffolding and cover the codemods API you can use within Ace commands.

## Building blocks

### Stubs
Stubs refers to the templates, that are used to create source files on a given action. For example, The `make:controller` command uses the [controller stub](https://github.com/adonisjs/core/blob/main/stubs/make/controller/main.stub) to create a controller file inside the host project.

### Generators
Generators enforce a naming convention and generate file, class, or method names based on the pre-defined conventions.

For example, the controller stubs use the [controllerName](https://github.com/adonisjs/application/blob/main/src/generators.ts#L122) and [controllerFileName](https://github.com/adonisjs/application/blob/main/src/generators.ts#L139) generators to create a controller. 

Since generators are defined as an object, you can override the existing methods to tweak the conventions. We learn more about that later in this guide.

### Codemods
The codemods API comes from the [@adonisjs/assembler](https://github.com/adonisjs/assembler/blob/main/src/code_transformer/main.ts) package, and it uses [ts-morph](https://github.com/dsherret/ts-morph) under the hood.

Since `@adonisjs/assembler` is a development dependency, `ts-morph` does not bloat your project dependencies in production. Also, it means, the codemods APIs are not available in production.

The codemods API exposed by AdonisJS are very specific to accomplish high-level tasks like **add a provider to the `.adonisrc.ts` file**, or **register a middleware inside the `start/kernel.ts`** file. Also, these APIs rely on the default naming conventions, so if you make drastic changes to your project, you will not be able to run codemods.

### Configure command
The configure command is used to configure an AdonisJS package. Under the hood, this command imports the main entry point file and executes the `configure` method exported by the mentioned package.

The package's `configure` method receives an instance of the [Configure command](https://github.com/adonisjs/core/blob/develop/commands/configure.ts), and therefore, it can access the stubs and codemods API from the command instance directly.

## Using stubs
Most of the time, you will use stubs within an Ace command or inside the `configure` method of a package you have created. In both cases, you can initialize the codemods module and use the `makeUsingStub` method to create a source file from a stub template.

```ts
// title: Inside a command
import { BaseCommand } from '@adonisjs/core/ace'

const STUBS_ROOT = new URL('./stubs', import.meta.url)

export default class MakeApiResource extends BaseCommand {
  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(STUBS_ROOT, 'api_resource.stub', {})
  }
}
```

The `makeUsingStub` method accepts the following arguments:

- The URL to the root of the directory where stubs are stored.
- Relative path from the `STUBS_ROOT` directory to the stub file (including extension).
- And the data object to share with the stub.

### Stubs templating
We use [Tempura](https://github.com/lukeed/tempura) template engine to process the stubs with runtime data. Tempura is a super lightweight handlebars-style template engine for JavaScript.

:::tip

Since Tempura's syntax is compatible with handlebars, you can set your code editors to use handlebar syntax highlighting with `.stub` files.

:::

In the following example, we create a stub that outputs a JavaScript class. It uses the double curly braces to evaluate runtime values.

```handlebars
export default class {{ modelName }}Resource {
  serialize({{ modelReference }}: {{ modelName }}) {
    return {{ modelReference }}.toJSON()
  }
}
```

### Using generators

If you execute the above stub right now, it will fail because we have not provided the `modelName` and `modelReference` data properties.

We recommend computing these properties within the stub using inline variables, allowing the host application to [eject the stub](#ejecting-stubs) and modify its contents or variables.

```handlebars
// insert-start
{{#var entity = generators.createEntity('user')}}
{{#var modelName = generators.modelName(entity.name)}}
{{#var modelReference = string.toCamelCase(modelName)}}
// insert-end

export default class {{ modelName }}Resource {
  serialize({{ modelReference }}: {{ modelName }}) {
    return {{ modelReference }}.toJSON()
  }
}
```

### Output destination
Finally, we have to specify the destination path of the file that will be created using the stub. Once again, we specify the destination path within the stub file, as it allows the host application to [eject the stub](#ejecting-stubs) and customize its output destination.

The destination path is defined using the `exports` function. The function accepts an object and exports it as the output state of the stub. Later, the codemods API uses this object to create the file at the mentioned location.

```handlebars
{{#var entity = generators.createEntity('user')}}
{{#var modelName = generators.modelName(entity.name)}}
{{#var modelReference = string.toCamelCase(modelName)}}
// insert-start
{{#var resourceFileName = string(modelName).snakeCase().suffix('_resource').ext('.ts').toString()}}
{{{
  exports({
    to: app.makePath('app/api_resources', entity.path, resourceFileName)
  })
}}}
// insert-end
export default class {{ modelName }}Resource {
  serialize({{ modelReference }}: {{ modelName }}) {
    return {{ modelReference }}.toJSON()
  }
}
```

### Accepting entity name via command
Right now, we have hardcoded the entity name as `user` within the stub. However, you should accept it as a command argument and share it with the stub as the template state.

```ts
import { BaseCommand, args } from '@adonisjs/core/ace'

export default class MakeApiResource extends BaseCommand {
  // insert-start
  @args.string({
    description: 'The name of the resource'
  })
  declare name: string
  // insert-end

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(STUBS_ROOT, 'api_resource.stub', {
      // insert-start
      name: this.name,
      // insert-end
    })
  }
}
```

```handlebars
// delete-start
{{#var entity = generators.createEntity('user')}}
// delete-end
// insert-start
{{#var entity = generators.createEntity(name)}}
// insert-end
{{#var modelName = generators.modelName(entity.name)}}
{{#var modelReference = string.toCamelCase(modelName)}}
{{#var resourceFileName = string(modelName).snakeCase().suffix('_resource').ext('.ts').toString()}}
{{{
  exports({
    to: app.makePath('app/api_resources', entity.path, resourceFileName)
  })
}}}
export default class {{ modelName }}Resource {
  serialize({{ modelReference }}: {{ modelName }}) {
    return {{ modelReference }}.toJSON()
  }
}
```

### Global variables
The following global variables are always shared with a stub.

| Variable       | Description                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app`          | Reference to an instance of the [application class](../fundamentals/application.md).                                                                |
| `generators`   | Reference to the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts).                                          |
| `randomString` | Reference to the [randomString](../reference/helpers.md#random) helper function.                                                                               |
| `string`       | A function to create a [string builder](../reference/helpers.md#string-builder) instance. You can use the string builder to apply transformations on a string. |
| `flags`        | The command-line flags defined at the time of running the ace command.                                                                              |


## Ejecting stubs

## Stubs execution flow

## Codemods API
