---
summary: 了解如何使用 BodyParser 中间件解析请求体。
---

# Body parser 中间件

请求数据是使用注册在 `start/kernel.ts` 文件中的 `BodyParser` 中间件进行解析的。

该中间件的配置存储在 `config/bodyparser.ts` 文件中。在这个文件中，你可以配置用于解析 **JSON 载荷**、**包含文件上传的多部分表单**以及 **URL 编码表单**的解析器。

另请参阅：[读取请求体](./request.md#request-body)\
另请参阅：[文件上传](./file_uploads.md)

```ts
import { defineConfig } from '@adonisjs/core/bodyparser'

export const defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: {
    // 解析 HTML 表单的设置
  },

  json: {
    // 解析 JSON 请求体的设置
  },

  multipart: {
    // Multipart 解析器的设置
  },

  raw: {
    // 原始文本解析器的设置
  },
})
```

## 允许的方法

你可以定义一个 `allowedMethods` 数组，指定 bodyparser 中间件应该尝试解析请求体的方法。默认情况下，配置了以下方法。当然，你可以随意移除或添加新方法。

```ts
{
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE']
}
```

## 将空字符串转换为 null

当输入字段没有值时，HTML 表单会在请求体中发送一个空字符串。HTML 表单的这种行为使得数据库层的数据规范化变得更加困难。

例如，如果你的数据库列 `country` 设置为可空（nullable），你希望在用户没有选择国家时在该列中存储 `null` 值。

然而，对于 HTML 表单，后端接收到的是一个空字符串，你可能会将空字符串插入数据库，而不是将该列保留为 `null`。

`BodyParser` 中间件可以通过在配置中启用 `convertEmptyStringsToNull` 标志，将所有空字符串值转换为 `null` 来处理这种不一致性。

```ts
{
  form: {
    // ... 其余配置
    convertEmptyStringsToNull: true
  },

  json: {
    // ... 其余配置
    convertEmptyStringsToNull: true
  },

  multipart: {
    // ... 其余配置
    convertEmptyStringsToNull: true
  }
}
```

## JSON 解析器

JSON 解析器用于解析定义为 JSON 编码字符串的请求体，且 `Content-type` 头匹配预定义的 `types` 值之一。

```ts
json: {
  encoding: 'utf-8',
  limit: '1mb',
  strict: true,
  types: [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report',
  ],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

encoding

</dt>

<dd>

用于将请求体 Buffer 转换为字符串的编码。大多数情况下，你会希望使用 `utf-8`。不过，你可以使用 [iconv-lite 包](https://www.npmjs.com/package/iconv-lite#readme)支持的任何编码。

</dd>

<dt>

limit

</dt>

<dd>

解析器允许的最大请求体数据限制。如果请求体超过配置的限制，将返回 `413` 错误。

</dd>

<dt>

strict

</dt>

<dd>

严格解析仅允许 `objects` 和 `arrays` 出现在 JSON 编码字符串的顶层。

</dd>

<dt>

types

</dt>

<dd>

应该使用 JSON 解析器解析的 `Content-type` 头的值数组。

</dd>

</dl>

## URL 编码表单解析器

`form` 解析器用于解析 `Content-type` 头设置为 `application/x-www-form-urlencoded` 的 URL 编码字符串。换句话说，HTML 表单数据是使用 `form` 解析器解析的。

```ts
form: {
  encoding: 'utf-8',
  limit: '1mb',
  queryString: {},
  types: ['application/x-www-form-urlencoded'],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

encoding

<dt>

<dd>

用于将请求体 Buffer 转换为字符串的编码。大多数情况下，你会希望使用 `utf-8`。不过，你可以使用 [iconv-lite 包](https://www.npmjs.com/package/iconv-lite#readme)支持的任何编码。

</dd>

<dt>

limit

<dt>

<dd>

解析器允许的最大请求体数据限制。如果请求体超过配置的限制，将返回 `413` 错误。

</dd>

<dt>

queryString

<dt>

<dd>

URL 编码的请求体是使用 [qs 包](https://www.npmjs.com/package/qs)解析的。你可以使用 `queryString` 属性定义该包的选项。

```ts
  form: {
    queryString: {
      allowDots: true,
      allowSparse: true,
    },
  }
```

</dd>

</dl>

## Multipart 解析器

`multipart` 解析器用于解析带有文件上传的 HTML 表单请求。

另请参阅：[文件上传](./file_uploads.md)

```ts
multipart: {
  autoProcess: true,
  processManually: [],
  encoding: 'utf-8',
  fieldsLimit: '2mb',
  limit: '20mb',
  types: ['multipart/form-data'],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

autoProcess

</dt>

<dd>

启用 `autoProcess` 将把所有用户上传的文件移动到操作系统的 `tmp` 目录中。

稍后，在控制器中，你可以验证文件并将它们移动到持久化位置或云服务。

如果你禁用 `autoProcess` 标志，那么你将必须手动处理流并从请求体中读取文件/字段。另请参阅：[自我处理 multipart 流](./file_uploads.md#self-processing-multipart-stream)。

你可以定义一个路由数组，对这些路由自动处理文件。这些值**必须是路由模式**，而不是 URL。

```ts
{
  autoProcess: [
    '/uploads',
    '/post/:id'
  ]
}
```

</dd>

<dt>

processManually

</dt>

<dd>

`processManually` 数组允许你针对选定的路由关闭文件的自动处理。这些值**必须是路由模式**，而不是 URL。

```ts
multipart: {
  autoProcess: true,
  processManually: [
    '/file_manager',
    '/projects/:id/assets'
  ],
}
```

</dd>

<dt>

encoding

</dt>

<dd>

用于将请求体 Buffer 转换为字符串的编码。大多数情况下，你会希望使用 `utf-8`。不过，你可以使用 [iconv-lite 包](https://www.npmjs.com/package/iconv-lite#readme)支持的任何编码。

</dd>

<dt>

limit

</dt>

<dd>

处理所有文件时允许的最大字节限制。你可以使用 [request.file](./file_uploads.md) 方法定义单个文件的大小限制。

</dd>

<dt>

fieldsLimit

</dt>

<dd>

处理 multipart 请求时，允许字段（非文件）的最大字节限制。如果字段大小超过配置的限制，将返回 `413` 错误。

</dd>

</dl>
