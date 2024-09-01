---
summary: "AdonisJSでデータベースとのやり取りをテストする方法を学びましょう：テスト中にデータベースをセットアップ、リセット、クリーンに保つための簡単な手順。"
---

# データベースのテスト

データベースのテストとは、アプリケーションがデータベースとやり取りする方法をテストすることを指します。これには、データベースに書き込まれる内容のテスト、テストの前にマイグレーションを実行する方法、テスト間でデータベースをクリーンに保つ方法などが含まれます。

## データベースのマイグレーション

データベースとやり取りするテストを実行する前に、まずマイグレーションを実行する必要があります。これには、`tests/bootstrap.ts`ファイル内で設定できる`testUtils`サービスの2つのフックがあります。

### テスト実行後にデータベースをリセット

最初のオプションは`testUtils.db().migrate()`です。このフックは、まずすべてのマイグレーションを実行し、その後すべてをロールバックします。

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().migrate(),
  ],
  teardown: [],
}
```

ここでフックを設定すると、次のようなことが起こります。

- テストを実行する前に、マイグレーションが実行されます。
- テストの最後に、データベースがロールバックされます。

したがって、テストを実行するたびに、新しい空のデータベースが得られます。

### テスト実行後にテーブルを切り捨てる

テスト実行後にデータベースをリセットするのは良いオプションですが、マイグレーションが多い場合は遅くなる可能性があります。もう1つのオプションは、テスト実行後にテーブルを切り捨てることです。このオプションは、マイグレーションが最初に実行されるときにのみ実行されるため、速くなります。

実行後、テーブルは切り捨てられますが、スキーマは保持されます。したがって、次にテストを実行するときには空のデータベースが得られますが、スキーマはすでに存在しているため、すべてのマイグレーションを再実行する必要はありません。

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().truncate(),
  ],
}
```

## データベースのシーディング

データベースにシードを追加する必要がある場合は、`testUtils.db().seed()`フックを使用できます。このフックは、テストを実行する前にすべてのシードを実行します。

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().seed(),
  ],
}
```

## テスト間でデータベースをクリーンに保つ

### グローバルトランザクション

テストを実行する際に、各テストの間でデータベースをクリーンに保ちたい場合は、`testUtils.db().withGlobalTransaction()`フックを使用できます。このフックは、各テストの前にトランザクションを開始し、テストの終わりにロールバックします。

```ts
// title: tests/unit/user.spec.ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('User', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
})
```

なお、テスト対象のコードでトランザクションを使用している場合、これは動作しません。トランザクションはネストできないためです。この場合は、代わりに`testUtils.db().migrate()`または`testUtils.db().truncate()`フックを使用できます。

### テーブルを切り捨てる

前述のように、テスト対象のコードでトランザクションを使用している場合、グローバルトランザクションは機能しません。この場合は、`testUtils.db().truncate()`フックを使用できます。このフックは、各テストの後にすべてのテーブルを切り捨てます。

```ts
// title: tests/unit/user.spec.ts
import { test } from '@japa/runner'

test.group('User', (group) => {
  group.each.setup(() => testUtils.db().truncate())
})
```
