---
summary: ローカルファイルシステムやS3、GCS、R2、Digital Ocean Spacesなどのクラウドストレージサービスでユーザーがアップロードしたファイルを管理します。ベンダーロックインなしで利用できます。
---

# Drive

AdonisJS Drive (`@adonisjs/drive`) は [flydrive.dev](https://flydrive.dev/) の上に構築された軽量なラッパーライブラリです。FlyDriveはNode.jsのファイルストレージライブラリです。ローカルファイルシステムやS3、R2、GCSなどのクラウドストレージソリューションと統一されたAPIを提供します。

FlyDriveを使用することで、コードを1行も変更することなく、さまざまなクラウドストレージサービス（ローカルファイルシステムを含む）でユーザーがアップロードしたファイルを管理できます。

## インストール

以下のコマンドを使用して `@adonisjs/drive` パッケージをインストールし、設定します:

```sh
node ace add @adonisjs/drive
```

:::disclosure{title="addコマンドによって実行されるステップを参照"}

1. 検出されたパッケージマネージャを使用して `@adonisjs/drive` パッケージをインストールします。

2. `adonisrc.ts` ファイル内に以下のサービスプロバイダを登録します。

   ```ts
   {
     providers: [
       // ...other providers
       () => import('@adonisjs/drive/drive_provider'),
     ]
   }
   ```

3. `config/drive.ts` ファイルを作成します。

4. 選択したストレージサービスのための環境変数を定義します。

5. 選択したストレージサービスの必要なピア依存関係をインストールします。

:::

## 設定

`@adonisjs/drive` パッケージの設定は `config/drive.ts` ファイルに保存されます。1つの設定ファイル内で複数のサービスの設定を定義できます。

参照: [Config stub](https://github.com/adonisjs/drive/blob/main/stubs/config/drive.stub)

```ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  services: {
    /**
     * ローカルファイルシステムにファイルを保存します
     */
    fs: services.fs({
      location: app.makePath('storage'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),

    /**
     * Digital Ocean Spaces にファイルを保存します
     */
    spaces: services.s3({
      credentials: {
        accessKeyId: env.get('SPACES_KEY'),
        secretAccessKey: env.get('SPACES_SECRET'),
      },
      region: env.get('SPACES_REGION'),
      bucket: env.get('SPACES_BUCKET'),
      endpoint: env.get('SPACES_ENDPOINT'),
      visibility: 'public',
    }),
  },
})

export default driveConfig
```

### 環境変数

ストレージサービスの認証情報や設定は、`.env` ファイル内の環境変数として保存されます。Driveを使用する前に値を更新してください。

また、`DRIVE_DISK` 環境変数はファイルを管理するためのデフォルトのディスク/サービスを定義します。たとえば、開発環境では `fs` ディスクを使用し、本番環境では `spaces` ディスクを使用できます。

## 使用法

Driveを設定した後、`drive`サービスをインポートしてそのAPIとやり取りできます。以下の例では、Driveを使用してファイルのアップロード操作を処理しています。

:::note

AdonisJSの統合はFlyDriveのシンプルなラッパーです。APIをより理解するためには、[FlyDrive ドキュメント](https://flydrive.dev)を読むことをオススメします。

:::

```ts
import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import router from '@adonisjs/core/services/router'

router.put('/me', async ({ request, response }) => {
  /**
   * ステップ1: リクエストから画像を取得し、基本的なバリデーションを行います
   */
  const image = request.file('avatar', {
    size: '2mb',
    extnames: ['jpeg', 'jpg', 'png'],
  })
  if (!image) {
    return response.badRequest({ error: '画像がありません' })
  }

  /**
   * ステップ2: Drive を使用して一意の名前で画像を移動します
   */
  const key = `uploads/${cuid()}.${image.extname}`
  // highlight-start
  await image.moveToDisk(key)
  // highlight-end

  /**
   * ファイルの公開URLを返します
   */
  return {
    message: '画像がアップロードされました',
    // highlight-start
    url: await drive.use().getUrl(key),
    // highlight-end
  }
})
```

- Driveパッケージは[MultipartFile](https://github.com/adonisjs/drive/blob/develop/providers/drive_provider.ts#L110) に `moveToDisk` メソッドを追加します。このメソッドはファイルを `tmpPath` から設定されたストレージプロバイダにコピーします。

- `drive.use().getUrl()` メソッドはファイルの公開URLを返します。プライベートファイルの場合は、`getSignedUrl` メソッドを使用する必要があります。

## Drive サービス

`@adonisjs/drive/services/main` パスからエクスポートされるDriveサービスは、`config/drive.ts` ファイルからエクスポートされた設定を使用して作成された [DriveManager](https://flydrive.dev/docs/drive_manager) クラスのシングルトンインスタンスです。

このサービスをインポートしてDriveManagerと設定されたファイルストレージサービスとやり取りできます。例:

```ts
import drive from '@adonisjs/drive/services/main'

drive instanceof DriveManager // true

/**
 * デフォルトディスクのインスタンスを返します
 */
const disk = drive.use()

/**
 * 名前付きディスクのインスタンスを返します
 */
const disk = drive.use('r2')

/**
 * 名前付きディスクのインスタンスを返します
 */
const disk = drive.use('spaces')
```

Diskのインスタンスを取得したら、それを使用してファイルを管理できます。

参照: [Disk API](https://flydrive.dev/docs/disk_api)

```ts
await disk.put(key, value)
await disk.putStream(key, readableStream)

await disk.get(key)
await disk.getStream(key)
await disk.getArrayBuffer(key)

await disk.delete(key)
await disk.deleteAll(prefix)

await disk.copy(source, destination)
await disk.move(source, destination)

await disk.copyFromFs(source, destination)
await disk.moveFromFs(source, destination)
```

## ローカルファイルシステムドライバ

AdonisJSの統合はFlyDriveのローカルファイルシステムドライバを拡張し、URLの生成とAdonisJSのHTTPサーバーを使用してファイルを提供する機能を追加します。

以下は、ファイルシステムドライバを設定するために使用できるオプションのリストです。

```ts
{
  services: {
    fs: services.fs({
      location: app.makePath('storage'),
      visibility: 'public',

      appUrl: env.get('APP_URL'),
      serveFiles: true,
      routeBasePath: '/uploads',
    }),
  }
}
```

<dl>

<dt>

location

<dt>

<dd>

`location` プロパティは、ファイルを保存するストアを定義します。このディレクトリは `.gitignore` に追加する必要があります。これにより、開発中にアップロードされたファイルが本番サーバーにプッシュされないようになります。

</dd>

<dt>

visibility

<dt>

<dd>

`visibility` プロパティは、ファイルを公開または非公開にするために使用されます。非公開ファイルは署名付きURLを使用してのみアクセスできます。[詳細](https://flydrive.dev/docs/disk_api#getsignedurl)を参照してください。

</dd>

<dt>

serveFiles

<dt>

<dd>

`serveFiles` オプションは、ローカルファイルシステムからファイルを提供するためのルートを自動的に登録します。このルートは [list\:routes](../references/commands.md#listroutes) ace コマンドを使用して表示できます。

</dd>

<dt>

routeBasePath

<dt>

<dd>

`routeBasePath` オプションは、ファイルを提供するためのルートのベースプレフィックスを定義します。ベースプレフィックスが一意であることを確認してください。

</dd>

<dt>

appUrl

<dt>

<dd>

`appUrl` プロパティをオプションで定義すると、アプリケーションの完全なドメイン名を使用してURLを作成できます。それ以外の場合は相対URLが作成されます。

</dd>


</dl>

## Edge ヘルパー
Edge テンプレート内では、次のヘルパーメソッドのいずれかを使用してURLを生成できます。どちらのメソッドも非同期ですので、`await` を使用してください。

```edge
<img src="{{ await driveUrl(user.avatar) }}" />

<!-- 名前付きディスクのためのURLを生成します -->
<img src="{{ await driveUrl(user.avatar, 's3') }}" />
<img src="{{ await driveUrl(user.avatar, 'r2') }}" />
```

```edge
<a href="{{ await driveSignedUrl(invoice.key) }}">
  請求書をダウンロード
</a>

<!-- 名前付きディスクのためのURLを生成します -->
<a href="{{ await driveSignedUrl(invoice.key, 's3') }}">
  請求書をダウンロード
</a>

<!-- 署名付きオプションを使用してURLを生成します -->
<a href="{{ await driveSignedUrl(invoice.key, {
  expiresIn: '30 mins',
}) }}">
  請求書をダウンロード
</a>
```

## MultipartFile ヘルパー
DriveはBodyparserの [MultipartFile](https://github.com/adonisjs/drive/blob/develop/providers/drive_provider.ts#L110) クラスを拡張し、`moveToDisk` メソッドを追加します。このメソッドはファイルを `tmpPath` から設定されたストレージプロバイダにコピーします。

```ts
const image = request.file('image')!

const key = 'user-1-avatar.png'

/**
 * デフォルトディスクにファイルを移動します
 */
await image.moveToDisk(key)

/**
 * 名前付きディスクにファイルを移動します
 */
await image.moveToDisk(key, 's3')

/**
 * 移動操作中に追加のプロパティを定義します
 */
await image.moveToDisk(key, 's3', {
  contentType: 'image/png',
})
```

## テスト中のディスクのフェイク
テスト中にリモートストレージとのやり取りを防ぐために、Drive のフェイクAPIを使用できます。フェイクモードでは、`drive.use()` メソッドはフェイクディスク（ローカルファイルシステムをバックエンドとする）を返し、すべてのファイルはアプリケーションのルートディレクトリの `./tmp/drive-fakes` ディレクトリに書き込まれます。

これらのファイルは、`drive.restore` メソッドを使用してフェイクを復元すると自動的に削除されます。

参照: [FlyDrive フェイクドキュメント](https://flydrive.dev/docs/drive_manager#using-fakes)

```ts
// title: tests/functional/users/update.spec.ts
import { test } from '@japa/runner'
import drive from '@adonisjs/drive/services/main'
import fileGenerator from '@poppinss/file-generator'

test.group('Users | update', () => {
  test('自分のアバターを更新できること', async ({ client, cleanup }) => {
    /**
     * "spaces" ディスクをフェイクし、テストが終了したらフェイクを復元します
     */
    const fakeDisk = drive.fake('spaces')
    cleanup(() => drive.restore('spaces'))

    /**
     * ログインと更新を行うためのユーザーを作成します
     */
    const user = await UserFactory.create()

    /**
     * 1MB のサイズのフェイクなメモリ内 PNG ファイルを生成します
     */
    const { contents, mime, name } = await fileGenerator.generatePng('1mb')

    /**
     * ファイルを送信するための put リクエストを作成します
     */
    await client
      .put('me')
      .file('avatar', contents, {
        filename: name,
        contentType: mime,
      })
      .loginAs(user)

    /**
     * ファイルが存在することをアサートします
     */
    fakeDisk.assertExists(user.avatar)
  })
})
```
