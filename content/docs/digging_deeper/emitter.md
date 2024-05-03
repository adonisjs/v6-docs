# Event Emitter

AdonisJS has an inbuilt event emitter created on top of [emittery](https://github.com/sindresorhus/emittery). Emittery dispatches events asynchronously and [fixes many common issues](https://github.com/sindresorhus/emittery#how-is-this-different-than-the-built-in-eventemitter-in-nodejs) with the Node.js default Event emitter.

AdonisJS further enhances emittery with additional features.

- Provide static type safety by defining a list of events and their associated data types.
- Support for class-based events and listeners. Moving listeners to dedicated files keep your codebase tidy and easy to test.
- Ability to fake events during tests.

## Basic usage

The event listeners are defined inside the `start/events.ts` file. You may create this file using the `make:preload` ace command.

```sh
node ace make:preload events
```

You must use the `emitter.on` to listen to an event. The method accepts the event's name as the first argument and the listener as the second argument.

```ts
// title: start/events.ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('user:registered', function (user) {
  console.log(user)
})
```

Once you have defined the event listener, you can emit the `user:registered` event using the `emitter.emit` method. It takes the event name as the first argument and the event data as the second argument.

```ts
import emitter from '@adonisjs/core/services/emitter'

export default class UsersController {
  async store() {
    const user = await User.create(data)
    emitter.emit('user:registered', user)
  }
}
```

You may use the `emitter.once` to listen to an event once.

```ts
emitter.once('user:registered', function (user) {
  console.log(user)
})
```

## Making events type-safe

AdonisJS makes it mandatory to define static types for every event you want to emit within your application. The types are registered within the `types/events.ts` file.

In the following example, we register the `User` model as the data type for the `user:registered` event.


:::note

If you find defining types for every event cumbersome, you may switch to [class-based events](#class-based-events).


:::


```ts
import User from '#models/User'

declare module '@adonisjs/core/types' {
  interface EventsList {
    'user:registered': User
  }
}
```

## Class-based listeners

Like HTTP controllers, listener classes offer an abstraction layer to move inline event listeners inside dedicated files. Listener classes are stored inside the `app/listeners` directory and you may create a new listener using the `make:listener` command.

See also: [Make listener command](../api-references/commands.md#makelistener)

```sh
node ace make:listener sendVerificationEmail
```

The listener file is scaffolded with the `class` declaration and `handle` method. In this class, you can define additional methods to listen to multiple events (if needed).

```ts
import User from '#models/user'

export default class SendVerificationEmail {
  handle(user: User) {
    // Send email
  }
}
```

As the final step, you must bind the listener class to an event within the `start/events.ts` file. You may import the listener using the `#listeners` alias. The aliases are defined using the [subpath imports feature of Node.js](../getting_started/folder_structure.md#the-sub-path-imports).

```ts
// title: start/events.ts
import emitter from '@adonisjs/core/services/emitter'
import SendVerificationEmail from '#listeners/send_verification_email'

emitter.on('user:registered', [SendVerificationEmail, 'handle'])
```

### Lazy-loading listeners

It is recommended to lazy load listeners to speed up the application boot phase. Lazy loading is as simple as moving the import statement behind a function and using dynamic imports.

```ts
import emitter from '@adonisjs/core/services/emitter'
// delete-start
import SendVerificationEmail from '#listeners/send_verification_email'
// delete-end
// insert-start
const SendVerificationEmail = () => import('#listeners/send_verification_email')
// insert-end

emitter.on('user:registered', [SendVerificationEmail, 'handle'])
```

### Dependency injection

:::warning

You cannot inject the `HttpContext` inside a listener class. Because events are processed asynchronously, the listener might run after the HTTP request is finished.


:::

The listener classes are instantiated using the [IoC container](../concepts/dependency_injection.md); therefore, you can type-hint dependencies inside the class constructor or the method which handles the event.

In the following example, we type-hint the `TokensService` as a constructor argument. When invoking this listener, the IoC container will inject an instance of the `TokensService` class.

```ts
// title: Constructor injection
import { inject } from '@adonisjs/core'
import TokensService from '#services/tokens_service'

@inject()
export default class SendVerificationEmail {
  constructor(protected tokensService: TokensService) {}

  handle(user: User) {
    const token = this.tokensService.generate(user.email)
  }
}
```

In the following example, we inject the `TokensService` inside the handle method. However, do remember, the first argument will always be the event payload.

```ts
// title: Method injection
import { inject } from '@adonisjs/core'
import TokensService from '#services/tokens_service'

export default class SendVerificationEmail {
  @inject()
  handle(user: User, tokensService: TokensService) {
    const token = tokensService.generate(user.email)
  }
}
```

## Class-based events

An event is a combination of the event identifier (usually a string-based event name) and the associated data. For example:

- `user:registered` is the event identifier (aka the event name).
- An instance of the User model is the event data.

Class-based events encapsulate the event identifier and the event data within the same class. The class constructor serves as the identifier, and an instance of the class holds the event data.

You may create an event class using the `make:event` command.

See also: [Make event command](../api-references/commands.md#makeevent)

```sh
node ace make:event UserRegistered
```

The event class has no behavior. Instead, it is a data container for the event. You may accept event data via the class constructor and make it available as an instance property.
 
```ts
// title: app/events/user_registered.ts
import { BaseEvent } from '@adonisjs/core/events'
import User from '#models/user'

export default class UserRegistered extends BaseEvent {
  constructor(public user: User) {} 
}
```

### Listening to class-based events

You may attach listeners for class-based events using the `emitter.on` method. The first argument is the event class reference, followed by the listener.

```ts
import emitter from '@adonisjs/core/services/emitter'
import UserRegistered from '#events/user_registered'

emitter.on(UserRegistered, function (event) {
  console.log(event.user)
})
```

In the following example, we use both class-based events and listeners.

```ts
import emitter from '@adonisjs/core/services/emitter'

import UserRegistered from '#events/user_registered'
const SendVerificationEmail = () => import('#listeners/send_verification_email')

emitter.on(UserRegistered, [SendVerificationEmail])
```

### Emitting class-based events

You may emit a class-based event using the `static dispatch` method. The `dispatch` method takes arguments accepted by the event class constructor.

```ts
import User from '#models/user'
import UserRegistered from '#events/user_registered'

export default class UsersController {
  async store() {
    const user = await User.create(data)
    
    /**
     * Dispatch/emit the event
     */
    UserRegistered.dispatch(user)
  }
}
```

## Simplifying events listening experience

If you decide to use class-based events and listeners, you may use the `emitter.listen` method to simplify the process of binding listeners. 

The `emitter.listen` method accepts the event class as the first argument and an array of class-based listeners as the second argument. In addition, the registered listener must have a `handle` method to handle the event.

```ts
import emitter from '@adonisjs/core/services/emitter'
import UserRegistered from '#events/user_registered'

emitter.listen(UserRegistered, [
  () => import('#listeners/send_verification_email'),
  () => import('#listeners/register_with_payment_provider'),
  () => import('#listeners/provision_account')
])
```

## Handling errors
By default, the exceptions raised by the listeners will result in [unhandledRejection](https://nodejs.org/api/process.html#event-unhandledrejection). Therefore, it is recommended to self capture and handle the error using the `emitter.onError` method.

The `emitter.onError` method accepts a callback which receives the event name, error, and event data.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.onError((event, error, eventData) => {
})
```

## Listening to all events

You can listen to all the events using the `emitter.onAny` method. The method accepts the listener callback as the only parameter.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.onAny((name, event) => {
  console.log(name)
  console.log(event)
})
```

## Unsubscribing from events

The `emitter.on` method returns an unsubscribe function you may call to remove the event listener subscription.

```ts
import emitter from '@adonisjs/core/services/emitter'

const unsubscribe = emitter.on('user:registered', () => {})

// Remove the listener
unsubscribe()
```

You may also use the `emitter.off` method to remove the event listener subscription. The method accepts the event name/class as the first argument and a reference to the listener as the second argument.

```ts
import emitter from '@adonisjs/core/services/emitter'

function sendEmail () {}

// Listen for event
emitter.on('user:registered', sendEmail)

// Remove listener
emitter.off('user:registered', sendEmail)
```

### emitter.offAny

The `emitter.offAny` removes a wildcard listener, listening for all the events.

```ts
emitter.offAny(callback)
```

### emitter.clearListeners

The `emitter.clearListeners` method removes all the listeners for a given event.

```ts
//String-based event
emitter.clearListeners('user:registered')

//Class-based event
emitter.clearListeners(UserRegistered)
```

### emitter.clearAllListeners

The `emitter.clearAllListeners` method removes all the listeners for all the events.

```ts
emitter.clearAllListeners()
```

## List of available events
Please check the [events reference guide](../api-references/events.md) to view the list of available events.

## Faking events during tests

Event listeners are often used for performing side effects after a given action. For example: Send an email to a newly registered user, or send a notification after an order status update.

When writing tests, you might want to avoid sending emails to the user created during the test.

You may disable event listeners by faking the event emitter. In the following example, we call `emitter.fake` before making an HTTP request to signup a user. After the request, we use the `events.assertEmitted` method to ensure that the `SignupController` emits a specific event.

```ts
import emitter from '@adonisjs/core/services/emitter'
import UserRegistered from '#events/user_registered'

test.group('User signup', () => {
  test('create a user account', async ({ client, cleanup }) => {
    // highlight-start
    const events = emitter.fake()
    cleanup(() => {
      emitter.restore()
    })
    // highlight-end
  
    await client
      .post('signup')
      .form({
        email: 'foo@bar.com',
        password: 'secret',
      })
  })
  
  // highlight-start
  // Assert the event was emitted
  events.assertEmitted(UserRegistered)
  // highlight-end
})
```

- The `event.fake` method returns an instance of the [EventBuffer](https://github.com/adonisjs/events/blob/main/src/events_buffer.ts) class, and you may use it for assertions and finding emitted events.
- The `emitter.restore` method restores the fake. After restoring the fake, the events will be emitted normally.

### Faking specific events

The `emitter.fake` method fakes all the events if you invoke the method without any arguments. If you want to fake a specific event, pass the event name or the class as the first argument.

```ts
// Fakes only the user:registered event
emitter.fake('user:registered')

// Fake multiple events
emitter.fake([UserRegistered, OrderUpdated])
```

Calling the `emitter.fake` method multiple times will remove the old fakes.

### Events assertions
You may use `assertEmitted`, `assertNotEmitted`, `assertNoneEmitted` and the `assertEmittedCount` methods to write assertions for faked events.

The `assertEmitted` and `assertNotEmitted` methods accepts either the event name or the class constructor as the first argument and an optional finder function that must return a boolean to mark the event as emitted.

```ts
const events = emitter.fake()

events.assertEmitted('user:registered')
events.assertNotEmitted(OrderUpdated)
```

```ts
// title: With a callback
events.assertEmitted(OrderUpdated, ({ data }) => {
  /**
   * Only consider the event as emitted, if
   * the orderId matches
   */
  return data.order.id === orderId
})
```

```ts
// title: Asserting events count
// Assert count of a specific event
events.assertEmittedCount(OrderUpdated, 1)

// Assert no events were emitted
events.assertNoneEmitted()
```
