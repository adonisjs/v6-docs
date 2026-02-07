---
summary: 了解容器服务以及它们如何帮助保持代码库的整洁和可测试性。
---

# 容器服务

正如我们在 [IoC 容器指南](./dependency_injection.md#container-bindings) 中所讨论的，容器绑定是 AdonisJS 中 IoC 容器存在的主要原因之一。

容器绑定使您的代码库免受构造对象所需的样板代码的影响。

在下面的示例中，在使用 `Database` 类之前，您必须创建一个实例。根据您正在构造的类，您可能需要编写大量样板代码来获取其所有依赖项。

```ts
import { Database } from '@adonisjs/lucid'
export const db = new Database(
  // 注入配置和其他依赖项
)
```

但是，当使用 IoC 容器时，您可以将构造类的任务卸载到容器并获取预构建的实例。

```ts
import app from '@adonisjs/core/services/app'
const db = await app.container.make('lucid.db')
```

## 容器服务的需求

使用容器来解析预配置的对象非常好。但是，使用 `container.make` 方法也有其缺点。

- 编辑器擅长自动导入。如果您尝试使用一个变量，并且编辑器可以猜测该变量的导入路径，那么它将为您编写导入语句。**但是，这对 `container.make` 调用不起作用。**

- 与拥有统一的模块导入/使用语法相比，混合使用导入语句和 `container.make` 调用感觉不直观。

为了克服这些缺点，我们将 `container.make` 调用包装在一个常规的 JavaScript 模块中，这样您就可以使用 `import` 语句获取它们。

例如，`@adonisjs/lucid` 包有一个名为 `services/db.ts` 的文件，该文件大致包含以下内容。

```ts
const db = await app.container.make('lucid.db')
export { db as default }
```

在您的应用程序中，您可以将 `container.make` 调用替换为指向 `services/db.ts` 文件的导入。

```ts
// delete-start
import app from '@adonisjs/core/services/app'
const db = await app.container.make('lucid.db')
// delete-end
// insert-start
import db from '@adonisjs/lucid/services/db'
// insert-end
```

如您所见，我们仍然依靠容器为我们解析 Database 类的实例。但是，通过一层间接，我们可以将 `container.make` 调用替换为常规的 `import` 语句。

**包装 `container.make` 调用的 JavaScript 模块被称为容器服务。** 几乎每个与容器交互的包都附带一个或多个容器服务。

## 容器服务与依赖注入

容器服务是依赖注入的一种替代方案。例如，您可以要求 `drive` 服务为您提供一个磁盘实例，而不是接受 `Disk` 类作为依赖项。让我们看一些代码示例。

在下面的示例中，我们使用 `@inject` 装饰器注入 `Disk` 类的一个实例。

```ts
import { Disk } from '@adonisjs/drive'
import { inject } from '@adonisjs/core'

  // highlight-start
@inject()
export class PostService {
  constructor(protected disk: Disk) {
  }
  // highlight-end  

  async save(post: Post, coverImage: File) {
    const coverImageName = 'random_name.jpg'

    // highlight-start
    await this.disk.put(coverImageName, coverImage)
    // highlight-end
    
    post.coverImage = coverImageName
    await post.save()
  }
}
```

当使用 `drive` 服务时，我们调用 `drive.use` 方法来获取带有 `s3` 驱动程序的 `Disk` 实例。

```ts
import drive from '@adonisjs/drive/services/main'

export class PostService {
  async save(post: Post, coverImage: File) {
    const coverImageName = 'random_name.jpg'

    // highlight-start
    const disk = drive.use('s3')
    await disk.put(coverImageName, coverImage)
    // highlight-end
    
    post.coverImage = coverImageName
    await post.save()
  }
}
```

容器服务非常适合保持代码简洁。而依赖注入则在不同的应用程序部分之间创建了松散耦合。

选择哪一个取决于您的个人偏好以及您希望采用的代码结构方法。

## 使用容器服务进行测试

依赖注入的直接好处是能够在编写测试时交换依赖项。

为了在使用容器服务时提供类似的测试体验，AdonisJS 提供了一流的 API，用于在编写测试时伪造实现。

在下面的示例中，我们调用 `drive.fake` 方法将驱动程序磁盘与内存驱动程序交换。创建伪造对象后，对 `drive.use` 方法的任何调用都将接收伪造实现。

```ts
import drive from '@adonisjs/drive/services/main'
import { PostService } from '#services/post_service'

test('save post', async ({ assert }) => {
  /**
   * 伪造 s3 磁盘
   */
  drive.fake('s3')
 
  const postService = new PostService()
  await postService.save(post, coverImage)
  
  /**
   * 编写断言
   */
  assert.isTrue(await drive.use('s3').exists(coverImage.name))
  
  /**
   * 恢复伪造
   */
  drive.restore('s3')
})
```

## 容器绑定和服务

下表列出了框架核心和第一方包导出的容器绑定及其相关服务。

<table>
  <thead>
    <tr>
      <th width="100px">绑定</th>
      <th width="140px">类</th>
      <th>服务</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <code>app</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/application/blob/main/src/application.ts">Application</a>
      </td>
      <td>
        <code>@adonisjs/core/services/app</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>ace</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/core/blob/main/modules/ace/kernel.ts">Kernel</a>
      </td>
      <td>
        <code>@adonisjs/core/services/kernel</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>config</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/config/blob/main/src/config.ts">Config</a>
      </td>
      <td>
        <code>@adonisjs/core/services/config</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>encryption</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/encryption/blob/main/src/encryption.ts">Encryption</a>
      </td>
      <td>
        <code>@adonisjs/core/services/encryption</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>emitter</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/events/blob/main/src/emitter.ts">Emitter</a>
      </td>
      <td>
        <code>@adonisjs/core/services/emitter</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>hash</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/hash/blob/main/src/hash_manager.ts">HashManager</a>
      </td>
      <td>
        <code>@adonisjs/core/services/hash</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>logger</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/logger/blob/main/src/logger_manager.ts">LoggerManager</a>
      </td>
      <td>
        <code>@adonisjs/core/services/logger</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>repl</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/repl/blob/main/src/repl.ts">Repl</a>
      </td>
      <td>
        <code>@adonisjs/core/services/repl</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>router</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/http-server/blob/main/src/router/main.ts">Router</a>
      </td>
      <td>
        <code>@adonisjs/core/services/router</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>server</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/http-server/blob/main/src/server/main.ts">Server</a>
      </td>
      <td>
        <code>@adonisjs/core/services/server</code>
      </td>
    </tr>
    <tr>
      <td>
        <code> testUtils</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/core/blob/main/src/test_utils/main.ts">TestUtils</a>
      </td>
      <td>
        <code>@adonisjs/core/services/test_utils</code>
      </td>
    </tr>
  </tbody>
</table>
