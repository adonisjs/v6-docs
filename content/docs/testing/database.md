---
summary: "了解如何在 AdonisJS 中测试与数据库交互的代码：设置、重置和在测试期间保持数据库清洁的简单步骤。"
---

# 数据库测试

数据库测试是指测试你的应用程序如何与数据库进行交互。这包括测试写入数据库的内容、如何在测试之前运行迁移以及如何在测试之间保持数据库清洁。

## 迁移数据库

在执行与数据库交互的测试之前，你首先要运行迁移。我们在 `testUtils` 服务中有两个可用的钩子，你可以在 `tests/bootstrap.ts` 文件中进行配置。

### 每次运行周期后重置数据库

我们拥有的第一个选项是 `testUtils.db().migrate()`。这个钩子将首先运行你所有的迁移，然后回滚所有内容。

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().migrate(),
  ],
  teardown: [],
}
```

通过在此处配置钩子，将会发生以下情况：

- 在运行我们的测试之前，将执行迁移。
- 在我们的测试结束时，数据库将被回滚。

因此，每次我们运行测试时，我们将拥有一个全新的空数据库。

### 每次运行周期后截断表

在每次运行周期后重置数据库是一个不错的选择，但是如果你有很多迁移，它可能会很慢。另一个选项是在每次运行周期后截断表。此选项将更快，因为迁移仅在第一次在全新数据库上运行测试时执行一次。


在每次运行周期结束时，表将被截断，但我们的模式将被保留。因此，下次我们运行测试时，我们将拥有一个空数据库，但模式已经存在，因此无需再次运行每个迁移。

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().truncate(),
  ],
}
```

## 播种数据库

如果你需要播种数据库，可以使用 `testUtils.db().seed()` 钩子。此钩子将在运行测试之前运行所有种子。

```ts
// title: tests/bootstrap.ts
import testUtils from '@adonisjs/core/services/test_utils'

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().seed(),
  ],
}
```

## 在测试之间保持数据库清洁

### 全局事务

在运行测试时，你可能希望在每个测试之间保持数据库清洁。为此，你可以使用 `testUtils.db().withGlobalTransaction()` 钩子。此钩子将在每个测试之前启动一个事务，并在测试结束时回滚该事务。

```ts
// title: tests/unit/user.spec.ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('User', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
})
```

请注意，如果你在被测代码中使用任何事务，这将不起作用，因为事务不能嵌套。在这种情况下，你可以改用 `testUtils.db().migrate()` 或 `testUtils.db().truncate()` 钩子。

### 截断表

如上所述，如果你在被测代码中使用事务，全局事务将不起作用。在这种情况下，你可以使用 `testUtils.db().truncate()` 钩子。此钩子将在每个测试之后截断所有表。

```ts
// title: tests/unit/user.spec.ts
import { test } from '@japa/runner'

test.group('User', (group) => {
  group.each.setup(() => testUtils.db().truncate())
})
```
