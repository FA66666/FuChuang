import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// 路由
import router from './router'
// pinia
import { createPinia } from 'pinia'
// Ant Design Vue
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)
app.use(router).use(createPinia()).use(Antd).mount('#app')
