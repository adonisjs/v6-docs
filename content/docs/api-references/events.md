---
summary: Learn about the events dispatched by the AdonisJS core and official packages.
---

# Events reference

In this guide, we look at the list of events dispatched by the framework core and the official packages. Check out the [emitter](../digging_deeper/emitter.md) documentation to learn more about its usage.

## http\:request_completed

The [`http:request_completed`](https://github.com/adonisjs/http-server/blob/main/src/types/server.ts#L65) event is dispatched after an HTTP request is completed. The event contains an instance of the [HttpContext](../concepts/http_context.md) and the request duration. The `duration` value is the output of the `process.hrtime` method.

```ts
import emitter from '@adonisjs/core/services/emitter'
import string from '@adonisjs/core/helpers/string'

emitter.on('http:request_completed', (event) => {
  const method = event.ctx.request.method()
  const url = event.ctx.request.url(true)
  const duration = event.duration

  console.log(`${method} ${url}: ${string.prettyHrTime(duration)}`)
})
```

## http\:server_ready
The event is dispatched once the AdonisJS HTTP server is ready to accept incoming requests.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('http:server_ready', (event) => {
  console.log(event.host)
  console.log(event.port)

  /**
   * Time it took to boot the app and start
   * the HTTP server.
   */
  console.log(event.duration)
})
```

## container_binding\:resolved

The event is dispatched after the IoC container resolves a binding or constructs a class instance. The `event.binding` property will be a string (binding name) or a class constructor, and the `event.value` property is the resolved value.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('container_binding:resolved', (event) => {
  console.log(event.binding)
  console.log(event.value)
})
```

## session\:initiated
The `@adonisjs/session` package emits the event when the session store is initiated during an HTTP request. The `event.session` property is an instance of the [Session class](https://github.com/adonisjs/session/blob/main/src/session.ts).

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:initiated', (event) => {
  console.log(`Initiated store for ${event.session.sessionId}`)
})
```

## session\:committed
The `@adonisjs/session` package emits the event when the session data is written to the session store during an HTTP request.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:committed', (event) => {
  console.log(`Persisted data for ${event.session.sessionId}`)
})
```

## session\:migrated
The `@adonisjs/session` package emits the event when a new session ID is generated using the `session.regenerate()` method.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session:migrated', (event) => {
  console.log(`Migrating data to ${event.toSessionId}`)
  console.log(`Destroying session ${event.fromSessionId}`)
})
```

## i18n\:missing\:translation
The event is dispatched by the `@adonisjs/i18n` package when a translation for a specific key and locale is missing. You may listen to this event to find the missing translations for a given locale.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('i18n:missing:translation', function (event) {
  console.log(event.identifier)
  console.log(event.hasFallback)
  console.log(event.locale)
})
```

## mail\:sending
The `@adonisjs/mail` package emits the event before sending an email. In the case of the `mail.sendLater` method call, the event will be emitted when the mail queue processes the job.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:sending', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail\:sent
After sending the email, the event is dispatched by the `@adonisjs/mail` package.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:sent', (event) => {
  console.log(event.response)

  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail\:queueing
The `@adonisjs/mail` package emits the event before queueing the job to send the email.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:queueing', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## mail\:queued
After the email has been queued, the event is dispatched by the `@adonisjs/mail` package.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:queued', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## queued\:mail\:error
The event is dispatched when the [MemoryQueue](https://github.com/adonisjs/mail/blob/main/src/messengers/memory_queue.ts) implementation of the `@adonisjs/mail` package is unable to send the email queued using the `mail.sendLater` method.

If you are using a custom queue implementation, you must capture the job errors and emit this event.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('queued:mail:error', (event) => {
  console.log(event.error)
  console.log(event.mailerName)
})
```

## session_auth\:login_attempted

The event is dispatched by the [SessionGuard](https://github.com/adonisjs/auth/blob/main/src/guards/session/guard.ts) implementation of the `@adonisjs/auth` package when the `auth.login` method is called either directly or internally by the session guard.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:login_attempted', (event) => {
  console.log(event.guardName)
  console.log(event.user)
})
```

## session_auth\:login_succeeded

The event is dispatched by the [SessionGuard](https://github.com/adonisjs/auth/blob/main/src/guards/session/guard.ts) implementation of the `@adonisjs/auth` package after a user has been logged in successfully. 

You may use this event to track sessions associated with a given user.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:login_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)
  console.log(event.user)
  console.log(event.rememberMeToken) // (if created one)
})
```

## session_auth\:authentication_attempted
The event is dispatched by the `@adonisjs/auth` package when an attempt is made to validate the request session and check for a logged-in user.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_attempted', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)
})
```

## session_auth\:authentication_succeeded
The event is dispatched by the `@adonisjs/auth` package after the request session has been validated and the user is logged in. You may access the logged-in user using the `event.user` property.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  console.log(event.user)
  console.log(event.rememberMeToken) // if authenticated using token
})
```

## session_auth\:authentication_failed
The event is dispatched by the `@adonisjs/auth` package when the authentication check fails, and the user is not logged in during the current HTTP request.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:authentication_failed', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  console.log(event.error)
})
```

## session_auth\:logged_out
The event is dispatched by the `@adonisjs/auth` package after the user has been logged out.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('session_auth:logged_out', (event) => {
  console.log(event.guardName)
  console.log(event.sessionId)

  /**
   * The value of the user will be null when logout is called
   * during a request where no user was logged in in the first place.
   */
  console.log(event.user)
})
```

## access_tokens_auth\:authentication_attempted
The event is dispatched by the `@adonisjs/auth` package when an attempt is made to validate the access token during an HTTP request.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_attempted', (event) => {
  console.log(event.guardName)
})
```

## access_tokens_auth\:authentication_succeeded
The event is dispatched by the `@adonisjs/auth` package after the access token has been verified. You may access the authenticated user using the `event.user` property.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_succeeded', (event) => {
  console.log(event.guardName)
  console.log(event.user)
  console.log(event.token)
})
```

## access_tokens_auth\:authentication_failed
The event is dispatched by the `@adonisjs/auth` package when the authentication check fails.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('access_tokens_auth:authentication_failed', (event) => {
  console.log(event.guardName)
  console.log(event.error)
})
```


## authorization\:finished
The event is dispatched by the `@adonisjs/bouncer` package after the authorization check has been performed. The event payload includes the final response you may inspect to know the status of the check.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('authorization:finished', (event) => {
  console.log(event.user)
  console.log(event.response)
  console.log(event.parameters)
  console.log(event.action) 
})
```
