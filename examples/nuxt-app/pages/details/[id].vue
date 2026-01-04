<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { setupPage, setDirection } from '@capgo/transitions/vue'

const router = useRouter()
const route = useRoute()
const id = computed(() => route.params.id as string)
const pageRef = ref<HTMLElement | null>(null)
let cleanup: (() => void) | undefined

onMounted(() => {
  if (pageRef.value) {
    cleanup = setupPage(pageRef.value, {
      onDidEnter: () => console.log(`Details ${id.value} entered`),
      onDidLeave: () => console.log(`Details ${id.value} left`),
    })
  }
})

onUnmounted(() => cleanup?.())

const goBack = () => {
  setDirection('back')
  router.push('/')
}

const goDeeper = () => {
  setDirection('forward')
  router.push(`/nested/${id.value}`)
}
</script>

<template>
  <cap-page ref="pageRef">
    <cap-header slot="header">
      <div class="toolbar">
        <button class="back-button" @click="goBack">‹ Back</button>
        <h1>Details {{ id }}</h1>
      </div>
    </cap-header>
    <cap-content slot="content">
      <div class="page-content">
        <h2>Detail View</h2>
        <p>This is the details page for item {{ id }}.</p>
        <p>Nuxt 3 works seamlessly with Cap Transitions.</p>

        <button class="primary-button" @click="goDeeper">Go Deeper</button>

        <div class="scroll-demo">
          <h3>Scroll Content</h3>
          <p v-for="i in 20" :key="i">Scroll item {{ i }}</p>
        </div>
      </div>
    </cap-content>
  </cap-page>
</template>
