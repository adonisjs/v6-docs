---
summary: 了解如何使用 @adonisjs/mail 包从你的 AdonisJS 应用程序发送电子邮件。
---

# 邮件 (Mail)

你可以使用 `@adonisjs/mail` 包从你的 AdonisJS 应用程序发送电子邮件。邮件包构建在 [Nodemailer](https://nodemailer.com/) 之上，相比 Nodemailer 带来了以下生活质量的提升：

- 用于配置邮件消息的流畅 API。
- 能够将电子邮件定义为类，以便更好地组织和更容易地测试。
- 一套广泛的官方维护的传输 (transports)。它包括 `smtp`、`ses`、`mailgun`、`sparkpost`、`resend` 和 `brevo`。
- 使用 Fakes API 改进的测试体验。
- 用于排队电子邮件的邮件信使 (Mail messenger)。
- 用于生成日历事件的功能 API。

## 安装

使用以下命令安装并配置该包：

```sh
node ace add @adonisjs/mail

# Pre-define transports to use via CLI flag
node ace add @adonisjs/mail --transports=resend --transports=smtp
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/mail` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者和命令。

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
3. 创建 `config/mail.ts` 文件。

4. 为选定的邮件服务定义环境变量及其验证。

:::


## 配置

邮件包的配置存储在 `config/mail.ts` 文件中。在此文件中，你可以将多个电子邮件服务配置为 `mailers`，以便在你的应用程序中使用它们。

另请参阅：[配置存根](https://github.com/adonisjs/mail/blob/main/stubs/config/mail.stub)

```ts
import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

  /**
   * "from" 属性的静态地址。
   * 除非在电子邮件上显式设置了 from 地址，否则将使用它。
   */
  from: {
    address: '',
    name: '',
  },

  /**
   * "reply-to" 属性的静态地址。
   * 除非在电子邮件上显式设置了 replyTo 地址，否则将使用它。
   */
  replyTo: {
    address: '',
    name: '',
  },

  /**
   * mailers 对象可用于配置多个邮件发送器，
   * 每个邮件发送器使用不同的传输或具有不同选项的相同传输。
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

默认用于发送电子邮件的邮件发送器名称。

</dd>

<dt>

from

</dt>

<dd>

用于 `from` 属性的静态全局地址。除非在电子邮件上定义了显式的 `from` 地址，否则将使用全局地址。

</dd>

<dt>

replyTo

</dt>

<dd>

用于 `reply-to` 属性的静态全局地址。除非在电子邮件上定义了显式的 `replyTo` 地址，否则将使用全局地址。

</dd>

<dt>

mailers

</dt>

<dd>

`mailers` 对象用于配置一个或多个你想要用于发送电子邮件的邮件发送器。你可以使用 `mail.use` 方法在运行时在邮件发送器之间切换。

</dd>

</dl>

## 传输配置 (Transports config)
以下是官方支持的传输所接受的配置选项的完整参考。

另请参阅：[配置对象的 TypeScript 类型](https://github.com/adonisjs/mail/blob/main/src/types.ts#L261)

<div class="disclosure_wrapper">

:::disclosure{title="Mailgun 配置"}
<br />

以下配置选项将发送到 Mailgun 的 [`/messages.mime`](https://documentation.mailgun.com/en/latest/api-sending.html#sending) API 端点。

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

:::disclosure{title="SMTP 配置"}
<br />

以下配置选项将原样转发给 Nodemailer。因此，请同时查看 [Nodemailer 文档](https://nodemailer.com/smtp/)。

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

:::disclosure{title="SES 配置"}
<br />

以下配置选项将原样转发给 Nodemailer。因此，请同时查看 [Nodemailer 文档](https://nodemailer.com/transports/ses/)。

确安装 `@aws-sdk/client-ses` 包以使用 SES 传输。

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

:::disclosure{title="SparkPost 配置"}

<br />

以下配置选项将发送到 SparkPost 的 [`/transmissions`](https://developers.sparkpost.com/api/transmissions/#header-request-body) API 端点。

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

:::disclosure{title="Resend 配置"}
<br />

以下配置选项将发送到 Resend 的 [`/emails`](https://resend.com/docs/api-reference/emails/send-email) API 端点。

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

## 基本示例

完成初始配置后，你可以使用 `mail.send` 方法发送电子邮件。Mail 服务是使用配置文件创建的 [MailManager](https://github.com/adonisjs/mail/blob/main/src/mail_manager.ts) 类的单例实例。

`mail.send` 方法将 [Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) 类的实例传递给回调，并使用配置文件中配置的 `default` 邮件发送器投递电子邮件。

在下面的示例中，我们在创建一个新用户帐户后从控制器触发一封电子邮件。

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

## 邮件队列 (Queueing emails)
由于发送电子邮件可能非常耗时，你可能希望将它们推送到队列中并在后台发送电子邮件。你可以使用 `mail.sendLater` 方法执行相同的操作。

`sendLater` 方法接受与 `send` 方法相同的参数。但是，它不会立即发送电子邮件，而是使用 **Mail messenger** 将其排队。

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

默认情况下，**mail messenger 使用内存队列**，这意味着如果你的进程在有待处理作业时死亡，队列将丢失作业。如果你的应用程序 UI 允许通过手动操作重新发送电子邮件，这可能不是什么大问题。但是，你始终可以配置自定义信使并使用数据库支持的队列。

### 使用 bullmq 进行邮件队列

```sh
npm i bullmq
```

在下面的示例中，我们使用 `mail.setMessenger` 方法配置一个自定义队列，该队列在底层使用 `bullmq` 存储作业。

我们将编译后的电子邮件、运行时配置和邮件发送器名称存储在作业中。稍后，我们将使用这些数据在 worker 进程中发送电子邮件。

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

最后，让我们编写队列 Worker 的代码。根据你的应用程序工作流程，你可能必须启动另一个进程让 worker 处理作业。

在下面的示例中：

- 我们从 `emails` 队列处理名为 `send_email` 的作业。
- 从作业数据中访问编译后的邮件消息、运行时配置和邮件发送器名称。
- 并使用 `mailer.sendCompiled` 方法发送电子邮件。

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

就是这样！你可以继续使用 `mail.sendLater` 方法。但是，这次电子邮件将在 Redis 数据库中排队。

## 切换邮件发送器
你可以使用 `mail.use` 方法在配置的邮件发送器之间切换。`mail.use` 方法接受邮件发送器的名称（如在配置文件中定义的那样）并返回 [Mailer](https://github.com/adonisjs/mail/blob/main/src/mailer.ts) 类的实例。

```ts
import mail from '@adonisjs/mail/services/main'

mail.use() // Instance of default mailer
mail.use('mailgun') // Mailgun mailer instance
```

你可以调用 `mailer.send` 或 `mailer.sendLater` 方法使用邮件发送器实例发送电子邮件。例如：

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

邮件发送器实例在进程的生命周期内被缓存。你可以使用 `mail.close` 方法销毁现有实例并从头开始重新创建一个新实例。

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

## 配置模板引擎
默认情况下，邮件包配置为使用 [Edge 模板引擎](../views-and-templates/introduction.md#configuring-edge) 来定义电子邮件 **HTML** 和 **纯文本** 内容。

但是，如以下示例所示，你也可以通过覆盖 `Message.templateEngine` 属性来注册自定义模板引擎。

另请参阅：[定义邮件内容](#defining-email-contents)

```ts
import { Message } from '@adonisjs/mail'

Message.templateEngine = {
  async render(templatePath, data) {
    return someTemplateEngine.render(templatePath, data)
  }
}
```

## 事件
请查看 [事件参考指南](../references/events.md#mailsending) 以查看 `@adonisjs/mail` 包分发的事件列表。

## 配置消息

电子邮件的属性使用 [Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) 类定义。该类的实例提供给使用 `mail.send` 或 `mail.sendLater` 方法创建的回调函数。

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

### 定义主题和发送者
你可以使用 `message.subject` 方法定义电子邮件主题，并使用 `message.from` 方法定义电子邮件的发送者。

```ts
await mail.send((message) => {
  message
  // highlight-start
    .subject('Verify your email address')
    .from('info@example.org')
  // highlight-end
})
```

`from` 方法接受电子邮件地址作为字符串，或者包含发送者姓名和电子邮件地址的对象。

```ts
message
  .from({
    address: 'info@example.com',
    name: 'AdonisJS'
  })
```

发送者也可以在配置文件中全局定义。如果没有为单个消息定义显式发送者，则将使用全局发送者。

```ts
const mailConfig = defineConfig({
  from: {
    address: 'info@example.com',
    name: 'AdonisJS'
  }
})
```

### 定义收件人
你可以使用 `message.to`、`message.cc` 和 `message.bcc` 方法定义电子邮件收件人。这些方法接受电子邮件地址作为字符串，或者包含收件人姓名和电子邮件地址的对象。

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

你可以将多个 `cc` 和 `bcc` 收件人定义为电子邮件地址数组或包含收件人姓名和电子邮件地址的对象数组。

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

你还可以使用 `message.replyTo` 方法定义 `replyTo` 电子邮件地址。

```ts
await mail.send((message) => {
  message
    .from('info@example.org')
    // highlight-start
    .replyTo('noreply@example.org')
    // highlight-end
})
```

### 定义邮件内容
你可以使用 `message.html` 或 `message.text` 方法定义电子邮件的 **HTML** 和 **纯文本** 内容。

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

#### 使用 Edge 模板

由于编写内联内容可能很麻烦，你可以改用 Edge 模板。如果你已经 [配置了 Edge](../views-and-templates/introduction.md#configuring-edge)，你可以使用 `message.htmlView` 和 `message.textView` 方法来渲染模板。

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

#### 使用 MJML 进行邮件标记
MJML 是一种用于创建电子邮件的标记语言，无需编写所有复杂的 HTML 即可使你的电子邮件在每个电子邮件客户端中看起来都很好。

第一步是从 npm 安装 [mjml](https://npmjs.com/mjml) 包。

```sh
npm i mjml
```

完成后，你可以在 `@mjml` 标签内包装 MJML 标记，从而在 Edge 模板中编写 MJML 标记。

:::note

由于 MJML 的输出包含 `html`、`head` 和 `body` 标签，因此无需在 Edge 模板中定义它们。

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

你可以将 [MJML 配置选项](https://documentation.mjml.io/#inside-node-js) 作为 props 传递给 `@mjml` 标签。

```edge
@mjml({
  keepComments: false,
  fonts: {
    Lato: 'https://fonts.googleapis.com/css?family=Lato:400,500,700'
  }
})
```

### 附加文件
你可以使用 `message.attach` 方法在电子邮件中发送附件。`attach` 方法接受你想要作为附件发送的文件的绝对路径或文件系统 URL。

```ts
import app from '@adonisjs/core/services/app'

await mail.send((message) => {
  message.attach(app.makePath('uploads/invoice.pdf'))
})
```

你可以使用 `options.filename` 属性定义附件的文件名。

```ts
message.attach(app.makePath('uploads/invoice.pdf'), {
  filename: 'invoice_october_2023.pdf'
})
```

`message.attach` 方法接受的完整选项列表如下。

<table>
<thead>
<tr>
<th>选项</th>
<th>描述</th>
</tr>
</thead>
<tbody><tr>
<td><code>filename</code></td>
<td>附件的显示名称。默认为附件路径的基本名称。</td>
</tr>
<tr>
<td><code>contentType</code></td>
<td>附件的内容类型。如果未设置，<code>contentType</code> 将从文件扩展名推断。</td>
</tr>
<tr>
<td><code>contentDisposition</code></td>
<td>附件的内容处置类型。默认为 <code>attachment</code></td>
</tr>
<tr>
<td><code>headers</code></td>
<td>
<p>附件节点的自定义头。headers 属性是一个键值对</p>
</td>
</tr>
</tbody></table>

#### 从流和缓冲区附加文件
你可以使用 `message.attachData` 方法从流和缓冲区创建电子邮件附件。该方法接受可读流或缓冲区作为第一个参数，选项对象作为第二个参数。

:::note

在使用 `mail.sendLater` 方法排队电子邮件时，不应使用 `message.attachData` 方法。由于排队的作业被序列化并持久化在数据库中，附加原始数据将增加存储大小。

此外，如果你使用 `message.attachData` 方法附加流，排队电子邮件将失败。
:::

```ts
message.attachData(fs.createReadStream('./invoice.pdf'), {
  filename: 'invoice_october_2023.pdf'
})
```

```ts
message.attachData(Buffer.from('aGVsbG8gd29ybGQh'), {
  encoding: 'base64',
  filename: 'greeting.txt',
})
```

### 嵌入图片
你可以使用 `embedImage` 视图助手在电子邮件内容中嵌入图片。`embedImage` 方法在底层使用 [CID](https://sendgrid.com/en-us/blog/embedding-images-emails-facts#1-cid-embedded-images-inline-images) 将图片标记为附件，并使用其内容 ID 作为图片的源。

```edge
<img src="{{
  embedImage(app.makePath('assets/hero.jpg'))
}}" />
```

以下是输出 HTML

```html
<img src="cid:a-random-content-id" />
```

以下附件将自动定义在电子邮件负载上。

```ts
{
  attachments: [{
    path: '/root/app/assets/hero.jpg',
    filename: 'hero.jpg',
    cid: 'a-random-content-id'
  }]
}
```

#### 从缓冲区嵌入图片

与 `embedImage` 方法一样，你可以使用 `embedImageData` 方法从原始数据嵌入图片。

```edge
<img src="{{
  embedImageData(rawBuffer, { filename: 'hero.jpg' })
}}" />
```

### 附加日历事件
你可以使用 `message.icalEvent` 方法将日历事件附加到电子邮件。`icalEvent` 方法接受事件内容作为第一个参数，`options` 对象作为第二个参数。

```ts
const contents = 'BEGIN:VCALENDAR\r\nPRODID:-//ACME/DesktopCalendar//EN\r\nMETHOD:REQUEST\r\n...'

await mail.send((message) => {
  message.icalEvent(contents, {
    method: 'PUBLISH',
    filename: 'invite.ics',
  })
})
```

由于手动定义事件文件内容可能很麻烦，你可以将回调函数传递给 `icalEvent` 方法，并使用 JavaScript API 生成邀请内容。

提供给回调函数的 `calendar` 对象是 [ical-generator](https://www.npmjs.com/package/ical-generator) npm 包的引用，因此请务必也仔细阅读该包的 README 文件。

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

#### 从文件或 URL 读取邀请内容
你可以使用 `icalEventFromFile` 或 `icalEventFromUrl` 方法从文件或 HTTP URL 定义邀请内容。

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
message.icalEventFromUrl(
  'https://myapp.com/users/1/invite.ics',
  {
    filename: 'invite.ics',
    method: 'PUBLISH'
  }
)
```

### 定义邮件头
你可以使用 `message.header` 方法定义额外的电子邮件头。该方法接受头键作为第一个参数，值作为第二个参数。

```ts
message.header('x-my-key', 'header value')

/**
 * Define an array of values
 */
message.header('x-my-key', ['header value', 'another value'])
```

默认情况下，电子邮件头会被编码和折叠，以满足拥有不超过 78 字节行的纯 ASCII 消息的要求。但是，如果你想绕过编码规则，你可以使用 `message.preparedHeader` 方法设置头。

```ts
message.preparedHeader(
  'x-unprocessed',
  'a really long header or value with non-ascii characters 👮',
)
```

### 定义 `List` 头
消息类包含辅助方法，可以轻松定义复杂的头，如 [List-Unsubscribe](https://sendgrid.com/en-us/blog/list-unsubscribe) 或 [List-Help](https://support.optimizely.com/hc/en-us/articles/4413200569997-Setting-up-the-List-Help-header#heading-2)。你可以在 [nodemailer 网站](https://nodemailer.com/message/list-headers/) 上了解 `List` 头的编码规则。

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

对于所有其他任意 `List` 头，你可以使用 `addListHeader` 方法。

```ts
message.addListHeader('post', 'http://example.com/post')
// List-Post: <http://example.com/post>
```

## 基于类的邮件

你可以将它们移动到专用的邮件类中，而不是在 `mail.send` 方法闭包内编写电子邮件，以便更好地组织和 [更容易测试](#testing-mail-classes)。

邮件类存储在 `./app/mails` 目录中，每个文件代表一封电子邮件。你可以通过运行 `make:mail` ace 命令来创建邮件类。

另请参阅：[Make mail 命令](../references/commands.md#makemail)

```sh
node ace make:mail verify_email
```

邮件类继承自 [BaseMail](https://github.com/adonisjs/mail/blob/main/src/base_mail.ts) 类，并搭建了以下属性和方法。你可以使用 `this.message` 属性在 `prepare` 方法中配置邮件消息。

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

配置发送者的电子邮件地址。如果你省略此属性，则必须调用 `message.from` 方法来定义发送者。

</dd>

<dt>

subject

</dt>

<dd>

配置电子邮件主题。如果你省略此属性，则必须使用 `message.subject` 方法来定义电子邮件主题。

</dd>

<dt>

replyTo

</dt>

<dd>

配置 `replyTo` 电子邮件地址。

</dd>

<dt>

prepare

</dt>

<dd>

`prepare` 方法由 `build` 方法自动调用，以准备发送邮件消息。

你必须在此方法中定义电子邮件内容、附件、收件人等。

</dd>

<dt>

build :span[Inherited]{class="badge"}

</dt>

<dd>

`build` 方法继承自 `BaseMail` 类。该方法在发送电子邮件时自动调用。

如果你决定覆盖此方法，请确保参考 [原始实现](https://github.com/adonisjs/mail/blob/main/src/base_mail.ts#L81)。

</dd>

</dl>

### 使用邮件类发送邮件
你可以调用 `mail.send` 方法并将邮件类的实例传递给它来发送电子邮件。例如：

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

你可以使用构造函数参数与邮件类共享数据。例如：

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

### 测试邮件类

使用 [邮件类](#class-based-emails) 的主要好处之一是更好的测试体验。你可以构建邮件类而不发送它们，并为消息属性编写断言。

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

你可以按如下方式为消息内容编写断言。

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

此外，你可以为附件编写断言。断言仅适用于基于文件的附件，不适用于流或原始内容。

```ts
const email = new VerifyEmailNotification()
await email.buildWithContents()

// highlight-start
email.message.assertAttachment(
  app.makePath('uploads/invoice.pdf')
)
// highlight-end
```

请随时查看 [Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) 类源代码以获取所有可用的断言方法。

## 伪造邮件发送器 (Fake mailer)
你可能希望在测试期间使用伪造邮件发送器，以防止你的应用程序发送电子邮件。伪造邮件发送器在内存中收集所有发出的电子邮件，并提供易于使用的 API 来针对它们编写断言。

在下面的示例中：

- 我们首先使用 `mail.fake` 方法创建一个 [FakeMailer](https://github.com/adonisjs/mail/blob/main/src/fake_mailer.ts) 的实例。
- 接下来，我们调用 `/register` 端点 API。
- 最后，我们使用伪造邮件发送器中的 `mails` 属性来断言 `VerifyEmailNotification` 已发送。

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

完成编写测试后，你必须使用 `mail.restore` 方法恢复伪造。

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

### 编写断言

`mails.assertSent` 方法接受邮件类构造函数作为第一个参数，并在无法找到预期类的任何电子邮件时抛出异常。

```ts
const { mails } = mail.fake()

/**
 * Assert the email was sent
 */
mails.assertSent(VerifyEmailNotification)
```

你可以将回调函数传递给 `assertSent` 方法，以进一步检查电子邮件是否发送给预期的收件人或具有正确的主题。

回调函数接收邮件类的实例，你可以使用 `.message` 属性访问 [message](#configuring-message) 对象。

```ts
mails.assertSent(VerifyEmailNotification, (email) => {
  return email.message.hasTo(userData.email)
})
```

你可以在回调中对 `message` 对象运行断言。例如：

```ts
mails.assertSent(VerifyEmailNotification, (email) => {
  email.message.assertTo(userData.email)
  email.message.assertFrom('info@example.org')
  email.message.assertSubject('Verify your email address')

  /**
   * All assertions passed, so return true to consider the
   * email as sent.
   */
  return true
})
```

#### 断言邮件未发送

你可以使用 `mails.assertNotSent` 方法来断言测试期间未发送电子邮件。此方法与 `assertSent` 方法相反，并接受相同的参数。

```ts
const { mails } = mail.fake()

mails.assertNotSent(PasswordResetNotification)
```

#### 断言邮件数量

最后，你可以使用 `assertSentCount` 和 `assertNoneSent` 方法断言已发送电子邮件的数量。

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

### 为排队邮件编写断言

如果你使用 `mail.sendLater` 方法排队了电子邮件，你可以使用以下方法为它们编写断言。

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

### 获取已发送或排队的邮件列表

你可以使用 `mails.sent` 或 `mails.queued` 方法获取测试期间已发送/排队的电子邮件数组。

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

## 创建自定义传输

AdonisJS Mail 传输构建在 [Nodemailer 传输](https://nodemailer.com/plugins/create/#transports) 之上；因此，在将其注册到 Mail 包之前，你必须创建/使用 nodemailer 传输。

在本指南中，我们将把 [nodemailer-postmark-transport](https://www.npmjs.com/package/nodemailer-postmark-transport) 包装到 AdonisJS Mail 传输中。

```sh
npm i nodemailer nodemailer-postmark-transport
```

正如你在下面的示例中看到的，发送电子邮件的繁重工作是由 Nodemailer 完成的。AdonisJS 传输充当适配器，将消息转发给 nodemailer 并将其响应规范化为 [MailResponse](https://github.com/adonisjs/mail/blob/main/src/mail_response.ts) 的实例。

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
export type PostmarkConfig = {
  auth: {
    apiKey: string
  }
}

/**
 * Transport implementation
 */
export class PostmarkTransport implements MailTransportContract {
  #config: PostmarkConfig
  constructor(config: PostmarkConfig) {
    this.#config = config
  }

  #createNodemailerTransport(config: PostmarkConfig) {
    return nodemailer.createTransport(nodemailerTransport(config))
  }

  async send(
    message: NodeMailerMessage,
    config?: PostmarkConfig
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

### 创建配置工厂函数
要在 `config/mail.ts` 文件中引用上述传输，你必须创建一个返回传输实例的工厂函数。

你可以在传输实现的同一文件中编写以下代码。

```ts
import type {
  NodeMailerMessage,
  MailTransportContract,
  // insert-start
  MailManagerTransportFactory
  // insert-end
} from '@adonisjs/mail/types'

export function PostmarkTransport(
  config: PostmarkConfig
): MailManagerTransportFactory {
  return () => {
    return new PostmarkTransport(config)
  }
}
```

### 使用传输
最后，你可以使用 `postmarkTransport` 助手在配置文件中引用传输。

```ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/mail'
import { postmarkTransport } from 'my-custom-package'

const mailConfig = defineConfig({
  mailers: {
    postmark: postmarkTransport({
      auth: {
        apiKey: env.get('POSTMARK_API_KEY'),
      },
    }),
  },
})
```
