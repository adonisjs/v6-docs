# Creating custom transports

AdonisJS Mail transports are built on top of [Nodemailer transports](https://nodemailer.com/plugins/create/#transports); therefore, you must create/use a nodemailer transport before you can register it with the Mail package.

In this guide, we will wrap the [nodemailer-postmark-transport](https://www.npmjs.com/package/nodemailer-postmark-transport) to an AdonisJS Mail transport. 

```sh
npm i nodemailer nodemailer-postmark-transport
```

As you can see in the following example, the heavy lifting of sending an email is done by the `nodemailer`. The AdonisJS transport acts as an adapter forwarding the message to nodemailer and normalizing its response to an instance of [MailResponse](https://github.com/adonisjs/mail/blob/main/src/mail_response.ts).

```ts
import nodemailer from 'nodemailer'
import nodemailerTransport from 'nodemailer-postmark-transport'

import { MailResponse } from '@adonisjs/mail'
import type {
  NodeMailerMessage,
  MailTransportContract
} from '@adonisjs/mail/types'

/**
 * Configuration accepted by the transport
 */
export type PostMarkConfig = {
  auth: {
    apiKey: string
  }
}

/**
 * Transport implementation
 */
export class PostMarkTransport implements MailTransportContract {
  #config: PostMarkConfig
  constructor(config: PostMarkConfig) {
    this.#config = config
  }

  #createNodemailerTransport(config: PostMarkConfig) {
    return nodemailer.createTransport(nodemailerTransport(config))
  }

  async send(
    message: NodeMailerMessage,
    config?: PostMarkConfig
  ): Promise<MailResponse> {
    /**
     * Create nodemailer transport
     */
    const transporter = this.#createNodemailerTransport({
      ...this.#config,
      ...config,
    })

    /**
     * Send email
     */
    const response = await transporter.sendMail(message)

    /**
     * Normalize response to an instance of the "MailResponse" class
     */
    return new MailResponse(response.messageId, response.envelope, response)
  }
}
```

## Creating the config factory function
To reference the above transport inside the `config/mail.ts` file, you must create a factory function that returns an instance of the transport.

You may write the following code within the same file as your transport's implementation.

```ts
import type {
  NodeMailerMessage,
  MailTransportContract,
  // insert-start
  MailManagerTransportFactory
  // insert-end
} from '@adonisjs/mail/types'

export function postMarkTransport(
  config: PostMarkConfig
): MailManagerTransportFactory {
  return () => {
    return new PostMarkTransport(config)
  }
}
```

## Using the transport
Finally, you can reference the transport inside your config file using the `postMarkTransport` helper.

```ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/mail'
import { postMarkTransport } from 'my-custom-package'

const mailConfig = defineConfig({
  mailers: {
    postmark: postMarkTransport({
      auth: {
        apiKey: env.get('POSTMARK_API_KEY'),
      },
    }),
  },
})
```
