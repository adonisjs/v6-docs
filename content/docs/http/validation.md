# Validation

The data validation in AdonisJS is usually performed at the controller level. This ensures you validate the user input as soon as your application handles the request and send errors that can be displayed next to the form fields.

Once the validation is completed, you can use the trusted data to perform the rest of the operations, like database queries, scheduling queue jobs, sending emails, etc.

## Choosing the validation library
The AdonisJS core team has created a framework agnostic data validation library called [VineJS](https://vinejs.dev/docs/introduction). Following are some of the reasons for using VineJS.

- It is **one of the fastest validation libraries** in the Node.js ecosystem.

- Provides **static type safety** alongside the runtime validations.

- It comes pre-configured with the `web` and the `api` starter kits.

- Official AdonisJS packages extend VineJS with custom rules. For example, Lucid contributes `unique` and `exists` rules to VineJS.

However, AdonisJS does not technically force you to use VineJS. You can use any validation library that fits great for you or your team. Just uninstall the `@vinejs/vine` package and install the package you want to use.

## Basic example
VineJS uses the concept of validators. You create one validator for each action your application can perform. For example: Define a validator for **creating a new post**, another for **updating the post**, and maybe a validator for **deleting a post**.

We will use a blog as an example and create validators to create and update a blog post. Let's start by defining a couple of routes and their controllers.

```ts
import router from '@adonisjs/core/services/router'

const PostsController = () => import('#controllers/posts_controller')

router.post('posts', [PostsController, 'store'])
router.put('posts/:id', [PostsController, 'update'])
```

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async store({}: HttpContext) {}

  async update({}: HttpContext) {}
}
```

### Creating validators

Once you have created the `PostsController` and defined the routes, you may use the following ace command to create a validator.

```sh
node ace make:validator posts
```

The validators are created inside the `app/validators` directory. The validator file is empty by default, and you can use it to export multiple validators from it. Each validator is a `const` variable holding the result of [`vine.compile`](https://vinejs.dev/docs/getting_started#pre-compiling-schema) method.

In the following example, we create `createPostValidator` and `updatePostValidator`. Both validators have a slight variation in their schemas. During creation, we allow the user to provide a custom slug for the post, whereas we disallow updating it.

:::note

Do not worry too much about the duplication within the validator schemas. We recommend you opt for easy-to-understand schemas vs. avoiding duplication at all costs. The [wet codebase analogy](https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase) might help you embrace duplication.

:::

```ts
// title: app/validators/posts_validator.ts
import vine from '@vinejs/vine'

export const createPostValidator = vine.compile(
  vine.schema({
    title: vine.string().trim().minLength(6),
    slug: vine.string().trim(),
    description: vine.string().trim().escape()
  })
)

export const updatePostValidator = vine.compile(
  vine.schema({
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
} from '#validators/posts_validator'
// highlight-end

export default class PostsController {
  async store({ request }: HttpContext) {
    // highlight-start
    const data = request.all()
    const payload = await createPostValidator.validate(data)
    // highlight-end
  }

  async update({ request }: HttpContext) {
    // highlight-start
    const data = request.all()
    const payload = await updatePostValidator.validate(data)
    // highlight-end
  }
}
```

That is all! Validating the user input is two lines of code inside your controllers. The validated output has static-type information inferred from the schema.

Also, you do not have to wrap the `validate` method call inside a `try/catch`. Because in the case of an error, AdonisJS will automatically convert the error to an HTTP response.

## The request.validateUsing method
The recommend way to perform validations inside controllers is to use the `request.validateUsing` method.

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

The `request.validateUsing` method has following benefits over the `validator.validate` method.

- There is no need to explicitly define the validation data.

- If you have configured the `@adonisjs/i18n` package, then the `request.validateUsing` method will lookup the error messages from the translation files.

- Finally, it will switch the error reporters using content negotiation. [Learn more]()

## Configuring VineJS
You may create a [preload file](../fundamentals/adonisrc_file.md#preloads) inside the `start` directory to configure VineJS with custom error messages or a custom error reporter.

```sh
node ace make:prldfile validator
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

## Passing request data to validators
