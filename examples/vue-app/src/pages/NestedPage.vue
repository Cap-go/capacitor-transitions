<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Page, Header, Content, useTransition } from '@capgo/transitions/vue'

const router = useRouter()
const route = useRoute()
const { setDirection } = useTransition()

const id = route.params.id

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
  <Page>
    <Header>
      <div class="toolbar">
        <button class="back-button" @click="goBack">‹ Back</button>
        <h1>Nested {{ id }}</h1>
      </div>
    </Header>
    <Content>
      <div class="page-content">
        <h2>Deeply Nested View</h2>
        <p>This is a nested page to demonstrate multi-level navigation.</p>

        <button class="primary-button" @click="goHome">
          Go to Root (with fade)
        </button>
      </div>
    </Content>
  </Page>
</template>
