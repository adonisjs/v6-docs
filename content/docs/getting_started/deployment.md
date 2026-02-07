---
summary: 了解在生产环境中部署 AdonisJS 应用的通用指南。
---

# 部署

部署 AdonisJS 应用与部署标准 Node.js 应用没有什么不同。你需要一台运行 `Node.js >= 20.6` 的服务器，以及 `npm` 来安装生产依赖。

本指南将介绍在生产环境中部署和运行 AdonisJS 应用的通用指南。

## 创建生产构建

第一步，你必须运行 `build` 命令来创建 AdonisJS 应用的生产构建。

参考：[TypeScript 构建过程](../concepts/typescript_build_process.md)

```sh
node ace build
```

编译后的输出将写入 `./build` 目录。如果你使用 Vite，其输出将写入 `./build/public` 目录。

创建生产构建后，你可以将 `./build` 文件夹复制到你的生产服务器。**从现在起，build 文件夹将作为你的应用根目录**。

### 创建 Docker 镜像

如果你使用 Docker 部署应用，可以使用以下 `Dockerfile` 创建 Docker 镜像。

```dockerfile
FROM node:22.16.0-alpine3.22 AS base

# All deps stage
FROM base AS deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci

# Production only deps stage
FROM base AS production-deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci --omit=dev

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN node ace build

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app
EXPOSE 8080
CMD ["node", "./bin/server.js"]
```

请随意修改 Dockerfile 以满足你的需求。

## 配置反向代理

Node.js 应用通常 [部署在反向代理服务器后面](https://medium.com/intrinsic-blog/why-should-i-use-a-reverse-proxy-if-node-js-is-production-ready-5a079408b2ca)，如 Nginx。因此，端口 `80` 和 `443` 上的传入流量将首先由 Nginx 处理，然后转发到你的 Node.js 应用。

以下是一个你可以作为起点的 Nginx 配置文件示例。

:::warning
请务必替换尖括号 `<>` 内的值。
:::

```nginx
server {
  listen 80;
  listen [::]:80;

  server_name <APP_DOMAIN.COM>;

  location / {
    proxy_pass http://localhost:<ADONIS_PORT>;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## 定义环境变量

如果你将应用部署在裸机服务器上，如 DigitalOcean Droplet 或 EC2 实例，你可以使用 `.env` 文件来定义环境变量。确保文件存储安全，且仅授权用户可以访问。

:::note
如果你使用 Heroku 或 Cleavr 等部署平台，可以使用它们的控制面板来定义环境变量。
:::

假设你在 `/etc/secrets` 目录中创建了 `.env` 文件，你必须按如下方式启动生产服务器。

```sh
ENV_PATH=/etc/secrets node build/bin/server.js
```

`ENV_PATH` 环境变量指示 AdonisJS 在指定目录中查找 `.env` 文件。

## 启动生产服务器

你可以通过运行 `node server.js` 文件来启动生产服务器。但是，建议使用像 [pm2](https://pm2.keymetrics.io/docs/usage/quick-start) 这样的进程管理器。

- PM2 将在后台运行你的应用，而不会阻塞当前的终端会话。
- 如果你的应用在处理请求时崩溃，它将自动重启应用。
- 此外，PM2 使在 [集群模式](https://nodejs.org/api/cluster.html#cluster) 下运行应用变得非常简单。

以下是一个你可以作为起点的 [pm2 ecosystem 文件](https://pm2.keymetrics.io/docs/usage/application-declaration) 示例。

```js
// title: ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'web-app',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
    },
  ],
}
```

```sh
// title: Start server
pm2 start ecosystem.config.js
```

## 迁移数据库

如果你使用 SQL 数据库，必须在生产服务器上运行数据库迁移以创建所需的表。

如果你使用 Lucid，可以运行以下命令。

```sh
node ace migration:run --force
```

在生产环境中运行迁移时，必须使用 `--force` 标志。

### 何时运行迁移

此外，最好总是在重启服务器之前运行迁移。这样，如果迁移失败，就不会重启服务器。

如果使用 Cleavr 或 Heroku 等托管服务，它们可以自动处理此用例。否则，你必须在 CI/CD 管道中运行迁移脚本，或通过 SSH 手动运行。

### 不要在生产环境中回滚

在生产环境中回滚迁移是一个危险的操作。迁移文件中的 `down` 方法通常包含破坏性操作，如 **删除表** 或 **删除列** 等。

建议在 `config/database.ts` 文件中关闭生产环境的回滚功能，而是创建一个新的迁移来修复问题并在生产服务器上运行它。

在生产环境中禁用回滚将确保 `node ace migration:rollback` 命令产生错误。

```js
{
  pg: {
    client: 'pg',
    migrations: {
      disableRollbacksInProduction: true,
    }
  }
}
```

### 并发迁移

如果你在具有多个实例的服务器上运行迁移，必须确保只有一个实例运行迁移。

对于 MySQL 和 PostgreSQL，Lucid 将获取咨询锁（advisory locks）以确保不允许并发迁移。但是，最好首先避免从多个服务器运行迁移。

## 文件上传的持久化存储

像 Amazon EKS、Google Kubernetes、Heroku、DigitalOcean Apps 等环境，在 [临时文件系统](https://devcenter.heroku.com/articles/dynos#ephemeral-filesystem) 中运行你的应用代码，这意味着每次部署默认都会清除现有文件系统并创建一个新的文件系统。

如果你的应用允许用户上传文件，你必须使用像 Amazon S3、Google Cloud Storage 或 DigitalOcean Spaces 这样的持久化存储服务，而不是依赖本地文件系统。

## 日志记录

AdonisJS 默认使用 [`pino` logger](../digging_deeper/logger.md)，它将日志以 JSON 格式写入控制台。你可以设置外部日志服务来读取 stdout/stderr 中的日志，或者将它们转发到同一服务器上的本地文件。

## 提供静态资源

有效地提供静态资源对于应用的性能至关重要。无论你的 AdonisJS 应用有多快，静态资源的交付对于更好的用户体验都起着巨大的作用。

### 使用 CDN

最好的方法是使用 CDN（内容分发网络）来分发 AdonisJS 应用的静态资源。

使用 [Vite](../basics/vite.md) 编译的前端资源默认带有指纹，这意味着文件名是根据其内容进行哈希处理的。这允许你永久缓存资源并从 CDN 提供它们。

根据你使用的 CDN 服务和部署技术，你可能需要在部署过程中添加一个步骤，将静态文件移动到 CDN 服务器。简而言之，它的工作原理如下。

1. 更新 `vite.config.js` 和 `config/vite.ts` 配置以 [使用 CDN URL](../basics/vite.md#deploying-assets-to-a-cdn)。

2. 运行 `build` 命令编译应用和资源。

3. 将 `public/assets` 的输出复制到你的 CDN 服务器。例如，[这是一个命令](https://github.com/adonisjs-community/polls-app/blob/main/commands/PublishAssets.ts)，我们用它将资源发布到 Amazon S3 存储桶。

### 使用 Nginx 提供静态资源

另一个选择是将提供资源的任务卸载给 Nginx。如果你使用 Vite 编译前端资源，你必须积极缓存所有静态文件，因为它们是带有指纹的。

将以下块添加到你的 Nginx 配置文件中。**确保替换尖括号 `<>` 内的值**。

```nginx
location ~ \.(jpg|png|css|js|gif|ico|woff|woff2) {
  root <PATH_TO_ADONISJS_APP_PUBLIC_DIRECTORY>;
  sendfile on;
  sendfile_max_chunk 2m;
  add_header Cache-Control "public";
  expires 365d;
}
```

### 使用 AdonisJS 静态文件服务器

为了保持简单，你也可以依赖 [AdonisJS 内置静态文件服务器](../basics/static_file_server.md) 从 `public` 目录提供静态资源。

无需额外配置。只需像往常一样部署你的 AdonisJS 应用，静态资源的请求将自动得到服务。

:::warning
不建议在生产环境中使用静态文件服务器。最好使用 CDN 或 Nginx 来提供静态资源。
:::
