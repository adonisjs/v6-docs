# HTTP tests

AdonisJS starter kits are pre-configured to use the [Japa API client plugin](https://japa.dev/docs/plugins/api-client). The API client is used to make HTTP requests to your AdonisJS server and test the response.

Mainly, you will be using the API client to test JSON API responses and use the [Browser client](./browser_tests.md) for testing server-rendered applications in a real browser.

## Configuration

Before moving forward, make sure the `apiClient` plugin is registered under the `plugins` array inside the `tests/bootstrap.ts` file.

```ts
export const plugins: Config['plugins'] = [
  assert(),
  // highlight-start
  apiClient(),
  // highlight-end
  pluginAdonisJS(app),
]
```

The `apiClient` plugin optionally accepts the `baseUrl` for the server. It will use the `HOST` and the `PORT` environment variables if not provided.

```ts
import env from '#start/env'

apiClient({
  baseUrl: `http://${env.get('HOST')}:${env.get('PORT')}`
})
```

## Basic example

Once the `apiClient` plugin is registered, you may access the `client` object from [TestContext](https://japa.dev/docs/test-context) to make an HTTP request. For example:

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

Make sure to [go through the Japa documentation](https://japa.dev/docs/plugins/api-client) to view all the available request and assertion methods.

## Open API testing
The assertion and API client plugins allow you to use Open API spec files for writing assertions. So, instead of manually testing the response against a fixed payload, you may use a spec file to test the shape of the HTTP response.

It is a great way to keep your Open API spec and server responses in sync. Because if you remove a certain endpoint from the spec file or change the response data shape, your tests will fail.

### Registering schema
AdonisJS does not offer any tooling for generating Open API schema files from code. You may write it by hand or use graphical tools to create it.

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
- An exception will be raised when unable to find the response schema. Otherwise, the response body will be validated against the schema.

Do note that only the response's shape is tested and not the actual values. Therefore, you may have to write additional assertions. For example:

```ts
// Assert that the response is as per the schema
response.assertAgainstApiSpec()

// Assert for expected values
response.assertBodyContains({
  data: [{ title: 'Adonis 101' }, { title: 'Lucid 101' }]
})
```


## Defining cookies
You may send cookies during the HTTP request using the `withCookie` method. The method accepts the cookie name as the first argument and the value as the second argument.

```ts
await client
  .get('/users')
  .withCookie('user_preferences', { limit: 10 })
```

The `withCookie` defines a [singed cookie](../http/cookies.md#signed-cookies). In addition, you may use the `withEncryptedCookie` or `withPlainCookie` methods to send other types of cookies to the server.

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

## Reading cookies from the response
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

## The route helper
You may use the `route` helper from the TestContext to create a URL for a route. Using the route helper ensures that whenever you update your routes, you do not have to come back and fix all the URLs inside your tests.

The `route` helper accepts the same set of arguments accepted by the global template method [route](../http/url_builder.md#route).

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
