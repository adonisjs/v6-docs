---
summary: Learn how to read and update configuration values in AdonisJS.
---

# Configuration

The configuration files of your AdonisJS application are stored inside the `config` directory. A brand new AdonisJS application comes with a handful of pre-existing files used by the framework core and installed packages.

Feel free to create additional files your application requires inside the `config` directory.


:::note

We recommend using [environment variables](environment_variables) for storing secrets and environment-specific configuration.


:::

## Importing config files

You may import the configuration files within your application codebase using the standard JavaScript `import` statement. For example:

```ts
import { appKey } from '#config/app'
```

```ts
import databaseConfig from '#config/database'
```

## Using the config service

The config service offers an alternate API for reading the configuration values. In the following example, we use the config service to read the `appKey` value stored within the `config/app.ts` file.

```ts
import config from '@adonisjs/core/services/config'

config.get('app.appKey')
config.get('app.http.cookie') // read nested values
```

The `config.get` method accepts a dot-separated key and parses it as follows.

- The first part is the filename from which you want to read the values. I.e., `app.ts` file.
- The rest of the string fragment is the key you want to access from the exported values. I.e., `appKey` in this case.

## Config service vs. directly importing config files

Using the config service over directly importing the config files has no direct benefits. However, the config service is the only choice to read the configuration in external packages and edge templates.

### Reading config inside external packages

If you are creating a third-party package, you should not directly import the config files from the user application because it will make your package tightly coupled with the folder structure of the host application.

Instead, you should use the config service to access the config values inside a service provider. For example:

```ts
import { ApplicationService } from '@adonisjs/core/types'

export default class DriveServiceProvider {
  constructor(protected app: ApplicationService) {}
  
  register() {
    this.app.container.singleton('drive', () => {
      // highlight-start
      const driveConfig = this.app.config.get('drive')
      return new DriveManager(driveConfig)
      // highlight-end
    })
  }
}
```

### Reading config inside Edge templates

You may access configuration values inside edge templates using the `config` global method.

```edge
<a href="{{ config('app.appUrl') }}"> Home </a>
```

You can use the `config.has` method to check if a configuration value exists for a given key. The method returns `false` if the value is `undefined`.

```edge
@if(config.has('app.appUrl'))
  <a href="{{ config('app.appUrl') }}"> Home </a>
@else
  <a href="/"> Home </a>
@end
```

## Changing the config location

You can update the location for the config directory by modifying the `adonisrc.ts` file. After the change, the config files will be imported from the new location.

```ts
directories: {
  config: './configurations'
}
```

Make sure to update the import alias within the `package.json` file.

```json
{
  "imports": {
    "#config/*": "./configurations/*.js"
  }
}
```

## Config files limitations

The config files stored within the `config` directory are imported during the boot phase of the application. As a result, the config files cannot rely on the application code.

For example, if you try to import and use the router service inside the `config/app.ts` file, the application will fail to start. This is because the router service is not configured until the app is in a `booted` state.

Fundamentally, this limitation positively impacts your codebase because the application code should rely on the config, not vice versa.

## Updating config at runtime

You can mutate the config values at runtime using the config service. The `config.set` updates the value within the memory, and no changes are made to the files on the disk.

:::note

The config value is mutated for the entire application, not just for a single HTTP request. This is because Node.js is not a threaded runtime, and the memory in Node.js is shared between multiple HTTP requests.

:::

```ts
import env from '#start/env'
import config from '@adonisjs/core/services/config'

const HOST = env.get('HOST')
const PORT = env.get('PORT')

config.set('app.appUrl', `http://${HOST}:${PORT}`)
```
