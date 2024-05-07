# Schema 101

The validation schema defines the shape and the format of the data you expect at the time of validation. We have divided the validation schema into three parts, i.e.

- **The shape of the data** is defined using the `schema.create` method.
- **The data type for fields** is defined using the schema methods like `schema.string`, `schema.boolean` and so on.
- **The format and other constraints** are applied using the rules like `rules.email`, `rules.minLength` or `rules.unique`.

pika-1675149043774-1x.jpeg

## Creating schemas

The validation schema is created using the `schema.create` method. The method accepts a key-value pair, where the key is the field name to validate and the value is validation rules for the field.

```ts
const registerUserSchema = schema.create({
  username: schema.string()
})
```

The `schema.create` method enforces you to begin validation with a top-level object. It means, you cannot accept an array or a boolean as the top level value in request body, which generally is not considered as a good practice.

## Nullable and optional modifiers

Throughout this guide, you will find examples using the `nullable`, `optional` and the `nullableAndOptional` modifiers. These modifiers are used to mark fields as optional or null.

- By default, all the fields are required and you can mark them optional using the `optional` modifier.
- The `optional` modifier means, treat both the `null` and the `undefined` values as the same.
- The `nullable` modifier means, the value should be present, but it can be null.
- The `nullableAndOptional` modifier means, the value can be `null` or it can be `undefined`, but it should be considered as two different values.

These modifiers allows you to have fine-grained control over the validation layer, especially when you are creating an API server that allows patching resources through the `PATCH` request.

Let's explore some examples schema using all the modifier. Do pay a closer look at the return values to better understand the modifier impact.

#### Schema with `nullable` modifier

The return value will either be `null` or `string`. Sending `undefined` value will result in an error.

```ts
```

#### Schema with `optional` modifier

The return value will either be `undefined` or `string`. If the request payload has `null` value, the validator will convert it to `undefined`.

```ts
```

#### Schema with `nullableAndOptional` modifier

The return value can be `null`, `undefined`, or `string`. The validator does not perform any transformations with this modifier.

```ts
```


## Schema types

Following is the list of available schema types supported by the AdonisJS validator. Read the [extending schema]() guide to add support for additional data types

```ts
schema.boolean()
schema.string.optional()
schema.string.nullable()
schema.string.nullableAndOptional()

schema.number()
schema.string.optional()
schema.string.nullable()
schema.string.nullableAndOptional()

schema.array().members()
schema.string.optional()
schema.string.nullable()
schema.string.nullableAndOptional()

schema.object().members()
schema.string.optional()
schema.string.nullable()
schema.string.nullableAndOptional()

schema.enum()
schema.string.optional()
schema.string.nullable()
schema.string.nullableAndOptional()

schema.enumSet()
schema.string.optional()
schema.string.nullable()
schema.string.nullableAndOptional()
```

### `schema.string`

Enforces the value under validation to be a string. 

```ts
import { schema } from '@adonisjs/core/validator'

schema.create({
  username: schema.string()
})
```

#### With modifiers

```ts
{
  username: schema.string()
}

{
  username: schema.string.optional()
}

{
  username: schema.string.nullable()
}

{
  username: schema.string.nullableAndOptional()
}
```

You can pass an array of rules as the first parameter.

```ts
import { schema, rules } from '@adonisjs/core/validator'

schema.create({
  username: schema.string([
    rules.alpha(),
    rules.minLength(10),
    rules.maxLength(200),
    rules.trim(),
    rules.escape(),    
  ])
})
```

### `schema.number`

Validates the property to be a valid number. The string representation of a number will be casted to a number data type. For example: `"22"` will become `22`.

```ts
import { schema } from '@adonisjs/core/validator'

schema.create({
  age: schema.number()
})
```

#### With modifiers

```ts
{
  age: schema.number()
}

{
  age: schema.number.optional()
}

{
  age: schema.number.nullable()
}

{
  age: schema.number.nullableAndOptional()
}
```

You can pass an array of rules as the first parameter.

```ts
import { schema, rules } from '@adonisjs/core/validator'

schema.create({
  age: schema.number([
    rules.unsigned(),
    rules.range(10, 100),
  ])
})
```

### `schema.boolean`

Validates the property to be a valid boolean. The string and numeric representations of a boolean are casted to a boolean data type.

- `"1"`, `1`, and `"true"` values are casted to `true`.
- `"0"`, `0`, and `"false"` values are casted to `false`.

```ts
import { schema } from '@adonisjs/core/validator'

{
  accepted: schema.boolean()
}
```

#### With modifiers

```ts
{
  accepted: schema.boolean()
}

{
  accepted: schema.boolean.optional()
}

{
  accepted: schema.boolean.nullable()
}

{
  accepted: schema.boolean.nullableAndOptional()
}
```

Currently, there are no inbuilt rules for the boolean schema type. However, if you were to create one, then you can pass it as the first argument.

```ts
{
  title: schema.boolean([
    rules.myCustomCheck(),
  ])
}
```

### `schema.array`

The `schema.array` method is used to accept an array of values. You can define the shape of the array items using the `.members` method.

In the following example, we accept an array of numbers.

```ts
import { schema } from '@adonisjs/core/validator'

{
  tags: schema.array().members(
    schema.number()
  )
}
```

#### With modifiers

```ts
{
  tags: schema.array().members(
    schema.number()
  )
}

{
  tags: schema.array.optional().members(
    schema.number()
  )
}

{
  tags: schema.array.nullable().members(
    schema.number()
  )
}

{
  tags: schema.array.nullableAndOptional().members(
    schema.number()
  )
}
```

#### Validating array length

By default, an empty array passes the validation. If you want the array to have minimum one item, then you can use the `minLength` rule.

```ts
import { schema, rules } from '@adonisjs/core/validator'

{
  tags: schema
    .array([
      rules.minLength(1)
    ])
    .members(
      schema.number()
    )
}
```

#### Accepting any members

You can turn off the validation of array members using the `.anyMembers` method.

```ts
import { schema } from '@adonisjs/core/validator'

{
  colors: schema.array().anyMembers()
}
```

### `schema.object`

The `schema.object` method ensures the property is a valid object. You can validate the object properties using the `.members` method.

In the following example, we expect the profile to be an object with `username` and `avatar_url` properties.

```ts
import { schema } from '@adonisjs/core/validator'

{
  profile: schema.object().members({
    username: schema.string(),
    avatar_url: schema.string()
  })
}
```

#### With modifiers

```ts
{
  profile: schema.object().members({
    username: schema.string(),
    avatar_url: schema.string()
  })
}

{
  profile: schema.object.optional().members({
    username: schema.string(),
    avatar_url: schema.string()
  })
}

{
  profile: schema.object.nullable().members({
    username: schema.string(),
    avatar_url: schema.string()
  })
}

{
  profile: schema.object.nullableAndOptional().members({
    username: schema.string(),
    avatar_url: schema.string()
  })
}
```

### Accepting any properties

You can define an object that accepts any properties using the `anyMembers` method.

```ts
{
  themeOptions: schema.object().anyMembers()
}
```

### `schema.enum`

Validates the property to be one from the available choices. 

```ts
import { schema } from '@adonisjs/core/validator'

{
  account_type: schema.enum(['twitter', 'github', 'instagram'])
}
```

You can also specify enum values using the TypeScript `enum` type.

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

#### With modifiers

```ts
{
  account_type: schema.enum(
    Object.values(SocialAccounts)
  )
}

{
  account_type: schema.enum.optional(
    Object.values(SocialAccounts)
  )
}

{
  account_type: schema.enum.nullable(
    Object.values(SocialAccounts)
  )
}

{
  account_type: schema.enum.nullableAndOptional(
    Object.values(SocialAccounts)
  )
}
```

#### Defining additional rules

You can specify additional validation rules as the second parameter.

```ts
import { schema, rules } from '@adonisjs/core/validator'

{
  account_type: schema.enum(Object.values(SocialAccounts), [
    rules.unique({
      table: 'user_social_accounts',
      column: 'service',
    }),
  ])
}
```