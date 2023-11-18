# Fake mailer
You may want to use the Fake mailer during testing to prevent your application from sending emails. The Fake mailer collects all outgoing emails within memory and offers an easy-to-use API for writing assertions against them.

In the following example:

- We start by creating an instance of the [FakeMailer](https://github.com/adonisjs/mail/blob/next/src/fake_mailer.ts) using the `mail.fake` method. 
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

## Writing assertions

The `mails.assertSent` method accepts the mail class constructor as the first argument and throws an exception when unable to find any emails for the expected class.

```ts
const { mails } = mail.fake()

/**
 * Asser the email was sent
 */
mails.assertSent(VerifyEmailNotification)
```

You may pass a callback function to the `assertSent` method to further check if the email was sent to the expected recipient or has correct subject.

The callback function receives an instance of the mail class and you can use the `.message` property to get access to the [message](./message.md) object.

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

### Assert email was not sent

You may use the `mails.assertNotSent` method to assert an email was not sent during the test. This method is the opposite of the `assertSent` method and accepts the same arguments.

```ts
const { mails } = mail.fake()

mails.assertNotSent(PasswordResetNotification)
```

### Assert emails count

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

## Writing assertions for queued emails

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

## Getting a list of sent or queued emails

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
