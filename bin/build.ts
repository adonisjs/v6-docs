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
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

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
   * Read the HTML file to extract the meta description and category
   * This is super hackish but works for now. Ideally, we should be able to extract
   * frontmatter from markdown files, I think Dimmer doesn't support it yet.
   */
  const htmlLocation = joinToURL(import.meta.url, '../', 'dist', htmlOutput)
  const html = await readFile(htmlLocation, 'utf-8')
  const metaDescription = html.match(/<meta name="og:description" content="(.*)">/)
  const description = metaDescription ? metaDescription[1] : ''
  const category = html.match(
    /<meta property="og:url" content="https:\/\/docs\.adonisjs\.com\/guides\/(.*)\/.*">/
  )

  /**
   * Create the og directory when missing
   */
  if (!existsSync('public/og')) await mkdir('public/og', { recursive: true })

  /**
   * Generate the output filename
   */
  const relativePath = relative(join(fileURLToPath(APP_ROOT), 'content/docs'), entry.contentPath)
  const filename = relativePath.replace('.md', '').replace(/\//g, '-').replace('-', '_')

  /**
   * Skip generating the og image when it already exists
   */
  const output = `public/og/${filename}.png`
  let shouldGenerateOgImage = true
  if (existsSync(output)) {
    shouldGenerateOgImage = false
  }

  // 日本語を30文字ずつに分割
  const lines = description
    .trim()
    .split('')
    .reduce(
      (acc, curr) => {
        if (acc[acc.length - 1].length === 30) {
          acc.push('')
        }
        acc[acc.length - 1] += curr
        return acc
      },
      ['']
    )
    .filter(Boolean)

  const svg = ogTemplate
    .replace(
      '{{ category }}',
      category ? string.titleCase(category[1].replaceAll('-', ' ')) : 'Docs'
    )
    .replace('{{ title }}', string.encodeSymbols(entry.title.slice(0, 24)))
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
    console.error('Failed to generate og image for %s', entry.title, e)
  }

  /**
   * Insert the og:image and twitter:image meta tags
   */
  const ogImageUrl = output.replace('public/', 'https://adonisjs-docs-ja.vercel.app/')
  const tags = `
    <meta property="og:image" content="${ogImageUrl}">
    <meta name="twitter:image" content="${ogImageUrl}">
    <meta name="twitter:card" content="summary_large_image">
  `

  const updatedHtml = html.replace('</head>', `${tags}</head>`)
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
