---
summary: AdonisJSでのテスト中に依存関係をモックまたはフェイクする方法を学びます。
---

# モックとフェイク

アプリケーションをテストする際、実際の実装を実行しないように特定の依存関係をモックまたはフェイクしたい場合があります。たとえば、テストを実行する際に顧客にメールを送信したり、決済ゲートウェイのようなサードパーティのサービスを呼び出したりしたくない場合です。

AdonisJSでは、依存関係をフェイク、モック、またはスタブするためのいくつかの異なるAPIと推奨事項を提供しています。

## フェイクAPIの使用

フェイクは、テスト用に明示的に作成された動作する実装を持つオブジェクトです。たとえば、AdonisJSのメーラーモジュールには、テスト中に出力されるメールをメモリに収集し、それらにアサーションを書くために使用できるフェイク実装があります。

以下のコンテナサービスに対してフェイク実装を提供しています。フェイクAPIの詳細は、モジュールのドキュメントと一緒にドキュメント化されています。

- [イベントフェイク](../digging_deeper/emitter.md#faking-events-during-tests)
- [ハッシュフェイク](../security/hashing.md#faking-hash-service-during-tests)
- [フェイクメーラー](../digging_deeper/mail.md#fake-mailer)
- [ディスクフェイク](../digging_deeper/drive.md#faking-disks)

## 依存関係の注入とフェイク

アプリケーションで依存関係の注入を使用するか、[コンテナを使用してクラスのインスタンスを作成](../concepts/dependency_injection.md)する場合、`container.swap`メソッドを使用してクラスのフェイク実装を提供できます。

次の例では、`UserService`を`UsersController`に注入しています。

```ts
import UserService from '#services/user_service'
import { inject } from '@adonisjs/core'

export default class UsersController {
  @inject()
  index(service: UserService) {}
}
```

テスト中には、`UserService`クラスの代替/フェイク実装を次のように提供できます。

```ts
import UserService from '#services/user_service'
import app from '@adonisjs/core/services/app'

test('全てのユーザーを取得する', async () => {
  // ハイライト-スタート
  class FakeService extends UserService {
    all() {
      return [{ id: 1, username: 'virk' }]
    }
  }
  
  /**
   * `UserService`を`FakeService`のインスタンスに置き換える
   */  
  app.container.swap(UserService, () => {
    return new FakeService()
  })
  
  /**
   * テストロジックをここに記述
   */
  // ハイライト-エンド
})
```

テストが完了したら、`container.restore`メソッドを使用してフェイクを元に戻す必要があります。

```ts
app.container.restore(UserService)

// 全てを元に戻す
app.container.restore()
```

## Sinon.jsを使用したモックとスタブ

[Sinon](https://sinonjs.org/#get-started)は、Node.jsエコシステムで成熟した、時間をかけてテストされたモッキングライブラリです。モックとスタブを頻繁に使用する場合は、TypeScriptとの互換性が高いSinonをオススメします。

## ネットワークリクエストのモック

アプリケーションがサードパーティのサービスに対して出力HTTPリクエストを行う場合、テスト中に[nock](https://github.com/nock/nock)を使用してネットワークリクエストをモックできます。

nockは、[Node.jsのHTTPモジュール](https://nodejs.org/dist/latest-v20.x/docs/api/http.html#class-httpclientrequest)からのすべての出力リクエストをインターセプトするため、`got`、`axios`などのほとんどのサードパーティライブラリと動作します。

## 時間の凍結
テストの作成時に時間を凍結または移動するために、[timekeeper](https://www.npmjs.com/package/timekeeper)パッケージを使用できます。timekeeperパッケージは、`Date`クラスをモックすることで動作します。

次の例では、`timekeeper`のAPIを[Japaテストリソース](https://japa.dev/docs/test-resources)内にカプセル化しています。

```ts
import { getActiveTest } from '@japa/runner'
import timekeeper from 'timekeeper'

export function timeTravel(secondsToTravel: number) {
  const test = getActiveTest()
  if (!test) {
    throw new Error('Japaテストの外部で"timeTravel"を使用することはできません')
  }

  timekeeper.reset()

  const date = new Date()
  date.setSeconds(date.getSeconds() + secondsToTravel)
  timekeeper.travel(date)

  test.cleanup(() => {
    timekeeper.reset()
  })
}
```

テスト内で`timeTravel`メソッドを以下のように使用できます。

```ts
import { timeTravel } from '#test_helpers'

test('2時間後にトークンが期限切れになる', async ({ assert }) => {
  /**
   * 未来に3時間進む
   */
  timeTravel(60 * 60 * 3)
})
```
