# Deployment

Deploying an AdonisJS application is no different than deploying a standard Node.js application. You need a server running `Node.js >= 18.x` along with `npm` to install production dependencies.

This guide will cover the generic guidelines to deploy and run an AdonisJS application in production. In addition, you can read the following articles covering step by step deployment process for a specific platform.

## Creating production build

As a first step, you must create the production build of your AdonisJS application by running the `build` command.

See also: [TypeScript build process](../../concepts/typescript_build_process.md)

```sh
node ace build --production
```

The compiled output is written inside the `./build` directory. If you use Vite, its output will be written inside the `./build/public` directory.

Once you have created the production build, you may copy the `./build` folder to your production server. **From now on, the build folder will be the root of your application**.

## Configuring a reverse proxy

Node.js applications are usually [deployed behind a reverse proxy](https://medium.com/intrinsic-blog/why-should-i-use-a-reverse-proxy-if-node-js-is-production-ready-5a079408b2ca) server like Nginx. So the incoming traffic on ports `80` and `443` will be handled by Nginx first and then forwarded to your Node.js application.

Following is an example Nginx config file you may use as the starting point.

:::warning

Make sure to replace the values inside the angle brackets `<>`.

:::

```nginx
server {
  listen 80;

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

If you are using a deployment platform like Heroku or Cleavr, you may use their control panel to define the environment variables. 

However, if you are deploying your application on a bare-bone server like a Digital Ocean droplet or EC2, you may first create a `.env` file on the server. Ensure the file is stored securely and only authorized users can access it.

Assuming you have created the `.env` file in the `/etc/secrets` directory, you must start your production server as follows.

The `ENV_PATH` environment variable instructs AdonisJS to look for the `.env` file inside the mentioned directory.

```sh
ENV_PATH=/etc/secrets node server.js
```

## Starting the production server

You may start the production server by running the `node server.js` file. However, it is recommended to use a process manager like [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/).

- PM2 will run your application in background without blocking the current terminal session.
- It will restart the application, if your app crashes while serving requests.
- Also, PM2 makes it super simple to run your application in [cluster mode](https://nodejs.org/api/cluster.html#cluster)

Following is an example [pm2 ecosystem file](https://pm2.keymetrics.io/docs/usage/application-declaration/) you may use as the starting point.

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

## Writing logs

## Persistent storage for file uploads

## Caching templates

## Serving static assets
