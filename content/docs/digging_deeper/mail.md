# Mail

You can send emails from your AdonisJS application using the `@adonisjs/mail` package. The mail package is built on top of [Nodemailer](https://nodemailer.com/), bringing the following quality of life improvements over Nodemailer.

- Fluent API to configure mail messages.
- Ability to define emails as classes for better organization and easier testing.
- An extensive suite of officially maintained drivers. It includes `smtp`, `ses`, `mailgun`, `sparkpost`, `resend`, and `brevo`.
- Improved testing experience using the Fakes API.
- Mail messenger to queue emails.
- Functional APIs to generate calendar events.

## Installation and Usage

Install the package from the npm packages registry using one of the following commands.

:::codegroup
```sh
// title: npm
npm i @adonisjs/mail@next
```

```sh
// title: yarn
yarn add @adonisjs/mail@next
```

```sh
// title: pnpm
pnpm add @adonisjs/mail@next
```
:::

Once done, you must run the following command to configure the mail package.

```sh
node ace configure @adonisjs/mail
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

See also: [Config stub](https://github.com/adonisjs/mail/blob/next/stubs/config.stub)

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
   * each using a different driver or the same driver with a different
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

See also: [TypeScript types for config object](https://github.com/adonisjs/mail/blob/next/src/types.ts#L261)

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
Once the initial configuration is completed, you may send emails using the `mail.send` method. The mail service is a singleton instance of the [MailManager](https://github.com/adonisjs/mail/blob/next/src/mail_manager.ts) class created using the config file.

The `mail.send` method passes an instance of the [Message](https://github.com/adonisjs/mail/blob/next/src/message.ts) class to the callback and delivers the email using the `default` mailer configured inside the config file.

```ts
import mail from '@adonisjs/mail/services/main'

await mail.send((message) => {
  message
    .to('user@example.org')
    .subject('Verify your email address')
    .htmlView('emails/verify_email', {
      verificationLink: `/emails/verify/${user.id}`,
      userName: user.username
    })
})
```

You may send emails in the background using the `mail.sendLater` method. [Learn more about queueing emails](#queueing-emails).

```ts
import mail from '@adonisjs/mail/services/main'

// delete-start
await mail.send((message) => {
// delete-end
// insert-start
await mail.sendLater((message) => {
// insert-end
  message
    .to('user@example.org')
    .subject('Verify your email address')
    .htmlView('emails/verify_email', {
      verificationLink: `/emails/verify/${user.id}`,
      userName: user.username
    })
})
```

## Switching between mailers
You may switch between the configured mailers using the `mail.use` method. The `mail.use` method accepts the name of the mailer (as defined inside the config file) and returns an instance of the [Mailer](https://github.com/adonisjs/mail/blob/next/src/mailer.ts) class.

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

## Defining subject and sender
You may define the email subject using the `message.subject` method and the email's sender using the `mail.from` method.

```ts
await mail.send((message) => {
  message
  // highlight-start
    .subject('Verify your email address')
    .from('info@example.org')
  // highlight-end
})
```

The `from` method accepts the email address as a string or an object with the sender name and the email address.

```ts
message
  .from({
    address: 'info@example.com',
    name: 'AdonisJS'
  })
```

The sender can also be defined globally within the config file. The global sender will be used if no explicit sender is defined for an individual message.

```ts
const mailConfig = defineConfig({
  from: {
    address: 'info@example.com',
    name: 'AdonisJS'
  }
})
```

## Defining recipients
You may define the email recipients using the `message.to`, `message.cc`, and the `message.bcc` methods. These methods accept the email address as a string or an object with the recipient name and the email address.

```ts
await mail.send((message) => {
  message
    .to(user.email)
    .cc(user.team.email)
    .bcc(user.team.admin.email)
})
```

```ts
await mail.send((message) => {
  message
    .to({
      address: user.email,
      name: user.fullName,
    })
    .cc({
      address: user.team.email,
      name: user.team.name,
    })
    .bcc({
      address: user.team.admin.email,
      name: user.team.admin.fullName,
    })
})
```

You may also define the `replyTo` email address using the `message.replyTo` method.

```ts
await mail.send((message) => {
  message
    .from('info@example.org')
    // highlight-start
    .replyTo('noreply@example.org')
    // highlight-end
})
```

## Defining email contents
You may define the **HTML** and **Plain text** contents for an email using `message.html` or `message.text` methods.

```ts
await mail.send((message) => {
  /**
   * HTML contents
   */
  message.html(`
    <h1> Verify email address </h1>
    <p> <a href="https://myapp.com">Click here</a> to verify your email address </a>
  `)

  /**
   * Plain text contents
   */
  message.text(`
    Verify email address
    Please visit https://myapp.com to verify your email address
  `)
})
```

### Using Edge templates

Since writing inline content could be cumbersome, you may use Edge templates instead. If you have already [configured Edge](../http/views_and_templates.md#configuring-edge), you may use the `message.htmlView` and `message.textView` methods to render templates.

```sh
// title: Create templates
node ace make:view emails/verify_email_html
node ace make:view emails/verify_email_text
```

```ts
// title: Use them for defining contents
await mail.send((message) => {
  message.htmlView('emails/verify_email_html', stateToShare)
  message.textView('emails/verify_email_text', stateToShare)
})
```

### Using MJML for email markup
MJML is a markup language for creating emails without writing all the complex HTML to make your emails look good in every email client.

The first step is to install the [mjml](https://npmjs.com/mjml) package from npm.

```sh
npm i mjml
```

Once done, you can write MJML markup inside your Edge templates by wrapping it inside the `@mjml` tag.

:::note

Since the output of MJML contains the `html`, `head`, and `body` tags, it is unnecessary to define them within your Edge templates.

:::

```edge
@mjml()
  <mjml>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text>
            Hello World!
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
@end
```

You may pass the [MJML configuration options](https://documentation.mjml.io/#inside-node-js) as props to the `@mjml` tag.

```edge
@mjml({
  keepComments: false,
  fonts: {
    Lato: 'https://fonts.googleapis.com/css?family=Lato:400,500,700'
  }
})
```

## Attaching files
You may use the `message.attach` method to send attachments in an email. The `attach` method accepts an absolute path or a file system URL of a file you want to send as an attachment.

```ts
import app from '@adonisjs/core/services/app'

await mail.send((message) => {
  message.attach(app.makePath('uploads/invoice.pdf'))
})
```

You may define the filename for the attachment using the `options.filename` property.

```ts
message.attach(app.makePath('uploads/invoice.pdf'), {
  filename: 'invoice_october_2023.pdf'
})
```

The complete list of options accepted by the `message.attach` method follows.

<table>
<thead>
<tr>
<th>Option</th>
<th>Description</th>
</tr>
</thead>
<tbody><tr>
<td><code>filename</code></td>
<td>The display name for the attachment. Defaults to the basename of the attachment path.</td>
</tr>
<tr>
<td><code>contentType</code></td>
<td>The content type for the attachment. If not set, the <code>contentType</code> will be inferred from the file extension.</td>
</tr>
<tr>
<td><code>contentDisposition</code></td>
<td>Content disposition type for the attachment. Defaults to <code>attachment</code></td>
</tr>
<tr>
<td><code>headers</code></td>
<td>
<p>Custom headers for the attachment node. The headers property is a key-value pair</p>
</td>
</tr>
</tbody></table>

### Attaching files from streams and buffers
You may create email attachments from streams and buffers using the `message.attachData` method. The method accepts a readable stream or the buffer as the first argument and the options object as the second argument.

:::note

The `message.attachData` method should not be used when queueing emails using the `mail.sendLater` method. Since queued jobs are serialized and persisted inside a database, attaching raw data will increase the storage size.

Moreover, queueing an email will fail if you attach a stream using the `message.attachData` method.
:::

```ts
message.attach(fs.createReadStream('./invoice.pdf'), {
  filename: 'invoice_october_2023.pdf'
})
```

```ts
message.attach(Buffer.from('aGVsbG8gd29ybGQh'), {
  encoding: 'base64',
  filename: 'greeting.txt',
})
```

## Embedding images
You may embed images within the contents of your email using the `embedImage` view helper. The `embedImage` method under the hood uses [CID](https://sendgrid.com/en-us/blog/embedding-images-emails-facts#1-cid-embedded-images-inline-images) to mark the image as an attachment and uses its content id as the source of the image.

```edge
<img src="{{
  embedImage(app.makePath('assets/hero.jpg'))
}}" />
```

Following will be the output HTML

```html
<img src="cid:a-random-content-id" />
```

The following attachment will be defined automatically on the email payload.

```ts
{
  attachments: [{
    path: '/root/app/assets/hero.jpg',
    filename: 'hero.jpg',
    cid: 'a-random-content-id'
  }]
}
```

### Embedding images from buffers

Like the `embedImage` method, you may use the `embedImageData` method to embed an image from raw data.

```edge
<img src="{{
  embedImageData(rawBuffer, { filename: 'hero.jpg' })
}}" />
```

## Attaching calendar events
You may attach calendar events to an email using the `message.icalEvent` method. The `icalEvent` method accepts the event contents as the first parameter and the `options` object as the second parameter.

```ts
const contents = 'BEGIN:VCALENDAR\r\nPRODID:-//ACME/DesktopCalendar//EN\r\nMETHOD:REQUEST\r\n...'

await mail.send((message) => {
  message.icalEvent(contents, {
    method: 'PUBLISH',
    filename: 'invite.ics',
  })
})
```

Since defining the event file contents manually can be cumbersome, you may pass a callback function to the `icalEvent` method and generate the invite contents using JavaScript API.

The `calendar` object provided to the callback function is a reference of the [ical-generator](https://www.npmjs.com/package/ical-generator) npm package, so make sure to go through the README file as well.

```ts
message.icalEvent((calendar) => {
  // highlight-start
  calendar
    .createEvent({
      summary: 'Adding support for ALS',
      start: DateTime.local().plus({ minutes: 30 }),
      end: DateTime.local().plus({ minutes: 60 }),
    })
  // highlight-end
}, {
  method: 'PUBLISH',
  filename: 'invite.ics',
})
```

### Reading invite contents from a file or a URL
You may define the invite contents from a file or an HTTP URL using the `icalEventFromFile` or `icalEventFromUrl` methods.

```ts
message.icalEventFromFile(
  app.resourcesPath('calendar-invites/invite.ics'),
  {
    filename: 'invite.ics',
    method: 'PUBLISH'
  }
)
```

```ts
message.icalEventFromFile(
  'https://myapp.com/users/1/invite.ics',
  {
    filename: 'invite.ics',
    method: 'PUBLISH'
  }
)
```

## Defining email headers
You may define additional email headers using the `message.header` method. The method accepts the header key as the first parameter and the value as the second parameter.

```ts
message.header('x-my-key', 'header value')

/**
 * Define an array of values
 */
message.header('x-my-key', ['header value', 'another value'])
```

By default, the email headers are encoded and folded to meet the requirement of having plain ASCII messages with lines no longer than 78 bytes. However, if you want to bypass the encoding rules, you may set a header using the `message.preparedHeader` method.

```ts
message.preparedHeader(
  'x-unprocessed',
  'a really long header or value with non-ascii characters 👮',
)
```

## Class-based emails
Instead of writing emails inside the `mail.send` method closure, you may move them to dedicated mail classes for better organization and [easier testing](#testing-mail-classes).

The mail classes are stored inside the `./app/mails` directory, and each file represents a single email. You may create a mail class by running the `make:mail` ace command.

```sh
node ace make:mail verify_email
```

The mail class extends the [BaseMail](https://github.com/adonisjs/mail/blob/next/src/base_mail.ts) class and is scaffolded with the following contents. You may configure the mail message inside the `prepare` method using the `this.message` property.

```ts
import User from '#models/user'
import { BaseMail } from '@adonisjs/mail'

export default class VerifyEmailNotification extends BaseMail {
  from = 'sender_email@example.org'
  subject = 'Verify email'

  prepare() {
    this.message.to('user_email@example.org')
  }
}
```

<dl>

<dt>

from

</dt>

<dd>

Configure the sender's email address. If you omit this property, you must call the `message.from` method to define the sender.

</dd>

<dt>

subject

</dt>

<dd>

Configure the email subject. If you omit this property, you must use the `message.subject` method to define the email subject.

</dd>

<dt>

replyTo

</dt>

<dd>

Configure the `replyTo` email address.

</dd>

<dt>

prepare

</dt>

<dd>

The `prepare` method is called automatically by the `build` method to prepare the mail message for sending. 

You must define the email contents, attachments, recipients, etc, within this method.

</dd>

<dt>

build :span[Inherited]{class="badge"}

</dt>

<dd>

The `build` method is inherited from the `BaseMail` class. The method is called automatically at the time of sending the email.

Make sure to reference the [original implementation](https://github.com/adonisjs/mail/blob/next/src/base_mail.ts#L72-L81) if you decide to override this method.

</dd>

</dl>

---

### Sending email using the mail class
You may call the `mail.send` method and pass it an instance of the mail class to send the email. For example:

```ts
import mail from '@adonisjs/mail/services/mail'
import VerifyEmailNotification from '#mails/verify_email'

await mail.send(new VerifyEmailNotification())

// Queue email
await mail.sendLater(new VerifyEmailNotification())
```

You may share data with the mail class using constructor arguments. For example:

```ts
/**
 * Creating a user
 */
const user = await User.create(payload)

await mail.send(
  /**
   * Passing user to the mail class
   */
  new VerifyEmailNotification(user)
)
```

## Queueing emails
Since sending emails can be time-consuming, you might want to push them to a queue and send emails in the background. You can do the same using the `mail.sendLater` method.

The `sendLater` method accepts the same parameters as the `send` method. However, instead of sending the email immediately, it will use the **Mail messenger** to queue it.

```ts
// title: Queue message
await mail.sendLater((message) => {
  message
    .to('user@example.org')
    .subject('Verify your email address')
    .htmlView('emails/verify_email', {
      verificationLink: `/emails/verify/${user.id}`,
      userName: user.username
    })
})
```

```ts
// title: Queue class-based mail
await mail.sendLater(new VerifyEmailNotification())
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

Finally, let's implement the worker process as well.

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

## Events
Following is the list of events emitted by the mail package.

### mail\:sending
The event is emitted before sending the email.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:sending', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

### mail\:sent
The event is emitted after the email has been sent.

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:sent', (event) => {
  console.log(event.response)

  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

### mail\:queueing
The event is emitted before queueing the job for sending the email

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:queueing', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

### mail\:queued
The event is emitted after the email has been queued

```ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('mail:queued', (event) => {
  console.log(event.mailerName)
  console.log(event.message)
  console.log(event.views)
})
```

## Testing mail classes

One of the primary benefits of using [Mail classes](#class-based-emails) is a better testing experience. You can build mail classes without sending them and write assertions for the message properties.

```ts
import { test } from '@japa/runner'
import VerifyEmailNotification from '#mails/verify_email'

test.group('Verify email notification', () => {
  test('prepare email for sending', async () => {
    const email = new VerifyEmailNotification()

    /**
     * Build email message and render templates to
     * compute the email HTML and plain text
     * contents
     */
    await email.buildWithContents()
    
    /**
     * Write assertions to ensure the message is built
     * as expected
     */
    email.message.assertTo('user@example.org')
    email.message.assertFrom('info@example.org')
    email.message.assertSubject('Verify email address')
    email.message.assertReplyTo('no-reply@example.org')
  })
})
```

You may write assertions for the message contents as follows.

```ts
const email = new VerifyEmailNotification()
await email.buildWithContents()

// highlight-start
email.message.assertHtmlIncludes(
  `<a href="/emails/1/verify"> Verify email address </a>`
)
email.message.assertTextIncludes('Verify email address')
// highlight-end
```

Also, you may write assertions for the attachments. The assertions only work with file-based attachments and not for streams or raw content.

```ts
const email = new VerifyEmailNotification()
await email.buildWithContents()

// highlight-start
email.message.assertAttachment(
  app.makePath('uploads/invoice.pdf')
)
// highlight-end
```

You may want to look at the [Message](https://github.com/adonisjs/mail/blob/next/src/message.ts) class source code for all the available assertion methods.

## Testing code that may trigger emails

Use the fake mailer to prevent your application from delivering emails during testing. The fake mailer collects all outgoing emails within memory and offers an easy-to-use API for writing assertions against them.

In the following example:

- We start by creating an instance of the [FakeMailer](https://github.com/adonisjs/mail/blob/next/src/fake_mailer.ts) using the `mail.fake` method. 
- Next, we make an API call to the `/register` endpoint.
- And finally, we use the `mails` property from fake mailer to assert the `VerifyEmailNotification` was sent.

```ts
import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email'

test.group('Users | register', () => {
  test('create a new user account', async ({ client, route }) => {
    // highlight-start
    /**
     * Turn on the fake mode
     */
    const { mails } = mail.fake()
    // highlight-end
    
    /**
     * Make an API call
     */
    await client
      .post(route('users.store'))
      .send(userData)
      
    // highlight-start
    /**
     * Assert the controller indeed sent the
     * VerifyEmailNotification mail
     */
    mails.assertSent(VerifyEmailNotification, ({ message }) => {
      return message
        .hasTo(userData.email)
        .hasSubject('Verify email address')
    })
    // highlight-end
  })
})
```

Once you are done writing the test, you must restore the fake using the `mail.restore` method.

```ts
test('create a new user account', async ({ client, route, cleanup }) => {
  const { mails } = mail.fake()
  
  /**
   * The cleanup hooks are executed after the test
   * finishes successfully or with an error.
   */
  cleanup(() => {
    mail.restore()
  })
})
```

### Writing assertions

The `mails.assertSent` method accepts the mail class constructor as the first argument and an optional callback as the second argument.

The callback is a finder function that must return a boolean to mark the email as sent. 

```ts
const { mails } = mail.fake()

/**
 * Asser the email was sent
 */
mails.assertSent(VerifyEmailNotification)

/**
 * Use a finder function to further ensure the email
 * was delivered to the right user with the right
 * subject
 */
mails.assertSent(VerifyEmailNotification, (email) => {
  return email
    .message.hasTo(userData.email)
    .message.hasSubject('Verify email address')
})
```

You may use the `mails.assertNotSent` method to assert an email was not sent during the test. This method is the opposite of the `assertSent` method and accepts the same arguments.

```ts
const { mails } = mail.fake()

mails.assertNotSent(PasswordResetNotification)
```

Finally, you can assert the count of sent emails using the `assertSentCount` and `assertNoneSent` methods.

```ts
const { mails } = mail.fake()

// Assert 2 emails were sent in total
mails.assertSentCount(2)

// Assert only one VerifyEmailNotification was sent
mails.assertSentCount(VerifyEmailNotification, 1)
```

```ts
const { mails } = mail.fake()

// Assert zero emails were sent
mails.assertNoneSent()
```

### Writing assertions for queued emails

If you have queued emails using the `mail.sendLater` method, you may use the following methods to write assertions for them.

```ts
const { mails } = mail.fake()

/**
 * Assert "VerifyEmailNotification" email was queued
 * Optionally, you may pass the finder function to
 * narrow down the email
 */
mails.assertQueued(VerifyEmailNotification)

/**
 * Assert "VerifyEmailNotification" email was not queued
 * Optionally, you may pass the finder function to
 * narrow down the email
 */
mails.assertNotQueued(PasswordResetNotification)

/**
 * Assert two emails were queued in total.
 */
mails.assertQueuedCount(2)

/**
 * Assert "VerifyEmailNotification" email was queued
 * only once
 */
mails.assertQueuedCount(VerifyEmailNotification , 1)

/**
 * Assert nothing was queued
 */
mails.assertNoneQueued()
```

### Getting a list of sent or queued emails

You may use the `mails.sent` or `mails.queued` methods to get an array of emails sent/queued during tests.

```ts
const { mails } = mail.fake()

const sentEmails = mails.sent()
const queuedEmails = mails.queued()

const email = sentEmails.find((email) => {
  return email instanceof VerifyEmailNotification
})

if (email) {
  email.message.assertTo(userData.email)
  email.message.assertFrom(userData.email)
  email.message.assertHtmlIncludes('<a href="/verify/email"> Verify your email address</a>')
}
```

## Creating custom transports
