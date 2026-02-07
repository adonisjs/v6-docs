---
summary: Prompts 是终端小部件，用于用户输入，使用 @poppinss/prompts 包。它们支持各种类型，如输入、密码和选择，并且旨在易于测试集成。
---


# Prompts

Prompts 是你可以用来接受用户输入的交互式终端小部件。Ace prompts 由 [@poppinss/prompts](https://github.com/poppinss/prompts) 包提供支持，该包支持以下 prompt 类型。

- input
- list
- password
- confirm
- toggle
- select
- multi-select
- autocomplete

Ace prompts 的构建考虑了测试。在编写测试时，你可以捕获 prompts 并以编程方式响应它们。

另请参阅：[测试 ace 命令](../testing/console_tests.md)

## 显示 prompt

你可以使用所有 Ace 命令上可用的 `this.prompt` 属性来显示 prompts。

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  async run() {
    const modelName = await this.prompt.ask('Enter the model name')
    
    console.log(modelName)
  }
}
```

## Prompt 选项

以下是 prompts 接受的选项列表。你可以将此表作为唯一的参考来源。


<table>
<tr>
<td width="110px">选项</td>
<td width="120px">接受者</td>
<td>描述</td>
</tr>
<tr>
<td>

`default` (String) 

</td>

<td>

所有 prompts

</td>

<td>

当未输入任何值时使用的默认值。在 `select`、`multiselect` 和 `autocomplete` prompts 的情况下，该值必须是 choices 数组索引。

</td>
</tr>

<tr>
<td>

`name` (String)

</td>

<td>

所有 prompts

</td>

<td>

prompt 的唯一名称

</td>
</tr>

<tr>
<td>

`hint` (String)

</td>

<td>

所有 prompts

</td>

<td>

显示在 prompt 旁边的提示文本

</td>
</tr>
<tr>
<td>

`result` (Function)

</td>

<td>所有 prompts</td>
<td>

转换 prompt 返回值。`result` 方法的输入值取决于 prompt。例如，`multiselect` prompt 值将是选定选项的数组。

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

`format` (Function)

</td>

<td>所有 prompts</td>

<td>

在用户输入时实时格式化输入值。格式化仅应用于 CLI 输出，而不应用于返回值。

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

`validate` (Function)

</td>

<td>所有 prompts</td>

<td>

验证用户输入。从该方法返回 `true` 将通过验证。返回 `false` 或错误消息字符串将被视为失败。

```ts
{
  validate(value) {
    return value.length > 6
    ? true
    : 'Model name must be 6 characters long'
  }
}
```

</tr>

<tr>
<td>

`limit` (Number)

</td>

<td>

`autocomplete`

</td>

<td>

限制显示的选项数量。你必须滚动才能看到其余的选项。

</td>
</tr>
</table>
