---
summary: Japaを使用してAdonisJSでテストを書き、実行する方法を学びます。
---

# テスト

AdonisJSにはテストを書くための組み込みサポートがあります。追加のパッケージをインストールしたり、アプリケーションをテストの準備のために設定する必要はありません - すべての重要な作業はすでに完了しています。

次のaceコマンドを使用してアプリケーションのテストを実行できます。

```sh
node ace test
```

テストは`tests`ディレクトリに格納され、さらにタイプごとにテストが整理されています。たとえば、機能テストは`tests/functional`ディレクトリに格納され、ユニットテストは`tests/unit`ディレクトリに格納されます。

機能テストは、実際のHTTPリクエストを使用してアプリケーションをテストし、特定のフローやエンドポイントの機能をテストします。たとえば、ユーザーの作成に関する機能テストのコレクションがあるかもしれません。

一部のコミュニティでは、機能テストをフィーチャーテストまたはエンドツーエンドテストと呼ぶこともあります。AdonisJSでは、それらをどのように呼ぶかについて柔軟です。私たちは「機能テスト」という用語を採用することにしました。

## テストランナーの設定

AdonisJSは、テストの作成と実行に[Japa](https://japa.dev/docs)を使用しています。そのため、Japaのドキュメントを読んでAPIと設定オプションをよりよく理解することをお勧めします。

### スイート

テストスイートは`adonisrc.ts`ファイルで定義されます。デフォルトでは、`functional`と`unit`のテストスイートが登録されています。必要に応じて、既存のスイートを削除してから新しく作成することができます。

```ts
{
  tests: {
    suites: [
      {
        name: 'functional',
        files: ['tests/functional/**/*.spec.(js|ts)']
      },
      {
        name: 'unit',
        files: ['tests/unit/**/*.spec.(js|ts)']
      }
    ]
  }
}
```

- スイートは、スイートの一意の名前とファイルのグロブパターンを組み合わせたものです。
- 特定のスイートのテストを実行すると、そのスイートに関連するファイルのみがインポートされます。

`tests/bootstrap.ts`ファイルで定義された`configureSuite`フックを使用して、実行時にスイートを設定することもできます。たとえば、機能テストを実行するときに、スイートレベルのフックを登録してHTTPサーバーを起動することができます。

```ts
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
```

### ランナーフック

ランナーフックは、すべてのテストの前後に実行されるグローバルなアクションです。フックは`tests/boostrap.ts`ファイル内の`runnerHooks`プロパティを使用して定義されます。

```ts
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => {
      console.log('running before all the tests')
    }
  ],
  teardown: [
    () => {
      console.log('running after all the tests')
    }
  ],
}
```

### プラグイン

Japaには機能を拡張するためのプラグインシステムがあります。プラグインは`tests/bootstrap.ts`ファイルに登録されます。

参考: [Japaプラグインの作成](https://japa.dev/docs/creating-plugins)

```ts
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app)
]
```

### レポーター

レポーターは、テストの進行状況を報告/表示するために使用されます。レポーターは`tests/bootstrap.ts`ファイルに登録されます。

参考: [Japaレポーターの作成](https://japa.dev/docs/creating-reporters)

```ts
export const reporters: Config['reporters'] = {
  activated: ['spec']
}
```

## テストの作成

`make:test`コマンドを使用して新しいテストを作成できます。コマンドにはスイートの名前が必要です。

参考: [テスト作成コマンド](../references/commands.md#maketest)

```sh
node ace make:test posts/create --suite=functional
```

ファイルは`files`グロブプロパティで設定されたディレクトリ内に作成されます。

## テストの記述

テストは`@japa/runner`パッケージからインポートされた`test`メソッドを使用して定義されます。テストは、最初のパラメータとしてタイトル、2番目のパラメータとして実装のコールバックを受け入れます。

次の例では、新しいユーザーアカウントを作成し、[`assert`](https://japa.dev/docs/plugins/assert)オブジェクトを使用してパスワードが正しくハッシュ化されていることを確認しています。

```ts
import { test } from '@japa/runner'

import User from '#models/User'
import hash from '@adonisjs/core/services/hash'

test('新しいユーザーを作成するときにユーザーパスワードをハッシュ化する', async ({ assert }) => {
  const user = new User()
  user.password = 'secret'
  
  await user.save()
  
  assert.isTrue(hash.isValidHash(user.password))
  assert.isTrue(await hash.verify(user.password, 'secret'))
})
```

### テストグループの使用

テストグループは`test.group`メソッドを使用して作成されます。グループはテストに構造を追加し、テストの周りで[lifecycle hooks](https://japa.dev/docs/lifecycle-hooks)を実行することができます。

前の例を続けて、パスワードのハッシュ化テストをグループ内に移動させましょう。

```ts
import { test } from '@japa/runner'

import User from '#models/User'
import hash from '@adonisjs/core/services/hash'

// highlight-start
test.group('ユーザーの作成', () => {
// highlight-end
  test('ユーザーパスワードをハッシュ化する', async ({ assert }) => {
    const user = new User()
    user.password = 'secret'
    
    await user.save()
    
    assert.isTrue(hash.isValidHash(user.password))
    assert.isTrue(await hash.verify(user.password, 'secret'))
  })
// highlight-start
})
// highlight-end
```

気づいたかもしれませんが、テストタイトルから「新しいユーザーを作成するとき」のフラグメントを削除しました。これは、グループのタイトルがこのグループのすべてのテストが「新しいユーザーの作成」に関連していることを明確にしているためです。

### ライフサイクルフック

ライフサイクルフックは、テストの周りでアクションを実行するために使用されます。フックは`group`オブジェクトを使用して定義することができます。

参考 - [ライフサイクルフックのJapaドキュメント](https://japa.dev/docs/lifecycle-hooks)

```ts
test.group('ユーザーの作成', (group) => {
  // highlight-start
  group.each.setup(async () => {
    console.log('すべてのテストの前に実行されます')
  })

  group.each.teardown(async () => {
    console.log('すべてのテストの後に実行されます')
  })

  group.setup(async () => {
    console.log('すべてのテストの前に一度だけ実行されます')
  })

  group.teardown(async () => {
    console.log('すべてのテストの後に一度だけ実行されます')
  })
  // highlight-end

  test('ユーザーパスワードをハッシュ化する', async ({ assert }) => {
    const user = new User()
    user.password = 'secret'
    
    await user.save()
    
    assert.isTrue(hash.isValidHash(user.password))
    assert.isTrue(await hash.verify(user.password, 'secret'))
  })
})
```

### 次のステップ

テストの作成と記述の基本を学んだので、Japaドキュメントで以下のトピックを探索することをお勧めします。

- [`test`関数のAPIの詳細](https://japa.dev/docs/underlying-test-class)
- 非同期コードを効果的にテストする方法の学習](https://japa.dev/docs/testing-async-code)
- 繰り返しテストを避けるためのデータセットの使用](https://japa.dev/docs/datasets)

## テストの実行

`test`コマンドを使用してテストを実行できます。デフォルトでは、すべてのスイートのテストが実行されます。ただし、名前を渡すことで特定のスイートのテストを実行することもできます。

```sh
node ace test
```

```sh
node ace test functional
node ace test unit
```

### ファイルの変更を監視してテストを再実行する

`--watch`コマンドを使用してファイルシステムを監視し、テストを再実行することができます。テストファイルが変更された場合、変更されたファイル内のテストが実行されます。それ以外の場合は、すべてのテストが再実行されます。

```sh
node ace test --watch
```

### テストのフィルタリング

テストを実行する際にコマンドラインフラグを使用してフィルタを適用することができます。以下に利用可能なオプションのリストを示します。

参考: [Japaテストのフィルタリングガイド](https://japa.dev/docs/filtering-tests)

:::tip

**VSCodeを使用していますか？** キーボードショートカットやアクティビティサイドバーを使用して、コードエディタ内で選択したテストを実行するために[Japa拡張機能](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode)を使用できます。

:::

| フラグ         | 説明                                                                                                                                                                                            |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--tests`    | テストタイトルでテストをフィルタリングします。このフィルタは、完全なテストタイトルに一致します。                                                                                                                       |
| `--files`    | テストファイル名の一部でテストをフィルタリングします。マッチは、`.spec.ts`を除いたファイル名の末尾で行われます。ワイルドカード式を使用して、完全なフォルダのテストを実行することもできます。 `folder/*` |
| `--groups`   | グループ名でテストをフィルタリングします。このフィルタは、完全なグループ名に一致します。                                                                                                                           |
| `--tags`     | タグでテストをフィルタリングします。タグ名の前にチルダ`~`を付けると、指定したタグを持つテストを無視します。                                                                                                    |
| `--matchAll` | デフォルトでは、Japaは指定されたタグに一致するテストを実行します。すべてのタグを一致させたい場合は、`--matchAll`フラグを使用します。                                                                  |

### テストの強制終了

Japaは、すべてのテストが完了した後、プロセスが正常にシャットダウンするのを待ちます。正常なシャットダウンプロセスとは、すべての長寿命の接続を終了し、Node.jsのイベントループを空にすることを意味します。

必要に応じて、`--force-exit`フラグを使用してJapaにプロセスを終了させ、正常なシャットダウンを待たないようにすることができます。

```sh
node ace test --force-exit
```

### テストのリトライ
`--retries`フラグを使用して、複数回の失敗したテストをリトライすることができます。このフラグは、テストレベルで明示的なリトライ回数が定義されていないすべてのテストに適用されます。

```sh
# 失敗したテストを2回リトライする
node ace test --retries=2
```

### 前回の実行からの失敗したテストの実行
`--failed`コマンドラインフラグを使用して、前回の実行から失敗したテストを再実行することができます。

```sh
node ace test --failed
```

### レポーターの切り替え
Japaでは、複数のテストレポーターを設定ファイルに登録することができますが、デフォルトではそれらはアクティブ化されません。レポーターをアクティブ化するには、設定ファイル内または`--reporter`コマンドラインフラグを使用します。

```sh
# specレポーターをアクティブ化する
node ace test --reporter=spec

# specとjsonレポーターをアクティブ化する
node ace test --reporter=spec,json
```

設定ファイル内でもレポーターをアクティブ化することができます。

```ts
export const reporters: Config['reporters'] = {
  activated: ['spec', 'json']
}
```

### Node.jsコマンドラインにオプションを渡す
`test`コマンドは、`(bin/test.ts file)`を子プロセスとして実行します。子プロセスに[node引数](https://nodejs.org/api/cli.html#options)を渡す場合は、コマンド名の前にそれらを定義することができます。

```sh
node ace --no-warnings --trace-exit test
```

## 環境変数

テスト中に必要な環境変数を定義するために、`.env.test`ファイルを使用することができます。`.env`ファイル内の値よりも`.env.test`内の値が優先されます。

テスト中の`SESSION_DRIVER`は`memory`に設定する必要があります。

```dotenv
// title: .env.test
SESSION_DRIVER=memory
```
