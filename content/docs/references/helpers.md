---
summary: AdonisJS 中可用辅助函数的参考。
---

# 辅助函数

AdonisJS 附带了一些辅助函数，用于处理字符串、数组、文件系统等。

## 字符串辅助函数

字符串辅助函数从 `@adonisjs/core/helpers/string` 模块导出。你可以按如下方式导入该模块。

```ts
import string from '@adonisjs/core/helpers/string'
```

### string.truncate

截断字符串至指定长度。如果字符串被截断，将追加省略号。

你可以通过第二个参数提供自定义后缀。

```ts
string.truncate('This is a long sentence', 10)
// This is a...

string.truncate('This is a long sentence', 10, { suffix: '...' })
// This is a...

// 同时包含后缀长度
string.truncate('This is a long sentence', 10, {
  suffix: '...',
  completeWords: true
})
```

### string.slug

生成字符串的 URL 友好 slug。

```ts
string.slug('Hello world')
// hello-world

string.slug('Hello world', { replacement: '_' })
// hello_world
```

### string.sentence

将字符串转换为句子大小写（首字母大写）。

```ts
string.sentence('hello world')
// Hello world
```

### string.title

将字符串转换为标题大小写（每个单词首字母大写）。

```ts
string.title('hello world')
// Hello World
```

### string.plural

将单词转换为复数形式。

```ts
string.plural('box')
// boxes

string.plural('box', 2)
// boxes

string.plural('box', 1)
// box
```

## singular

将单词转换为单数形式。该方法是从 [pluralize 包](https://www.npmjs.com/package/pluralize) 导出的。

```ts
import string from '@adonisjs/core/helpers/string'

string.singular('tests')
// test
```

## isSingular

查找单词是否已经是单数形式。

```ts
import string from '@adonisjs/core/helpers/string'

string.isSingular('test') // true
```

## camelCase

将字符串值转换为驼峰命名法 (camelCase)。

```ts
import string from '@adonisjs/core/helpers/string'

string.camelCase('user_name') // userName
```

以下是一些转换示例。

| 输入 (Input)     | 输出 (Output) |
| ---------------- | ------------- |
| 'test'           | 'test'        |
| 'test string'    | 'testString'  |
| 'Test String'    | 'testString'  |
| 'TestV2'         | 'testV2'      |
| '_foo_bar_'      | 'fooBar'      |
| 'version 1.2.10' | 'version1210' |
| 'version 1.21.0' | 'version1210' |

## capitalCase

将字符串值转换为首字母大写 (Capital Case)。

```ts
import string from '@adonisjs/core/helpers/string'

string.capitalCase('helloWorld') // Hello World
```

以下是一些转换示例。

| 输入 (Input)     | 输出 (Output)    |
| ---------------- | ---------------- |
| 'test'           | 'Test'           |
| 'test string'    | 'Test String'    |
| 'Test String'    | 'Test String'    |
| 'TestV2'         | 'Test V 2'       |
| 'version 1.2.10' | 'Version 1.2.10' |
| 'version 1.21.0' | 'Version 1.21.0' |

## dashCase

将字符串值转换为短横线命名法 (dash-case)。

```ts
import string from '@adonisjs/core/helpers/string'

string.dashCase('helloWorld') // hello-world
```

或者，您可以将每个单词的首字母大写。

```ts
string.dashCase('helloWorld', { capitalize: true }) // Hello-World
```

以下是一些转换示例。

| 输入 (Input)     | 输出 (Output)  |
| ---------------- | -------------- |
| 'test'           | 'test'         |
| 'test string'    | 'test-string'  |
| 'Test String'    | 'test-string'  |
| 'Test V2'        | 'test-v2'      |
| 'TestV2'         | 'test-v-2'     |
| 'version 1.2.10' | 'version-1210' |
| 'version 1.21.0' | 'version-1210' |

## dotCase

将字符串值转换为点号命名法 (dot.case)。

```ts
import string from '@adonisjs/core/helpers/string'

string.dotCase('helloWorld') // hello.World
```

或者，您可以将所有单词的首字母转换为小写。

```ts
string.dotCase('helloWorld', { lowerCase: true }) // hello.world
```

以下是一些转换示例。

| 输入 (Input)     | 输出 (Output)  |
| ---------------- | -------------- |
| 'test'           | 'test'         |
| 'test string'    | 'test.string'  |
| 'Test String'    | 'Test.String'  |
| 'dot.case'       | 'dot.case'     |
| 'path/case'      | 'path.case'    |
| 'TestV2'         | 'Test.V.2'     |
| 'version 1.2.10' | 'version.1210' |
| 'version 1.21.0' | 'version.1210' |

## noCase

从字符串值中移除各种大小写格式。

```ts
import string from '@adonisjs/core/helpers/string'

string.noCase('helloWorld') // hello world
```

以下是一些转换示例。

| 输入 (Input)           | 输出 (Output)          |
| ---------------------- | ---------------------- |
| 'test'                 | 'test'                 |
| 'TEST'                 | 'test'                 |
| 'testString'           | 'test string'          |
| 'testString123'        | 'test string123'       |
| 'testString_1_2_3'     | 'test string 1 2 3'    |
| 'ID123String'          | 'id123 string'         |
| 'foo bar123'           | 'foo bar123'           |
| 'a1bStar'              | 'a1b star'             |
| 'CONSTANT_CASE '       | 'constant case'        |
| 'CONST123_FOO'         | 'const123 foo'         |
| 'FOO_bar'              | 'foo bar'              |
| 'XMLHttpRequest'       | 'xml http request'     |
| 'IQueryAArgs'          | 'i query a args'       |
| 'dot\.case'            | 'dot case'             |
| 'path/case'            | 'path case'            |
| 'snake_case'           | 'snake case'           |
| 'snake_case123'        | 'snake case123'        |
| 'snake_case_123'       | 'snake case 123'       |
| '"quotes"'             | 'quotes'               |
| 'version 0.45.0'       | 'version 0 45 0'       |
| 'version 0..78..9'     | 'version 0 78 9'       |
| 'version 4_99/4'       | 'version 4 99 4'       |
| ' test '               | 'test'                 |
| 'something_2014_other' | 'something 2014 other' |
| 'amazon s3 data'       | 'amazon s3 data'       |
| 'foo_13_bar'           | 'foo 13 bar'           |

## pascalCase

将字符串值转换为帕斯卡命名法 (PascalCase)。非常适合生成 JavaScript 类名。

```ts
import string from '@adonisjs/core/helpers/string'

string.pascalCase('user team') // UserTeam
```

以下是一些转换示例。

| 输入 (Input)     | 输出 (Output) |
| ---------------- | ------------- |
| 'test'           | 'Test'        |
| 'test string'    | 'TestString'  |
| 'Test String'    | 'TestString'  |
| 'TestV2'         | 'TestV2'      |
| 'version 1.2.10' | 'Version1210' |
| 'version 1.21.0' | 'Version1210' |

## sentenceCase

将值转换为句子。

```ts
import string from '@adonisjs/core/helpers/string'

string.sentenceCase('getting_started-with-adonisjs')
// Getting started with adonisjs
```

以下是一些转换示例。

| 输入 (Input)     | 输出 (Output)    |
| ---------------- | ---------------- |
| 'test'           | 'Test'           |
| 'test string'    | 'Test string'    |
| 'Test String'    | 'Test string'    |
| 'TestV2'         | 'Test v2'        |
| 'version 1.2.10' | 'Version 1 2 10' |
| 'version 1.21.0' | 'Version 1 21 0' |

## snakeCase

将值转换为蛇形命名法 (snake_case)。

```ts
import string from '@adonisjs/core/helpers/string'

string.snakeCase('user team') // user_team
```

以下是一些转换示例。

| 输入 (Input)     | 输出 (Output)  |
| ---------------- | -------------- |
| '\_id'           | 'id'           |
| 'test'           | 'test'         |
| 'test string'    | 'test_string'  |
| 'Test String'    | 'test_string'  |
| 'Test V2'        | 'test_v2'      |
| 'TestV2'         | 'test_v_2'     |
| 'version 1.2.10' | 'version_1210' |
| 'version 1.21.0' | 'version_1210' |

## titleCase

将字符串值转换为标题大小写 (Title Case)。

```ts
import string from '@adonisjs/core/helpers/string'

string.titleCase('small word ends on')
// Small Word Ends On
```

以下是一些转换示例。

| 输入 (Input)                       | 输出 (Output)                      |
| ---------------------------------- | ---------------------------------- |
| 'one. two.'                        | 'One. Two.'                        |
| 'a small word starts'              | 'A Small Word Starts'              |
| 'small word ends on'               | 'Small Word Ends On'               |
| 'we keep NASA capitalized'         | 'We Keep NASA Capitalized'         |
| 'pass camelCase through'           | 'Pass camelCase Through'           |
| 'follow step-by-step instructions' | 'Follow Step-by-Step Instructions' |
| 'this vs. that'                    | 'This vs. That'                    |
| 'this vs that'                     | 'This vs That'                     |
| 'newcastle upon tyne'              | 'Newcastle upon Tyne'              |
| 'newcastle *upon* tyne'            | 'Newcastle *upon* Tyne'            |

## random

生成给定长度的加密安全随机字符串。输出值是 URL 安全的 Base64 编码字符串。

```ts
import string from '@adonisjs/core/helpers/string'

string.random(32)
// 8mejfWWbXbry8Rh7u8MW3o-6dxd80Thk
```

## sentence

将单词数组转换为逗号分隔的句子。

```ts
import string from '@adonisjs/core/helpers/string'

string.sentence(['routes', 'controllers', 'middleware'])
// routes, controllers, and middleware
```

您可以通过指定 `options.lastSeparator` 属性将 `and` 替换为 `or`。

```ts
string.sentence(['routes', 'controllers', 'middleware'], {
  lastSeparator: ', or ',
})
```

在下面的示例中，两个单词使用 `and` 分隔符组合，而不是逗号（通常在英语中提倡）。但是，您可以为一对单词使用自定义分隔符。

```ts
string.sentence(['routes', 'controllers'])
// routes and controllers

string.sentence(['routes', 'controllers'], {
  pairSeparator: ', and ',
})
// routes, and controllers
```

## condenseWhitespace

将字符串中的多个空格缩减为单个空格。

```ts
import string from '@adonisjs/core/helpers/string'

string.condenseWhitespace('hello  world')
// hello world

string.condenseWhitespace('  hello  world  ')
// hello world
```

## seconds

将基于字符串的时间表达式解析为秒。

```ts
import string from '@adonisjs/core/helpers/string'

string.seconds.parse('10h') // 36000
string.seconds.parse('1 day') // 86400
```

将数值传递给 `parse` 方法会原样返回，假设该值已经是秒。

```ts
string.seconds.parse(180) // 180
```

您可以使用 `format` 方法将秒格式化为美观的字符串。

```ts
string.seconds.format(36000) // 10h
string.seconds.format(36000, true) // 10 hours
```

## milliseconds

将基于字符串的时间表达式解析为毫秒。

```ts
import string from '@adonisjs/core/helpers/string'

string.milliseconds.parse('1 h') // 3.6e6
string.milliseconds.parse('1 day') // 8.64e7
```

将数值传递给 `parse` 方法会原样返回，假设该值已经是毫秒。

```ts
string.milliseconds.parse(180) // 180
```

使用 `format` 方法，您可以将毫秒格式化为美观的字符串。

```ts
string.milliseconds.format(3.6e6) // 1h
string.milliseconds.format(3.6e6, true) // 1 hour
```

## bytes

将基于字符串的单位表达式解析为字节。

```ts
import string from '@adonisjs/core/helpers/string'

string.bytes.parse('1KB') // 1024
string.bytes.parse('1MB') // 1048576
```

将数值传递给 `parse` 方法会原样返回，假设该值已经是字节。

```ts
string.bytes.parse(1024) // 1024
```

使用 `format` 方法，您可以将字节格式化为美观的字符串。该方法直接从 [bytes](https://www.npmjs.com/package/bytes) 包导出。请参考包 README 以了解可用选项。

```ts
string.bytes.format(1048576) // 1MB
string.bytes.format(1024 * 1024 * 1000) // 1000MB
string.bytes.format(1024 * 1024 * 1000, { thousandsSeparator: ',' }) // 1,000MB
```

## ordinal

获取给定数字的序数字母。

```ts
import string from '@adonisjs/core/helpers/string'

string.ordinal(1) // 1st
string.ordinal(2) // '2nd'
string.ordinal(3) // '3rd'
string.ordinal(4) // '4th'

string.ordinal(23) // '23rd'
string.ordinal(24) // '24th'
```

## JSON 辅助函数

JSON 辅助函数从 `@adonisjs/core/helpers` 模块导出。

```ts
import { safeParse } from '@adonisjs/core/helpers'
```

### safeParse

安全地解析 JSON 字符串。如果解析失败，返回第二个参数作为默认值（如果未提供则返回 null）。

```ts
safeParse('{"foo": "bar"}') // { foo: 'bar' }
safeParse('invalid json', { foo: 'bar' }) // { foo: 'bar' }
```

## Base64 辅助函数

Base64 辅助函数从 `@adonisjs/core/helpers` 模块导出。

```ts
import { base64 } from '@adonisjs/core/helpers'
```

### base64.encode

将字符串或 Buffer 编码为 Base64 字符串。

```ts
base64.encode('hello world')
// aGVsbG8gd29ybGQ=
```

### base64.decode

将 Base64 字符串解码为原始字符串。

```ts
base64.decode('aGVsbG8gd29ybGQ=')
// hello world
```

### base64.urlEncode

将字符串或 Buffer 编码为 URL 安全的 Base64 字符串。

```ts
base64.urlEncode('hello world')
// aGVsbG8gd29ybGQ
```

### base64.urlDecode

将 URL 安全的 Base64 字符串解码为原始字符串。

```ts
base64.urlDecode('aGVsbG8gd29ybGQ')
// hello world
```

## 路径辅助函数

路径辅助函数从 `@adonisjs/core/helpers` 模块导出。

```ts
import { slash } from '@adonisjs/core/helpers'
```

### slash

将 Windows 反斜杠路径转换为正斜杠路径。

```ts
slash('foo\\bar') // foo/bar
```

## 测试辅助函数

测试辅助函数从 `@adonisjs/core/helpers` 模块导出。

```ts
import { isAssertionError } from '@adonisjs/core/helpers'
```

### isAssertionError

检查错误是否为断言错误。

```ts
try {
  assert.equal(1, 2)
} catch (error) {
  if (isAssertionError(error)) {
    // handle error
  }
}
```

## fsReadAll

获取目录中所有文件的列表。该方法递归地从主文件夹和子文件夹中获取文件。点文件会被隐式忽略。

```ts
import { fsReadAll } from '@adonisjs/core/helpers'

const files = await fsReadAll(new URL('./config', import.meta.url), { pathType: 'url' })
await Promise.all(files.map((file) => import(file)))
```

您还可以将选项与目录路径一起作为第二个参数传递。

```ts
type Options = {
  ignoreMissingRoot?: boolean
  filter?: (filePath: string, index: number) => boolean
  sort?: (current: string, next: string) => number
  pathType?: 'relative' | 'unixRelative' | 'absolute' | 'unixAbsolute' | 'url'
}

const options: Partial<Options> = {}
await fsReadAll(location, options)
```

| 参数 | 描述 |
|------------|------------|
| `ignoreMissingRoot` | 默认情况下，当根目录丢失时会抛出异常。将 `ignoreMissingRoot` 设置为 `true` 不会导致错误，并返回一个空数组。 |
| `filter` | 定义过滤器以忽略某些路径。该方法在最终的文件列表上调用。 |
| `sort` | 定义自定义方法以对文件路径进行排序。默认情况下，文件使用自然排序进行排序。 |
| `pathType` | 定义如何返回收集的路径。默认情况下，返回特定于操作系统的相对路径。如果要导入收集的文件，必须设置 `pathType = 'url'` |

## fsImportAll

`fsImportAll` 方法递归地从给定目录导入所有文件，并将每个模块的导出值设置在一个对象上。

```ts
import { fsImportAll } from '@adonisjs/core/helpers'

const collection = await fsImportAll(new URL('./config', import.meta.url))
console.log(collection)
```

- 集合是一个具有键值对树的对象。
- 键是从文件路径创建的嵌套对象。
- 值是模块的导出值。如果模块同时具有 `default` 和 `named` 导出，则仅使用默认导出。

第二个参数是用于自定义导入行为的选项。

```ts
type Options = {
  ignoreMissingRoot?: boolean
  filter?: (filePath: string, index: number) => boolean
  sort?: (current: string, next: string) => number
  transformKeys? (keys: string[]) => string[]
}

const options: Partial<Options> = {}
await fsImportAll(location, options)
```

| 参数 | 描述 |
|------------|------------|
| `ignoreMissingRoot` | 默认情况下，当根目录丢失时会抛出异常。将 `ignoreMissingRoot` 设置为 `true` 不会导致错误，并返回一个空对象。 |
| `filter` | 定义过滤器以忽略某些路径。默认情况下，仅导入以 `.js`、`.ts`、`.json`、`.cjs` 和 `.mjs` 结尾的文件。 |
| `sort` | 定义自定义方法以对文件路径进行排序。默认情况下，文件使用自然排序进行排序。 |
| `transformKeys` | 定义回调方法以转换最终对象的键。该方法接收嵌套键的数组，并且必须返回一个数组。 |

## String builder

`StringBuilder` 类提供了一个流畅的 API 来对字符串值执行转换。您可以使用 `string.create` 方法获取字符串构建器的实例。

```ts
import string from '@adonisjs/core/helpers/string'

const value = string
  .create('userController')
  .removeSuffix('controller') // user
  .plural() // users
  .snakeCase() // users
  .suffix('_controller') // users_controller
  .ext('ts') // users_controller.ts
  .toString()
```

## Message builder

`MessageBuilder` 类提供了一个 API，用于将 JavaScript 数据类型序列化为具有过期时间和用途的数据。您可以将序列化的输出存储在安全存储中（如应用程序数据库），或者对其进行加密（以避免篡改）并公开共享。

在下面的示例中，我们序列化了一个具有 `token` 属性的对象，并将其过期时间设置为 `1 hour`。

```ts
import { MessageBuilder } from '@adonisjs/core/helpers'

const builder = new MessageBuilder()
const encoded = builder.build(
  {
    token: string.random(32),
  },
  '1 hour',
  'email_verification'
)

/**
 * {
 *   "message": {
 *    "token":"GZhbeG5TvgA-7JCg5y4wOBB1qHIRtX6q"
 *   },
 *   "purpose":"email_verification",
 *   "expiryDate":"2022-10-03T04:07:13.860Z"
 * }
 */
```

一旦您拥有了包含过期时间和用途的 JSON 字符串，您就可以对其进行加密（以防止篡改）并与客户端共享。

在令牌验证期间，您可以解密以前加密的值，并使用 `MessageBuilder` 验证有效负载并将其转换为 JavaScript 对象。

```ts
import { MessageBuilder } from '@adonisjs/core/helpers'

const builder = new MessageBuilder()
const decoded = builder.verify(value, 'email_verification')
if (!decoded) {
  return 'Invalid payload'
}

console.log(decoded.token)
```

## Secret
`Secret` 类允许您在应用程序中保存敏感值，而不会意外地将其泄漏到日志和控制台语句中。

例如，`config/app.ts` 文件中定义的 `appKey` 值是 `Secret` 类的实例。如果您尝试将此值记录到控制台，您将看到 `[redacted]`，而不是原始值。

为了演示，让我们启动一个 REPL 会话并尝试一下。

```sh
node ace repl
```

```sh
> (js) config = await import('./config/app.js')

# [Module: null prototype] {
  // highlight-start
#   appKey: [redacted],
  // highlight-end
#   http: {
#   }
# }
```

```sh
> (js) console.log(config.appKey)

# [redacted]
```

您可以调用 `config.appKey.release` 方法来读取原始值。`Secret` 类的目的不是阻止您的代码访问原始值。相反，它提供了一个安全网，防止在日志中暴露敏感数据。

### 使用 Secret 类
您可以按如下方式将自定义值包装在 `Secret` 类中。

```ts
import { Secret } from '@adonisjs/core/helpers'
const value = new Secret('some-secret-value')

console.log(value) // [redacted]
console.log(value.release()) // some-secret-value
```

## 类型检测辅助函数

类型检测辅助函数从 `@adonisjs/core/helpers` 模块导出。

```ts
import { isObject, isArray, isString, isNumber, isBoolean, isFunction, isInteger, isFloat, isDecimal, isDate, isSymbol, isRegExp, isError, isPromise, isMap, isSet, isWeakMap, isWeakSet, isNull, isUndefined, isMissing, isPresent } from '@adonisjs/core/helpers'
```

| 函数 | 描述 |
| --- | --- |
| `isObject` | 检查值是否为对象且不为 null。 |
| `isArray` | 检查值是否为数组。 |
| `isString` | 检查值是否为字符串。 |
| `isNumber` | 检查值是否为数字。 |
| `isBoolean` | 检查值是否为布尔值。 |
| `isFunction` | 检查值是否为函数。 |
| `isInteger` | 检查值是否为整数。 |
| `isFloat` | 检查值是否为浮点数。 |
| `isDecimal` | 检查值是否为十进制数。 |
| `isDate` | 检查值是否为日期对象。 |
| `isSymbol` | 检查值是否为 Symbol。 |
| `isRegExp` | 检查值是否为正则表达式。 |
| `isError` | 检查值是否为错误对象。 |
| `isPromise` | 检查值是否为 Promise。 |
| `isMap` | 检查值是否为 Map。 |
| `isSet` | 检查值是否为 Set。 |
| `isWeakMap` | 检查值是否为 WeakMap。 |
| `isWeakSet` | 检查值是否为 WeakSet。 |
| `isNull` | 检查值是否为 null。 |
| `isUndefined` | 检查值是否为 undefined。 |
| `isMissing` | 检查值是否为 null 或 undefined。 |
| `isPresent` | 检查值是否不为 null 和 undefined。 |

## 其他辅助函数

### cuid

生成抗碰撞的唯一 ID (CUID2)。

```ts
import { cuid } from '@adonisjs/core/helpers'

cuid()
// tz4a98xxat96iws9zmbrgj3a
```

### compose

将多个 mixin 组合到一个类中。

```ts
import { compose } from '@adonisjs/core/helpers'

class User extends compose(
  BaseModel,
  UserWithEmail,
  UserWithPassword,
  UserWithAge,
  UserWithAttributes
) {}
```

### safeEqual

对两个字符串进行恒定时间比较，以防止计时攻击。

```ts
import { safeEqual } from '@adonisjs/core/helpers'

const trustedValue = 'hello world'
const userInput = 'hello'

if (safeEqual(trustedValue, userInput)) {
  // 两者相同
} else {
  // 值不匹配
}
```
