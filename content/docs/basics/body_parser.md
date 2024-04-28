# Body Parser Middleware

The request data is parsed using the `BodyParser` middleware registered inside the `start/kernel.ts` file.

The configuration for the middleware is stored inside the `config/bodyparser.ts` file. In this file, you may configure parsers for parsing **JSON payloads**, **multipart forms with file uploads**, and **URL-encoded forms**.

See also: [Reading request body](request.md#request-body)\
See also: [File uploads](file_uploads.md)

```ts
import { defineConfig } from '@adonisjs/core/bodyparser'

export const defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: {
    // settings for parsing HTML forms
  },

  json: {
    // Settings for parsing JSON body
  },

  multipart: {
    // Settings for multipart parser
  },

  raw: {
    // Settings for a raw text parser
  },
})
```

## Allowed methods

You may define an array of `allowedMethods` for which the bodyparser middleware should attempt to parse the request body. By default, the following methods are configured. However, feel free to remove or add new methods.

```ts
{
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE']
}
```

## Converting empty strings to null

HTML forms send an empty string in the request body when an input field has no value. This behavior of HTML forms makes data normalization at the database layer harder.

For example, if you have a database column `country` set to nullable, you would want to store `null` as a value inside this column when the user does not select a country.

However, with HTML forms, the backend receives an empty string, and you might insert an empty string into the database instead of leaving the column as `null`.

The `BodyParser` middleware can handle this inconsistency by converting all empty string values to `null` when the `convertEmptyStringsToNull` flag is enabled inside the config.

```ts
{
  form: {
    // ... rest of the config
    convertEmptyStringsToNull: true
  },

  json: {
    // ... rest of the config
    convertEmptyStringsToNull: true
  },

  multipart: {
    // ... rest of the config
    convertEmptyStringsToNull: true
  }
}
```

## JSON parser

The JSON parser is used for parsing request body defined as a JSON encoded string with the `Content-type` header matching one of the pre-defined `types` values.

```ts
json: {
  encoding: 'utf-8',
  limit: '1mb',
  strict: true,
  types: [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report',
  ],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

encoding

</dt>

<dd>

The encoding to use when converting the request body Buffer to a string. Most likely, you want to use `utf-8`. However, you can use any encoding supported by the [iconv-lite package](https://www.npmjs.com/package/iconv-lite#readme).

</dd>

<dt>

limit

</dt>

<dd>

The maximum limit of request body data the parser should allow. A `413` error will be returned if the request body exceeds the configured limit.

</dd>

<dt>

strict

</dt>

<dd>

The strict parsing allows only `objects` and `arrays` at the top level of a JSON-encoded string.

</dd>

<dt>

types

</dt>

<dd>

An array of values for the `Content-type` header should be parsed using the JSON parser.

</dd>

</dl>

## URL encoded form parser

The `form` parser is used for parsing URL encoded strings with the `Content-type` header set to `application/x-www-form-urlencoded`. In other words, the HTML forms data is parsed using the `form` parser.

```ts
form: {
  encoding: 'utf-8',
  limit: '1mb',
  queryString: {},
  types: ['application/x-www-form-urlencoded'],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

encoding

<dt>

<dd>

The encoding to use when converting the request body Buffer to a string. Most likely, you want to use `utf-8`. However, you can use any encoding supported by the [iconv-lite package](https://www.npmjs.com/package/iconv-lite#readme).

</dd>

<dt>

limit

<dt>

<dd>

The maximum limit of request body data the parser should allow. A `413` error will be returned if the request body exceeds the configured limit.

</dd>

<dt>

queryString

<dt>

<dd>

The URL-encoded request body is parsed using the [qs package](https://www.npmjs.com/package/qs). You can define the options for the package using the `queryString` property.

```ts
  form: {
    queryString: {
      allowDots: true,
      allowSparse: true,
    },
  }
```

</dd>

</dl>

## Multipart parser

The `multipart` parser is used for parsing HTML form requests with file uploads.

See also: [File uploads](file_uploads.md)

```ts
multipart: {
  autoProcess: true,
  processManually: [],
  encoding: 'utf-8',
  fieldsLimit: '2mb',
  limit: '20mb',
  types: ['multipart/form-data'],
  convertEmptyStringsToNull: true,
}
```

<dl>

<dt>

autoProcess

</dt>

<dd>

Enabling `autoProcess` will move all the user-uploaded files to the `tmp` directory of your operating system.

Later, inside the controllers, you can validate the files and move them to a persistent location or a cloud service.

If you disable the `autoProcess` flag, then you will have to manually process the stream and read files/fields from the request body. See also: [Self-processing multipart stream](file_uploads.md#self-processing-multipart-stream).

You may define an array of routes for which to auto process the files. The values **must be a route pattern** and not the URL.

```ts
{
  autoProcess: [
    '/uploads',
    '/post/:id'
  ]
}
```

</dd>

<dt>

processManually

</dt>

<dd>

The `processManually` array allows you to turn off auto processing of files for selected routes. The values **must be a route pattern** and not the URL.

```ts
multipart: {
  autoProcess: true,
  processManually: [
    '/file_manager',
    '/projects/:id/assets'
  ],
}
```

</dd>

<dt>

encoding

</dt>

<dd>

The encoding to use when converting the request body Buffer to a string. Most likely, you want to use `utf-8`. However, you can use any encoding supported by the [iconv-lite package](https://www.npmjs.com/package/iconv-lite#readme).

</dd>

<dt>

limit

</dt>

<dd>

The maximum limit of bytes to allow when processing all files. You can define the individual file size limit using the [request.file](file_uploads.md) method.

</dd>

<dt>

fieldsLimit

</dt>

<dd>

The maximum limit of bytes to allow for the fields (not files) when processing the multipart request. A `413` error will be returned if the field size exceeds the configured limit.

</dd>

</dl>
