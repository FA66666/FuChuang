<template>
  <a-layout>
    <a-layout-header class="app-header">
      <div class="logo" />
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="horizontal" :style="{ lineHeight: '64px' }">
        <a-menu-item key="home" @click="goHome">我的任务</a-menu-item>
        <a-menu-item key="checking" @click="goChecking">缺陷检测</a-menu-item>
        <a-menu-item key="mydata" @click="goMyData">我的数据</a-menu-item>
        <a-menu-item key="report" @click="goReport">报告生成</a-menu-item>

        <a-sub-menu key="user" style="margin-left: auto">
          <template #title>
            <span><user-outlined /> {{ userStore.currentUser?.username }}</span>
          </template>
          <a-menu-item key="user-center" @click="goUserCenter">
            <template #icon><setting-outlined /></template>
            用户中心
          </a-menu-item>
          <a-menu-item key="logout" @click="handleLogout">
            <template #icon><logout-outlined /></template>
            退出登录
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-header>

    <a-layout-content class="app-content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from './store/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const selectedKeys = ref<string[]>([])

watch(() => route.path, updateSelectedKeys, { immediate: true })

function updateSelectedKeys() {
  const pathMap: Record<string, string> = {
    '/': 'home',
    '/checking': 'checking',
    '/mydata': 'mydata',
    '/report': 'report',
    '/user': 'user'
  }
  selectedKeys.value = [pathMap[route.path] || '']
}

// 导航方法
const goHome = () => router.push('/')
const goChecking = () => router.push('/checking')
const goMyData = () => router.push('/mydata')
const goReport = () => router.push('/report')
const goUserCenter = () => router.push('/user')
const handleLogout = () => {
  userStore.logout()
  router.replace('/login')
}
</script>

<style scoped>
.app-header {
  position: fixed;
  z-index: 1;
  width: 100%;
}

.app-content {
  padding: 24px;
  margin-top: 64px;
  min-height: calc(100vh - 64px);
}

.logo {
  width: 120px;
  height: 31px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px 24px 16px 0;
  float: left;
}
</style>