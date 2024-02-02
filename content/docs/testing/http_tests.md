# HTTP tests

HTTP tests refer to testing your application endpoints by making an actual HTTP request against them and asserting the response body, headers, cookies, session, etc.

HTTP tests are performed using the [API client plugin](https://japa.dev/docs/plugins/api-client) of Japa. The API client plugin is a stateless request library similar to `Axios` or `fetch` but more suited for testing.

If you want to test your web apps inside a real browser and interact with them programmatically, we recommend using the [Browser client](./browser_tests.md) that uses Playwright for testing.

## Setup
The first step is to install the following packages from the npm packages registry.

:::codegroup

```sh
// title: npm
npm i -D @japa/api-client
```

```sh
// title: yarn
yarn add -D @japa/api-client
```

```sh
// title: pnpm
pnpm add -D @japa/api-client
```

:::

### Registering the plugin

Before moving forward, register the plugin inside the `tests/bootstrap.ts` file.

```ts
// title: tests/bootstrap.ts
import { apiClient } from '@japa/api-client'

export const plugins: Config['plugins'] = [
  assert(),
  // highlight-start
  apiClient(),
  // highlight-end
  pluginAdonisJS(app),
]
```

The `apiClient` method optionally accepts the `baseURL` for the server. If not provided, it will use the `HOST` and the `PORT` environment variables.

```ts
import env from '#start/env'

export const plugins: Config['plugins'] = [
  apiClient({
    baseURL: `http://${env.get('HOST')}:${env.get('PORT')}`
  })
]
```

## Basic example

Once the `apiClient` plugin is registered, you may access the `client` object from [TestContext](https://japa.dev/docs/test-context) to make an HTTP request.

The HTTP tests must be written inside the folder configured for the `functional` tests suite. You may use the following command to create a new test file.

```sh
node ace make:test users/list --suite=functional
```

```ts
import { test } from '@japa/runner'

test.group('Users list', () => {
  test('get a list of users', ({ client }) => {
    const response = await client.get('/users')

    response.assertStatus(200)
    response.assertBody({
      data: [
        {
          id: 1,
          email: 'foo@bar.com',
        }
      ]
    })
  })
})
```

To view all the available request and assertion methods, make sure to [go through the Japa documentation](https://japa.dev/docs/plugins/api-client).

## Open API testing
The assertion and API client plugins allow you to use Open API spec files for writing assertions. Instead of manually testing the response against a fixed payload, you may use a spec file to test the shape of the HTTP response.

It is a great way to keep your Open API spec and server responses in sync. Because if you remove a certain endpoint from the spec file or change the response data shape, your tests will fail.

### Registering schema
AdonisJS does not offer tooling for generating Open API schema files from code. You may write it by hand or use graphical tools to create it.

Once you have a spec file, save it inside the `resources` directory (create the directory if missing) and register it with the `assert` plugin within the `tests/bootstrap.ts` file.

```ts
// title: tests/bootstrap.ts
import app from '@adonisjs/core/services/app'

export const plugins: Config['plugins'] = [
  // highlight-start
  assert({
    openApi: {
      schemas: [app.makePath('resources/open_api_schema.yaml')]
    }
  }),
  // highlight-end
  apiClient(),
  pluginAdonisJS(app)
]
```

### Writing assertions
Once the schema is registered, you can use the `response.assertAgainstApiSpec` method to assert against the API spec.

```ts
test('paginate posts', async ({ client }) => {
  const response = await client.get('/posts')
  response.assertAgainstApiSpec()
})
```

- The `response.assertAgainstApiSpec` method will use the **request method**, the **endpoint**, and the **response status code** to find the expected response schema.
- An exception will be raised when the response schema cannot be found. Otherwise, the response body will be validated against the schema.

Only the response's shape is tested, not the actual values. Therefore, you may have to write additional assertions. For example:

```ts
// Assert that the response is as per the schema
response.assertAgainstApiSpec()

// Assert for expected values
response.assertBodyContains({
  data: [{ title: 'Adonis 101' }, { title: 'Lucid 101' }]
})
```


## Reading/writing cookies
You may send cookies during the HTTP request using the `withCookie` method. The method accepts the cookie name as the first argument and the value as the second.

```ts
await client
  .get('/users')
  .withCookie('user_preferences', { limit: 10 })
```

The `withCookie` method defines a [singed cookie](../http/cookies.md#signed-cookies). In addition, you may use the `withEncryptedCookie` or `withPlainCookie` methods to send other types of cookies to the server.

```ts
await client
  .get('/users')
  .witEncryptedCookie('user_preferences', { limit: 10 })
```

```ts
await client
  .get('/users')
  .withPlainCookie('user_preferences', { limit: 10 })
```

### Reading cookies from the response
You may access the cookies set by your AdonisJS server using the `response.cookies` method. The method returns an object of cookies as a key-value pair.

```ts
const response = await client.get('/users')
console.log(response.cookies())
```

You may use the `response.cookie` method to access a single cookie value by its name. Or use the `assertCookie` method to assert the cookie value.

```ts
const response = await client.get('/users')

console.log(response.cookie('user_preferences'))

response.assertCookie('user_preferences')
```

## Populating session store
If you are using the [`@adonisjs/session`](../http/session.md) package to read/write session data in your application, you may also want to use the `sessionApiClient` plugin to populate the session store when writing tests.

### Setup
The first step is registering the plugin inside the `tests/bootstrap.ts` file.

```ts
// title: tests/bootstrap.ts
// insert-start
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
// insert-end

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  // insert-start
  sessionApiClient(app)
  // insert-end
]
```

And then, update the `.env.test` file (create one if it is missing) and set the `SESSON_DRIVER` to `memory`.

```dotenv
// title: .env.test
SESSION_DRIVER=memory
```

### Making requests with session data
You may use the `withSession` method on the Japa API client to make an HTTP request with some pre-defined session data. 

The `withSession` method will create a new session ID and populate the memory store with the data, and your AdonisJS application code can read the session data as usual.

After the request finishes, the session ID and its data will be destroyed.

```ts
test('checkout with cart items', async ({ client }) => {
  await client
    .post('/checkout')
    // highlight-start
    .withSession({
      cartItems: [
        {
          id: 1,
          name: 'South Indian Filter Press Coffee'
        },
        {
          id: 2,
          name: 'Cold Brew Bags',
        }
      ]
    })
    // highlight-end
})
```

Like the `withSession` method, you may use the `withFlashMessages` method to set flash messages when making an HTTP request.

```ts
const response = await client
  .get('posts/1')
  .withFlashMessages({
    success: 'Post created successfully'
  })

response.assertTextIncludes(`Post created successfully`)
```

### Reading session data from the response
You may access the session data set by your AdonisJS server using the `response.session()` method. The method returns the session data as an object of a key-value pair.

```ts
const response = await client
  .post('/posts')
  .json({
    title: 'some title',
    body: 'some description',
  })

console.log(response.session()) // all session data
console.log(response.session('post_id')) // value of post_id
```

You may read flash messages from the response using the `response.flashMessage` or `response.flashMessages` method.

```ts
const response = await client.post('/posts')

response.flashMessages()
response.flashMessage('errors')
response.flashMessage('success')
```

Finally, you may write assertions for the session data using one of the following methods.

```ts
const response = await client.post('/posts')

/**
 * Assert a specific key (with optional value) exists
 * in the session store
 */
response.assertSession('cart_items')
response.assertSession('cart_items', [{
  id: 1,
}, {
  id: 2,
}])

/**
 * Assert a specific key is not in the session store
 */
response.assertSessionMissing('cart_items')

/**
 * Assert a flash message exists (with optional value)
 * in the flash messages store
 */
response.assertFlashMessage('success')
response.assertFlashMessage('success', 'Post created successfully')

/**
 * Assert a specific key is not in the flash messages store
 */
response.assertFlashMissing('errors')

/**
 * Assert for validation errors in the flash messages
 * store
 */
response.assertHasValidationError('title')
response.assertValidationError('title', 'Enter post title')
response.assertValidationErrors('title', [
  'Enter post title',
  'Post title must be 10 characters long.'
])
response.assertDoesNotHaveValidationError('title')
```

## Authenticating users
If you use the `@adonisjs/auth` package to authenticate users in your application, you may use the `authApiClient` Japa plugin to authenticate users when making HTTP requests to your application.

The first step is registering the plugin inside the `tests/bootstrap.ts` file.

```ts
// title: tests/bootstrap.ts
// insert-start
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
// insert-end

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  // insert-start
  authApiClient(app)
  // insert-end
]
```

If you are using session-based authentication, then make sure to switch the session driver to an in-memory store.

```dotenv
// title: .env.test
SESSION_DRIVER=memory
```

That's all. Now, you may login users using the `loginAs` method. The method accepts the user object as the only argument and marks the user as logged in for the current HTTP request.

```ts
import User from '#models/user'

test('get payments list', async ({ client }) => {
  const user = await User.create(payload)

  await client
    .get('/me/payments')
    // highlight-start
    .loginAs(user)
    // highlight-end
})
```

The `loginAs` method uses the default guard configured inside the `config/auth.ts` file for authentication. However, you may specify a custom guard using the `withGuard` method. For example:

```ts
await client
    .get('/me/payments')
    // highlight-start
    .withGuard('api_tokens')
    .loginAs(user)
    // highlight-end
```

## Making a request with a CSRF token
If forms in your application use [CSRF protection](../security/web-security.md), you may use the `withCsrfToken` method to generate a CSRF token and pass it as a header during the request.

Before using the `withCsrfToken` method, register the following Japa plugins inside the `tests/bootstrap.ts` file and also make sure to [switch the `SESSION_DRIVER` env variable](#setup-1) to `memory`.

```ts
// title: tests/bootstrap.ts
// insert-start
import { shieldApiClient } from '@adonisjs/shield/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
// insert-end

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  // insert-start
  sessionApiClient(app),
  shieldApiClient()
  // insert-end
]
```

```ts
test('create a post', async ({ client }) => {
  await client
    .post('/posts')
    .form(dataGoesHere)
    .withCsrfToken()
})
```

## The route helper
You may use the `route` helper from the TestContext to create a URL for a route. Using the route helper ensures that whenever you update your routes, you do not have to come back and fix all the URLs inside your tests.

The `route` helper accepts the same set of arguments accepted by the global template method [route](../http/url_builder.md#generating-urls-inside-templates).

```ts
test('get a list of users', ({ client, route }) => {
  const response = await client.get(
    // highlight-start
    route('users.list')
    // highlight-end
  )

  response.assertStatus(200)
  response.assertBody({
    data: [
      {
        id: 1,
        email: 'foo@bar.com',
      }
    ]
  })
})
```
