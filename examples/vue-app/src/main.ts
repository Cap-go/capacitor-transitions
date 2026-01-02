import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createTransitions } from '@capgo/transitions/vue'
import App from './App.vue'
import HomePage from './pages/HomePage.vue'
import DetailsPage from './pages/DetailsPage.vue'
import NestedPage from './pages/NestedPage.vue'
import './styles.css'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/details/:id', component: DetailsPage },
    { path: '/nested/:id', component: NestedPage },
  ],
})

// Create transitions plugin
const transitions = createTransitions({
  platform: 'auto',
})

// Create and mount app
const app = createApp(App)
app.use(router)
app.use(transitions)
app.mount('#app')
