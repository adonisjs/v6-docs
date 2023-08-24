# Session

You can manage user sessions inside your AdonisJS application using the `@adonisjs/session` package. The session package provides a unified API for storing session data across different storage providers. 

**Following is the list of the bundled storage drivers.**

- `cookie`: The session data is stored inside an encrypted cookie. The cookie driver works great with multi-server deployments since the data is stored with the client.

- `file`: The session data is saved inside a file on the server. The file driver cannot scale to multi-server deployments unless you implement sticky sessions with the load balancer.

- `redis`: The session data is stored inside a Redis database. The redis driver is recommended for apps working with large volumes of session data and can scale to multi-server deployments.

- `memory`: The session data is stored within a global memory store. The memory driver is used during testing.

Alongside the inbuilt storage drivers, you can also create and [register custom session drivers](#creating-a-custom-session-driver).

## Installation
Install the package from the npm packages registry using one of the following commands.

:::codegroup

```sh
// title: npm
npm i @adonisjs/session@next
```

```sh
// title: yarn
yarn add @adonisjs/session@next
```

```sh
// title: pnpm
pnpm add @adonisjs/session@next
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

2. Creates the `config/session.ts` file.

3. Defines the following environment variables and their validations. 

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

```ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/session'

export default defineConfig({
  enabled: true,
  cookieName: 'adonis-session',
  clearWithBrowser: false,
  age: '2h',
  driver: env.get('SESSION_DRIVER'),

  /**
   * Cookie driver and session id cookie
   * settings
   */
  cookie: {
    path: '/',
    httpOnly: true,
    sameSite: false,
  },

  // File driver settings
  file: {
    location: app.tmpPath('sessions'),
  },

  // Redis driver settings
  redis: {
    connection: 'main'
  },
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

The cookie name for storing the session id. Feel free to rename it.

</dd>

<dt>

  clearWithBrowser

</dt>

<dd>

When set to true, the session id cookie will be removed after the user closes the browser window. This cookie is technically known as [session cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_the_lifetime_of_a_cookie).

</dd>

<dt>

  age

</dt>

<dd>

The `age` property controls the validity of session data without any user activity. After the given duration, the session data will be considered expired.

</dd>

<dt>

  driver

</dt>

<dd>

Define the driver you want to use for storing the session data. It can be a fixed value or read from the environment variables.

</dd>

<dt>

  cookie

</dt>

<dd>

Control session id cookie attributes. See also [cookie configuration](./cookies.md#configuration).

</dd>

<dt>

  file

</dt>

<dd>

Define the configuration for the `file` driver. The object accepts the `location` path for storing the session files.

</dd>


<dt>

  redis

</dt>

<dd>

Define the configuration for the `redis` driver. The object accepts the `connection` to use for storing the session data.

Make sure to first install and configure the [@adonisjs/redis](../database/redis.md) package before using the `redis` driver.

</dd>

</dl>

## Basic example
Once you have registered the session middleware, you can access the `session` property from the [HTTP Context](./http_context.md). The session property exposes the API for reading and writing data to the session store.

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
AdonisJS creates an empty session store and assigns it to a unique session id on the first HTTP request, even if the request/response lifecycle doesn't interact with sessions.

On every subsequent request, we update the `maxAge` property of the session id cookie to ensure it doesn't expire. Also, the session driver is notified about the changes (if any) to update and persist the changes.

You can access the unique session id using the `sessionId` property. The session id for a visitor remains the same until it expires.

```ts
console.log(session.sessionId)
```

### Re-generating session id
Re-generating session id helps prevent a [session fixation](https://owasp.org/www-community/attacks/Session_fixation) attack in your application. You must re-generate the session id when associating an anonymous session with a logged-in user.

The `@adonisjs/auth` package re-generates the session id automatically; therefore, you do not have to do it manually.

```ts
/**
 * New session id will be assigned at
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
  <div class="notification {{ message.type }}">
    {{ message.message }}
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

- We access the value of the `title` input field using the `flashMessages.get()` method.
- And access the error message using the `@error` tag. You can also access the error message using `flashMessages.get('errors.title')`

```edge
<form method="POST" action="/posts">
  <div>
    <label for="title"> Title </label>
    <input 
      type="text"
      id="title"
      name="title"
      value="{{ flashMessages.get('title') || '' }}"
    />

    @error('title')
      {{ message }}
    @end
  </div>
</form>
```

### Writing flash messages
The following are the methods to write data to the flash messages store.

```ts
session.flash('key', value)
session.flash({
  key: value
})
```

You can flash form data using one of the following methods.

```ts
session.flashAll()
session.flashOnly(['username', 'email'])
session.flashExcept(['password'])
```

Finally, you can reflash data from the current request using the `reflash` method.

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

```edge
{{ flashMessages.all() }}
{{ flashMessages.get('key') }}
{{ flashMessages.has('key') }}
```

Finally, you can access a specific flash message or a validation error using the following Edge tags. 

```edge
@flashMessage('key')
  {{ inspect(message) }}
@end

@error('key')
  {{ inspect(message) }}
@end
```

## Events
Following is the list of events emitted by the session package.

### session\:initiated
The event is emitted when the session store is initiated during an HTTP request. 

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:initiated', ({ session }) => {
  console.log(`Initiated store for ${session.sessionId}`)
})
```

### session\:committed
The event is emitted when the session data is written to the store during an HTTP request.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:committed', ({ session }) => {
  console.log(`Persisted data for ${session.sessionId}`)
})
```

### session\:migrated
The event is emitted when a new session id is generated using the `.regenerate()` method.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:migrated', ({ session, fromSessionId, toSessionId }) => {
  console.log(`Migrating data to ${toSessionId}`)
  console.log(`Destroying session ${fromSessionId}`)
})
```

## Creating a custom session driver
AdonisJS allows application developers to reference session drivers using a string-based name, like `file`, `cookie`, `redis`, and so on. Behind the scenes, we map these unique names to their implementation and use them for storing session data.

The implementation for the session drivers is stored in a singleton collection called `driversList`. Therefore, if you create a custom driver, you must register it with this collection.

The code for registering a driver must be written inside a service provider so you can use the IoC container to look up dependencies the session driver might need.

```ts
import { ApplicationService } from '@adonisjs/core/types'
import { driversList } from '@adonisjs/session'

export default class AppProvider {
  constructor(protected app: ApplicationService) {
  }

  async boot() {
    const sessionConfig = this.app.config.get<any>('session')

    /**
     * Register the driver only when the app is using it
     */
    if (sessionConfig.driver === 'mongodb') {
      const { MongoDBDriver } = await import('./mongodb_driver.js')
      driversList.extend('mongodb', (config, ctx) => {
        return new MongoDBDriver(config.mongodb)
      })
    }
  }
}
```

The `driversList.extend` accepts a unique name for the driver and a callback method that returns an instance of the driver class. The callback method receives the following two parameters.

- `config`: Reference to the session config stored inside the `config/session.ts` file.
- `ctx`: Reference to the [HTTP context](./http_context.md).

If your driver needs additional dependencies, you can resolve them from the container as follows.

```ts
async boot() {
  const encryption = await this.app.container.make('encryption')

  driversList.extend('mongodb', (config, ctx) => {
    return new MongoDBDriver(config.mongodb, encryption)
  })
}
```

### Registering driver types
You must notify the TypeScript compiler about the newly added driver and its types. The types must be registered with the `SessionDriversList` interface.

You can write the following code at the top of the service provider file.

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { MongoDBDriver, MongoDBConfig } from './mongodb_driver.js'

declare module '@adonisjs/session/types' {
  interface SessionDriversList {
    mongodb: (config: SessionConfig, ctx: HttpContext) => MongoDBDriver
  }

  /**
   * Update SessionConfig type to also accept the config for
   * the mongodb driver.
   */
  interface SessionConfig {
    mongodb?: MongoDBConfig
  }
}
```

### Driver implementation
A session driver must implement the `SessionDriverContract` interface.

```ts
import {
  SessionData,
  SessionDriverContract,
} from '@adonisjs/session/types'

export type MongoDBConfig = {}

export class MongoDBDriver implements SessionDriverContract {
  constructor(public config: MongoDBConfig) {
  }

  /**
   * Returns the session data for a session id. The method
   * must return null or an object of key-value pair
   */
  async read(sessionId: string): Promise<SessionData | null> {
  }

  /**
   * Save the session data against the provided session id
   */
  async write(sessionId: string, data: SessionData): Promise<void> {
  }

  /**
   * Delete session data for the given session id
   */
  async destroy(sessionId: string): Promise<void> {
  }

  /**
   * Reset the session expiry
   */
  async touch(sessionId: string): Promise<void> {
  }
}
```

The `write` method receives the session data as an object, and you might have to convert it to a string before saving it. You can use any serialization package for the same or the [MessageBuilder](../digging_deeper/helpers.md#message-builder) helper provided by the AdonisJS helpers module. For inspiration, please consult the official [session drivers](https://github.com/adonisjs/session/blob/next/src/drivers/redis.ts).


## Using the driver
Once the driver has been registered with the `driversList` collection, you can use its name within the config file as follows.

```ts
// title: config/session.ts
export default defineConfig({
  mongodb: {
    // config goes here
  }
})
```
