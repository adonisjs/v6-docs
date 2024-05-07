# Transmit

Transmit is a native opinionated Server-Sent-Event (SSE) module built for AdonisJS. It is a simple and efficient way to send real-time updates to the client, such as notifications, live chat messages, or any other type of real-time data.

:::note
The data transmission occurs only from server to client, not the other way around. You have to use a form or a fetch request to achieve client to server communication.
:::

## Installation

Install and configure the package using the following command :

```sh
node ace add @adonisjs/transmit
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `@adonisjs/transmit` package using the detected package manager.
 
2. Registers the `@adonisjs/transmit/transmit_provider` service provider inside the `adonisrc.ts` file.
 
3. Creates a new `transmit.ts` file inside the `config` directory.
 
:::

You will also have to install the Transmit client package to listen for events on the client-side.

```sh
npm install @adonisjs/transmit-client
```

## Configuration

The configuration for the transmit package is stored within the `config/transmit.ts` file.

See also: [Config stub](https://github.com/adonisjs/transmit/blob/main/stubs/config/transmit.stub)

```ts
import { defineConfig } from '@adonisjs/transmit'

export default defineConfig({
  pingInterval: false,
  transport: null
  // routeHandlerModifier(route: Route) {}
})
```

<dl>

<dt>

pingInterval

</dt>

<dd>

The interval used to send ping messages to the client. The value is in milliseconds or using a string `Duration` format (i.e: `10s`). Set to `false` to disable ping messages.

</dd>

<dt>

transport

</dt>

<dd>

Transmit supports syncing events across multiple servers or instances. You can enable the feature by referencing the wanted transport layer (only `redis` is supported for now). Set to `null` to disable syncing.

```ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/transmit'
import { redis } from '@adonisjs/transmit/transports'

export default defineConfig({
  transport: {
    driver: redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD'),
    })
  }
})
```

:::note
Ensure you have `ioredis` installed when using the `redis` transport.
:::

</dd>

<dt>

routeHandlerModifier

</dt>

<dd>

A function that is called before registering transmit routes. It receives the route instance. Use this function to add custom middleware or modify the route handler.

For example, you can use the [`Rate Limiter`](../security/rate_limiting.md) and auth middleware to avoid abuse of some transmit route.

```ts
import { defineConfig } from '@adonisjs/transmit'
import { middleware } from '#start/kernel'
import { throttle } from '#start/limiter'

export default defineConfig({
  routeHandlerModifier(route) {
    // Ensure you are authenticated to register your client
    if (route.getPattern() === '/__transmit/events') {
      route.middleware(middleware.auth())
      return
    }
    
    // Add a throttle middleware to other transmit routes
    route.use(throttle)
  }
})
```

</dd>

</dl>

## Channels

Channels are used to group events. For example, you can have a channel for notifications, another for chat messages, and so on.
They are created on the fly when the client subscribes to them.

### Channel Names

Channel names are used to identify the channel. They are case-sensitive and must be a string. You cannot use any special characters or spaces in the channel name except `/`. The following are some examples of valid channel names:

```ts
import transmit from '@adonisjs/transmit/services/main'

transmit.broadcast('global', { message: 'Hello' })
transmit.broadcast('chats/1/messages', { message: 'Hello' })
transmit.broadcast('users/1', { message: 'Hello' })
```

:::tip
Channel names use the same syntax as route in AdonisJS but are not related to them. You can freely define a http route and a channel with the same key.
:::

### Channel Authorization

You can authorize or reject a connection to a channel using the `authorizeChannel` method. The method receives the channel name and the `HttpContext`. It must return a boolean value.

```ts
// title: start/transmit.ts

import transmit from '@adonisjs/transmit/services/main'
import Chat from '#models/chat'
import type { HttpContext } from '@adonisjs/core/http'

transmit.authorizeChannel<{ id: string }>('users/:id', (ctx: HttpContext, { id }) => {
  return ctx.auth.user?.id === +id
})

transmit.authorizeChannel<{ id: string }>('chats/:id/messages', async (ctx: HttpContext, { id }) => {
  const chat = await Chat.findOrFail(+id)
  
  return ctx.bouncer.allows('accessChat', chat)
})
```

## Broadcasting Events

You can broadcast events to a channel using the `broadcast` method. The method receives the channel name and the data to send.

```ts
import transmit from '@adonisjs/transmit/services/main'

transmit.broadcast('global', { message: 'Hello' })
```

You can also broadcast events to any channel except one using the `broadcastExcept` method. The method receives the channel name, the data to send, and the UID you want to ignore.

```ts
transmit.broadcastExcept('global', { message: 'Hello' }, 'uid-of-sender')
```

### Syncing across multiple servers or instances

By default, broadcasting events works only within the context of an HTTP request. However, you can broadcast events from the background using the `transmit` service if you register a `transport` in your configuration.

The transport layer is responsible for syncing events across multiple servers or instances. It works by broadcasting any events (like broadcasted events, subscriptions, and un-subscriptions) to all connected servers or instances using a `Message Bus`.

The server or instance responsible for your client connection will receive the event and broadcast it to the client.

## Transmit Client

You can listen for events on the client-side using the `@adonisjs/transmit-client` package. The package provides a `Transmit` class. The client use the [`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) API by default to connect to the server.

```ts
import { Transmit } from '@adonisjs/transmit-client'

export const transmit = new Transmit({
  baseUrl: window.location.origin
})
```

:::tip
You should create only one instance of the `Transmit` class and reuse it throughout your application.
:::

### Configuring the Transmit Instance

The `Transmit` class accepts an object with the following properties:

<dl>

<dt>

baseUrl

</dt>

<dd>

The base URL of the server. The URL must include the protocol (http or https) and the domain name.

</dd>

<dt>

uidGenerator

</dt>

<dd>

A function that generates a unique identifier for the client. The function must return a string. It defaults to `crypto.randomUUID`.

</dd>

<dt>

eventSourceFactory

</dt>

<dd>

A function that creates a new `EventSource` instance. It defaults to the WebAPI [`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource). You need to provide a custom implementation if you want to use the client on `Node.js`, `React Native` or any other environment that does not support the `EventSource` API.

</dd>

<dt>

eventTargetFactory 

</dt>

<dd>

A function that creates a new `EventTarget` instance. It defaults to the WebAPI [`EventTarget`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget). You need to provide a custom implementation if you want to use the client on `Node.js`, `React Native` or any other environment that does not support the `EventTarget` API. Return `null` to disable the `EventTarget` API.

</dd>

<dt>

httpClientFactory

</dt>

<dd>

A function that creates a new `HttpClient` instance. It is mainly used for testing purposes.

</dd>

<dt>

beforeSubscribe

</dt>

<dd>

A function that is called before subscribing to a channel. It receives the channel name and the `Request` object sent to the server. Use this function to add custom headers or modify the request object.

</dd>

<dt>

beforeUnsubscribe

</dt>

<dd>

A function that is called before unsubscribing from a channel. It receives the channel name and the `Request` object sent to the server. Use this function to add custom headers or modify the request object.

</dd>

<dt>

maxReconnectAttempts

</dt>

<dd>

The maximum number of reconnection attempts. It defaults to `5`.

</dd>

<dt>

onReconnectAttempt

</dt>

<dd>

A function that is called before each reconnection attempt and receives the number of attempts made so far. Use this function to add custom logic.

</dd>

<dt>

onReconnectFailed

</dt>

<dd>

A function that is called when the reconnection attempts fail. Use this function to add custom logic.

</dd>

<dt>

onSubscribeFailed

</dt>

<dd>

A function that is called when the subscription fails. It receives the `Response` object. Use this function to add custom logic.

</dd>

<dt>

onSubscription

</dt>

<dd>

A function that is called when the subscription is successful. It receives the channel name. Use this function to add custom logic.

</dd>

<dt>

onUnsubscription

</dt>

<dd>

A function that is called when the unsubscription is successful. It receives the channel name. Use this function to add custom logic.

</dd>

</dl>


### Creating a Subscription

You can create a subscription to a channel using the `subscription` method. The method receives the channel name.

```ts
const subscription = transmit.subscription('chats/1/messages')
await subscription.create()
```

The `create` method registers the subscription on the server. It returns a promise that you can `await` or `void`.

:::note
If you don't call the `create` method, the subscription will not be registered on the server, and you will not receive any events.
:::

### Listening for Events

You can listen for events on the subscription using the `onMessage` method that receives a callback function. You can call the `onMessage` method multiple times to add different callbacks.

```ts
subscription.onMessage((data) => {
  console.log(data)
})
```

You can also listen to a channel only once using the `onMessageOnce` method which receives a callback function.

```ts
subscription.onMessageOnce(() => {
  console.log('I will be called only once')
})
```

### Stop Listening for Events

The `onMessage` and `onMessageOnce` methods return a function that you can call to stop listening for a specific callback.

```ts
const stopListening = subscription.onMessage((data) => {
  console.log(data)
})

// Stop listening
stopListening()
```

### Deleting a Subscription

You can delete a subscription using the `delete` method. The method returns a promise that you can `await` or `void`. This method will unregister the subscription on the server.

```ts
await subscription.delete()
```
