# Session

You can manage user sessions inside your AdonisJS application using the `@adonisjs/session` package. The session package provides a unified API for storing session data across different storage providers. 

**Following is the list of the bundled stores.**

- `cookie`: The session data is stored inside an encrypted cookie. The cookie store works great with multi-server deployments since the data is stored with the client.

- `file`: The session data is saved inside a file on the server. The file store can only scale to multi-server deployments if you implement sticky sessions with the load balancer.

- `redis`: The session data is stored inside a Redis database. The redis store is recommended for apps with large volumes of session data and can scale to multi-server deployments.

- `memory`: The session data is stored within a global memory store. The memory store is used during testing.

Alongside the inbuilt backend stores, you can also create and [register custom session stores](#creating-a-custom-session-store).

## Installation
Install the package from the npm packages registry using one of the following commands.

:::codegroup

```sh
// title: npm
npm i @adonisjs/session
```

```sh
// title: yarn
yarn add @adonisjs/session
```

```sh
// title: pnpm
pnpm add @adonisjs/session
```

:::

Once done, you must run the following command to configure the session package.

```sh
node ace configure @adonisjs/session
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider inside the `adonisrc.ts` file.

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/session/session_provider')
      ]
    }
    ```

2. Create the `config/session.ts` file.

3. Define the following environment variables and their validations. 

    ```dotenv
    SESSION_DRIVER=cookie
    ```

4. Registers the following middleware inside the `start/kernel.ts` file.

    ```ts
    router.use([
      () => import('@adonisjs/session/session_middleware')
    ])
    ```

:::

## Configuration
The configuration for the session package is stored inside the `config/session.ts` file.

See also: [Session config stub](https://github.com/adonisjs/session/blob/main/stubs/config/session.stub)

```ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  age: '2h',
  enabled: true,
  cookieName: 'adonis-session',
  clearWithBrowser: false,

  cookie: {
    path: '/',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },

  store: env.get('SESSION_DRIVER'),
  stores: {
    cookie: stores.cookie(),
  }
})
```

<dl>

<dt>

  enabled

</dt>

<dd>

Enable or disable the middleware temporarily without removing it from the middleware stack.

</dd>


<dt>

  cookieName

</dt>

<dd>

The cookie name for storing the session ID. Feel free to rename it.

</dd>

<dt>

  clearWithBrowser

</dt>

<dd>

When set to true, the session ID cookie will be removed after the user closes the browser window. This cookie is technically known as [session cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_the_lifetime_of_a_cookie).

</dd>

<dt>

  age

</dt>

<dd>

The `age` property controls the validity of session data without any user activity. After the given duration, the session data will be considered expired.

</dd>

<dt>

  cookie

</dt>

<dd>

Control session ID cookie attributes. See also [cookie configuration](./cookies.md#configuration).

</dd>

<dt>

store

</dt>

<dd>

Define the store you want to use for storing the session data. It can be a fixed value or read from the environment variables.

</dd>

<dt>

  stores

</dt>

<dd>

The `stores` object is used to configure one or multiple backend stores. 

Most applications will use a single store. However, you can configure multiple stores and switch between them based on the environment in which your application is running.

</dd>

</dl>

---

### Stores configuration
Following is the list of the backend stores bundled with the `@adonisjs/session` package.

```ts
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  // highlight-start
  stores: {
    cookie: stores.cookie(),

    file: stores.file({
      location: app.tmpPath('sessions')
    }),

    redis: stores.redis({
      connection: 'main'
    })
  }
  // highlight-end
})
```

<dl>

<dt>

  stores.cookie

</dt>

<dd>

The `cookie` store encrypts and stores the session data inside a cookie.

</dd>


<dt>

  stores.file

</dt>

<dd>

Define the configuration for the `file` store. The method accepts the `location` path for storing the session files.

</dd>


<dt>

  stores.redis

</dt>

<dd>

Define the configuration for the `redis` store. The method accepts the `connection` name for storing the session data.

Make sure to first install and configure the [@adonisjs/redis](../database/redis.md) package before using the `redis` store.

</dd>

</dl>

## Basic example
Once the session package has been registered, you can access the `session` property from the [HTTP Context](./http_context.md). The session property exposes the API for reading and writing data to the session store.

```ts
import router from '@adonisjs/core/services/router'

router.get('/theme/:color', async ({ params, session, response }) => {
  // highlight-start
  session.put('theme', params.color)
  // highlight-end
  response.redirect('/')
})

router.get('/', async ({ session }) => {
  // highlight-start
  const colorTheme = session.get('theme')
  // highlight-end
  return `You are using ${colorTheme} color theme`
})
```

The session data is read from the session store at the start of the request and written back to the store at the end. Therefore, all changes are kept in memory until the request finishes.

## Supported data types
The session data is serialized to a string using `JSON.stringify`; therefore, you can use the following JavaScript data types as session values.

- string
- number
- bigInt
- boolean
- null
- object
- array

```ts
// Object
session.put('user', {
  id: 1,
  fullName: 'virk',
})

// Array
session.put('product_ids', [1, 2, 3, 4])

// Boolean
session.put('is_logged_in', true)

// Number
session.put('visits', 10)

// BigInt
session.put('visits', BigInt(10))

// Data objects are converted to ISO string
session.put('visited_at', new Date())
```

## Reading and writing data
Following is the list of methods you can access from the `session` object to interact with the data.

### get
Returns the value of a key from the store. You can use dot notation to read nested values.

```ts
session.get('key')
session.get('user.email')
```

You can also define a default value as the second parameter. The default value will be returned if the key does not exist in the store.

```ts
session.get('visits', 0)
```

### has
Check if a key exists in the session store.

```ts
if (session.has('visits')) {
}
```

### all
Returns all the data from the session store. The return value will always be an object.

```ts
session.all()
```

### put
Add a key-value pair to the session store. You can create objects with nested values using the dot notation.

```ts
session.put('user', { email: 'foo@bar.com' })

// Same as above
session.put('user.email', 'foo@bar.com')
```

### forget
Remove a key-value pair from the session store.

```ts
session.forget('user')

// Remove the email from the user object
session.forget('user.email')
```

### pull
The `pull` method returns the value of a key and removes it from the store simultaneously.

```ts
const user = session.pull('user')
session.has('user') // false
```

### increment
The `increment` method increments the value of a key. A new key value is defined if it does not exist already.

```ts
session.increment('visits')

// Increment by 4
session.increment('visits', 4)
```

### decrement
The `decrement` method decrements the value of a key. A new key value is defined if it does not exist already.

```ts
session.decrement('visits')

// Decrement by 4
session.decrement('visits', 4)
```

### clear
The `clear` method removes everything from the session store.

```ts
session.clear()
```

## Session lifecycle
AdonisJS creates an empty session store and assigns it to a unique session ID on the first HTTP request, even if the request/response lifecycle doesn't interact with sessions.

On every subsequent request, we update the `maxAge` property of the session ID cookie to ensure it doesn't expire. Also, the session store is notified about the changes (if any) to update and persist the changes.

You can access the unique session ID using the `sessionId` property. The session ID for a visitor remains the same until it expires.

```ts
console.log(session.sessionId)
```

### Re-generating session id
Re-generating session ID helps prevent a [session fixation](https://owasp.org/www-community/attacks/Session_fixation) attack in your application. You must re-generate the session ID when associating an anonymous session with a logged-in user.

The `@adonisjs/auth` package re-generates the session ID automatically; therefore, you do not have to do it manually.

```ts
/**
 * New session ID will be assigned at
 * the end of the request
 */
session.regenerate()
```

## Flash messages
Flash messages are used to pass data between two HTTP requests. They are commonly used to provide feedback to the user after a specific action. For example, showing the success message after the form submission or displaying the validation error messages.

In the following example, we define the routes for displaying the contact form and submitting the form details to the database. Post form submission, we redirect the user back to the form alongside a success notification using flash messages.

```ts
import router from '@adonisjs/core/services/router'

router.post('/contact', ({ session, request, response }) => {
  const data = request.all()
  // Save contact data
  
  // highlight-start
  session.flash('notification', {
    type: 'success',
    message: 'Thanks for contacting. We will get back to you'
  })
  // highlight-end

  response.redirect().back()
})

router.get('/contact', ({ view }) => {
  return view.render('contact')
})
```

You can access the flash messages inside the edge templates using the `flashMessage` tag or the `flashMessages` property.

```edge
@flashMessage('notification')
  <div class="notification {{ $message.type }}">
    {{ $message.message }}
  </div>
@end

<form method="POST" action="/contact">
  <!-- Rest of the form -->
</form>
```

You can access the flash messages inside controllers using the `session.flashMessages` property.

```ts
router.get('/contact', ({ view, session }) => {
  // highlight-start
  console.log(session.flashMessages.all())
  // highlight-end
  return view.render('contact')
})
```

### Validation errors and flash messages
The Session middleware automatically captures the [validation exceptions](./validation.md#error-handling) and redirects the user back to the form. The validation errors and form input data are kept within flash messages, and you can access them inside Edge templates.

In the following example:

- We access the value of the `title` input field using the [`old` method](../reference/edge.md#old).
- And access the error message using the [`@inputError` tag](../reference/edge.md#inputerror).

```edge
<form method="POST" action="/posts">
  <div>
    <label for="title"> Title </label>
    <input 
      type="text"
      id="title"
      name="title"
      value="{{ old('title') || '' }}"
    />

    @inputError('title')
      @each(message in $messages)
        <p> {{ message }} </p>
      @end
    @end
  </div>
</form>
```

### Writing flash messages
The following are the methods to write data to the flash messages store. The `session.flash` method accepts a key-value pair and writes it to the flash messages property inside the session store.

```ts
session.flash('key', value)
session.flash({
  key: value
})
```

Instead of manually reading the request data and storing it to the flash messages, you can use one of the following methods to flash form data.

```ts
// title: flashAll
/**
 * Short hand for flashing request
 * data
 */
session.flashAll()

/**
 * Same as "flashAll"
 */
session.flash(request.all())
```

```ts
// title: flashOnly
/**
 * Short hand for flashing selected 
 * properties from request data
 */
session.flashOnly(['username', 'email'])

/**
 * Same as "flashOnly"
 */
session.flash(request.only(['username', 'email']))
```

```ts
// title: flashExcept
/**
 * Short hand for flashing selected 
 * properties from request data
 */
session.flashExcept(['password'])

/**
 * Same as "flashExcept"
 */
session.flash(request.except(['password']))
```

Finally, if you want to reflash the current flash messages, you can that using `session.reflash` method.

```ts
session.reflash()
session.reflashOnly(['notification', 'errors'])
session.reflashExcept(['errors'])
```

### Reading flash messages
The flash messages are only available in the subsequent request after the redirect. You can access them using the `session.flashMessages` property.

```ts
console.log(session.flashMessages.all())
console.log(session.flashMessages.get('key'))
console.log(session.flashMessages.has('key'))
```

The same `flashMessages` property is also shared with Edge templates, and you can access it as follows.

See also: [Edge helpers reference](../reference/edge.md#flashmessages)

```edge
{{ flashMessages.all() }}
{{ flashMessages.get('key') }}
{{ flashMessages.has('key') }}
```

Finally, you can access a specific flash message or a validation error using the following Edge tags. 

```edge
{{-- Read any flash message by key --}}
@flashMessage('key')
  {{ inspect($message) }}
@end

{{-- Read generic errors --}}
@error('key')
  {{ inspect($message) }}
@end

{{-- Read validation errors --}}
@inputError('key')
  {{ inspect($messages) }}
@end
```

## Events
Please check the [events reference guide](../reference/events.md#sessioninitiated) to view the list of events dispatched by the `@adonisjs/session` package.

## Creating a custom session store
Session stores must implement the [SessionStoreContract](https://github.com/adonisjs/session/blob/next/src/types.ts#L23C18-L23C38) interface and define the following methods.

```ts
import {
  SessionData,
  SessionStoreFactory,
  SessionStoreContract,
} from '@adonisjs/session/types'

/**
 * The config you want to accept
 */
export type MongoDBConfig = {}

/**
 * Driver implementation
 */
export class MongoDBStore implements SessionStoreContract {
  constructor(public config: MongoDBConfig) {
  }

  /**
   * Returns the session data for a session ID. The method
   * must return null or an object of a key-value pair
   */
  async read(sessionId: string): Promise<SessionData | null> {
  }

  /**
   * Save the session data against the provided session ID
   */
  async write(sessionId: string, data: SessionData): Promise<void> {
  }

  /**
   * Delete session data for the given session ID
   */
  async destroy(sessionId: string): Promise<void> {
  }

  /**
   * Reset the session expiry
   */
  async touch(sessionId: string): Promise<void> {
  }
}

/**
 * Factory function to reference the store
 * inside the config file.
 */
export function mongoDbStore (config: MongoDbConfig): SessionStoreFactory {
  return (ctx, sessionConfig) => {
    return new MongoDBStore(config)
  }
}
```

In the above code example, we export the following values.

- `MongoDBConfig`: TypeScript type for the configuration you want to accept.

- `MongoDBStore`: The store's implementation as a class. It must adhere to the `SessionStoreContract` interface.

- `mongoDbStore`: Finally, a factory function to create an instance of the store for every HTTP request.

### Using the store

Once the store has been created, you can reference it inside the config file using the `mongoDbStore` factory function.

```ts
// title: config/session.ts
import { defineConfig } from '@adonisjs/session'
import { mongDbStore } from 'my-custom-package'

export default defineConfig({
  stores: {
    mongodb: mongoDbStore({
      // config goes here
    })
  }
})
```

### A note on serializing data

The `write` method receives the session data as an object, and you might have to convert it to a string before saving it. You can use any serialization package for the same or the [MessageBuilder](../reference/helpers.md#message-builder) helper provided by the AdonisJS helpers module. For inspiration, please consult the official [session stores](https://github.com/adonisjs/session/blob/main/src/stores/redis.ts#L59).
