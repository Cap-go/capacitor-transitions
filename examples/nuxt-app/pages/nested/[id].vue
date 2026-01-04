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
    cleanup = setupPage(pageRef.value)
  }
})

onUnmounted(() => cleanup?.())

const goBack = () => {
  setDirection('back')
  router.back()
}

const goHome = () => {
  setDirection('root')
  router.push('/')
}
</script>

<template>
  <cap-page ref="pageRef">
    <cap-header slot="header">
      <div class="toolbar">
        <button class="back-button" @click="goBack">‹ Back</button>
        <h1>Nested {{ id }}</h1>
      </div>
    </cap-header>
    <cap-content slot="content">
      <div class="page-content">
        <h2>Deeply Nested View</h2>
        <p>This is a nested page to demonstrate multi-level navigation.</p>

        <button class="primary-button" @click="goHome">
          Go to Root (with fade)
        </button>
      </div>
    </cap-content>
  </cap-page>
</template>
