---
summary: おすすめのフロントエンドフレームワークを使用して、AdonisJSとInertiaを組み合わせてサーバーレンダリングアプリケーションを作成する方法を学びます。
---

# Inertia

[Inertia](https://inertiajs.com/)は、モダンなSPAの複雑さを排除しつつ、フレームワークに依存しない方法でシングルページアプリケーションを作成するための手段です。

したがって、テンプレートエンジンを使用した従来のサーバーレンダリングアプリケーションと、クライアントサイドのルーティングと状態管理を備えたモダンなSPAの中間地点となります。

Inertiaを使用することで、お気に入りのフロントエンドフレームワーク（Vue.js、React、Svelte、またはSolid.js）でSPAを作成できますが、別個のAPIを作成する必要はありません。

:::codegroup

```ts
// title: app/controllers/users_controller.ts
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index({ inertia }: HttpContext) {
    const users = await User.all()

    return inertia.render('users/index', { users })
  }
}
```


```vue
// title: inertia/pages/users/index.vue
<script setup lang="ts">
import { Link, Head } from '@inertiajs/vue3'

defineProps<{
  users: SerializedUser[]
}>()
</script>

<template>
  <Head title="ユーザー" />

  <div v-for="user in users" :key="user.id">
    <Link :href="`/users/${user.id}`">
      {{ user.name }}
    </Link>
    <div>{{ user.email }}</div>
  </div>
</template>
```

:::


## インストール

:::note
新しいプロジェクトを開始し、Inertiaを使用したい場合は、[Inertiaスターターキット](https://docs.adonisjs.com/guides/getting-started/installation#inertia-starter-kit)をチェックしてください。
:::

npmレジストリからパッケージをインストールするには、次のコマンドを実行します。

:::codegroup

```sh
// title: npm
npm i @adonisjs/inertia
```

:::

完了したら、次のコマンドを実行してパッケージを設定します。

```sh
node ace configure @adonisjs/inertia
```

:::disclosure{title="configureコマンドで実行されるステップを参照"}

1. `adonisrc.ts`ファイル内に以下のサービスプロバイダとコマンドを登録します。

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/inertia/inertia_provider')
      ]
    }
    ```
2. `start/kernel.ts`ファイル内に以下のミドルウェアを登録します。

   ```ts
   router.use([() => import('@adonisjs/inertia/inertia_middleware')])
   ```

3. `config/inertia.ts`ファイルを作成します。

4. アプリケーションを素早く開始するために、いくつかのスタブファイルをアプリケーションにコピーします。コピーされる各ファイルは、事前に選択したフロントエンドフレームワークに適応されます。

  1. `./resources/views/inertia_layout.edge`ファイルを作成し、Inertiaの起動に使用されるHTMLページをレンダリングします。

  2. `./inertia/css/app.css`ファイルを作成し、`inertia_layout.edge`ビューのスタイルに必要なコンテンツを追加します。

  3. `./inertia/tsconfig.json`ファイルを作成し、サーバーサイドとクライアントサイドのTypeScriptの設定を区別します。

  4. Inertiaとフロントエンドフレームワークをブートストラップするための`./inertia/app/app.ts`を作成します。

  5. `./inertia/pages/home.{tsx|vue|svelte}`ファイルを作成し、アプリケーションのホームページをレンダリングします。

  6. `./inertia/pages/server_error.{tsx|vue|svelte}`および`./inertia/pages/not_found.{tsx|vue|svelte}`ファイルを作成し、エラーページをレンダリングします。

  7. `vite.config.ts`ファイルに正しいViteプラグインを追加します。

  8. `start/routes.ts`ファイルに`/`のダミールートを追加し、Inertiaを使用してホームページをレンダリングします。
 
5. 選択したフロントエンドフレームワークに基づいてパッケージをインストールします。

:::

これで、AdonisJSアプリケーションでInertiaを使用する準備が整いました。開発サーバーを起動し、`localhost:3333`にアクセスして、選択したフロントエンドフレームワークを使用してInertiaでレンダリングされたホームページを表示できます。

:::note
**[Inertia公式ドキュメント](https://inertiajs.com/)**をお読みください。

Inertiaはバックエンドに依存しないライブラリです。AdonisJSで動作するようにアダプターを作成しました。このドキュメントでは、Inertiaの特定の部分について説明します。
:::

## クライアントサイドのエントリーポイント

`configure`コマンドまたは`add`コマンドを使用した場合、パッケージは`inertia/app/app.ts`にエントリーポイントファイルを作成します。そのため、このステップはスキップできます。 

基本的に、このファイルはInertiaアプリケーションを作成し、ページコンポーネントを解決するために使用されます。`inertia.render`を使用するときに作成したページコンポーネントは、`resolve`関数に渡され、この関数の役割はレンダリングする必要のあるコンポーネントを返すことです。

:::codegroup

```ts
// title: Vue
import { createApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  title: (title) => {{ `${title} - ${appName}` }},
  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.vue`,
      import.meta.glob<DefineComponent>('./pages/**/*.vue'),
    )
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
})
```

```tsx
// title: React
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
    )
  },

  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
});
```

```ts
// title: Svelte
import { createInertiaApp } from '@inertiajs/svelte'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.svelte`,
      import.meta.glob('./pages/**/*.svelte'),
    )
  },

  setup({ el, App, props }) {
    new App({ target: el, props })
  },
})
```

```ts
// title: Solid
import { render } from 'solid-js/web'
import { createInertiaApp } from 'inertia-adapter-solid'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
    )
  },

  setup({ el, App, props }) {
    render(() => <App {...props} />, el)
  },
})
```
:::

The role of this file is to create an Inertia app and to resolve the page component. The page component you write when using `inertia.render` will be passed down the the `resolve` function and the role of this function is to return the component that need to be rendered.

## ページのレンダリング

パッケージの設定中に、`start/kernel.ts`ファイル内に`inertia_middleware`が登録されています。このミドルウェアは、[`HttpContext`](../concepts/http_context.md)上の`inertia`オブジェクトを設定するための役割を果たします。

Inertiaを使用してビューをレンダリングするには、`inertia.render`メソッドを使用します。このメソッドは、ビュー名とコンポーネントに渡すデータ（プロップ）を受け取ります。

```ts
// title: app/controllers/home_controller.ts
export default class HomeController {
  async index({ inertia }: HttpContext) {
    // highlight-start
    return inertia.render('home', { user: { name: 'julien' } })
    // highlight-end
  }
}
```

`inertia.render`メソッドに渡される`home`は、`inertia/pages`ディレクトリに対するコンポーネントファイルのパスである必要があります。ここでは、`inertia/pages/home.(vue,tsx)`ファイルをレンダリングしています。

フロントエンドコンポーネントは、`user`オブジェクトをプロップとして受け取ります。

:::codegroup

```vue
// title: Vue
<script setup lang="ts">
defineProps<{
  user: { name: string }
}>()
</script>

<template>
  <p>Hello {{ user.name }}</p>
</template>
```

```tsx
// title: React
export default function Home(props: { user: { name: string } }) {
  return <p>Hello {props.user.name}</p>
}
```

```svelte
// title: Svelte
<script lang="ts">
export let user: { name: string }
</script>

<Layout>
  <p>Hello {user.name}</p>
</Layout>
```

```jsx
// title: Solid
export default function Home(props: { user: { name: string } }) {
  return <p>Hello {props.user.name}</p>
}
```

:::

これで完了です。

:::warning
フロントエンドにデータを渡す際、すべてのデータはJSONにシリアライズされます。モデルのインスタンス、日付、その他の複雑なオブジェクトを渡すことはできません。
:::

### ルートEdgeテンプレート

ルートテンプレートは、通常のEdgeテンプレートであり、最初のページ訪問時に読み込まれます。CSSやJavaScriptファイルを含める場所であり、`@inertia`タグも含める場所です。典型的なルートテンプレートは次のようになります。

:::codegroup

```edge
// title: Vue
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @inertiaHead()
  @vite(['inertia/app/app.ts', `inertia/pages/${page.component}.vue`])
</head>

<body>
  @inertia()
</body>

</html>
```

```edge
// title: React
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @inertiaHead()
  @viteReactRefresh()
  @vite(['inertia/app/app.tsx', `inertia/pages/${page.component}.tsx`])
</head>

<body>
  @inertia()
</body>

</html>
```

```edge
// title: Svelte
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @inertiaHead()
  @vite(['inertia/app/app.ts', `inertia/pages/${page.component}.svelte`])
</head>

<body>
  @inertia()
</body>

</html>
```

```edge
// title: Solid
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>AdonisJS x Inertia</title>

  @inertiaHead()
  @vite(['inertia/app/app.tsx', `inertia/pages/${page.component}.tsx`])
</head>

<body>
  @inertia()
</body>

</html>
```


:::

`config/inertia.ts`ファイルでルートテンプレートのパスを設定する必要があります。デフォルトでは、テンプレートは`resources/views/inertia_layout.edge`にあると想定されています。

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  // The path to the root template relative 
  // to the `resources/views` directory
  rootView: 'app_root', 
})
```

必要に応じて、`rootView`プロパティに関数を渡して、動的に使用するルートテンプレートを決定することもできます。

```ts
import { defineConfig } from '@adonisjs/inertia'
import type { HttpContext } from '@adonisjs/core/http'

export default defineConfig({
  rootView: ({ request }: HttpContext) => {
    if (request.url().startsWith('/admin')) {
      return 'admin_root'
    }

    return 'app_root'
  }
})
```

### ルートテンプレートデータ

ルートEdgeテンプレートとデータを共有する場合は、次のように行います。メタタイトルやオープングラフタグを追加するために、ルートテンプレートとデータを共有する必要がある場合があります。これを行うには、`inertia.render`メソッドの3番目の引数を使用します。

```ts
// title: app/controllers/posts_controller.ts
export default class PostsController {
  async index({ inertia }: HttpContext) {
    return inertia.render('posts/details', post, {
      // highlight-start
      title: post.title,
      description: post.description
      // highlight-end
    })
  }
}
```

`title`と`description`は、ルートEdgeテンプレートで使用できるようになります。

```edge
// title: resources/views/root.edge
<html>
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">

  <body>
    @inertia()
  </body>
</html
```

## リダイレクト

リダイレクトを行う場合は、次のようにします。

```ts
export default class UsersController {
  async store({ response }: HttpContext) {
    await User.create(request.body())

    // 👇 標準のAdonisJSのリダイレクトを使用できます
    return response.redirect().toRoute('users.index')
  }

  async externalRedirect({ inertia }: HttpContext) {
    // 👇 または、inertia.locationを使用して外部リダイレクトを行うこともできます
    return inertia.location('https://adonisjs.com')
  }
}
```

詳細については、[公式ドキュメント](https://inertiajs.com/redirects)を参照してください。

## すべてのビューでデータを共有する

複数のビューで同じデータを共有する必要がある場合があります。たとえば、現在のユーザー情報をすべてのビューで共有する必要がある場合があります。各コントローラでこれを行うのは手間がかかる場合があります。幸いなことに、この問題に対してはいくつかの解決策があります。

### `sharedData` 

`config/inertia.ts`ファイルで`sharedData`オブジェクトを定義できます。このオブジェクトは、すべてのビューで共有するデータを定義するために使用できます。

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  sharedData: {
    // 👇 すべてのビューで使用できます
    appName: 'My App' ,
    // 👇 現在のリクエストに対してスコープが限定されます
    user: (ctx) => ctx.auth?.user, 
    // 👇 現在のリクエストに対してスコープが限定されます
    errors: (ctx) => ctx.session.flashMessages.get('errors'),
  },
})
```

### ミドルウェアから共有

ミドルウェアからデータを共有する方が便利な場合もあります。`inertia.share`メソッドを使用してデータを共有できます。

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class MyMiddleware {
  async handle({ inertia, auth }: HttpContext, next: NextFn) {
    inertia.share({
      appName: 'My App',
      user: (ctx) => ctx.auth?.user
    })
  }
}
```

## 部分的な再読み込みと遅延データ評価

部分的な再読み込みとは何か、そしてそれがどのように機能するかを理解するために、[公式ドキュメント](https://inertiajs.com/partial-reloads)を最初に読んでください。

AdonisJSにおける遅延データ評価については、次のように機能します：

```ts
export default class UsersController {
  async index({ inertia }: HttpContext) {
    return inertia.render('users/index', {
      // 最初の訪問時には常に含まれます。
      // 部分的な再読み込み時にオプションで含まれます。
      // 常に評価されます。
      users: await User.all(),

      // 最初の訪問時には常に含まれます。
      // 部分的な再読み込み時にオプションで含まれます。
      // 必要な時にのみ評価されます。
      users: () => User.all(),

      // 最初の訪問時には含まれません。
      // 部分的な再読み込み時にオプションで含まれます。
      // 必要な時にのみ評価されます。
      users: inertia.lazy(() => User.all())
    }),
  }
}
```

## タイプの共有

通常、フロントエンドのページコンポーネントに渡すデータのタイプを共有したいと思うでしょう。これを行うための簡単な方法は、`InferPageProps`型を使用することです。

:::codegroup

```ts
// title: app/controllers/users_controller.ts
export class UsersController {
  index() {
    return inertia.render('users/index', {
      users: [
        { id: 1, name: 'julien' },
        { id: 2, name: 'virk' },
        { id: 3, name: 'romain' },
      ]
    })
  }
}
```

```tsx
// title: inertia/pages/users/index.tsx
import { InferPageProps } from '@adonisjs/inertia/types'
import type { UsersController } from '../../controllers/users_controller.ts'

export function UsersPage(
  // 👇 これにより、コントローラでinertia.renderに渡した内容に基づいて正しく型付けされます
  props: InferPageProps<UsersController, 'index'>
) {
  return (
    // ...
  )
}
```

:::

Vueを使用している場合、`defineProps`で各プロパティを手動で定義する必要があります。これはVueの面倒な制限です。詳細については、[このissue](https://github.com/vitejs/vite-plugin-vue/issues/167)を参照してください。

```vue
<script setup lang="ts">
import { InferPageProps } from '@adonisjs/inertia'

defineProps<{
  // 👇 各プロパティを手動で定義する必要があります
  users: InferPageProps<UsersController, 'index'>['users'],
  posts: InferPageProps<PostsController, 'index'>['posts'],
}>()

</script>
```


### リファレンスディレクティブ

Inertiaアプリケーションは、独自のTypeScriptプロジェクト（独自の`tsconfig.json`を持つ）であるため、TypeScriptに特定の型を理解させるためにリファレンスディレクティブを使用する必要があります。公式パッケージの多くは、モジュール拡張を使用してAdonisJSプロジェクトに特定の型を追加します。

たとえば、`HttpContext`の`auth`プロパティとその型は、`@adonisjs/auth/initialize_auth_middleware`をプロジェクトにインポートすることでのみ利用できます。ただし、Inertiaプロジェクトではこのモジュールをインポートしていないため、`auth`を使用するコントローラからページプロップスを推論しようとすると、TypeScriptエラーまたは無効な型が返される可能性があります。

この問題を解決するには、リファレンスディレクティブを使用してTypeScriptに特定の型を理解させる必要があります。これを行うには、`inertia/app/app.ts`ファイルに次の行を追加します。

```ts
/// <reference path="../../adonisrc.ts" />
```

使用する型に応じて、モジュール拡張を使用する他の参照ディレクティブを追加する必要がある場合もあります。これには、モジュール拡張を使用する特定の設定ファイルへの参照も含まれます。

```ts
/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/ally.ts" />
/// <reference path="../../config/auth.ts" />
```

### 型レベルのシリアライズ

`InferPageProps`について重要なことは、渡したデータが型レベルでシリアライズされるということです。たとえば、`Date`オブジェクトを`inertia.render`に渡すと、`InferPageProps`からの結果の型は`string`になります。

:::codegroup

```ts
// title: app/controllers/users_controller.ts
export default class UsersController {
  async index({ inertia }: HttpContext) {
    const users = [
      { id: 1, name: 'John Doe', createdAt: new Date() }
    ]

    return inertia.render('users/index', { users })
  }
}
```

```tsx
// title: inertia/pages/users/index.tsx
import type { InferPageProps } from '@adonisjs/inertia/types'

export function UsersPage(
  props: InferPageProps<UsersController, 'index'>
) {
  props.users
  //     ^? { id: number, name: string, createdAt: string }[]
}
```

:::

これは、日付がJSONでネットワーク経由で送信される際に文字列にシリアライズされるため、完全に理にかなっています。

### モデルのシリアライズ

前述のポイントを念頭に置いて、もう1つ重要なことは、AdonisJSモデルを`inertia.render`に渡すと、`InferPageProps`からの結果の型が`ModelObject`になることです。これは、ほとんど情報を含まない型です。これは問題です。この問題を解決するためには、いくつかのオプションがあります。

- `inertia.render`に渡す前にモデルを単純なオブジェクトにキャストする。
- モデルを単純なオブジェクトに変換するためのDTO（データ転送オブジェクト）システムを使用する。

:::codegroup

```ts
// title: キャスト
class UsersController {
  async edit({ inertia, params }: HttpContext) {
    const user = users.serialize() as {
        id: number
        name: string 
    }

    return inertia.render('user/edit', { user })
  }
}
```

```ts
// title: DTO
class UserDto {
  constructor(private user: User) {}

  toJson() {
    return {
      id: this.user.id,
      name: this.user.name
    }
  }
}

class UsersController {
  async edit({ inertia, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return inertia.render('user/edit', { user: new UserDto(user).toJson() })
  }
}
```

:::

これで、フロントエンドコンポーネントで正確な型を使用できるようになります。

### 共有プロパティ

コンポーネント内で[共有データ](#sharing-data-with-all-views)の型を使用するには、`config/inertia.ts`ファイルでモジュール拡張を行っていることを確認してください。

```ts
// file: config/inertia.ts
const inertiaConfig = defineConfig({
  sharedData: {
    appName: 'My App',
  },
});

export default inertiaConfig;

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {
    // 必要に応じて、ミドルウェアから共有されるプロパティなど、いくつかの共有プロパティを手動で追加することもできます
    propsSharedFromAMiddleware: number;
  }
}
```

また、`inertia/app/app.ts`ファイルにこの[リファレンスディレクティブ](#reference-directives)を追加することも忘れないでください。

```ts
/// <reference path="../../config/inertia.ts" />
```

これが完了すると、コンポーネント内で共有プロパティにアクセスできるようになります。`InferPageProps`には、共有プロパティの型と`inertia.render`で渡されるプロパティの型が含まれます。

```tsx
// file: inertia/pages/users/index.tsx

import type { InferPageProps } from '@adonisjs/inertia/types'

export function UsersPage(
  props: InferPageProps<UsersController, 'index'>
) {
  props.appName
  //     ^? string
  props.propsSharedFromAMiddleware
  //     ^? number
}
```

必要に応じて、`SharedProps`型を使用して共有プロパティの型のみにアクセスすることもできます。

```tsx
import type { SharedProps } from '@adonisjs/inertia/types'

const page = usePage<SharedProps>()
```

## CSRF

アプリケーションで[CSRF保護](../security/securing_ssr_applications.md#csrf-protection)を有効にした場合は、`config/shield.ts`ファイルで`enableXsrfCookie`オプションを有効にする必要があります。

このオプションを有効にすると、`XSRF-TOKEN`クッキーがクライアント側に設定され、すべてのリクエストと共にサーバーに送信されるようになります。

InertiaとCSRF保護を連携させるためには、追加の設定は必要ありません。

## アセットのバージョニング

アプリケーションを再デプロイする際に、ユーザーは常に最新バージョンのクライアントサイドアセットを取得する必要があります。これは、InertiaプロトコルとAdonisJSでデフォルトでサポートされている機能です。

デフォルトでは、`@adonisjs/inertia`パッケージは`public/assets/manifest.json`ファイルのハッシュを計算し、それをアセットのバージョンとして使用します。

この動作をカスタマイズする場合は、`config/inertia.ts`ファイルを編集します。`version`プロパティはアセットのバージョンを定義し、文字列または関数のいずれかを指定できます。

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  version: 'v1'
})
```

詳細については、[公式ドキュメント](https://inertiajs.com/asset-versioning)を参照してください。

## SSR

### SSRの有効化

[Inertia Starter Kit](../getting_started/installation.md#starter-kits)には、サーバーサイドレンダリング（SSR）のサポートがデフォルトで組み込まれています。したがって、アプリケーションでSSRを有効にする場合は、それを使用するようにしてください。

SSRを有効にしていないでアプリケーションを開始した場合でも、以下の手順にしたがって後から有効にできます。

#### サーバーエントリーポイントの追加

まず、クライアントエントリーポイントと非常に似たサーバーエントリーポイントを追加する必要があります。このエントリーポイントは、最初のページ訪問をサーバー上でレンダリングし、ブラウザではなくサーバー上で行います。

`inertia/app/ssr.ts`というファイルを作成し、次のような関数をデフォルトエクスポートしてください。

:::codegroup

```ts
// title: Vue 
import { createInertiaApp } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h, type DefineComponent } from 'vue'

export default function render(page) {
  return createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => {
      const pages = import.meta.glob<DefineComponent>('./pages/**/*.vue')
      return pages[`./pages/${name}.vue`]()
    },

    setup({ App, props, plugin }) {
      return createSSRApp({ render: () => h(App, props) }).use(plugin)
    },
  })
}
```

```tsx
// title: React
import ReactDOMServer from 'react-dom/server'
import { createInertiaApp } from '@inertiajs/react'

export default function render(page) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
      return pages[`./pages/${name}.tsx`]
    },
    setup: ({ App, props }) => <App {...props} />,
  })
}
```

```ts
// title: Svelte
import { createInertiaApp } from '@inertiajs/svelte'
import createServer from '@inertiajs/svelte/server'

export default function render(page) {
  return createInertiaApp({
    page,
    resolve: name => {
      const pages = import.meta.glob('./pages/**/*.svelte', { eager: true })
      return pages[`./pages/${name}.svelte`]
    },
  })
}
```

```tsx
// title: Solid
import { hydrate } from 'solid-js/web'
import { createInertiaApp } from 'inertia-adapter-solid'

export default function render(page: any) {
  return createInertiaApp({
    page,
    resolve: (name) => {
      const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
      return pages[`./pages/${name}.tsx`]
    },
    setup({ el, App, props }) {
      hydrate(() => <App {...props} />, el)
    },
  })
}
```
:::

#### 設定ファイルの更新

`config/inertia.ts`ファイルに移動し、`ssr`プロパティを更新して有効にします。また、別のパスを使用している場合は、サーバーエントリーポイントへのパスを指定してください。

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  // ...
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx'
  }
})
```

#### Viteの設定の更新

まず、`inertia` viteプラグインを登録していることを確認してください。次に、`vite.config.ts`ファイルでサーバーエントリーポイントへのパスを更新します（別のパスを使用している場合）。

```ts
import { defineConfig } from 'vite'
import inertia from '@adonisjs/inertia/client'

export default defineConfig({
  plugins: [
    inertia({
      ssr: {
        enabled: true,
        entrypoint: 'inertia/app/ssr.tsx'
      }
    })
  ]
})
```

サーバー上で最初のページ訪問をレンダリングし、その後クライアントサイドのレンダリングを続けることができます。

### SSRの許可リスト

SSRを使用する場合、すべてのコンポーネントをサーバーサイドでレンダリングする必要はありません。たとえば、認証によって制限された管理ダッシュボードを構築している場合、これらのルートはサーバーでレンダリングする理由はありません。ただし、同じアプリケーションでは、SEOを向上させるためにSSRを活用できるランディングページがあるかもしれません。

したがって、サーバーでレンダリングする必要があるページを`config/inertia.ts`ファイルに追加できます。

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  ssr: {
    enabled: true,
    pages: ['home']
  }
})
```

また、`pages`プロパティに関数を渡すこともできます。これにより、動的にサーバーでレンダリングするページを決定できます。

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  ssr: {
    enabled: true,
    pages: (ctx, page) => page.startsWith('admin')
  }
})
```

## テスト

フロントエンドコードをテストするためには、いくつかの方法があります。

- E2Eテスト。[Browser Client](https://docs.adonisjs.com/guides/browser-tests)を使用して、JapaとPlaywrightをシームレスに統合できます。
- ユニットテスト。フロントエンドエコシステムに適したテストツールを使用することをおすすめします。特に[Vitest](https://vitest.dev)があります。

さらに、正しいデータが返されることを確認するためにInertiaエンドポイントをテストすることもできます。そのためには、Japaで使用できるいくつかのテストヘルパーがあります。

まず、`test/bootstrap.ts`ファイルで`inertiaApiClient`と`apiClient`プラグインを設定していることを確認してください。

```ts
// title: tests/bootstrap.ts
import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
// highlight-start
import { apiClient } from '@japa/api-client'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
// highlight-end

export const plugins: Config['plugins'] = [
  assert(), 
  pluginAdonisJS(app),
  // highlight-start
  apiClient(),
  inertiaApiClient(app)
  // highlight-end
]
```

次に、`withInertia()`を使用してInertiaエンドポイントをリクエストし、データが正しくJSON形式で返されることを確認します。

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.get('/home').withInertia()

  response.assertStatus(200)
  response.assertInertiaComponent('home/main')
  response.assertInertiaProps({ user: { name: 'julien' } })
})
```

エンドポイントをテストするために利用できるさまざまなアサーションを見てみましょう。

### `withInertia()`

リクエストに`X-Inertia`ヘッダーを追加します。データが正しくJSON形式で返されることを保証します。

### `assertInertiaComponent()`

サーバーが返すコンポーネントが予想どおりであることを確認します。

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.get('/home').withInertia()

  response.assertInertiaComponent('home/main')
})
```

### `assertInertiaProps()`

サーバーが返すプロパティが、パラメータとして渡されたものと完全に一致することを確認します。

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.get('/home').withInertia()

  response.assertInertiaProps({ user: { name: 'julien' } })
})
```

### `assertInertiaPropsContains()`

サーバーが返すプロパティが、パラメータとして渡されたものの一部を含んでいることを確認します。

```ts
test('returns correct data', async ({ client }) => {
  const response = await client.get('/home').withInertia()

  response.assertInertiaPropsContains({ user: { name: 'julien' } })
})
```

### 追加のプロパティ

これらのアサーションに加えて、`ApiResponse`オブジェクトで以下のプロパティにアクセスできます。

```ts
test('returns correct data', async ({ client }) => {
  const { body } = await client.get('/home').withInertia()

  // サーバーが返すコンポーネント
  console.log(response.inertiaComponent) 

  // サーバーが返すプロパティ
  console.log(response.inertiaProps)
})
```

## FAQ

### フロントエンドコードを更新すると、サーバーが常にリロードされるのはなぜですか？

Reactを使用していると仮定しましょう。フロントエンドコードを更新するたびに、サーバーがリロードされ、ブラウザがリフレッシュされます。ホットモジュールリプレースメント（HMR）の機能を活用できていません。

これを解決するには、ルートの`tsconfig.json`ファイルから`inertia/**/*`を除外する必要があります。

```jsonc
{
  "compilerOptions": {
    // ...
  },
  "exclude": ["inertia/**/*"]
}
```

なぜなら、サーバーの再起動を担当するAdonisJSプロセスは、`tsconfig.json`ファイルに含まれるファイルを監視しているからです。

### プロダクションビルドが機能しないのはなぜですか？

次のようなエラーが発生している場合：

```
X [ERROR] Failed to load url inertia/app/ssr.ts (resolved id: inertia/app/ssr.ts). Does the file exist?
```

一般的な問題は、プロダクションビルドを実行する際に`NODE_ENV=production`を設定し忘れていることです。

```shell
NODE_ENV=production node build/server.js
```

### `Top-level await is not available...`というエラーが発生します。

次のようなエラーが発生している場合：

```
X [ERROR] Top-level await is not available in the configured target environment ("chrome87", "edge88", "es2020", "firefox78", "safari14" + 2 overrides)

    node_modules/@adonisjs/core/build/services/hash.js:15:0:
      15 │ await app.booted(async () => {
         ╵ ~~~~~
```

おそらく、バックエンドのコードをフロントエンドにインポートしているためです。エラーメッセージをよく見ると、Viteによって生成されたエラーであることがわかります。Viteは、`node_modules/@adonisjs/core`からコードをコンパイルしようとしています。したがって、バックエンドのコードがフロントエンドのバンドルに含まれることになります。これはおそらく望ましくない状況です。

一般的に、このエラーは、フロントエンドで型を共有しようとしている場合に発生します。これを実現したい場合は、常に`import type`を使用してこの型をインポートするようにしてください。

```ts
// ✅ 正しい
import type { User } from '#models/user'

// ❌ 間違っている
import { User } from '#models/user'
```
