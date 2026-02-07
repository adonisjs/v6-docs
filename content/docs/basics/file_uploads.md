---
summary: 了解如何在 AdonisJS 中使用 `request.file` 方法处理用户上传的文件，并使用验证器对它们进行验证。
---

# 文件上传

AdonisJS 对处理使用 `multipart/form-data` 内容类型发送的用户上传文件提供了一流的支持。文件会使用 [BodyParser 中间件](../basics/body_parser.md#multipart-parser) 自动处理，并保存在操作系统的 `tmp` 目录中。

稍后，在控制器中，你可以访问这些文件，验证它们，并将它们移动到持久化位置或像 S3 这样的云存储服务中。

## 访问用户上传的文件

你可以使用 `request.file` 方法访问用户上传的文件。该方法接受字段名称并返回一个 [MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts) 实例。

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class UserAvatarsController {
  update({ request }: HttpContext) {
    // highlight-start
    const avatar = request.file('avatar')
    console.log(avatar)
    // highlight-end
  }
}
```

如果使用单个输入字段上传多个文件，你可以使用 `request.files` 方法访问它们。该方法接受字段名称并返回一个 `MultipartFile` 实例数组。

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class InvoicesController {
  update({ request }: HttpContext) {
    // highlight-start
    const invoiceDocuments = request.files('documents')
    
    for (let document of invoiceDocuments) {
      console.log(document)
    }
    // highlight-end
  }
}
```

## 手动验证文件

你可以使用 [验证器](#using-validator) 验证文件，或者通过 `request.file` 方法定义验证规则。

在下面的示例中，我们将通过 `request.file` 方法内联定义验证规则，并使用 `file.errors` 属性访问验证错误。

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

处理文件数组时，你可以遍历文件并检查是否有一个或多个文件未通过验证。

提供给 `request.files` 方法的验证选项适用于所有文件。在下面的示例中，我们期望每个文件都在 `2mb` 以下，并且必须具有允许的文件扩展名之一。

```ts
const invoiceDocuments = request.files('documents', {
  size: '2mb',
  extnames: ['jpg', 'png', 'pdf']
})

/**
 * 创建无效文档的集合
 */
let invalidDocuments = invoiceDocuments.filter((document) => {
  return !document.isValid
})

if (invalidDocuments.length) {
  /**
   * 响应包含文件名及其旁边的错误
   */
  return response.badRequest({
    errors: invalidDocuments.map((document) => {
      name: document.clientName,
      errors: document.errors,
    })
  })
}
```

## 使用验证器验证文件

与其手动验证文件（如上一节所示），不如使用 [验证器](./validation.md) 作为验证管道的一部分来验证文件。使用验证器时，你无需手动检查错误；验证管道会处理这些。

```ts
// app/validators/user_validator.ts
import vine from '@vinejs/vine'

export const updateAvatarValidator = vine.compile(
  vine.object({
    // highlight-start
    avatar: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png', 'pdf']
    })
    // highlight-end
  })
)
```

```ts
import { HttpContext } from '@adonisjs/core/http'
import { updateAvatarValidator } from '#validators/user_validator'

export default class UserAvatarsController {
  async update({ request }: HttpContext) {
    // highlight-start
    const { avatar } = await request.validateUsing(
      updateAvatarValidator
    )
    // highlight-end
  }
}
```

可以使用 `vine.array` 类型验证文件数组。例如：

```ts
import vine from '@vinejs/vine'

export const createInvoiceValidator = vine.compile(
  vine.object({
    // highlight-start
    documents: vine.array(
      vine.file({
        size: '2mb',
        extnames: ['jpg', 'png', 'pdf']
      })
    )
    // highlight-end
  })
)
```

## 将文件移动到持久化位置

默认情况下，用户上传的文件保存在操作系统的 `tmp` 目录中，随着计算机清理 `tmp` 目录，这些文件可能会被删除。

因此，建议将文件存储在持久化位置。你可以使用 `file.move` 在同一文件系统内移动文件。该方法接受移动文件的目录的绝对路径。

```ts
import app from '@adonisjs/core/services/app'

const avatar = request.file('avatar', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
})

// highlight-start
/**
 * 将头像移动到 "storage/uploads" 目录
 */
await avatar.move(app.makePath('storage/uploads'))
// highlight-end
```

建议为移动的文件提供一个唯一的随机名称。为此，你可以使用 `cuid` 辅助函数。

```ts
// highlight-start
import { cuid } from '@adonisjs/core/helpers'
// highlight-end
import app from '@adonisjs/core/services/app'

await avatar.move(app.makePath('storage/uploads'), {
  // highlight-start
  name: `${cuid()}.${avatar.extname}`
  // highlight-end
})
```

文件移动后，你可以将其名称存储在数据库中以供以后参考。

```ts
await avatar.move(app.makePath('uploads'))

/**
 * 示例代码：将文件名作为头像保存在用户模型上
 * 并持久化到数据库。
 */
auth.user!.avatar = avatar.fileName!
await auth.user.save()
```

### 文件属性

以下是你可以在 [MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts) 实例上访问的属性列表。

| 属性 | 描述 |
|--------------|--------------------------------------------------------------------------------------------------------------|
| `fieldName`  | HTML 输入字段的名称。 |
| `clientName` | 用户计算机上的文件名。 |
| `size`       | 文件大小（字节）。 |
| `extname`    | 文件扩展名。 |
| `errors`     | 与给定文件关联的错误数组。 |
| `type`       | 文件的 [mime 类型](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)。 |
| `subtype`    | 文件的 [mime 子类型](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)。 |
| `filePath`   | `move` 操作后的文件绝对路径。 |
| `fileName`   | `move` 操作后的文件名。 |
| `tmpPath`    | `tmp` 目录内文件的绝对路径。 |
| `meta`       | 与文件关联的元数据键值对。默认情况下对象为空。 |
| `validated`  | 一个布尔值，用于了解文件是否已验证。 |
| `isValid`    | 一个布尔值，用于了解文件是否通过了验证规则。 |
| `hasErrors`  | 一个布尔值，用于了解给定文件是否关联了一个或多个错误。 |

## 提供文件服务

如果你已将用户上传的文件持久化在与应用程序代码相同的文件系统中，你可以通过创建路由并使用 [`response.download`](./response.md#downloading-files) 方法来提供文件服务。

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

- 我们使用 [通配符路由参数](./routing.md#wildcard-params) 获取文件路径，并将数组转换为字符串。
- 接下来，我们使用 Node.js path 模块标准化路径。
- 使用 `PATH_TRAVERSAL_REGEX`，我们保护此路由免受 [路径遍历](https://owasp.org/www-community/attacks/Path_Traversal) 攻击。
- 最后，我们将 `normalizedPath` 转换为 `uploads` 目录内的绝对路径，并使用 `response.download` 方法提供文件服务。


## 使用 Drive 上传和提供文件服务

Drive 是 AdonisJS 核心团队创建的文件系统抽象。你可以使用 Drive 管理用户上传的文件，并将它们存储在本地文件系统中，或者移动到像 S3 或 GCS 这样的云存储服务中。

我们建议使用 Drive 而不是手动上传和提供文件服务。Drive 处理许多安全问题（如路径遍历），并提供跨多个存储提供程序的统一 API。

[了解更多关于 Drive 的信息](../digging_deeper/drive.md)

## 高级 - 自我处理 multipart 流

你可以关闭 multipart 请求的自动处理，并针对高级用例自我处理流。打开 `config/bodyparser.ts` 文件并更改以下选项之一以禁用自动处理。

```ts
{
  multipart: {
    /**
     * 设置为 false，如果你想为所有 HTTP 请求
     * 手动自我处理 multipart 流
     */
    autoProcess: false
  }
}
```

```ts
{
  multipart: {
    /**
     * 定义一个路由模式数组，你希望对这些路由
     * 自我处理 multipart 流。
     */
    processManually: ['/assets']
  }
}
```

一旦你禁用了自动处理，你可以使用 `request.multipart` 对象处理单个文件。

在下面的示例中，我们使用 Node.js 的 `stream.pipeline` 方法处理 multipart 可读流并将其写入磁盘上的文件。当然，你可以将此文件流式传输到像 `s3` 这样的外部服务。

```ts
import { createWriteStream } from 'node:fs'
import app from '@adonisjs/core/services/app'
import { pipeline } from 'node:stream/promises'
import { HttpContext } from '@adonisjs/core/http'

export default class AssetsController {
  async store({ request }: HttpContext) {
    /**
     * 步骤 1: 定义文件监听器
     */
    request.multipart.onFile('*', {}, async (part, reporter) => {
      part.pause()
      part.on('data', reporter)

      const filePath = app.makePath(part.file.clientName)
      await pipeline(part, createWriteStream(filePath))
      return { filePath }
    })

    /**
     * 步骤 2: 处理流
     */
    await request.multipart.process()

    /**
     * 步骤 3: 访问已处理的文件
     */
    return request.allFiles()
  }
}
```


- `multipart.onFile` 方法接受你想要处理文件的输入字段名称。你可以使用通配符 `*` 处理所有文件。

- `onFile` 监听器接收 `part`（可读流）作为第一个参数，接收 `reporter` 函数作为第二个参数。

- `reporter` 函数用于跟踪流进度，以便 AdonisJS 在流处理完毕后为你提供对已处理字节、文件扩展名和其他元数据的访问权限。

- 最后，你可以从 `onFile` 监听器返回一个属性对象，它们将与你使用 `request.file` 或 `request.allFiles()` 方法访问的文件对象合并。

### 错误处理

你必须监听 `part` 对象上的 `error` 事件并手动处理错误。通常，流读取器（可写流）将在内部监听此事件并中止写入操作。

### 验证流部分

AdonisJS 允许你验证流部分（即文件），即使你在手动处理 multipart 流。如果发生错误，`error` 事件将在 `part` 对象上触发。

`multipart.onFile` 方法接受验证选项作为第二个参数。此外，请确保监听 `data` 事件并将 `reporter` 方法绑定到它。否则，不会进行任何验证。

```ts
request.multipart.onFile('*', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
}, async (part, reporter) => {
  /**
   * 以下两行是执行流验证所必需的
   */
  part.pause()
  part.on('data', reporter)
})
```
