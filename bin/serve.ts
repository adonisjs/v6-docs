/*
|--------------------------------------------------------------------------
| Development server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/

import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'
import { Env } from '@adonisjs/core/env'
import { defineConfig } from '@adonisjs/ally'
import app from '@adonisjs/core/services/app'
import { defineConfig as viteDefineConfig } from '@adonisjs/vite'
import { defineConfig as httpConfig } from '@adonisjs/core/http'

import { isSponsoring } from '../src/sponsorable.js'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)
const env = await Env.create(APP_ROOT, {
  APP_KEY: Env.schema.string(),
  GITHUB_API_SECRET: Env.schema.string(),
  GITHUB_CLIENT_ID: Env.schema.string(),
  GITHUB_CLIENT_SECRET: Env.schema.string(),
  GITHUB_CALLBACK_URL: Env.schema.string({ format: 'url', tld: false }),
})

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

/**
 * Ally configuration
 */
const allyConfig = defineConfig({
  github: {
    driver: 'github',
    clientId: env.get('GITHUB_CLIENT_ID'),
    clientSecret: env.get('GITHUB_CLIENT_SECRET'),
    callbackUrl: env.get('GITHUB_CALLBACK_URL'),
    scopes: ['read:user'],
  },
})
declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}

/**
 * Error messages to display during Github OAuth process
 */
const errorMessages = {
  accessDenied: 'Access denied. You have cancelled the login process',
  stateMisMatch:
    'We are unable to verify the request. Please refresh this page and try login again',
  loginFatalError: 'Github authentication failed. Please try again',
  notASponsor: 'Not authorized. The documentation is available for sponsors only',
}

/**
 * Defining routes for development server
 */
async function defineRoutes() {
  const { collections } = await import('#src/collections')
  const { default: router } = await import('@adonisjs/core/services/router')
  const { default: server } = await import('@adonisjs/core/services/server')
  server.use([() => import('@adonisjs/static/static_middleware')])

  router.get('/authenticate', ({ view, response, request }) => {
    const flashMessages = request.cookie('flash_messages')
    response.clearCookie('flash_messages')
    return view.render('authenticate.edge', { flashMessages })
  })

  router.post('/authenticate', async ({ ally, logger, response }) => {
    try {
      await ally.use('github').redirect()
    } catch (error) {
      logger.error({ err: error }, 'Github redirect request failed')
      response.cookie('flash_messages', {
        error: 'Unable to redirect to Github',
      })
      response.redirect('/authenticate')
    }
  })

  router.get('/authenticate/callback', async ({ ally, response, logger }) => {
    const gh = ally.use('github')

    /**
     * User denied the access
     */
    if (gh.accessDenied()) {
      logger.warn('Access denied in Github callback response')
      response.cookie('flash_messages', { error: errorMessages.accessDenied })
      response.redirect('/authenticate')
      return
    }

    /**
     * State cookie got invalidated
     */
    if (gh.stateMisMatch()) {
      logger.warn('State mismatch during Github redirect')
      response.cookie('flash_messages', { error: errorMessages.stateMisMatch })
      response.redirect('/authenticate')
      return
    }

    /**
     * Failed with some specific error message from Github
     */
    if (gh.hasError()) {
      logger.error({ err: gh.getError() }, 'Github authentication failed')
      response.cookie('flash_messages', { error: errorMessages.loginFatalError })
      response.redirect('/authenticate')
      return
    }

    const user = await gh.user()
    const username = user.original.login
    let isUserASponsor = false

    /**
     * We allow the user to view the docs if we are not able to
     * get their username from Github. It is okay to give unknown
     * access vs blocking someone with a valid sponsorship
     */
    if (!username) {
      logger.warn({ email: user.email, id: user.id }, 'Unable to read Github username')
      isUserASponsor = true
    } else {
      isUserASponsor = await isSponsoring(username, logger)
    }

    /**
     * User is not a sponsor
     */
    if (!isUserASponsor) {
      logger.info({ username }, 'User is not a valid sponsor')
      response.cookie('flash_messages', { error: errorMessages.notASponsor })
      response.redirect('/authenticate')
      return
    }

    logger.info({ username }, 'Sponsor logged in')
    response.encryptedCookie('oauth_token', username, {
      maxAge: '7 days',
      httpOnly: true,
    })
    response.redirect('/docs/installation')
  })

  router.get('*', async ({ request, response }) => {
    if (request.url() === '/') {
      return response.redirect('/docs/installation')
    }

    if (process.env.FLY_APP_NAME) {
      if (!request.encryptedCookie('oauth_token')) {
        return response.redirect('/authenticate')
      }

      /**
       * Serve from cache when running in production
       */
      return response.download(app.makePath(`dist${request.url()}.html`))
    }

    for (let collection of collections) {
      const entry = collection.findByPermalink(request.url())
      if (entry) {
        return entry.render({ collection, entry })
      }
    }

    return response.notFound('Page not found')
  })
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap(() => {
    app.initiating(() => {
      app.useConfig({
        appUrl: process.env.APP_URL || '',
        app: {
          appKey: env.get('APP_KEY'),
          http: httpConfig({}),
        },
        static: {
          enabled: true,
          etag: true,
          lastModified: true,
          dotFiles: 'ignore',
        },
        logger: {
          default: 'app',
          loggers: {
            app: {
              enabled: true,
            },
          },
        },
        vite: viteDefineConfig({
          assetsUrl: '/assets',
          buildDirectory: 'dist/assets',
        }),
        ally: allyConfig,
      })
    })

    app.starting(defineRoutes)
  })
  .httpServer()
  .start()
  .catch(console.error)
