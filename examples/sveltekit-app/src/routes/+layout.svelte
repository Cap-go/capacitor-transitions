<script lang="ts">
  import { onMount } from 'svelte'
  import { initTransitions, routerOutlet } from '@capgo/transitions/svelte'
  import '@capgo/transitions'
  import '../app.css'

  // Initialize on mount
  onMount(() => {
    initTransitions({ platform: 'auto' })
  })
</script>

<cap-router-outlet use:routerOutlet={{ platform: 'auto' }}>
  <slot />
</cap-router-outlet>
