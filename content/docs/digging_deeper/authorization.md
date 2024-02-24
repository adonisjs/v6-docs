# Authorization

You can write authorization checks in your AdonisJS application using the `@adonisjs/bouncer` package. Bouncer provides a JavaScript first API for writing authorization checks as **abilities** and **policies**.

The goal of abilities and policies is to abstract the logic of authorizing an action to a single place and reuse it across the rest of the codebase.

- [Abilities](#defining-abilities) are defined as functions and can be a great fit if your application has fewer and simpler authorization checks.

- [Policies](#defining-policies) are defined as classes, and you must create one policy for every resource in your application. Policies can also benefit from [automatic dependency injection](#dependency-injection).

:::note

Bouncer is not an implementation of RBAC or ACL. Instead, it provides a low-level API with fine-grained control to authorize actions in your AdonisJS applications.

:::

## Installation

Install the package from the npm packages registry using one of the following commands.

:::codegroup

```sh
// title: npm
npm i @adonisjs/bouncer
```

```sh
// title: yarn
yarn add @adonisjs/bouncer
```

```sh
// title: pnpm
pnpm add @adonisjs/bouncer
```

:::


Once done, you must run the following command to configure the bouncer package.

```sh
node ace configure @adonisjs/bouncer
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider and command inside the `adonisrc.ts` file.

    ```ts
    {
      commands: [
        // ...other commands
        () => import('@adonisjs/bouncer/commands')
      ],
      providers: [
        // ...other providers
        () => import('@adonisjs/bouncer/bouncer_provider')
      ]
    }
    ```

2. Creates the `app/abilities/main.ts` file to define and export abilities.

3. Creates the `app/policies/main.ts` file to export all policies as a collection.

3. Creates `initialize_bouncer_middleware` inside the `middleware` directory.

4. Register the following middleware inside the `start/kernel.ts` file.

    ```ts
    router.use([
      () => import('#middleware/initialize_bouncer_middleware')
    ])
    ```

:::

##  The Initialize bouncer middleware
During setup, we create and register the `#middleware/initialize_bouncer_middleware` middleware within your application. The initialize middleware is responsible for creating an instance of the [Bouncer](https://github.com/adonisjs/bouncer/blob/main/src/bouncer.ts) class for the currently authenticated user and shares it via the `ctx.bouncer` property with the rest of the request.

Also, we share the same Bouncer instance with Edge templates using the `ctx.view.share` method. Feel free to remove the following lines of code from the middleware if you are not using Edge inside your application.

:::note

You own your application's source code, including the files created during the initial setup. So, do not hesitate to change them and make them work with your application environment.

:::

```ts
async handle(ctx: HttpContext, next: NextFn) {
  ctx.bouncer = new Bouncer(
    () => ctx.auth.user || null,
    abilities,
    policies
  ).setContainerResolver(ctx.containerResolver)

  // delete-start
  /**
   * Remove if not using Edge
   */
  if ('view' in ctx) {
    ctx.view.share(ctx.bouncer.edgeHelpers)
  }
  // delete-end

  return next()
}
```

## Defining abilities

Abilities are JavaScript functions usually written inside the `./app/abilities/main.ts` file. You may export multiple abilities from this file.

In the following example, we define an ability called `editPost` using the `Bouncer.ability` method. The implementation callback must return `true` to authorize the user and return `false` to deny access.

:::note

An ability should always accept the `User` as the first parameter, followed by additional parameters needed for the authorization check.

:::

```ts
// title: app/abilities/main.ts
import User from '#models/user'
import Post from '#models/post'
import { Bouncer } from '@adonisjs/bouncer'

export const editPost = Bouncer.ability((user: User, post: Post) => {
  return user.id === post.userId
})
```

### Performing authorization
Once you have defined an ability, you may perform an authorization check using the `ctx.bouncer.allows` method. 

Bouncer will automatically pass the currently logged-in user to the ability callback as the first parameter, and you must supply the rest of the parameters manually. 

```ts
import Post from '#models/post'
// highlight-start
import { editPost } from '#abilities/main'
// highlight-end
import router from '@adonisjs/core/services/router'

router.put('posts/:id', async ({ bouncer, params, response }) => {
  /**
   * Find a post by ID so that we can perform an
   * authorization check for it.
   */
  const post = await Post.findOrFail(params.id)

  /**
   * Use the ability to see if the logged-in user
   * is allowed to perform the action.
   */
  // highlight-start
  if (await bouncer.allows(editPost, post)) {
    return 'You can edit the post'
  }
  // highlight-end

  return response.forbidden('You cannot edit the post')
})
```

The opposite of `bouncer.allows` method is the `bouncer.denies` method. You may prefer this method instead of writing an `if not` statement.

```ts
if (await bouncer.denies(editPost, post)) {
  response.abort('Your cannot edit the post', 403)
}
```

### Allowing guest users
By default, Bouncer denies authorization checks for non-logged-in users without invoking the ability callback. 

However, you may want to define certain abilities that can work with a guest user. For example, allow guests to view published posts but allow the creator of the post to view drafts as well.

You may define an ability that allows guest users using the `allowGuest` option. In this case, the options will be defined as the first parameter, and callback will be the second parameter.

```ts
export const viewPost = Bouncer.ability(
  // highlight-start
  { allowGuest: true },
  // highlight-end
  (user: User | null, post: Post) => {
    /**
     * Allow everyone to access published posts
     */
    if (post.isPublished) {
      return true
    }

    /**
     * Guest cannot view non-published posts
     */
    if (!user) {
      return false
    }

    /**
     * The creator of the post can view non-published posts
     * as well.
     */
    return user.id === post.userId
  }
)
```

### Authorizing users other than the logged-in user
If you want to authorize a user other than the logged-in user, you may use the `Bouncer.create` method to create a new bouncer instance for a given user.

```ts
import User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'

const user = await User.findOrFail(1)
// highlight-start
const bouncer = Bouncer.create(user)
// highlight-end

if (await bouncer.allows(editPost, post)) {
}
```

## Defining policies
Policies offer an abstraction layer to organize the authorization checks as classes. It is recommended to create one policy per resource. For example, if your application has a Post model, you must create a `PostPolicy` class to authorize actions such as creating or updating posts.

The policies are stored inside the `./app/policies` directory, and each file represents a single policy. You may create a new policy by running the following command.

See also: [Make policy command](../reference/commands.md#makepolicy)

```sh
node ace make:policy post
```

The policy class extends the [BasePolicy](https://github.com/adonisjs/bouncer/blob/main/src/base_policy.ts) class, and you may implement methods for the authorization checks you want to perform. In the following example, we define authorization checks to `create`, `edit`, and `delete` a post.

```ts
// title: app/policies/post_policy.ts
import User from '#models/user'
import Post from '#models/post'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  /**
   * Every logged-in user can create a post
   */
  create(user: User): AuthorizerResponse {
    return true
  }

  /**
   * Only the post creator can edit the post
   */
  edit(user: User, post: Post): AuthorizerResponse {
    return user.id === post.userId
  }

  /**
   * Only the post creator can delete the post
   */
  delete(user: User, post: Post): AuthorizerResponse {
    return user.id === post.userId
  }
}
```

### Performing authorization
Once you have created a policy, you may use the `bouncer.with` method to specify the policy you want to use for authorization and then chain the `bouncer.allows` or `bouncer.denies` methods to perform the authorization check.

:::note

The `allows` and `denies` methods chained after the `bouncer.with` methods are type-safe and will show a list of completions based on the methods you have defined on the policy class.

:::

```ts
import Post from '#models/post'
import PostPolicy from '#policies/post_policy'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async create({ bouncer, response }: HttpContext) {
    // highlight-start
    if (await bouncer.with(PostPolicy).denies('create')) {
      return response.forbidden('Cannot create a post')
    }
    // highlight-end

    //Continue with the controller logic
  }

  async create({ bouncer, params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // highlight-start
    if (await bouncer.with(PostPolicy).denies('edit', post)) {
      return response.forbidden('Cannot edit the post')
    }
    // highlight-end

    //Continue with the controller logic
  }

  async create({ bouncer, params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // highlight-start
    if (await bouncer.with(PostPolicy).denies('delete', post)) {
      return response.forbidden('Cannot delete the post')
    }
    // highlight-end

    //Continue with the controller logic
  }
}
```

### Allowing guest users
[Similar to abilities](#allowing-guest-users), policies can also define authorization checks for guest users using the `@allowGuest` decorator. For example:

```ts
import User from '#models/user'
import Post from '#models/post'
import { BasePolicy, allowGuest } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  @allowGuest()
  view(user: User | null, post: Post): AuthorizerResponse {
    /**
     * Allow everyone to access published posts
     */
    if (post.isPublished) {
      return true
    }

    /**
     * Guest cannot view non-published posts
     */
    if (!user) {
      return false
    }

    /**
     * The creator of the post can view non-published posts
     * as well.
     */
    return user.id === post.userId
  }
}
```

### Policy hooks
You may define the `before` and the `after` template methods on a policy class to run actions around an authorization check. A common use case is always allowing or denying access to a certain user.

:::note

The `before` and the `after` methods are always invoked, regardless of a logged-in user. So make sure to handle the case where the value of `user` will be `null`.

:::

The response from the `before` is interpreted as follows.

- The `true` value will be considered successful authorization, and the action method will not be called.
- The `false` value will be considered access denied, and the action method will not be called.
- With an `undefined` return value, the bouncer will execute the action method to perform the authorization check.

```ts
export default class PostPolicy extends BasePolicy {
  async before(user: User | null, action: string, ...params: any[]) {
    /**
     * Always allow an admin user without performing any check
     */
    if (user && user.isAdmin) {
      return true
    }
  }
}
```

The `after` method receives the raw response from the action method and can override the previous response by returning a new value. The response from the `after` is interpreted as follows.

- The `true` value will be considered successful authorization, and the old response will be discarded.
- The `false` value will be considered access denied, and the old response will be discarded.
- With an `undefined` return value, the bouncer will continue to use the old response.

```ts
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  async after(
    user: User | null,
    action: string,
    response: AuthorizerResponse,
    ...params: any[]
  ) {
    if (user && user.isAdmin) {
      return true
    }
  }
}
```

### Dependency injection
The policy classes are created using the [IoC container](../fundamentals/ioc_container.md); therefore, you can type-hint and inject dependencies inside the policy constructor using the `@inject` decorator.

```ts
import { inject } from '@adonisjs/core'
import { PermissionsResolver } from '#services/permissions_resolver'

// highlight-start
@inject()
// highlight-end
export class PostPolicy extends BasePolicy {
  constructor(
    // highlight-start
    protected permissionsResolver: PermissionsResolver
    // highlight-end
  ) {
    super()
  }
}
```

If a Policy class is created during an HTTP request, you may also inject an instance of [HttpContext](../http/http_context.md) inside it.

```ts
// highlight-start
import { HttpContext } from '@adonisjs/core/http'
// highlight-end
import { PermissionsResolver } from '#services/permissions_resolver'

@inject()
export class PostPolicy extends BasePolicy {
  // highlight-start
  constructor(protected ctx: HttpContext) {
  // highlight-end
    super()
  }
}
```

## Throwing AuthorizationException
Alongside the `allows` and the `denies` methods, you may use the `bouncer.authorize` method to perform the authorization check. This method will throw the [AuthorizationException](https://github.com/adonisjs/bouncer/blob/main/src/errors.ts#L19) when the check fails.

```ts
router.put('posts/:id', async ({ bouncer, params }) => {
  const post = await Post.findOrFail(post)
  // highlight-start
  await bouncer.authorize(editPost, post)
  // highlight-end

  /**
   * If no exception was raised, you can consider the user
   * is allowed to edit the post.
   */
})
```

AdonisJS will convert the `AuthorizationException` to a `403 - Forbidden` HTTP response using the following content negotiation rules.

- HTTP requests with the `Accept=application/json` header will receive an array of error messages. Each array element will be an object with the `message` property.

- HTTP requests with `Accept=application/vnd.api+json` header will receive an array of error messages formatted as per the [JSON API](https://jsonapi.org/format/#errors) spec.

- All other requests will receive a plain text response message. However, you may use [status pages](../http/exception_handling.md#status-pages) to show a custom error page for authorization errors.

You may also self-handle `AuthorizationException` errors within the [global exception handler](../http/exception_handling.md).

```ts
import { errors } from '@adonisjs/bouncer'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_AUTHORIZATION_FAILURE) {
      return ctx
        .response
        .status(error.status)
        .send(error.getResponseMessage(ctx))
    }
    // highlight-end

    return super.handle(error, ctx)
  }
}
```

## Customizing Authorization response
Instead of returning a boolean value from abilities and policies, you may construct an error response using the [AuthorizationResponse](https://github.com/adonisjs/bouncer/blob/main/src/response.ts) class. 

The `AuthorizationResponse` class gives you fine grained control to define a custom HTTP status code and the error message.

```ts
import User from '#models/user'
import Post from '#models/post'
import { Bouncer, AuthorizationResponse } from '@adonisjs/bouncer'

export const editPost = Bouncer.ability((user: User, post: Post) => {
  if (user.id === post.userId) {
    return true
  }

  // highlight-start
  return AuthorizationResponse.deny('Post not found', 404)
  // highlight-end
})
```

If you are using the [@adonisjs/i18n](./i18n.md) package, you may return a localized response using the `.t` method. The translation message will be used over the default message during an HTTP request based on the user's language.

```ts
export const editPost = Bouncer.ability((user: User, post: Post) => {
  if (user.id === post.userId) {
    return true
  }

  // highlight-start
  return AuthorizationResponse
    .deny('Post not found', 404) // default message
    .t('errors.not_found') // translation identifier
  // highlight-end
})
```

### Using a custom response builder

The flexibility to define custom error messages for individual authorization checks is great. However, if you always want to return the same response, it might be cumbersome to repeat the same code everytime.

Therefore, you can override the default response builder for Bouncer as follows.

```ts
import { Bouncer, AuthorizationResponse } from '@adonisjs/bouncer'

Bouncer.responseBuilder = (response: boolean | AuthorizationResponse) => {
  if (response instanceof AuthorizationResponse) {
    return response
  }

  if (response === true) {
    return AuthorizationResponse.allow()
  }

  return AuthorizationResponse
    .deny('Resource not found', 404)
    .t('errors.not_found')
}
```

## Pre-registering abilities and policies
So far, in this guide, we explicitly import an ability or a policy whenever we want to use it. However, once you pre-register them, you can reference an ability or a policy by its name as a string.

Pre-registering abilities and policies might be less useful within your TypeScript codebase than just cleaning up the imports. However, they offer far better DX within Edge templates.

Look at the following code examples of Edge templates with and without pre-registering a policy.

:::caption{for="error"}
**Without pre-registering. No, not super clean**
:::

```edge
{{-- First import the ability --}}
@let(editPost = (await import('#abilities/main')).editPost)

@can(editPost, post)
  {{-- Can edit post --}}
@end
```

:::caption{for="success"}
**With pre-registering**
:::

```edge
{{-- Reference ability name as a string --}}
@can('editPost', post)
  {{-- Can edit post --}}
@end
```

If you open the `initialize_bouncer_middleware.ts` file, you will find us already importing and pre-registering abilities and policies when creating the Bouncer instance.

```ts
// highlight-start
import * as abilities from '#abilities/main'
import { policies } from '#policies/main'
// highlight-end

export default InitializeBouncerMiddleware {
  async handle(ctx, next) {
    ctx.bouncer = Bouncer.create(
      () => ctx.auth.user,
      // highlight-start
      abilities,
      policies
      // highlight-end
    )
  }
}
```

### Points to note

- If you decide to define abilities in other parts of your codebase, then make sure to import and pre-register them inside the middleware.

- In the case of policies, every time you run the `make:policy` command, make sure to accept the prompt to register the policy inside the policies collection. The policies collection is defined inside the `./app/policies/main.ts` file.

  ```ts
  // title: app/policies/main.ts
  export const policies = {
    PostPolicy: () => import('#polices/post_policy'),
    CommentPolicy: () => import('#polices/comment_policy')
  }
  ```

### Referencing pre-registered abilities and policies
In the following example, we get rid of the imports and reference abilities and policies by their name. Do note **the string-based API is also type-safe**, but your code editor's "Go to Definition" feature may not work.

```ts
// title: Ability usage example
// delete-start
import { editPost } from '#abilities/main'
// delete-end

router.put('posts/:id', async ({ bouncer, params, response }) => {
  const post = await Post.findOrFail(params.id)

  // delete-start
  if (await bouncer.allows(editPost, post)) {
  // delete-end
  // insert-start
  if (await bouncer.allows('editPost', post)) {
  // insert-end
    return 'You can edit the post'
  }
})
```

```ts
// title: Policy usage example
// delete-start
import PostPolicy from '#policies/post_policy'
// delete-end

export default class PostsController {
  async create({ bouncer, response }: HttpContext) {
    // delete-start
    if (await bouncer.with(PostPolicy).denies('create')) {
    // delete-end
    // insert-start
    if (await bouncer.with('PostPolicy').denies('create')) {
    // insert-end
      return response.forbidden('Cannot create a post')
    }

    //Continue with the controller logic
  }
}
```

## Authorization checks inside Edge templates
Before you can perform authorization checks inside Edge templates, make sure to [pre-register abilities and policies](#pre-registering-abilities-and-policies). Once done, you may use the `@can` and `@cannot` tags to perform the authorization checks.

These tags accept the `ability` name or the `policy.method` name as the first parameter, followed by the rest of the parameters accepted by the ability or a policy.

```edge
// title: Usage with ability
@can('editPost', post)
  {{-- Can edit post --}}
@end

@cannot('editPost', post)
  {{-- Cannot edit post --}}
@end
```

```edge
// title: Usage with policy
@can('PostPolicy.edit', post)
  {{-- Can edit post --}}
@end

@cannot('PostPolicy.edit', post)
  {{-- Cannot edit post --}}
@end
```

## Events
Please check the [events reference guide](../reference/events.md#authorizationfinished) to view the list of events dispatched by the `@adonisjs/bouncer` package.
