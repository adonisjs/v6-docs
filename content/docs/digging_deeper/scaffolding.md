# Scaffolding

AdonisJS ships with scaffolding commands registered under the `make` namespace to speed up repetitive tasks of creating new files.

The scaffolding commands use opinionated rules for naming various classes and files. You might agree or disagree with our choices, but sticking to conventions will ensure consistency across your codebase.

The naming conventions are enforced using the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts). Feel free to explore the module source code for implementation details.

## make\:controller

Create a new HTTP controller class. By default, the controllers are created inside the `app/controllers` directory.

- Form: `plural`
- Suffix: `controller`
- Class name example: `UsersController`
- File name example: `users_controller.ts`

```sh
node ace make:controller users

# Force name to be singular
node ace make:controller users --singular
```

You may use the `--resource`, or the `--api` flag to generate a controller with methods to perform CRUD operations on a resource.

The api flag is similar to the resource flag, however it does not create methods responsible for rendering forms.

```sh
# Generate controller with resource methods
node ace make:controller users --resource

# Generate controller with API resource methods
node ace make:controller users --api
```

Finally, you may generate controllers with custom actions as follows.

```sh
# Generate controller with custom methods
node ace make:controller users index show store
```

Run the following command to eject controller stubs.

```sh
node ace eject make/controller
```

## make\:middleware

Create a new middleware class for HTTP requests. By default, middleware are stored inside the `app/middleware` directory.

Post creation, the `make:middleware` command will prompt you register the middleware inside a [middleware stack](../http/middleware.md#middleware-stacks).

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

Create a new event class. By default, events are stored inside the `app/events` directory and each class represents a single event.

- Form: `NA`
- Suffix: `NA`
- Class name example: `OrderShipped`
- File name example: `order_shipped.ts`
- Recommendation: You must name your events around the lifecycle of an action. For example: `MailSending`, `MailSent`, `RequestCompleted` and so on.

```sh
node ace make:event orderShipped
```

Run the following command to eject the event stub.

```sh
node ace eject make/event
```

## make\:validator
Create a new VineJS validator file. By default the validators are stored inside the `app/validators` directory. 

The validator files are created for an entity and each file can have multiple validators inside it.

- Form: `NA`
- Suffix: `NA`
- File name example: `user.ts`

```sh
# A validator for managing a user
node ace make:validator user

# A validator for managing a post
node ace make:validator post
```

You may create validators with pre-defined `create` and `update` actions using the `--resource` flag.

```sh
node ace make:validator post --resource
```

Run the following command to eject the validators stub.

```sh
node ace eject make/validator
```

## make\:listener

Create a new listener class. The listener classes are stored inside the `app/listeners` directory.

- Form: `NA`
- Suffix: `NA`
- Class name example: `SendShipmentNotification`
- File name example: `send_shipment_notification.ts`
- Recommendation: The event listeners must be named after the action they perform. For example, a listener that sends the shipment notification email should be called `SendShipmentNotification`.

```sh
node ace make:listener sendShipmentNotification
```

You may use the `--event` flag to create a listener for a specific known event. 

```sh
node ace make:listener sendShipmentNotification --event=shipment_received
```

Run the following command to eject the listener stub.

```sh
node ace eject make/listener
```

## make\:service

Create a new service class. Service classes are stored inside the `app/services` directory.

You may use services to encapsulate some logic. For example, a `CurrencyService` class is used to manage monetary values, or an `InvoiceService` class is used to generate and send invoices. 

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

Create a [custom exception class](../http/exception_handling.md#custom-exceptions). Exceptions are stored inside the `app/exceptions` directory.

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

Create a new Ace command. By default, the commands are stored inside the `commands` directory in the root of your application.

Commands from this directory are imported automatically by AdonisJS when you try to execute any Ace command. You may prefix the filename with an `_` to store additional files in this directory, that are not Ace commands.

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

## make\:view
Create a new Edge template file. The file will be created inside the [views directory](../fundamentals/adonisrc_file.md#directories).

- Form: `NA`
- Suffix: `NA`
- File name example: `posts/view.edge`
- Recommendation: You must group templates for a resource inside a subdirectory. For example: `posts/list.edge`, `posts/create.edge` and so on.

```sh
node ace make:view posts/create
node ace make:view posts/list
```

Run the following command to eject the template stub.

```sh
node ace eject make/view
```


## make\:provider

Create a [service provider file](../fundamentals/service_providers.md). Providers are stored inside the `providers` directory in the root of your application.

The `make:provider` command will automtically register the provider inside the `.adonisrc.ts` file.

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

## make\:preload
Create a [preload file](../fundamentals/adonisrc_file.md#preloads). Preload files are stored inside the `start` directory.

The `make:preload` command will automtically register the preload file inside the `.adonisrc.ts` file.

- Form: `NA`
- Suffix: `NA`
- File name example: `view.ts`

```sh
node ace make:preload view
```

Run the following command to eject the preload file stub.

```sh
node ace eject make/preload
```

## make\:test
Create a new test file. The `make:test` command will display a prompt to select the suite for the test. Otherwise, you may use the `--suite` flag to skip the prompt.

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

## make\:mail
Create a new mail class inside the `app/mails` directory. The mail classes are prefixed with the `Notification` keyword. However, you may define a custom suffix using the `--intent` CLI flag.

- Form: NA
- Suffix: `Intent`
- Class name example: ShipmentNotification
- File name example: shipment_notification.ts

```sh
node ace make:mail shipment
# ./app/mails/shipment_notification.ts

node ace make:mail shipment --intent=confirmation
# ./app/mails/shipment_confirmation.ts

node ace make:mail storage --intent=warning
# ./app/mails/storage_warning.ts
```

Run the following command to eject mail stubs.

```sh
node ace eject make/mail --pkg=@adonisjs/mail
```

## make\:policy

Create a new Bouncer policy class. You may use the `--model` flag to explicitly define the model name for which to generate the policy, otherwise the model name will be inferred from the policy name.

- Form: `singular`
- Suffix: `policy`
- Class name example: `PostPolicy`
- File name example: `post_policy.ts`

```sh
node ace make:policy post

# Generate policy with custom model name
node ace make:policy post --model=article

# Generate policy with pre-defined methods
node ace make:policy post view viewAll show edit delete
```

Run the following command to eject policy stubs.

```sh
node ace eject make/policy --pkg=@adonisjs/bouncer
```

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

| Variable | Description |
|------------|------------|
| `app` | Reference to an instance of the [application class](../fundamentals/application.md). |
| `generators` | Reference to the [generators module](https://github.com/adonisjs/application/blob/next/src/generators.ts). |
| `randomString` | Reference to the [randomString](./helpers.md#random) helper function. |
| `string` | A function to create a [string builder](./helpers.md#string-builder) instance. You can use the string builder to apply transformations on a string. | 
| `flags` | The command-line flags defined at the time of running the ace command. |
