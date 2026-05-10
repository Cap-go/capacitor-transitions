import { initTransitions } from '@capgo/capacitor-transitions/vue'
import '@capgo/capacitor-transitions'

export default defineNuxtPlugin(() => {
  // Initialize transitions on client side only
  initTransitions({ platform: 'auto' })
})
