# Edge helpers and tags

In this guide, we will learn about the **helpers and the tags** contributed to Edge by the AdonisJS official packages. The helpers shipped with Edge are not covered in this guide and must reference [Edge](https://edgejs.dev/docs/helpers) documentation for the same.

## request
Reference to the instance of ongoing [HTTP request](../http/request.md). The property is only available when a template is rendered using the `ctx.view.render` method.

```edge
{{ request.url() }}
{{ request.input('signature') }}
```

## route/signedRoute
Helper functions to create URL for a route using the [URL builder](../http/url_builder.md#generating-urls-inside-templates). Unlike the URL builder, the view helpers do not have a fluent API and accept the following parameters.

<table>
    <tr>
        <td>Position</td>
        <td>Description</td>
    </tr>
    <tr>
        <td>1st</td>
        <td>The route identifier or the route pattern</td>
    </tr>
    <tr>
        <td>2nd</td>
        <td>Route params are defined as an array or an object.</td>
    </tr>
    <tr>
        <td>3rd</td>
        <td>
          <p>The options object with the following properties.</p>
          <ul>
            <li><code>qs</code>: Define query string parameters as an object.</li>
            <li><code>domain</code>: Search for routes under a specific domain.</li>
            <li><code>prefixUrl</code>: Prefix a URL to the output.</li>
            <li><code>disableRouteLookup</code>: Enable/disable routes lookup.</li>
          </ul>
        </td>
    </tr>
</table>

```edge
<a href="{{ route('posts.show', [post.id]) }}">
  View post
</a>
```

```edge
<a href="{{
  signedRoute('unsubscribe', [user.id], {
    expiresIn: '3 days',
    prefixUrl: 'https://blog.adonisjs.com'    
  })
}}">
 Unsubscribe
</a>
```

## app
Reference to the [Application instance](../fundamentals/application.md).

```edge
{{ app.getEnvironment() }}
```

## config
A [helper function](../guides/config.md#reading-config-inside-edge-templates) to reference configuration values inside Edge templates. You may use the `config.has` method to check if the value for a key exists.

```edge
@if(config.has('app.appUrl'))
  <a href="{{ config('app.appUrl') }}"> Home </a>
@else
  <a href="/"> Home </a>
@end
```

## session
A read-only copy of the [session object](../http/session.md#reading-and-writing-data). You cannot mutate session data within Edge templates. The `session` property is only available when the template is rendered using the `ctx.view.render` method.

```edge
Post views: {{ session.get(`post.${post.id}.visits`) }}
```

## flashMessages
A read-only copy of [session flash messages](../http/session.md#flash-messages). The `flashMessages` property is only available when the template is rendered using the `ctx.view.render` method.

```edge
@if(flashMessages.has('inputErrorsBag.title'))
  <p>{{ flashMessages.get('inputErrorsBag.title') }}</p>
@end

@if(flashMessages.has('notification'))
  <div class="notification {{ flashMessages.get('notification').type }}">
    {{ flashMessages.get('notification').message }}
  </div>
@end
```

## old
The `old` method is a shorthand for the `flashMessages.get` method.

```edge
<input
  type="text"
  name="email"
  value="{{ old('name') || '' }}"
/>
```

## t
The `t` method is contributed by the `@adonisjs/i18n` package to display translations using the [i18n class](../digging_deeper/i18n.md#resolving-translations). The method accepts the translation key identifier, message data and a fallback message as the parameters.

```edge
<h1> {{ t('messages.greeting') }} </h1>
```

## i18n
Reference to an instance of the I18n class configured using the application's default locale. However, the [`DetectUserLocaleMiddleware`](../digging_deeper/i18n.md#detecting-user-locale-during-an-http-request) overrides this property with an instance created for the current HTTP request locale.

```edge
{{ i18n.formatCurrency(200, { currency: 'USD' }) }}
```

## auth
Reference to the [ctx.auth](../http/http_context.md#http-context-properties) property shared by the [InitializeAuthMiddleware](https://github.com/adonisjs/auth/blob/next/src/auth/middleware/initialize_auth_middleware.ts#L14). You may use this property to access information about the logged-in user.

```edge
@if(auth.isAuthenticated)
  <p> {{ auth.user.email }} </p>
@end
```

If you are displaying the logged-in user info on a public page (not protected by the auth middleware), then you may want to first silently check if the user is logged-in or not.

```edge
{{-- Check if user is logged-in --}}
@eval(await auth.use('web').check())

@if(auth.use('web').isAuthenticated)
  <p> {{ auth.use('web').user.email }} </p>
@end
```

## asset
Resolve the URL of an asset processed by Vite. Learn more about [referencing assets inside Edge templates](../http/assets_bundling.md#referencing-assets-inside-edge-templates).

```edge
<img src="{{ asset('resources/images/hero.jpg') }}" />
```

## embedImage / embedImageData
The `embedImage` and the `embedImageData` helpers are added by the [mail](../mail/message.md#embedding-images) package and are only available when rendering a template to send an email.

```edge
<img src="{{
  embedImage(app.makePath('assets/hero.jpg'))
}}" />
```

## @flashMessage
The `@flashMessage` tag provides a better DX for reading flash messages for a given key conditionally.

:::caption{for="error"}
**Instead of writing conditionals**
:::

```edge
@if(flashMessages.has('notification'))
  <div class="notification {{ flashMessages.get('notification').type }}">
    {{ flashMessages.get('notification').message }}
  </div>
@end
```

:::caption{for="success"}
**You may prefer using the tag**
:::

```edge
@flashMessage('notification')
  <div class="notification {{ $message.type }}">
    {{ $message.message }}
  </div>
@end
```

## @error
The `@error` tag provides a better DX for reading error messages stored inside the `errorsBag` key in `flashMessages`.

:::caption{for="error"}
**Instead of writing conditionals**
:::

```edge
@if(flashMessages.has('errorsBag.E_BAD_CSRF_TOKEN'))
  <p>{{ flashMessages.get('errorsBag.E_BAD_CSRF_TOKEN') }}</p>
@end
```

:::caption{for="success"}
**You may prefer using the tag**
:::

```edge
@error('E_BAD_CSRF_TOKEN')
  <p>{{ $message }}</p>
@end
```

## @inputError
The `@inputError` tag provides a better DX for reading validation error messages stored inside the `inputErrorsBag` key in `flashMessages`.

:::caption{for="error"}
**Instead of writing conditionals**
:::

```edge
@if(flashMessages.has('inputErrorsBag.title'))
  @each(message in flashMessages.get('inputErrorsBag.title'))
    <p>{{ message }}</p>
  @end
@end
```

:::caption{for="success"}
**You may prefer using the tag**
:::

```edge
@error('title')
  @each(message in $messages)
    <p>{{ message }}</p>
  @end
@end
```

## @vite
The `@vite` tag accepts an array of entry point paths and returns the `script` and the `link` tags for the same. The path you provide to the `@vite` tag should match exactly the path registered inside the `vite.config.js` file.

```ts
export default defineConfig({
  plugins: [
    adonisjs({
      // highlight-start
      entrypoints: ['resources/js/app.js'],
      // highlight-end
    }),
  ]
})
```

```edge
@vite(['resources/js/app.js'])
```

You can define the script tag attributes as the 2nd argument. For example:

```edge
@vite(['resources/js/app.js'], {
  defer: true,
})
```

## @viteReactRefresh
The `@viteReactRefresh` tag returns a [script tag to enable React HMR](https://vitejs.dev/guide/backend-integration.html#:~:text=you%27ll%20also%20need%20to%20add%20this%20before%20the%20above%20scripts) for project using the [@vitejs/plugin-react](https://www.npmjs.com/package/@vitejs/plugin-react) package.

```edge
@viteReactRefresh()
```

Output HTML

```html
<script type="module">
  import RefreshRuntime from 'http://localhost:5173/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
</script>
```

## @can/@cannot
The `@can` and `@cannot` tags allows you write authorization checks in Edge templates by referencing the ability name or the policy name as a string.

The first argument is the ability or the policy reference followed by the arguments accepted by the check.

See also: [Pre-registering abilities and policies](../digging_deeper/authorization.md#pre-registering-abilities-and-policies)

```edge
@can('editPost', post)
  {{-- Can edit post --}}
@end

@can('PostPolicy.edit', post)
  {{-- Can edit post --}}
@end
```

```edge
@cannot('editPost', post)
  {{-- Cannot edit post --}}
@end

@cannot('editPost', post)
  {{-- Cannot edit post --}}
@end
```
