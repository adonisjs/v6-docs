# Folder structure

In this guide, we will take a tour of the important files and folders created by AdonisJS during the installation process. 

We ship with a thoughtful default folder structure that helps you keep your projects tidy and easy to refactor. However, you have all the freedom to diverge and have a folder structure that works great for your team and project.

## The `adonisrc.ts` file

The `adonisrc.ts` file is used to configure the workspace and some of the runtime settings of your application.

In this file, you can register providers, define command aliases, or specify the files to copy to the production build.

See also: [AdonisRC file reference guide](../concepts/rc_file)

## The `tsconfig.json` file

The `tsconfig.json` file stores the TypeScript configuration for your application. Feel free to make changes to this file as per your project or team's requirements.

The following configuration options are required for AdonisJS internals to work correctly.

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "isolatedModules": true,
    "declaration": false,
    "outDir": "./build",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true
  }
}
``` 

## The sub-path imports

AdonisJS uses the [sub-path imports](https://nodejs.org/dist/latest-v19.x/docs/api/packages.html#subpath-imports) feature from Node.js to define the import aliases. 

The following import aliases are pre-configured within the `package.json` file. Feel free to add new aliases or edit the existing ones.

```json
// title: package.json
{
  "imports": {
    "#controllers/*": "./app/controllers/*.js",
    "#exceptions/*": "./app/exceptions/*.js",
    "#models/*": "./app/models/*.js",
    "#mails/*": "./app/mails/*.js",
    "#services/*": "./app/services/*.js",
    "#listeners/*": "./app/listeners/*.js",
    "#events/*": "./app/events/*.js",
    "#middleware/*": "./app/middleware/*.js",
    "#validators/*": "./app/validators/*.js",
    "#providers/*": "./app/providers/*.js",
    "#policies/*": "./app/policies/*.js",
    "#abilities/*": "./app/abilities/*.js",
    "#database/*": "./database/*.js",
    "#tests/*": "./tests/*.js",
    "#start/*": "./start/*.js",
    "#config/*": "./config/*.js"
  }
}
```

In order for code editors to autocomplete imports using import aliases, you will have to re-define the same aliases inside `tsconfig.json` file as well. We hope, the editors will soon catchup and rely on `package.json` as the single source of truth for aliases.

```json
// title: tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "#controllers/*": ["./app/controllers/*.js"],
      "#exceptions/*": ["./app/exceptions/*.js"],
      "#models/*": ["./app/models/*.js"],
      "#mails/*": ["./app/mails/*.js"],
      "#services/*": ["./app/services/*.js"],
      "#listeners/*": ["./app/listeners/*.js"],
      "#events/*": ["./app/events/*.js"],
      "#middleware/*": ["./app/middleware/*.js"],
      "#validators/*": ["./app/validators/*.js"],
      "#providers/*": ["./app/providers/*.js"],
      "#policies/*": ["./app/policies/*.js"],
      "#abilities/*": ["./app/abilities/*.js"],
      "#database/*": ["./database/*.js"],
      "#tests/*": ["./tests/*.js"],
      "#start/*": ["./start/*.js"],
      "#config/*": ["./config/*.js"]
    }
  }
}
```

## The `bin` directory

The `bin` directory has the entry point files to load your application in a specific environment. For example:

- The `bin/server.ts` file boots the application in the web environment to listen for HTTP requests. 
- The `bin/console.ts` file boots the Ace commandline and executes commands.
- The `bin/test.ts` file boots the application to run tests.

## The `ace.js` file

The `ace` file boots the command-line framework that is local to your app. So every time you run an ace command, it goes through this file.

If you notice, the ace file ends with a `.js` extension. This is because we want to run this file using the `node` binary without compiling it.

## The `app` directory

The `app` directory organizes code for the domain logic of your application. For example, the controllers, models, services, etc., all live within the `app` directory.

Feel free to create additional directories to better organize your application code.

```
├── app
│  └── controllers
│  └── exceptions
│  └── middleware
│  └── models
│  └── validators
```


## The `resources` directory

The `resources` directory contains the Edge templates, alongside the source files of your frontend code. In other words, the code for the presentation layer of your app lives within the `resources` directory.

```
├── resources
│  └── views
│  └── js
│  └── css
│  └── fonts
│  └── images
```

## The `start` directory

The `start` directory contains the files you want to import during the boot lifecycle of the application. For example, the files to register routes and define event listeners should live within the `start` directory.

```
├── start
│  ├── env.ts
│  ├── kernel.ts
│  ├── routes.ts
│  ├── validator.ts
│  ├── events.ts
```

AdonisJS does not auto-import files from the `start` directory. It is merely used as a convention to group similar files.

We recommend reading about [preload files](../concepts/rc_file#preloads) and the [application boot lifecycle](../concepts/application_lifecycle.md) to have a better understanding of which files to keep under the `start` directory.

## The `public` directory

The `public` directory hosts static assets like CSS files, images, fonts, or the frontend JavaScript.

Do not confuse the `public` directory with the `resources` directory. The resources directory contains the source code of your frontend application, and the public directory has the compiled output.

When using Vite, you should store the frontend assets inside the `resources/<SUB_DIR>` directories and let the Vite compiler create the output in the `public` directory.

On the other hand, if you are not using Vite, you can create files directly inside the `public` directory and access them using the filename. For example, you can access the `./public/style.css` file from the `http://localhost:3333/style.css` URL.

## The `database` directory

The `database` directory contains files for database migrations and seeders. 

```
├── database
│  └── migrations
│  └── seeders
```


## The `commands` directory

The [ace commands](../ace/introduction.md) are stored within the `commands` directory. You can create commands inside this folder by running `node ace make:command`.


## The `config` directory

The `config` directory contains the runtime configuration files for your application.

The framework's core and other installed packages read configuration files from this directory. You can also store config local to your application inside this directory.

Learn more about [configuration management](../../getting-started/configuration).

```
├── config
│  ├── app.ts
│  ├── bodyparser.ts
│  ├── cors.ts
│  ├── database.ts
│  ├── drive.ts
│  ├── hash.ts
│  ├── logger.ts
│  ├── session.ts
│  ├── static.ts
```


## The `types` directory

The `types` directory is the house for the TypeScript interfaces or types used within your application. 

The directory is empty by default, however, you can create files and folders within the `types` directory to define custom types and interfaces.

```
├── types
│  ├── events.ts
│  ├── container.ts
```

## The `providers` directory

The `providers` directory is used to store the [service providers](../concepts/service_providers.md) used by your application. You can create new providers using the `node ace make:provider` command.

Learn more about [service providers](../concepts/service_providers.md)

```
├── providers
│  └── app_provider.ts
│  └── http_server_provider.ts
```

## The `tmp` directory

The temporary files generated by your application are stored within the `tmp` directory. For example, these could be user-uploaded files (generated during development) or logs written to the disk.

The `tmp` directory must be ignored by the `.gitignore` rules, and you should not copy it to the production server either.

## The `tests` directory

The `tests` directory organizes your application tests. Further, sub-directories are created for `unit` and `functional` tests.

See also: [Testing](../testing/introduction.md)

```
├── tests
│  ├── bootstrap.ts
│  └── functional
│  └── regression
│  └── unit
```
