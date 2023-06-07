# URL builder

You may use the URL builder to create URLs for pre-defined routes in your application. For example, create a form action URL inside Edge templates, or make the URL to redirect the request to another route.

The `router.builder` method creates an instance of the [URL builder](https://github.com/adonisjs/http-server/blob/next/src/router/lookup_store/url_builder.ts) class, and you can use the builder's fluent API to lookup a route and create a URL for it.

```ts
import router from '@adonisjs/core/services/router'
const PostsController = () => import('#controllers/posts_controller')

router
  .get('posts/:id', [PostsController, 'show'])
  .as('posts.show')
```

You may generate the URL for the `posts.show` route as follows.

```ts
import router from '@adonisjs/core/services/router'

router
  .builder()
  .params([1])
  .make('posts.show') // /posts/1

router
 .builder()
 .params([20])
 .make('posts.show') // /posts/20
```

The params can be specified as an array of positional arguments. Or you can define them as a key-value pair.

```ts
router
 .builder()
 .params({ id: 1 })
 .make('posts.show') // /posts/1
```

## Defining query parameters

The query parameters can be defined using the `builder.qs` method. The method accepts an object of key-value pair and serializes it to a query string.

```ts
router
  .builder()
  .qs({ page: 1, sort: 'asc' })
  .make('posts.index') // /posts?page=1&sort=asc
```

The query string is serialized using the [qs](https://www.npmjs.com/package/qs) npm package. You can [configure its settings](https://github.com/adonisjs/http-server/blob/next/src/define_config.ts#L41-L46) inside the `config/app.ts` file under the `http` object.

```ts
// config/app.js
http: defineConfig({
  qs: {
    stringify: {
      // 
    }
  }
})
```

## Prefixing URL

You may prefix a base URL to the output using the `builder.prefixUrl` method.

```ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 1 })
  .make('posts.show')
```

## Disabling route lookup

The URL builder performs a route lookup with the route identifier given to the `make` and the `makeSigned` methods.

If you want to create a URL for routes defined outside of your AdonisJS application, you may disable the route lookup and give the route pattern to the `make` and the `makeSigned` methods.

```ts
router
  .builder()
  .prefixUrl('https://your-app.com')
  .disableRouteLookup()
  .params({ token: 'foobar' })
  .make('/email/verify/:token') // /email/verify/foobar
```

## Generating signed URLs

Signed URLs are URLs with a signature query string appended to them. The signature is used to verify if the URL has been tampered after it was generated.

For example, you have a URL to unsubscribe users from your newsletter. The URL contains the `userId` and might look as follows.

```
/unsubscribe/231
```

To prevent someone from changing the user id from `231` to something else, you can sign this URL and verify the signature when handling requests for this route.

```ts
router.get('unsubscribe/:id', ({ request, response }) => {
  if (!request.hasValidSignature()) {
    return response.badRequest('Invalid or expired URL')
  }
  
  // Remove subscription
}).as('unsubscribe')
```

You may use the `makeSigned` method to create a signed URL.

```ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 231 })
  // highlight-start
  .makeSigned('unsubscribe')
  // highlight-end
```

### Signed URL expiration

You may generate signed URLs that expire after a given duration using the `expiresIn` option. The value can be a number in milliseconds or a time expression string.

```ts
router
  .builder()
  .prefixUrl('https://blog.adonisjs.com')
  .params({ id: 231 })
  // highlight-start
  .makeSigned('unsubscribe', {
    expiresIn: '3 days'
  })
  // highlight-end
```

## Generating URLs inside templates

You may use the `route`, `signedRoute`, `url`, and the `signedUrl` methods inside templates to generate a URL using the URL builder.

The view helpers do not have a fluent API and instead accept multiple parameters.

- The first parameter is the route identifier or the route pattern.
- The 2nd parameter is the route params defined as an array or an object.
- The 3rd parameter is the options object. The options may have the `prefixUrl` and the `qs` properties.

### route

```edge
<a href="{{ route('posts.show', [post.id]) }}">
  View post
</a>
```

The query string is defined using the `qs` option.

```edge
<a href="{{
  route('posts.index', [], {
    qs: {
      sort: 'asc',
      page: 1
    }
  })
}}">
  Posts
</a>
```

The prefix URL is defined using the `prefixUrl` option.

```edge
<a href="{{
  route('posts.index', [], {
    qs: {
      sort: 'asc',
      page: 1
    },
    prefixUrl: 'https://blog.adonisjs.com'
  })
}}">
  Posts
</a>
```

### signedRoute

The `signedRoute` helper generates a signed URL. It accepts the same set of parameters as the `route` helper.

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

### url

The `url` helper generates a URL for a route pattern [without performing a route lookup](#disabling-route-lookup). The method can be used to create URLs to routes outside of your application.

```edge
<a href="{{
  url('/email/verify/:token', ['token-value'], {
    prefixUrl: 'https://yourapp.com'
  })
}}">
  Click here to verify your email address
</a>
```

### signedUrl
The `signedUrl` works similar to the `url` method. Instead, it generates a signed URL.

```edge
<a href="{{
  signedUrl('/email/verify/:token', ['token-value'], {
    prefixUrl: 'https://yourapp.com'
  })
}}">
  Click here to verify your email address
</a>
```
