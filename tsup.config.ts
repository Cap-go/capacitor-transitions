import { defineConfig } from 'tsup'

export default defineConfig([
  // Core library (framework-agnostic)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  // React bindings
  {
    entry: ['src/react/index.ts'],
    outDir: 'dist/react',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom'],
  },
  // Vue bindings
  {
    entry: ['src/vue/index.ts'],
    outDir: 'dist/vue',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['vue'],
  },
  // Svelte bindings
  {
    entry: ['src/svelte/index.ts'],
    outDir: 'dist/svelte',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['svelte'],
  },
  // Solid bindings
  {
    entry: ['src/solid/index.ts'],
    outDir: 'dist/solid',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['solid-js'],
  },
])
