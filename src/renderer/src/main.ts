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
app.use(router).use(createPinia()).use(Antd)

import { useUserStore } from './store/userStore'

const userStore = useUserStore()
userStore.initialize()

// 检查admin用户是否存在
const adminExists = userStore.users.some((user) => user.username.toLowerCase() === 'admin')

// 自动创建初始管理员（如果不存在）
if (!adminExists) {
  try {
    userStore.register(
      'Admin', // 用户名
      'Admin@123', // 强密码
      true // 设为管理员
    )
    console.log('🎉 系统管理员已创建\n👉 用户名: Admin\n🔑 密码: Admin@123')
  } catch (error) {
    console.error('❌ 创建管理员失败:', error)
  }
}

app.mount('#app')
