# Validation rules

## afterField

Similar to the [after rule](./after.md). However, instead of defining a date/offset for comparison, you define **a field to check against**. For example:

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  checkin_date: schema.date(),
  checkout_date: schema.date({}, [
    rules.afterField('checkin_date')
  ]),
}
```

Also, you can make use of the `afterOrEqualToField` for enforcing the date to be same or after a given field.

```ts
{
  drafted_at: schema.date(),
  published_at: schema.date({}, [
    rules.afterOrEqualToField('drafted_at')
  ]),
}
```


## after

Validates the value to be after a given date/offset. **The rule can be only be used with the date schema type**.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  checkin_date: schema.date({}, [
    rules.after(2, 'days')
  ])
}
```

The `rules.after` method accepts a **duration** and the **offset** for the duration. Following are some of the examples for the same. You can use the TypeScript intellisense to discover rest of the available offsets.

```ts
rules.after(2, 'days')
rules.after(1, 'month')
rules.after(4, 'years')
rules.after(30, 'minutes')
```

You can also pass the one of the following shorthand keywords.

```ts
rules.after('today')
rules.after('tomorrow')
```

Also, you can make use of the `afterOrEqual` for enforcing the date to be same or after a given date.

```ts
{
  checkin_date: schema.date({}, [
    rules.afterOrEqual('today')
  ])
}
```

### Using Luxon dates

For more advanced use cases, you can pass an instance of the [luxon DateTime](https://moment.github.io/luxon/api-docs/index.html#datetime) object. **Do make sure to pass the value as a ref**.

```ts
// highlight-start
import { DateTime } from 'luxon'
// highlight-end
import { schema, rules } from '@ioc:Adonis/Core/Validator'

class HolidayValidator {
  // highlight-start
  public refs = schema.refs({
    allowedDate: DateTime.local().plus({ days: 2 })
  })
  // highlight-end

  public schema = schema.create({
    joining_date: schema.date({}, [
      // highlight-start
      rules.after(this.refs.allowedDate)
      // highlight-end
    ])
  })
}
```


## alphaNum

Validates the value to only have letters, numeric or both of them. **The validation rule only works with the `string` schema
type**.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  username: schema.string([
    rules.alphaNum(),
  ])
}
```

You can also allow the string to have `spaces`, `dash` and `underscore` characters.

```ts
{
  username: schema.string([
    rules.alphaNum({
      allow: ['space', 'underscore', 'dash']
    })
  ])
}
```


## alpha

Validates the value to only have letters. **The validation rule only works with the `string` schema
type**.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  username: schema.string([
    rules.alpha(),
  ])
}
```

You can also allow the string to have `spaces`, `dash` and `underscore` characters.

```ts
{
  username: schema.string([
    rules.alpha({
      allow: ['space', 'underscore', 'dash']
    })
  ])
}
```


## beforeField

Similar to the [before rule](./before.md). However, instead of defining a date/offset for comparison, you define **a field to check against**. For example:

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  checkout_date: schema.date(),
  checkin_date: schema.date({}, [
    rules.beforeField('checkout_date')
  ]),
}
```

Also, you can make use of the `beforeOrEqualToField` for enforcing the date to be same or after a given field.

```ts
{
  published_on: schema.date(),
  drafted_on: schema.date({}, [
    rules.beforeOrEqualToField('published_on')
  ]),
}
```


## before

Validates the value to be before a given date/offset. **The rule can be only be used with the date schema type**.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  joining_date: schema.date({}, [
    rules.before(2, 'days')
  ])
}
```

The `rules.before` method accepts a **duration** and the **offset** for the duration. Following are some of the examples for the same. You can use the TypeScript intellisense to discover rest of the available offsets.

```ts
rules.before(2, 'days')
rules.before(1, 'month')
rules.before(4, 'years')
rules.before(30, 'minutes')
```

You can also pass the one of the following shorthand keywords.

```ts
rules.before('today')
rules.before('yesterday')
```

Also, you can make use of the `beforeOrEqual` for enforcing the date to be same or after a given date.

```ts
{
  joining_date: schema.date({}, [
    rules.beforeOrEqual('today')
  ])
}
```

### Using Luxon dates

For more advanced use cases, you can pass an instance of the [luxon DateTime](https://moment.github.io/luxon/api-docs/index.html#datetime) object. **Do make sure to pass the value as a ref**.

```ts
// highlight-start
import { DateTime } from 'luxon'
// highlight-end
import { schema, rules } from '@ioc:Adonis/Core/Validator'

class UserValidator {
  // highlight-start
  public refs = schema.refs({
    allowedDate: DateTime.local().minus({ days: 2 })
  })
  // highlight-end

  public schema = schema.create({
    checkin_date: schema.date({}, [
      // highlight-start
      rules.before(this.refs.allowedDate)
      // highlight-end
    ])
  })
}
```


## confirmed

Enforce the field under validation is also confirmed using the `_confirmation` convention. You will mostly use this rule for password confirmation.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  password: schema.string([
    rules.confirmed()
  ])
}

/**
 Valid data: {
    password: 'secret',
    password_confirmation: 'secret'
 }
 */
```

Optionally, you can also change the field name that should be checked for the confirmation. It is usually helpful when you are not using the `snake_case` convention for the field names.

```ts
{
  password: schema.string([
    rules.confirmed('passwordConfirmation')
  ])
}

/**
 Valid data: {
    password: 'secret',
    passwordConfirmation: 'secret'
 }
 */
```

### Custom message
You can define custom message for the `confirmed` rule on confirmation field.

```ts
{
  'password_confirmation.confirmed': 'Password do not match'
}
```


## distinct

The `distinct` rule ensures that all values of a property inside an array are unique. **The validation rule only works with the `array` schema type.**

Assuming you have an array of objects, each defining a product id property and you want to ensure that no duplicates product ids are being used.

```ts
// title: Sample Data
{
  "products": [
    {
      "id": 1,
      "quantity": 4,
    },
    {
      "id": 3,
      "quantity": 10,
    },
    {
      "id": 8,
      "quantity": 1,
    }
  ]
}
```

The rule is applied on the array itself and **NOT its members**.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

// title: Validation rule
{
  products: schema
    // highlight-start
    .array([
      rules.distinct('id')
    ])
    // highlight-end
    .members(schema.object().members({
      id: schema.number(),
      quantity: schema.number(),
    }))
}
```

You can also use the distinct rule with an array of literal values by using the wildcard `*` keyword. For example:

```ts
// title: Sample Data
{
  "tags": [1, 10, 15, 8]
}
```

```ts
// title: Validation rule
{
  tags: schema
    // highlight-start
    .array([
      rules.distinct('*')
    ])
    // highlight-end
    .members(schema.number())
}
```


## email

Enforces the value to be properly formatted as an email. **The validation rule only works with the `string` schema type**.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  email: schema.string([
    rules.email()
  ])
}
```

The `email` rule uses the `validator.isEmail` method from the [validatorjs](https://www.npmjs.com/package/validator) package. You can specify all of the options accepted by the `validator.isEmail` method. Just make sure to pass them in **camelCase form**.

```ts
{
  email: schema.string([
    rules.email({
      ignoreMaxLength: true,
      allowIpDomain: true,
      domainSpecificValidation: true,
    })
  ])
}
```

### Normalize email
You can make use of the `rules.normalizeEmail` method to normalize the email address.

The `normalizeEmail` rule uses the `validator.normalizeEmail` method from the [validatorjs](https://www.npmjs.com/package/validator) package. You can specify all of the options accepted by the `validator.normalizeEmail` method. Just make sure to pass them in **camelCase form**.

```ts
{
  email: schema.string([
    rules.email(),
    rules.normalizeEmail({
      allLowercase: true,
      gmailRemoveDots: true,
      gmailRemoveSubaddress: true,
    }),
  ])
}
```


## equalTo

Validates the value to be equal to a provided value. 

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  country: schema.string({}, [
    rules.equalTo('IN')
  ])
}
```

If the provided value is computed at runtime and you are using schema caching, then you must make use of `refs`.

```ts
import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateUserValidator {
  constructor(protected ctx: HttpContextContract) {}

  // highlight-start
  public refs = schema.refs({
    teamsCountry: getTeamCountryFromSomeWhere(),
  })

  public schema = schema.create({
    country: schema.string({}, [
      rules.equalTo(this.refs.teamsCountry)
    ]),
  })
  // highlight-end

  public cacheKey = this.ctx.routeKey
}
```


## escape

The `escape` is sanitization rule to replace `<`, `>`, `&`, `'`, `"` and `/` with HTML entities.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  username: schema.string([
    rules.escape()
  ])
}
```


## exists

Queries the database to ensure the value exists inside a given database table and column.

:::note

The validation rule is added by `@adonisjs/lucid` package. So make sure it is [installed and configured](../../../guides/database/setup.md), before using this rule.

:::

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  slug: schema.string({}, [
    rules.exists({ table: 'categories', column: 'slug' })
  ])
}
```

### Case insensitivity

Many databases perform case sensitive queries. So either you can transform the value to `lowerCase` in JavaScript or make use of the `caseInsensitive` option to convert value to lowercase during the query.

```ts
{
  username: schema.string({}, [
    rules.exists({
      table: 'users',
      column: 'username',
      caseInsensitive: true,
    })
  ])
}
```

Following is an example of the query executed behind the scenes.

```sql
SELECT username FROM users WHERE LOWER(username) = LOWER(?)
```

### Additional constraints

Additionally, you can also define `where` and `whereNot` constraints as an object of key-value pair. The `key` is the column name.

```ts
{
  slug: schema.string({}, [
    rules.exists({
      table: 'categories',
      column: 'slug',
      // highlight-start
      where: {
        tenant_id: 1,
        status: 'active',
      },
      // highlight-end
    })
  ])
}
```

```sql
SELECT slug FROM categories
  WHERE slug = ?
  AND tenant_id = ?
  AND status = ?
```

We perform a `whereIn` query if the value is an **array**. For example:

```ts
rules.exists({
  table: 'categories',
  column: 'slug',
  // highlight-start
  where: {
    group_id: [1, 2, 4],
  },
  // highlight-end
})
```

```sql
SELECT slug FROM categories
  WHERE slug = ?
  AND group_id IN (?, ?, ?)
```

### Using refs

If you are caching your validation schema using the `cacheKey` and your **where constraints** relies on a runtime value, then you must make use of refs.

```ts
import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateUserValidator {
  constructor (protected ctx: HttpContextContract) {
  }

  // highlight-start
  public refs = schema.refs({
    tenantId: this.ctx.auth.user!.tenantId
  })
  // highlight-end

  public schema = schema.create({
    username: schema.string({}, [
      rules.exists({
        table: 'users',
        column: 'username',
        // highlight-start
        where: { tenant_id: this.refs.tenantId },
        // highlight-end
      })
    ])
  })

}
```


## ip

Validates the value to be a valid IP address. Optionally, you can also enforce the IP version as `4` or `6`.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  ip: schema.string({}, [
    rules.ip()
  ])
}
```

```ts
{
  ip: schema.string({}, [
    rules.ip({ version: 6 })
  ])
}
```


## maxLength

Enforces the value to have maximum length as per defined by the rule. The rule can only be applied to `string` or an `array` schema type.

In the following example, the username with greater than 40 characters will fail the validation.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  username: schema.string({}, [
    rules.maxLength(40)
  ])
}
```

Following is an example of applying the `maxLength` rule on an array.

```ts
{
  tags: schema
    .array([
      rules.maxLength(10)
    ])
    .members(schema.string())
}
```

### Custom messages options
The `maxLength` validation rule passes the `maxLength` option to custom messages.

```ts
{
  'maxLength': 'The array can contain maximum of {{ options.maxLength }} items',
}
```


## minLength

Enforces the value to have minimum length as per defined by the rule. The rule can only be applied to `string` or an `array` schema type.

In the following example, the username with less than 4 characters will fail the validation.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  username: schema.string({}, [
    rules.minLength(4)
  ])
}
```

Following is an example of applying the `minLength` rule on an array.

```ts
{
  tags: schema
    .array([
      rules.minLength(1)
    ])
    .members(schema.string())
}
```

### Custom messages options
The `minLength` validation rule passes the `minLength` option to custom messages.

```ts
{
  'minLength': 'The array must have minimum of {{ options.minLength }} items',
}
```


## mobile

Enforces the value to be properly formatted as a phone number. You can also define locales for country specific validation.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  mobile: schema.string([
    rules.mobile()
  ])
}
```

You can also specify one or more locales to force format validation for a specific country.

```ts
{
  mobile: schema.string([
    rules.mobile({
      locales: ['pt-BR', 'en-IN', 'en-US']
    })
  ])
}
```

### Strict mode
Enabling the strict mode forces the user to always define the country code and prefix the phone number with `+` symbol.

```ts
{
  mobile: schema.string([
    rules.mobile({ strict: true })
  ])
}
```


## notIn

Validates the value to ensure it is not inside an array of provided values.

:::note

There is no `rules.in` rule. We encourage you to use the [enum schema type](../schema/enum.md) as it provides better static type safety.

:::

```ts
{
  username: schema.string([
    rules.notIn(['admin', 'super', 'root'])
  ])
}
```

### Providing values as a ref

If your list options relies on the runtime values and you are using schema caching, then you must move them to the `refs`.

Following is example of defining options via refs.

```ts
import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateUserValidator {
  constructor(protected ctx: HttpContextContract) {}

  // highlight-start
  public refs = schema.refs({
    unallowedValues: getValuesFromSomewhere(),
  })

  public schema = schema.create({
    username: schema.string([
      rules.notIn(this.refs.unallowedValues)
    ]),
  })
  // highlight-end

  public cacheKey = this.ctx.routeKey
}
```

### Custom messages options
The `notIn` validation rule passes the `values` array as the only option to custom messages.

```ts
{
  'notIn': 'The {{ field }} value cannot be one of {{ options.values }}',
}
```


## range

Validates the value to be within a given range. The rule can only be used with the `number` schema type.

In the following example, the value of `age < 18` and `> 40` will fail the validation.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  age: schema.number([
    rules.range(18, 40)
  ])
}
```

### Custom messages options
The `range` validation rule passes the `start` and the `stop` options to custom messages.

```ts
{
  'age.range': 'Candidate age must be between {{ options.start }} and {{ options.stop }} years',
}
```


## regex

Validates the value against the defined regex. The rule can only be used with the `string` schema type.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  username: schema.string([
    rules.regex(/^[a-zA-Z0-9]+$/)
  ])
}
```

You can pass the `RegExp` instance directly.

```ts
{
  username: schema.string([
    rules.regex(new RegExp('^[a-zA-Z0-9]+$'))
  ])
}
```

## requiredIfExists

Validates the field to be present when other the field is present. For example: The user must fill out the shipping address when opted for delivery.

:::note

The opposite of this rule is `requiredIfNotExists`

:::

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  address: schema.string.optional([
    rules.requiredIfExists('needs_delivery')
  ])
}
```

## requiredIfExistsAll

Same as the `requiredIf` rule, but here you can define more than one field to exist in order for the field to be required.

:::note

The opposite of this rule is `requiredIfNotExistsAll`

:::


```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  tax_id: schema.string.optional([
    rules.requiredIfExistsAll(['owns_a_car', 'owns_a_house'])
  ])
}
```

## requiredIfExistsAny

Mark the current field as required, **when any of the other fields exists** and contains some value.

:::note

The opposite of this rule is `requiredIfNotExistsAny`

:::


```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  password: schema.string.optional([
    rules.requiredIfExistsAny(['username', 'email'])
  ])
}
```

## requiredWhen

Mark the current field as required **when the value of the other field matches a given criteria**.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  address: schema.string.optional([
    rules.requiredWhen('delivery_method', '=', 'shipping')
  ])
}
```

The `requiredWhen` rule support the following operators.

- `in` accepts an array of values
- `notIn` accepts an array of values
- `=` accepts a literal value
- `!=` accepts a literal value
- `>` accepts a numeric value
- `<` accepts a numeric value
- `>=` accepts a numeric value
- `<=` accepts a numeric value


## trim

The `trim` is sanitization rule to trim all the whitespaces from the left and the trim of the string.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  username: schema.string([
    rules.trim()
  ])
}
```


## unique

Queries the database to ensure the value **does NOT exists** inside a given database table and column.

:::note

The validation rule is added by `@adonisjs/lucid` package. So make sure it is [installed and configured](../../../guides/database/setup.md), before using this rule.

:::

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  email: schema.string({}, [
    rules.unique({ table: 'users', column: 'email' })
  ])
}
```

### Case insensitivity

Many databases perform case sensitive queries. So either you can transform the value to `lowerCase` in JavaScript or make use of the `caseInsensitive` option to convert value to lowercase during the query.

```ts
{
  email: schema.string({}, [
    rules.unique({
      table: 'users',
      column: 'email',
      caseInsensitive: true,
    })
  ])
}
```

Following is an example of the query executed behind the scenes.

```sql
SELECT email FROM users WHERE LOWER(email) = LOWER(?)
```

### Additional constraints

Additionally, you can also define `where` and `whereNot` constraints as an object of key-value pair. The `key` is the column name.

```ts
{
  email: schema.string({}, [
    rules.unique({
      table: 'users',
      column: 'email',
      // highlight-start
      where: {
        tenant_id: 1,
      },
      // highlight-end
    })
  ])
}
```

```sql
SELECT email FROM users WHERE email = ? AND tenant_id = ?
```

We perform a `whereIn` query if the value is an **array**. For example:

```ts
rules.unique({
  table: 'users',
  column: 'email',
  // highlight-start
  where: {
    account_type: ['member', 'vip'],
  },
  // highlight-end
})
```

```sql
SELECT string FROM users
  WHERE email = ?
  AND account_type IN (?, ?)
```

### Using refs

If you are caching your validation schema using the `cacheKey` and your **where constraints** relies on a runtime value, then you must make use of refs.

```ts
import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateUserValidator {
  constructor (protected ctx: HttpContextContract) {
  }

  // highlight-start
  public refs = schema.refs({
    tenantId: this.ctx.auth.user!.tenantId
  })
  // highlight-end

  public schema = schema.create({
    email: schema.string({}, [
      rules.unique({
        table: 'users',
        column: 'email',
        // highlight-start
        where: { tenant_id: this.refs.tenantId },
        // highlight-end
      })
    ])
  })
}
```


## url

Validates the value to be formatted as a valid URL string. 

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  website: schema.string([
    rules.url()
  ])
}
```

Along with the format validation, you can also **enforce the url to be from a certain domain**. For example:

```ts
{
  twitterProfile: schema.string([
    rules.url({
      // Only twitter.com urls are allowed
      allowedHosts: ['twitter.com']
    })
  ])
}
```

The inverse of `allowedHosts` is the `bannedHosts`.

```ts
{
  website: schema.string([
    rules.url({
      bannedHosts: [
        'acme.com',
        'example.com'
      ]
    })
  ])
}
```

### Validation options

Following is the list of options for validate a URL string

```ts
{
  website: schema.string([
    rules.url({
      protocols: ['http', 'https', 'ftp'],
      requireTld: true,
      requireProtocol: false,
      requireHost: true,
      allowedHosts: [],
      bannedHosts: [],
      validateLength: false
    })
  ])
}
```

| Option | Description |
|---------|------------------|
| `protocols` | An array of allowed protocols ("http", "https", or "ftp"). Defining protocols will implicitly set the `requireProtocol` option to `true`. |
| `requireTld` | Ensure the tld is present in the URL. Defaults to `true`  |
| `requireProtocol` | Ensure the URL has protocol defined. Defaults to `false` |
| `requireHost` | Ensure the URL has the host defined. Defaults to `true` |
| `allowedHosts` | An array of allowed hosts. URLs outside the defined hosts will fail the validation. |
| `bannedHosts` | An array of banned hosts. URLs matching the defined hosts will fail the validation. |
| `validateLength` | Validate the length of the URL to be under or equal to **2083 charcters**. Defaults to `true`. |

### Normalizing url
You can normalize the URL using the `rules.normalizeUrl` method.

```ts
{
  website: schema.string([
    rules.url(),
    rules.normalizeUrl({
      ensureProtocol: 'https',
      stripWWW: true,
    })
  ])
}
```

| Option | Description |
|--------|-------------|
| `ensureProtocol` | The property ensures that the URL post validation has `https` protocol |
| `stripWWW` | Strips the `www` from the URL |


## uuid

Enforce the value of field under validation is a valid `uuid`. You can also optionally enforce a specific uuid version.

```ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

{
  id: schema.string([
    rules.uuid()
  ])
}
```

Following is an example of validating the `id` to be a `uuidv4` string. 

```ts
{
  id: schema.string([
    rules.uuid({ version: 4 })
  ])
}
```