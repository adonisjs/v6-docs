# Validating API requests

In AdonisJS, the API requests are validated at the controller layer. If the request validation fails, you send a `422 (Unprocessable Entity )` response with the error messages to the client. Otherwise continue with the rest of the controller logic.

The API requests validation logic in AdonisJS is framework agnostic and you can use any validation library you like. However, we ship a great validator as part of the framework core. AdonisJS validator is:

- One of the [fastest validator in the Node.js ecosystem](https://github.com/adonisjs/validator/blob/develop/benchmarks.md).
- Provides static and runtime safety.
- Allows defining custom error messages.
- Allows defining translations for error messages and fields.
- Uses error formatters to format the shape of errors JSON.

## Basic example

In this example, we will use 