# Social authentication

You can implement social authentication in your AdonisJS applications using the `@adonisjs/ally` package.
Ally comes with the following inbuilt drivers, alongside an extensible API to [register custom drivers](#creating-a-custom-social-driver).

- Twitter
- Facebook
- Spotify
- Google
- Github
- Discord
- LinkedIn

Ally does not store any users or access tokens on your behalf. It implements the OAuth2 and OAuth1 protocols, authenticates a user with social service, and provides user details. 

As a next step, you can store that information inside a database or perform a one-time action.

## Installation
Install the package from the npm packages registry using one of the following commands.

:::codegroup

```sh
// title: npm
npm i @adonisjs/ally@next
```

```sh
// title: yarn
yarn add @adonisjs/ally@next
```

```sh
// title: pnpm
pnpm add @adonisjs/ally@next
```

:::

Once the package is installed, you must configure it using the `node ace configure` command.

```sh
node ace configure @adonisjs/ally
```

:::disclosure{title="See steps performed by the configure command"}

1. Registers the following service provider inside the `adonisrc.ts` file.

    ```ts
    {
      providers: [
        // ...other providers
        () => import('@adonisjs/ally/ally_provider')
      ]
    }
    ```

2. Creates the `config/ally.ts` file. This file contains the configuration settings for selected OAuth providers.

3. Defines the environment variables to store `CLIENT_ID` and `CLIENT_SECRET` for selected OAuth providers. 

:::

## Configuration
The `@adonisjs/ally` package configuration is stored inside the `config/ally.ts` file. You can define config for multiple services within a single config file.

See also: [Config stub](https://github.com/adonisjs/ally/blob/next/stubs/config.stub)

```ts
import { defineConfig, services } from '@adonisjs/ally'

defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID')!,
    clientSecret: env.get('GITHUB_CLIENT_SECRET')!,
    callbackUrl: '',
  }),
  twitter: services.twitter({
    clientId: env.get('TWITTER_CLIENT_ID')!,
    clientSecret: env.get('TWITTER_CLIENT_SECRET')!,
    callbackUrl: '',
  }),
})
```

### Configuring the callback URL
OAuth providers require you to register a callback URL to handle the redirect response after the user authorizes the login request. 

The callback URL must be registered with the OAuth service provider. For example: If you are using Github, you must log in to your Github account, [create a new app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) and define the callback URL using the Github interface.

Also, you must register the same callback URL within the `config/ally.ts` file using the `callbackUrl` property.

## Usage
Once the package has been configured, you can interact with Ally APIs using the `ctx.ally` property. You can switch between the configured auth providers using the `ally.use()` method. For example:

```ts
router.get('/github/redirect', ({ ally }) => {
  // Github driver instance
  const gh = ally.use('github')

  // Twitter driver instance
  const twitter = ally.use('twitter')
})
```

### Redirecting the user for authentication
The first step in social authentication is to redirect the user to an OAuth service and wait for them to either approve or deny the authentication request.

You can perform the redirect using the `.redirect()` method.

```ts
router.get('/github/redirect', ({ ally }) => {
  return ally.use('github').redirect()
})
```

You can pass a callback function to define custom scopes or query string values during the redirect.

```ts
router.get('/github/redirect', ({ ally }) => {
  return ally
    .use('github')
    .redirect((request) => {
      // highlight-start
      request.scopes(['user:email', 'repo:invite'])
      request.param('allow_signup', false)
      // highlight-end
    })
})
```

### Handling callback response
The user will be redirected back to your application's `callbackUrl` after they approve or deny the authentication request. 

Within this route, you can call the `.user()` method to get the logged-in user details and the access token. However, you must also check the response for possible error states.

```ts
router.get('/github/callback', async ({ ally }) => {
  const gh = ally.use('github')

  /**
   * User has denied access by cancelling
   * the login flow
   */
  if (gh.accessDenied()) {
    return 'You have cancelled the login process'
  }

  /**
   * OAuth state verification failed. This happens when the
   * CSRF cookie gets expired.
   */
  if (gh.stateMisMatch()) {
    return 'We are unable to verify the request. Please try again'
  }

  /**
   * Github responded with some error
   */
  if (gh.hasError()) {
    return gh.getError()
  }

  /**
   * Access user info
   */
  const user = await gh.user()
  return user
})
```

## User properties
Following is the list of properties you can access from the return value of the `.user()` method call. The properties are consistent among all the underlying drivers.

```ts
const user = await gh.user()

user.id
user.email
user.emailVerificationState
user.name
user.nickName
user.avatarUrl
user.token
user.original
```

### id
A unique id returned by the OAuth provider.

### email
The email address returned by the OAuth provider. The value will be `null` if the OAuth request does not ask for the user's email address.

### emailVerificationState
Many OAuth providers allow users with unverified emails to log in and authenticate OAuth requests. You might want to use this flag to ensure only users with verified emails can log in.

Following is the list of possible values.

- `verified`: The user's email address is verified with the OAuth provider.
- `unverified`: The user's email address is not verified.
- `unsupported`: The OAuth provider does not share the email verification state.

### name
The name of the user returned by the OAuth provider.

### nickName
A publicly visible nick name of the user. The value of `nickName` and `name` will be the same if the OAuth provider has no concept of nicknames.

### avatarUrl
The HTTP(s) URL to the user's public profile picture.

### token
The token property is the reference to the underlying access token object. The token object has the following sub-properties.

```ts
user.token.token
user.token.type
user.token.refreshToken
user.token.expiresAt
user.token.expiresIn
```

| Property | Protocol | Description |
|---------|------------|------------|
| `token` | OAuth2 / OAuth1 | The value of the access token. The value is available for the `OAuth2` and the `OAuth1` protocols. |
| `secret` | OAuth1 | The token secret applicable only for `OAuth1` protocol. Currently, Twitter is the only official driver using OAuth1. |
| `type` | OAuth2 | The token type. Usually, it will be a [bearer token](https://oauth.net/2/bearer-tokens/).
| `refreshToken` | OAuth2 | The refresh token you can use to create a new access token. The value will be `undefined` if the OAuth provider does not support refresh tokens |
| `expiresAt` | OAuth2 | An instance of the luxon DateTime class representing the absolute time when the access token will expire. |
| `expiresIn` | OAuth2 | Value in seconds, after which the token will expire. It is a static value and does not change as time passes by. |

### original
Reference to the original response from the OAuth provider. You might want to reference the original response if the normalized set of user properties does not have all the information you need.

```ts
const user = await github.user()
console.log(user.original)
```

## Defining scopes
Scopes refers to the data you want to access after the user approves the authentication request. The name of scopes and the data you can access varies between the OAuth providers; therefore, you must read their documentation.

The scopes can be defined within the `config/ally.ts` file, or you can define them when redirecting the user.

Thanks to TypeScript, you will get autocomplete suggestions for all the available scopes.

![](./ally_autocomplete.png)

```ts
// title: config/ally.ts
github: {
  driver: 'github',
  clientId: env.get('GITHUB_CLIENT_ID')!,
  clientSecret: env.get('GITHUB_CLIENT_SECRET')!,
  callbackUrl: '',
  // highlight-start
  scopes: ['read:user', 'repo:invite'],
  // highlight-end
}
```

```ts
// title: During redirect
ally
  .use('github')
  .redirect((request) => {
    // highlight-start
    request.scopes(['read:user', 'repo:invite'])
    // highlight-end
  })
```

## Defining redirect query params
You can customize the query parameters for the redirect request alongside the scopes. In the following example, we define the `prompt` and the `access_type` params applicable with the [Google provider](https://developers.google.com/identity/protocols/oauth2/web-server#httprest).

```ts
router.get('/google/redirect', async ({ ally }) => {
  return ally
    .use('google')
    .redirect((request) => {
      // highlight-start
      request
        .param('access_type', 'offline')
        .param('prompt', 'select_account')
      // highlight-end
    })
})
```

## Fetching user details from an access token
Sometimes you might want to fetch user details from an access token stored inside the database or provided via some other OAuth flow. For example, you used the Native OAuth flow via a mobile app and received back an access token.

You can fetch the user details using the `.userFromToken()` method.

```ts
const user = await ally
  .use('github')
  .userFromToken(accessToken)
```

You can fetch the user details for an OAuth1 driver using the `.userFromTokenAndSecret` method.

```ts
const user = await ally
  .use('github')
  .userFromTokenAndSecret(token, secret)
```

## Stateless authentication
Many OAuth providers [recommend using a CSRF state token](https://developers.google.com/identity/openid-connect/openid-connect?hl=en#createxsrftoken) to prevent your application from request forgery attacks.

Ally creates a CSRF token and saves it inside an encrypted cookie, which is later verified after the user approves the authentication request.

However, if you cannot use cookies for some reason, you can enable the stateless mode in which no state verification will take place, and hence no CSRF cookie will be generated.

```ts
// title: Redirecting
ally.use('github').stateless().redirect()
```

```ts
// title: Handling callback response
const gh = ally.use('github').stateless()
await gh.user()
```

<!--

ADD it once we have the accordion component

## Complete config reference
Following is the complete config reference for all the drivers. You can copy-paste the following objects directly to your application config file. However, define and validate the required [environment variables](#validation-environment-variables).

:::accordion[Github]

:::

 -->

## Creating a custom social driver
We have created a [starter kit](https://github.com/adonisjs-community/ally-driver-boilerplate) to implement and publish a custom social driver on npm. Please go through the README of the starter kit for further instructions.
