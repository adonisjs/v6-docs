import { defineConfig } from 'vite'
import Adonis from '@adonisjs/vite/plugin'

export default defineConfig({
  plugins: [Adonis({
    entrypoints: ['./assets/app.js', './assets/app.css'],
    reload: ['content/**/*', 'templates/**/*.edge'],
    publicDirectory: 'dist'
  })]
})
