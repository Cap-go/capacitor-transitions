<script lang="ts">
  import { routerOutlet, page, setDirection } from '@capgo/transitions/svelte'
  import '@capgo/transitions'

  // Simple hash-based routing for demo
  let currentRoute = $state(window.location.hash || '#/')
  let routeParams = $state<Record<string, string>>({})

  function navigate(to: string, direction: 'forward' | 'back' | 'root' = 'forward') {
    setDirection(direction)
    window.location.hash = to
  }

  $effect(() => {
    const handleHashChange = () => {
      currentRoute = window.location.hash || '#/'
      // Parse params like #/details/1
      const match = currentRoute.match(/#\/(\w+)\/(\d+)/)
      if (match) {
        routeParams = { id: match[2] }
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  })

  const items = [1, 2, 3, 4, 5]
  const scrollItems = Array.from({ length: 20 }, (_, i) => i + 1)
</script>

<cap-router-outlet use:routerOutlet>
  {#if currentRoute === '#/' || currentRoute === ''}
    <cap-page use:page={{
      onDidEnter: () => console.log('Home entered'),
      onDidLeave: () => console.log('Home left'),
    }}>
      <cap-header slot="header">
        <div class="toolbar">
          <h1>Home</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Welcome to Cap Transitions</h2>
          <p>This example shows iOS-style page transitions in Svelte.</p>

          <div class="list">
            {#each items as id}
              <button class="list-item" onclick={() => navigate(`#/details/${id}`)}>
                <span>Item {id}</span>
                <span class="chevron">›</span>
              </button>
            {/each}
          </div>
        </div>
      </cap-content>
      <cap-footer slot="footer">
        <div class="tab-bar">
          <button class="tab active">Home</button>
          <button class="tab">Search</button>
          <button class="tab">Profile</button>
        </div>
      </cap-footer>
    </cap-page>
  {:else if currentRoute.startsWith('#/details/')}
    <cap-page use:page>
      <cap-header slot="header">
        <div class="toolbar">
          <button class="back-button" onclick={() => navigate('#/', 'back')}>‹ Back</button>
          <h1>Details {routeParams.id}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Detail View</h2>
          <p>This is the details page for item {routeParams.id}.</p>
          <p>Notice the smooth iOS-style transition when navigating.</p>

          <button class="primary-button" onclick={() => navigate(`#/nested/${routeParams.id}`)}>
            Go Deeper
          </button>

          <div class="scroll-demo">
            <h3>Scroll Content</h3>
            {#each scrollItems as i}
              <p>Scroll item {i}</p>
            {/each}
          </div>
        </div>
      </cap-content>
    </cap-page>
  {:else if currentRoute.startsWith('#/nested/')}
    <cap-page use:page>
      <cap-header slot="header">
        <div class="toolbar">
          <button class="back-button" onclick={() => navigate(`#/details/${routeParams.id}`, 'back')}>‹ Back</button>
          <h1>Nested {routeParams.id}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Deeply Nested View</h2>
          <p>This is a nested page to demonstrate multi-level navigation.</p>

          <button class="primary-button" onclick={() => navigate('#/', 'root')}>
            Go to Root (with fade)
          </button>
        </div>
      </cap-content>
    </cap-page>
  {/if}
</cap-router-outlet>
