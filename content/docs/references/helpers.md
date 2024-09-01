---
summary: AdonisJSはユーティリティを`helpers`モジュールにまとめ、アプリケーションコードで利用できるようにします。
---

# ヘルパーリファレンス

AdonisJSはユーティリティを`helpers`モジュールにまとめ、アプリケーションコードで利用できるようにします。これらのユーティリティはすでにフレームワークにインストールされて使用されているため、`helpers`モジュールは`node_modules`に追加の膨張をもたらしません。

ヘルパーメソッドは次のモジュールからエクスポートされます。

```ts
import is from '@adonisjs/core/helpers/is'
import * as helpers from '@adonisjs/core/helpers'
import string from '@adonisjs/core/helpers/string'
```

## escapeHTML

文字列の値内のHTMLエンティティをエスケープします。内部では、[he](https://www.npmjs.com/package/he#heescapetext)パッケージを使用しています。

```ts
import string from '@adonisjs/core/helpers/string'

string.escapeHTML('<p> foo © bar </p>')
// &lt;p&gt; foo © bar &lt;/p&gt;
```

オプションで、`encodeSymbols`オプションを使用して非ASCIIシンボルをエンコードすることもできます。

```ts
import string from '@adonisjs/core/helpers/string'

string.escapeHTML('<p> foo © bar </p>', {
  encodeSymbols: true,
})
// &lt;p&gt; foo &#xA9; bar &lt;/p&gt;
```

## encodeSymbols

`encodeSymbols`ヘルパーを使用して、文字列の値内の非ASCIIシンボルをエンコードできます。内部では、[he.encode](https://www.npmjs.com/package/he#heencodetext-options)メソッドを使用しています。

```ts
import string from '@adonisjs/core/helpers/string'

string.encodeSymbols('foo © bar ≠ baz 𝌆 qux')
// 'foo &#xA9; bar &#x2260; baz &#x1D306; qux'
```

## prettyHrTime

[process.hrtime](https://nodejs.org/api/process.html#processhrtimetime)メソッドの差分を見やすく表示します。

```ts
import { hrtime } from 'node:process'
import string from '@adonisjs/core/helpers/string'

const startTime = hrtime()
await someOperation()
const endTime = hrtime(startTime)

console.log(string.prettyHrTime(endTime))
```

## isEmpty

文字列の値が空かどうかをチェックします。

```ts
import string from '@adonisjs/core/helpers/string'

string.isEmpty('') // true
string.isEmpty('      ') // true
```

## truncate

指定された文字数で文字列を切り詰めます。

```ts
import string from '@adonisjs/core/helpers/string'

string.truncate('This is a very long, maybe not that long title', 12)
// 出力: This is a ve...
```

デフォルトでは、文字列は指定されたインデックスで正確に切り詰められます。ただし、メソッドに単語の完了を待つように指示することもできます。

```ts
string.truncate('This is a very long, maybe not that long title', 12, {
  completeWords: true,
})
// 出力: This is a very...
```

`suffix`オプションを使用して、接尾辞をカスタマイズすることもできます。

```ts
string.truncate('This is a very long, maybe not that long title', 12, {
  completeWords: true,
  suffix: '... <a href="/1"> Read more </a>',
})
// 出力: This is a very... <a href="/1"> Read more </a>
```

## excerpt

`excerpt`メソッドは`truncate`メソッドと同じですが、文字列からHTMLタグを削除します。

```ts
import string from '@adonisjs/core/helpers/string'

string.excerpt('<p>This is a <strong>very long</strong>, maybe not that long title</p>', 12, {
  completeWords: true,
})
// 出力: This is a very...
```

## slug

文字列の値のスラッグを生成します。このメソッドは[slugifyパッケージ](https://www.npmjs.com/package/slugify)からエクスポートされているため、使用可能なオプションについてはそのドキュメントを参照してください。

```ts
import string from '@adonisjs/core/helpers/string'

console.log(string.slug('hello ♥ world'))
// hello-love-world
```

次のようにUnicode値のカスタム置換を追加できます。

```ts
string.slug.extend({ '☢': 'radioactive' })

console.log(string.slug('unicode ♥ is ☢'))
// unicode-love-is-radioactive
```

## interpolate

文字列内の変数を補間します。変数は二重の中括弧内にある必要があります。

```ts
import string from '@adonisjs/core/helpers/string'

string.interpolate('hello {{ user.username }}', {
  user: {
    username: 'virk'
  }
})
// hello virk
```

中括弧は`\\`接頭辞を使用してエスケープできます。

```ts
string.interpolate('hello \\{{ users.0 }}', {})
// hello {{ users.0 }}
```

## plural

単語を複数形に変換します。このメソッドは[pluralizeパッケージ](https://www.npmjs.com/package/pluralize)からエクスポートされています。

```ts
import string from '@adonisjs/core/helpers/string'

string.plural('test')
// tests
```

## isPlural

単語がすでに複数形かどうかを調べます。

```ts
import string from '@adonisjs/core/helpers/string'

string.isPlural('tests') // true
```

## pluralize

このメソッドは`singular`メソッドと`plural`メソッドを組み合わせ、カウントに基づいてどちらかを使用します。

例:
```ts
import string from '@adonisjs/core/helpers/string'

string.pluralize('box', 1) // box
string.pluralize('box', 2) // boxes
string.pluralize('box', 0) // boxes

string.pluralize('boxes', 1) // box
string.pluralize('boxes', 2) // boxes
string.pluralize('boxes', 0) // boxes
```

`pluralize`プロパティは、カスタムの不可算、不規則、複数形、単数形のルールを登録するための[追加のメソッド](https://www.npmjs.com/package/pluralize)をエクスポートします。

```ts
import string from '@adonisjs/core/helpers/string'

string.pluralize.addUncountableRule('paper')
string.pluralize.addSingularRule(/singles$/i, 'singular')
```

## singular

単語を単数形に変換します。このメソッドは[pluralizeパッケージ](https://www.npmjs.com/package/pluralize)からエクスポートされています。

```ts
import string from '@adonisjs/core/helpers/string'

string.singular('tests')
// test
```

## isSingular

単語がすでに単数形かどうかを調べます。

```ts
import string from '@adonisjs/core/helpers/string'

string.isSingular('test') // true
```

## camelCase

文字列の値をキャメルケースに変換します。

```ts
import string from '@adonisjs/core/helpers/string'

string.camelCase('user_name') // userName
```

以下はいくつかの変換の例です。

| 入力            | 出力        |
| ---------------- | ------------- |
| 'test'           | 'test'        |
| 'test string'    | 'testString'  |
| 'Test String'    | 'testString'  |
| 'TestV2'         | 'testV2'      |
| '_foo_bar_'      | 'fooBar'      |
| 'version 1.2.10' | 'version1210' |
| 'version 1.21.0' | 'version1210' |

## capitalCase

文字列の値をキャピタルケースに変換します。

```ts
import string from '@adonisjs/core/helpers/string'

string.capitalCase('helloWorld') // Hello World
```

以下はいくつかの変換の例です。

| 入力            | 出力           |
| ---------------- | ---------------- |
| 'test'           | 'Test'           |
| 'test string'    | 'Test String'    |
| 'Test String'    | 'Test String'    |
| 'TestV2'         | 'Test V 2'       |
| 'version 1.2.10' | 'Version 1.2.10' |
| 'version 1.21.0' | 'Version 1.21.0' |

## dashCase

文字列の値をダッシュケースに変換します。

```ts
import string from '@adonisjs/core/helpers/string'

string.dashCase('helloWorld') // hello-world
```

オプションで、各単語の最初の文字を大文字にすることもできます。

```ts
string.dashCase('helloWorld', { capitalize: true }) // Hello-World
```

以下はいくつかの変換の例です。

| 入力            | 出力         |
| ---------------- | -------------- |
| 'test'           | 'test'         |
| 'test string'    | 'test-string'  |
| 'Test String'    | 'test-string'  |
| 'Test V2'        | 'test-v2'      |
| 'TestV2'         | 'test-v-2'     |
| 'version 1.2.10' | 'version-1210' |
| 'version 1.21.0' | 'version-1210' |

## dotCase

文字列の値をドットケースに変換します。

```ts
import string from '@adonisjs/core/helpers/string'

string.dotCase('helloWorld') // hello.World
```

オプションで、すべての単語の最初の文字を小文字に変換することもできます。

```ts
string.dotCase('helloWorld', { lowerCase: true }) // hello.world
```

以下はいくつかの変換の例です。

| 入力            | 出力         |
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

文字列の値からすべてのケースを削除します。

```ts
import string from '@adonisjs/core/helpers/string'

string.noCase('helloWorld') // hello world
```

以下はいくつかの変換の例です。

| 入力                  | 出力                 |
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

文字列の値をパスカルケースに変換します。JavaScriptのクラス名を生成するのに最適です。

```ts
import string from '@adonisjs/core/helpers/string'

string.pascalCase('user team') // UserTeam
```

以下はいくつかの変換の例です。

| 入力            | 出力        |
| ---------------- | ------------- |
| 'test'           | 'Test'        |
| 'test string'    | 'TestString'  |
| 'Test String'    | 'TestString'  |
| 'TestV2'         | 'TestV2'      |
| 'version 1.2.10' | 'Version1210' |
| 'version 1.21.0' | 'Version1210' |

## sentenceCase

値を文に変換します。

```ts
import string from '@adonisjs/core/helpers/string'

string.sentenceCase('getting_started-with-adonisjs')
// Getting started with adonisjs
```

以下はいくつかの変換の例です。

| 入力            | 出力           |
| ---------------- | ---------------- |
| 'test'           | 'Test'           |
| 'test string'    | 'Test string'    |
| 'Test String'    | 'Test string'    |
| 'TestV2'         | 'Test v2'        |
| 'version 1.2.10' | 'Version 1 2 10' |
| 'version 1.21.0' | 'Version 1 21 0' |

## snakeCase

値をスネークケースに変換します。

```ts
import string from '@adonisjs/core/helpers/string'

string.snakeCase('user team') // user_team
```

以下はいくつかの変換の例です。

| 入力            | 出力         |
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

文字列の値をタイトルケースに変換します。

```ts
import string from '@adonisjs/core/helpers/string'

string.titleCase('small word ends on')
// Small Word Ends On
```

以下はいくつかの変換の例です。

| 入力                              | 出力                             |
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

## ランダム

指定された長さの暗号的に安全なランダムな文字列を生成します。出力値はURLセーフなBase64エンコードされた文字列です。

```ts
import string from '@adonisjs/core/helpers/string'

string.random(32)
// 8mejfWWbXbry8Rh7u8MW3o-6dxd80Thk
```

## 文

単語の配列をコンマ区切りの文に変換します。

```ts
import string from '@adonisjs/core/helpers/string'

string.sentence(['routes', 'controllers', 'middleware'])
// routes, controllers, そして middleware
```

`options.lastSeparator`プロパティを指定することで、`and`を`or`に置き換えることができます。

```ts
string.sentence(['routes', 'controllers', 'middleware'], {
  lastSeparator: ', または ',
})
```

次の例では、2つの単語はカスタムのセパレーターではなく、`and`セパレーターを使用して結合されます（通常は英語で推奨されるカンマではありません）。ただし、単語のペアにカスタムのセパレーターを使用することもできます。

```ts
string.sentence(['routes', 'controllers'])
// routes そして controllers

string.sentence(['routes', 'controllers'], {
  pairSeparator: ', そして ',
})
// routes, そして controllers
```

## 空白の圧縮

文字列内の複数の空白を単一の空白に削除します。

```ts
import string from '@adonisjs/core/helpers/string'

string.condenseWhitespace('hello  world')
// hello world

string.condenseWhitespace('  hello  world  ')
// hello world
```

## 秒

文字列ベースの時間表現を秒に解析します。

```ts
import string from '@adonisjs/core/helpers/string'

string.seconds.parse('10h') // 36000
string.seconds.parse('1 day') // 86400
```

`parse`メソッドに数値を渡すと、秒単位であると仮定してそのまま返されます。

```ts
string.seconds.parse(180) // 180
```

`format`メソッドを使用すると、秒を見やすい文字列にフォーマットできます。

```ts
string.seconds.format(36000) // 10h
string.seconds.format(36000, true) // 10 時間
```

## ミリ秒

文字列ベースの時間表現をミリ秒に解析します。

```ts
import string from '@adonisjs/core/helpers/string'

string.milliseconds.parse('1 h') // 3.6e6
string.milliseconds.parse('1 day') // 8.64e7
```

`parse`メソッドに数値を渡すと、ミリ秒単位であると仮定してそのまま返されます。

```ts
string.milliseconds.parse(180) // 180
```

`format`メソッドを使用すると、ミリ秒を見やすい文字列にフォーマットできます。

```ts
string.milliseconds.format(3.6e6) // 1h
string.milliseconds.format(3.6e6, true) // 1 時間
```

## バイト

文字列ベースの単位表現をバイトに解析します。

```ts
import string from '@adonisjs/core/helpers/string'

string.bytes.parse('1KB') // 1024
string.bytes.parse('1MB') // 1048576
```

`parse`メソッドに数値を渡すと、バイト単位であると仮定してそのまま返されます。

```ts
string.bytes.parse(1024) // 1024
```

`format`メソッドを使用すると、バイトを見やすい文字列にフォーマットできます。このメソッドは、[bytes](https://www.npmjs.com/package/bytes)パッケージから直接エクスポートされています。使用可能なオプションについては、パッケージのREADMEを参照してください。

```ts
string.bytes.format(1048576) // 1MB
string.bytes.format(1024 * 1024 * 1000) // 1000MB
string.bytes.format(1024 * 1024 * 1000, { thousandsSeparator: ',' }) // 1,000MB
```

## 序数

指定された数値の序数を取得します。

```ts
import string from '@adonisjs/core/helpers/string'

string.ordinal(1) // 1st
string.ordinal(2) // '2nd'
string.ordinal(3) // '3rd'
string.ordinal(4) // '4th'

string.ordinal(23) // '23rd'
string.ordinal(24) // '24th'
```

## 安全な等価性

2つのバッファまたは文字列の値が同じかどうかをチェックします。このメソッドは、タイミング情報を漏洩させず、[タイミング攻撃](https://javascript.plainenglish.io/what-are-timing-attacks-and-how-to-prevent-them-using-nodejs-158cc7e2d70c)を防止します。

内部的には、このメソッドはNode.jsの[crypto.timeSafeEqual](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)メソッドを使用しており、文字列の比較もサポートしています（crypto.timeSafeEqualは文字列の比較をサポートしていません）。

```ts
import { safeEqual } from '@adonisjs/core/helpers'

/**
 * 信頼できる値、おそらくdbに保存されている値
 */
const trustedValue = 'hello world'

/**
 * 信頼できないユーザー入力
 */
const userInput = 'hello'

if (safeEqual(trustedValue, userInput)) {
  // 両方が同じです
} else {
  // 値が一致しません
}
```

## cuid
水平スケーリングとパフォーマンスに最適化された、衝突しないセキュアなIDを作成します。このメソッドは、[@paralleldrive/cuid2](https://github.com/paralleldrive/cuid2)パッケージを内部で使用しています。

```ts
import { cuid } from '@adonisjs/core/helpers'

const id = cuid()
// tz4a98xxat96iws9zmbrgj3a
```

`isCuid`メソッドを使用して、値が有効なCUIDかどうかをチェックできます。

```ts
import { cuid, isCuid } from '@adonisjs/core/helpers'

const id = cuid()
isCuid(id) // true
```

## compose

`compose`ヘルパーを使用すると、よりシンプルなAPIでTypeScriptクラスのミックスインを使用できます。以下は、`compose`ヘルパーを使用せずにミックスインを使用する例です。

```ts
class User extends UserWithAttributes(UserWithAge(UserWithPassword(UserWithEmail(BaseModel)))) {}
```

以下は、`compose`ヘルパーを使用した例です。

- ネストはありません。
- ミックスインの順序は（左から右/上から下）です。以前は内側から外側でした。

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

値をBase64エンコードおよびデコードするためのユーティリティメソッドです。

```ts
import { base64 } from '@adonisjs/core/helpers'

base64.encode('hello world')
// aGVsbG8gd29ybGQ=
```

`encode`メソッドと同様に、`urlEncode`を使用してURLに安全なBase64文字列を生成することもできます。

`urlEncode`メソッドは、次の置換を実行します。

- `+`を`-`に置き換えます。
- `/`を`_`に置き換えます。
- 文字列の末尾の`=`を削除します。

```ts
base64.urlEncode('hello world')
// aGVsbG8gd29ybGQ
```

`decode`メソッドと`urlDecode`メソッドを使用して、以前にエンコードされたBase64文字列をデコードすることもできます。

```ts
base64.decode(base64.encode('hello world'))
// hello world

base64.urlDecode(base64.urlEncode('hello world'))
// hello world
```

`decode`メソッドと`urlDecode`メソッドは、入力値が無効なBase64文字列の場合は`null`を返します。例外を発生させるために`strict`モードをオンにすることもできます。

```ts
base64.decode('hello world') // null
base64.decode('hello world', 'utf-8', true) // 例外を発生させる
```

## fsReadAll

ディレクトリからすべてのファイルのリストを取得します。このメソッドは、メインとサブフォルダからファイルを再帰的に取得します。ドットファイルは暗黙的に無視されます。

```ts
import { fsReadAll } from '@adonisjs/core/helpers'

const files = await fsReadAll(new URL('./config', import.meta.url), { pathType: 'url' })
await Promise.all(files.map((file) => import(file)))
```

ディレクトリパスと一緒にオプションを渡すこともできます。

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

| 引数 | 説明 |
|------------|------------|
| `ignoreMissingRoot` | ルートディレクトリが存在しない場合、デフォルトでは例外が発生します。`ignoreMissingRoot`をtrueに設定すると、エラーが発生せず、空の配列が返されます。 |
| `filter` | 特定のパスを無視するためのフィルタを定義します。メソッドは最終的なファイルリストで呼び出されます。 |
| `sort` | ファイルパスをソートするためのカスタムメソッドを定義します。デフォルトでは、ファイルは自然なソートを使用してソートされます。 |
| `pathType` | 収集されたパスをどのように返すかを定義します。デフォルトでは、OS固有の相対パスが返されます。収集したファイルをインポートする場合は、`pathType = 'url'`に設定する必要があります。 |

## fsImportAll

`fsImportAll`メソッドは、指定されたディレクトリから再帰的にすべてのファイルをインポートし、各モジュールのエクスポート値をオブジェクトに設定します。

```ts
import { fsImportAll } from '@adonisjs/core/helpers'

const collection = await fsImportAll(new URL('./config', import.meta.url))
console.log(collection)
```

- コレクションは、キーと値のペアのツリーを持つオブジェクトです。
- キーはファイルパスから作成されたネストされたオブジェクトです。
- 値はモジュールからエクスポートされた値です。モジュールに`default`と`named`の両方のエクスポートがある場合、デフォルトエクスポートのみが使用されます。

2番目のパラメータは、インポートの動作をカスタマイズするためのオプションです。

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

| 引数 | 説明 |
|------------|------------|
| `ignoreMissingRoot` | ルートディレクトリが存在しない場合、デフォルトでは例外が発生します。`ignoreMissingRoot`をtrueに設定すると、エラーが発生せず、空のオブジェクトが返されます。 |
| `filter` | 特定のパスを無視するためのフィルタを定義します。デフォルトでは、`.js`、`.ts`、`.json`、`.cjs`、`.mjs`で終わるファイルのみがインポートされます。 |
| `sort` | ファイルパスをソートするためのカスタムメソッドを定義します。デフォルトでは、ファイルは自然なソートを使用してソートされます。 |
| `transformKeys` | 最終的なオブジェクトのキーを変換するためのコールバックメソッドを定義します。メソッドはネストされたキーの配列を受け取り、配列を返さなければなりません。 |

## 文字列ビルダー

`StringBuilder`クラスは、文字列の値に対して変換を行うためのフルエンドAPIを提供します。`string.create`メソッドを使用して、文字列ビルダーのインスタンスを取得できます。

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

## メッセージビルダー

`MessageBuilder`クラスは、有効期限と目的を持つJavaScriptのデータ型をシリアライズするためのAPIを提供します。シリアライズされた出力をアプリケーションのデータベースなどの安全なストレージに保存するか、暗号化して（改ざんを防ぐために）公開できます。

次の例では、`token`プロパティを持つオブジェクトをシリアライズし、有効期限を「1時間」に設定します。

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

JSON文字列に有効期限と目的が含まれている場合、それを暗号化して（改ざんを防ぐために）クライアントと共有できます。

トークンの検証中に、以前に暗号化された値を復号化し、`MessageBuilder`を使用してペイロードを検証し、JavaScriptオブジェクトに変換できます。

```ts
import { MessageBuilder } from '@adonisjs/core/helpers'

const builder = new MessageBuilder()
const decoded = builder.verify(value, 'email_verification')
if (!decoded) {
  return '無効なペイロードです'
}

console.log(decoded.token)
```

## Secret
`Secret`クラスを使用すると、ログやコンソールのステートメント内で誤って漏洩することなく、アプリケーション内に機密情報を保持できます。

たとえば、`config/app.ts`ファイル内で定義された`appKey`の値は、`Secret`クラスのインスタンスです。この値をコンソールにログ出力しようとすると、元の値ではなく`[redacted]`が表示されます。

デモンストレーションのために、REPLセッションを起動して試してみましょう。

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

`config.appKey.release`メソッドを呼び出すと、元の値を読み取ることができます。Secretクラスの目的は、コードが元の値にアクセスできなくすることではありません。代わりに、機密データがログ内で公開されることを防ぐ安全装置を提供します。

### Secretクラスの使用方法
次のように、カスタムの値をSecretクラスでラップできます。

```ts
import { Secret } from '@adonisjs/core/helpers'
const value = new Secret('some-secret-value')

console.log(value) // [redacted]
console.log(value.release()) // some-secret-value
```

## タイプの検出

`helpers/is`のインポートパスから[@sindresorhus/is](https://github.com/sindresorhus/is)モジュールをエクスポートしており、アプリケーションでタイプの検出を行うために使用できます。

```ts
import is from '@adonisjs/core/helpers/is'

is.object({}) // true
is.object(null) // false
```
