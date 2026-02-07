---
summary: 了解如何使用 @adonisjs/shield 软件包保护服务器渲染的应用程序。
---

# 保护服务器渲染的应用程序 (Securing server-rendered applications)

如果您正在使用 AdonisJS 创建服务器渲染的应用程序，那么您必须使用 `@adonisjs/shield` 软件包来保护您的应用程序免受常见的 Web 攻击，如 **CSRF**、**XSS**、**内容嗅探**等。

该软件包已在 **web starter kit** 中预先配置。但是，您可以按如下方式手动安装和配置该软件包。

:::note
`@adonisjs/shield` 软件包与 `@adonisjs/session` 软件包具有对等依赖关系，因此请确保首先[配置会话软件包](../basics/session.md)。
:::

```sh
node ace add @adonisjs/shield
```

:::disclosure{title="查看 add 命令执行的步骤"}

1. 使用检测到的包管理器安装 `@adonisjs/shield` 软件包。

2. 在 `adonisrc.ts` 文件中注册以下服务提供者。

   ```ts
   {
     providers: [
       // ...其他提供者
       () => import('@adonisjs/shield/shield_provider'),
     ]
   }
   ```

3. 创建 `config/shield.ts` 文件。

4. 在 `start/kernel.ts` 文件中注册以下中间件。

   ```ts
   router.use([() => import('@adonisjs/shield/shield_middleware')])
   ```

:::

## CSRF 保护

[CSRF (跨站请求伪造)](https://owasp.org/www-community/attacks/csrf) 是一种攻击，恶意网站欺骗您的 Web 应用程序用户在未经其明确同意的情况下执行表单提交。

为了防止 CSRF 攻击，您应该定义一个隐藏的输入字段，其中包含只有您的网站才能生成和验证的 CSRF 令牌值。因此，由恶意网站触发的表单提交将失败。

### 保护表单

配置 `@adonisjs/shield` 软件包后，所有没有 CSRF 令牌的表单提交都将自动失败。因此，您必须使用 `csrfField` edge 助手定义一个包含 CSRF 令牌的隐藏输入字段。

:::caption{for="info"}
**Edge 助手**
:::

```edge
<form method="POST" action="/">
  // highlight-start
  {{ csrfField() }}
  // highlight-end
  <input type="name" name="name" placeholder="Enter your name">
  <button type="submit"> Submit </button>
</form>
```

:::caption{for="info"}
**输出 HTML**
:::

```html

<form method="POST" action="/">
    // highlight-start
    <input type="hidden" name="_csrf" value="Q9ghWSf0-3FD9eCiu5YxvKaxLEZ6F_K4DL8o"/>
    // highlight-end
    <input type="name" name="name" placeholder="Enter your name"/>
    <button type="submit">Submit</button>
</form>
```

在表单提交期间，`shield_middleware` 将自动验证 `_csrf` 令牌，仅允许具有有效 CSRF 令牌的表单提交。

### 处理异常

当 CSRF 令牌丢失或无效时，Shield 会引发 `E_BAD_CSRF_TOKEN` 异常。默认情况下，AdonisJS 将捕获该异常并将用户重定向回带有错误闪存消息的表单。

您可以在 edge 模板中按如下方式访问闪存消息。

```edge
// highlight-start
@error('E_BAD_CSRF_TOKEN')
  <p> {{ $message }} </p>
@end
// highlight-end

<form method="POST" action="/">
  {{ csrfField() }}
  <input type="name" name="name" placeholder="Enter your name">
  <button type="submit"> Submit </button>
</form>
```

您还可以按如下方式在[全局异常处理器](../basics/exception_handling.md#handling-exceptions)中自行处理 `E_BAD_CSRF_TOKEN` 异常。

```ts
import app from '@adonisjs/core/services/app'
import { errors } from '@adonisjs/shield'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_BAD_CSRF_TOKEN) {
      return ctx.response
        .status(error.status)
        .send('Page has expired')
    }
    // highlight-end
    return super.handle(error, ctx)
  }
}
```

### 配置参考

CSRF 守卫的配置存储在 `config/shield.ts` 文件中。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csrf: {
    enabled: true,
    exceptRoutes: [],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },
})

export default shieldConfig
```

<dl>

<dt>

enabled

</dt>

<dd>

打开或关闭 CSRF 守卫。

</dd>

<dt>

exceptRoutes

</dt>

<dd>

要从 CSRF 保护中豁免的路由模式数组。如果您的应用程序有通过 API 接受表单提交的路由，您可能希望豁免它们。

对于更高级的用例，您可以注册一个函数来动态豁免特定路由。

```ts
{
  exceptRoutes: (ctx) => {
    // 豁免所有以 /api/ 开头的路由
    return ctx.request.url().includes('/api/')
  }
}
```

</dd>

<dt>

enableXsrfCookie

</dt>

<dd>

启用后，Shield 将 CSRF 令牌存储在名为 `XSRF-TOKEN` 的加密 cookie 中，前端 JavaScript 代码可以读取该 cookie。

这允许像 Axios 这样的前端请求库自动读取 `XSRF-TOKEN` 并在进行 Ajax 请求时将其设置为 `X-XSRF-TOKEN` 头，而无需服务器渲染的表单。

如果您没有以编程方式触发 Ajax 请求，则必须保持 `enableXsrfCookie` 禁用。

</dd>

<dt>

methods

</dt>

<dd>

要保护的 HTTP 方法数组。所有提到的方法的传入请求都必须提供有效的 CSRF 令牌。

</dd>

<dt>

cookieOptions

</dt>

<dd>

`XSRF-TOKEN` cookie 的配置。[查看 cookies 配置](../basics/cookies.md#configuration)以获取可用选项。

</dd>

</dl>

## 定义 CSP 策略
[CSP (内容安全策略)](https://web.dev/csp/) 通过定义加载 JavaScript、CSS、字体、图像等的可信来源来保护您的应用程序免受 XSS 攻击。

默认情况下，CSP 守卫是禁用的。但是，我们建议您启用它并在 `config/shield.ts` 文件中配置策略指令。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    directives: {
      // 策略指令放在这里
    },
    reportOnly: false,
  },
})

export default shieldConfig
```

<dl>

<dt>

enabled

</dt>

<dd>

打开或关闭 CSP 守卫。

</dd>

<dt>

directives

</dt>

<dd>

配置 CSP 指令。您可以在 [https://content-security-policy.com/](https://content-security-policy.com/#directive) 上查看可用指令列表。

```ts
const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    // highlight-start
    directives: {
      defaultSrc: [`'self'`],
      scriptSrc: [`'self'`, 'https://cdnjs.cloudflare.com'],
      fontSrc: [`'self'`, 'https://fonts.googleapis.com']
    },
    // highlight-end
    reportOnly: false,
  },
})

export default shieldConfig
```

</dd>

<dt>

reportOnly

</dt>

<dd>

启用 `reportOnly` 标志时，CSP 策略将不会阻止资源。相反，它将在使用 `reportUri` 指令配置的端点上报告违规行为。

```ts
const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    directives: {
      defaultSrc: [`'self'`],
      // highlight-start
      reportUri: ['/csp-report']
      // highlight-end
    },
    // highlight-start
    reportOnly: true,
    // highlight-end
  },
})
```

此外，注册 `csp-report` 端点以收集违规报告。

```ts
router.post('/csp-report', async ({ request }) => {
  const report = request.input('csp-report')
})
```
</dd>

</dl>

### 使用 Nonce
您可以通过在它们上定义 [nonce 属性](https://content-security-policy.com/nonce/) 来允许内联 `script` 和 `style` 标签。可以在 Edge 模板中使用 `cspNonce` 属性访问 nonce 属性的值。

```edge
<script nonce="{{ cspNonce }}">
  // Inline JavaScript
</script>
<style nonce="{{ cspNonce }}">
  /* Inline CSS */
</style>
```

此外，在指令配置中使用 `@nonce` 关键字以允许基于 nonce 的内联脚本和样式。

```ts
const shieldConfig = defineConfig({
  csp: {
    directives: {
      defaultSrc: [`'self'`, '@nonce'],
    },
  },
})
```

### 从 Vite 开发服务器加载资产
如果您正在使用 [Vite 集成](../basics/vite.md)，则可以使用以下 CSP 关键字来允许 Vite 开发服务器提供的资产。

- `@viteDevUrl` 将 Vite 开发服务器 URL 添加到允许列表中。
- `@viteHmrUrl` 将 Vite HMR websocket 服务器 URL 添加到允许列表中。

```ts
const shieldConfig = defineConfig({
  csp: {
    directives: {
      defaultSrc: [`'self'`, '@viteDevUrl'],
      connectSrc: ['@viteHmrUrl']
    },
  },
})
```

如果您将 Vite 捆绑输出部署到 CDN 服务器，则必须将 `@viteDevUrl` 替换为 `@viteUrl` 关键字，以允许来自开发服务器和 CDN 服务器的资产。

```ts
directives: {
  // delete-start
  defaultSrc: [`'self'`, '@viteDevUrl'],
  // delete-end
  // insert-start
  defaultSrc: [`'self'`, '@viteUrl'],
  // insert-end
  connectSrc: ['@viteHmrUrl']
},
```

### 将 Nonce 添加到 Vite 注入的样式中
目前，Vite 不允许为它在 DOM 中注入的 `style` 标签定义 `nonce` 属性。对此有一个 [公开的 PR](https://github.com/vitejs/vite/pull/11864)，我们希望它能尽快解决。

## 配置 HSTS
[**Strict-Transport-Security (HSTS)**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) 响应头通知浏览器始终使用 HTTPS 加载网站。

您可以使用 `config/shield.ts` 文件配置头指令。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  hsts: {
    enabled: true,
    maxAge: '180 days',
    includeSubDomains: true,
  },
})
```

<dl>

<dt>

enabled

</dt>

<dd>

打开或关闭 hsts 守卫。

</dd>

<dt>

maxAge

</dt>

<dd>

定义 `max-age` 属性。该值应该是以秒为单位的数字或基于字符串的时间表达式。

```ts
{
  // 记住 10 秒
  maxAge: 10,
}
```

```ts
{
  // 记住 2 天
  maxAge: '2 days',
}
```

</dd>

<dt>

includeSubDomains

</dt>

<dd>

定义 `includeSubDomains` 指令以在子域上应用设置。

</dd>

</dl>

## 配置 X-Frame 保护
[**X-Frame-Options**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) 头用于指示是否允许浏览器渲染嵌入在 `iframe`、`frame`、`embed` 或 `object` 标签中的网站。

:::note

如果您已配置 CSP，则可以使用 [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors) 指令并禁用 `xFrame` 守卫。

:::

您可以使用 `config/shield.ts` 文件配置头指令。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  xFrame: {
    enabled: true,
    action: 'DENY'
  },
})
```

<dl>

<dt>

enabled

</dt>

<dd>

打开或关闭 xFrame 守卫。

</dd>

<dt>

action

</dt>

<dd>

`action` 属性定义头值。它可以是 `DENY`、`SAMEORIGIN` 或 `ALLOW-FROM`。

```ts
{
  action: 'DENY'
}
```

在 `ALLOW-FROM` 的情况下，您还必须定义 `domain` 属性。

```ts
{
  action: 'ALLOW-FROM',
  domain: 'https://foo.com',
}
```

</dd>

</dl>

## 禁用 MIME 嗅探
[**X-Content-Type-Options**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options) 头指示浏览器遵循 `content-type` 头，不要通过检查 HTTP 响应的内容来执行 MIME 嗅探。

启用此守卫后，Shield 将为所有 HTTP 响应定义 `X-Content-Type-Options: nosniff` 头。

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  contentTypeSniffing: {
    enabled: true,
  },
})
```
