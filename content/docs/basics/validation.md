---
summary: 了解如何在 AdonisJS 中使用 VineJS 验证用户输入。
---

# 验证

AdonisJS 中的数据验证通常在控制器级别执行。这确保了在应用程序处理请求时立即验证用户输入，并在响应中发送可显示在表单字段旁边的错误。

验证完成后，你可以使用受信任的数据执行其余操作，如数据库查询、调度队列作业、发送电子邮件等。

## 选择验证库

AdonisJS 核心团队创建了一个名为 [VineJS](https://vinejs.dev/docs/introduction) 的框架无关的数据验证库。以下是使用 VineJS 的一些原因。

- 它是 Node.js 生态系统中**最快的验证库之一**。

- 除了运行时验证外，还提供**静态类型安全**。

- 它在 `web` 和 `api` 入门套件中已预先配置。

- 官方 AdonisJS 包使用自定义规则扩展了 VineJS。例如，Lucid 为 VineJS 贡献了 `unique` 和 `exists` 规则。

然而，AdonisJS 在技术上并不强制你使用 VineJS。你可以使用任何适合你或你团队的验证库。只需卸载 `@vinejs/vine` 包并安装你想使用的包即可。

## 配置 VineJS

使用以下命令安装并配置 VineJS。

另请参阅：[VineJS 文档](https://vinejs.dev)

```sh
node ace add vinejs
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@vinejs/vine` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。

    ```ts
    {
      providers: [
        // ...其他提供者
        () => import('@adonisjs/core/providers/vinejs_provider')
      ]
    }
    ```

:::

## 使用验证器

VineJS 使用验证器的概念。你为应用程序可以执行的每个操作创建一个验证器。例如：定义一个用于**创建新帖子**的验证器，另一个用于**更新帖子**的验证器，也许还有一个用于**删除帖子**的验证器。

我们将以博客为例，定义用于创建/更新帖子的验证器。让我们从注册几个路由和 `PostsController` 开始。

```ts
// title: 定义路由
import router from '@adonisjs/core/services/router'

const PostsController = () => import('#controllers/posts_controller')

router.post('posts', [PostsController, 'store'])
router.put('posts/:id', [PostsController, 'update'])
```

```sh
// title: 创建控制器
node ace make:controller post store update
```

```ts
// title: 生成控制器骨架
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async store({}: HttpContext) {}

  async update({}: HttpContext) {}
}
```

### 创建验证器

创建 `PostsController` 并定义路由后，你可以使用以下 ace 命令创建验证器。

另请参阅：[Make validator 命令](../references/commands.md#makevalidator)

```sh
node ace make:validator post
```

验证器是在 `app/validators` 目录中创建的。验证器文件默认是空的，你可以从中导出多个验证器。每个验证器都是一个 `const` 变量，保存 [`vine.compile`](https://vinejs.dev/docs/getting_started#pre-compiling-schema) 方法的结果。

在下面的示例中，我们定义了 `createPostValidator` 和 `updatePostValidator`。这两个验证器的模式略有不同。在创建过程中，我们允许用户为帖子提供自定义 slug，而在更新时不允许。

:::note

不要太担心验证器模式中的重复。我们建议你选择易于理解的模式，而不是不惜一切代价避免重复。[湿代码类比](https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase)可能会帮助你接受重复。

:::

```ts
// title: app/validators/post_validator.ts
import vine from '@vinejs/vine'

/**
 * 验证帖子的创建操作
 */
export const createPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    slug: vine.string().trim(),
    description: vine.string().trim().escape()
  })
)

/**
 * 验证帖子的更新操作
 */
export const updatePostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    description: vine.string().trim().escape()
  })
)
```

### 在控制器中使用验证器

让我们回到 `PostsController` 并使用验证器来验证请求体。你可以使用 `request.all()` 方法访问请求体。

```ts
import { HttpContext } from '@adonisjs/core/http'
// insert-start
import {
  createPostValidator,
  updatePostValidator
} from '#validators/post_validator'
// insert-end

export default class PostsController {
  async store({ request }: HttpContext) {
    // insert-start
    const data = request.all()
    const payload = await createPostValidator.validate(data)
    return payload
    // insert-end
  }

  async update({ request }: HttpContext) {
    // insert-start
    const data = request.all()
    const payload = await updatePostValidator.validate(data)
    return payload
    // insert-end
  }
}
```

就是这样！验证用户输入在你的控制器中只需两行代码。验证后的输出具有从模式推断出的静态类型信息。

此外，你不必将 `validate` 方法调用包装在 `try/catch` 中。因为在发生错误的情况下，AdonisJS 会自动将错误转换为 HTTP 响应。

## 错误处理

[HttpExceptionHandler](./exception_handling.md) 将自动把验证错误转换为 HTTP 响应。异常处理程序使用内容协商，并根据 [Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept) 头值返回响应。

:::tip

你可能想浏览一下 [ExceptionHandler 代码库](https://github.com/adonisjs/http-server/blob/main/src/exception_handler.ts#L343-L345)，看看验证异常是如何转换为 HTTP 响应的。

此外，会话中间件 [重写了 `renderValidationErrorAsHTML` 方法](https://github.com/adonisjs/session/blob/main/src/session_middleware.ts#L30-L37)，并使用 flash 消息与表单共享验证错误。

:::

- 带有 `Accept=application/json` 头的 HTTP 请求将收到使用 [SimpleErrorReporter](https://github.com/vinejs/vine/blob/main/src/reporters/simple_error_reporter.ts) 创建的错误消息数组。

- 带有 `Accept=application/vnd.api+json` 头的 HTTP 请求将收到按照 [JSON API](https://jsonapi.org/format/#errors) 规范格式化的错误消息数组。

- 使用 [session 包](./session.md) 的服务器渲染表单将通过 [session flash 消息](./session.md#validation-errors-and-flash-messages) 收到错误。

- 所有其他请求将以纯文本形式收到错误。

## request.validateUsing 方法

在控制器内执行验证的推荐方法是使用 `request.validateUsing` 方法。使用 `request.validateUsing` 方法时，你不需要显式定义验证数据；**请求体**、**查询字符串值**和**文件**会合并在一起并作为数据传递给验证器。

```ts
import { HttpContext } from '@adonisjs/core/http'
import {
  createPostValidator,
  updatePostValidator
} from '#validators/posts_validator'

export default class PostsController {
  async store({ request }: HttpContext) {
    // delete-start
    const data = request.all()
    const payload = await createPostValidator.validate(data)
    // delete-end
    // insert-start
    const payload = await request.validateUsing(createPostValidator)
    // insert-end
  }

  async update({ request }: HttpContext) {
    // delete-start
    const data = request.all()
    const payload = await updatePostValidator.validate(data)
    // delete-end
    // insert-start
    const payload = await request.validateUsing(updatePostValidator)
    // insert-end
  }
}
```

### 验证 Cookie、Header 和路由参数

使用 `request.validateUsing` 方法时，你可以按如下方式验证 Cookie、Header 和路由参数。

```ts
const validator = vine.compile(
  vine.object({
    // 请求体中的字段
    username: vine.string(),
    password: vine.string(),

    // 验证 cookies
    cookies: vine.object({
    }),

    // 验证 headers
    headers: vine.object({
    }),

    // 验证路由参数
    params: vine.object({
    }),
  })
)

await request.validateUsing(validator)
```

## 向验证器传递元数据

由于验证器是在请求生命周期之外定义的，它们无法直接访问请求数据。这通常是件好事，因为它使验证器可以在 HTTP 请求生命周期之外重用。

但是，如果验证器需要访问某些运行时数据，你必须在 `validate` 方法调用期间将其作为元数据传递。

让我们以 `unique` 验证规则为例。我们希望确保用户电子邮件在数据库中是唯一的，但跳过当前登录用户的行。

```ts
export const updateUserValidator = vine
  .compile(
    vine.object({
      email: vine.string().unique(async (db, value, field) => {
        const user = await db
          .from('users')
          // highlight-start
          .whereNot('id', field.meta.userId)
          // highlight-end
          .where('email', value)
          .first()
        return !user
      })
    })
  )
```

在上面的示例中，我们通过 `meta.userId` 属性访问当前登录的用户。让我们看看如何在 HTTP 请求期间传递 `userId`。

```ts
async update({ request, auth }: HttpContext) {
  await request.validateUsing(
    updateUserValidator,
    {
      meta: {
        userId: auth.user!.id
      }
    }
  )
}
```

### 使元数据类型安全

在前面的示例中，我们必须记住在验证期间传递 `meta.userId`。如果 TypeScript 能提醒我们就好了。

在下面的示例中，我们使用 `vine.withMetaData` 函数定义我们在模式中期望使用的元数据的静态类型。

```ts
export const updateUserValidator = vine
  // insert-start
  .withMetaData<{ userId: number }>()
  // insert-end
  .compile(
    vine.object({
      email: vine.string().unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .whereNot('id', field.meta.userId)
          .where('email', value)
          .first()
        return !user
      })
    })
  )
```

请注意，VineJS 不会在运行时验证元数据。但是，如果你想这样做，可以将回调传递给 `withMetaData` 方法并手动执行验证。

```ts
vine.withMetaData<{ userId: number }>((meta) => {
  // 验证元数据
})
```

## 配置 VineJS

你可以在 `start` 目录中创建一个 [预加载文件](../concepts/adonisrc_file.md#preloads) 来配置带有自定义错误消息的 VineJS 或使用自定义错误报告器。

```sh
node ace make:preload validator
```

在下面的示例中，我们 [定义自定义错误消息](https://vinejs.dev/docs/custom_error_messages)。

```ts
// title: start/validator.ts
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  // 适用于所有字段
  'required': 'The {{ field }} field is required',
  'string': 'The value of {{ field }} field must be a string',
  'email': 'The value is not a valid email address',

  // username 字段的错误消息
  'username.required': 'Please choose a username for your account',
})
```

在下面的示例中，我们 [注册自定义错误报告器](https://vinejs.dev/docs/error_reporter)。

```ts
// title: start/validator.ts
import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { JSONAPIErrorReporter } from '../app/validation_reporters.js'

vine.errorReporter = () => new JSONAPIErrorReporter()
```

## AdonisJS 贡献的规则

以下是 AdonisJS 贡献的 VineJS 规则列表。

- [`vine.file`](https://github.com/adonisjs/core/blob/main/providers/vinejs_provider.ts) 模式类型由 AdonisJS 核心包添加。

## 下一步是什么？

- 了解更多关于在 VineJS 中使用 [自定义消息](https://vinejs.dev/docs/custom_error_messages) 的信息。
- 了解更多关于在 VineJS 中使用 [错误报告器](https://vinejs.dev/docs/error_reporter) 的信息。
- 阅读 VineJS [模式 API](https://vinejs.dev/docs/schema_101) 文档。
- 使用 [i18n 翻译](../digging_deeper/i18n.md#translating-validation-messages) 定义验证错误消息。
