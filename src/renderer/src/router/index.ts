import { createRouter, createWebHistory } from 'vue-router'

// 引入你的组件
import Home from '@renderer/views/Home.vue'
import Checking from '@renderer/views/Checking.vue'
import MyData from '@renderer/views/MyData.vue'
import Report from '@renderer/views/Report.vue'
// import SelectTask from '@renderer/views/Report/SelectTask.vue' // 假设你的组件路径
// import VisualAnalysis from '@renderer/views/Report/VisualAnalysis.vue' // 假设你的组件路径
// import AiAnalysis from '@renderer/views/Report/AiAnalysis.vue' // 假设你的组件路径

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
      // children: [
      //   {
      //     path: 'select-task', // 对应选择任务的页面
      //     name: 'SelectTask',
      //     component: SelectTask
      //   },
      //   {
      //     path: 'visual-analysis', // 对应可视化分析的页面
      //     name: 'VisualAnalysis',
      //     component: VisualAnalysis
      //   },
      //   {
      //     path: 'ai-analysis', // 对应AI分析的页面
      //     name: 'AiAnalysis',
      //     component: AiAnalysis
      //   }
      // ]
    }
  ]
})
