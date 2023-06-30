# Tooling config

AdonisJS relies heavily on TypeScript, Prettier, and ESLint to write consistent code, check for errors at build time, and more importantly, have a joyful development experience.

We have abstracted all our choices inside ready-to-use configuration presets used by all the official packages and optionally by the application starter kits.

Continue reading this guide if you want to use the same configuration presets in your Node.js applications written in TypeScript.

## TSConfig

The [`@adonisjs/tsconfig`](https://github.com/adonisjs/tooling-config/tree/main/packages/typescript-config) package contains the base configuration for TypeScript projects. We set the TypeScript module system to `NodeNext` and use `TS Node + SWC` for Just-in-Time compilation.

Feel free to explore options inside the [base config file](https://github.com/adonisjs/tooling-config/blob/main/packages/typescript-config/tsconfig.base.json), [application config file](https://github.com/adonisjs/tooling-config/blob/main/packages/typescript-config/tsconfig.app.json), and [package development config file](https://github.com/adonisjs/tooling-config/blob/main/packages/typescript-config/tsconfig.package.json).

You can install the package and use it as follows.

```sh
npm i -D @adonisjs/tsconfig

# Make sure also to install the following packages
npm i -D typescript ts-node @swc/core
```

Extend from the `tsconfig.app.json` file when creating an AdonisJS application. (Comes pre-configured with starter kits).

```jsonc
{
  "extends": "@adonisjs/tsconfig/tsconfig.app.json",
  "compilerOptions": {
    "rootDir": "./",
    "outDir": "./build"
  }
}
```

Extend from the `tsconfig.package.json` file when creating a package for the AdonisJS ecosystem.

```jsonc
{
  "extends": "@adonisjs/tsconfig/tsconfig.package.json",
  "compilerOptions": {
    "rootDir": "./",
    "outDir": "./build"
  }
}
```

## Prettier config
The [`@adonisjs/prettier-config`](https://github.com/adonisjs/tooling-config/tree/main/packages/prettier-config) package contains the base configuration to auto-format the source code for consistent styling. Feel free to explore configuration options inside the [index.json file](https://github.com/adonisjs/tooling-config/blob/main/packages/prettier-config/index.json).

You can install the package and use it as follows.

```sh
npm i -D @adonisjs/prettier-config

# Make sure also to install prettier
npm i -D prettier
```

Define the following property inside the `package.json` file.

```jsonc
{
  "prettier": "@adonisjs/prettier-config"
}
```

Also, create a `.prettierignore` file to ignore specific files and directories.

```
// title: .prettierignore
build
node_modules
```

## ESLint config
The [`@adonisjs/eslint-config`](https://github.com/adonisjs/tooling-config/tree/main/packages/eslint-config) package contains the base configuration to apply the linting rules.  Feel free to explore options inside the [base config file](https://github.com/adonisjs/tooling-config/blob/main/packages/eslint-config/presets/ts_base.js), [application config file](https://github.com/adonisjs/tooling-config/blob/main/packages/eslint-config/presets/ts_app.js), and [package development config file](https://github.com/adonisjs/tooling-config/blob/main/packages/eslint-config/presets/ts_package.js).

You can install the package and use it as follows.

:::note

Our config preset uses the [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) to ensure ESLint and Prettier can work together without stepping over each other.

:::

```sh
npm i -D @adonisjs/eslint-config

# Make sure also to install eslint
npm i -D eslint
```

Extend from the `eslint-config/app` file when creating an AdonisJS application. (Comes pre-configured with starter kits).

```json
// title: package.json
{
  "eslintConfig": {
    "extends": "@adonisjs/eslint-config/app"
  }
}
```

Extend from the `eslint-config/package` file when creating a package for the AdonisJS ecosystem.

```json
// title: package.json
{
  "eslintConfig": {
    "extends": "@adonisjs/eslint-config/package"
  }
}
```
