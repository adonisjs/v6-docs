# Configuring message

The properties of an email are defined using the [Message](https://github.com/adonisjs/mail/blob/next/src/message.ts) class. An instance of this class is provided to the callback function created using the `mail.send`, or `mail.sendLater` methods.

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

## Defining `List` headers
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
