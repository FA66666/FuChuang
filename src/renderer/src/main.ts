import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// 路由
import router from './router'
// pinia

import { createPinia } from 'pinia'

const app = createApp(App)
app.use(router).use(createPinia()).mount('#app')
