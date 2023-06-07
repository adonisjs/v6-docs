# Config

The configuration files of your AdonisJS application are stored inside the `config` directory. A brand new AdonisJS application comes with a handful of pre-existing files used by the framework core and installed packages.

Feel free to create additional files required by your application inside the `config` directory.


:::note

We recommend you to use [environment variables](./env.md) for storing secrets and environment-specific configuration.


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
```

There are no direct benefits of using the config service over importing config files. However, the config service is the only choice to read configuration in external packages and edge templates.

### Reading config inside service providers

If creating an external package, you should use the config service inside service providers to read the config from a certain file. For example:

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

You can use the `config.has` method to check if a configuration value exists for a given key. The method returns `false`, if the value is `undefined`.

```edge
@if(config.has('app.appUrl'))
  <a href="{{ config('app.appUrl') }}"> Home </a>
@else
  <a href="/"> Home </a>
@end
```

## Changing the config location

You can update the location for the config directory by modifying the `.adonisrc.json` file. After the change, the config files will be imported from the new location.

```json
"directories": {
  "config": "./configurations"
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

For example, the application will fail to start if you try to import and use the router service inside the `config/app.ts` file. This is because the router service is not configured until the app is in `booted` state.

Fundamentally, this limitation positively impacts your codebase because the application code should rely on the config and not the other way around.

## Updating config at runtime

You can mutate the config values at runtime using the config service. The `config.set` updates the value within the memory, and no changes are made to the files on the disk.

```ts
import env from '#start/env'
import config from '@adonisjs/core/services/config'

const HOST = env.get('HOST')
const PORT = env.get('PORT')

config.set('app.appUrl', `http://${HOST}:${PORT}`)
```
