---
summary: 为 AdonisJS 项目做贡献是回馈社区的好方法。本指南提供了如何为任何 AdonisJS 项目做贡献的总体概述。
---

# 贡献指南
这是所有 [AdonisJS](https://github.com/adonisjs) 代码库的通用贡献指南。在为任何代码库做贡献之前，请务必仔细阅读本指南 🙏

编写代码并不是做贡献的唯一方式。以下也是一些做贡献并成为社区一部分的方法：

- 修复文档中的拼写错误
- 改进现有文档
- 编写实战教程（Cookbooks）或博客文章来教育社区中的其他人
- 对 Issue 进行分类整理
- 分享你对现有 Issue 的看法
- 在 [discord](https://discord.gg/vDcEjq6) 和论坛中帮助社区。

## 报告 Bug
在开源项目中报告的许多问题通常是提问者端的问题或配置错误。因此，我们强烈建议你在报告问题之前先正确地进行故障排除。

如果你要报告 Bug，请尽可能多地提供信息以及你编写的代码示例。Issue 的质量好坏如下所示：

- **完美的 Issue**：你隔离了潜在的 Bug。在代码库中创建一个失败的测试，并围绕它开启一个 Github Issue。
- **好的 Issue**：你隔离了潜在的 Bug，并提供了一个最小化的 Github 仓库复现。Antfu 写了一篇很棒的文章：[为什么需要复现](https://antfu.me/posts/why-reproductions-are-required)。
- **一般的 Issue**：你正确地陈述了你的问题。分享了首先产生该问题的代码。此外，还包括相关的配置文件和你使用的包版本。

  最后但同样重要的是，请遵循 [Github Markdown 语法指南](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) 正确格式化每个代码块。

- **糟糕的 Issue**：你抛出你的问题，希望别人会问相关的问题来帮助你。这类问题通常会被自动关闭，不做任何解释。

## 发起讨论
你经常想讨论一个话题或者分享一些想法。在这种情况下，请在讨论论坛的 **💡Ideas** 类别下创建一个讨论。

## 教育他人
教育他人是为任何社区做贡献并获得认可的最佳方式之一。

你可以使用我们要讨论论坛上的 **📚 Cookbooks** 类别与他人分享文章。Cookbooks 部分没有严格的审核，但分享的知识应与项目相关。

## 创建 Pull Requests
在投入大量时间和精力编写代码后，Pull Request 被拒绝绝不是一种好的体验。因此，我们强烈建议你在开始任何新工作之前，先[发起讨论](https://github.com/orgs/adonisjs/discussions)。

只需开始一个讨论并解释你计划贡献什么？

- **你是否试图创建一个 PR 来修复 Bug**：一旦 Bug 得到确认，针对 Bug 的 PR 大多会被接受。
- **你是否计划添加新功能**：请详细解释为什么需要此功能，并分享我们可以阅读以自学的学习资料链接。

  例如：如果你要为 Japa 或 AdonisJS 添加快照测试支持。那么请分享我可以用来了解通用的快照测试的链接。

> 注意：你应该也可以开启额外的 PR 来为你贡献的功能或改进编写文档。

## 仓库设置

1. 首先将仓库克隆到你的本地机器上。

    ```sh
    git clone <REPO_URL>
    ```

2. 在本地安装依赖项。请不要随功能请求一起更新任何依赖项。如果你发现过时的依赖项，请创建一个单独的 PR 来更新它们。

   我们使用 `npm` 管理依赖项，因此不要使用 `yarn` 或任何其他工具。

    ```sh
    npm install
    ```

3. 执行以下命令运行测试。

    ```sh
    npm test
    ```

## 使用的工具
以下是使用的工具列表。

| 工具                   | 用途                                                                                                                                                                                                                                                                  |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| TypeScript             | 所有代码库均使用 TypeScript 编写。编译后的 JavaScript 和类型定义发布在 npm 上。                                                                                                                                                        |
| TS Node                | 我们使用 [ts-node](https://typestrong.org/ts-node/) 来运行测试或脚本，而无需编译 TypeScript。ts-node 的主要目标是在开发期间拥有更快的反馈循环。                                                                                  |
| SWC                    | [SWC](https://swc.rs/) 是一个基于 Rust 的 TypeScript 编译器。TS Node 拥有一流的支持，可以使用 SWC 替代 TypeScript 官方编译器。使用 SWC 的主要原因是速度提升。                                                               |
| Release-It             | 我们使用 [release-it](https://github.com/release-it/release-it) 将包发布到 npm。它完成了创建发布版本并将其发布到 npm 和 Github 的所有繁重工作。其配置定义在 `package.json` 文件中。                            |
| ESLint                 | ESLint 帮助我们在拥有多个贡献者的所有代码库中强制执行一致的编码风格。我们所有的 ESLint 规则都发布在 [eslint-plugin-adonis](https://github.com/adonisjs-community/eslint-plugin-adonis) 包下。                            |
| Prettier               | 我们使用 prettier 格式化代码库以获得一致的视觉输出。如果你对为什么我们同时使用 ESLint 和 Prettier 感到困惑，请阅读 Prettier 网站上的 [Prettier vs. Linters](https://prettier.io/docs/en/comparison.html) 文档。            |
| EditorConfig           | 每个项目根目录下的 `.editorconfig` 文件配置你的代码编辑器，以使用一组规则进行缩进和空白管理。同样，Prettier 用于代码的后期格式化，而 Editorconfig 用于预先配置编辑器。 |
| Conventional Changelog | 所有代码库中的所有提交都使用 [commitlint](https://github.com/conventional-changelog/commitlint/#what-is-commitlint) 来强制执行一致的提交消息。                                                                                             |
| Husky                  | 我们使用 [husky](https://typicode.github.io/husky/#/) 在提交代码时强制执行提交约定。Husky 是一个用 Node 编写的 git hooks 系统。                                                                                                                |

## 命令

| 命令 | 描述 |
|-------|--------|
| `npm run test` | 使用 `ts-node` 运行项目测试 |
| `npm run compile` | 将 TypeScript 项目编译为 JavaScript。编译输出写入 `build` 目录 |
| `npm run release` | 使用 `np` 启动发布流程 |
| `npm run lint` | 使用 ESlint 检查代码库 |
| `npm run format` | 使用 Prettier 格式化代码库 | 
| `npm run sync-labels` | 将 `.github/labels.json` 文件中定义的标签与 Github 同步。此命令仅供项目管理员使用。 |

## 编码风格
我们所有的项目都使用 TypeScript 编写，并且正在转向纯 ESM。

- 你可以在[这里了解更多关于我的编码风格](https://github.com/thetutlage/meta/discussions/3)
- 在[这里查看我遵循的 ESM 和 TypeScript 设置](https://github.com/thetutlage/meta/discussions/2)

此外，确保在推送代码之前运行以下命令。

```sh
# 使用 prettier 格式化
npm run format

# 使用 Eslint 检查
npm run lint
```

## 获得贡献者认可
我们依靠 GitHub 在仓库的右侧面板中列出所有仓库贡献者。以下是示例。

此外，我们使用 Github 的[自动生成发布说明](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes#about-automatically-generated-release-notes)功能，该功能会在发布说明中添加对贡献者个人资料的引用。
