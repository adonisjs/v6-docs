---
summary: 学习如何使用 `@adonisjs/bouncer` 包在 AdonisJS 应用中编写授权检查。
---

# 授权 (Authorization)

你可以使用 `@adonisjs/bouncer` 包在 AdonisJS 应用中编写授权检查。Bouncer 提供了一个基于 JavaScript 的 API，用于将授权检查编写为 **能力 (Abilities)** 和 **策略 (Policies)**。

能力和策略的目标是将授权逻辑抽象到一个单一的位置，并在代码库的其他部分重复使用它。

- [能力 (Abilities)](#defining-abilities) 定义为函数，如果你的应用授权检查较少且较简单，这非常适合。

- [策略 (Policies)](#defining-policies) 定义为类，你必须为应用中的每个资源创建一个策略。策略还可以从 [自动依赖注入](#dependency-injection) 中受益。

:::note

Bouncer 不是 RBAC 或 ACL 的实现。相反，它提供了一个低级 API，用于在 AdonisJS 应用中对操作进行细粒度的授权控制。

:::

## 安装

使用以下命令安装并配置该包：

```sh
node ace add @adonisjs/bouncer
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/bouncer` 包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者和命令。

    ```ts
    {
      commands: [
        // ...其他命令
        () => import('@adonisjs/bouncer/commands')
      ],
      providers: [
        // ...其他提供者
        () => import('@adonisjs/bouncer/bouncer_provider')
      ]
    }
    ```

3. 创建 `app/abilities/main.ts` 文件以定义和导出能力。

4. 创建 `app/policies/main.ts` 文件以导出所有策略集合。

5. 在 `middleware` 目录下创建 `initialize_bouncer_middleware`。

6. 在 `start/kernel.ts` 文件中注册以下中间件。

    ```ts
    router.use([
      () => import('#middleware/initialize_bouncer_middleware')
    ])
    ```

:::

:::tip
**你是视觉学习者吗？** - 查看来自我们朋友 Adocasts 的 [AdonisJS Bouncer](https://adocasts.com/series/adonisjs-bouncer) 免费视频系列。
:::

## 初始化 Bouncer 中间件
在设置过程中，我们在应用中创建并注册了 `#middleware/initialize_bouncer_middleware` 中间件。初始化中间件负责为当前认证的用户创建 [Bouncer](https://github.com/adonisjs/bouncer/blob/main/src/bouncer.ts) 类的实例，并通过 `ctx.bouncer` 属性将其共享给请求的其余部分。

此外，我们要使用 `ctx.view.share` 方法与 Edge 模板共享同一个 Bouncer 实例。如果你不在应用中使用 Edge，请随意从中间件中删除以下代码行。

:::note

你拥有应用的源代码，包括初始设置期间创建的文件。因此，请毫不犹豫地更改它们并使它们适应你的应用环境。

:::

```ts
async handle(ctx: HttpContext, next: NextFn) {
  ctx.bouncer = new Bouncer(
    () => ctx.auth.user || null,
    abilities,
    policies
  ).setContainerResolver(ctx.containerResolver)

  // delete-start
  /**
   * 如果不使用 Edge，请删除
   */
  if ('view' in ctx) {
    ctx.view.share(ctx.bouncer.edgeHelpers)
  }
  // delete-end

  return next()
}
```

## 定义能力 (Abilities)

能力是通常写在 `./app/abilities/main.ts` 文件中的 JavaScript 函数。你可以从该文件导出多个能力。

在下面的示例中，我们使用 `Bouncer.ability` 方法定义了一个名为 `editPost` 的能力。实现回调必须返回 `true` 以授权用户，返回 `false` 以拒绝访问。

:::note

能力应始终接受 `User` 作为第一个参数，后面跟着授权检查所需的其他参数。

:::

```ts
// title: app/abilities/main.ts
import User from '#models/user'
import Post from '#models/post'
import { Bouncer } from '@adonisjs/bouncer'

export const editPost = Bouncer.ability((user: User, post: Post) => {
  return user.id === post.userId
})
```

### 执行授权
一旦定义了能力，你可以使用 `ctx.bouncer.allows` 方法执行授权检查。

Bouncer 会自动将当前登录的用户作为第一个参数传递给能力回调，你必须手动提供其余参数。

```ts
import Post from '#models/post'
// highlight-start
import { editPost } from '#abilities/main'
// highlight-end
import router from '@adonisjs/core/services/router'

router.put('posts/:id', async ({ bouncer, params, response }) => {
  /**
   * 通过 ID 查找帖子，以便我们可以对其执行
   * 授权检查。
   */
  const post = await Post.findOrFail(params.id)

  /**
   * 使用能力查看登录用户
   * 是否允许执行该操作。
   */
  // highlight-start
  if (await bouncer.allows(editPost, post)) {
    return '你可以编辑该帖子'
  }
  // highlight-end

  return response.forbidden('你不能编辑该帖子')
})
```

与 `bouncer.allows` 方法相反的是 `bouncer.denies` 方法。你可能更喜欢使用此方法而不是编写 `if not` 语句。

```ts
if (await bouncer.denies(editPost, post)) {
  response.abort('你不能编辑该帖子', 403)
}
```

### 允许访客用户
默认情况下，Bouncer 会在不调用能力回调的情况下拒绝未登录用户的授权检查。

但是，你可能希望定义某些可以与访客用户一起使用的能力。例如，允许访客查看已发布的帖子，但也允许帖子的创建者查看草稿。

你可以使用 `allowGuest` 选项定义允许访客用户的能力。在这种情况下，选项将被定义为第一个参数，回调将是第二个参数。

```ts
export const viewPost = Bouncer.ability(
  // highlight-start
  { allowGuest: true },
  // highlight-end
  (user: User | null, post: Post) => {
    /**
     * 允许所有人访问已发布的帖子
     */
    if (post.isPublished) {
      return true
    }

    /**
     * 访客无法查看未发布的帖子
     */
    if (!user) {
      return false
    }

    /**
     * 帖子的创建者也可以查看未发布的帖子。
     */
    return user.id === post.userId
  }
)
```

### 授权除登录用户以外的用户
如果你想授权除登录用户以外的用户，可以使用 `Bouncer` 构造函数为给定用户创建一个新的 bouncer 实例。

```ts
import User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'

const user = await User.findOrFail(1)
// highlight-start
const bouncer = new Bouncer(user)
// highlight-end

if (await bouncer.allows(editPost, post)) {
}
```

## 定义策略 (Policies)
策略提供了一个抽象层，将授权检查组织为类。建议每个资源创建一个策略。例如，如果你的应用有一个 Post 模型，你必须创建一个 `PostPolicy` 类来授权诸如创建或更新帖子之类的操作。

策略存储在 `./app/policies` 目录下，每个文件代表一个策略。你可以通过运行以下命令来创建一个新策略。

另请参阅：[Make policy 命令](../references/commands.md#makepolicy)

```sh
node ace make:policy post
```

策略类继承自 [BasePolicy](https://github.com/adonisjs/bouncer/blob/main/src/base_policy.ts) 类，你可以为你想要执行的授权检查实现方法。在下面的示例中，我们定义了 `create`、`edit` 和 `delete` 一个帖子的授权检查。

```ts
// title: app/policies/post_policy.ts
import User from '#models/user'
import Post from '#models/post'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  /**
   * 每个登录用户都可以创建帖子
   */
  create(user: User): AuthorizerResponse {
    return true
  }

  /**
   * 只有帖子创建者可以编辑帖子
   */
  edit(user: User, post: Post): AuthorizerResponse {
    return user.id === post.userId
  }

  /**
   * 只有帖子创建者可以删除帖子
   */
  delete(user: User, post: Post): AuthorizerResponse {
    return user.id === post.userId
  }
}
```

### 执行授权
创建策略后，你可以使用 `bouncer.with` 方法指定要用于授权的策略，然后链式调用 `bouncer.allows` 或 `bouncer.denies` 方法来执行授权检查。

:::note

链式调用在 `bouncer.with` 方法之后的 `allows` 和 `denies` 方法是类型安全的，并且会根据你在策略类上定义的方法显示补全列表。

:::

```ts
import Post from '#models/post'
import PostPolicy from '#policies/post_policy'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async create({ bouncer, response }: HttpContext) {
    // highlight-start
    if (await bouncer.with(PostPolicy).denies('create')) {
      return response.forbidden('无法创建帖子')
    }
    // highlight-end

    // 继续控制器逻辑
  }

  async edit({ bouncer, params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // highlight-start
    if (await bouncer.with(PostPolicy).denies('edit', post)) {
      return response.forbidden('无法编辑该帖子')
    }
    // highlight-end

    // 继续控制器逻辑
  }

  async delete({ bouncer, params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // highlight-start
    if (await bouncer.with(PostPolicy).denies('delete', post)) {
      return response.forbidden('无法删除该帖子')
    }
    // highlight-end

    // 继续控制器逻辑
  }
}
```

### 允许访客用户
[与能力类似](#allowing-guest-users)，策略也可以使用 `@allowGuest` 装饰器为访客用户定义授权检查。例如：

```ts
import User from '#models/user'
import Post from '#models/post'
import { BasePolicy, allowGuest } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  @allowGuest()
  view(user: User | null, post: Post): AuthorizerResponse {
    /**
     * 允许所有人访问已发布的帖子
     */
    if (post.isPublished) {
      return true
    }

    /**
     * 访客无法查看未发布的帖子
     */
    if (!user) {
      return false
    }

    /**
     * 帖子的创建者也可以查看未发布的帖子。
     */
    return user.id === post.userId
  }
}
```

### 策略钩子 (Hooks)
你可以在策略类上定义 `before` 和 `after` 模板方法，以便在授权检查前后运行操作。一个常见的用例是始终允许或拒绝特定用户的访问。

:::note

无论是否有登录用户，`before` 和 `after` 方法始终会被调用。因此，请务必处理 `user` 值为 `null` 的情况。

:::

`before` 的返回值解释如下。

- `true` 值将被视为授权成功，并且不会调用操作方法。
- `false` 值将被视为访问被拒绝，并且不会调用操作方法。
- 返回 `undefined` 值时，bouncer 将执行操作方法以执行授权检查。

```ts
export default class PostPolicy extends BasePolicy {
  async before(user: User | null, action: string, ...params: any[]) {
    /**
     * 始终允许管理员用户，无需执行任何检查
     */
    if (user && user.isAdmin) {
      return true
    }
  }
}
```

`after` 方法接收来自操作方法的原始响应，并且可以通过返回新值来覆盖先前的响应。`after` 的响应解释如下。

- `true` 值将被视为授权成功，旧响应将被丢弃。
- `false` 值将被视为访问被拒绝，旧响应将被丢弃。
- 返回 `undefined` 值时，bouncer 将继续使用旧响应。

```ts
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  async after(
    user: User | null,
    action: string,
    response: AuthorizerResponse,
    ...params: any[]
  ) {
    if (user && user.isAdmin) {
      return true
    }
  }
}
```

### 依赖注入
策略类是使用 [IoC 容器](../concepts/dependency_injection.md) 创建的；因此，你可以使用 `@inject` 装饰器在策略构造函数中进行类型提示并注入依赖项。

```ts
import { inject } from '@adonisjs/core'
import { PermissionsResolver } from '#services/permissions_resolver'

// highlight-start
@inject()
// highlight-end
export class PostPolicy extends BasePolicy {
  constructor(
    // highlight-start
    protected permissionsResolver: PermissionsResolver
    // highlight-end
  ) {
    super()
  }
}
```

如果在 HTTP 请求期间创建策略类，你也可以在其中注入 [HttpContext](../concepts/http_context.md) 实例。

```ts
// highlight-start
import { HttpContext } from '@adonisjs/core/http'
// highlight-end
import { PermissionsResolver } from '#services/permissions_resolver'

@inject()
export class PostPolicy extends BasePolicy {
  // highlight-start
  constructor(protected ctx: HttpContext) {
  // highlight-end
    super()
  }
}
```

## 抛出 AuthorizationException
除了 `allows` 和 `denies` 方法之外，你还可以使用 `bouncer.authorize` 方法执行授权检查。当检查失败时，此方法将抛出 [AuthorizationException](../references/exceptions.md#e_authorization_failure)。

```ts
router.put('posts/:id', async ({ bouncer, params }) => {
  const post = await Post.findOrFail(params.id)
  // highlight-start
  await bouncer.authorize(editPost, post)
  // highlight-end

  /**
   * 如果没有引发异常，你可以认为用户
   * 被允许编辑帖子。
   */
})
```

AdonisJS 将使用以下内容协商规则将 `AuthorizationException` 转换为 `403 - Forbidden` HTTP 响应。

- 带有 `Accept=application/json` 头的 HTTP 请求将收到一个错误消息数组。每个数组元素都是一个带有 `message` 属性的对象。

- 带有 `Accept=application/vnd.api+json` 头的 HTTP 请求将收到按 [JSON API](https://jsonapi.org/format/#errors) 规范格式化的错误消息数组。

- 所有其他请求将收到纯文本响应消息。但是，你可以使用 [状态页](../basics/exception_handling.md#status-pages) 来显示自定义的授权错误页面。

你也可以在 [全局异常处理器](../basics/exception_handling.md) 中自行处理 `AuthorizationException` 错误。

```ts
import app from '@adonisjs/core/services/app'
import { errors } from '@adonisjs/bouncer'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_AUTHORIZATION_FAILURE) {
      return ctx
        .response
        .status(error.status)
        .send(error.getResponseMessage(ctx))
    }
    // highlight-end

    return super.handle(error, ctx)
  }
}
```

## 自定义授权响应
除了从能力和策略返回布尔值外，你还可以使用 [AuthorizationResponse](https://github.com/adonisjs/bouncer/blob/main/src/response.ts) 类构建错误响应。

`AuthorizationResponse` 类为你提供了细粒度的控制，以定义自定义 HTTP 状态代码和错误消息。

```ts
import User from '#models/user'
import Post from '#models/post'
import { Bouncer, AuthorizationResponse } from '@adonisjs/bouncer'

export const editPost = Bouncer.ability((user: User, post: Post) => {
  if (user.id === post.userId) {
    return true
  }

  // highlight-start
  return AuthorizationResponse.deny('未找到帖子', 404)
  // highlight-end
})
```

如果你正在使用 [@adonisjs/i18n](../digging_deeper/i18n.md) 包，你可以使用 `.t` 方法返回本地化响应。翻译消息将在 HTTP 请求期间根据用户的语言优先于默认消息使用。

```ts
export const editPost = Bouncer.ability((user: User, post: Post) => {
  if (user.id === post.userId) {
    return true
  }

  // highlight-start
  return AuthorizationResponse
    .deny('未找到帖子', 404) // 默认消息
    .t('errors.not_found') // 翻译标识符
  // highlight-end
})
```

### 使用自定义响应构建器

为单个授权检查定义自定义错误消息的灵活性非常好。但是，如果你总是想返回相同的响应，每次都重复相同的代码可能会很麻烦。

因此，你可以按如下方式覆盖 Bouncer 的默认响应构建器。

```ts
import { Bouncer, AuthorizationResponse } from '@adonisjs/bouncer'

Bouncer.responseBuilder = (response: boolean | AuthorizationResponse) => {
  if (response instanceof AuthorizationResponse) {
    return response
  }

  if (response === true) {
    return AuthorizationResponse.allow()
  }

  return AuthorizationResponse
    .deny('未找到资源', 404)
    .t('errors.not_found')
}
```

## 预注册能力和策略
到目前为止，在本指南中，我们每当想要使用能力或策略时都会显式导入它。但是，一旦你预注册了它们，就可以通过名称（字符串）引用能力或策略。

预注册能力和策略在 TypeScript 代码库中可能不如清理导入那么有用。但是，它们在 Edge 模板中提供了更好的开发体验 (DX)。

看看下面有和没有预注册策略的 Edge 模板代码示例。

:::caption{for="error"}
**没有预注册。不，不是很干净**
:::

```edge
{{-- 先导入能力 --}}
@let(editPost = (await import('#abilities/main')).editPost)

@can(editPost, post)
  {{-- 可以编辑帖子 --}}
@end
```

:::caption{for="success"}
**有预注册**
:::

```edge
{{-- 将能力名称引用为字符串 --}}
@can('editPost', post)
  {{-- 可以编辑帖子 --}}
@end
```

如果你打开 `initialize_bouncer_middleware.ts` 文件，你会发现在创建 Bouncer 实例时我们已经导入并预注册了能力和策略。

```ts
// highlight-start
import * as abilities from '#abilities/main'
import { policies } from '#policies/main'
// highlight-end

export default class InitializeBouncerMiddleware {
  async handle(ctx, next) {
    ctx.bouncer = new Bouncer(
      () => ctx.auth.user,
      // highlight-start
      abilities,
      policies
      // highlight-end
    )

    return next()
  }
}
```

### 注意事项

- 如果你决定在代码库的其他部分定义能力，请务必在中间件中导入并预注册它们。

- 对于策略，每次运行 `make:policy` 命令时，请务必接受提示以在策略集合中注册策略。策略集合定义在 `./app/policies/main.ts` 文件中。

  ```ts
  // title: app/policies/main.ts
  export const policies = {
    PostPolicy: () => import('#policies/post_policy'),
    CommentPolicy: () => import('#policies/comment_policy')
  }
  ```

### 引用预注册的能力和策略
在下面的示例中，我们摆脱了导入，并通过名称引用能力和策略。请注意，**基于字符串的 API 也是类型安全的**，但你的代码编辑器的“转到定义”功能可能无法工作。

```ts
// title: 能力使用示例
// delete-start
import { editPost } from '#abilities/main'
// delete-end

router.put('posts/:id', async ({ bouncer, params, response }) => {
  const post = await Post.findOrFail(params.id)

  // delete-start
  if (await bouncer.allows(editPost, post)) {
  // delete-end
  // insert-start
  if (await bouncer.allows('editPost', post)) {
  // insert-end
    return '你可以编辑该帖子'
  }
})
```

```ts
// title: 策略使用示例
// delete-start
import PostPolicy from '#policies/post_policy'
// delete-end

export default class PostsController {
  async create({ bouncer, response }: HttpContext) {
    // delete-start
    if (await bouncer.with(PostPolicy).denies('create')) {
    // delete-end
    // insert-start
    if (await bouncer.with('PostPolicy').denies('create')) {
    // insert-end
      return response.forbidden('无法创建帖子')
    }

    // 继续控制器逻辑
  }
}
```

## Edge 模板中的授权检查
在 Edge 模板中执行授权检查之前，请务必 [预注册能力和策略](#pre-registering-abilities-and-policies)。完成后，你可以使用 `@can` 和 `@cannot` 标签执行授权检查。

这些标签接受 `ability` 名称或 `policy.method` 名称作为第一个参数，后面跟着能力或策略接受的其余参数。

```edge
// title: 使用能力
@can('editPost', post)
  {{-- 可以编辑帖子 --}}
@end

@cannot('editPost', post)
  {{-- 无法编辑帖子 --}}
@end
```

```edge
// title: 使用策略
@can('PostPolicy.edit', post)
  {{-- 可以编辑帖子 --}}
@end

@cannot('PostPolicy.edit', post)
  {{-- 无法编辑帖子 --}}
@end
```

## 事件
请查看 [事件参考指南](../references/events.md#authorizationfinished) 以查看 `@adonisjs/bouncer` 包分发的事件列表。
