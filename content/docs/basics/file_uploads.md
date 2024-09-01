---
summary: AdonisJSでユーザーがアップロードしたファイルを`request.file`メソッドを使用して処理し、バリデータを使用してバリデーションする方法を学びます。
---

# ファイルのアップロード

AdonisJSは、`multipart/form-data`コンテンツタイプを使用して送信されたユーザーがアップロードしたファイルを処理するための一流のサポートを提供しています。ファイルは、[bodyparserミドルウェア](../basics/body_parser.md#multipart-parser)を使用して自動的に処理され、オペレーティングシステムの`tmp`ディレクトリに保存されます。

後で、コントローラ内でファイルにアクセスし、バリデーションし、永続的な場所やS3のようなクラウドストレージサービスに移動できます。

## ユーザーがアップロードしたファイルにアクセスする

`request.file`メソッドを使用して、ユーザーがアップロードしたファイルにアクセスできます。このメソッドはフィールド名を受け入れ、[MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts)のインスタンスを返します。

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class UserAvatarsController {
  update({ request }: HttpContext) {
    // ハイライト開始
    const avatar = request.file('avatar')
    console.log(avatar)
    // ハイライト終了
  }
}
```

単一の入力フィールドを使用して複数のファイルをアップロードする場合、`request.files`メソッドを使用してそれらにアクセスできます。このメソッドはフィールド名を受け入れ、`MultipartFile`の配列を返します。

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class InvoicesController {
  update({ request }: HttpContext) {
    // ハイライト開始
    const invoiceDocuments = request.files('documents')
    
    for (let document of invoiceDocuments) {
      console.log(document)
    }
    // ハイライト終了
  }
}
```

## ファイルの手動バリデーション

[バリデータ](#using-validator)を使用してファイルをバリデーションするか、`request.file`メソッドを使用してバリデーションルールを定義できます。

次の例では、`request.file`メソッドを使用してバリデーションルールをインラインで定義し、`file.errors`プロパティを使用してバリデーションエラーにアクセスします。

```ts
const avatar = request.file('avatar', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
})

if (!avatar.isValid) {
  return response.badRequest({
    errors: avatar.errors
  })
}
```

ファイルの配列を扱う場合、ファイルごとにバリデーションが失敗したかどうかを確認するためにファイルを反復処理できます。

`request.files`メソッドに提供されるバリデーションオプションはすべてのファイルに適用されます。次の例では、各ファイルのサイズが`2mb`未満であることを期待し、許可されるファイル拡張子のいずれかを持っている必要があります。

```ts
const invoiceDocuments = request.files('documents', {
  size: '2mb',
  extnames: ['jpg', 'png', 'pdf']
})

/**
 * 無効なドキュメントのコレクションを作成する
 */
let invalidDocuments = invoiceDocuments.filter((document) => {
  return !document.isValid
})

if (invalidDocuments.length) {
  /**
   * ファイル名とエラーを横に並べてレスポンスする
   */
  return response.badRequest({
    errors: invalidDocuments.map((document) => {
      name: document.clientName,
      errors: document.errors,
    })
  })
}
```

## バリデータを使用してファイルをバリデーションする

前のセクションで手動でファイルをバリデーションする方法を見てきましたが、バリデータを使用してファイルをバリデーションすることもできます。バリデータを使用する場合、エラーを手動でチェックする必要はありません。バリデーションパイプラインがそれを処理します。

```ts
// app/validators/user_validator.ts
import vine from '@vinejs/vine'

export const updateAvatarValidator = vine.compile(
  vine.object({
    // ハイライト開始
    avatar: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png', 'pdf']
    })
    // ハイライト終了
  })
)
```

```ts
import { HttpContext } from '@adonisjs/core/http'
import { updateAvatarValidator } from '#validators/user_validator'

export default class UserAvatarsController {
  async update({ request }: HttpContext) {
    // ハイライト開始
    const { avatar } = await request.validateUsing(
      updateAvatarValidator
    )
    // ハイライト終了
  }
}
```

`vine.array`タイプを使用してファイルの配列をバリデーションすることもできます。

例:
```ts
import vine from '@vinejs/vine'

export const createInvoiceValidator = vine.compile(
  vine.object({
    // ハイライト開始
    documents: vine.array(
      vine.file({
        size: '2mb',
        extnames: ['jpg', 'png', 'pdf']
      })
    )
    // ハイライト終了
  })
)
```

## ファイルを永続的な場所に移動する

デフォルトでは、ユーザーがアップロードしたファイルはオペレーティングシステムの`tmp`ディレクトリに保存され、コンピュータが`tmp`ディレクトリをクリーンアップすると削除される可能性があります。

そのため、ファイルを永続的な場所に保存することをオススメします。`file.move`メソッドを使用して、同じファイルシステム内でファイルを移動できます。このメソッドはファイルを移動するための絶対パスを受け入れます。

```ts
import app from '@adonisjs/core/services/app'

const avatar = request.file('avatar', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
})

// ハイライト開始
/**
 * アバターを「storage/uploads」ディレクトリに移動する
 */
await avatar.move(app.makePath('storage/uploads'))
// ハイライト終了
```

移動されたファイルに一意のランダムな名前を提供することをオススメします。そのために、`cuid`ヘルパーを使用できます。

```ts
// ハイライト開始
import { cuid } from '@adonisjs/core/helpers'
// ハイライト終了
import app from '@adonisjs/core/services/app'

await avatar.move(app.makePath('storage/uploads'), {
  // ハイライト開始
  name: `${cuid()}.${avatar.extname}`
  // ハイライト終了
})
```

ファイルが移動された後、その名前をデータベースに保存してあとで参照できます。

```ts
await avatar.move(app.makePath('uploads'))

/**
 * ファイル名をアバターとして保存し、ユーザーモデルに永続化するダミーコード
 */
auth.user!.avatar = avatar.fileName!
await auth.user.save()
```

### ファイルのプロパティ

以下は、[MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts)インスタンスでアクセスできるプロパティのリストです。

| プロパティ    | 説明                                                                                                         |
|--------------|--------------------------------------------------------------------------------------------------------------|
| `fieldName`  | HTMLの入力フィールドの名前。                                                                                   |
| `clientName` | ユーザーのコンピュータ上のファイル名。                                                                           |
| `size`       | ファイルのサイズ（バイト単位）。                                                                               |
| `extname`    | ファイルの拡張子                                                                                              |
| `errors`     | 特定のファイルに関連するエラーの配列。                                                                           |
| `type`       | ファイルの[MIMEタイプ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)。          |
| `subtype`    | ファイルの[MIMEサブタイプ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)。       |
| `filePath`   | `move`操作後のファイルへの絶対パス。                                                                           |
| `fileName`   | `move`操作後のファイル名。                                                                                     |
| `tmpPath`    | `tmp`ディレクトリ内のファイルへの絶対パス。                                                                      |
| `meta`       | ファイルに関連するメタデータ（キーと値のペア）です。デフォルトではオブジェクトは空です。                                |
| `validated`  | ファイルがバリデーションされたかどうかを示すブール値です。                                                                 |
| `isValid`    | ファイルがバリデーションルールをパスしたかどうかを示すブール値です。                                                          |
| `hasErrors`  | 1つ以上のエラーが特定のファイルに関連付けられているかどうかを示すブール値です。                                          |

## ファイルの提供

アプリケーションコードと同じファイルシステムにユーザーがアップロードしたファイルを永続化した場合、ルートを作成し、[`response.download`](./response.md#downloading-files)メソッドを使用してファイルを提供できます。

```ts
import { sep, normalize } from 'node:path'
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'

const PATH_TRAVERSAL_REGEX = /(?:^|[\\/])\.\.(?:[\\/]|$)/

router.get('/uploads/*', ({ request, response }) => {
  const filePath = request.param('*').join(sep)
  const normalizedPath = normalize(filePath)
  
  if (PATH_TRAVERSAL_REGEX.test(normalizedPath)) {
    return response.badRequest('Malformed path')
  }

  const absolutePath = app.makePath('uploads', normalizedPath)
  return response.download(absolutePath)
})
```

- ワイルドカードルートパラメータを使用してファイルパスを取得し、配列を文字列に変換します。

- 次に、Node.jsのpathモジュールを使用してパスを正規化します。

- `PATH_TRAVERSAL_REGEX`を使用して、このルートを[パストラバーサル攻撃](https://owasp.org/www-community/attacks/Path_Traversal)から保護します。

- 最後に、`normalizedPath`を`uploads`ディレクトリ内の絶対パスに変換し、`response.download`メソッドを使用してファイルを提供します。


## Driveを使用してファイルをアップロードおよび提供する

Driveは、AdonisJSコアチームによって作成されたファイルシステムの抽象化です。Driveを使用してユーザーがアップロードしたファイルを管理し、それらをローカルファイルシステムに保存するか、S3やGCSのようなクラウドストレージサービスに移動できます。

手動でファイルをアップロードおよび提供する代わりに、Driveを使用することをオススメします。Driveはパストラバーサルなどの多くのセキュリティ上の懸念事項を処理し、複数のストレージプロバイダにわたる統一されたAPIを提供します。

[Driveについて詳しく学ぶ](../digging_deeper/drive.md)

## 高度な - 自己処理マルチパートストリーム
マルチパートリクエストの自動処理をオフにし、ストリームを自己処理することで、高度なユースケースに対応できます。`config/bodyparser.ts`ファイルを開き、次のオプションのいずれかを変更して自動処理を無効にします。

```ts
{
  multipart: {
    /**
     * すべてのHTTPリクエストに対してマルチパートストリームを手動で自己処理する場合は、falseに設定します。
     */
    autoProcess: false
  }
}
```

```ts
{
  multipart: {
    /**
     * マルチパートストリームを自己処理するルートパターンの配列を定義します。
     */
    processManually: ['/assets']
  }
}
```

自動処理を無効にした後、`request.multipart`オブジェクトを使用して個々のファイルを処理できます。

次の例では、Node.jsの`stream.pipeline`メソッドを使用してマルチパートの読み込み可能なストリームを処理し、ディスク上のファイルに書き込みます。ただし、このファイルを`s3`のような外部サービスにストリームすることもできます。

```ts
import { createWriteStream } from 'node:fs'
import app from '@adonisjs/core/services/app'
import { pipeline } from 'node:stream/promises'
import { HttpContext } from '@adonisjs/core/http'

export default class AssetsController {
  async store({ request }: HttpContext) {
    /**
     * ステップ1: ファイルリスナーを定義する
     */
    request.multipart.onFile('*', {}, async (part, reporter) => {
      part.pause()
      part.on('data', reporter)

      const filePath = app.makePath(part.file.clientName)
      await pipeline(part, createWriteStream(filePath))
      return { filePath }
    })

    /**
     * ステップ2: ストリームを処理する
     */
    await request.multipart.process()

    /**
     * ステップ3: 処理されたファイルにアクセスする
     */
    return request.allFiles()
  }
}
```


- `multipart.onFile`メソッドは、ファイルを処理するために使用する入力フィールド名を第一パラメータとして受け入れます。すべてのファイルを処理するためにワイルドカード`*`を使用することもできます。


- `onFile`リスナーは、最初のパラメータとして`part`（読み込み可能なストリーム）を受け取り、2番目のパラメータとして`reporter`関数を受け取ります。

- `reporter`関数は、ストリームの進行状況を追跡するために使用されます。これにより、AdonisJSはストリームが処理された後に処理されたバイト、ファイルの拡張子、およびその他のメタデータへのアクセスを提供できます。

- 最後に、`onFile`リスナーから返されるプロパティのオブジェクトは、`request.file`または`request.allFiles()`メソッドを使用してアクセスするファイルオブジェクトとマージされます。

### エラーハンドリング
`part`オブジェクト上の`error`イベントをリッスンし、エラーを手動で処理する必要があります。通常、ストリームリーダー（書き込み可能なストリーム）は内部的にこのイベントをリッスンし、書き込み操作を中止します。

### ストリームパートのバリデーション
AdonisJSでは、マルチパートストリームを手動で処理する場合でも、ストリームパート（ファイル）をバリデーションできます。エラーが発生した場合、`part`オブジェクトで`error`イベントが発生します。

`multipart.onFile`メソッドは、2番目のパラメータとしてバリデーションオプションを受け入れます。また、`data`イベントをリッスンし、`reporter`メソッドをバインドする必要があります。そうしないと、バリデーションは行われません。

```ts
request.multipart.onFile('*', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
}, async (part, reporter) => {
  /**
   * ストリームのバリデーションを実行するためには、以下の2行が必要です
   */
  part.pause()
  part.on('data', reporter)
})
```
