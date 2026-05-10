<script lang="ts">
  import { onMount } from 'svelte'
  import { initTransitions, routerOutlet } from '@capgo/capacitor-transitions/svelte'
  import '@capgo/capacitor-transitions'
  import '../app.css'

  // Initialize on mount
  onMount(() => {
    initTransitions({ platform: 'auto' })
  })
</script>

<cap-router-outlet use:routerOutlet={{ platform: 'auto' }}>
  <slot />
</cap-router-outlet>
