<script lang="ts">
  import { goto } from '$app/navigation'
  import { page, setDirection } from '@capgo/transitions/svelte'

  const goToDetails = (id: number) => {
    setDirection('forward')
    goto(`/details/${id}`)
  }
</script>

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
      <h2>SvelteKit + Cap Transitions</h2>
      <p>This example shows iOS-style page transitions with SvelteKit.</p>

      <div class="list">
        {#each [1, 2, 3, 4, 5] as id}
          <button class="list-item" on:click={() => goToDetails(id)}>
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
