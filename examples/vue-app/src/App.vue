<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { setupRouterOutlet } from '@capgo/transitions/vue'

const outletRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (outletRef.value) {
    setupRouterOutlet(outletRef.value, { platform: 'auto' })
  }
})
</script>

<template>
  <cap-router-outlet ref="outletRef">
    <router-view />
  </cap-router-outlet>
</template>
