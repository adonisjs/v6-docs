import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  typescript: true,
  directories: {
    views: 'templates',
    public: 'dist',
  } as any,
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/http_provider'),
    () => import('@adonisjs/core/providers/edge_provider'),
    () => import('@adonisjs/vite/vite_provider'),
    () => import('@adonisjs/ally/ally_provider'),
    () => import('@adonisjs/static/static_provider'),
  ],
  metaFiles: [
    {
      pattern: './public/**/*',
      reloadServer: false,
    },
  ],
})
