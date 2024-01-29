# Class-based emails

Instead of writing emails inside the `mail.send` method closure, you may move them to dedicated mail classes for better organization and [easier testing](#testing-mail-classes).

The mail classes are stored inside the `./app/mails` directory, and each file represents a single email. You may create a mail class by running the `make:mail` ace command.

See also: [Make mail command](../reference/commands.md#makemail)

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

## Sending email using the mail class
You may call the `mail.send` method and pass it an instance of the mail class to send the email. For example:

```ts
// title: Send mail
import mail from '@adonisjs/mail/services/mail'
import VerifyEmailNotification from '#mails/verify_email'

await mail.send(new VerifyEmailNotification())
```

```ts
// title: Queue mail
import mail from '@adonisjs/mail/services/mail'
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

Feel free to look at the [Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) class source code for all the available assertion methods.
