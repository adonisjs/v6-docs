<<<<<<< HEAD
# Securing server-rendered applications
=======
# Securing Server-Rendered Applications
>>>>>>> a7aa500 (docs: first draft of new structure)

If you are creating a server-rendered application using AdonisJS, then you must use the `@adonisjs/shield` package to protect your applications from common web attacks like **CSRF**, **XSS**, **Content sniffing**, and so on.

The package comes pre-configured with the **web starter kit**. However, you can manually install and configure the package as follows.

:::note
The `@adonisjs/shield` package has a peer dependency on the `@adonisjs/session` package, so make sure to [configure the session package](../basics/session.md) first.
:::

```sh
node ace add @adonisjs/shield
```

:::disclosure{title="See steps performed by the add command"}

1. Installs the `@adonisjs/shield` package using the detected package manager.

2. Registers the following service provider inside the `adonisrc.ts` file.

   ```ts
   {
     providers: [
       // ...other providers
       () => import('@adonisjs/shield/shield_provider'),
     ]
   }
   ```

3. Creates the `config/shield.ts` file.

4. Registers the following middleware inside the `start/kernel.ts` file.

   ```ts
   router.use([() => import('@adonisjs/shield/shield_middleware')])
   ```

:::

## CSRF protection

[CSRF (Cross-Site Request Forgery)](https://owasp.org/www-community/attacks/csrf) is an attack in which a malicious website tricks the users of your web app to perform form submissions without their explicit consent.

To protect against CSRF attacks, you should define a hidden input field holding the CSRF token value that only your website can generate and verify. Hence, the form submissions triggered by the malicious website will fail.

### Protecting forms

Once you configure the `@adonisjs/shield` package, all form submissions without a CSRF token will automatically fail. Therefore, you must use the `csrfField` edge helper to define a hidden input field with the CSRF token.

:::caption{for="info"}
**Edge helper**
:::

```edge
<form method="POST" action="/">
  // highlight-start
  {{ csrfField() }}
  // highlight-end
  <input type="name" name="name" placeholder="Enter your name">
  <button type="submit"> Submit </button>
</form>
```

:::caption{for="info"}
**Output HTML**
:::

```html

<form method="POST" action="/">
    // highlight-start
    <input type="hidden" name="_csrf" value="Q9ghWSf0-3FD9eCiu5YxvKaxLEZ6F_K4DL8o"/>
    // highlight-end
    <input type="name" name="name" placeholder="Enter your name"/>
    <button type="submit">Submit</button>
</form>
```

During the form submission, the `shield_middleware` will automatically verify the `_csrf` token, only allowing the form submissions with a valid CSRF token.

### Handling exceptions

Shield raises an `E_BAD_CSRF_TOKEN` exception when the CSRF token is missing or invalid. By default, AdonisJS will capture the exception and redirect the user back to the form with an error flash message.

You can access the flash message as follows inside an edge template.

```edge
// highlight-start
@error('E_BAD_CSRF_TOKEN')
  <p> {{ $message }} </p>
@end
// highlight-end

<form method="POST" action="/">
  {{ csrfField() }}
  <input type="name" name="name" placeholder="Enter your name">
  <button type="submit"> Submit </button>
</form>
```

<<<<<<< HEAD
You can also self-handle the `E_BAD_CSRF_TOKEN` exception inside the [global exception handler](../basics/exception_handling.md#handling-exceptions) as follows.
=======
You can also self-handle the `E_BAD_CSRF_TOKEN` exception inside the [global exception handler](../../basics/exception_handling.md#handling-exceptions) as follows.
>>>>>>> a7aa500 (docs: first draft of new structure)

```ts
import app from '@adonisjs/core/services/app'
import { errors } from '@adonisjs/shield'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    // highlight-start
    if (error instanceof errors.E_BAD_CSRF_TOKEN) {
      return ctx.response
        .status(error.status)
        .send('Page has expired')
    }
    // highlight-end
    return super.handle(error, ctx)
  }
}
```

### Config reference

The configuration for the CSRF guard is stored inside the `config/shield.ts` file.

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csrf: {
    enabled: true,
    exceptRoutes: [],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },
})

export default shieldConfig
```

<dl>

<dt>

enabled

</dt>

<dd>

Turn the CSRF guard on or off.

</dd>

<dt>

exceptRoutes

</dt>

<dd>

An array of route patterns to exempt from the CSRF protection. If your application has routes that accept form submissions via an API, you might want to exempt them.

For more advanced use cases, you may register a function to exempt specific routes dynamically.

```ts
{
  exceptRoutes: (ctx) => {
    // exempt all routes starting with /api/
    return ctx.request.url().includes('/api/')
  }
}
```

</dd>

<dt>

enableXsrfCookie

</dt>

<dd>

When enabled, Shield will store the CSRF token inside an encrypted cookie named `XSRF-TOKEN`, which can be read by the frontend JavaScript code.

This allows frontend request libraries like Axios to read the `XSRF-TOKEN` automatically and set it as a header when making Ajax requests without server-rendered forms.

You must keep the `enableXsrfCookie` disabled if you are not triggering Ajax requests programmatically.

</dd>

<dt>

methods

</dt>

<dd>

An array of HTTP methods to protect. All incoming requests for the mentioned methods must present a valid CSRF token.

</dd>

<dt>

cookieOptions

</dt>

<dd>

<<<<<<< HEAD
Configuration for the `XSRF-TOKEN` cookie. [See cookies configuration](../basics/cookies.md#configuration) for available options.
=======
Configuration for the `XSRF-TOKEN` cookie. [See cookies configuration](../../basics/cookies.md#configuration) for available options.
>>>>>>> a7aa500 (docs: first draft of new structure)

</dd>

</dl>

## Defining CSP policy
[CSP (Content security policy)](https://web.dev/csp/) protects your applications from XSS attacks by defining trusted sources for loading JavaScript, CSS, fonts, images, and so on.

The CSP guard is disabled by default. However, we recommend you enable it and configure the policy directives inside the `config/shield.ts` file.

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    directives: {
      // policy directives go here
    },
    reportOnly: false,
  },
})

export default shieldConfig
```

<dl>

<dt>

enabled

</dt>

<dd>

Turn the CSP guard on or off.

</dd>

<dt>

directives

</dt>

<dd>

Configure the CSP directives. You can view the list of available directives on [https://content-security-policy.com/](https://content-security-policy.com/#directive)

```ts
const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    // highlight-start
    directives: {
      defaultSrc: [`'self'`],
      scriptSrc: [`'self'`, 'https://cdnjs.cloudflare.com'],
      fontSrc: [`'self'`, 'https://fonts.googleapis.com']
    },
    // highlight-end
    reportOnly: false,
  },
})

export default shieldConfig
```

</dd>

<dt>

reportOnly

</dt>

<dd>

The CSP policy will not block the resources when the `reportOnly` flag is enabled. Instead, it will report the violations on an endpoint configured using the `reportUri` directive.

```ts
const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    directives: {
      defaultSrc: [`'self'`],
      // highlight-start
      reportUri: ['/csp-report']
      // highlight-end
    },
    // highlight-start
    reportOnly: true,
    // highlight-end
  },
})
```

Also, register the `csp-report` endpoint to collect the violation reports.

```ts
router.post('/csp-report', async ({ request }) => {
  const report = request.input('csp-report')
})
```
</dd>

</dl>

### Using Nonce
You may allow inline `script` and `style` tags by defining the [nonce attribute](https://content-security-policy.com/nonce/) on them. The value of the nonce attribute can be accessed inside Edge templates using the `cspNonce` property.

```edge
<script nonce="{{ cspNonce }}">
  // Inline JavaScript
</script>
<style nonce="{{ cspNonce }}">
  /* Inline CSS */
</style>
```

Also, use the `@nonce` keyword inside the directives config to allow nonce-based inline scripts and styles.

```ts
const shieldConfig = defineConfig({
  csp: {
    directives: {
      defaultSrc: [`'self'`, '@nonce'],
    },
  },
})
```

### Loading assets from the Vite Dev server
<<<<<<< HEAD
If you are using the [Vite integration](../basics/vite.md), you can use the following CSP keywords to allow assets served by the Vite Dev server.
=======
If you are using the [Vite integration](../../basics/vite), you can use the following CSP keywords to allow assets served by the Vite Dev server.
>>>>>>> a7aa500 (docs: first draft of new structure)

- The `@viteDevUrl` adds the Vite dev server URL to the allowed list.
- The `@viteHmrUrl` adds the Vite HMR websocket server URL to the allowed list.

```ts
const shieldConfig = defineConfig({
  csp: {
    directives: {
      defaultSrc: [`'self'`, '@viteDevUrl'],
      connectSrc: ['@viteHmrUrl']
    },
  },
})
```

If you are deploying the Vite bundled output to a CDN server, you must replace `@viteDevUrl` with the `@viteUrl` keyword to allow assets from both the development server and the CDN server.

```ts
directives: {
  // delete-start
  defaultSrc: [`'self'`, '@viteDevUrl'],
  // delete-end
  // insert-start
  defaultSrc: [`'self'`, '@viteUrl'],
  // insert-end
  connectSrc: ['@viteHmrUrl']
},
```

### Adding Nonce to styles injected by Vite
Currently, Vite does not allow defining a `nonce` attribute to the `style` tags injected by it inside the DOM. There is an [open PR](https://github.com/vitejs/vite/pull/11864) for the same, and we are hoping it will be resolved soon.

## Configuring HSTS
The [**Strict-Transport-Security (HSTS)**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) response header informs the browsers to always load the website using HTTPS. 

You can configure the header directives using the `config/shield.ts` file.

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  hsts: {
    enabled: true,
    maxAge: '180 days',
    includeSubDomains: true,
  },
})
```

<dl>

<dt>

enabled

</dt>

<dd>

Turn the hsts guard on or off.

</dd>

<dt>

maxAge

</dt>

<dd>

Defines the `max-age` attribute. The value should either be a number in seconds or a string-based time expression.

```ts
{
  // Remember for 10 seconds
  maxAge: 10,
}
```

```ts
{
  // Remember for 2 days
  maxAge: '2 days',
}
```

</dd>

<dt>

includeSubDomains

</dt>

<dd>

Defines the `includeSubDomains` directive to apply the setting on subdomains.

</dd>

</dl>

## Configuring X-Frame protection
The [**X-Frame-Options**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) header is used to indicate if a browser is allowed to render a website embedded inside an `iframe`, `frame`, `embed`, or `object` tags.

:::note

If you have configured CSP, you may instead use the [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors) directive and disable the `xFrame` guard.

:::

You can configure the header directives using the `config/shield.ts` file.

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  xFrame: {
    enabled: true,
    action: 'DENY'
  },
})
```

<dl>

<dt>

enabled

</dt>

<dd>

Turn the xFrame guard on or off.

</dd>

<dt>

action

</dt>

<dd>

The `action` property defines the header value. It could be `DENY`, `SAMEORIGIN`, or `ALLOW-FROM`.

```ts
{
  action: 'DENY'
}
```

In the case of `ALLOW-FROM`, you must also define the `domain` property.

```ts
{
  action: 'ALLOW-FROM',
  domain: 'https://foo.com',
}
```

</dd>

</dl>

## Disabling MIME sniffing
The [**X-Content-Type-Options**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options) header instructs browsers to follow the `content-type` header and not perform MIME sniffing by inspecting the content of an HTTP response.

Once you enable this guard, Shield will define the `X-Content-Type-Options: nosniff` header for all HTTP responses.

```ts
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  contentTypeSniffing: {
    enabled: true,
  },
})
```
