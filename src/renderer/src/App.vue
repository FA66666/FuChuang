<template>
  <a-layout>
    <!-- 只在非登录页面显示导航栏 -->
    <a-layout-header v-if="showHeader" class="app-header">
      <div class="logo-container">
        <div class="logo">
          <img src="./assets/img/logo.png" alt="Logo" class="logo-img" />
        </div>
        <span class="logo-text">缺陷检测系统</span>
      </div>

      <div class="nav-spacer"></div>

      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="horizontal" class="nav-menu">
        <a-menu-item key="home" @click="goHome">
          <template #icon><home-outlined /></template>
          我的任务
        </a-menu-item>
        <a-menu-item key="mydata" @click="goMyData">
          <template #icon><database-outlined /></template>
          我的数据
        </a-menu-item>
        <a-menu-item key="checking" @click="goChecking">
          <template #icon><scan-outlined /></template>
          缺陷检测
        </a-menu-item>
        <a-menu-item key="report" @click="goReport">
          <template #icon><file-text-outlined /></template>
          报告生成
        </a-menu-item>

        <a-sub-menu key="user" class="user-menu">
          <template #icon><user-outlined /></template>
          <template #title>
            <span class="username-text">{{ userStore.currentUser?.username }}</span>
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

    <a-layout-content :class="{ 'app-content': showHeader, 'full-content': !showHeader }">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
  DatabaseOutlined,
  ScanOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from './store/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const selectedKeys = ref<string[]>([])

// 计算是否显示头部导航
const showHeader = computed(() => {
  return route.path !== '/login' && userStore.currentUser
})

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
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: linear-gradient(90deg, #001529 0%, #003a70 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  height: 64px; /* 固定头部高度 */
}

.logo-container {
  display: flex;
  align-items: center;
  min-width: 200px; /* 为logo区域预留固定宽度 */
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.logo-img {
  width: 36px; /* 调整logo大小 */
  height: 36px; /* 保持宽高比例一致 */
  object-fit: contain;
}

.logo-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.95;
}

.nav-spacer {
  width: 40px; /* 调整间距大小 */
}

.nav-menu {
  flex: 1;
  line-height: 64px;
  border: none;
  background: transparent;
}

:deep(.ant-menu) {
  background: transparent;
}

:deep(.ant-menu-item) {
  padding: 0 24px; /* 增加菜单项之间的间距 */
  font-size: 14px;
  transition: all 0.3s ease;
  margin: 0 4px !important; /* 确保菜单项之间有间距 */
}

:deep(.ant-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.ant-menu-item-selected) {
  background: rgba(24, 144, 255, 0.2) !important;
}

.user-menu {
  float: right;
}

.username-text {
  margin-left: 8px;
  font-size: 14px;
}

.app-content {
  padding: 24px;
  margin-top: 64px;
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
  transition: all 0.3s ease;
}

.full-content {
  min-height: 100vh;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .logo-text {
    display: none;
  }

  .app-header {
    padding: 0 12px;
  }

  :deep(.ant-menu-item) {
    padding: 0 12px;
  }
}

/* 动画效果 */
.app-header {
  animation: headerSlideDown 0.3s ease;
}

@keyframes headerSlideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
