---
summary: Learn how to send emails from your AdonisJS application using the @adonisjs/mail package. 
---

# Mail

You can send emails from your AdonisJS application using the `@adonisjs/mail` package. The mail package is built on top of [Nodemailer](https://nodemailer.com/), bringing the following quality of life improvements over Nodemailer.

- Fluent API to configure mail messages.
- Ability to define emails as classes for better organization and easier testing.
- An extensive suite of officially maintained transports. It includes `smtp`, `ses`, `mailgun`, `sparkpost`, `resend`, and `brevo`.
- Improved testing experience using the Fakes API.
- Mail messenger to queue emails.
- Functional APIs to generate calendar events.

## Installation

Install and configure the package using the following command :

```sh
node ace add @adonisjs/mail

# Pre-define transports to use via CLI flag
node ace add @adonisjs/mail --transports=resend --transports=smtp
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `@adonisjs/mail` package using the detected package manager.

2. Registers the following service provider and command inside the `adonisrc.ts` file.

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
3. Create the `config/mail.ts` file.

4. Defines the environment variables and their validations for the selected mail services

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
import mail from '@adonisjs/mail/services/main'

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
import mail from '@adonisjs/mail/services/main'

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
By default, the mail package is configured to use the [Edge template engine](../views-and-templates/introduction.md#configuring-edge) for defining the email **HTML** and **Plain text** contents.§

However, as shown in the following example, you may also register a custom template engine by overriding the `Message.templateEngine` property.

See also: [Defining email contents](#defining-email-contents)

```ts
import { Message } from '@adonisjs/mail'

Message.templateEngine = {
  async render(templatePath, data) {
    return someTemplateEngine.render(templatePath, data)
  }
}
```

## Events
Please check the [events reference guide](../references/events.md#mailsending) to view the list of events dispatched by the `@adonisjs/mail` package.

## Configuring message

The properties of an email are defined using the [Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) class. An instance of this class is provided to the callback function created using the `mail.send`, or `mail.sendLater` methods.

```ts
import { Message } from '@adonisjs/mail'
import mail from '@adonisjs/mail/services/main'

await mail.send((message) => {
  // highlight-start
  console.log(message instanceof Message) // true
  // highlight-end
})

await mail.sendLater((message) => {
  // highlight-start
  console.log(message instanceof Message) // true
  // highlight-end
})
```

### Defining subject and sender
You may define the email subject using the `message.subject` method and the email's sender using the `message.from` method.

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

### Defining recipients
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

You can define multiple `cc` and `bcc` recipients as an array of email addresses or an object with email addresses and the recipient name.

```ts
await mail.send((message) => {
  message
    .cc(['first@example.com', 'second@example.com'])
    .bcc([
      {
        name: 'First recipient',
        address: 'first@example.com'
      },
      {
        name: 'Second recipient',
        address: 'second@example.com'
      }
    ])
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

### Defining email contents
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

#### Using Edge templates

Since writing inline content could be cumbersome, you may use Edge templates instead. If you have already [configured Edge](../views-and-templates/introduction.md#configuring-edge), you may use the `message.htmlView` and `message.textView` methods to render templates.

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

#### Using MJML for email markup
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

### Attaching files
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

#### Attaching files from streams and buffers
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

### Embedding images
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

#### Embedding images from buffers

Like the `embedImage` method, you may use the `embedImageData` method to embed an image from raw data.

```edge
<img src="{{
  embedImageData(rawBuffer, { filename: 'hero.jpg' })
}}" />
```

### Attaching calendar events
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

The `calendar` object provided to the callback function is a reference of the [ical-generator](https://www.npmjs.com/package/ical-generator) npm package, so make sure to go through the package's README file as well.

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

#### Reading invite contents from a file or a URL
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

### Defining email headers
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

### Defining `List` headers
The message class includes helper methods to define complex headers like [List-Unsubscribe](https://sendgrid.com/en-us/blog/list-unsubscribe) or [List-Help](https://support.optimizely.com/hc/en-us/articles/4413200569997-Setting-up-the-List-Help-header#heading-2) with ease. You can learn about the encoding rules for `List` headers on the [nodemailer website](https://nodemailer.com/message/list-headers/).

```ts
message.listHelp('admin@example.com?subject=help')
// List-Help: <mailto:admin@example.com?subject=help>
```

```ts
message.listUnsubscribe({
  url: 'http://example.com',
  comment: 'Comment'
})
// List-Unsubscribe: <http://example.com> (Comment)
```

```ts
/**
 * Repeating header multiple times
 */
message.listSubscribe('admin@example.com?subject=subscribe')
message.listSubscribe({
  url: 'http://example.com',
  comment: 'Subscribe'
})
// List-Subscribe: <mailto:admin@example.com?subject=subscribe>
// List-Subscribe: <http://example.com> (Subscribe)
```

For all other arbitrary `List` headers, you may use the `addListHeader` method.

```ts
message.addListHeader('post', 'http://example.com/post')
// List-Post: <http://example.com/post>
```

## Class-based emails

Instead of writing emails inside the `mail.send` method closure, you may move them to dedicated mail classes for better organization and [easier testing](#testing-mail-classes).

The mail classes are stored inside the `./app/mails` directory, and each file represents a single email. You may create a mail class by running the `make:mail` ace command.

See also: [Make mail command](../references/commands.md#makemail)

```sh
node ace make:mail verify_email
```

The mail class extends the [BaseMail](https://github.com/adonisjs/mail/blob/main/src/base_mail.ts) class and is scaffolded with following properties and methods. You may configure the mail message inside the `prepare` method using the `this.message` property.

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

Make sure to reference the [original implementation](https://github.com/adonisjs/mail/blob/main/src/base_mail.ts#L81) if you decide to override this method.

</dd>

</dl>

### Sending email using the mail class
You may call the `mail.send` method and pass it an instance of the mail class to send the email. For example:

```ts
// title: Send mail
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email'

await mail.send(new VerifyEmailNotification())
```

```ts
// title: Queue mail
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email'

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

### Testing mail classes

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

Feel free to look at the [Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) class source code for all the available assertion methods.

## Fake mailer
You may want to use the Fake mailer during testing to prevent your application from sending emails. The Fake mailer collects all outgoing emails within memory and offers an easy-to-use API for writing assertions against them.

In the following example:

- We start by creating an instance of the [FakeMailer](https://github.com/adonisjs/mail/blob/main/src/fake_mailer.ts) using the `mail.fake` method.
- Next, we call the `/register` endpoint API.
- Finally, we use the `mails` property from the fake mailer to assert the `VerifyEmailNotification` was sent.

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

The `mails.assertSent` method accepts the mail class constructor as the first argument and throws an exception when unable to find any emails for the expected class.

```ts
const { mails } = mail.fake()

/**
 * Asser the email was sent
 */
mails.assertSent(VerifyEmailNotification)
```

You may pass a callback function to the `assertSent` method to further check if the email was sent to the expected recipient or has correct subject.

The callback function receives an instance of the mail class and you can use the `.message` property to get access to the [message](#configuring-message) object.

```ts
mails.assertSent(VerifyEmailNotification, (email) => {
  return email.message
    .hasTo(userData.email)
    .hasFrom('info@example.org')
    .hasSubject('Verify your email address')
})
```

You may run assertions on the `message` object within the callback. For example:

```ts
mails.assertSent(VerifyEmailNotification, (email) => {
  email.message.assertHasTo(userData.email)
  email.message.assertHasFrom('info@example.org')
  email.message.assertHasSubject('Verify your email address')

  /**
   * All assertions passed, so return true to consider the
   * email as sent.
   */
  return true
})
```

#### Assert email was not sent

You may use the `mails.assertNotSent` method to assert an email was not sent during the test. This method is the opposite of the `assertSent` method and accepts the same arguments.

```ts
const { mails } = mail.fake()

mails.assertNotSent(PasswordResetNotification)
```

#### Assert emails count

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

### Creating the config factory function
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

### Using the transport
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
