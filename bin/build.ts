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
import sharp from 'sharp'
import { Ignitor } from '@adonisjs/core'
import { defineConfig } from '@adonisjs/vite'
import { Collection } from '@dimerapp/content'
import { mkdir, readFile } from 'node:fs/promises'
import { joinToURL } from '@adonisjs/core/helpers'
import { existsSync, writeFileSync } from 'node:fs'
import string from '@adonisjs/core/helpers/string'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

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

const ogTemplate = await readFile(joinToURL(import.meta.url, '../assets/og_template.svg'), 'utf-8')

async function generateOgImage(entry: ReturnType<Collection['all']>[0], htmlOutput: string) {
  /**
   * Read the HTML file to extract the meta description
   */
  const htmlLocation = joinToURL(import.meta.url, '../', 'dist', htmlOutput)
  const html = await readFile(htmlLocation, 'utf-8')
  const metaDescription = html.match(/<meta name="og:description" content="(.*)">/)
  const description = metaDescription ? metaDescription[1] : ''

  /**
   * Create the og directory when missing
   */
  if (!existsSync('public/og')) await mkdir('public/og', { recursive: true })

  /**
   * Skip generating the og image when it already exists
   */
  const slugifiedTitle = string.slug(entry.title, { lower: true })
  const output = `public/og/${slugifiedTitle}.png`
  let shouldGenerateOgImage = true
  if (existsSync(output)) {
    shouldGenerateOgImage = false
  }

  /**
   * Take 3 lines of 40 characters each
   * insert them in the svg template
   */
  const lines = description
    .trim()
    .split(/(.{0,60})(?:\s|$)/g)
    .filter(Boolean)

  const svg = ogTemplate
    // max 24 characters for the title
    .replace('{{ title }}', entry.title.slice(0, 24))
    .replace('{{ line1 }}', lines[0])
    .replace('{{ line2 }}', lines[1] || '')
    .replace('{{ line3 }}', lines[2] || '')

  try {
    if (shouldGenerateOgImage) {
      await sharp(Buffer.from(svg))
        .resize(1200 * 1.1, 630 * 1.1)
        .png()
        .toFile(output)
    }
  } catch (e) {
    console.error('Failed to generate og image', e)
  }

  /**
   * Insert the og:image meta tag in the output
   */
  const ogImageUrl = output.replace('public/', 'https://feat-og-images-v2.v6-docs.pages.dev/')
  const ogImageTag = `<meta property="og:image" content="${ogImageUrl}">`
  const updatedHtml = html.replace('</head>', `${ogImageTag}</head>`)
  writeFileSync(htmlLocation, updatedHtml)
}

/**
 * Exports collection to HTML files
 */
async function exportHTML() {
  const { collections } = await import('#src/collections')
  const { default: ace } = await import('@adonisjs/core/services/ace')
  const { default: app } = await import('@adonisjs/core/services/app')

  for (let collection of collections) {
    for (let entry of collection.all()) {
      try {
        const output = await entry.writeToDisk(app.makePath('dist'), { collection, entry })
        await generateOgImage(entry, output.filePath)
        ace.ui.logger.action(`create ${output.filePath}`).succeeded()
      } catch (error) {
        ace.ui.logger.action(`create ${entry.permalink}`).failed(error)
      }
    }
  }
}

const application = new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.initiating(() => {
      app.useConfig({
        appUrl: process.env.APP_URL || '',
        app: {
          appKey: 'zKXHe-Ahdb7aPK1ylAJlRgTefktEaACi',
          http: {},
        },
        logger: {
          default: 'app',
          loggers: {
            app: {
              enabled: true,
            },
          },
        },
        vite: defineConfig({}),
      })
    })
  })
  .createApp('console')

await application.init()
await application.boot()
await application.start(exportHTML)
