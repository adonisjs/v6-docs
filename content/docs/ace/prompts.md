---
summary: プロンプトは、@poppinss/promptsパッケージを使用してユーザーの入力を受け付けるためのターミナルウィジェットです。入力、パスワード、選択など、さまざまなタイプをサポートしており、テストの統合が容易になるように設計されています。
---


# プロンプト

プロンプトは、ユーザーの入力を受け付けるための対話型ターミナルウィジェットです。Aceプロンプトは、[@poppinss/prompts](https://github.com/poppinss/prompts)パッケージによってサポートされており、次のプロンプトタイプをサポートしています。

- 入力
- リスト
- パスワード
- 確認
- トグル
- 選択
- マルチ選択
- オートコンプリート

Aceプロンプトは、テストを考慮して構築されています。テストを作成する際には、プロンプトをトラップしてプログラムで応答できます。

参考: [Aceコマンドのテスト](../testing/console_tests.md)

## プロンプトの表示

すべてのAceコマンドで利用可能な`this.prompt`プロパティを使用して、プロンプトを表示できます。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const modelName = await this.prompt.ask('モデル名を入力してください')
    
    console.log(modelName)
  }
}
```

## プロンプトオプション

プロンプトで受け入れられるオプションのリストは次のとおりです。このテーブルを唯一の情報源として参照できます。


<table>
<tr>
<td width="110px">オプション</td>
<td width="120px">受け入れられるプロンプト</td>
<td>説明</td>
</tr>
<tr>
<td>

`default`（文字列）

</td>

<td>

すべてのプロンプト

</td>

<td>

値が入力されなかった場合に使用するデフォルト値です。`select`、`multiselect`、`autocomplete`プロンプトの場合、値は選択肢の配列インデックスである必要があります。

</td>
</tr>

<tr>
<td>

`name`（文字列）

</td>

<td>

すべてのプロンプト

</td>

<td>

プロンプトのユニークな名前です。

</td>
</tr>

<tr>
<td>

`hint`（文字列）

</td>

<td>

すべてのプロンプト

</td>

<td>

プロンプトの横に表示するヒントテキストです。

</td>
</tr>
<tr>
<td>

`result`（関数）

</td>

<td>すべてのプロンプト</td>
<td>

プロンプトの戻り値を変換します。`result`メソッドの入力値はプロンプトによって異なります。たとえば、`multiselect`プロンプトの値は選択された選択肢の配列になります。

```ts
{
  result(value) {
    return value.toUpperCase()
  }
}
```

</td>
</tr>

<tr>
<td>

`format`（関数）

</td>

<td>すべてのプロンプト</td>

<td>

ユーザーが入力するときに入力値をライブでフォーマットします。フォーマットはCLIの出力にのみ適用され、戻り値には適用されません。

```ts
{
  format(value) {
    return value.toUpperCase()
  }
}
```

</td>
</tr>

<tr>
<td>

`validate`（関数）

</td>

<td>すべてのプロンプト</td>

<td>

ユーザーの入力をバリデーションします。メソッドから`true`を返すとバリデーションが成功します。`false`またはエラーメッセージの文字列を返すと失敗と見なされます。

```ts
{
  format(value) {
    return value.length > 6
    ? true
    : 'モデル名は6文字である必要があります'
  }
}
```

</tr>

<tr>
<td>

`limit`（数値）

</td>

<td>

`autocomplete`

</td>

<td>

表示するオプションの数を制限します。残りのオプションを表示するにはスクロールする必要があります。

</td>
</tr>
</table>


## テキスト入力

`prompt.ask`メソッドを使用して、テキスト入力を受け付けるためのプロンプトをレンダリングできます。メソッドは、最初のパラメータとしてプロンプトメッセージを受け入れ、2番目のパラメータとして[オプションオブジェクト](#プロンプトオプション)を受け入れます。

```ts
await this.prompt.ask('モデル名を入力してください')
```

```ts
// 入力のバリデーション
await this.prompt.ask('モデル名を入力してください', {
  validate(value) {
    return value.length > 0
  }
})
```

```ts
// デフォルト値
await this.prompt.ask('モデル名を入力してください', {
  default: 'User'
})
```

## マスクされた入力

名前の通り、マスクされた入力プロンプトはターミナルでユーザーの入力をマスクします。`prompt.secure`メソッドを使用してマスクされたプロンプトを表示できます。

メソッドは、最初のパラメータとしてプロンプトメッセージを受け入れ、2番目のパラメータとして[オプションオブジェクト](#プロンプトオプション)を受け入れます。

```ts
await this.prompt.secure('アカウントのパスワードを入力してください')
```

```ts
await this.prompt.secure('アカウントのパスワードを入力してください', {
  validate(value) {
    return value.length < 6
      ? 'パスワードは6文字である必要があります'
      : true
  }
})
```

## 選択肢のリスト

`prompt.choice`メソッドを使用して、単一の選択肢のリストを表示できます。メソッドは次のパラメータを受け入れます。

1. プロンプトメッセージ。
2. 選択肢の配列。
3. オプションの[オプションオブジェクト](#プロンプトオプション)。

```ts
await this.prompt.choice('パッケージマネージャーを選択してください', [
  'npm',
  'yarn',
  'pnpm'
])
```

異なる表示値を指定するには、オプションをオブジェクトとして定義できます。`name`プロパティがプロンプトの結果として返され、`message`プロパティがターミナルに表示されます。

```ts
await this.prompt.choice('データベースドライバーを選択してください', [
  {
    name: 'sqlite',
    message: 'SQLite'
  },
  {
    name: 'mysql',
    message: 'MySQL'
  },
  {
    name: 'pg',
    message: 'PostgreSQL'
  }
])
```

## マルチ選択の選択肢

`prompt.multiple`メソッドを使用して、選択肢リストで複数の選択を許可できます。パラメータは`choice`プロンプトと同じです。

```ts
await this.prompt.multiple('データベースドライバーを選択してください', [
  {
    name: 'sqlite',
    message: 'SQLite'
  },
  {
    name: 'mysql',
    message: 'MySQL'
  },
  {
    name: 'pg',
    message: 'PostgreSQL'
  }
])
```

## アクションの確認

`prompt.confirm`メソッドを使用して、`はい/いいえ`オプションを持つ確認プロンプトを表示できます。メソッドは、最初のパラメータとしてプロンプトメッセージを受け入れ、2番目のパラメータとして[オプションオブジェクト](#プロンプトオプション)を受け入れます。

`confirm`プロンプトはブール値を返します。

```ts
const deleteFiles = await this.prompt.confirm(
  'すべてのファイルを削除しますか？'
)

if (deleteFiles) {
}
```

`はい/いいえ`オプションの表示値をカスタマイズするには、`prompt.toggle`メソッドを使用できます。

```ts
const deleteFiles = await this.prompt.toggle(
  'すべてのファイルを削除しますか？',
  ['はい', 'いいえ']
)

if (deleteFiles) {
}
```

## オートコンプリート

`autocomplete`プロンプトは、選択とマルチ選択のプロンプトの組み合わせですが、選択肢をフジー検索する機能があります。

```ts
const selectedCity = await this.prompt.autocomplete(
  '都市を選択してください',
  await getCitiesList()
)
```
