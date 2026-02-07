---
summary: 管理用户上传到本地文件系统和云存储服务（如 S3、GCS、R2 和 DigitalOcean Spaces）的文件。无任何供应商锁定。
---

# 云存储 (Drive)

AdonisJS Drive (`@adonisjs/drive`) 是基于 [flydrive.dev](https://flydrive.dev/) 的轻量级封装。FlyDrive 是一个用于 Node.js 的文件存储库。它提供了一个统一的 API 来与本地文件系统和云存储解决方案（如 S3、R2 和 GCS）进行交互。

使用 FlyDrive，你可以在各种云存储服务（包括本地文件系统）上管理用户上传的文件，而无需更改任何代码。

## 安装

使用以下命令安装并配置 `@adonisjs/drive` 包：

```sh
node ace add @adonisjs/drive
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/drive` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。

   ```ts
   {
     providers: [
       // ...其他提供者
       () => import('@adonisjs/drive/drive_provider'),
     ]
   }
   ```

3. 创建 `config/drive.ts` 文件。

4. 在 `.env` 文件中定义所选存储服务的环境变量。

5. 安装所选存储服务所需的对等依赖项。

:::

## 配置

`@adonisjs/drive` 包的配置存储在 `config/drive.ts` 文件中。你可以在单个配置文件中定义多个服务的配置。

另请参阅：[配置存根 (Config stub)](https://github.com/adonisjs/drive/blob/3.x/stubs/config/drive.stub)

```ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  services: {
    /**
     * 将文件持久化到本地文件系统
     */
    fs: services.fs({
      location: app.makePath('storage'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),

    /**
     * 将文件持久化到 Digital Ocean Spaces
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

### 环境变量

存储服务的凭据/设置作为环境变量存储在 `.env` 文件中。确保在使用 Drive 之前更新这些值。

此外，`DRIVE_DISK` 环境变量定义了用于管理文件的默认磁盘/服务。例如，你可能希望在开发中使用 `fs` 磁盘，在生产中使用 `spaces` 磁盘。

## 使用

配置好 Drive 后，你可以导入 `drive` 服务以与其 API 进行交互。在下面的示例中，我们使用 Drive 处理文件上传操作。

:::note

由于 AdonisJS 集成是 FlyDrive之上的一个薄封装，你应该阅读 [FlyDrive 文档](https://flydrive.dev) 以更好地理解其 API。

:::

```ts
import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import router from '@adonisjs/core/services/router'

router.put('/me', async ({ request, response }) => {
  /**
   * 第一步：从请求中获取图像并执行基本验证
   */
  const image = request.file('avatar', {
    size: '2mb',
    extnames: ['jpeg', 'jpg', 'png'],
  })
  if (!image) {
    return response.badRequest({ error: 'Image missing' })
  }

  /**
   * 第二步：使用 Drive 将图像移动并重命名为唯一名称
   */
  const key = `uploads/${cuid()}.${image.extname}`
  // highlight-start
  await image.moveToDisk(key)
  // highlight-end

  /**
   * 响应文件的公共 URL
   */
  return {
    message: 'Image uploaded',
    // highlight-start
    url: image.meta.url,
    // highlight-end
  }
})
```

- Drive 包向 [MultipartFile](https://github.com/adonisjs/drive/blob/develop/providers/drive_provider.ts#L110) 添加了 `moveToDisk` 方法。此方法将文件从其 `tmpPath` 移动到配置的存储提供程序。

- 移动文件后，将在文件对象上设置 `meta.url` 属性。此属性包含文件的公共 URL。如果你的文件是私有的，则必须使用 `drive.use().getSignedUrl()` 方法。

## 云存储服务 (Drive service)

由 `@adonisjs/drive/services/main` 路径导出的 Drive 服务是使用从 `config/drive.ts` 文件导出的配置创建的 [DriveManager](https://flydrive.dev/docs/drive_manager) 类的单例实例。

你可以导入此服务以与 DriveManager 和配置的文件存储服务进行交互。例如：

```ts
import drive from '@adonisjs/drive/services/main'

drive instanceof DriveManager // true

/**
 * 返回默认磁盘的实例
 */
const disk = drive.use()

/**
 * 返回名为 r2 的磁盘实例
 */
const disk = drive.use('r2')

/**
 * 返回名为 spaces 的磁盘实例
 */
const disk = drive.use('spaces')
```

一旦你获得了磁盘的实例，你就可以使用它来管理文件。

另请参阅：[磁盘 API (Disk API)](https://flydrive.dev/docs/disk_api)

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

## 本地文件系统驱动程序

AdonisJS 集成增强了 FlyDrive 的本地文件系统驱动程序，并添加了对 URL 生成的支持以及使用 AdonisJS HTTP 服务器提供文件的能力。

以下是你可以用于配置本地文件系统驱动程序的选项列表。

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

`location` 属性定义了文件应存储在其中的存储位置。此目录应添加到 `.gitignore` 中，以免将开发期间上传的文件推送到生产服务器。

</dd>

<dt>

visibility

</dt>

<dd>

`visibility` 属性用于将文件标记为公开或私有。私有文件只能使用签名 URL 访问。[了解更多](https://flydrive.dev/docs/disk_api#getsignedurl)

</dd>

<dt>

serveFiles

</dt>

<dd>

`serveFiles` 选项自动注册一个路由以从本地文件系统提供文件。你可以使用 [list:routes](../references/commands.md#listroutes) ace 命令查看此路由。

</dd>

<dt>

routeBasePath

</dt>

<dd>

`routeBasePath` 选项定义了提供文件的路由的基本前缀。确保基本前缀是唯一的。

</dd>

<dt>

appUrl

</dt>

<dd>

你可以选择性地定义 `appUrl` 属性，以创建包含应用程序完整域名的 URL。否则将创建相对 URL。

</dd>


</dl>

## Edge 辅助函数

在 Edge 模板中，你可以使用以下辅助方法之一来生成 URL。这两个方法都是异步的，所以请确保 `await` 它们。

```edge
<img src="{{ await driveUrl(user.avatar) }}" />

<!-- 生成命名磁盘的 URL -->
<img src="{{ await driveUrl(user.avatar, 's3') }}" />
<img src="{{ await driveUrl(user.avatar, 'r2') }}" />
```

```edge
<a href="{{ await driveSignedUrl(invoice.key) }}">
  下载发票
</a>

<!-- 生成命名磁盘的 URL -->
<a href="{{ await driveSignedUrl(invoice.key, 's3') }}">
  下载发票
</a>

<!-- 生成带有签名选项的 URL -->
<a href="{{ await driveSignedUrl(invoice.key, {
  expiresIn: '30 mins',
}) }}">
  下载发票
</a>
```

## MultipartFile 辅助函数

Drive 扩展了 Bodyparser [MultipartFile](https://github.com/adonisjs/drive/blob/develop/providers/drive_provider.ts#L110) 类并添加了 `moveToDisk` 方法。此方法将文件从其 `tmpPath` 复制到配置的存储提供程序。

```ts
const image = request.file('image')!

const key = 'user-1-avatar.png'

/**
 * 将文件移动到默认磁盘
 */
await image.moveToDisk(key)

/**
 * 将文件移动到命名磁盘
 */
await image.moveToDisk(key, 's3')

/**
 * 在移动操作期间定义其他属性
 */
await image.moveToDisk(key, 's3', {
  contentType: 'image/png',
})

/**
 * 先将文件读取为 buffer 再写入。
 * 当你的云存储提供商在使用 "stream" 选项时导致文件损坏时，
 * 你可以使用此选项。
 */
await image.moveToDisk(key, 's3', {
  moveAs: 'buffer'
})
```

## 测试中的模拟磁盘

Drive 的 fakes API 可用于测试期间，以防止与远程存储进行交互。在 fakes 模式下，`drive.use()` 方法将返回一个假磁盘（由本地文件系统支持），并且所有文件都将写入应用程序根目录下的 `./tmp/drive-fakes` 目录中。

在使用 `drive.restore` 方法恢复 fake 后，这些文件将自动删除。

另请参阅：[FlyDrive fakes 文档](https://flydrive.dev/docs/drive_manager#using-fakes)

```ts
// title: tests/functional/users/update.spec.ts
import { test } from '@japa/runner'
import drive from '@adonisjs/drive/services/main'
import fileGenerator from '@poppinss/file-generator'

test.group('Users | update', () => {
  test('should be able to update my avatar', async ({ client, cleanup }) => {
    /**
     * 模拟 "spaces" 磁盘并在测试结束后恢复 fake
     */
    const fakeDisk = drive.fake('spaces')
    cleanup(() => drive.restore('spaces'))

    /**
     * 创建用户以执行登录和更新
     */
    const user = await UserFactory.create()

    /**
     * 生成一个大小为 1mb 的假内存 png 文件
     */
    const { contents, mime, name } = await fileGenerator.generatePng('1mb')

    /**
     * 发出 put 请求并发送文件
     */
    await client
      .put('me')
      .file('avatar', contents, {
        filename: name,
        contentType: mime,
      })
      .loginAs(user)

    /**
     * 断言文件存在
     */
    fakeDisk.assertExists(user.avatar)
  })
})
```
