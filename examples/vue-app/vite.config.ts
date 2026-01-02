import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat cap-* as custom elements
          isCustomElement: (tag) => tag.startsWith('cap-'),
        },
      },
    }),
  ],
})
