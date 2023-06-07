# Schema types

## file

Validates the property to be a valid [multipart file](../../../guides/http/file-uploads.md#retrieving-uploaded-files) parsed by the bodyparser. You can also define additional options to validate the file size and the extension name.

```ts
import { schema } from '@adonisjs/core/legacy/validator'

{
  cover_image: schema.file({
    size: '2mb',
    extnames: ['jpg', 'gif', 'png'],
  }),
}
```

### Mark as optional
You can mark the property to be optional by chaining the `optional` method. The `undefined` and the `null` values are considered optional and removed from the validated object.

```ts
{
  cover_image: schema.file.optional({
    size: '2mb',
    extnames: ['jpg', 'gif', 'png'],
  })
}
```

### Mark as nullable
You can mark the property to be nullable by chaining the `nullable` method. The `nullable` fields must exist in the payload but can contain null values.

```ts
{
  cover_image: schema.file.nullable({
    size: '2mb',
    extnames: ['jpg', 'gif', 'png'],
  })
}
```

### Mark as nullable and optional
Mark the property both as `nullable` and `optional`. If the field value is undefined, it will be removed from the validated object. Otherwise, the validated value (including null) is returned.

```ts
{
  cover_image: schema.file.nullableAndOptional({
    size: '2mb',
    extnames: ['jpg', 'gif', 'png'],
  })
}
```

### Define additional rules
Currently there are NO rules available for the file schema type. However, if you were to create one, then you can pass it as the second argument.

```ts
import { schema, rules } from '@adonisjs/core/legacy/validator'

{
  cover_image: schema.file(
    {
      size: '2mb',
      extnames: ['jpg', 'gif', 'png'],
    },
    [
      // NOTE: This rule does not exists.
      rules.dimensions({ minWidth: 100, minHeight: 200 })
    ]
  ),
}
```

### Custom messages options
The `file` schema type passes the `size` and the `extnames` to custom messages.

```ts
{
  'file.size': 'The file size must be under {{ options.size }}',
  'file.extname': 'The file must have one of {{ options.extnames }} extension names',
}
```


## enum

Validates the property to be one from the available choices. The return value data type for the `enum` type is a TypeScript union.

```ts
import { schema } from '@adonisjs/core/legacy/validator'

{
  account_type: schema.enum(
    ['twitter', 'github', 'instagram'] as const
  )
}
```

![](https://res.cloudinary.com/adonis-js/image/upload/q_auto,f_auto/v1618248238/v5/literal-union-enum.jpg)

You can also make use of TypeScript enums.

```ts
enum SocialAccounts {
  TWITTER = 'twitter',
  GITHUB = 'github',
  INSTAGRAM = 'instagram',
}

{
  account_type: schema.enum(Object.values(SocialAccounts))
}
```

### Mark as optional
You can mark the property to be optional by chaining the `optional` method. The `undefined` and the `null` values are considered optional and removed from the validated object.

```ts
{
  account_type: schema.enum.optional(Object.values(SocialAccounts))
}
```

### Mark as nullable
You can mark the property to be nullable by chaining the `nullable` method. The `nullable` fields must exist in the payload but can contain null values.

```ts
{
  account_type: schema.enum.nullable(Object.values(SocialAccounts))
}
```

### Mark as nullable and optional
Mark the property both as `nullable` and `optional`. If the field value is undefined, it will be removed from the validated object. Otherwise, the validated value (including null) is returned.

```ts
{
  account_type: schema.enum.nullableAndOptional(Object.values(SocialAccounts))
}
```

### Define additional rules
You can define an array of additional rules as the second parameter.

```ts
import { schema, rules } from '@adonisjs/core/legacy/validator'

{
  account_type: schema.enum(Object.values(SocialAccounts), [
    rules.unique({
      table: 'user_social_accounts',
      column: 'service',
    }),
  ])
}
```

### enum options as refs
If your enum options relies on the runtime values and you are using the schema caching, then you must move them to the refs.

Following is example of defining options via refs.

```ts
import { schema } from '@adonisjs/core/legacy/validator'
import { HttpContext } from '@adonisjs/core/http'

/**
 * Dummy implementation returning hardcoded list of cities
 */
function getCities(_state: string) {
  return  ['Mumbai', 'Pune', 'Nagpur']
}

export default class CreateUserValidator {
  constructor (protected ctx: HttpContext) {
  }

  // highlight-start
  public refs = schema.refs({
    cities: getCities(this.ctx.request.input('state'))
  })

  public schema = schema.create({
    city: schema.enum(this.refs.cities)
  })
  // highlight-end

  public cacheKey = this.ctx.routeKey
}
```

### enumSet
The `schema.enumSet` type is similar to the `enum` type, instead it accepts an array of one or more values.

In the following example, the user can select **one or more** skills.

```ts
{
  skills: schema.enumSet([
    'Programming',
    'Design',
    'Marketing',
    'Copy writing',
  ] as const)
}
```

### Custom messages options
The `enum` and the `enumSet` schema types passes the choices array to custom messages.

```ts
{
  'enum': 'The value must be one of {{ options.choices }}',
  'enumSet': 'The values must be one of {{ options.choices }}',
}
```


## date

Validates the property to be a valid date object or a string representing a date. The values are casted to an instance of [luxon.DateTime](https://moment.github.io/luxon/api-docs/index.html#datetime)

```ts
import { schema } from '@adonisjs/core/legacy/validator'

{
  published_at: schema.date()
}
```

You can also enforce a format for the string values by defining a valid format accepted by luxon.

```ts
{
  published_at: schema.date({
    format: 'yyyy-MM-dd HH:mm:ss',
  })
}
```

Or use the following shorthand codes for standardized date/time formats.

```ts
{
  published_at: schema.date({
    format: 'rfc2822',
  })
}

// OR
{
  published_at: schema.date({
    format: 'sql',
  })
}

// OR
{
  published_at: schema.date({
    format: 'iso',
  })
}
```

### Mark as optional
You can mark the property to be optional by chaining the `optional` method. The `undefined` and the `null` values are considered optional and removed from the validated object.

```ts
{
  published_at: schema.date.optional({
    format: 'yyyy-MM-dd HH:mm:ss',
  })
}
```

### Mark as nullable
You can mark the property to be nullable by chaining the `nullable` method. The `nullable` fields must exist in the payload but can contain null values.

```ts
{
  published_at: schema.date.nullable({
    format: 'yyyy-MM-dd HH:mm:ss',
  })
}
```

### Mark as nullable and optional
Mark the property both as `nullable` and `optional`. If the field value is undefined, it will be removed from the validated object. Otherwise, the validated value (including null) is returned.

```ts
{
  published_at: schema.date.nullableAndOptional({
    format: 'yyyy-MM-dd HH:mm:ss',
  })
}
```

### Define additional rules
You can define an array of additional rules as the second parameter.

```ts
import { schema, rules } from '@adonisjs/core/legacy/validator'

{
  published_at: schema.date({}, [
    rules.after('today'),
    rules.before(10, 'days'),
  ])
}
```


## number

Validates the property to be a valid number. The string representation of a number will be casted to a number data type. For example: `"22"` becomes `22`.

```ts
import { schema } from '@adonisjs/core/legacy/validator'

{
  marks: schema.number()
}
```

### Mark as optional
You can mark the property to be optional by chaining the `optional` method. The `undefined` and the `null` values are considered optional and removed from the validated object.

```ts
{
  marks: schema.number.optional()
}
```

### Mark as nullable
You can mark the property to be nullable by chaining the `nullable` method. The `nullable` fields must exist in the payload but can contain null values.

```ts
{
  marks: schema.number.nullable()
}
```

### Mark as nullable and optional
Mark the property both as `nullable` and `optional`. If the field value is undefined, it will be removed from the validated object. Otherwise, the validated value (including null) is returned.

```ts
{
  marks: schema.number.nullableAndOptional()
}
```

### Define additional rules
You can define an array of additional rules as the first parameter.

```ts
import { schema, rules } from '@adonisjs/core/legacy/validator'

{
  marks: schema.number([
    rules.unsigned(),
    rules.range(10, 100),
  ])
}
```

## string

Validates the property to be a valid string.

```ts
import { schema } from '@adonisjs/core/legacy/validator'

{
  title: schema.string()
}
```

### Mark as optional
You can mark the property to be optional by chaining the `optional` method. The `undefined` and the `null` values are considered optional and removed from the validated object.

```ts
{
  title: schema.string.optional()
}
```

### Mark as nullable
You can mark the property to be nullable by chaining the `nullable` method. The `nullable` fields must exist in the payload but can contain null values.

```ts
{
  title: schema.string.nullable()
}
```

### Mark as nullable and optional
Mark the property both as `nullable` and `optional`. If the field value is undefined, it will be removed from the validated object. Otherwise, the validated value (including null) is returned.

```ts
{
  title: schema.string.nullableAndOptional()
}
```

### Define additional rules
You can define an array of additional rules as the second parameter.

```ts
import { schema, rules } from '@adonisjs/core/legacy/validator'

{
  title: schema.string([
    rules.alpha(),
    rules.minLength(10),
    rules.maxLength(200),
    rules.trim(),
    rules.escape(),
  ])
}
```

## boolean

Validates the property to be a valid boolean. The string and numeric representations of a boolean are casted to a valid boolean value.

- `"1"`, `1`, `"true"` are casted to `true`
- `"0"`, `0`, `"false"` are casted to `false`

Additionally, we also cast `"on"` to `true` and `"off"` to `false` as these are values the server receives for the HTML checkbox input.

```ts
import { schema } from '@adonisjs/core/legacy/validator'

{
  accepted: schema.boolean()
}
```

### Mark as optional
You can mark the property to be optional by chaining the `optional` method. The `undefined` and the `null` values are considered optional and removed from the validated object.

```ts
{
  accepted: schema.boolean.optional()
}
```

### Mark as nullable
You can mark the property to be nullable by chaining the `nullable` method. The `nullable` fields must exist in the payload but can contain null values.

```ts
{
  accepted: schema.boolean.nullable()
}
```

### Mark as nullable and optional
Mark the property both as `nullable` and `optional`. If the field value is undefined, it will be removed from the validated object. Otherwise, the validated value (including null) is returned.

```ts
{
  accepted: schema.boolean.nullableAndOptional()
}
```

### Define additional rules
Currently there are no rules for the boolean schema type. However, if you were to create one, then you can pass it as the first argument.

```ts
import { schema, rules } from '@adonisjs/core/legacy/validator'

{
  title: schema.boolean([
    rules.myCustomRuleForBooleanType(),
  ])
}
```

## array

Validates the property to be an array. Further you can define the shape of the array elements using the `array.members()` method.

In the following example, the `tags` property accepts an array of numbers.

```ts
import { schema } from '@adonisjs/core/legacy/validator'

{
  tags: schema.array().members(schema.number())
}

// Valid data: [1, 3, 8, 11, 22]
```

Following is an example of accepting an array of objects with `username` and the `email` properties.

```ts
{
  users: schema.array().members(
    schema.object().members({
      username: schema.string(),
      email: schema.string(),
    })
  ),
}

// Valid data: [{ username: 'virk', email: 'virk@adonisjs.com' }]
```

### Mark as optional
You can mark the property to be optional by chaining the `optional` method. The `undefined` and the `null` values are considered optional and removed from the validated object.

```ts
{
  tags: schema.array
    .optional([// 👈
      rules.minLength(1)
    ])
    .members(schema.number())
}
```

### Mark as nullable
You can mark the property to be nullable by chaining the `nullable` method. The `nullable` fields must exist in the payload but can contain null values.

```ts
{
  tags: schema.array
    .nullable([// 👈
      rules.minLength(1)
    ])
    .members(schema.number())
}
```

### Mark as nullable and optional
Mark the property both as `nullable` and `optional`. If the field value is undefined, it will be removed from the validated object. Otherwise, the validated value (including null) is returned.

```ts
{
  tags: schema.array
    .nullableAndOptional([// 👈
      rules.minLength(1)
    ])
    .members(schema.number())
}
```

### Validating array length
You can validate the array length by using the `minLength` and the `maxLength` rules. In the following example, we accept a minimum of 1 and a maximum of 5 tags.

```ts
{
  tags: schema
    .array([
      rules.minLength(1),
      rules.maxLength(5)
    ])
    .members(schema.number()),  
}
```

### Accept any elements
You can also define an array that accepts any elements. The array elements are not further validated to have a specific type.

```ts
{
  themeOptions: schema.array().anyMembers()
}
```


## object

Validates to the property to a valid object. Further you can define the shape of the object properties using the `object.members()` method.

In the following example, we expect the `profile` to be an object with the `username` and the `avatar_url` properties.

```ts
import { schema } from '@adonisjs/core/legacy/validator'

{
  profile: schema.object().members({
    username: schema.string(),
    avatar_url: schema.string()
  })
}

// Valid data: { profile: { username: 'virk', avatar_url: 'somefile.jpg' } }
```

### Mark as optional
You can mark the property to be optional by chaining the `optional` method. The `undefined` and the `null` values are considered optional and removed from the validated object.

```ts
{
  profile: schema.object
    .optional() // 👈
    .members({
      username: schema.string(),
      avatar_url: schema.string()
    })
}
```

### Mark as nullable
You can mark the property to be nullable by chaining the `nullable` method. The `nullable` fields must exist in the payload but can contain null values.

```ts
{
  profile: schema.object
    .nullable() // 👈
    .members({
      username: schema.string(),
      avatar_url: schema.string()
    })
}
```

### Mark as nullable and optional
Mark the property both as `nullable` and `optional`. If the field value is undefined, it will be removed from the validated object. Otherwise, the validated value (including null) is returned.

```ts
{
  profile: schema.object
    .nullableAndOptional() // 👈
    .members({
      username: schema.string(),
      avatar_url: schema.string()
    })
}
```

### Accept any elements
You can also define an object that accepts any properties. The object properties are not further validated to have a specific type.

```ts
{
  colors: schema.object().anyMembers()
}
```
