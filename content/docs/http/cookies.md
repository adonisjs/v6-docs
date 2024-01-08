# Cookies

The request cookies are parsed automatically during an HTTP request. You can read cookies using the [request](./request.md) object and set/clear cookies using the [response](./response.md) object.

```ts
// title: Read cookies
import router from '@adonisjs/core/services/router'

router.get('cart', async ({ request }) => {
  // highlight-start
  const cartItems = request.cookie('cart_items', [])
  // highlight-end
  console.log(cartItems)
})
```

```ts
// title: Set cookies
import router from '@adonisjs/core/services/router'

router.post('cart', async ({ request, response }) => {
  const id = request.input('product_id')
  // highlight-start
  response.cookie('cart_items', [{ id }])
  // highlight-end
})
```

```ts
// title: Clear cookies
import router from '@adonisjs/core/services/router'

router.delete('cart', async ({ request, response }) => {
  // highlight-start
  response.clearCookie('cart_items')
  // highlight-end
})
```

## Configuration

The default configuration for setting cookies is defined inside the `config/app.ts` file. Feel free to tweak the options as per your application requirements.

```ts
http: {
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  }
}
```

The options are converted to [set-cookie attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes). The `maxAge` property accepts a string-based time expression, and its value will be converted to seconds.

The same set of options can be overridden when setting the cookies. 

```ts
response.cookie('key', value, {
  domain: '',
  path: '/',
  maxAge: '2h',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
})
```

## Supported data types

The cookie values are serialized to a string using `JSON.stringify`; therefore, you can use the following JavaScript data types as cookie values.

- string
- number
- bigInt
- boolean
- null
- object
- array 

```ts
// Object
response.cookie('user', {
  id: 1,
  fullName: 'virk',
})

// Array
response.cookie('product_ids', [1, 2, 3, 4])

// Boolean
response.cookie('is_logged_in', true)

// Number
response.cookie('visits', 10)

// BigInt
response.cookie('visits', BigInt(10))

// Data objects are converted to ISO string
response.cookie('visits', new Date())
```

## Signed cookies

The cookies set using the `response.cookie` method are signed. A signed cookie is tamper-proof, meaning changing its contents will invalidate its signature, and the cookie will be ignored.

The cookies are signed using the `appKey` defined inside the `config/app.ts` file.


:::note

The signed cookies are still readable by Base64 decoding them. You can use encrypted cookies if you want the cookie value to be unreadable.


:::


```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request, response }) => {
  // set signed cookie
  response.cookie('user_id', 1)

  // read signed cookie
  request.cookie('user_id')
})
```

## Encrypted cookies

Unlike signed cookies, the encrypted cookie value cannot be decoded to plain text. Therefore, you can use encrypted cookies for values containing sensitive information that should not be readable by anyone.

Encrypted cookies are set using the `response.encryptedCookie` method and read using the `request.encryptedCookie` method. Under the hood, these methods use the [Encryption module](../security/encryption.md).

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request, response }) => {
  // set encrypted cookie
  response.encryptedCookie('user_id', 1)

  // read encrypted cookie
  request.encryptedCookie('user_id')
})
```

## Plain cookies

Plain cookies are meant to be used when you want the cookie to be accessed by your frontend code using the `document.cookie` value. 

By default, we call `JSON.stringify` on raw values and convert them to a base64 encoded string. It is done so that you can use `objects` and `arrays` for the cookie value. However, the encoding can be turned off.

Plain cookies are defined using the `response.plainCookie` method and can be read using the `request.plainCookie` method.

```ts
import router from '@adonisjs/core/services/router'

router.get('/', async ({ request, response }) => {
  // set plain cookie
  response.plainCookie('user', { id: 1 }, {
    httpOnly: true
  })

  // read plain cookie
  request.plainCookie('user')
})
``` 

To turn off encoding, set `encoding: false` in the options object.

```ts
response.plainCookie('token', tokenValue, {
  httpOnly: true,
  encoding: false,
})

// Read plain cookie with encoding off
request.plainCookie('token', {
  encoded: false
})
```

## Setting cookies during tests
The following guides cover the usage of cookies when writing tests.

- Defining cookies with [Japa API client](../testing/http_tests.md#readingwriting-cookies).
- Defining cookie with [Japa browser client](../testing/browser_tests.md#readingwriting-cookies).
