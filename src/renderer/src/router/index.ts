import { createRouter, createWebHistory } from 'vue-router'

// 引入你的组件
import Home from '@renderer/views/Home.vue'
import Checking from '@renderer/views/Checking.vue'
import MyData from '@renderer/views/MyData.vue'
import Report from '@renderer/views/Report.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/checking',
      name: 'Checking',
      component: Checking
    },
    {
      path: '/mydata',
      name: 'MyData',
      component: MyData
    },
    {
      path: '/report',
      name: 'Report',
      component: Report
    }
  ]
})
