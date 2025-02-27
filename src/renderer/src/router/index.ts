import { createRouter, createWebHistory } from 'vue-router'
import Home from '@renderer/views/Home.vue'
import Checking from '@renderer/views/Checking.vue'
import MyData from '@renderer/views/MyData.vue'
import Report from '@renderer/views/Report.vue'
import Login from '@renderer/views/Login.vue'
import UserCenter from '@renderer/views/UserCenter.vue'
import { useUserStore } from '../store/userStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/user',
      name: 'UserCenter',
      component: UserCenter,
      meta: { requiresAuth: true }
    },
    {
      path: '/checking',
      name: 'Checking',
      component: Checking,
      meta: { requiresAuth: true }
    },
    {
      path: '/mydata',
      name: 'MyData',
      component: MyData,
      meta: { requiresAuth: true }
    },
    {
      path: '/report',
      name: 'Report',
      component: Report,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  await userStore.initialize()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }
})

export default router
