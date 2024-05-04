# Deployment

Deploying an AdonisJS application is no different than deploying a standard Node.js application. You need a server running `Node.js >= 20.6` along with `npm` to install production dependencies.

This guide will cover the generic guidelines to deploy and run an AdonisJS application in production. 

## Creating production build

As a first step, you must create the production build of your AdonisJS application by running the `build` command.

See also: [TypeScript build process](../concepts/typescript_build_process.md)

```sh
node ace build
```

The compiled output is written inside the `./build` directory. If you use Vite, its output will be written inside the `./build/public` directory.

Once you have created the production build, you may copy the `./build` folder to your production server. **From now on, the build folder will be the root of your application**.

### Creating a Docker image

If you are using Docker to deploy your application, you may create a Docker image using the following `Dockerfile`.

```dockerfile
FROM node:20.12.2-alpine3.18 as base

# All deps stage
FROM base as deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci

# Production only deps stage
FROM base as production-deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci --omit=dev

# Build stage
FROM base as build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN node ace build --ignore-ts-errors

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app
EXPOSE 8080
CMD ["node", "./bin/server.js"]
```

Feel free to modify the Dockerfile to suit your needs.

## Configuring a reverse proxy

Node.js applications are usually [deployed behind a reverse proxy](https://medium.com/intrinsic-blog/why-should-i-use-a-reverse-proxy-if-node-js-is-production-ready-5a079408b2ca) server like Nginx. So the incoming traffic on ports `80` and `443` will be handled by Nginx first and then forwarded to your Node.js application.

Following is an example Nginx config file you may use as the starting point.

:::warning
Make sure to replace the values inside the angle brackets `<>`.
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

## Defining environment variables

If you are deploying your application on a bare-bone server, like a DigitalOcean Droplet or an EC2 instance, you may use an `.env` file to define the environment variables. Ensure the file is stored securely and only authorized users can access it.

:::note
If you are using a deployment platform like Heroku or Cleavr, you may use their control panel to define the environment variables.
:::

Assuming you have created the `.env` file in an `/etc/secrets` directory, you must start your production server as follows.

```sh
ENV_PATH=/etc/secrets node build/server.js
```

The `ENV_PATH` environment variable instructs AdonisJS to look for the `.env` file inside the mentioned directory.

## Starting the production server

You may start the production server by running the `node server.js` file. However, it is recommended to use a process manager like [pm2](https://pm2.keymetrics.io/docs/usage/quick-start).

- PM2 will run your application in background without blocking the current terminal session.
- It will restart the application, if your app crashes while serving requests.
- Also, PM2 makes it super simple to run your application in [cluster mode](https://nodejs.org/api/cluster.html#cluster)

Following is an example [pm2 ecosystem file](https://pm2.keymetrics.io/docs/usage/application-declaration) you may use as the starting point.

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

## Migrating database

If you are using a SQL database, you must run the database migrations on the production server to create the required tables.

If you are using Lucid, you may run the following command.

```sh
node ace migration:run --force
```

The `--force` flag is required when running migrations in the production environment.

### When to run migrations

Also, it would be best if you always run the migrations before restarting the server. Then, if the migration fails, do not restart the server.

Using a managed service like Cleavr or Heroku, they can automatically handle this use case. Otherwise, you will have to run the migration script inside a CI/CD pipeline or run it manually through SSH.

### Do not rollback in production

Rolling back migrations in production is a risky operation. The `down` method in your migration files usually contains destructive actions like **drop the table**, or **remove a column**, and so on.

It is recommended to turn off rollbacks in production inside the config/database.ts file and instead, create a new migration to fix the issue and run it on the production server.

Disabling rollbacks in production will ensure that the `node ace migration:rollback` command results in an error.

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

### Concurrent migrations

If you are running migrations on a server with multiple instances, you must ensure that only one instance runs the migrations.

For MySQL and PostgreSQL, Lucid will obtain advisory locks to ensure that concurrent migration is not allowed. However, it is better to avoid running migrations from multiple servers in the first place.

## Persistent storage for file uploads

Environments like Amazon EKS, Google Kubernetes, Heroku, DigitalOcean Apps, and so on, run your application code inside [an ephemeral filesystem](https://devcenter.heroku.com/articles/dynos#ephemeral-filesystem), which means that each deployment, by default, will nuke the existing filesystem and creates a fresh one.

If your application allows users to upload files, you must use a persistent storage service like Amazon S3, Google Cloud Storage, or DigitalOcean Spaces instead of relying on the local filesystem.

## Writing logs

AdonisJS uses the [`pino` logger](../digging_deeper/logger.md) by default, which writes logs to the console in JSON format. You can either set up an external logging service to read the logs from stdout/stderr, or forward them to a local file on the same server.

## Serving static assets

Serving static assets effectively is essential for the performance of your application. Regardless of how fast your AdonisJS applications are, the delivery of static assets plays a massive role to a better user experience.

### Using a CDN

The best approach is to use a CDN (Content Delivery Network) for delivering the static assets from your AdonisJS application.

The frontend assets compiled using [Vite](../basics/vite.md) are fingerprinted by default, which means that the file names are hashed based on their content. This allows you to cache the assets forever and serve them from a CDN.

Depending upon the CDN service you are using and your deployment technique, you may have to add a step to your deployment process to move the static files to the CDN server. This is how it should work in a nutshell.

1. Update the `vite.config.js` and `config/vite.ts` configuration to [use the CDN URL](../basics/vite.md#deploying-assets-to-a-cdn).

2. Run the `build` command to compile the application and the assets.

3. Copy the output of `public/assets` to your CDN server. For example, [here is a command](https://github.com/adonisjs-community/polls-app/blob/main/commands/PublishAssets.ts) we use to publish the assets to an Amazon S3 bucket.

### Using Nginx to deliver static assets

Another option is to offload the task of serving assets to Nginx. If you use Vite to compile the front-end assets, you must aggressively cache all the static files since they are fingerprinted.

Add the following block to your Nginx config file. **Make sure to replace the values inside the angle brackets `<>`**.

```nginx
location ~ \.(jpg|png|css|js|gif|ico|woff|woff2) {
  root <PATH_TO_ADONISJS_APP_PUBLIC_DIRECTORY>;
  sendfile on;
  sendfile_max_chunk 2m;
  add_header Cache-Control "public";
  expires 365d;
}
```

### Using AdonisJS static file server

You can also rely on the [AdonisJS inbuilt static file server](../basics/static_file_server.md) to serve the static assets from the `public` directory to keep things simple.

No additional configuration is required. Just deploy your AdonisJS application as usual, and the request for static assets will be served automatically.

:::warn
The static file server is not recommended for production use. It is best to use a CDN or Nginx to serve static assets.
:::
