import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 5273, open: false },
  assetsInclude: ['**/*.glsl', '**/*.vert'],
})
