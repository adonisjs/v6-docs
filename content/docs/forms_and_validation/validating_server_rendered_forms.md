# Validating server-rendered forms

{{TOC}}

In AdonisJS, the forms are validated at the controller layer. If the form validation fails, you redirect the user back to the form. Otherwise, continue with the rest of the controller logic.

The form validation in AdonisJS is framework agnostic, and you can use any validation library you like. However, we ship a great validator as part of the framework core. AdonisJS validator is:

- One of the [fastest validators in the Node.js ecosystem](https://github.com/adonisjs/validator/blob/main/benchmarks.md).
- Provides static and runtime safety.
- Casts form input values to JavaScript data types.
- Allows defining custom error messages.
- Allows defining translations for error messages and fields.
- Uses error formatters to format.

## Basic example

Let's start with a mini tutorial to validate server-rendered forms created using the [Edge template engine](). We will learn how to create a form, validate the fields, and display form errors.

### Step 1. Defining routes

```ts
import router from '@adonisjs/core/services/router'
const ArticlesController = () => import('#controllers/articles_controller')

router
  .get('articles/create', [ArticlesController, 'create'])
  .as('articles.create')

router
  .post('articles', [ArticlesController, 'store'])
  .as('articles.store')
```

### Step 2. Creating controller and rendering forms

The following command will create the `ArticlesController` inside the `app/controllers` directory.

```sh
node ace make:controller articles
```

```ts
import { HttpContext } from '@adonisjs/core/http'

export default class ArticlesController {
  async create({ view }: HttpContext) {
    return view.render('pages/articles/create')
  }

  async store({ request }: HttpContext) {
    // Validation logic will be written here
  }
}
```

### Step 3. Creating the form

The next step is to create the edge template and render an HTML form. The following command will create the template inside the `resources/views/pages/articles` directory.

```sh
node ace make:view pages/articles/create
```

In the following example, we are using the `route` helper to generate the URL for the form action. The `route` helper accepts the route identifier and returns its URL. You can learn more about it in the [URL builder guide](../basics/url_builder.md).

The `csrfField` method creates a hidden input field with the CSRF token. You can learn about CSRF protection in the [web security](../security/web_security.md) guide.

```edge
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Create article </title>
  </head>
  <body>
    <form action="{{ route('articles.store') }}" method="post">

      {{ csrfField() }}

      <div>
        <label for="title">Article title</label>

        <input
          type="text"
          name="title"
          id="title"
          />
      </div>

      <div>
        <label for="content">Article content</label>

        <textarea
          name="content"
          id="content"
          ></textarea>
      </div>

      <div>
        <button type="submit"> Create article </button>
      </div>

    </form>
  </body>
</html>
```



### Step 4. Validating the form

Finally, let's update the `ArticlesController.store` method to define the validation schema and update the request body against it.

The validation schema is created using the `schema.create` method. The return value is an optimized function you can pass to the `request.validate` method to perform validations.

The `request.validate` method validates the request body against the provided `schema`. The `validate` method throws [the `ValidationException`](#validation-exception) when the form validation fails. As a result, the user is redirected back to the form with the validation errors and the form input values.

```ts
import { HttpContext } from '@adonisjs/core/http'
// highlight-start
import { schema, rules } from '@adonisjs/core/validator'
// highlight-start

export default class ArticlesController {
  async create({ view }: HttpContext) {
    return view.render('pages/articles/create')
  }

  // highlight-start
  async store({ request }: HttpContext) {
    const createArticleSchema = schema.create({
      title: schema.string([
        rules.trim(),
        rules.minLength(8),
      ]),

      content: schema.string([
        rules.trim(),
        rules.escapeHtml(),
      ]),      
    })
  
    const payload = await request.validate({
      schema: createArticleSchema
    })
    
    console.log(payload.title)
    console.log(payload.content)
  }
  // highlight-end
}
```

### Step 5. Displaying errors and old input values

You can access the errors using the `getError` method. The method accepts the input field's name and returns its errors from the [session flash messages](../basics/session.md).

Old values refer to the input value that the user entered at the time of submitting the form. Using the `old` method, you can read the input field's old value. The method accepts the input field's name and returns its value from the [session flash messages](../basics/session.md).

```edge
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Create article </title>
  </head>
  <body>
    <form action="{{ route('articles.store') }}" method="post">

      <div>
        <label for="title">Article title</label>

        <input
          type="text"
          name="title"
          id="title"
          // highlight-start
          value="{{ old('title', '') }}"
          // highlight-end
        />
        
        // highlight-start
        @if(hasError('title'))
          <p> {{ getError('title') }} </p>
        @end
        // highlight-end
      </div>

      <div>
        <label for="content">Article content</label>
        
        <textarea
          name="content"
          id="content"
          // highlight-start
          >{{ old('content', '') }}</textarea>
          // highlight-end

        // highlight-start
        @if(hasError('content'))
          <p> {{ getError('content') }} </p>
        @end
        // highlight-end
      </div>

      <div>
        <button type="submit"> Create article </button>
      </div>

    </form>
  </body>
</html>
```

### Summary

That is all! Let's recap all the steps.

- Define routes and bind controller methods to them.
- Create an edge template to render the HTML form.
- Define the validation schema inside the controller method and use the `request.validate` to validate the request body.
- Upon validation failure, the user will be redirected back to the form.
- You can display form input old values and error messages using the edge helpers methods like `getError`, `hasError`, and `old`.

## Form method spoofing

The form method on an HTML form can only be set to `GET`, or `POST`, making it impossible to leverage [restful HTTP methods](https://restfulapi.net/http-methods/).

However, AdonisJS allows you to workaround this limitation using **form method spoofing**. Form method spoofing is a fancy term for specifying the form method via the `_method` query string.

For method spoofing to work, you must enable it inside the `config/app.ts` file.

```ts
// title: config/app.ts
export const http = defineConfig({
  allowMethodSpoofing: true
})
```

Once enabled, you can spoof the form method as follows.

```html
<form method="POST" action="/articles/1?_method=PUT">
  <!-- Update form -->
</form>
```

```html
<form method="POST" action="/articles/1?_method=DELETE">
  <!-- Delete form -->
</form>
```

With the `route` helper, you can use the `route.put` and the `route.delete` methods.

```edge
<form
  method="POST"
  action="{{ route.put('articles.update', [article.id]) }}"
>
  <!-- Update form -->
</form>
```

```edge
<form
  method="POST"
  action="{{ route.delete('articles.destroy', [article.id]) }}"
>
  <!-- Delete form -->
</form>
```


## Nested objects and arrays inside HTML forms

For HTML forms to submit an array of values or values inside a nested object, you must use the URL-encoded array brackets around the input value.

In the following example, we create a multi-select box and put brackets `[]` around the field name to receive an array of selections in the form data.

```html
<select name="categories[]">
  <-- options go here -->
</select>
```

**Wrap multiple inputs inside an array**

```html
<input type="text" name="poll_options[0]" />
<input type="text" name="poll_options[1]" />
<input type="text" name="poll_options[2]" />
<input type="text" name="poll_options[3]" />
```

```ts
schema.create({
  poll_options: schema.array().members(
    schema.string()
  )
})
```

**Wrap multiple inputs inside an object**

```html
<input type="text" name="poll[title]" />

<input type="text" name="poll[options][0]" />
<input type="text" name="poll[options][1]" />
<input type="text" name="poll[options][2]" />
<input type="text" name="poll[options][3]" />
```

```ts
schema.create({
  poll: schema.object().members({
    title: schema.string(),
    options: schema.array().members(
      schema.string()
    )
  })
})
```

## Using the Edge UI Kit

[Edge UI Kit](https://github.com/edge-js/uikit) is an unstyled (aka headless) UI library maintained by the AdonisJS core team. 

This UI Kit aims to extract the repetitive parts of your templating layer without making any design choices for you.
