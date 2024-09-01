---
summary: \@adonisjs/mailパッケージを使用して、AdonisJSアプリケーションからメールを送信する方法を学びます。
---

# メール

`@adonisjs/mail`パッケージを使用して、AdonisJSアプリケーションからメールを送信できます。このメールパッケージは、[Nodemailer](https://nodemailer.com/)をベースにしており、以下のような利便性の向上をもたらします。

- メールメッセージを設定するためのフルエントAPI。
- より良い組織とテストのために、メールをクラスとして定義する機能。
- 公式にメンテナンスされているトランスポートの包括的なスイート。`smtp`、`ses`、`mailgun`、`sparkpost`、`resend`、`brevo`を含みます。
- Fakes APIを使用したテストの改善。
- メールをキューに入れるためのメールメッセンジャー。
- カレンダーイベントを生成するための機能API。

## インストール

次のコマンドを使用してパッケージをインストールし、設定します：

```sh
node ace add @adonisjs/mail

# CLIフラグを使用して使用するトランスポートを事前に定義する
node ace add @adonisjs/mail --transports=resend --transports=smtp
```

:::disclosure{title="addコマンドによって実行されるステップを参照"}

1. 検出されたパッケージマネージャを使用して`@adonisjs/mail`パッケージをインストールします。

2. 次のサービスプロバイダとコマンドを`adonisrc.ts`ファイル内に登録します。

    ```ts
    {
      commands: [
        // ...他のコマンド
        () => import('@adonisjs/mail/commands')
      ],
      providers: [
        // ...他のプロバイダ
        () => import('@adonisjs/mail/mail_provider')
      ]
    }
    ```
3. `config/mail.ts`ファイルを作成します。

4. 選択したメールサービスの環境変数とそのバリデーションを定義します。

:::


## 設定

メールパッケージの設定は`config/mail.ts`ファイルに保存されます。このファイル内で、複数のメールサービスを`mailers`として設定できます。

詳細はこちら：[Config stub](https://github.com/adonisjs/mail/blob/main/stubs/config/mail.stub)

```ts
import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

  /**
   * "from"プロパティのための静的なアドレス。メールで明示的なfromアドレスが設定されていない場合に使用されます。
   */
  from: {
    address: '',
    name: '',
  },

  /**
   * "reply-to"プロパティのための静的なアドレス。メールで明示的なreplyToアドレスが設定されていない場合に使用されます。
   */
  replyTo: {
    address: '',
    name: '',
  },

  /**
   * mailersオブジェクトは、異なるトランスポートまたは異なるオプションを使用する同じトランスポートを使用して複数のメーラーを設定するために使用できます。
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

デフォルトでメールを送信するために使用するメーラーの名前。

</dd>

<dt>

from

</dt>

<dd>

`from`プロパティに使用する静的なグローバルアドレス。メールで明示的な`from`アドレスが定義されていない場合に使用されます。

</dd>

<dt>

replyTo

</dt>

<dd>

`reply-to`プロパティに使用する静的なグローバルアドレス。メールで明示的な`replyTo`アドレスが定義されていない場合に使用されます。

</dd>

<dt>

mailers

</dt>

<dd>

`mailers`オブジェクトは、メールを送信するために使用する1つ以上のメーラーを設定するために使用されます。`mail.use`メソッドを使用してメーラーを実行時に切り替えることができます。

</dd>

</dl>

## トランスポートの設定
公式にサポートされているトランスポートが受け入れる設定オプションの完全なリファレンスは次のとおりです。

詳細はこちら：[TypeScript types for config object](https://github.com/adonisjs/mail/blob/main/src/types.ts#L261)

<div class="disclosure_wrapper">

:::disclosure{title="Mailgunの設定"}
<br />

次の設定オプションは、Mailgunの[`/messages.mime`](https://documentation.mailgun.com/en/latest/api-sending.html#sending)APIエンドポイントに送信されます。

```ts
{
  mailers: {
    mailgun: transports.mailgun({
      baseUrl: 'https://api.mailgun.net/v3',
      key: env.get('MAILGUN_API_KEY'),
      domain: env.get('MAILGUN_DOMAIN'),

      /**
       * メールの`mail.send`メソッドを呼び出す際にランタイムでオーバーライドできる次のオプション。
       */
      oDkim: true,
      oTags: ['transactional', 'adonisjs_app'],
      oDeliverytime: new Date(2024, 8, 18),
      oTestMode: false,
      oTracking: false,
      oTrackingClick: false,
      oTrackingOpens: false,
      headers: {
        // h:プレフィックス付きヘッダー
      },
      variables: {
        appId: '',
        userId: '',
        // v:プレフィックス付き変数
      }
    })
  }
}
```

:::

:::disclosure{title="SMTPの設定"}
<br />

次の設定オプションは、Nodemailerにそのまま転送されます。そのため、[Nodemailerのドキュメント](https://nodemailer.com/smtp/)も参照してください。

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

:::disclosure{title="SESの設定"}
<br />

次の設定オプションは、Nodemailerにそのまま転送されます。そのため、[Nodemailerのドキュメント](https://nodemailer.com/transports/ses/)も参照してください。

SESトランスポートを使用するには、`@aws-sdk/client-ses`パッケージをインストールする必要があります。

```ts
{
  mailers: {
    ses: transports.ses({
      /**
       * aws sdkに転送されます
       */
      apiVersion: '2010-12-01',
      region: 'us-east-1',
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
      },

      /**
       * Nodemailer固有の設定
       */
      sendingRate: 10,
      maxConnections: 5,
    })
  }
}
```

:::

:::disclosure{title="SparkPostの設定"}

<br />

次の設定オプションは、SparkPostの[`/transmissions`](https://developers.sparkpost.com/api/transmissions/#header-request-body)APIエンドポイントに送信されます。

```ts
{
  mailers: {
    sparkpost: transports.sparkpost({
      baseUrl: 'https://api.sparkpost.com/api/v1',
      key: env.get('SPARKPOST_API_KEY'),

      /**
       * メールの`mail.send`メソッドを呼び出す際にランタイムでオーバーライドできる次のオプション。
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

:::disclosure{title="Resendの設定"}
<br />

次の設定オプションは、Resendの[`/emails`](https://resend.com/docs/api-reference/emails/send-email)APIエンドポイントに送信されます。

```ts
{
  mailers: {
    resend: transports.resend({
      baseUrl: 'https://api.resend.com',
      key: env.get('RESEND_API_KEY'),

      /**
       * メールの`mail.send`メソッドを呼び出す際にランタイムでオーバーライドできる次のオプション。
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

## 基本的な例

初期設定が完了したら、`mail.send`メソッドを使用してメールを送信できます。メールサービスは、設定ファイルで構成された`default`メーラーのシングルトンインスタンスであり、[MailManager](https://github.com/adonisjs/mail/blob/main/src/mail_manager.ts)クラスのインスタンスです。

`mail.send`メソッドは、[Message](https://github.com/adonisjs/mail/blob/main/src/message.ts)クラスのインスタンスをコールバックに渡し、メールを`config`ファイルで構成された`default`メーラーを使用して配信します。

次の例では、新しいユーザーアカウントを作成した後、コントローラーからメールをトリガーしています。

```ts
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
// highlight-start
import mail from '@adonisjs/mail/services/main'
// highlight-end

export default class UsersController {
  async store({ request }: HttpContext) {
    /**
     * デモンストレーションのためだけです。データをデータベースに保存する前にデータをバリデーションする必要があります。
     */
    const user = await User.create(request.all())

    // highlight-start
    await mail.send((message) => {
      message
        .to(user.email)
        .from('info@example.org')
        .subject('メールアドレスの確認')
        .htmlView('emails/verify_email', { user })
    })
    // highlight-end
  }
}
```

## メールのキューイング
メールの送信には時間がかかる場合があるため、キューに入れてバックグラウンドでメールを送信あります。`mail.sendLater`メソッドを使用して同じことができます。

`sendLater`メソッドは、`send`メソッドと同じパラメーターを受け入れます。ただし、メールを即座に送信する代わりに、**Mailメッセンジャー**を使用してキューに入れます。

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
    .subject('メールアドレスの確認')
    .htmlView('emails/verify_email', { user })
})
```

デフォルトでは、**mailメッセンジャーはインメモリキュー**を使用します。つまり、プロセスが保留中のジョブで終了すると、キューはジョブを破棄します。アプリケーションのUIが手動のアクションでメールの再送信を許可している場合、これは大きな問題ではありません。ただし、カスタムメッセンジャーを設定し、データベースをバックエンドキューとして使用することもできます。

### メールのキューイングにBullMQを使用する

```sh
npm i bullmq
```

次の例では、`mail.setMessenger`メソッドを使用して、ジョブを保存するために`bullmq`を使用するカスタムキューを設定します。

ジョブにはコンパイルされたメール、ランタイム設定、およびメーラー名が含まれます。後でこれらのデータを使用してワーカープロセス内でメールを送信します。

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

最後に、キューワーカーのコードを記述します。アプリケーションのワークフローに応じて、ジョブを処理するために別のプロセスを起動する必要があるかもしれません。

次の例では：

- `emails`キューから`send_email`という名前のジョブを処理します。
- ジョブデータからコンパイルされたメール、ランタイム設定、およびメーラー名にアクセスします。
- `mailer.sendCompiled`メソッドを使用してメールを送信します。

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

以上です！`mail.sendLater`メソッドを引き続き使用できます。ただし、今回はメールがredisデータベースにキューイングされます。

## メーラーの切り替え
`mail.use`メソッドを使用して、設定ファイルで定義されたメーラー間を切り替えることができます。`mail.use`メソッドは、メーラーの名前（設定ファイルで定義された名前）を受け入れ、[Mailer](https://github.com/adonisjs/mail/blob/main/src/mailer.ts)クラスのインスタンスを返します。

```ts
import mail from '@adonisjs/mail/services/main'

mail.use() // Instance of default mailer
mail.use('mailgun') // Mailgun mailer instance
```
以下の例では、メーラーインスタンスを使用してメールを送信するために `mailer.send` または `mailer.sendLater` メソッドを呼び出すことができます。

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

メーラーインスタンスはプロセスのライフサイクルの間キャッシュされます。既存のインスタンスを破棄し、新しいインスタンスをゼロから作成するために `mail.close` メソッドを使用できます。

```ts
import mail from '@adonisjs/mail/services/main'

/**
 * トランスポートを閉じてインスタンスをキャッシュから削除します
 */
await mail.close('mailgun')

/**
 * 新しいインスタンスを作成します
 */
mail.use('mailgun')
```

## テンプレートエンジンの設定
デフォルトでは、メールパッケージはメールの **HTML** および **プレーンテキスト** コンテンツを定義するために [Edge テンプレートエンジン](../views-and-templates/introduction.md#configuring-edge) を使用するように設定されています。

ただし、次の例に示すように、`Message.templateEngine` プロパティをオーバーライドしてカスタムテンプレートエンジンを登録することもできます。

参照: [メールコンテンツの定義](#メールコンテンツの定義)

```ts
import { Message } from '@adonisjs/mail'

Message.templateEngine = {
  async render(templatePath, data) {
    return someTemplateEngine.render(templatePath, data)
  }
}
```

## イベント
`@adonisjs/mail` パッケージによってディスパッチされるイベントのリストを表示するには、[イベントリファレンスガイド](../references/events.md#mailsending)を参照してください。

## メッセージの設定

メールのプロパティは、`mail.send` または `mail.sendLater` メソッドを使用して作成されたコールバック関数に提供される [Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) クラスを使用して定義されます。

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

### 件名と送信元の定義
`message.subject` メソッドを使用してメールの件名を定義し、`message.from` メソッドを使用してメールの送信元を定義できます。

```ts
await mail.send((message) => {
  message
  // highlight-start
    .subject('メールアドレスの確認')
    .from('info@example.org')
  // highlight-end
})
```

`from` メソッドは、メールアドレスを文字列または送信者名とメールアドレスのオブジェクトとして受け入れます。

```ts
message
  .from({
    address: 'info@example.com',
    name: 'AdonisJS'
  })
```

送信者は、個々のメッセージに明示的な送信者が定義されていない場合に、グローバルに定義された設定ファイル内の送信者が使用されます。

```ts
const mailConfig = defineConfig({
  from: {
    address: 'info@example.com',
    name: 'AdonisJS'
  }
})
```

### 受信者の定義
`message.to`、`message.cc`、および `message.bcc` メソッドを使用してメールの受信者を定義できます。これらのメソッドは、メールアドレスを文字列または受信者名とメールアドレスのオブジェクトとして受け入れます。

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

複数の `cc` および `bcc` 受信者を、メールアドレスの配列またはメールアドレスと受信者名のオブジェクトの配列として定義できます。

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

`message.replyTo` メソッドを使用して `replyTo` メールアドレスを定義することもできます。

```ts
await mail.send((message) => {
  message
    .from('info@example.org')
    // highlight-start
    .replyTo('noreply@example.org')
    // highlight-end
})
```

### メールコンテンツの定義
`message.html` または `message.text` メソッドを使用してメールの **HTML** および **プレーンテキスト** コンテンツを定義できます。

```ts
await mail.send((message) => {
  /**
   * HTML コンテンツ
   */
  message.html(`
    <h1> メールアドレスの確認 </h1>
    <p> <a href="https://myapp.com">こちらをクリック</a>してメールアドレスを確認してください</a>
  `)

  /**
   * プレーンテキストコンテンツ
   */
  message.text(`
    メールアドレスの確認
    メールアドレスを確認するには、https://myapp.com にアクセスしてください
  `)
})
```

#### Edge テンプレートの使用

インラインコンテンツを記述することは煩雑な場合があるため、代わりにEdgeテンプレートを使用することもできます。すでに [Edge の設定](../views-and-templates/introduction.md#configuring-edge) を行っている場合は、`message.htmlView` および `message.textView` メソッドを使用してテンプレートをレンダリングできます。

```sh
// title: テンプレートの作成
node ace make:view emails/verify_email_html
node ace make:view emails/verify_email_text
```

```ts
// title: コンテンツの定義に使用する
await mail.send((message) => {
  message.htmlView('emails/verify_email_html', stateToShare)
  message.textView('emails/verify_email_text', stateToShare)
})
```

#### メールマークアップのための MJML の使用
MJMLは、すべてのメールクライアントでメールが見栄え良く表示されるようにするための複雑なHTMLを書かずにメールを作成するためのマークアップ言語です。

まず、[mjml](https://npmjs.com/mjml) パッケージをnpmからインストールします。

```sh
npm i mjml
```

インストールが完了したら、Edgeテンプレート内でMJMLマークアップを記述するために`@mjml`タグで囲むことができます。

:::note

MJMLの出力には`html`、`head`、および`body`タグが含まれているため、Edgeテンプレート内でこれらを定義する必要はありません。

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

`@mjml` タグに [MJML の設定オプション](https://documentation.mjml.io/#inside-node-js) をプロップスとして渡すこともできます。

```edge
@mjml({
  keepComments: false,
  fonts: {
    Lato: 'https://fonts.googleapis.com/css?family=Lato:400,500,700'
  }
})
```

### ファイルの添付
`message.attach` メソッドを使用して、メールに添付ファイルを送信できます。`attach` メソッドは、添付ファイルの絶対パスまたはファイルシステムのURLを受け入れます。

```ts
import app from '@adonisjs/core/services/app'

await mail.send((message) => {
  message.attach(app.makePath('uploads/invoice.pdf'))
})
```

`options.filename` プロパティを使用して添付ファイルのファイル名を定義することもできます。

```ts
message.attach(app.makePath('uploads/invoice.pdf'), {
  filename: 'invoice_october_2023.pdf'
})
```

`message.attach` メソッドが受け入れるオプションの完全なリストは次のとおりです。

<table>
<thead>
<tr>
<th>オプション</th>
<th>説明</th>
</tr>
</thead>
<tbody><tr>
<td><code>filename</code></td>
<td>添付ファイルの表示名。デフォルトは添付ファイルパスのベース名です。</td>
</tr>
<tr>
<td><code>contentType</code></td>
<td>添付ファイルのコンテンツタイプ。設定されていない場合、<code>contentType</code> はファイルの拡張子から推測されます。</td>
</tr>
<tr>
<td><code>contentDisposition</code></td>
<td>添付ファイルのコンテンツディスポジションタイプ。デフォルトは <code>attachment</code> です</td>
</tr>
<tr>
<td><code>headers</code></td>
<td>
<p>添付ファイルノードのカスタムヘッダー。ヘッダープロパティはキーと値のペアです</p>
</td>
</tr>
</tbody></table>

#### ストリームとバッファからのファイルの添付
`message.attachData` メソッドを使用して、ストリームとバッファからメール添付ファイルを作成できます。メソッドは、読み込み可能なストリームまたはバッファを第1引数として、オプションオブジェクトを第2引数として受け入れます。

:::note

`message.attachData` メソッドは、`mail.sendLater` メソッドを使用してメールをキューに入れる場合には使用しないでください。キューに入れられたジョブはシリアライズされ、データベース内に永続化されるため、生データを添付するとストレージサイズが増加します。

また、`message.attachData` メソッドを使用してストリームを添付すると、メールのキューイングが失敗します。
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

### 画像の埋め込み
`embedImage` ビューヘルパーを使用して、メールのコンテンツ内に画像を埋め込むことができます。`embedImage` メソッドは、画像を添付ファイルとしてマークし、そのコンテンツIDを画像のソースとして使用します。

```edge
<img src="{{
  embedImage(app.makePath('assets/hero.jpg'))
}}" />
```

以下が出力されるHTMLです。

```html
<img src="cid:a-random-content-id" />
```

次の添付ファイルが自動的にメールペイロードに定義されます。

```ts
{
  attachments: [{
    path: '/root/app/assets/hero.jpg',
    filename: 'hero.jpg',
    cid: 'a-random-content-id'
  }]
}
```

#### バッファから画像を埋め込む

`embedImage` メソッドと同様に、`embedImageData` メソッドを使用して生データから画像を埋め込むことができます。

```edge
<img src="{{
  embedImageData(rawBuffer, { filename: 'hero.jpg' })
}}" />
```

### カレンダーイベントの添付
`message.icalEvent` メソッドを使用して、メールにカレンダーイベントを添付できます。`icalEvent` メソッドは、最初のパラメータとしてイベントの内容、2番目のパラメータとして `options` オブジェクトを受け入れます。

```ts
const contents = 'BEGIN:VCALENDAR\r\nPRODID:-//ACME/DesktopCalendar//EN\r\nMETHOD:REQUEST\r\n...'

await mail.send((message) => {
  message.icalEvent(contents, {
    method: 'PUBLISH',
    filename: 'invite.ics',
  })
})
```

イベントファイルの内容を手動で定義するのは煩雑な場合があるため、`icalEvent` メソッドにコールバック関数を渡し、JavaScript APIを使用して招待内容を生成することもできます。

コールバック関数に提供される `calendar` オブジェクトは、[ical-generator](https://www.npmjs.com/package/ical-generator)npmパッケージの参照ですので、パッケージのREADMEファイルも参照してください。

```ts
message.icalEvent((calendar) => {
  // highlight-start
  calendar
    .createEvent({
      summary: 'ALS のサポートを追加',
      start: DateTime.local().plus({ minutes: 30 }),
      end: DateTime.local().plus({ minutes: 60 }),
    })
  // highlight-end
}, {
  method: 'PUBLISH',
  filename: 'invite.ics',
})
```

#### ファイルまたは URL からの招待内容の読み取り
`icalEventFromFile` メソッドまたは `icalEventFromUrl` メソッドを使用して、ファイルまたは HTTP URL から招待内容を定義できます。

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

### メールヘッダの定義
`message.header` メソッドを使用して、追加のメールヘッダを定義できます。メソッドは、第1パラメータとしてヘッダキー、第2パラメータとして値を受け入れます。

```ts
message.header('x-my-key', 'ヘッダの値')

/**
 * 値の配列を定義することもできます
 */
message.header('x-my-key', ['ヘッダの値', '別の値'])
```

デフォルトでは、メールヘッダはエンコードされ、78バイトを超えないプレーンASCIIメッセージの要件を満たすために折り返されます。ただし、エンコーディングルールをバイパスしたい場合は、`message.preparedHeader` メソッドを使用してヘッダを設定することもできます。

```ts
message.preparedHeader(
  'x-unprocessed',
  '非ASCII文字を含む非常に長いヘッダまたは値 👮',
)
```

### `List` ヘッダの定義
メッセージクラスには、[List-Unsubscribe](https://sendgrid.com/en-us/blog/list-unsubscribe)や[List-Help](https://support.optimizely.com/hc/en-us/articles/4413200569997-Setting-up-the-List-Help-header#heading-2) のような複雑なヘッダを簡単に定義するためのヘルパーメソッドが用意されています。`List`ヘッダのエンコーディングルールについては、[nodemailerのウェブサイト](https://nodemailer.com/message/list-headers/)を参照してください。

```ts
message.listHelp('admin@example.com?subject=help')
// List-Help: <mailto:admin@example.com?subject=help>
```

```ts
message.listUnsubscribe({
  url: 'http://example.com',
  comment: 'コメント'
})
// List-Unsubscribe: <http://example.com> (コメント)
```

```ts
/**
 * ヘッダを複数回繰り返す
 */
message.listSubscribe('admin@example.com?subject=subscribe')
message.listSubscribe({
  url: 'http://example.com',
  comment: '購読'
})
// List-Subscribe: <mailto:admin@example.com?subject=subscribe>
// List-Subscribe: <http://example.com> (購読)
```

その他の任意の `List` ヘッダについては、`addListHeader` メソッドを使用できます。

```ts
message.addListHeader('post', 'http://example.com/post')
// List-Post: <http://example.com/post>
```

## クラスベースのメール

`mail.send` メソッドのクロージャ内でメールを記述する代わりに、より良い組織化と[簡単なテスト](#メールクラスのテスト)のために、専用のメールクラスに移動できます。

メールクラスは `./app/mails` ディレクトリに保存され、各ファイルが1つのメールを表します。`make:mail` aceコマンドを実行してメールクラスを作成できます。

参照: [メール作成コマンド](../references/commands.md#makemail)

```sh
node ace make:mail verify_email
```

メールクラスは [BaseMail](https://github.com/adonisjs/mail/blob/main/src/base_mail.ts) クラスを拡張し、以下のプロパティとメソッドが用意されています。`prepare` メソッド内で `this.message` プロパティを使用してメールメッセージを設定できます。

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

送信者のメールアドレスを設定します。このプロパティを省略する場合は、送信者を定義するために `message.from` メソッドを呼び出す必要があります。

</dd>

<dt>

subject

</dt>

<dd>

メールの件名を設定します。このプロパティを省略する場合は、`message.subject` メソッドを使用してメールの件名を定義する必要があります。

</dd>

<dt>

replyTo

</dt>

<dd>

`replyTo` のメールアドレスを設定します。

</dd>

<dt>

prepare

</dt>

<dd>

`prepare` メソッドは、`build` メソッドによって自動的に呼び出され、メールメッセージの送信の準備をします。

このメソッド内でメールの内容、添付ファイル、受信者などを定義する必要があります。

</dd>

<dt>

build :span[継承]{class="badge"}

</dt>

<dd>

`build` メソッドは `BaseMail` クラスから継承されたメソッドです。このメソッドはメールの送信時に自動的に呼び出されます。

このメソッドをオーバーライドする場合は、[元の実装](https://github.com/adonisjs/mail/blob/main/src/base_mail.ts#L81)を参照してください。

</dd>

</dl>

### メールクラスを使用してメールを送信する
`mail.send` メソッドを呼び出し、メールクラスのインスタンスを渡すことでメールを送信できます。例:

```ts
// title: メールを送信する
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email'

await mail.send(new VerifyEmailNotification())
```

```ts
// title: メールをキューに入れる
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email'

await mail.sendLater(new VerifyEmailNotification())
```

メールクラスにデータを共有する場合は、コンストラクタ引数を使用してデータを渡すことができます。例:

```ts
/**
 * ユーザーを作成する
 */
const user = await User.create(payload)

await mail.send(
  /**
   * メールクラスにユーザーを渡す
   */
  new VerifyEmailNotification(user)
)
```

### メールクラスのテスト

[メールクラス](#クラスベースのメール)を使用する主な利点の1つは、テストの経験が向上することです。メールを送信せずにメールクラスをビルドし、メッセージのプロパティに対してアサーションを記述できます。

```ts
import { test } from '@japa/runner'
import VerifyEmailNotification from '#mails/verify_email'

test.group('Verify email notification', () => {
  test('prepare email for sending', async () => {
    const email = new VerifyEmailNotification()

    /**
     * メールメッセージをビルドし、テンプレートをレンダリングして
     * メールのHTMLとプレーンテキストの内容を計算します
     */
    await email.buildWithContents()

    /**
     * メッセージが期待どおりにビルドされたことを確認するためのアサーションを記述します
     */
    email.message.assertTo('user@example.org')
    email.message.assertFrom('info@example.org')
    email.message.assertSubject('Verify email address')
    email.message.assertReplyTo('no-reply@example.org')
  })
})
```

次のようにメッセージの内容に対してアサーションを記述することもできます。

```ts
const email = new VerifyEmailNotification()
await email.buildWithContents()

// highlight-start
email.message.assertHtmlIncludes(
  `<a href="/emails/1/verify"> メールアドレスを確認する </a>`
)
email.message.assertTextIncludes('メールアドレスを確認する')
// highlight-end
```

また、添付ファイルに対してもアサーションを記述できます。アサーションはファイルベースの添付ファイルに対してのみ機能し、ストリームや生データには対応していません。

```ts
const email = new VerifyEmailNotification()
await email.buildWithContents()

// highlight-start
email.message.assertAttachment(
  app.makePath('uploads/invoice.pdf')
)
// highlight-end
```

利用可能なアサーションメソッドの一覧については、[Message](https://github.com/adonisjs/mail/blob/main/src/message.ts) クラスのソースコードを参照してください。

## フェイクメーラー
テスト中にメールを送信しないようにするために、フェイクメーラーを使用できます。フェイクメーラーは、メモリ内で送信されたすべてのメールを収集し、それらに対してアサーションを行うための使いやすいAPIを提供します。

次の例では、以下の手順でフェイクメーラーを使用します。

- `mail.fake` メソッドを使用して [FakeMailer](https://github.com/adonisjs/mail/blob/main/src/fake_mailer.ts) のインスタンスを作成します。
- `/register` エンドポイントAPIを呼び出します。
- フェイクメーラーの `mails` プロパティを使用して `VerifyEmailNotification` が送信されたことをアサートします。

```ts
import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email'

test.group('Users | register', () => {
  test('create a new user account', async ({ client, route }) => {
    // highlight-start
    /**
     * フェイクモードをオンにする
     */
    const { mails } = mail.fake()
    // highlight-end

    /**
     * APIコールを行う
     */
    await client
      .post(route('users.store'))
      .send(userData)

    // highlight-start
    /**
     * コントローラが VerifyEmailNotification メールを送信したことをアサートする
     */
    mails.assertSent(VerifyEmailNotification, ({ message }) => {
      return message
        .hasTo(userData.email)
        .hasSubject('メールアドレスの確認')
    })
    // highlight-end
  })
})
```

テストの記述が終わったら、`mail.restore` メソッドを使用してフェイクを元に戻す必要があります。

```ts
test('create a new user account', async ({ client, route, cleanup }) => {
  const { mails } = mail.fake()

  /**
   * cleanupフックは、テストが正常に終了するかエラーが発生すると実行されます。
   */
  cleanup(() => {
    mail.restore()
  })
})
```

### アサーションの記述

`mails.assertSent` メソッドは、メールクラスのコンストラクタを最初の引数として受け入れ、期待されるクラスのメールが見つからない場合に例外をスローします。

```ts
const { mails } = mail.fake()

/**
 * メールが送信されたことをアサートする
 */
mails.assertSent(VerifyEmailNotification)
```

`assertSent` メソッドにコールバック関数を渡すことで、メールが期待される受信者に送信されたか、正しい件名を持っているかなどをさらにチェックできます。

コールバック関数はメールクラスのインスタンスを受け取り、`.message` プロパティを使用して [message](#メッセージの設定) オブジェクトにアクセスできます。

```ts
mails.assertSent(VerifyEmailNotification, (email) => {
  return email.message.hasTo(userData.email)
})
```

コールバック内で `message` オブジェクトに対してアサーションを実行できます。例:

```ts
mails.assertSent(VerifyEmailNotification, (email) => {
  email.message.assertTo(userData.email)
  email.message.assertFrom('info@example.org')
  email.message.assertSubject('メールアドレスの確認')

  /**
   * すべてのアサーションがパスしたため、メールが送信されたとみなすために true を返します。
   */
  return true
})
```

#### 送信されなかったことをアサートする

`mails.assertNotSent` メソッドを使用して、メールが送信されなかったことをアサートできます。このメソッドは `assertSent` メソッドの逆であり、同じ引数を受け入れます。

```ts
const { mails } = mail.fake()

mails.assertNotSent(PasswordResetNotification)
```

#### 送信されたメールの数をアサートする

最後に、`assertSentCount` メソッドと `assertNoneSent` メソッドを使用して送信されたメールの数をアサートできます。

```ts
const { mails } = mail.fake()

// 2通のメールが合計で送信されたことをアサートする
mails.assertSentCount(2)

// VerifyEmailNotification が1回だけ送信されたことをアサートする
mails.assertSentCount(VerifyEmailNotification, 1)
```

```ts
const { mails } = mail.fake()

// 送信されたメールがないことをアサートする
mails.assertNoneSent()
```

### キューに入れられたメールのアサート

`mail.sendLater` メソッドを使用してキューに入れられたメールがある場合、次のメソッドを使用してアサーションを記述できます。

```ts
const { mails } = mail.fake()

/**
 * VerifyEmailNotification メールがキューに入れられたことをアサートする
 * オプションで、メールを絞り込むためのファインダ関数を渡すこともできます
 */
mails.assertQueued(VerifyEmailNotification)

/**
 * PasswordResetNotification メールがキューに入れられなかったことをアサートする
 * オプションで、メールを絞り込むためのファインダ関数を渡すこともできます
 */
mails.assertNotQueued(PasswordResetNotification)

/**
 * 合計2通のメールがキューに入れられたことをアサートする
 */
mails.assertQueuedCount(2)

/**
 * VerifyEmailNotification メールが1回だけキューに入れられたことをアサートする
 */
mails.assertQueuedCount(VerifyEmailNotification , 1)

/**
 * キューに何も入っていないことをアサートする
 */
mails.assertNoneQueued()
```

### 送信またはキューに入れられたメールのリストを取得する

テスト中に送信/キューに入れられたメールの配列を取得するには、`mails.sent`または`mails.queued`メソッドを使用できます。

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
  email.message.assertHtmlIncludes('<a href="/verify/email"> メールアドレスを確認する</a>')
}
```

## カスタムトランスポートの作成

AdonisJSメールトランスポートは、[Nodemailerトランスポート](https://nodemailer.com/plugins/create/#transports)を基にして構築されているため、Mailパッケージに登録する前にNodemailerトランスポートを作成/使用する必要があります。

このガイドでは、[nodemailer-postmark-transport](https://www.npmjs.com/package/nodemailer-postmark-transport)をAdonisJSメールトランスポートにラップします。

```sh
npm i nodemailer nodemailer-postmark-transport
```

以下の例では、メールの送信は`nodemailer`によって行われます。AdonisJSトランスポートは、メッセージをnodemailerに転送し、その応答を[MailResponse](https://github.com/adonisjs/mail/blob/main/src/mail_response.ts)のインスタンスに正規化します。

```ts
import nodemailer from 'nodemailer'
import nodemailerTransport from 'nodemailer-postmark-transport'

import { MailResponse } from '@adonisjs/mail'
import type {
  NodeMailerMessage,
  MailTransportContract
} from '@adonisjs/mail/types'

/**
 * トランスポートが受け入れる設定
 */
export type PostMarkConfig = {
  auth: {
    apiKey: string
  }
}

/**
 * トランスポートの実装
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
     * Nodemailerトランスポートを作成する
     */
    const transporter = this.#createNodemailerTransport({
      ...this.#config,
      ...config,
    })

    /**
     * メールを送信する
     */
    const response = await transporter.sendMail(message)

    /**
     * 応答を「MailResponse」クラスのインスタンスに正規化する
     */
    return new MailResponse(response.messageId, response.envelope, response)
  }
}
```

### 設定ファクトリ関数の作成
トランスポートを`config/mail.ts`ファイル内で参照するためには、トランスポートの実装を返すファクトリ関数を作成する必要があります。

トランスポートの実装と同じファイルに以下のコードを書くことができます。

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

### トランスポートの使用
最後に、`postMarkTransport`ヘルパーを使用して設定ファイル内でトランスポートを参照できます。

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
