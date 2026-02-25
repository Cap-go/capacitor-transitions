<script lang="ts">
  import { routerOutlet, page, setDirection } from '@capgo/transitions/svelte'
  import '@capgo/transitions'

  type View = 'home' | 'details' | 'nested'
  let route: { view: View; id: string } = { view: 'home', id: '1' }

  function navigateToDetails(id: number) {
    setDirection('forward')
    route = { view: 'details', id: String(id) }
  }

  function backToHome() {
    setDirection('back')
    route = { ...route, view: 'home' }
  }

  function goNested() {
    setDirection('forward')
    route = { ...route, view: 'nested' }
  }

  function backToDetails() {
    setDirection('back')
    route = { ...route, view: 'details' }
  }

  function goRoot() {
    setDirection('root')
    route = { ...route, view: 'home' }
  }

  const items = [1, 2, 3, 4, 5]
  const scrollItems = Array.from({ length: 20 }, (_, i) => i + 1)
</script>

<cap-router-outlet use:routerOutlet>
  {#if route.view === 'home'}
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
              <button class="list-item" on:click={() => navigateToDetails(id)}>
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
  {:else if route.view === 'details'}
    <cap-page use:page>
      <cap-header slot="header">
        <div class="toolbar">
          <button class="back-button" on:click={backToHome}>‹ Back</button>
          <h1>Details {route.id}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Detail View</h2>
          <p>This is the details page for item {route.id}.</p>
          <p>Notice the smooth iOS-style transition when navigating.</p>

          <button class="primary-button" on:click={goNested}>
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
  {:else if route.view === 'nested'}
    <cap-page use:page>
      <cap-header slot="header">
        <div class="toolbar">
          <button class="back-button" on:click={backToDetails}>‹ Back</button>
          <h1>Nested {route.id}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Deeply Nested View</h2>
          <p>This is a nested page to demonstrate multi-level navigation.</p>

          <button class="primary-button" on:click={goRoot}>
            Go to Root (with fade)
          </button>
        </div>
      </cap-content>
    </cap-page>
  {/if}
</cap-router-outlet>
