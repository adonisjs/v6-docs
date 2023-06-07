# Package development

Packages are the primary source of adding new functionality to AdonisJS applications. A package can be a generic library like `lodash` or `luxon` or a package created specifically to work with AdonisJS.

AdonisJS packages are no different from a standard Node.js package published on npm. However, it may provide extra functionality that works only inside an AdonisJS application.

In this guide, we will cover the complete lifecycle of creating and publishing a package. Also, you will learn how to register routes, and export middleware, controllers, or database migrations from a package.

## A note on loosely coupled source code

When creating a package, make sure your package is not tightly coupled with the application runtime. For example, if your package needs `Drive`, you must accept it via Dependency injection instead of importing the `drive` service.

In the following example, the `image_resizer.ts` file imports the `drive` service to persist the resized files. 

However, the container services are only available if you boot an AdonisJS application. In the case of a package, you do not have an app; therefore, the following code will result in an error.

```ts
// title: src/image_resizer.ts
import drive from '@adonisjs/drive/services/main'

export default class ImageResizer {
  #diskName: string
  constructor(diskName: string) {
    this.#diskName = diskName
  }

  async resize() {
    await drive.use(this.#diskName).put()
  }
}
```

A better way to organize the `image_resizer.ts` module is to accept drive `Disk` as a constructor dependency. As a result, the `ImageResizer` class will be loosely coupled. 

- During tests, you can manually create an instance of `Disk` and give it to the class
- When this class is accessed inside an application, you may use the container to provide an instance of Disk.

```ts
// delete-start
import drive from '@adonisjs/drive/services/main'
// delete-end
// insert-start
import { Disk } from '@adonisjs/drive'
// insert-end

export default class ImageResizer {
  // delete-start
  #diskName: string
  constructor(diskName: string) {
    this.#diskName = diskName
  }
  // delete-end
  // insert-start
  #disk: Disk
  constructor(disk: Disk) {
    this.#disk = disk
  }
  // insert-end

  async resize() {
    // delete-start
    await drive.use(this.#diskName).put()
    // delete-end
    // insert-start
    await this.#disk.put()
    // insert-end
  }
}
```

As a rule of thumb, ensure you never import [container services](./container_services.md) inside your package. Instead, use Dependency injection to accept dependencies. 

## Creating a new package

You may create a new package using the [create-adonisjs]() initializer package and specify the starter kit the initializer should use via the `-K` flag.


See also: [Package starter kit README file](https://github.com/adonisjs/pkg-starter-kit)


:::codegroup

```sh
// title: npm
npm init adonisjs@latest my-package -- -K "adonisjs/pkg-starter-kit"
```

```sh
// title: yarn
yarn create adonisjs@latest my-package -- -K "adonisjs/pkg-starter-kit"
```

```sh
// title: pnpm
pnpm create adonisjs@latest my-package -- -K "adonisjs/pkg-starter-kit"
```


:::

Once the package directory structure is created, you may `cd` into the newly created directory and run the example test.

```sh
npm run test
```

You may create the distribution build using the `build` command.

```sh
npm run build
```

### Using the package locally

## Using service providers


:::note

Feel free to consult the service providers of official packages for inspiration.

:::

Service providers act as a bridge between your package and the end-user application. You may use them to perform a variety of tasks including, registering bindings into the container, defining routes, configuring middleware and so on.

The service providers are stored within the `providers` directory of your package. You may use the `make:provider` command to create a provider file.

See also: [Service providers guide](./service_providers.md)

```sh
npx adonis-kit make:provider MyPackageProvider
```

## Exporting middleware

## Exporting controllers

## Exporting commands

## Defining routes

## Extending the framework

## Contributing drivers

## Registering bindings inside the container