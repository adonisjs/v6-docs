# Validation

{{TOC}}

In AdonisJS, the request data is validated at the controller layer. If the validation fails, you return the error messages to the client. Otherwise, continue with the rest of the controller logic.

The data validation layer in AdonisJS is framework agnostic, and you can use any validation library you like. However, we ship a great validator as part of the framework core. AdonisJS validator is:

- One of the [fastest validators in the Node.js ecosystem](https://github.com/adonisjs/validator/blob/main/benchmarks.md).
- Provides static and runtime safety.
- Casts form input values to JavaScript data types.
- Allows defining custom error messages.
- Allows defining translations for error messages and fields.

## Basic example

Following is a basic example of creating a validation schema and using the `request.validate` method to perform the validation. Make sure to read our dedicated guides on [validating server-rendered forms](validating_server_rendered_forms.md) and [validating API requests](validating_api_requests.md).

```ts
import router from '@adonisjs/core/services/router'
import { schema, rules } from '@adonisjs/core/validator'

router.post('register', async ({ request }) => {
  const registerUserSchema = schema.create({
    email: schema.string([
      rules.email(),
      rules.unique({ table: 'users' })
    ]),
    
    password: schema.string([
      rules.minLength(6),
      rules.maxLength(40)
    ])
  })
  
  await request.validate({
    schema: registerUserSchema
  })
})
```

The `request.validate` method validates the request body against the given schema. If the validation fails, the [`ValidationException` exception](#the-validationexception) is thrown.

## Static type-safety

The AdonisJS validator infers the static types of the validated data from the schema. As a result, you get both static and runtime safety from a single schema definition.

validator-static-types.webp 

## Validator standalone usage

You can use the validator outside an HTTP request by importing the `validate` method from the validator module. When using the standalone `validate` method, you must manually provide the `data` object.

```ts
import { schema, rules, validate } from '@adonisjs/core/validator'

const registerUserSchema = schema.create({
  // ... fields and rules
})

try {
  await validate({
    schema,
    data: {
      email: 'virk@adonisjs.com',
      password: 'secret'
    }
  })
} catch (error) {
  console.log(error.messages)
}
```

## The `ValidationException`

The `ValidationException` is thrown by the `request.validate` and the `validate` methods when the data validation fails. You can access the validation errors using the `error.messages` property. The structure of error messages depends upon the configured [error formatter](./error_formatters.md).

During an HTTP request, we recommend you not to handle the `ValidationException` and instead let it reach the [global exception handler](../basics/exceptions_handling.md). 

The global exception handler will convert the `ValidationException` to an HTTP response using [content negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation). Following is a brief explanation of how content negotiation works.

- If the request has an `Accept` header set to `application/json`, we will send the validation error messages as an array of JSON objects.
- If the request has an `Accept` header set to `application/vnd.api+json `, then we will send the validation errors in [JSON API](https://jsonapi.org/format/#errors) format.
- Otherwise, we respond with a redirect and share the validation errors using session flash messages.

Whether you are building an API server or a server-rendered application, the content negotiation will ensure that the client receives the error messages in the best format possible.

## Casting input fields to JavaScript data types

Data sent over HTTP is always represented as a string. So, for example, if you create an input field of type `number` and send its value to the backend, you will receive a **string representation of number** and not the **number data-type**.

At some stage, your backend server must cast string values to JavaScript data types. AdonisJS performs data casting at the time of validation. 

The schema methods like `schema.number`, or `schema.boolean` perform validations and type casting simultaneously. You can also add [extend the schema API]() with custom data types.

## Next steps

- Read guides on [validating server-rendered forms](validating_server_rendered_forms.md) and [validating API requests](validating_api_requests.md).
- Learn everything about the [creating validation schemas](schema_101.md).
