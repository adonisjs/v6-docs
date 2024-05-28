---
summary: Assembler hooks are a way of executing code at specific points in the assembler lifecycle. 
---

# Assembler hooks

Assembler hooks are a way of executing code at specific points in the assembler lifecycle. As a reminder, the Assembler is a part of AdonisJS that enables you to launch your dev server, build your application, and run your tests. 

These hooks can be helpful for tasks such as file generation, code compilation, or injecting custom build steps.

Assembler hooks were initially introduced for our [new experimental version of Vite](./vite.md). These hooks enable the `adonisjs/vite` package to customize the build process and inject a step where front-end assets are built, and also, if necessary, generate an SSR build.

## Adding a hook

Assembler hooks are defined in the `adonisrc.ts` file, in the `unstable_assembler` key :

```ts
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  unstable_assembler: {
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

Several hooks can be defined for each stage of the assembly lifecycle. Each hook is an array of functions to be executed.

We recommend using dynamic imports to load hooks. It ensures that hooks are not loaded unnecessarily but only when needed. If you write your hook code directly in the `adonisrc.ts` file, this may slow down the start-up of your application.

## Create a hook

A hook is just a simple function. Let's take an example of a hook that is supposed to execute a custom build task.

```ts
// title: hooks/on_build_starting.ts
import type { AssemblerHookHandler } from '@adonisjs/core/types/app'

const buildHook: AssemblerHookHandler = async ({ logger }) => {
  logger.info('Generating some files...')

  await myCustomLogic()
}

export default buildHook
```

Note that the hook must be exported by default.

Once this hook has been defined, all you have to do is add it to the `adonisrc.ts` file like this:

```ts
// title: adonisrc.ts
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  unstable_assembler: {
    onBuildStarting: [
      () => import('./hooks/on_build_starting')
    ],
  },
})
```

And now, every time you run `node ace build`, the `onBuildStarting` hook will be executed with the custom logic you defined.

## Hooks list

Here's the list of available hooks:

### onBuildStarting

This hook is executed before the build starts. It is helpful for tasks such as file generation or for injecting custom build steps.

### onBuildCompleted

This hook is executed once the build is complete. It can also be used to customize the build process.

### onDevServerStarted

This hook is executed once the Adonis dev server is started. 

### onSourceFileChanged

This hook is executed each time a source file (included by your `tsconfig.json` ) is modified. Your hook will receive the path of the modified file as an argument.
