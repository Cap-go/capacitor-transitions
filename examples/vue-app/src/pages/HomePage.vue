<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Page, Header, Content, Footer, useTransition } from '@capgo/transitions/vue'

const router = useRouter()
const { setDirection } = useTransition()

const goToDetails = (id: number) => {
  setDirection('forward')
  router.push(`/details/${id}`)
}

const onDidEnter = () => {
  console.log('Home entered')
}

const onDidLeave = () => {
  console.log('Home left')
}
</script>

<template>
  <Page @did-enter="onDidEnter" @did-leave="onDidLeave">
    <Header>
      <div class="toolbar">
        <h1>Home</h1>
      </div>
    </Header>
    <Content>
      <div class="page-content">
        <h2>Welcome to Cap Transitions</h2>
        <p>This example shows iOS-style page transitions in Vue.</p>

        <div class="list">
          <button
            v-for="id in 5"
            :key="id"
            class="list-item"
            @click="goToDetails(id)"
          >
            <span>Item {{ id }}</span>
            <span class="chevron">›</span>
          </button>
        </div>
      </div>
    </Content>
    <Footer>
      <div class="tab-bar">
        <button class="tab active">Home</button>
        <button class="tab">Search</button>
        <button class="tab">Profile</button>
      </div>
    </Footer>
  </Page>
</template>
