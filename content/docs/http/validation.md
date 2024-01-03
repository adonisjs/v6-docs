# Validation

The data validation in AdonisJS is usually performed at the controller level. This ensures you validate the user input as soon as your application handles the request and send errors in the response that can be displayed next to the form fields.

Once the validation is completed, you can use the trusted data to perform the rest of the operations, like database queries, scheduling queue jobs, sending emails, etc.

## Choosing the validation library
The AdonisJS core team has created a framework agnostic data validation library called [VineJS](https://vinejs.dev/docs/introduction). Following are some of the reasons for using VineJS.

- It is **one of the fastest validation libraries** in the Node.js ecosystem.

- Provides **static type safety** alongside the runtime validations.

- It comes pre-configured with the `web` and the `api` starter kits.

- Official AdonisJS packages extend VineJS with custom rules. For example, Lucid contributes `unique` and `exists` rules to VineJS.

However, AdonisJS does not technically force you to use VineJS. You can use any validation library that fits great for you or your team. Just uninstall the `@vinejs/vine` package and install the package you want to use.

## Using VineJS
Install VineJS from the npm packages registry using one of the following commands.

See also: [VineJS documentation](https://vinejs.dev)

:::codegroup

```sh
// title: npm
npm i @vinejs/vine
```

```sh
// title: yarn
yarn add @vinejs/vine
```

```sh
// title: pnpm
pnpm add @vinejs/vine
```

:::

Once done, you must run the following command to configure VineJS within an AdonisJS application.

```sh
node ace configure vinejs
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider inside the `adonisrc.ts` file.

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/core/providers/vinejs_provider')
      ]
    }
    ```

:::

## Using VineJS validators
VineJS uses the concept of validators. You create one validator for each action your application can perform. For example: Define a validator for **creating a new post**, another for **updating the post**, and maybe a validator for **deleting a post**.

We will use a blog as an example and define validators to create/update a post. Let's start by registering a couple of routes and the `PostsController`.

```ts
// title: Define routes
import router from '@adonisjs/core/services/router'

const PostsController = () => import('#controllers/posts_controller')

router.post('posts', [PostsController, 'store'])
router.put('posts/:id', [PostsController, 'update'])
```

```sh
// title: Create controller
node ace make:controller post store update
```

```ts
// title: Scaffold controller
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async store({}: HttpContext) {}

  async update({}: HttpContext) {}
}
```

### Creating validators

Once you have created the `PostsController` and defined the routes, you may use the following ace command to create a validator.

```sh
node ace make:validator post
```

The validators are created inside the `app/validators` directory. The validator file is empty by default, and you can use it to export multiple validators from it. Each validator is a `const` variable holding the result of [`vine.compile`](https://vinejs.dev/docs/getting_started#pre-compiling-schema) method.

In the following example, we define `createPostValidator` and `updatePostValidator`. Both validators have a slight variation in their schemas. During creation, we allow the user to provide a custom slug for the post, whereas we disallow updating it.

:::note

Do not worry too much about the duplication within the validator schemas. We recommend you opt for easy-to-understand schemas vs. avoiding duplication at all costs. The [wet codebase analogy](https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase) might help you embrace duplication.

:::

```ts
// title: app/validators/post_validator.ts
import vine from '@vinejs/vine'

/**
 * Validates the post's creation action
 */
export const createPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    slug: vine.string().trim(),
    description: vine.string().trim().escape()
  })
)

/**
 * Validates the post's update action
 */
export const updatePostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    description: vine.string().trim().escape()
  })
)
```

### Using validators inside controllers
Let's go back to the `PostsController` and use the validators to validate the request body. You can access the request body using the `request.all()` method.

```ts
import { HttpContext } from '@adonisjs/core/http'
// highlight-start
import {
  createPostValidator,
  updatePostValidator
} from '#validators/post_validator'
// highlight-end

export default class PostsController {
  async store({ request }: HttpContext) {
    // highlight-start
    const data = request.all()
    const payload = await createPostValidator.validate(data)
    return payload
    // highlight-end
  }

  async update({ request }: HttpContext) {
    // highlight-start
    const data = request.all()
    const payload = await updatePostValidator.validate(data)
    return payload
    // highlight-end
  }
}
```

That is all! Validating the user input is two lines of code inside your controllers. The validated output has static-type information inferred from the schema.

Also, you do not have to wrap the `validate` method call inside a `try/catch`. Because in the case of an error, AdonisJS will automatically convert the error to an HTTP response.

## Error handling
The [HttpExceptionHandler](./exception_handling.md) will convert the validation errors to an HTTP response automatically. The exception handler uses content negotiation and returns a response based upon the [Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept) header value.

:::tip

You might want to peek through the [ExceptionHandler codebase](https://github.com/adonisjs/http-server/blob/next/src/exception_handler.ts#L343-L345) and see how the validation exceptions are converted to an HTTP response.

Also, the session middleware [overwrites the `renderValidationErrorAsHTML` method](https://github.com/adonisjs/session/blob/next/src/session_middleware.ts#L30-L37) and uses flash messages to share the validation errors with the form.

:::

- HTTP requests with `Accept=application/json` header will receive an array of error messages created using the [SimpleErrorReporter](https://github.com/vinejs/vine/blob/main/src/reporters/simple_error_reporter.ts).

- HTTP requests with `Accept=application/vnd.api+json` header will receive an array of error messages formatted as per the [JSON API](https://jsonapi.org/format/#errors) spec.

- Server rendered forms using the [session package](./session.md) will receive the errors via [session flash messages](./session.md#validation-errors-and-flash-messages).

- All other requests will receive errors back as plain text.

## The request.validateUsing method
The recommended way to perform validations inside controllers is to use the `request.validateUsing` method. When using `request.validateUsing` method, you do not have do define the validation data explicitly; the request body and files are passed as data to the validator.

```ts
import { HttpContext } from '@adonisjs/core/http'
import {
  createPostValidator,
  updatePostValidator
} from '#validators/posts_validator'

export default class PostsController {
  async store({ request }: HttpContext) {
    // delete-start
    const data = request.all()
    const payload = await createPostValidator.validate(data)
    // delete-end
    // insert-start
    const payload = await request.validateUsing(createPostValidator)
    // insert-end
  }

  async update({ request }: HttpContext) {
    // delete-start
    const data = request.all()
    const payload = await updatePostValidator.validate(data)
    // delete-end
    // insert-start
    const payload = await request.validateUsing(updatePostValidator)
    // insert-end
  }
}
```

### Validating cookies, headers and route params
When using the `request.validateUsing` method you can validate cookies, headers and route params as follows.

```ts
const validator = vine.compile(
  vine.object({
    // Fields in request body
    username: vine.string(),
    password: vine.string(),

    // Validate cookies
    cookies: vine.object({
    }),

    // Validate headers
    headers: vine.object({
    }),

    // Validate route params
    params: vine.object({
    }),
  })
)

await request.validateUsing(validator)
```

## Passing metadata to validators
Since validators are defined outside the request lifecycle, they do not have direct access to the request data. This is usually good because it makes validators reusable outside an HTTP request lifecycle.

However, if a validator needs access to some runtime data, you must pass it as metadata during the `validate` method call.

Let's take an example of the `unique` validation rule. We want to ensure the user email is unique in the database but skip the row for the currently logged-in user.

```ts
export const updateUserValidator = vine
  .compile(
    vine.object({
      email: vine.string().unique((query, field) => {
        query.whereNot(
          'id',
          // highlight-start
          field.meta.userId
          // highlight-end
        )
      })
    })
  )
```

In the above example, we access the currently logged-in user via the `meta.userId` property. Let's see how we can pass the `userId` during an HTTP request.

```ts
async update({ request, auth }: HttpContext) {
  await request.validateUsing(
    updateUserValidator,
    {
      meta: {
        userId: auth.user!.id
      }
    }
  )
}
```

### Making metadata type-safe
In the previous example, we must remember to pass the `meta.userId` during the validation. It would be great if we could make TypeScript remind us of the same.

In the following example, we use the `vine.withMetaData` function to define the static type of the metadata we expect to use in our schema.

```ts
export const updateUserValidator = vine
  // insert-start
  .withMetaData<{ userId: number }>()
  // insert-end
  .compile(
    vine.object({
      email: vine.string().unique((query, field) => {
        query.whereNot(
          'id',
          field.meta.userId
        )
      })
    })
  )
```

Do note, VineJS does not validate the metadata at runtime. However, if you want to do that, you can pass a callback to the `withMetaData` method and perform the validation manually.

```ts
vine.withMetaData<{ userId: number }>((meta) => {
  // validate metadata
})
```

## Configuring VineJS
You may create a [preload file](../fundamentals/adonisrc_file.md#preloads) inside the `start` directory to configure VineJS with custom error messages or use a custom error reporter.

```sh
node ace make:preload validator
```

In the following example, we [define custom error messages](https://vinejs.dev/docs/custom_error_messages).

```ts
// title: start/validator.ts
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  // Applicable for all fields
  'required': 'The {{ field }} field is required',
  'string': 'The value of {{ field }} field must be a string',
  'email': 'The value is not a valid email address',

  // Error message for the username field
  'username.required': 'Please choose a username for your account',
})
```

In the following example, we [register a custom error reporter](https://vinejs.dev/docs/error_reporter).

```ts
// title: start/validator.ts
import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { JSONAPIErrorReporter } from '../app/validation_reporters.js'

vine.errorReporter = () => new JSONAPIErrorReporter()
```

## Rules contributed by AdonisJS
Following is the list of VineJS rules contributed by AdonisJS.

- The [`vine.file`](https://github.com/adonisjs/core/blob/next/providers/vinejs_provider.ts) schema type is added by the AdonisJS core package.

## What's next?

- Learn more about using [custom messages](https://vinejs.dev/docs/custom_error_messages) in VineJS.
- Learn more about using [error reporters](https://vinejs.dev/docs/error_reporter) in VineJS.
- Read the VineJS [schema API](https://vinejs.dev/docs/schema_101) documentation.
- Use [i18n translations](../digging_deeper/i18n.md#translating-validation-messages) to define validation error messages.
