import { createApp } from 'vue'
import App from './App.vue'
// import routes from 'virtual:generated-pages'
// import { createRouter, createWebHistory } from 'vue-router'
import 'uno.css'
import './main.css'

const app = createApp(App)

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes,
// })

// app.use(router)
app.mount('#app')
