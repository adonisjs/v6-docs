# Mail

You can send emails from your AdonisJS application using the `@adonisjs/mail` package. The mail package is built on top of [Nodemailer](https://nodemailer.com/), bringing the following quality of life improvements over Nodemailer.

- Fluent API to configure mail messages.
- Ability to define emails as classes for better organization and easier testing.
- An extensive suite of officially maintained transports. It includes `smtp`, `ses`, `mailgun`, `sparkpost`, `resend`, and `brevo`.
- Improved testing experience using the Fakes API.
- Mail messenger to queue emails.
- Functional APIs to generate calendar events.

## Installation

Install the package from the npm packages registry using one of the following commands.

:::codegroup
```sh
// title: npm
npm i @adonisjs/mail
```

```sh
// title: yarn
yarn add @adonisjs/mail
```

```sh
// title: pnpm
pnpm add @adonisjs/mail
```
:::

Once done, you must run the following command to configure the mail package.

```sh
node ace configure @adonisjs/mail

# Pre-define transports to use via CLI flag
node ace configure @adonisjs/mail --transports=resend --transports=smtp
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider and command inside the `adonisrc.ts` file.

    ```ts
    {
      commands: [
        // ...other commands
        () => import('@adonisjs/mail/commands')
      ],
      providers: [
        // ...other providers
        () => import('@adonisjs/mail/mail_provider')
      ]
    }
    ```

2. Create the `config/mail.ts` file.

3. Defines the environment variables and their validations for the selected mail services

:::


## Configuration

The configuration for the mail package is stored inside the `config/mail.ts` file. Inside this file, you may configure multiple email services as `mailers` to use them within your application.

See also: [Config stub](https://github.com/adonisjs/mail/blob/main/stubs/config/mail.stub)

```ts
import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',
  
  /**
   * A static address for the "from" property. It will be
   * used unless an explicit from address is set on the
   * Email
   */
  from: {
    address: '',
    name: '',
  },
  
  /**
   * A static address for the "reply-to" property. It will be
   * used unless an explicit replyTo address is set on the
   * Email
   */
  replyTo: {
    address: '',
    name: '',
  },

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or the same transport with a different
   * options.
   */
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
    }),

    resend: transports.resend({
      key: env.get('RESEND_API_KEY'),
      baseUrl: 'https://api.resend.com',
    }),
  },
})
```

<dl>

<dt>

default

</dt>

<dd>

The name of the mailer to use by default for sending emails.

</dd>

<dt>

from

</dt>

<dd>

A static global address to use for the `from` property. The global address will be used unless an explicit `from` address is defined on the email.

</dd>

<dt>

replyTo

</dt>

<dd>

A static global address to use for the `reply-to` property. The global address will be used unless an explicit `replyTo` address is defined on the email.

</dd>

<dt>

mailers

</dt>

<dd>

The `mailers` object is used to configure one or more mailers you want to use for sending emails. You can switch between the mailers at runtime using the `mail.use` method.

</dd>

</dl>

## Transports config
Following is a complete reference of configuration options accepted by the officially supported transports. 

See also: [TypeScript types for config object](https://github.com/adonisjs/mail/blob/main/src/types.ts#L261)

<div class="disclosure_wrapper">

:::disclosure{title="Mailgun config"}
<br />

The following configuration options are sent to the Mailgun's [`/messages.mime`](https://documentation.mailgun.com/en/latest/api-sending.html#sending) API endpoint.

```ts
{
  mailers: {
    mailgun: transports.mailgun({
      baseUrl: 'https://api.mailgun.net/v3',
      key: env.get('MAILGUN_API_KEY'),
      domain: env.get('MAILGUN_DOMAIN'),

      /**
       * The following options can be overridden at
       * runtime when calling the `mail.send` method.
       */
      oDkim: true,
      oTags: ['transactional', 'adonisjs_app'],
      oDeliverytime: new Date(2024, 8, 18),
      oTestMode: false,
      oTracking: false,
      oTrackingClick: false,
      oTrackingOpens: false,
      headers: {
        // h:prefixed headers
      },
      variables: {
        appId: '',
        userId: '',
        // v:prefixed variables
      }
    })
  }
}
```

:::

:::disclosure{title="SMTP config"}
<br />

The following configuration options are forwarded to Nodemailer as it is. So please check the [Nodemailer documentation](https://nodemailer.com/smtp/) as well.

```ts
{
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: false,

      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME'),
        pass: env.get('SMTP_PASSWORD')
      },

      tls: {},

      ignoreTLS: false,
      requireTLS: false,

      pool: false,
      maxConnections: 5,
      maxMessages: 100,
    })
  }
}
```

:::

:::disclosure{title="SES config"}
<br />

The following configuration options are forwarded to Nodemailer as it is. So please check the [Nodemailer documentation](https://nodemailer.com/transports/ses/) as well.

Make sure to install the `@aws-sdk/client-ses` package to use the SES transport.

```ts
{
  mailers: {
    ses: transports.ses({
      /**
       * Forwarded to aws sdk
       */
      apiVersion: '2010-12-01',
      region: 'us-east-1',
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
      },

      /**
       * Nodemailer specific
       */
      sendingRate: 10,
      maxConnections: 5,
    })
  }
}
```

:::

:::disclosure{title="SparkPost config"}

<br />

The following configuration options are sent to the SparkPost's [`/transmissions`](https://developers.sparkpost.com/api/transmissions/#header-request-body) API endpoint.

```ts
{
  mailers: {
    sparkpost: transports.sparkpost({
      baseUrl: 'https://api.sparkpost.com/api/v1',
      key: env.get('SPARKPOST_API_KEY'),

      /**
       * The following options can be overridden at
       * runtime when calling the `mail.send` method.
       */
      startTime: new Date(),
      openTracking: false,
      clickTracking: false,
      initialOpen: false,
      transactional: true,
      sandbox: false,
      skipSuppression: false,
      ipPool: '',
    })
  }
}
```

:::

:::disclosure{title="Resend config"}
<br />

The following configuration options are sent to the Resend's [`/emails`](https://resend.com/docs/api-reference/emails/send-email) API endpoint.

```ts
{
  mailers: {
    resend: transports.resend({
      baseUrl: 'https://api.resend.com',
      key: env.get('RESEND_API_KEY'),

      /**
       * The following options can be overridden at
       * runtime when calling the `mail.send` method.
       */
      tags: [
        {
          name: 'category',
          value: 'confirm_email'
        }
      ]
    })
  }
}
```
:::

</div>

## Basic example

Once the initial configuration is completed, you may send emails using the `mail.send` method. The mail service is a singleton instance of the [MailManager](https://github.com/adonisjs/mail/blob/main/src/mail_manager.ts) class created using the config file.

The `mail.send` method passes an instance of the [Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) class to the callback and delivers the email using the `default` mailer configured inside the config file.

In the following example, we trigger an email from the controller after creating a new user account.

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
// highlight-start
import mail from '@adonisjs/mail/services/main'
// highlight-end

export default class UsersController {
  async store({ request }: HttpContext) {
    /**
     * For demonstration only. You should validate the data
     * before storing it inside the database.
     */
    const user = await User.create(request.all())

    // highlight-start
    await mail.send((message) => {
      message
        .to(user.email)
        .from('info@example.org')
        .subject('Verify your email address')
        .htmlView('emails/verify_email', { user })
    })
    // highlight-end
  }
}
```

## Queueing emails
Since sending emails can be time-consuming, you might want to push them to a queue and send emails in the background. You can do the same using the `mail.sendLater` method.

The `sendLater` method accepts the same parameters as the `send` method. However, instead of sending the email immediately, it will use the **Mail messenger** to queue it.

```ts
// delete-start
await mail.send((message) => {
// delete-end
// insert-start
await mail.sendLater((message) => {
// insert-end
  message
    .to(user.email)
    .from('info@example.org')
    .subject('Verify your email address')
    .htmlView('emails/verify_email', { user })
})
```

By default, the **mail messenger uses an in-memory queue**, meaning the queue will drop the jobs if your process dies with pending jobs. This might not be a huge deal if your application UI allows re-sending emails with manual actions. However, you can always configure a custom messenger and use a database-backed queue.

### Using bullmq for queueing emails

```sh
npm i bullmq
```

In the following example, we use the `mail.setMessenger` method to configure a custom queue that uses `bullmq` under the hood for storing jobs.

We store the compiled email, runtime configuration, and the mailer name inside the job. Later, we will use this data to send emails inside a worker process.

```ts
import { Queue } from 'bullmq'
import mail from '@adonisjs/mail/services/main'

// highlight-start
const emailsQueue = new Queue('emails')
// highlight-end

// highlight-start
mail.setMessenger((mailer) => {
  return {
    async queue(mailMessage, config) {
      await emailsQueue.add('send_email', {
        mailMessage,
        config,
        mailerName: mailer.name,
      })
    }
  }
})
// highlight-end
```

Finally, let's write the code for the queue Worker. Depending on your application workflow, you may have to start another process for the workers to process the jobs.

In the following example:

- We process jobs named `send_email` from the `emails` queue.
- Access compiled mail message, runtime config, and the mailer name from the job data.
- And send the email using the `mailer.sendCompiled` method.

```ts
import { Worker } from 'bullmq'
import mail from '@adonisjs/mail/services/main'

new Worker('emails', async (job) => {
  if (job.name === 'send_email') {
    const {
      mailMessage,
      config,
      mailerName
    } = job.data

    await mail
      .use(mailerName)
      .sendCompiled(mailMessage, config)
  }
})
```

That's all! You may continue using the `mail.sendLater` method. However, the emails will be queued inside a redis database this time.

## Switching between mailers
You may switch between the configured mailers using the `mail.use` method. The `mail.use` method accepts the name of the mailer (as defined inside the config file) and returns an instance of the [Mailer](https://github.com/adonisjs/mail/blob/main/src/mailer.ts) class.

```ts
import mail from '@adonisjs/mail/services/mail'

mail.use() // Instance of default mailer
mail.use('mailgun') // Mailgun mailer instance
```

You may call the `mailer.send` or `mailer.sendLater` methods to send email using a mailer instance. For example:

```ts
await mail
  .use('mailgun')
  .send((message) => {
  })
```

```ts
await mail
  .use('mailgun')
  .sendLater((message) => {
  })
```

The mailer instances are cached for the lifecycle of the process. You may use the `mail.close` method to destroy an existing instance and re-create a new instance from scratch.

```ts
import mail from '@adonisjs/mail/services/mail'

/**
 * Close transport and remove instance from
 * cache
 */
await mail.close('mailgun')

/**
 * Create a fresh instance
 */
mail.use('mailgun')
```

## Configuring the template engine
By default, the mail package is configured to use the [Edge template engine](../http/views_and_templates.md#configuring-edge) for defining the email **HTML** and **Plain text** contents.

However, as shown in the following example, you may also register a custom template engine by overriding the `Message.templateEngine` property.

See also: [Defining email contents](./message.md#defining-email-contents)

```ts
import { Message } from '@adonisjs/mail'

Message.templateEngine = {
  async render(templatePath, data) {
    return someTemplateEngine.render(templatePath, data)
  }
}
```

## Events
Please check the [events reference guide](../reference/events.md#mailsending) to view the list of events dispatched by the `@adonisjs/mail` package.
