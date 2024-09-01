---
summary: アセンブラフックは、アセンブラライフサイクルの特定のポイントでコードを実行する方法です。
---

# アセンブラフック

アセンブラフックは、アセンブラライフサイクルの特定のポイントでコードを実行する方法です。アセンブラーは、AdonisJSの一部であり、開発サーバーの起動、アプリケーションのビルド、テストの実行を可能にします。

これらのフックは、ファイルの生成、コードのコンパイル、カスタムビルドステップの注入などのタスクに役立ちます。

たとえば、`@adonisjs/vite`パッケージは、`onBuildStarting`フックを使用して、フロントエンドのアセットがビルドされるステップを注入します。したがって、`node ace build`を実行すると、`@adonisjs/vite`パッケージは、ビルドプロセスの残りの部分よりも前にフロントエンドのアセットをビルドします。これは、フックを使用してビルドプロセスをカスタマイズする方法の良い例です。

## フックの追加

アセンブラフックは、`adonisrc.ts`ファイルの`hooks`キーで定義されます：

```ts
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  hooks: {
    onBuildCompleted: [
      () => import('my-package/hooks/on_build_completed')
    ],
    onBuildStarting: [
      () => import('my-package/hooks/on_build_starting')
    ],
    onDevServerStarted: [
      () => import('my-package/hooks/on_dev_server_started')
    ],
    onSourceFileChanged: [
      () => import('my-package/hooks/on_source_file_changed')
    ],
  },
})
```

アセンブラライフサイクルの各ステージに対して複数のフックを定義できます。各フックは、実行する関数の配列です。

フックを読み込むためには、動的インポートを使用することをオススメします。これにより、フックが不必要に読み込まれることなく、必要な時にのみ読み込まれます。フックコードを`adonisrc.ts`ファイルに直接書くと、アプリケーションの起動が遅くなる可能性があります。

## フックの作成

フックは単純な関数です。カスタムビルドタスクを実行するフックの例を見てみましょう。

```ts
// title: hooks/on_build_starting.ts
import type { AssemblerHookHandler } from '@adonisjs/core/types/app'

const buildHook: AssemblerHookHandler = async ({ logger }) => {
  logger.info('ファイルを生成しています...')

  await myCustomLogic()
}

export default buildHook
```

フックはデフォルトでエクスポートする必要があることに注意してください。

このフックが定義されたら、`adonisrc.ts`ファイルに次のように追加するだけです：

```ts
// title: adonisrc.ts
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  hooks: {
    onBuildStarting: [
      () => import('./hooks/on_build_starting')
    ],
  },
})
```

これで、`node ace build`を実行するたびに、定義したカスタムロジックを持つ`onBuildStarting`フックが実行されます。

## フックの一覧

利用可能なフックの一覧は次のとおりです：

### onBuildStarting

このフックはビルドが開始される前に実行されます。ファイルの生成やカスタムビルドステップの注入などのタスクに役立ちます。

### onBuildCompleted

このフックはビルドが完了した後に実行されます。ビルドプロセスをカスタマイズするためにも使用できます。

### onDevServerStarted

このフックはAdonisの開発サーバーが起動した後に実行されます。

### onSourceFileChanged

このフックは、`tsconfig.json`で指定されたソースファイルが変更されるたびに実行されます。変更されたファイルのパスが引数としてフックに渡されます。
