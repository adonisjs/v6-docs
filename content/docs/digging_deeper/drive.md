---
summary: Manage user-uploaded files on local filesystem and cloud storage services like S3, GCS, R2 and DigitalOcean spaces. Without any vendor lock-in.
---

# Drive

AdonisJS Drive (`@adonisjs/drive`) is a lightweight wrapper on top of [flydrive.dev](https://flydrive.dev/). FlyDrive is a file storage library for Node.js. It provides a unified API to interact with the local file system and cloud storage solutions like S3, R2, and GCS.

Using FlyDrive, you can manage user-uploaded files on various cloud storage services (including the local filesystem) without changing a single line of code.

## Installation

Install and configure the `@adonisjs/drive` package using the following command:

```sh
node ace add @adonisjs/drive
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `@adonisjs/drive` package using the detected package manager.

2. Registers the following service provider inside the `adonisrc.ts` file.

   ```ts
   {
     providers: [
       // ...other providers
       () => import('@adonisjs/drive/drive_provider'),
     ]
   }
   ```

3. Creates the `config/drive.ts` file.

4. Defines the environment variables for the selected storage services.

5. Installs the required peer dependencies for the selected storage services.

:::

## Configuration

The `@adonisjs/drive` package configuration is stored inside the `config/drive.ts` file. You can define config for multiple services within a single config file.

See also: [Config stub](https://github.com/adonisjs/drive/blob/3.x/stubs/config/drive.stub)

```ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  services: {
    /**
     * Persist files on the local filesystem
     */
    fs: services.fs({
      location: app.makePath('storage'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),

    /**
     * Persist files on Digital Ocean spaces
     */
    spaces: services.s3({
      credentials: {
        accessKeyId: env.get('SPACES_KEY'),
        secretAccessKey: env.get('SPACES_SECRET'),
      },
      region: env.get('SPACES_REGION'),
      bucket: env.get('SPACES_BUCKET'),
      endpoint: env.get('SPACES_ENDPOINT'),
      visibility: 'public',
    }),
  },
})

export default driveConfig
```

### Environment variables

The credentials/settings for the storage services are stored as environment variables within the `.env` file. Make sure to update the values before you can use Drive.

Also, the `DRIVE_DISK` environment variable defines the default disk/service for managing files. For example, you may want to use the `fs` disk in development and the `spaces` disk in production.

## Usage

Once you have configured Drive, you can import the `drive` service to interact with its APIs. In the following example, we handle a file upload operation using Drive.

:::note

Since the AdonisJS integration is a thin wrapper on top of FlyDrive, you should read the [FlyDrive docs](https://flydrive.dev) to better understand its APIs.

:::

```ts
import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import router from '@adonisjs/core/services/router'

router.put('/me', async ({ request, response }) => {
  /**
   * Step 1: Grab the image from the request and perform basic
   * validations
   */
  const image = request.file('avatar', {
    size: '2mb',
    extnames: ['jpeg', 'jpg', 'png'],
  })
  if (!image) {
    return response.badRequest({ error: 'Image missing' })
  }

  /**
   * Step 2: Move the image with a unique name using Drive
   */
  const key = `uploads/${cuid()}.${image.extname}`
  // highlight-start
  await image.moveToDisk(key)
  // highlight-end

  /**
   * Respond with the file's public URL
   */
  return {
    message: 'Image uploaded',
    // highlight-start
    url: image.meta.url,
    // highlight-end
  }
})
```

- The Drive package adds the `moveToDisk` method to the [MultipartFile](https://github.com/adonisjs/drive/blob/develop/providers/drive_provider.ts#L110). This method moves the file from its `tmpPath` to the configured storage provider.

- After moving the file, the `meta.url` property will be set on the file object. This property contains the public URL of the file. If your files are private, then you must use the `drive.use().getSignedUrl()` method.

## Drive service

Drive service exported by the `@adonisjs/drive/services/main` path is a singleton instance of the [DriveManager](https://flydrive.dev/docs/drive_manager) class created using the config exported from the `config/drive.ts` file.

You can import this service to interact with the DriveManager and the configured file storage services. For example:

```ts
import drive from '@adonisjs/drive/services/main'

drive instanceof DriveManager // true

/**
 * Returns instance of the default disk
 */
const disk = drive.use()

/**
 * Returns instance of a disk named r2
 */
const disk = drive.use('r2')

/**
 * Returns instance of a disk named spaces
 */
const disk = drive.use('spaces')
```

Once you have access to an instance of a Disk, you can use it to manage files.

See also: [Disk API](https://flydrive.dev/docs/disk_api)

```ts
await disk.put(key, value)
await disk.putStream(key, readableStream)

await disk.get(key)
await disk.getStream(key)
await disk.getArrayBuffer(key)

await disk.delete(key)
await disk.deleteAll(prefix)

await disk.copy(source, destination)
await disk.move(source, destination)

await disk.copyFromFs(source, destination)
await disk.moveFromFs(source, destination)
```

## Local filesystem driver

AdonisJS integration enhances the FlyDrive's local filesystem driver and adds support for URL generation and the ability to serve files using the AdonisJS HTTP server.

Following is the list of options you may use to configure the filesystem driver.

```ts
{
  services: {
    fs: services.fs({
      location: app.makePath('storage'),
      visibility: 'public',

      appUrl: env.get('APP_URL'),
      serveFiles: true,
      routeBasePath: '/uploads',
    }),
  }
}
```

<dl>

<dt>

location

</dt>

<dd>

The `location` property defines the store inside which the files should be stored. This directory should be added to `.gitignore` so that you do not push files uploaded during development to the production server.

</dd>

<dt>

visibility

</dt>

<dd>

The `visibility` property is used to mark files public or private. Private files can only be accessed using signed URLs. [Learn more](https://flydrive.dev/docs/disk_api#getsignedurl)

</dd>

<dt>

serveFiles

</dt>

<dd>

The `serveFiles` option auto registers a route to serve the files from the local filesystem. You can view this route using the [list\:routes](../references/commands.md#listroutes) ace command.

</dd>

<dt>

routeBasePath

</dt>

<dd>

The `routeBasePath` option defines the base prefix for the route to serve files. Make sure the base prefix is unique.

</dd>

<dt>

appUrl

</dt>

<dd>

You may optionally define the `appUrl` property to create URLs with the complete domain name of your application. Otherwise relative URLs will be created.

</dd>


</dl>

## Edge helpers
Within the Edge templates, you may use one of the following helper methods to generate URLs. Both the methods are async, so make sure to `await` them.

```edge
<img src="{{ await driveUrl(user.avatar) }}" />

<!-- Generate URL for a named disk -->
<img src="{{ await driveUrl(user.avatar, 's3') }}" />
<img src="{{ await driveUrl(user.avatar, 'r2') }}" />
```

```edge
<a href="{{ await driveSignedUrl(invoice.key) }}">
  Download Invoice
</a>

<!-- Generate URL for a named disk -->
<a href="{{ await driveSignedUrl(invoice.key, 's3') }}">
  Download Invoice
</a>

<!-- Generate URL with signed options -->
<a href="{{ await driveSignedUrl(invoice.key, {
  expiresIn: '30 mins',
}) }}">
  Download Invoice
</a>
```

## MultipartFile helper
Drive extends the Bodyparser [MultipartFile](https://github.com/adonisjs/drive/blob/develop/providers/drive_provider.ts#L110) class and adds the `moveToDisk` method. This method copies the file from its `tmpPath` to the configured storage provider.

```ts
const image = request.file('image')!

const key = 'user-1-avatar.png'

/**
 * Move file to the default disk
 */
await image.moveToDisk(key)

/**
 * Move file to a named disk
 */
await image.moveToDisk(key, 's3')

/**
 * Define additional properties during the
 * move operation
 */
await image.moveToDisk(key, 's3', {
  contentType: 'image/png',
})

/**
 * Write file by first reading it as a buffer. You may use this
 * option when your cloud storage provider results in broken
 * files with the "stream" option
 */
await image.moveToDisk(key, 's3', {
  moveAs: 'buffer'
})
```

## Faking disks during tests
The fakes API of Drive can be used during testing to prevent interacting with a remote storage. In the fakes mode, the `drive.use()` method will return a fake disk (backed by local filesystem) and all files will be written inside the `./tmp/drive-fakes` directory of your application root.

These files are deleted automatically after you restore a fake using the `drive.restore` method.

See also: [FlyDrive fakes documentation](https://flydrive.dev/docs/drive_manager#using-fakes)

```ts
// title: tests/functional/users/update.spec.ts
import { test } from '@japa/runner'
import drive from '@adonisjs/drive/services/main'
import fileGenerator from '@poppinss/file-generator'

test.group('Users | update', () => {
  test('should be able to update my avatar', async ({ client, cleanup }) => {
    /**
     * Fake the "spaces" disk and restore the fake
     * after the test finishes
     */
    const fakeDisk = drive.fake('spaces')
    cleanup(() => drive.restore('spaces'))

    /**
     * Create user to perform the login and update
     */
    const user = await UserFactory.create()

    /**
     * Generate a fake in-memory png file with size of
     * 1mb
     */
    const { contents, mime, name } = await fileGenerator.generatePng('1mb')

    /**
     * Make put request and send the file
     */
    await client
      .put('me')
      .file('avatar', contents, {
        filename: name,
        contentType: mime,
      })
      .loginAs(user)

    /**
     * Assert the file exists
     */
    fakeDisk.assertExists(user.avatar)
  })
})
```
