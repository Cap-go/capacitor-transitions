import App from './App.svelte'
import { initTransitions } from '@capgo/transitions/svelte'
import './styles.css'

// Initialize transitions
initTransitions({ platform: 'auto' })

const app = new App({
  target: document.getElementById('app')!,
})

export default app
