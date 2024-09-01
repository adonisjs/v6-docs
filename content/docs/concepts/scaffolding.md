---
summary: AdonisJSでテンプレートからソースファイルを生成し、ASTを解析してTypeScriptのソースコードを更新する
---

# Scaffoldingとコードモッド

Scaffoldingは、静的なテンプレート（スタブとも呼ばれる）からソースファイルを生成するプロセスを指し、コードモッドはASTを解析してTypeScriptのソースコードを更新することを指します。

AdonisJSでは、新しいファイルを作成したりパッケージを設定したりする繰り返しのタスクを高速化するために、両方を使用しています。このガイドでは、scaffoldingの基本とAceコマンド内で使用できるコードモッドAPIについて説明します。

## 基本概念

### スタブ
スタブは、特定のアクションでソースファイルを作成するために使用されるテンプレートです。たとえば、`make:controller`コマンドは、[controller stub](https://github.com/adonisjs/core/blob/main/stubs/make/controller/main.stub)を使用してホストプロジェクト内にコントローラファイルを作成します。

### ジェネレータ
ジェネレータは、名前の規則を強制し、事前定義された規則に基づいてファイル、クラス、またはメソッドの名前を生成します。

たとえば、コントローラスタブでは、[controllerName](https://github.com/adonisjs/application/blob/main/src/generators.ts#L122)と[controllerFileName](https://github.com/adonisjs/application/blob/main/src/generators.ts#L139)ジェネレータを使用してコントローラを作成します。

ジェネレータはオブジェクトとして定義されているため、既存のメソッドを上書きして規則を調整することができます。このガイドの後半で詳しく説明します。

### コードモッド
コードモッドAPIは、[@adonisjs/assembler](https://github.com/adonisjs/assembler/blob/main/src/code_transformer/main.ts)パッケージから提供され、内部では[ts-morph](https://github.com/dsherret/ts-morph)を使用しています。

`@adonisjs/assembler`は開発時の依存関係であり、本番環境ではプロジェクトの依存関係を増やしません。また、コードモッドAPIは本番環境では使用できません。

AdonisJSが公開するコードモッドAPIは、`.adonisrc.ts`ファイルにプロバイダを追加したり、`start/kernel.ts`ファイル内でミドルウェアを登録したりするなど、高レベルのタスクを実行するために非常に特定のものです。また、これらのAPIはデフォルトの命名規則に依存しているため、プロジェクトに大幅な変更を加えるとコードモッドを実行できなくなる場合があります。

### configureコマンド
configureコマンドは、AdonisJSパッケージを設定するために使用されます。内部では、このコマンドはメインエントリポイントファイルをインポートし、指定されたパッケージでエクスポートされた`configure`メソッドを実行します。

パッケージの`configure`メソッドは、[Configureコマンド](https://github.com/adonisjs/core/blob/main/commands/configure.ts)のインスタンスを受け取り、そのインスタンスからスタブとコードモッドAPIにアクセスできます。

## スタブの使用方法
ほとんどの場合、スタブはAceコマンド内または作成したパッケージの`configure`メソッド内で使用します。両方の場合に、Aceコマンドの`createCodemods`メソッドを介してコードモッドモジュールを初期化できます。

`codemods.makeUsingStub`メソッドは、スタブテンプレートからソースファイルを作成します。次の引数を受け入れます。

- スタブが保存されているディレクトリのルートへのURL
- `STUBS_ROOT`ディレクトリからスタブファイルまでの相対パス（拡張子を含む）
- スタブと共有するデータオブジェクト

```ts
// title: コマンド内部
import { BaseCommand } from '@adonisjs/core/ace'

const STUBS_ROOT = new URL('./stubs', import.meta.url)

export default class MakeApiResource extends BaseCommand {
  async run() {
    // highlight-start
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(STUBS_ROOT, 'api_resource.stub', {})
    // highlight-end
  }
}
```

### スタブのテンプレート
スタブの処理には[Tempura](https://github.com/lukeed/tempura)テンプレートエンジンを使用します。Tempuraは、JavaScript用の超軽量なハンドルバースタイルのテンプレートエンジンです。

:::tip

Tempuraの構文はハンドルバーと互換性があるため、`.stub`ファイルでハンドルバーの構文ハイライトを使用するようにコードエディタを設定できます。

:::

次の例では、JavaScriptのクラスを出力するスタブを作成しています。ダブルカーリーブラケットを使用してランタイム値を評価します。

```handlebars
export default class {{ modelName }}Resource {
  serialize({{ modelReference }}: {{ modelName }}) {
    return {{ modelReference }}.toJSON()
  }
}
```

### ジェネレータの使用

上記のスタブを実行すると失敗します。なぜなら、`modelName`と`modelReference`のデータプロパティを提供していないからです。

これらのプロパティをスタブ内でインライン変数を使用して計算することをオススメします。これにより、ホストアプリケーションはスタブを[eject](#スタブのeject)して変数を変更できます。

```js
// insert-start
{{#var entity = generators.createEntity('user')}}
{{#var modelName = generators.modelName(entity.name)}}
{{#var modelReference = string.toCamelCase(modelName)}}
// insert-end

export default class {{ modelName }}Resource {
  serialize({{ modelReference }}: {{ modelName }}) {
    return {{ modelReference }}.toJSON()
  }
}
```

### 出力先の指定
最後に、スタブを使用して作成されるファイルの出力先パスを指定する必要があります。再度、スタブファイル内で出力先パスを指定します。これにより、ホストアプリケーションはスタブを[eject](#スタブのeject)して出力先をカスタマイズできます。

出力先パスは`exports`関数を使用して定義されます。この関数はオブジェクトを受け入れ、それをスタブの出力状態としてエクスポートします。後で、コードモッドAPIはこのオブジェクトを使用して指定された場所にファイルを作成します。

```js
{{#var entity = generators.createEntity('user')}}
{{#var modelName = generators.modelName(entity.name)}}
{{#var modelReference = string.toCamelCase(modelName)}}
// insert-start
{{#var resourceFileName = string(modelName).snakeCase().suffix('_resource').ext('.ts').toString()}}
{{{
  exports({
    to: app.makePath('app/api_resources', entity.path, resourceFileName)
  })
}}}
// insert-end
export default class {{ modelName }}Resource {
  serialize({{ modelReference }}: {{ modelName }}) {
    return {{ modelReference }}.toJSON()
  }
}
```

### コマンドを介したエンティティ名の受け入れ
現時点では、スタブ内でエンティティ名を`user`としてハードコーディングしています。ただし、コマンド引数として受け入れ、テンプレートの状態としてスタブと共有する必要があります。

```ts
import { BaseCommand, args } from '@adonisjs/core/ace'

export default class MakeApiResource extends BaseCommand {
  // insert-start
  @args.string({
    description: 'The name of the resource'
  })
  declare name: string
  // insert-end

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(STUBS_ROOT, 'api_resource.stub', {
      // insert-start
      name: this.name,
      // insert-end
    })
  }
}
```

```js
// delete-start
{{#var entity = generators.createEntity('user')}}
// delete-end
// insert-start
{{#var entity = generators.createEntity(name)}}
// insert-end
{{#var modelName = generators.modelName(entity.name)}}
{{#var modelReference = string.toCamelCase(modelName)}}
{{#var resourceFileName = string(modelName).snakeCase().suffix('_resource').ext('.ts').toString()}}
{{{
  exports({
    to: app.makePath('app/api_resources', entity.path, resourceFileName)
  })
}}}
export default class {{ modelName }}Resource {
  serialize({{ modelReference }}: {{ modelName }}) {
    return {{ modelReference }}.toJSON()
  }
}
```

### グローバル変数
次のグローバル変数は常にスタブと共有されます。

| 変数名         | 説明                                                                                                                                                                |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `app`          | [applicationクラス](./application.md)のインスタンスへの参照。                                                                                                           |
| `generators`   | [generatorsモジュール](https://github.com/adonisjs/application/blob/main/src/generators.ts)への参照。                                                             |
| `randomString` | [randomString](../references/helpers.md#random)ヘルパー関数への参照。                                                                                             |
| `string`       | [string builder](../references/helpers.md#string-builder)インスタンスを作成するための関数。文字列に変換を適用するために文字列ビルダーを使用できます。 |
| `flags`        | Aceコマンドを実行する際に定義されるコマンドラインフラグ。                                                                                                            |


## スタブのeject
`node ace eject`コマンドを使用して、AdonisJSアプリケーション内にスタブをeject（コピー）できます。ejectコマンドは、元のスタブファイルまたはその親ディレクトリへのパスを受け入れ、テンプレートをプロジェクトのルートの`stubs`ディレクトリにコピーします。

次の例では、`@adonisjs/core`パッケージから`make/controller/main.stub`ファイルをコピーします。

```sh
node ace eject make/controller/main.stub
```

スタブファイルを開くと、次の内容が含まれているはずです。

```js
{{#var controllerName = generators.controllerName(entity.name)}}
{{#var controllerFileName = generators.controllerFileName(entity.name)}}
{{{
  exports({
    to: app.httpControllersPath(entity.path, controllerFileName)
  })
}}}
// import type { HttpContext } from '@adonisjs/core/http'

export default class {{ controllerName }} {
}
```

- 最初の2行では、[generatorsモジュール](https://github.com/adonisjs/application/blob/main/src/generators.ts)を使用してコントローラクラス名とコントローラファイル名を生成しています。
- 3行から7行では、`exports`関数を使用して[出力先パス](#cliフラグを使用してスタブの出力先をカスタマイズする)を定義しています。
- 最後に、scaffoldingされたコントローラの内容を定義しています。

スタブを変更しても問題ありません。次回、`make:controller`コマンドを実行すると変更が反映されます。

### ディレクトリのeject

`eject`コマンドを使用して、スタブのディレクトリ全体をeject（コピー）できます。ディレクトリへのパスを渡すと、コマンドはディレクトリ全体をコピーします。

```sh
# makeスタブをすべて公開する
node ace eject make

# make:controllerスタブをすべて公開する
node ace eject make/controller
```

### CLIフラグを使用してスタブの出力先をカスタマイズする
すべてのscaffoldingコマンドは、スタブテンプレートと共にCLIフラグ（サポートされていないフラグも含む）を共有します。したがって、カスタムワークフローや出力先の変更に使用できます。

次の例では、`--feature`フラグを使用して、指定したfeaturesディレクトリ内にコントローラを作成します。

```sh
node ace make:controller invoice --feature=billing
```

```js
// title: コントローラスタブ
{{#var controllerName = generators.controllerName(entity.name)}}
// insert-start
{{#var featureDirectoryName = generators.makePath('features', flags.feature)}}
// insert-end
{{#var controllerFileName = generators.controllerFileName(entity.name)}}
{{{
  exports({
    // delete-start
    to: app.httpControllersPath(entity.path, controllerFileName)
    // delete-end
    // insert-start
    to: app.makePath(featureDirectoryName, entity.path, controllerFileName)
    // insert-end
  })
}}}
// import type { HttpContext } from '@adonisjs/core/http'

export default class {{ controllerName }} {
}
```

### 他のパッケージからのスタブのeject

デフォルトでは、`eject`コマンドは`@adonisjs/core`パッケージからテンプレートをコピーします。ただし、`--pkg`フラグを使用して他のパッケージからスタブをコピーすることもできます。

```sh
node ace eject make/migration/main.stub --pkg=@adonisjs/lucid
```

### どのスタブをコピーするかを見つける方法
パッケージのスタブは、そのGitHubリポジトリを訪れることで見つけることができます。すべてのスタブは、パッケージのルートレベルに`stubs`ディレクトリ内に保存されています。

## スタブの実行フロー
`makeUsingStub`メソッドを介してスタブを見つけて実行するフローを以下に示します。

![](./scaffolding_workflow.png)

## コードモッドAPI
コードモッドAPIは、[ts-morph](https://github.com/dsherret/ts-morph)によって提供され、開発中にのみ利用できます。`command.createCodemods`メソッドを使用して、コードモッドモジュールを遅延初期化できます。`createCodemods`メソッドは、[Codemods](https://github.com/adonisjs/core/blob/main/modules/ace/codemods.ts)クラスのインスタンスを返します。

```ts
import type Configure from '@adonisjs/core/commands/configure'

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()
}
```

### defineEnvValidations
環境変数のバリデーションルールを定義します。このメソッドは、変数のキーと値のペアを受け入れます。`key`は環境変数の名前であり、`value`はバリデーション式の文字列です。

:::note
このコードモッドは、`start/env.ts`ファイルが存在し、`export default await Env.create`メソッド呼び出しがあることを前提としています。

また、このコードモッドは、既存の環境変数のバリデーションルールを上書きしません。これは、アプリ内の変更を尊重するためです。
:::

```ts
const codemods = await command.createCodemods()

try {
  await codemods.defineEnvValidations({
    leadingComment: 'アプリの環境変数',
    variables: {
      PORT: 'Env.schema.number()',
      HOST: 'Env.schema.string()',
    }
  })
} catch (error) {
  console.error('環境変数のバリデーションを定義できませんでした')
  console.error(error)
}
```

```ts
// title: 出力
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  /**
   * アプリの環境変数
   */
  PORT: Env.schema.number(),
  HOST: Env.schema.string(),
})
```

### defineEnvVariables
`.env`ファイルと`.env.example`ファイルに1つまたは複数の新しい環境変数を追加します。このメソッドは、変数のキーと値のペアを受け入れます。

```ts
const codemods = await command.createCodemods()

try {
  await codemods.defineEnvVariables({
    MY_NEW_VARIABLE: 'some-value',
    MY_OTHER_VARIABLE: 'other-value'
  })
} catch (error) {
  console.error('環境変数を定義できませんでした')
  console.error(error)
}
```

場合によっては、`.env.example`ファイルに変数の値を挿入したくない場合があります。`omitFromExample`オプションを使用することで、そのような場合に対応できます。

```ts
const codemods = await command.createCodemods()

await codemods.defineEnvVariables({
  MY_NEW_VARIABLE: 'SOME_VALUE',
}, {
  omitFromExample: ['MY_NEW_VARIABLE']
})
```

上記のコードは、`.env`ファイルに`MY_NEW_VARIABLE=SOME_VALUE`を挿入し、`.env.example`ファイルに`MY_NEW_VARIABLE=`を挿入します。

### registerMiddleware
AdonisJSのミドルウェアを既知のミドルウェアスタックの1つに登録します。このメソッドは、ミドルウェアスタックと登録するミドルウェアの配列を受け入れます。

ミドルウェアスタックは、`server | router | named`のいずれかです。

:::note
このコードモッドは、`start/kernel.ts`ファイルが存在し、登録しようとしているミドルウェアのミドルウェアスタックのための関数呼び出しがあることを前提としています。
:::

```ts
const codemods = await command.createCodemods()

try {
  await codemods.registerMiddleware('router', [
    {
      path: '@adonisjs/core/bodyparser_middleware'
    }
  ])
} catch (error) {
  console.error('ミドルウェアを登録できませんでした')
  console.error(error)
}
```

```ts
// title: 出力
import router from '@adonisjs/core/services/router'

router.use([
  () => import('@adonisjs/core/bodyparser_middleware')
])
```

名前付きミドルウェアを次のように定義することもできます。

```ts
const codemods = await command.createCodemods()

try {
  await codemods.registerMiddleware('named', [
    {
      name: 'auth',
      path: '@adonisjs/auth/auth_middleware'
    }
  ])
} catch (error) {
  console.error('ミドルウェアを登録できませんでした')
  console.error(error)
}
```

### updateRcFile
`adonisrc.ts`ファイルに`providers`、`commands`、`metaFiles`、`commandAliases`を登録します。

:::note
このコードモッドは、`adonisrc.ts`ファイルが存在し、`export default defineConfig`関数呼び出しがあることを前提としています。
:::

```ts
const codemods = await command.createCodemods()

try {
  await codemods.updateRcFile((rcFile) => {
    rcFile
      .addProvider('@adonisjs/lucid/db_provider')
      .addCommand('@adonisjs/lucid/commands'),
      .setCommandAlias('migrate', 'migration:run')
  })
} catch (error) {
  console.error('adonisrc.tsファイルを更新できませんでした')
  console.error(error)  
}
```

```ts
// title: 出力
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  commands: [
    () => import('@adonisjs/lucid/commands')
  ],
  providers: [
    () => import('@adonisjs/lucid/db_provider')
  ],
  commandAliases: {
    migrate: 'migration:run'
  }
})
```

### registerJapaPlugin
Japaプラグインを`tests/bootstrap.ts`ファイルに登録します。

:::note
このコードモッドは、`tests/bootstrap.ts`ファイルが存在し、`export const plugins: Config['plugins']`がエクスポートされていることを前提としています。
:::

```ts
const codemods = await command.createCodemods()

const imports = [
  {
    isNamed: false,
    module: '@adonisjs/core/services/app',
    identifier: 'app'
  },
  {
    isNamed: true,
    module: '@adonisjs/session/plugins/api_client',
    identifier: 'sessionApiClient'
  }
]
const pluginUsage = 'sessionApiClient(app)'

try {
  await codemods.registerJapaPlugin(pluginUsage, imports)
} catch (error) {
  console.error('Japaプラグインを登録できませんでした')
  console.error(error)
}
```

```ts
// title: 出力
import app from '@adonisjs/core/services/app'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'

export const plugins: Config['plugins'] = [
  sessionApiClient(app)
]
```

### registerPolicies
AdonisJSのバウンサーポリシーを`app/policies/main.ts`ファイルから`policies`オブジェクトのリストに登録します。

:::note
このコードモッドは、`app/policies/main.ts`ファイルが存在し、そこから`policies`オブジェクトがエクスポートされていることを前提としています。
:::

```ts
const codemods = await command.createCodemods()

try {
  await codemods.registerPolicies([
    {
      name: 'PostPolicy',
      path: '#policies/post_policy'
    }
  ])
} catch (error) {
  console.error('ポリシーを登録できませんでした')
  console.error(error)
}
```

```ts
// title: 出力
export const policies = {
  PostPolicy: () => import('#policies/post_policy')
}
```

### registerVitePlugin

Viteプラグインを`vite.config.ts`ファイルに登録します。

:::note
このコードモッドは、`vite.config.ts`ファイルが存在し、`export default defineConfig`関数呼び出しがあることを前提としています。
:::

```ts
const transformer = new CodeTransformer(appRoot)
const imports = [
  {
    isNamed: false,
    module: '@vitejs/plugin-vue',
    identifier: 'vue'
  },
]
const pluginUsage = 'vue({ jsx: true })'

try {
  await transformer.addVitePlugin(pluginUsage, imports)
} catch (error) {
  console.error('Viteプラグインを登録できませんでした')
  console.error(error)
}
```

```ts
// title: 出力
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({ jsx: true })
  ]
})
```

### installPackages

ユーザーのプロジェクトで検出されたパッケージマネージャーを使用して、1つまたは複数のパッケージをインストールします。

```ts
const codemods = await command.createCodemods()

try {
  await codemods.installPackages([
    { name: 'vinejs', isDevDependency: false },
    { name: 'edge', isDevDependency: false }
  ])
} catch (error) {
  console.error('パッケージをインストールできませんでした')
  console.error(error)
}
```

### getTsMorphProject

`getTsMorphProject`メソッドは、`ts-morph`のインスタンスを返します。これは、Codemods APIではカバーされていないカスタムなファイル変換を実行したい場合に便利です。

```ts
const project = await codemods.getTsMorphProject()

project.getSourceFileOrThrow('start/routes.ts')
```

利用可能なAPIについては、[ts-morphのドキュメント](https://ts-morph.com/)を参照してください。
