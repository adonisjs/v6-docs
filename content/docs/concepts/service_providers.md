---
summary: サービスプロバイダは、アプリケーションのさまざまなフェーズでアクションを実行するためのライフサイクルメソッドを持つプレーンなJavaScriptクラスです。
---

# サービスプロバイダ

サービスプロバイダは、アプリケーションのさまざまなフェーズでアクションを実行するためのライフサイクルメソッドを持つプレーンなJavaScriptクラスです。

サービスプロバイダは、[コンテナにバインディングを登録](../concepts/dependency_injection.md#container-bindings)したり、既存のバインディングを拡張したり、HTTPサーバーの起動後にアクションを実行したりできます。

サービスプロバイダは、AdonisJSアプリケーションのエントリーポイントであり、アプリケーションが準備完了と見なされる前にアプリケーションの状態を変更する能力を持っています。

プロバイダは、`adonisrc.ts`ファイルの`providers`配列内に登録されます。値はサービスプロバイダを遅延インポートするための関数です。

```ts
{
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('./providers/app_provider.js'),
  ]
}
```

デフォルトでは、プロバイダはすべてのランタイム環境でロードされます。ただし、特定の環境でのみプロバイダを実行することもできます。

```ts
{
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    {
      file: () => import('./providers/app_provider.js'),
      environment: ['web', 'repl']
    }
  ]
}
```

## サービスプロバイダの作成

サービスプロバイダは、アプリの`providers`ディレクトリ内に格納されます。または、`node ace make:provider app`コマンドを使用することもできます。

プロバイダモジュールは、プロバイダクラスを返す`export default`ステートメントを持つ必要があります。クラスのコンストラクタは、[Application](./application.md)クラスのインスタンスを受け取ります。

参照: [プロバイダ作成コマンド](../references/commands.md#makeprovider)

```ts
import { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {
  }
}
```

以下は、さまざまなアクションを実行するために実装できるライフサイクルメソッドです。

```ts
export default class AppProvider {
  register() {
  }
  
  async boot() {
  }
  
  async start() {
  }
  
  async ready() {
  }
  
  async shutdown() {
  }
}
```

### register

`register`メソッドは、プロバイダクラスのインスタンスが作成された後に呼び出されます。`register`メソッドでは、IoCコンテナ内にバインディングを登録できます。

`register`メソッドは同期的なので、このメソッド内ではPromiseを使用することはできません。

```ts
export default class AppProvider {
  register() {
    this.app.container.bind('db', () => {
      return new Database()
    })
  }
}
```

### boot

`boot`メソッドは、すべてのバインディングがIoCコンテナに登録された後に呼び出されます。このメソッド内では、コンテナからバインディングを解決して拡張/変更できます。

```ts
export default class AppProvider {
  async boot() {
   const validator = await this.app.container.make('validator')
    
   // カスタムのバリデーションルールを追加
   validator.rule('foo', () => {})
  }
}
```

バインディングがコンテナから解決されたときにバインディングを拡張するのは良い習慣です。たとえば、バリデータにカスタムルールを追加するために`resolving`フックを使用できます。

```ts
async boot() {
  this.app.container.resolving('validator', (validator) => {
    validator.rule('foo', () => {})
  })
}
```

### start

`start`メソッドは、`boot`メソッドの後および`ready`メソッドの前に呼び出されます。`ready`フックアクションで必要なアクションを実行できます。

### ready

`ready`メソッドは、アプリケーションの環境に基づいて異なるステージで呼び出されます。

<table>
    <tr>
        <td width="100"><code> web </code></td>
        <td><code>ready</code>メソッドは、HTTPサーバーが起動してリクエストを受け付ける準備ができた後に呼び出されます。</td>
    </tr>
    <tr>
        <td width="100"><code>console</code></td>
        <td><code>ready</code>メソッドは、メインコマンドの<code>run</code>メソッドの直前に呼び出されます。</td>
    </tr>
    <tr>
        <td width="100"><code>test</code></td>
        <td><code>ready</code>メソッドは、すべてのテストを実行する直前に呼び出されます。ただし、テストファイルは<code>ready</code>メソッドよりも前にインポートされます。</td>
    </tr>
    <tr>
        <td width="100"><code>repl</code></td>
        <td><code>ready</code>メソッドは、REPLプロンプトがターミナル上に表示される前に呼び出されます。</td>
    </tr>
</table>

```ts
export default class AppProvider {
  async start() {
    if (this.app.getEnvironment() === 'web') {
    }

    if (this.app.getEnvironment() === 'console') {
    }

    if (this.app.getEnvironment() === 'test') {
    }

    if (this.app.getEnvironment() === 'repl') {
    }
  }
}
```

### shutdown

`shutdown`メソッドは、AdonisJSがアプリケーションを正常に終了している最中に呼び出されます。

アプリケーションの終了イベントは、アプリが実行されている環境とアプリケーションプロセスの開始方法によって異なります。詳細については、[アプリケーションライフサイクルガイド](./application_lifecycle.md)を参照してください。

```ts
export default class AppProvider {
  async shutdown() {
    // クリーンアップを実行する
  }
}
```
