import App from './App.svelte'
import { mount } from 'svelte'
import { initTransitions } from '@capgo/transitions/svelte'
import './styles.css'

// Initialize transitions
initTransitions({ platform: 'auto' })

export default mount(App, {
  target: document.getElementById('app')!,
})
