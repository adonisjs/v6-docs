---
summary: Manage user sessions inside your AdonisJS application using the @adonisjs/session package. 
---

# Session

You can manage user sessions inside your AdonisJS application using the `@adonisjs/session` package. The session package provides a unified API for storing session data across different storage providers. 

**Following is the list of the bundled stores.**

- `cookie`: The session data is stored inside an encrypted cookie. The cookie store works great with multi-server deployments since the data is stored with the client.

- `file`: The session data is saved inside a file on the server. The file store can only scale to multi-server deployments if you implement sticky sessions with the load balancer.

- `redis`: The session data is stored inside a Redis database. The redis store is recommended for apps with large volumes of session data and can scale to multi-server deployments.

- `dynamodb`: The session data is stored inside an Amazon DynamoDB table. The DynamoDB store is suitable for applications that require a highly scalable and distributed session store, especially when the infrastructure is built on AWS.

- `database`: The session data is stored inside a SQL database using Lucid. The database store is a good option if you are already using a SQL database in your application and want to avoid adding an extra dependency like Redis.

- `memory`: The session data is stored within a global memory store. The memory store is used during testing.

Alongside the inbuilt backend stores, you can also create and [register custom session stores](#creating-a-custom-session-store).

## Installation

Install and configure the package using the following command :

```sh
node ace add @adonisjs/session
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `@adonisjs/session` package using the detected package manager.

2. Registers the following service provider and command inside the `adonisrc.ts` file.

    ```ts
    {
      commands: [
        // ...other commands
        () => import('@adonisjs/session/commands')
      ],
      providers: [
        // ...other providers
        () => import('@adonisjs/session/session_provider')
      ]
    }
    ```

3. Create the `config/session.ts` file.

4. Define the following environment variables and their validations. 

    ```dotenv
    SESSION_DRIVER=cookie
    ```

5. Registers the following middleware inside the `start/kernel.ts` file.

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

The cookie name is used to store the session ID. Feel free to rename it.

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

The `age` property controls the validity of session data without user activity. After the given duration, the session data is considered expired.

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

Define the store you want to use to store the session data. It can be a fixed value or read from the environment variables.

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
  store: env.get('SESSION_DRIVER'),

  // highlight-start
  stores: {
    cookie: stores.cookie(),

    file: stores.file({
      location: app.tmpPath('sessions')
    }),

    redis: stores.redis({
      connection: 'main'
    })

    dynamodb: stores.dynamodb({
      clientConfig: {}
    }),

    database: stores.database({
      connectionName: 'postgres',
      tableName: 'sessions',
    }),
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

<dt>

  stores.dynamodb

</dt>

<dd>

Define the configuration for the `dynamodb` store. You may either pass the [DynamoDB config](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-dynamodb/Interface/DynamoDBClientConfig/) via the `clientConfig` property or pass an instance of the DynamoDB as the `client` property.

```ts
// title: With client config
stores.dynamodb({
  clientConfig: {
    region: 'us-east-1',
    endpoint: '<database-endpoint>',
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    }
  },
})
```

```ts
// title: With client instance
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
const client = new DynamoDBClient({})

stores.dynamodb({
  client,
})
```

Additionally, you may define a custom table name and key attribute name.

```ts
stores.dynamodb({
  tableName: 'Session'
  keyAttribute: 'key'
})
```

</dd>

<dt>

  stores.database

</dt>

<dd>

Define the configuration for the `database` store. The method optionally accepts the `connectionName` to use and the `tableName` for storing session data.

Make sure to first install and configure the [@adonisjs/lucid](../database/lucid.md) package before using the `database` store.

You must also create the sessions table inside your database. You can use the following command to create the migration file.

```sh
node ace make:session-table
```

```ts
stores.database({
  connectionName: 'postgres',
  tableName: 'sessions',
  gcProbability: 2,
})
```

Unlike Redis which handles expiration automatically, SQL databases require manual cleanup of expired sessions. The database store implements a probabilistic garbage collection: on each request, there is a `gcProbability` percent chance (default: **2%**) that expired sessions will be deleted from the database.

Set `gcProbability` to `0` to disable automatic garbage collection entirely. In this case, you should set up a scheduled task to periodically clean up expired sessions.

#### Adding tagging support to an existing database

If you have an existing sessions table and want to use [session tagging](#session-tagging), you need to add the `user_id` column. Create a new migration:

```sh
node ace make:migration add_user_id_to_sessions
```

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sessions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('user_id').nullable().index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('user_id')
    })
  }
}
```

</dd>

</dl>

---

### Updating environment variables validation
If you decide to use session stores other than the default one, make sure to also update the environment variables validation for the `SESSION_DRIVER` environment variable.

We configure the `cookie`, the `redis`, and the `dynamodb` stores in the following example. Therefore, we should also allow the `SESSION_DRIVER` environment variable to be one of them.

```ts
import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  // highlight-start
  store: env.get('SESSION_DRIVER'),

  stores: {
    cookie: stores.cookie(),
    redis: stores.redis({
      connection: 'main'
    })
  }
  // highlight-end
})
```

```ts
// title: start/env.ts
{
  SESSION_DRIVER: Env.schema.enum(['cookie', 'redis', 'memory'] as const)
}
```

## Basic example
Once the session package has been registered, you can access the `session` property from the [HTTP Context](../concepts/http_context.md). The session property exposes the API for reading and writing data to the session store.

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
The following is the list of methods you can use to interact with the data from the `session` object.

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

On every subsequent request, we update the `maxAge` property of the session ID cookie to ensure it doesn't expire. The session store is also notified about the changes (if any) to update and persist them.

You can access the unique session ID using the `sessionId` property. A visitor's session ID remains the same until it expires.

```ts
console.log(session.sessionId)
```

### Re-generating session id
Re-generating session ID helps prevent a [session fixation](https://owasp.org/www-community/attacks/Session_fixation) attack in your application. You must re-generate the session ID when associating an anonymous session with a logged-in user.

The `@adonisjs/auth` package automatically re-generates the session ID, so you do not have to do it manually.

```ts
/**
 * New session ID will be assigned at
 * the end of the request
 */
session.regenerate()
```

## Session tagging
Session tagging allows you to link a session to a user ID. This is useful for implementing features like:

- **Logout from all devices**: Destroy all sessions associated with a user.
- **Active sessions list**: Display all active sessions to the user in their account settings.

:::note
Session tagging is only supported by the `redis`, `database`, and `memory` stores. Attempting to use tagging with `cookie`, `file`, or `dynamodb` stores will throw an error.
:::

### Tagging the current session
You can tag the current session with a user ID using the `session.tag` method. This is typically done after a user logs in.

```ts
import router from '@adonisjs/core/services/router'

router.post('/login', async ({ auth, session }) => {
  const user = await auth.use('web').login(email, password)

  // highlight-start
  // Tag the session with the user ID
  await session.tag(String(user.id))
  // highlight-end
})
```

## SessionCollection
The `SessionCollection` class provides APIs for programmatic session management outside of an HTTP request context. It allows you to read, destroy, and tag sessions by their ID.

### Creating an instance
You must obtain the `SessionCollection` instance through the container to ensure proper configuration injection.

```ts
import app from '@adonisjs/core/services/app'
import { SessionCollection } from '@adonisjs/session'

const sessionCollection = await app.container.make(SessionCollection)
```

### Available methods

```ts
// Get session data by ID
const data = await sessionCollection.get(sessionId)

// Destroy a session by ID
await sessionCollection.destroy(sessionId)

// Tag a session with a user ID
await sessionCollection.tag(sessionId, userId)

// Get all sessions for a user
const sessions = await sessionCollection.tagged(userId)
// Returns: Array<{ id: string, data: SessionData }>

// Check if the current store supports tagging
const supportsTagging = sessionCollection.supportsTagging()
```

### List active sessions
Here is an example of listing all active sessions for a user in their account settings page.

```ts
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'
import { SessionCollection } from '@adonisjs/session'

router.get('/account/sessions', async ({ auth, session, view }) => {
  const user = auth.user!
  const sessionCollection = await app.container.make(SessionCollection)

  // highlight-start
  const sessions = await sessionCollection.tagged(String(user.id))

  // Mark the current session
  const sessionsWithCurrent = sessions.map((tagged) => ({
    ...tagged,
    isCurrent: tagged.id === session.sessionId,
  }))
  // highlight-end

  return view.render('account/sessions', { sessions: sessionsWithCurrent })
})
```

### Logout from all other devices
Here is a complete example of implementing a "Logout from all other devices" feature.

```ts
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'
import { SessionCollection } from '@adonisjs/session'

router.post('/logout-other-devices', async ({ auth, session, response }) => {
  const user = auth.user!
  const sessionCollection = await app.container.make(SessionCollection)

  // highlight-start
  const sessions = await sessionCollection.tagged(String(user.id))

  for (const s of sessions) {
    if (s.id !== session.sessionId) {
      await sessionCollection.destroy(s.id)
    }
  }
  // highlight-end

  return response.redirect().back()
})
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

- We access the value of the `title` input field using the [`old` method](../references/edge.md#old).
- And access the error message using the [`@inputError` tag](../references/edge.md#inputerror).

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

Instead of manually reading the request data and storing it in the flash messages, you can use one of the following methods to flash form data.

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

Finally, you can reflash the current flash messages using the `session.reflash` method.

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

See also: [Edge helpers reference](../references/edge.md#flashmessages)

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
Please check the [events reference guide](../references/events.md#sessioninitiated) to view the list of events dispatched by the `@adonisjs/session` package.

## Creating a custom session store
Session stores must implement the [SessionStoreContract](https://github.com/adonisjs/session/blob/main/src/types.ts#L23C18-L23C38) interface and define the following methods.

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

The `write` method receives the session data as an object, and you might have to convert it to a string before saving it. You can use any serialization package for the same or the [MessageBuilder](../references/helpers.md#message-builder) helper provided by the AdonisJS helpers module. For inspiration, please consult the official [session stores](https://github.com/adonisjs/session/blob/main/src/stores/redis.ts#L59).
