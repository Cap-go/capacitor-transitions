<script lang="ts">
  import { goto } from '$app/navigation'
  import { page as pageStore } from '$app/stores'
  import { page, setDirection } from '@capgo/transitions/svelte'

  $: id = $pageStore.params.id

  const goBack = () => {
    setDirection('back')
    history.back()
  }

  const goHome = () => {
    setDirection('root')
    goto('/')
  }
</script>

<cap-page use:page>
  <cap-header slot="header">
    <div class="toolbar">
      <button class="back-button" on:click={goBack}>‹ Back</button>
      <h1>Nested {id}</h1>
    </div>
  </cap-header>
  <cap-content slot="content">
    <div class="page-content">
      <h2>Deeply Nested View</h2>
      <p>This is a nested page to demonstrate multi-level navigation.</p>

      <button class="primary-button" on:click={goHome}>
        Go to Root (with fade)
      </button>
    </div>
  </cap-content>
</cap-page>
