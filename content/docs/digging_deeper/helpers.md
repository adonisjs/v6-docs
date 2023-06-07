# Helpers

AdonisJS bundles the utilities the framework uses into the `helpers` module and makes them available to your application code. Since these utilities are already installed and used by the framework, the `helpers` module does not add any additional bloat to your `node_modules`.

## escapeHTML

Escape HTML entities in a string value. Under the hood, we use the [he](https://www.npmjs.com/package/he#heescapetext) package.

```ts
import string from '@adonisjs/core/helpers/string'

string.escapeHTML('<p> foo © bar </p>')
// &lt;p&gt; foo © bar &lt;/p&gt;
```

Optionally, you can encode non-ASCII symbols using the `encodeSymbols` option.

```ts
import string from '@adonisjs/core/helpers/string'

string.escapeHTML(
  '<p> foo © bar </p>',
  {
    encodeSymbols: true
  }
)
// &lt;p&gt; foo &#xA9; bar &lt;/p&gt;
```

## encodeSymbols

You may encode non-ASCII symbols in a string value using the `encodeSymbols` helper. Under the hood, we use [he.encode](https://www.npmjs.com/package/he#heencodetext-options) method.

```ts
import string from '@adonisjs/core/helpers/string'

string.encodeSymbols('foo © bar ≠ baz 𝌆 qux');
// 'foo &#xA9; bar &#x2260; baz &#x1D306; qux'
```

## prettyHrTime

Pretty print the diff of [process.hrtime](https://nodejs.org/api/process.html#processhrtimetime) method.

```ts
import { hrtime } from 'node:process'
import string from '@adonisjs/core/helpers/string'

const startTime = hrtime()
await someOperation()
const endTime = hrtime(startTime)

console.log(string.prettyHrTime(endTime))
``` 

## isEmpty

Check if a string value is empty.

```ts
import string from '@adonisjs/core/helpers/string'

string.isEmpty('') // true
string.isEmpty('      ') // true
```

## truncate

Truncate a string at a given number of characters.

```ts
import string from '@adonisjs/core/helpers/string'

string.truncate(
  'This is a very long, maybe not that long title',
  12
) // This is a ve...
```

By default, the string is truncated exactly at the given index. However, you can instruct the method to wait for the words to complete.

```ts
string.truncate(
  'This is a very long, maybe not that long title',
  12,
  {
    completeWords: true
  }
) // This is a very...
```

You can customize the suffix using the `suffix` option.

```ts
string.truncate(
  'This is a very long, maybe not that long title',
  12,
  {
    completeWords: true,
    suffix: '... <a href="/1"> Read more </a>',
  }
) // This is a very... <a href="/1"> Read more </a>
```

## excerpt

The `excerpt` method is the same as the `truncate` method. However, it strips the HTML tags from the string.

```ts
import string from '@adonisjs/core/helpers/string'

string.excerpt(
  '<p>This is a <strong>very long</strong>, maybe not that long title</p>',
  12,
  {
    completeWords: true,
  }
) // This is a very...
```


## slug

Generate slug for a string value. The method is exported from the [slugify package](https://www.npmjs.com/package/slugify); therefore, consult its documentation for available options.

```ts
import string from '@adonisjs/core/helpers/string'

console.log(string.slug('hello ♥ world'))
// hello-love-world
```

You can add custom replacements for Unicode values as follows.

```ts
string.slug.extend({ '☢': 'radioactive' })

console.log(string.slug('unicode ♥ is ☢'))
// unicode-love-is-radioactive
```

## interpolate

Interpolate variables inside a string. The variables must be inside double curly braces.

```ts
import string from '@adonisjs/core/helpers/string'

string.interpolate(
  'hello {{ user.username }}',
  { user: { username: 'virk' } }
)
// hello virk
```

Curly braces can be escaped using the `\\` prefix.

```ts
string.interpolate('hello \\{{ users.0 }}', {})
// hello {{ users.0 }}
```

## plural

Convert a word to its plural form. The method is exported from the [pluralize package](https://www.npmjs.com/package/pluralize).

```ts
import string from '@adonisjs/core/helpers/string'

string.plural('test')
// tests
```

## isPlural

Find if a word already is in plural form.

```ts
import string from '@adonisjs/core/helpers/string'

string.isPlural('tests') // true
```

## pluralize

This method combines the `singular` and the `plural` methods and uses one or the other based on the count. For example:

```ts
import string from '@adonisjs/core/helpers/string'

string.pluralize('box', 1) // box
string.pluralize('box', 2) // boxes
string.pluralize('box', 0) // boxes

string.pluralize('boxes', 1) // box
string.pluralize('boxes', 2) // boxes
string.pluralize('boxes', 0) // boxes
```

The `pluralize` property exports [additional methods](https://www.npmjs.com/package/pluralize) to register custom uncountable, irregular, plural, and singular rules.

```ts
import string from '@adonisjs/core/helpers/string'

string.pluralize.addUncountableRule('paper')
string.pluralize.addSingularRule(/singles$/i, 'singular')
```

## singular

Convert a word to its singular form. The method is exported from the [pluralize package](https://www.npmjs.com/package/pluralize).

```ts
import string from '@adonisjs/core/helpers/string'

string.singular('tests')
// test
```

## isSingular

Find if a word is already in a singular form.

```ts
import string from '@adonisjs/core/helpers/string'

string.isSingular('test') // true
```

## camelCase

Convert a string value to camelcase.

```ts
import string from '@adonisjs/core/helpers/string'

string.camelCase('user_name') // userName
```

Following are some of the conversion examples.

| Input            | Output        |
| ---------------- | ------------- |
| 'test'           | 'test'        |
| 'test string'    | 'testString'  |
| 'Test String'    | 'testString'  |
| 'TestV2'         | 'testV2'      |
| '_foo_bar_'      | 'fooBar'      |
| 'version 1.2.10' | 'version1210' |
| 'version 1.21.0' | 'version1210' |

## capitalCase

Convert a string value to a capital case.

```ts
import string from '@adonisjs/core/helpers/string'

string.capitalCase('helloWorld') // Hello World
```

Following are some of the conversion examples.

| Input            | Output           |
| ---------------- | ---------------- |
| 'test'           | 'Test'           |
| 'test string'    | 'Test String'    |
| 'Test String'    | 'Test String'    |
| 'TestV2'         | 'Test V 2'       |
| 'version 1.2.10' | 'Version 1.2.10' |
| 'version 1.21.0' | 'Version 1.21.0' |

## dashCase

Convert a string value to a dash case.

```ts
import string from '@adonisjs/core/helpers/string'

string.dashCase('helloWorld') // hello-world
```

Optionally, you can capitalize the first letter of each word.

```ts
string.dashCase('helloWorld', { capitalize: true }) // Hello-World
```

Following are some of the conversion examples.

| Input            | Output         |
| ---------------- | -------------- |
| 'test'           | 'test'         |
| 'test string'    | 'test-string'  |
| 'Test String'    | 'test-string'  |
| 'Test V2'        | 'test-v2'      |
| 'TestV2'         | 'test-v-2'     |
| 'version 1.2.10' | 'version-1210' |
| 'version 1.21.0' | 'version-1210' |

## dotCase

Convert a string value to a dot case.

```ts
import string from '@adonisjs/core/helpers/string'

string.dotCase('helloWorld') // hello.World
```

Optionally, you can convert the first letter of all the words to lowercase.

```ts
string.dotCase('helloWorld', { lowerCase: true }) // hello.world
```

Following are some of the conversion examples.

| Input            | Output         |
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

Remove all sorts of casing from a string value.

```ts
import string from '@adonisjs/core/helpers/string'

string.noCase('helloWorld') // hello world
```

Following are some of the conversion examples.

| Input                  | Output                 |
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
| 'dot\.case'             | 'dot case'             |
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

Convert a string value to a Pascal case. Great for generating JavaScript class names.

```ts
import string from '@adonisjs/core/helpers/string'

string.pascalCase('user team') // UserTeam
```

Following are some of the conversion examples.

| Input            | Output        |
| ---------------- | ------------- |
| 'test'           | 'Test'        |
| 'test string'    | 'TestString'  |
| 'Test String'    | 'TestString'  |
| 'TestV2'         | 'TestV2'      |
| 'version 1.2.10' | 'Version1210' |
| 'version 1.21.0' | 'Version1210' |

## sentenceCase

Convert a value to a sentence.

```ts
import string from '@adonisjs/core/helpers/string'

string.sentenceCase('getting-started-with-adonisjs')
// Getting started with adonisjs
```

Following are some of the conversion examples.

| Input            | Output           |
| ---------------- | ---------------- |
| 'test'           | 'Test'           |
| 'test string'    | 'Test string'    |
| 'Test String'    | 'Test string'    |
| 'TestV2'         | 'Test v2'        |
| 'version 1.2.10' | 'Version 1 2 10' |
| 'version 1.21.0' | 'Version 1 21 0' |

## snakeCase

Convert value to snake case.

```ts
import string from '@adonisjs/core/helpers/string'

string.snakeCase('user team') // user_team
```

Following are some of the conversion examples.

| Input            | Output         |
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

Convert a string value to title case.

```ts
import string from '@adonisjs/core/helpers/string'

string.titleCase('small word ends on')
// Small Word Ends On
```

Following are some of the conversion examples.

| Input                              | Output                             |
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
| 'newcastle \*upon\* tyne'          | 'Newcastle \*upon\* Tyne'          |

## random

Generate a cryptographically secure random string of a given length. The output value is a URL-safe base64 encoded string.

```ts
import string from '@adonisjs/core/helpers/string'

string.random(32)
// 8mejfWWbXbry8Rh7u8MW3o-6dxd80Thk
```

## sentence

Convert an array of words to a comma-separated sentence.

```ts
import string from '@adonisjs/core/helpers/string'

string.sentence(['routes', 'controllers', 'middleware'])
// routes, controllers, and middleware
```

You can replace the `and` with an `or` by specifying the `options.lastSeparator` property.

```ts
string.sentence(['routes', 'controllers', 'middleware'], {
  lastSeparator: ', or ',
})
```

In the following example, the two words are combined using the `and` separator, not the comma (usually advocated in English). However, you can use a custom separator for a pair of words.

```ts
string.sentence(['routes', 'controllers'])
// routes and controllers

string.sentence(['routes', 'controllers'], {
  pairSeparator: ', and ',
})
// routes, and controllers
```

## condenseWhitespace

Remove multiple whitespaces from a string to a single whitespace.

```ts
string.condenseWhitespace('hello  world')
// hello world

string.condenseWhitespace('  hello  world  ')
// hello world
```

## seconds

Parse a string-based time expression to seconds.

```ts
string.seconds.parse('10h') // 36000
string.seconds.parse('1 day') // 86400
```

Passing a numeric value to the `parse` method is returned as it is, assuming the value is already in seconds.

```ts
string.seconds.parse(180) // 180
```

You can format seconds to a pretty string using the `format` method.

```ts
string.seconds.format(36000) // 10h
string.seconds.format(36000, true) // 10 hours
```

## milliseconds

Parse a string-based time expression to milliseconds.

```ts
string.milliseconds.parse('1 h') // 3.6e6
string.milliseconds.parse('1 day') // 8.64e7
```

Passing a numeric value to the `parse` method is returned as it is, assuming the value is already in milliseconds.

```ts
string.milliseconds.parse(180) // 180
```

Using the `format` method, you can format milliseconds to a pretty string.

```ts
string.milliseconds.format(3.6e6) // 1h
string.milliseconds.format(3.6e6, true) // 1 hour
```

## bytes

Parse a string-based unit expression to bytes.

```ts
string.bytes.parse('1KB') // 1024
string.bytes.parse('1MB') // 1048576
```

Passing a numeric value to the `parse` method is returned as it is, assuming the value is already in bytes.

```ts
string.bytes.parse(1024) // 1024
```

Using the `format` method, you can format bytes to a pretty string. The method is exported directly from the [bytes](https://www.npmjs.com/package/bytes) package. Please reference the package README for available options.

```ts
string.bytes.format(1048576) // 1MB
string.bytes.format(1024 * 1024 * 1000) // 1000MB
string.bytes.format(1024 * 1024 * 1000, { thousandsSeparator: ',' }) // 1,000MB
```

## ordinal

Get the ordinal letter for a given number.

```ts
string.ordinal(1) // 1st
string.ordinal(2) // '2nd'
string.ordinal(3) // '3rd'
string.ordinal(4) // '4th'

string.ordinal(23) // '23rd'
string.ordinal(24) // '24th'
```

## safeEqual

Check if two buffer or string values are the same. This method does not leak any timing information and prevents [timing attack](https://javascript.plainenglish.io/what-are-timing-attacks-and-how-to-prevent-them-using-nodejs-158cc7e2d70c).

Under the hood, this method uses Node.js [crypto.timeSafeEqual](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b) method, with support for comparing string values. _(crypto.timeSafeEqual does not support string comparison)_

```ts
import { safeEqual } from '@adonisjs/core/helpers'

/**
 * The trusted value, it might be saved inside the db
 */
const trustedValue = 'hello world'

/**
 * Untrusted user input
 */
const userInput = 'hello'

if (safeEqual(trustedValue, userInput)) {
  // both are the same
} else {
  // value mismatch
}
```

## compose

The `compose` helper allows you to use TypeScript class mixins with a cleaner API. Following is an example of mixins usage without the `compose` helper.

```ts
class User extends UserWithAttributes(UserWithAge(UserWithPassword(UserWithEmail(BaseModel)))) {}
```

Following is an example with the `compose` helper.

- There is no nesting.
- The order of mixins is from left to right. Whereas earlier, it was inside out.

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

## base64

Utility methods to base64 encode and decode values.

```ts
import { base64 } from '@adonisjs/core/helpers'

base64.encode('hello world')
// aGVsbG8gd29ybGQ=
```

Like the `encode` method, you can may the `urlEncode` to generate a base64 string safe to pass in a URL.

The `urlEncode` method performs the following replacements.

- Replace `+` with `-`.
- Replace `/` with `_`.
- And remove the `=` sign from the end of the string.

```ts
base64.urlEncode('hello world')
// aGVsbG8gd29ybGQ
```

You can use the `decode` and the `urlDecode` methods to decode a previously encoded base64 string.

```ts
base64.decode(base64.encode('hello world'))
// hello world

base64.urlDecode(base64.urlEncode('hello world'))
// hello world
```

The `decode` and the `urlDecode` methods return `null` when the input value is an invalid base64 string. You can turn on the `strict` mode to raise an exception instead.

```ts
base64.decode('hello world') // null
base64.decode('hello world', 'utf-8', true) // raises exception
```

## fsReadAll

Get a list of all the files from a directory. The method recursively fetches files from the main and the sub-folders. The dotfiles are ignored implicitly.

```ts
import { fsReadAll } from '@adonisjs/core/helpers'

const files = await fsReadAll(new URL('./config', import.meta.url), { pathType: 'url' })
await Promise.all(files.map((file) => import(file)))
```

You can also pass the options along with the directory path as the second argument.

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

| Argument            | Type    | Description                                                                                                                                                                   |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ignoreMissingRoot` | boolean | By default, an exception is raised when the root directory is missing. Setting `ignoreMissingRoot` to true will not result in an error, and an empty array is returned.   |
| `filter`            | method  | Define a filter to ignore certain paths. The method is called on the final list of files.                                                                                     |
| `sort`              | method  | Define a custom method to sort file paths. By default, the files are sorted using natural sort.                                                                               |
| `pathType`          | enum    | Define how to return the collected paths. By default, OS-specific relative paths are returned. If you want to import the collected files, you must set the `pathType = 'url'` |

## fsImportAll

The `fsImportAll` method imports all the files recursively from a given directory and sets the exported value from each module on an object.

```ts
import { fsImportAll } from '@adonisjs/core/helpers'

const collection = await fsImportAll(new URL('./config', import.meta.url))
console.log(collection)
```

- Collection is an object with a tree of key-value pairs.
- The key is the nested object created from the file path.
- Value is the exported values from the module. Only the default export is used if a module has both `default` and `named` exports.

The second param is the option to customize the import behavior.

| Argument            | Type    | Description                                                                                                                                                                  |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ignoreMissingRoot` | boolean | By default, an exception is raised when the root directory is missing. Setting `ignoreMissingRoot` to true will not result in an error, and an empty object will be returned. |
| `filter`            | method  | Define a filter to ignore certain paths. By default, only files ending with `.js`, `.ts`, `.json`, `.cjs`, and `.mjs` are imported.                                           |
| `sort`              | method  | Define a custom method to sort file paths. By default, the files are sorted using natural sort.                                                                              |
| `transformKeys`     | method  | Define a callback method to transform the keys for the final object. The method receives an array of nested keys and must return an array.                              |


## String builder

The `StringBuilder` class offers a fluent API to perform transformations on a string value. You may get an instance of string builder using the `string.create` method.

```ts
import string from '@adonisjs/core/helpers/string'

const value = string.create('userController')
  .removeSuffix('controller') // user
  .plural() // users
  .snakeCase() // users
  .suffix('_controller') // users_controller
  .ext('ts') // users_controller.ts
  .toString()
```

## Types detection

We export the [@sindresorhus/is](https://github.com/sindresorhus/is) module from the `helpers/is` import path, and you may use it to perform the type detection in your apps.

```ts
import is from '@adonisjs/helpers/is'

is.object({}) // true
is.object(null) // false
```
