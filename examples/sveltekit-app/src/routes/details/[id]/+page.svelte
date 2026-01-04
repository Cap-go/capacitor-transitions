<script lang="ts">
  import { goto } from '$app/navigation'
  import { page as pageStore } from '$app/stores'
  import { page, setDirection } from '@capgo/transitions/svelte'

  $: id = $pageStore.params.id

  const goBack = () => {
    setDirection('back')
    goto('/')
  }

  const goDeeper = () => {
    setDirection('forward')
    goto(`/nested/${id}`)
  }
</script>

<cap-page use:page={{
  onDidEnter: () => console.log(`Details ${id} entered`),
  onDidLeave: () => console.log(`Details ${id} left`),
}}>
  <cap-header slot="header">
    <div class="toolbar">
      <button class="back-button" on:click={goBack}>‹ Back</button>
      <h1>Details {id}</h1>
    </div>
  </cap-header>
  <cap-content slot="content">
    <div class="page-content">
      <h2>Detail View</h2>
      <p>This is the details page for item {id}.</p>
      <p>SvelteKit works seamlessly with Cap Transitions.</p>

      <button class="primary-button" on:click={goDeeper}>Go Deeper</button>

      <div class="scroll-demo">
        <h3>Scroll Content</h3>
        {#each Array.from({ length: 20 }) as _, i}
          <p>Scroll item {i + 1}</p>
        {/each}
      </div>
    </div>
  </cap-content>
</cap-page>
