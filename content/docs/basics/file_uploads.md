---
summary: Learn how to process user-uploaded files in AdonisJS using the `request.file` method and validate them using the validator.
---

# File uploads

AdonisJS has first-class support for processing user-uploaded files sent using the `multipart/form-data` content type. The files are auto-processed using the [bodyparser middleware](../basics/body_parser.md#multipart-parser) and saved inside your operating system's `tmp` directory.

Later, inside your controllers, you may access the files, validate them and move them to a persistent location or a cloud storage service like S3.

## Access user-uploaded files

You may access the user-uploaded files using the `request.file` method. The method accepts the field name and returns an instance of [MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts).

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

If a single input field is used to upload multiple files, you may access them using the `request.files` method. The method accepts the field name and returns an array of `MultipartFile` instances.

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

## Manually validating files

You may validate files using the [validator](#using-validator) or define the validation rules via the `request.file` method. 

In the following example, we will define the validation rules inline via the `request.file` method and use the `file.errors` property to access the validation errors.

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

When working with an array of files, you can iterate over files and check if one or more files have failed the validation. 

The validation options provided to the `request.files` method are applied to all files. In the following example, we expect each file to be under `2mb` and must have one of the allowed file extensions.

```ts
const invoiceDocuments = request.files('documents', {
  size: '2mb',
  extnames: ['jpg', 'png', 'pdf']
})

/**
 * Creating a collection of invalid documents
 */
let invalidDocuments = invoiceDocuments.filter((document) => {
  return !document.isValid
})

if (invalidDocuments.length) {
  /**
   * Response with the file name and errors next to it
   */
  return response.badRequest({
    errors: invalidDocuments.map((document) => {
      name: document.clientName,
      errors: document.errors,
    })
  })
}
```

## Using validator to validate files

Instead of validating files manually (as seen in the previous section), you may use the [validator](./validation.md) to validate files as part of the validation pipeline. You do not have to manually check for errors when using the validator; the validation pipeline takes care of that.

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

An array of files can be validated using the `vine.array` type. For example:

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

## Moving files to a persistent location

By default, the user-uploaded files are saved in your operating system's `tmp` directory and may get deleted as your computer cleans up the `tmp` directory.

Therefore, it is recommended to store files in a persistent location. You may use the `file.move` to move a file within the same filesystem. The method accepts an absolute path to the directory to move the file.

```ts
import app from '@adonisjs/core/services/app'

const avatar = request.file('avatar', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
})

// highlight-start
/**
 * Moving avatar to the "storage/uploads" directory
 */
await avatar.move(app.makePath('storage/uploads'))
// highlight-end
```

It is recommended to provide a unique random name to the moved file. For this, you may use the `cuid` helper.

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

Once the file has been moved, you may store its name inside the database for later reference.

```ts
await avatar.move(app.makePath('uploads'))

/**
 * Dummy code to save the filename as avatar
 * on the user model and persist it to the
 * database.
 */
auth.user!.avatar = avatar.fileName!
await auth.user.save()
```

### File properties

Following is the list of properties you may access on the [MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts) instance.

| Property     | Description                                                                                                  |
|--------------|--------------------------------------------------------------------------------------------------------------|
| `fieldName`  | The name of the HTML input field.                                                                            |
| `clientName` | The file name on the user's computer.                                                                        |
| `size`       | The size of the file in bytes.                                                                               |
| `extname`    | The file extname                                                                                             |
| `errors`     | An array of errors associated with a given file.                                                             |
| `type`       | The [mime type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the file     |
| `subtype`    | The [mime subtype](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the file. |
| `filePath`   | The absolute path to the file after the `move` operation.                                                    |
| `fileName`   | The file name after the `move` operation.                                                                    |
| `tmpPath`    | The absolute path to the file inside the `tmp` directory.                                                    |
| `meta`       | Metadata associated with the file as a key-value pair. The object is empty by default.                       |
| `validated`  | A boolean to know if the file has been validated.                                                            |
| `isValid`    | A boolean to know if the file has passed the validation rules.                                               |
| `hasErrors`  | A boolean to know if one or more errors are associated with a given file.                                    |

## Serving files

If you have persisted user-uploaded files in the same filesystem as your application code, you may serve files by creating a route and using the [`response.download`](./response.md#downloading-files) method. 

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

- We get the file path using the [wildcard route param](./routing.md#wildcard-params) and convert the array into a string.
- Next, we normalize the path using the Node.js path module.
- Using the `PATH_TRAVERSAL_REGEX` we protect this route against [path traversal](https://owasp.org/www-community/attacks/Path_Traversal).
- Finally, we convert the `normalizedPath` to an absolute path inside the `uploads` directory and serve the file using the `response.download` method.


## Using Drive to upload and serve files

Drive is a file system abstraction created by the AdonisJS core team. You may use Drive to manage user-uploaded files and store them inside the local file system or move them to a cloud storage service like S3 or GCS.

We recommend using Drive over manually uploading and serving files. Drive handles many security concerns like path traversal and offers a unified API across multiple storage providers.

[Learn more about Drive](../digging_deeper/drive.md)

## Advanced - Disabling file uploads
You can turn of file upload handling and processing of multipart requests entirely, in which case a request for a multipart file upload will return a [415 Unsupported Media Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415) error to the client. 

Open the `config/bodyparser.ts` file and change the following to disable multipart file uploads entirely.

```ts
{
  multipart: {
    enabled: false
  }
}
```

## Advanced - Self-processing multipart stream
You can turn off the automatic processing of multipart requests and self-process the stream for advanced use cases. Open the `config/bodyparser.ts` file and change one of the following options to disable auto-processing.

```ts
{
  multipart: {
    /**
     * Set to false, if you want to self-process multipart
     * stream manually for all HTTP requests
     */
    autoProcess: false
  }
}
```

```ts
{
  multipart: {
    /**
     * Define an array of route patterns for which you want
     * to self process the multipart stream.
     */
    processManually: ['/assets']
  }
}
```

Once you have disabled the auto-processing, you can use the `request.multipart` object to process individual files.

In the following example, we use the `stream.pipeline` method from Node.js to process the multipart readable stream and write it to a file on the disk. However, you can stream this file to some external service like `s3`.

```ts
import { createWriteStream } from 'node:fs'
import app from '@adonisjs/core/services/app'
import { pipeline } from 'node:stream/promises'
import { HttpContext } from '@adonisjs/core/http'

export default class AssetsController {
  async store({ request }: HttpContext) {
    /**
     * Step 1: Define a file listener
     */
    request.multipart.onFile('*', {}, async (part, reporter) => {
      part.pause()
      part.on('data', reporter)

      const filePath = app.makePath(part.file.clientName)
      await pipeline(part, createWriteStream(filePath))
      return { filePath }
    })

    /**
     * Step 2: Process the stream
     */
    await request.multipart.process()

    /**
     * Step 3: Access processed files
     */
    return request.allFiles()
  }
}
```


- The `multipart.onFile` method accepts the input field name for which you want to process the files. You can use the wildcard `*` to process all the files.

- The `onFile` listener receives the `part` (readable stream) as the first parameter and a `reporter` function as the second parameter.

- The `reporter` function is used to track the stream progress so that AdonisJS can provide you access to the processed bytes, file extension, and other meta-data after the stream has been processed.

- Finally, you can return an object of properties from the `onFile` listener, and they will be merged with the file object you access using the `request.file` or `request.allFiles()` methods.

### Error handling
You must listen to the `error` event on the `part` object and handle the errors manually. Usually, the stream reader (the writeable stream) will internally listen for this event and abort the write operation.

### Validating stream parts
AdonisJS allows you to validate the stream parts (aka files) even when you process the multipart stream manually. In case of an error, the `error` event is emitted on the `part` object.

The `multipart.onFile` method accepts the validation options as the second parameter. Also, make sure to listen for the `data` event and bind the `reporter` method to it. Otherwise, no validations will occur.

```ts
request.multipart.onFile('*', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
}, async (part, reporter) => {
  /**
   * The following two lines are required to perform
   * the stream validation
   */
  part.pause()
  part.on('data', reporter)
})
```
