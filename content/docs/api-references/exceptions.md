# Exceptions reference

In this guide we will go through the list of known exceptions raised by the framework core and the official packages. Some of the exceptions are marked as **self-handled**. [Self-handled exceptions](../basics/exception_handling.md#defining-the-handle-method) can convert themselves to an HTTP response.

<div style="--prose-h2-font-size: 22px;">

## E_ROUTE_NOT_FOUND
The exception is raised when the HTTP server receives a request for a non-existing route. By default, the client will get a 404 response, and optionally, you may render an HTML page using [status pages](../basics/exception_handling.md#status-pages).

- **Status code**: 404
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_ROUTE_NOT_FOUND) {
  // handle error
}
```

## E_AUTHORIZATION_FAILURE
The exception is raised when a bouncer authorization check fails. The exception is self-handled and [uses content-negotiation](../security/authorization.md#throwing-authorizationexception) to return an appropriate error response to the client.

- **Status code**: 403
- **Self handled**: Yes
- **Translation identifier**: `errors.E_AUTHORIZATION_FAILURE`

```ts
import { errors as bouncerErrors } from '@adonisjs/bouncer'
if (error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE) {
}
```

## E_TOO_MANY_REQUESTS
<<<<<<<< HEAD:content/docs/references/exceptions.md
The exception is raised by the [@adonisjs/rate-limiter](../security/rate_limiting.md) package when a request exhausts all the requests allowed during a given duration. The exception is self-handled and [uses content-negotiation](../security/rate_limiting.md#handling-throttleexception) to return an appropriate error response to the client.
========
The exception is raised by the [@adonisjs/rate-limiter](../../security/rate_limiting) package when a request exhausts all the requests allowed during a given duration. The exception is self-handled and [uses content-negotiation](../../security/rate_limiting#handling-throttleexception) to return an appropriate error response to the client.
>>>>>>>> a7aa500 (docs: first draft of new structure):content/docs/api-references/exceptions.md

- **Status code**: 429
- **Self handled**: Yes
- **Translation identifier**: `errors.E_TOO_MANY_REQUESTS`

```ts
import { errors as limiterErrors } from '@adonisjs/limiter'
if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) {
}
```

## E_BAD_CSRF_TOKEN
<<<<<<<< HEAD:content/docs/references/exceptions.md
The exception is raised when a form using [CSRF protection](../security/securing_ssr_applications.md#csrf-protection) is submitted without the CSRF token, or the CSRF token is invalid.
========
The exception is raised when a form using [CSRF protection](../../security/securing_ssr_applications#csrf-protection) is submitted without the CSRF token, or the CSRF token is invalid.
>>>>>>>> a7aa500 (docs: first draft of new structure):content/docs/api-references/exceptions.md

- **Status code**: 403
- **Self handled**: Yes
- **Translation identifier**: `errors.E_BAD_CSRF_TOKEN`

```ts
import { errors as shieldErrors } from '@adonisjs/shield'
if (error instanceof shieldErrors.E_BAD_CSRF_TOKEN) {
}
```

The `E_BAD_CSRF_TOKEN` exception is [self-handled](https://github.com/adonisjs/shield/blob/main/src/errors.ts#L20), and the user will be redirected back to the form, and you can access the error using the flash messages.

```edge
@error('E_BAD_CSRF_TOKEN')
  <p>{{ message }}</p>
@end
```

## E_OAUTH_MISSING_CODE
The `@adonisjs/ally` package raises the exception when the OAuth service does not provide the OAuth code during the redirect.

<<<<<<<< HEAD:content/docs/references/exceptions.md
You can avoid this exception if you [handle the errors](../authentication/social_authentication.md#handling-callback-response) before calling the `.accessToken` or `.user` methods.
========
You can avoid this exception if you [handle the errors](../../authentication/social_authentication#handling-callback-response) before calling the `.accessToken` or `.user` methods.
>>>>>>>> a7aa500 (docs: first draft of new structure):content/docs/api-references/exceptions.md

- **Status code**: 500
- **Self handled**: No

```ts
import { errors as allyErrors } from '@adonisjs/bouncer'
if (error instanceof allyErrors.E_OAUTH_MISSING_CODE) {
}
```

## E_OAUTH_STATE_MISMATCH
The `@adonisjs/ally` package raises the exception when the CSRF state defined during the redirect is missing.

<<<<<<<< HEAD:content/docs/references/exceptions.md
You can avoid this exception if you [handle the errors](../authentication/social_authentication.md#handling-callback-response) before calling the `.accessToken` or `.user` methods.
========
You can avoid this exception if you [handle the errors](../../authentication/social_authentication#handling-callback-response) before calling the `.accessToken` or `.user` methods.
>>>>>>>> a7aa500 (docs: first draft of new structure):content/docs/api-references/exceptions.md

- **Status code**: 400
- **Self handled**: No

```ts
import { errors as allyErrors } from '@adonisjs/bouncer'
if (error instanceof allyErrors.E_OAUTH_STATE_MISMATCH) {
}
```

## E_UNAUTHORIZED_ACCESS
The exception is raised when one of the authentication guards is not able to authenticate the request. The exception is self-handled and uses [content-negotiation](../authentication/session_guard.md#handling-authentication-exception) to return an appropriate error response to the client.

- **Status code**: 401
- **Self handled**: Yes
- **Translation identifier**: `errors.E_UNAUTHORIZED_ACCESS`

```ts
import { errors as authErrors } from '@adonisjs/auth'
if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
}
```

## E_INVALID_CREDENTIALS
The exception is raised when the auth finder is not able to verify the user credentials. The exception is handled and use [content-negotiation](../authentication/verifying_user_credentials.md#handling-exceptions)  to return an appropriate error response to the client.

- **Status code**: 400
- **Self handled**: Yes
- **Translation identifier**: `errors.E_INVALID_CREDENTIALS`

```ts
import { errors as authErrors } from '@adonisjs/auth'
if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
}
```

## E_CANNOT_LOOKUP_ROUTE
The exception is raised when you attempt to create a URL for a route using the [URL builder](../basics/routing.md#url-builder).

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_CANNOT_LOOKUP_ROUTE) {
  // handle error
}
```

## E_HTTP_EXCEPTION
The `E_HTTP_EXCEPTION` is a generic exception for throwing errors during an HTTP request. You can use this exception directly or create a custom exception extending it.

- **Status code**: Defined at the time of raising the exception
- **Self handled**: Yes

```ts
// title: Throw exception
import { errors } from '@adonisjs/core'

throw errors.E_HTTP_EXCEPTION.invoke(
  {
    errors: ['Cannot process request']
  },
  422
)
```

```ts
// title: Handle exception
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_HTTP_EXCEPTION) {
  // handle error
}
```

## E_HTTP_REQUEST_ABORTED
The `E_HTTP_REQUEST_ABORTED` is a sub-class of the `E_HTTP_EXCEPTION` exception. This exception is raised by the [response.abort](../basics/response.md#aborting-request-with-an-error) method.

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_HTTP_REQUEST_ABORTED) {
  // handle error
}
```

## E_INSECURE_APP_KEY
The exception is raised when the length of `appKey` is smaller than 16 characters. You can use the [generate:key](commands.md#generatekey) ace command to generate a secure app key.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INSECURE_APP_KEY) {
  // handle error
}
```

## E_MISSING_APP_KEY
The exception is raised when the `appKey` property is not defined inside the `config/app.ts` file. By default, the value of the `appKey` is set using the `APP_KEY` environment variable.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_APP_KEY) {
  // handle error
}
```

## E_INVALID_ENV_VARIABLES
The exception is raised when one or more environment variables fail the validation. The detailed validation errors can be accessed using the `error.help` property.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INVALID_ENV_VARIABLES) {
  console.log(error.help)
}
```

## E_MISSING_COMMAND_NAME
The exception is raised when a command does not define the `commandName` property or its value is an empty string.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_COMMAND_NAME) {
  console.log(error.commandName)
}
```

## E_COMMAND_NOT_FOUND
The exception is raised by Ace when unable to find a command.

- **Status code**: 404
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_COMMAND_NOT_FOUND) {
  console.log(error.commandName)
}
```

## E_MISSING_FLAG
The exception is raised when executing a command without passing a required CLI flag.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_FLAG) {
  console.log(error.commandName)
}
```

## E_MISSING_FLAG_VALUE
The exception is raised when trying to execute a command without providing any value to a non-boolean CLI flag.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_FLAG_VALUE) {
  console.log(error.commandName)
}
```

## E_MISSING_ARG
The exception is raised when executing a command without defining the required arguments.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_ARG) {
  console.log(error.commandName)
}
```

## E_MISSING_ARG_VALUE
The exception is raised when executing a command without defining the value for a required argument.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_MISSING_ARG_VALUE) {
  console.log(error.commandName)
}
```

## E_UNKNOWN_FLAG
The exception is raised when executing a command with an unknown CLI flag.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_UNKNOWN_FLAG) {
  console.log(error.commandName)
}
```

## E_INVALID_FLAG
The exception is raised when the value provided for a CLI flag is invalid—for example, passing a string value to a flag that accepts numeric values.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors } from '@adonisjs/core'
if (error instanceof errors.E_INVALID_FLAG) {
  console.log(error.commandName)
}
```

## E_MULTIPLE_REDIS_SUBSCRIPTIONS
The `@adonisjs/redis` package raises the exception when you attempt to [subscribe to a given pub/sub channel](../database/redis.md#pubsub) multiple times.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors as redisErrors } from '@adonisjs/redis'
if (error instanceof redisErrors.E_MULTIPLE_REDIS_SUBSCRIPTIONS) {
}
```

## E_MULTIPLE_REDIS_PSUBSCRIPTIONS
The `@adonisjs/redis` package raises the exception when you attempt to [subscribe to a given pub/sub pattern](../database/redis.md#pubsub) multiple times.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors as redisErrors } from '@adonisjs/redis'
if (error instanceof redisErrors.E_MULTIPLE_REDIS_PSUBSCRIPTIONS) {
}
```

## E_MAIL_TRANSPORT_ERROR
The exception is raised by the `@adonisjs/mail` package when unable to send the email using a given transport. Usually, this will happen when the HTTP API of the email service returns a non-200 HTTP response.

You may access the network request error using the `error.cause` property. The `cause` property is the [error object](https://github.com/sindresorhus/got/blob/main/documentation/8-errors.md) returned by `got` (npm package).

- **Status code**: 400
- **Self handled**: No

```ts
import { errors as mailErrors } from '@adonisjs/redis'
if (error instanceof mailErrors.E_MAIL_TRANSPORT_ERROR) {
  console.log(error.cause)
}
```

## E_SESSION_NOT_MUTABLE
The exception is raised by the `@adonisjs/session` package when the session store is initiated in the read-only mode. 

- **Status code**: 500
- **Self handled**: No

```ts
import { errors as sessionErrors } from '@adonisjs/session'
if (error instanceof sessionErrors.E_SESSION_NOT_MUTABLE) {
  console.log(error.message)
}
```

## E_SESSION_NOT_MUTABLE
The exception is raised by the `@adonisjs/session` package when the session store is initiated in the read-only mode.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors as sessionErrors } from '@adonisjs/session'
if (error instanceof sessionErrors.E_SESSION_NOT_MUTABLE) {
  console.log(error.message)
}
```

## E_SESSION_NOT_READY
The exception is raised by the `@adonisjs/session` package when the session store has not been initiated yet. This will be the case when you are not using the session middleware.

- **Status code**: 500
- **Self handled**: No

```ts
import { errors as sessionErrors } from '@adonisjs/session'
if (error instanceof sessionErrors.E_SESSION_NOT_READY) {
  console.log(error.message)
}
```

</div>
