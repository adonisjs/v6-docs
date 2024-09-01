---
summary: AdonisJSアプリケーションでのSQLライブラリとORMの利用可能なオプション。
---

# SQLとORM

SQLデータベースは、アプリケーションのデータを永続的なストレージに保存するためによく使われます。AdonisJSアプリケーション内でSQLクエリを実行するために、任意のライブラリやORMを使用できます。

:::note
AdonisJSコアチームは[Lucid ORM](./lucid.md)を開発しましたが、強制的に使用することはありません。AdonisJSアプリケーション内で他のSQLライブラリやORMを使用することもできます。
:::

## 人気のあるオプション

以下は、AdonisJSアプリケーション内で他の人気のあるSQLライブラリやORMを使用することができるリストです（他のNode.jsアプリケーションと同様です）。

- [**Lucid**](./lucid.md)は、[Knex](https://knexjs.org)をベースにしたSQLクエリビルダーおよび**Active Record ORM**で、AdonisJSコアチームによって作成およびメンテナンスされています。
- [**Prisma**](https://prisma.io/orm)は、Node.jsエコシステムで人気のある別のORMです。大規模なコミュニティがあります。直感的なデータモデル、自動マイグレーション、型安全性、自動補完を提供します。
- [**Kysely**](https://kysely.dev/docs/getting-started)は、Node.js向けのエンドツーエンドのタイプセーフなクエリビルダーです。モデルなしでスリムなクエリビルダーが必要な場合には、Kyselyが適しています。[AdonisJSアプリケーション内でKyselyを統合する方法について説明した記事](https://adonisjs.com/blog/kysely-with-adonisjs)もあります。
- [**Drizzle ORM**](https://orm.drizzle.team/)は、多くのAdonisJS開発者によって使用されています。私たちはこのORMを使用した経験はありませんが、あなたのユースケースに適しているかどうかを確認するためにチェックしてみる価値があります。
- [**Mikro ORM**](https://mikro-orm.io/docs/guide/first-entity)は、Node.jsエコシステムで評価が低いORMです。MikroORMはLucidに比べてやや冗長ですが、積極的にメンテナンスされており、Knexをベースにしています。
