import { initTransitions } from '@capgo/transitions/vue'
import '@capgo/transitions'

export default defineNuxtPlugin(() => {
  // Initialize transitions on client side only
  initTransitions({ platform: 'auto' })
})
