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
