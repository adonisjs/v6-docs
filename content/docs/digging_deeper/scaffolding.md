# Scaffolding

AdonisJS ships with scaffolding commands registered under the `make` namespace to speed up repetitive tasks of creating new files.

The scaffolding commands use opinionated rules for naming various classes and files. You might agree or disagree with our choices, but sticking to conventions will ensure consistency across your codebase.

The naming conventions are enforced using the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts). Feel free to explore the module source code for implementation details.

## Stubs

Stubs are the template files AdonisJS uses to generate a resource. We allow you to copy stubs from the package source code to your application and modify them to customize their contents or the output location.

You may copy templates to your application using the `eject` command. The templates will be saved inside your project root's `stubs` directory. In the following example, we will copy the `make/controller/main.stub` file from the `@adonisjs/core` package.

```sh
node ace eject make/controller/main.stub
```

:::note

Stubs use the [tempura template engine](https://github.com/lukeed/tempura) to evaluate JavaScript expressions and define inline variables.

For syntax highlighting to work, you may set the language for `.stub` files to `handlebars`.

:::

If you open the stub file, it will have the following contents.

```hbs
{{#var controllerName = generators.controllerName(entity.name)}}
{{#var controllerFileName = generators.controllerFileName(entity.name)}}
{{{
  exports({
    to: app.httpControllersPath(entity.path, controllerFileName)
  })
}}}
// import { HttpContext } from '@adonisjs/core/http'

export default class {{ controllerName }} {
}
```

- In the first two lines, we use the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts) to generate the controller class name and the controller file name.
- From lines 3-5, we [define the destination path](#customizing-the-destination-path) for the controller file using the `exports` function.
- Finally, we define the contents for the scaffolded controller.

Feel free to modify the stub; the changes will be picked when you run the `make:controller` command.

### Ejecting directories

You may eject an entire directory of stubs using the `eject` command. Pass the path to the directory, and the command will copy the entire directory.

```sh
# Publish all the make stubs
node ace eject make

# Publish all the make:controller stubs
node ace eject make/controller
```

### Ejecting stubs from other packages

By default, the `eject` command copies templates from the `@adonisjs/core` package. However, you copy stubs from other packages using the `--pkg` flag.

```sh
node ace eject make/migration/main.stub --pkg=@adonisjs/lucid
```

### Customizing the destination path

When you run the `make:controller` command, the controller is placed inside the `app/controllers` directory.

If you want to create the controller at a different location, say `app/http/controllers`, you may specify the destination path using the `exports` function. For example:

```hbs
{{{
  exports({
    to: app.makePath('app/http/controllers', controllerFileName)
  })
}}}
```

### Available variables

You may access the following variables inside a stub.

| Variable       | Description                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app`          | Reference to an instance of the [application class](../fundamentals/application.md).                                                                |
| `generators`   | Reference to the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts).                                          |
| `randomString` | Reference to the [randomString](./helpers.md#random) helper function.                                                                               |
| `string`       | A function to create a [string builder](./helpers.md#string-builder) instance. You can use the string builder to apply transformations on a string. |
| `flags`        | The command-line flags defined at the time of running the ace command.                                                                              |
