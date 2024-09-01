---
summary: Lucid ORMのクイックな概要。Knexをベースに構築されたSQLクエリビルダーおよびActive Record ORM。
---

# Lucid ORM

Lucidは、AdonisJSコアチームによって作成およびメンテナンスされている、Knexをベースに構築されたSQLクエリビルダーおよびActive Record ORMです。LucidはSQLを最大限に活用し、多くの高度なSQL操作に対してクリーンなAPIを提供することを目指しています。

:::note
Lucidのドキュメントは[https://lucid.adonisjs.com](https://lucid.adonisjs.com)で利用できます。
:::

## Lucidの利点

以下は、選りすぐりのLucidの特徴です。

- Knexをベースにした流暢なクエリビルダー。
- 読み書き可能なレプリカと複数の接続管理のサポート。
- 関連、シリアライズ、フックの処理を含む、アクティブレコードパターンに準拠したクラスベースのモデル。
- マイグレーションシステムによるデータベーススキーマの変更。
- テスト用のフェイクデータを生成するためのモデルファクトリ。
- データベースに初期/ダミーデータを挿入するためのデータベースシーダ。

これらに加えて、AdonisJSアプリケーション内でLucidを使用する理由として、以下の点が挙げられます。

- LucidはAuthパッケージとバリデータとの間で一流の統合を提供しています。そのため、これらの統合を自分で書く必要はありません。

- Lucidは、`api`と`web`のスターターキットと共に事前に設定されており、アプリケーションのスタートに役立ちます。

- Lucidの主な目標の1つは、SQLを最大限に活用し、**ウィンドウ関数**、**再帰CTE**、**JSON操作**、**行ベースのロック**など、多くの高度なSQL操作をサポートすることです。

- LucidとKnexは長年にわたって存在しています。そのため、他の新しいORMと比較して、成熟しており、実戦での使用に耐えています。

ただし、AdonisJSはLucidの使用を強制しません。パッケージをアンインストールし、お好みのORMをインストールできます。

## インストール

次のコマンドを使用して、Lucidをインストールおよび設定します。

```sh
node ace add @adonisjs/lucid
```

:::disclosure{title="configureコマンドによって実行される手順を参照"}

1. `adonisrc.ts`ファイル内に以下のサービスプロバイダを登録します。

   ```ts
   {
     providers: [
       // ...other providers
       () => import('@adonisjs/lucid/database_provider'),
     ]
   }
   ```

2. `adonisrc.ts`ファイル内に以下のコマンドを登録します。

   ```ts
   {
     commands: [
       // ...other commands
       () => import('@adonisjs/lucid/commands'),
     ]
   }
   ```

3. `config/database.ts`ファイルを作成します。

4. 選択した方言の環境変数とそのバリデーションを定義します。

5. 必要なピア依存関係をインストールします。

:::


## 最初のモデルの作成

設定が完了したら、次のコマンドを使用して最初のモデルを作成できます。

```sh
node ace make:model User
```

このコマンドは、`app/models`ディレクトリ内に新しいファイルを作成し、以下の内容を含めます。

```ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

モデルについての詳細は、[公式ドキュメント](https://lucid.adonisjs.com/docs/models)を参照してください。

## マイグレーション

マイグレーションは、増分の変更セットを使用してデータベースのスキーマとデータを変更する方法です。次のコマンドを使用して新しいマイグレーションを作成できます。

```sh
node ace make:migration users
```

このコマンドは、`database/migrations`ディレクトリ内に新しいファイルを作成し、以下の内容を含めます。

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

次のコマンドを使用して、保留中のすべてのマイグレーションを実行できます。

```sh
node ace migration:run
```

マイグレーションについての詳細は、[公式ドキュメント](https://lucid.adonisjs.com/docs/migrations)を参照してください。

## クエリビルダー

Lucidには、Knexをベースにした流暢なクエリビルダーが付属しています。クエリビルダーを使用してデータベース上でCRUD操作を実行できます。

```ts
import db from '@adonisjs/lucid/services/db'

/**
 * クエリビルダーインスタンスを作成します
 */
const query = db.query()

/**
 * クエリビルダーインスタンスを作成し、テーブルも選択します
 */
const queryWithTableSelection = db.from('users')
```

クエリビルダーは、モデルインスタンスにスコープを設定することもできます。

```ts
import User from '#models/user'

const user = await User.query().where('username', 'rlanz').first()
```

クエリビルダーについての詳細は、[公式ドキュメント](https://lucid.adonisjs.com/docs/select-query-builder)を参照してください。

## CRUD操作

Lucidモデルには、データベース上でCRUD操作を実行するための組み込みメソッドがあります。

```ts
import User from '#models/user'

/**
 * 新しいユーザーを作成します
 */
const user = await User.create({
  username: 'rlanz',
  email: 'romain@adonisjs.com',
})

/**
 * プライマリキーでユーザーを検索します
 */
const user = await User.find(1)

/**
 * ユーザーを更新します
 */

const user = await User.find(1)
user.username = 'romain'
await user.save()

/**
 * ユーザーを削除します
 */
const user = await User.find(1)
await user.delete()
```

CRUD操作についての詳細は、[公式ドキュメント](https://lucid.adonisjs.com/docs/crud-operations)を参照してください。

## 詳細情報

- [Lucidドキュメント](https://lucid.adonisjs.com)
- [インストールと使用方法](https://lucid.adonisjs.com/docs/installation)
- [CRUD操作](https://lucid.adonisjs.com/docs/crud-operations)
- [モデルフック](https://lucid.adonisjs.com/docs/model-hooks)
- [リレーション](https://lucid.adonisjs.com/docs/relationships)
- [Adocasts Lucidシリーズ](https://adocasts.com/topics/lucid)
