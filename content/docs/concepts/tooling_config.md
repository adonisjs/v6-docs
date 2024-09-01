---
summary: AdonisJSによって使用されるTypeScript、Prettier、ESLintのツーリング設定プリセットについて学びましょう。
---

# ツール設定

AdonisJSは、コードの一貫性を持ち、ビルド時にエラーをチェックし、より楽しい開発体験をするためにTypeScript、Prettier、ESLintを大いに活用しています。

公式パッケージと公式スターターキットのすべてで使用される、使用準備ができた設定プリセットの中に、私たちの選択肢を抽象化しています。

TypeScriptで書かれたNode.jsアプリケーションで同じ設定プリセットを使用したい場合は、このガイドを読み続けてください。

## TSConfig

[`@adonisjs/tsconfig`](https://github.com/adonisjs/tooling-config/tree/main/packages/typescript-config)パッケージには、TypeScriptプロジェクトの基本設定が含まれています。TypeScriptのモジュールシステムを`NodeNext`に設定し、Just-in-Timeコンパイルには`TS Node + SWC`を使用しています。

[ベース設定ファイル](https://github.com/adonisjs/tooling-config/blob/main/packages/typescript-config/tsconfig.base.json)、[アプリケーション設定ファイル](https://github.com/adonisjs/tooling-config/blob/main/packages/typescript-config/tsconfig.app.json)、および[パッケージ開発設定ファイル](https://github.com/adonisjs/tooling-config/blob/main/packages/typescript-config/tsconfig.package.json)内のオプションを自由に探索してください。

パッケージをインストールし、次のように使用できます。

```sh
npm i -D @adonisjs/tsconfig

# 以下のパッケージもインストールすることを忘れないでください
npm i -D typescript ts-node @swc/core
```

AdonisJSアプリケーションを作成する際には、`tsconfig.app.json`ファイルから拡張します（スターターキットで事前に設定済み）。

```jsonc
{
  "extends": "@adonisjs/tsconfig/tsconfig.app.json",
  "compilerOptions": {
    "rootDir": "./",
    "outDir": "./build"
  }
}
```

AdonisJSエコシステムのパッケージを作成する際には、`tsconfig.package.json`ファイルから拡張します。

```jsonc
{
  "extends": "@adonisjs/tsconfig/tsconfig.package.json",
  "compilerOptions": {
    "rootDir": "./",
    "outDir": "./build"
  }
}
```

## Prettier設定
[`@adonisjs/prettier-config`](https://github.com/adonisjs/tooling-config/tree/main/packages/prettier-config)パッケージには、ソースコードを一貫したスタイルで自動フォーマットするための基本設定が含まれています。[index.jsonファイル](https://github.com/adonisjs/tooling-config/blob/main/packages/prettier-config/index.json)内の設定オプションを自由に探索してください。

パッケージをインストールし、次のように使用できます。

```sh
npm i -D @adonisjs/prettier-config

# prettierもインストールすることを忘れないでください
npm i -D prettier
```

`package.json`ファイル内に次のプロパティを定義します。

```jsonc
{
  "prettier": "@adonisjs/prettier-config"
}
```

また、特定のファイルやディレクトリを無視するために`.prettierignore`ファイルを作成します。

```
// title: .prettierignore
build
node_modules
```

## ESLint設定
[`@adonisjs/eslint-config`](https://github.com/adonisjs/tooling-config/tree/main/packages/eslint-config)パッケージには、リンティングルールを適用するための基本設定が含まれています。[ベース設定ファイル](https://github.com/adonisjs/tooling-config/blob/main/packages/eslint-config/presets/ts_base.js)、[アプリケーション設定ファイル](https://github.com/adonisjs/tooling-config/blob/main/packages/eslint-config/presets/ts_app.js)、および[パッケージ開発設定ファイル](https://github.com/adonisjs/tooling-config/blob/main/packages/eslint-config/presets/ts_package.js)内のオプションを自由に探索してください。

パッケージをインストールし、次のように使用できます。

:::note

私たちの設定プリセットは、[eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier)を使用して、ESLintとPrettierが互いに干渉しないようにしています。

:::

```sh
npm i -D @adonisjs/eslint-config

# eslintもインストールすることを忘れないでください
npm i -D eslint
```

AdonisJSアプリケーションを作成する際には、`eslint-config/app`ファイルから拡張します（スターターキットで事前に設定済み）。

```json
// title: package.json
{
  "eslintConfig": {
    "extends": "@adonisjs/eslint-config/app"
  }
}
```

AdonisJSエコシステムのパッケージを作成する際には、`eslint-config/package`ファイルから拡張します。

```json
// title: package.json
{
  "eslintConfig": {
    "extends": "@adonisjs/eslint-config/package"
  }
}
```
