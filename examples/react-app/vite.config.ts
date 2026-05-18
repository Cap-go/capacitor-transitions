import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const source = (path: string): string => fileURLToPath(new URL(`../../src/${path}`, import.meta.url))

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: {
      '@capgo/capacitor-transitions/react': source('react/index.ts'),
      '@capgo/capacitor-transitions': source('index.ts'),
    },
  },
})
