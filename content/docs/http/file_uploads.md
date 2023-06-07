# File uploads

AdonisJS has first-class support for processing user-uploaded files sent using the `multipart/form-data` content type. The files are auto-processed using the [bodyparser middleware](./bodyparser_middleware.md#multipart-parser) and saved inside the `tmp` directory of your operating system.

Later, inside your controllers, you may access the files, validate them and move them to a persistent location or a cloud storage service like S3.

## Storing user-uploaded files

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

### Validating files

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

### Using validator

Instead of validating files manually (as seen in the previous section), you may use the [validator](../validator/schema_types.md#file) to validate files as part of the validation pipeline. When using validator, you do not have to manually check for errors, as the validation pipeline takes care of that.

```ts
import { schema } from '@adonisjs/core/legacy/validator'
import { HttpContext } from '@adonisjs/core/http'

export default class UserAvatarsController {
  update({ request }: HttpContext) {
    // highlight-start
    const { avatar } = await request.validate({
      schema: schema.create({
        avatar: schema.file({
          size: '2mb',
          extnames: ['jpg', 'png', 'pdf']
        })
      })
    })
    // highlight-end
  }
}
```

An array of files can be validated using the `schema.array` type. For example:

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class InvoicesController {
  update({ request }: HttpContext) {
    // highlight-start
    const { documents } = await request.validate({
      schema: schema.create({
        documents: schema.array().members(
          schema.file({
            size: '2mb',
            extnames: ['jpg', 'png', 'pdf']
          })
        )
      })
    })
    // highlight-end
  }
}
```


### Moving files to a persistent location

By default, the user-uploaded files are saved in your operating system's `tmp` directory and may get deleted as your computer cleans up the `tmp` directory.

Therefore, it is recommended to store files in a persistent location. You may use the `file.move` to move a file within the same filesystem. The method accepts an absolute path to the directory to move the file.

```ts
import app from '@adonisjs/core/services/app'

const avatar = request.file('avatar', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
})

await avatar.move(app.makePath('uploads'))
```

Also, it is recommended to provide a unique unguessable name to the moved file. For this, you may use the `cuid` helper.

```ts
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'

await avatar.move(app.makePath('uploads'), {
  name: `${cuid()}.${avatar.extname}`
})
```

Once the file has been moved, you may store its name inside the database for later reference.

```ts
await avatar.move(app.makePath('uploads'))

auth.user!.avatarFileName = avatar.fileName!
await auth.user.save()
```

### File properties

Following is the list of properties you may access on the [MultipartFile](https://github.com/adonisjs/bodyparser/blob/main/src/multipart/file.ts) instance.

| Property | Description |
|---------|------------|
| `fieldName` | The name of the HTML input field. |
| `clientName` | The file name on the user's computer. |
| `size` | The size of the file in bytes.  |
| `extname` | The file extname |
| `errors` | An array of errors associated with a given file. |
| `type` | The [mime type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the file |
| `subtype` | The [mime subtype](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the file. |
| `filePath` | The absolute path to the file after the `move` operation. |
| `fileName` | The file name after the `move` operation. |
| `tmpPath` | The absolute path to the file inside the `tmp` directory. |
| `meta` | Metadata associated with the file as a key-value pair. The object is empty by default. |
| `validated` | A boolean to know if the file has been validated. |
| `isValid` | A boolean to know if the file has passed the validation rules. |
| `hasErrors` | A boolean to know if one or more errors are associated with a given file. |

## Serving files

If you have persisted user-uploaded files in the same filesystem as your application code, then you may serve files by creating a route and using the [`response.download`](./response.md#downloading-files) method. 

```ts
import { sep, normalize } from 'node:path'
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'

const PATH_TRAVERSAL_REGEX = /(?:^|[\\/])\.\.(?:[\\/]|$)/

router.get('/uploads/*', ({ request, response }) => {
  const filePath = request.param('*').join(path.sep)
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

Visit [drive.adonisjs.com](https://drive.adonisjs.com) for usage documentation.

## Additional reading

- Use [Attachment lite](https://github.com/adonisjs/attachment-lite) to convert any column on Lucid models to an attachment data type.
- Use [File generator](https://github.com/poppinss/file-generator) to create fake in-memory files during testing.
