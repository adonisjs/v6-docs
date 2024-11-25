---
summary: Learn about container services and how they help in keeping your codebase clean and testable.
---

# Container services

As we discussed in the [IoC container guide](./dependency_injection.md#container-bindings), the container bindings are one of the primary reasons for the IoC container to exists in AdonisJS.

Container bindings keep your codebase clean from boilerplate code required to construct objects before they can be used.

In the following example before you can use the `Database` class, you will have to create an instance of it. Depending the class you are constructing, you might have write a lot of boilerplate code to get all of its dependencies.

```ts
import { Database } from '@adonisjs/lucid'
export const db = new Database(
  // inject config and other dependencies
)
```

However, when using an IoC container, you can offload the task of constructing a class to the container and fetch a pre-built instance.

```ts
import app from '@adonisjs/core/services/app'
const db = await app.container.make('lucid.db')
```

## The need for container services

Using the container to resolve pre-configured objects is great. However, using the `container.make` method has its own downsides.

- Editors are good with auto imports. If you attempt to use a variable and the editor can guess the import path of the variable, then it will write the import statement for you. **However, this cannot work with `container.make` calls.**

- Using a mix of import statements and `container.make` calls feels unintuitive compared to having a unified syntax for importing/using modules.

To overcome these downsides, we wrap `container.make` calls inside a regular JavaScript module, so you can fetch them using the `import` statement.

For example, the `@adonisjs/lucid` package has a file called `services/db.ts` and this file has roughly the following contents.

```ts
const db = await app.container.make('lucid.db')
export { db as default }
```

Within your application, you can replace the `container.make` call with an import pointing to the `services/db.ts` file.

```ts
// delete-start
import app from '@adonisjs/core/services/app'
const db = await app.container.make('lucid.db')
// delete-end
// insert-start
import db from '@adonisjs/lucid/services/db'
// insert-end
```

As you can see, we are still relying on the container to resolve an instance of the Database class for us. However, with a layer of indirection, we can replace the `container.make` call with a regular `import` statement.

**The JavaScript module wrapping the `container.make` calls is known as a Container service.** Almost every package that interacts with the container ships with one or more container services.

## Container services vs. Dependency injection

Container services are an alternative to dependency injection. For example, instead of accepting the `Disk` class as a dependency, you ask the `drive` service to give you a disk instance. Let's look at some code examples.

In the following example, we use the `@inject` decorator to inject an instance of the `Disk` class.

```ts
import { Disk } from '@adonisjs/drive'
import { inject } from '@adonisjs/core'

  // highlight-start
@inject()
export class PostService {
  constructor(protected disk: Disk) {
  }
  // highlight-end  

  async save(post: Post, coverImage: File) {
    const coverImageName = 'random_name.jpg'

    // highlight-start
    await this.disk.put(coverImageName, coverImage)
    // highlight-end
    
    post.coverImage = coverImageName
    await post.save()
  }
}
```

When using the `drive` service, we call the `drive.use` method to get an instance of `Disk` with `s3` driver.

```ts
import drive from '@adonisjs/drive/services/main'

export class PostService {
  async save(post: Post, coverImage: File) {
    const coverImageName = 'random_name.jpg'

    // highlight-start
    const disk = drive.use('s3')
    await disk.put(coverImageName, coverImage)
    // highlight-end
    
    post.coverImage = coverImageName
    await post.save()
  }
}
```

Container services are great for keeping your code terse. Whereas, dependency injection creates a loose coupling between different application parts.

Choosing one over the other comes down to your personal choice and the approach you want to take to structure your code.

## Testing with container services

The outright benefit of dependency injection is the ability to swap dependencies at the time of writing tests.

To provide a similar testing experience with container services, AdonisJS provides first-class APIs for faking implementations when writing tests.

In the following example, we call the `drive.fake` method to swap drive disks with an in-memory driver. After a fake is created, any call to the `drive.use` method will receive the fake implementation.

```ts
import drive from '@adonisjs/drive/services/main'
import { PostService } from '#services/post_service'

test('save post', async ({ assert }) => {
  /**
   * Fake s3 disk
   */
  drive.fake('s3')
 
  const postService = new PostService()
  await postService.save(post, coverImage)
  
  /**
   * Write assertions
   */
  assert.isTrue(await drive.use('s3').exists(coverImage.name))
  
  /**
   * Restore fake
   */
  drive.restore('s3')
})
```

## Container bindings and services

The following table outlines a list of container bindings and their related services exported by the framework core and first-party packages.

<table>
  <thead>
    <tr>
      <th width="100px">Binding</th>
      <th width="140px">Class</th>
      <th>Service</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <code>app</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/application/blob/main/src/application.ts">Application</a>
      </td>
      <td>
        <code>@adonisjs/core/services/app</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>ace</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/core/blob/main/modules/ace/kernel.ts">Kernel</a>
      </td>
      <td>
        <code>@adonisjs/core/services/kernel</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>config</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/config/blob/main/src/config.ts">Config</a>
      </td>
      <td>
        <code>@adonisjs/core/services/config</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>encryption</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/encryption/blob/main/src/encryption.ts">Encryption</a>
      </td>
      <td>
        <code>@adonisjs/core/services/encryption</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>emitter</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/events/blob/main/src/emitter.ts">Emitter</a>
      </td>
      <td>
        <code>@adonisjs/core/services/emitter</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>hash</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/hash/blob/main/src/hash_manager.ts">HashManager</a>
      </td>
      <td>
        <code>@adonisjs/core/services/hash</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>logger</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/logger/blob/main/src/logger_manager.ts">LoggerManager</a>
      </td>
      <td>
        <code>@adonisjs/core/services/logger</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>repl</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/repl/blob/main/src/repl.ts">Repl</a>
      </td>
      <td>
        <code>@adonisjs/core/services/repl</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>router</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/http-server/blob/main/src/router/main.ts">Router</a>
      </td>
      <td>
        <code>@adonisjs/core/services/router</code>
      </td>
    </tr>
    <tr>
      <td>
        <code>server</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/http-server/blob/main/src/server/main.ts">Server</a>
      </td>
      <td>
        <code>@adonisjs/core/services/server</code>
      </td>
    </tr>
    <tr>
      <td>
        <code> testUtils</code>
      </td>
      <td>
        <a href="https://github.com/adonisjs/core/blob/main/src/test_utils/main.ts">TestUtils</a>
      </td>
      <td>
        <code>@adonisjs/core/services/test_utils</code>
      </td>
    </tr>
  </tbody>
</table>
