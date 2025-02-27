<template>
  <a-layout>
    <a-layout-header :style="{ position: 'fixed', zIndex: 1, width: '100%' }">
      <div class="logo" />
      <a-menu theme="dark" mode="horizontal" v-model:selectedKeys="selectedKeys" :style="{ lineHeight: '64px' }">
        <!-- 左侧菜单项 -->
        <a-menu-item key="home" @click="goHome">我的任务</a-menu-item>
        <a-menu-item key="mydata" @click="goMyData">我的数据</a-menu-item>
        <a-menu-item key="checking" @click="goChecking">缺陷检测</a-menu-item>
        <a-menu-item key="report" @click="goReport">报告生成</a-menu-item>

        <!-- 右侧用户状态菜单 -->
        <a-menu-item v-if="userStore.isLoggedIn" key="logout" style="margin-left: auto" @click="handleLogout">
          退出登录
        </a-menu-item>
        <a-menu-item v-else key="login" style="margin-left: auto" @click="goLogin">
          登录/注册
        </a-menu-item>
      </a-menu>
    </a-layout-header>

    <a-layout>
      <a-layout-content :style="{ padding: '0 50px', marginTop: '80px', minHeight: 'calc(100vh - 64px)' }">
        <router-view class="main-content"></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>


<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './store/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const selectedKeys = ref<string[]>([])


// 路由变化时更新菜单选中状态
// 路由监听
watch(() => route.path, (path) => {
  switch (path) {
    case '/': selectedKeys.value = ['home']; break
    case '/checking': selectedKeys.value = ['checking']; break
    case '/mydata': selectedKeys.value = ['mydata']; break
    case '/report': selectedKeys.value = ['report']; break
    default: selectedKeys.value = []
  }
}, { immediate: true })


// 导航方法
const goHome = () => router.push('/')
const goChecking = () => router.push('/checking')
const goMyData = () => router.push('/mydata')
const goReport = () => router.push('/report')
const goLogin = () => router.push('/login')

// 退出登录
const handleLogout = () => {
  userStore.logout()
  router.replace('/login')
}

</script>

<style scoped>
html,
body {
  height: 100%;
  /* 使 html 和 body 元素的高度为 100% */
  margin: 0;
  /* 去掉页面默认的外边距 */
}

#components-layout-demo-fixed .logo {
  width: 120px;
  height: 31px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px 24px 16px 0;
  float: left;
}

.site-layout .site-layout-background {
  background: #fff;
}

[data-theme='dark'] .site-layout .site-layout-background {
  background: #141414;
}
</style>
