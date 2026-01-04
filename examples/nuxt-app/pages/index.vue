<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { setupPage, setDirection } from '@capgo/transitions/vue'

const router = useRouter()
const pageRef = ref<HTMLElement | null>(null)
let cleanup: (() => void) | undefined

onMounted(() => {
  if (pageRef.value) {
    cleanup = setupPage(pageRef.value, {
      onDidEnter: () => console.log('Home entered'),
      onDidLeave: () => console.log('Home left'),
    })
  }
})

onUnmounted(() => cleanup?.())

const goToDetails = (id: number) => {
  setDirection('forward')
  router.push(`/details/${id}`)
}
</script>

<template>
  <cap-page ref="pageRef">
    <cap-header slot="header">
      <div class="toolbar">
        <h1>Home</h1>
      </div>
    </cap-header>
    <cap-content slot="content">
      <div class="page-content">
        <h2>Nuxt + Cap Transitions</h2>
        <p>This example shows iOS-style page transitions with Nuxt 3.</p>

        <div class="list">
          <button
            v-for="id in [1, 2, 3, 4, 5]"
            :key="id"
            class="list-item"
            @click="goToDetails(id)"
          >
            <span>Item {{ id }}</span>
            <span class="chevron">›</span>
          </button>
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
</template>
