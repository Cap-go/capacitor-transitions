export default defineNuxtConfig({
  devtools: { enabled: true },

  // Enable SSG for Capacitor
  ssr: false,

  // Configure Vue to recognize custom elements
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('cap-'),
    },
  },

  // Vite configuration
  vite: {
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('cap-'),
        },
      },
    },
  },

  compatibilityDate: '2024-01-01',
})
