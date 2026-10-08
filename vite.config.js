import { defineConfig } from 'vite'
import vibe from '@ape-egg/vite-plugin-vibe'

export default defineConfig({
  publicDir: 'steps',
  resolve: { preserveSymlinks: true },
  server: { allowedHosts: ['.localhost'] },
  plugins: [
    vibe(),
    {
      name: 'steps',
      configureServer: server => {
        // Loaded through Vite's module graph, not imported: the config never depends on steps.js, and the watcher hands each request the fresh file
        server.middlewares.use('/steps.json', async (req, res) => {
          const { steps } = await server.ssrLoadModule('/steps.js')
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(await steps()))
        })
      },
    },
  ],
})
