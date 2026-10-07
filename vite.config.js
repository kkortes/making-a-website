import { defineConfig } from 'vite'
import vibe from '@ape-egg/vite-plugin-vibe'

import { steps } from './steps.js'

export default defineConfig({
  publicDir: 'steps',
  resolve: { preserveSymlinks: true },
  server: { allowedHosts: ['.localhost'] },
  plugins: [
    vibe(),
    {
      name: 'steps',
      configureServer: server => {
        server.middlewares.use('/steps.json', async (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(await steps()))
        })
      },
    },
  ],
})
