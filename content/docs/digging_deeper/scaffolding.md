# Scaffolding

AdonisJS ships with scaffolding commands registered under the `make` namespace to speed up repetitive tasks of creating new files.

The scaffolding commands use opinionated rules for naming various classes and files. You might agree or disagree with our choices, but sticking to conventions will ensure consistency across your codebase.

The naming conventions are enforced using the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts). Feel free to explore the module source code for implementation details.

## make\:controller

Create a new HTTP controller class. You may use the `--resource` flag to generate a controller with resource methods.

- Form: `plural`
- Suffix: `controller`
- Class name example: `UsersController`
- File name example: `users_controller.ts`

```sh
node ace make:controller users

# Generate controller with resource methods
node ace make:controller users --resource

# Generate controller with API resource methods
node ace make:controller users --api

# Force name to be singular
node ace make:controller users --singular
```

Run the following command to eject controller stubs.

```sh
node ace eject make/controller
```

## make\:middleware

Create a new middleware class for HTTP requests. Make sure to register the middleware inside the [middleware stacks](../http/middleware#middleware-stacks)

- Form: `singular`
- Suffix: `middleware`
- Class name example: `BodyParserMiddleware`
- File name example: `body_parser_middleware.ts`

```sh
node ace make:middleware bodyparser
```

Run the following command to eject the middleware stub.

```sh
node ace eject make/middleware
```

## make\:event

Create a new event class. Event classes provide end-to-end type safety without defining explicit types.

- Form: `NA`
- Suffix: `NA`
- Class name example: `OrderShipped`
- File name example: `order_shipped.ts`
- Recommendation: You must name events in the past tense and not apply any suffix. For example, `OrderShipped`, `UserRegistered`, and `EmailVerified`.

```sh
node ace make:event orderShipped
```

Run the following command to eject the event stub.

```sh
node ace eject make/event
```

## make\:validator

Create a new VineJS validator file.

- Form: `singular`
- Suffix: `validator`
- File name example: `post_validator.ts`
- Recommendation: You must name the validator after the entity you want to validate. For example: `post_validator`, `user_validator`, or `invoice_validator`.

## make\:listener

Create a new listener class.

- Form: `NA`
- Suffix: `NA`
- Class name example: `SendShipmentNotification`
- File name example: `send_shipment_notification.ts`
- Recommendation: The event listeners must be named after the action they perform. For example, a listener that sends the shipment notification email should be called `SendShipmentNotification`.

```sh
node ace make:listener sendShipmentNotification
```

Run the following command to eject the listener stub.

```sh
node ace eject make/listener
```

## make\:service

Create a new service class. You may use services to encapsulate some logic. For example, A `CurrencyService` class to manage monetary values or an `InvoiceService` class to generate and send invoices. 

- Form: `singular`
- Suffix: `service`
- Class name example: `InvoiceService`
- File name example: `invoice_service.ts`

```sh
node ace make:service invoice
```

Run the following command to eject the service stub.

```sh
node ace eject make/service
```

## make\:exception

Create a custom exception class.

- Form: `NA`
- Suffix: `exception`
- Class name example: `CommandValidationException`
- File name example: `command_validation_exception.ts`

```sh
node ace make:exception commandValidation
```

Run the following command to eject the exception stub.

```sh
node ace eject make/exception
```

## make\:command

Create a new Ace command. 

- Form: `NA`
- Suffix: `NA`
- Class name example: `ListRoutes`
- File name example: `list_routes.ts`
- Recommendation: Commands must be named after the action they perform. For example, `ListRoutes`, `MakeController`, and `Build`.

```sh
node ace make:command listRoutes
```

Run the following command to eject the command stub.

```sh
node ace eject make/command
```

## make\:provider

Create a service provider. The provider will automatically be registered with the `adonisrc.ts` file.

- Form: `singular`
- Suffix: `provider`
- Class name example: `AppProvider`
- File name example: `app_provider.ts`

```sh
node ace make:provider app
```

Run the following command to eject the provider stub.

```sh
node ace eject make/provider
```

## make\:test

Create a new test file. You may specify the suite for the test using the `--suite` flag. The command will show a prompt for suite selection if you do not mention the suite explicitly while running the command.

- Form: NA
- Suffix: `.spec`
- File name example: `posts/list.spec.ts`, `posts/update.spec.ts`

```sh
node ace make:test --suite=unit
```

Run the following command to eject the test stub.

```sh
node ace eject make/test/main.stub
```

## Stubs
Stubs are the template files AdonisJS uses to generate a resource. We allow you to copy stubs from the package source code to your application and modify them to customize their contents or the output location.

You may copy templates to your application using the `eject` command. The templates will be saved inside your project root's `stubs` directory. In the following example, we will copy the `make/controller/main.stub` file from the `@adonisjs/core` package.

```sh
node ace eject make/controller/main.stub
```

:::note

Stubs use the [tempura template engine](https://github.com/lukeed/tempura) for evaluating JavaScript expressions and defining inline variables.

For syntax highlighting to work, you may set the language for `.stub` files to `handlebars`.

:::

If you open the stub file, it will have the following contents.

```hbs
{{#var controllerName = generators.controllerName(entity.name)}}
{{#var controllerFileName = generators.controllerFileName(entity.name)}}
---
to: {{ app.httpControllersPath(entity.path, controllerFileName) }}
---
// import { HttpContext } from '@adonisjs/core/http'

export default class {{ controllerName }} {
}
```

- In the first two lines, we use the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts) to generate the controller class name and the controller file name.
- From lines 3-5, we [define the destination path](#customizing-the-destination-path) for the controller file as YAML front matter.
- After the YAML front matter, we define the controller's contents.

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

If you want to create the controller at a different location, say `app/http/controllers`, you may specify the destination path within the template using the YAML front matter. 

YAML front-matter is a YAML block in the stub file surrounded by three dashes `---`. 

```hbs
---
to: {{
  app.makePath('app/http/controllers', controllerFileName)
}}
---
```

### Available variables

You may access the following variables inside a stub.

| Variable | Description |
|------------|------------|
| `app` | Reference to an instance of the [application class](../fundamentals/application.md). |
| `generators` | Reference to the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts). |
| `randomString` | Reference to the [randomString](./helpers.md#random) helper function. |
| `string` | A function to create a [string builder](./helpers.md#string-builder) instance. You can use the string builder to apply transformations on a string. | 
| `flags` | The command-line flags applied to the ace command. 
