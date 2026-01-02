<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Page, Header, Content, useTransition } from '@capgo/transitions/vue'

const router = useRouter()
const route = useRoute()
const { setDirection } = useTransition()

const id = route.params.id

const goBack = () => {
  setDirection('back')
  router.push('/')
}

const goDeeper = () => {
  setDirection('forward')
  router.push(`/nested/${id}`)
}
</script>

<template>
  <Page>
    <Header>
      <div class="toolbar">
        <button class="back-button" @click="goBack">‹ Back</button>
        <h1>Details {{ id }}</h1>
      </div>
    </Header>
    <Content>
      <div class="page-content">
        <h2>Detail View</h2>
        <p>This is the details page for item {{ id }}.</p>
        <p>Notice the smooth iOS-style transition when navigating.</p>

        <button class="primary-button" @click="goDeeper">Go Deeper</button>

        <div class="scroll-demo">
          <h3>Scroll Content</h3>
          <p v-for="i in 20" :key="i">Scroll item {{ i }}</p>
        </div>
      </div>
    </Content>
  </Page>
</template>
