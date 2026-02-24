import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { initTransitions } from '@capgo/transitions/vue'
import '@capgo/transitions'
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

// Initialize transitions once at startup
initTransitions({ platform: 'auto' })

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
