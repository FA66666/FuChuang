<template>
  <a-layout>
    <!-- Header with top navigation -->
    <a-layout-header :style="{ position: 'fixed', zIndex: 1, width: '100%' }">
      <div class="logo" />
      <a-menu theme="dark" mode="horizontal" v-model:selectedKeys="selectedKeys" :style="{ lineHeight: '64px' }">
        <a-menu-item key="1" @click="goHome">首页</a-menu-item>
        <a-menu-item key="2" @click="goChecking">检测</a-menu-item>
        <a-menu-item key="3" @click="goMyData">我的数据</a-menu-item>
        <a-menu-item key="4" @click="goReport">报告</a-menu-item>
      </a-menu>
    </a-layout-header>

    <a-layout>
      <a-layout-content :style="{ padding: '0 50px', marginTop: '80px', minHeight: 'calc(100vh - 64px)' }">

        <!-- Router view to display content based on the current route -->
        <router-view class="main-content"></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';  // 引入 vue-router

const router = useRouter();  // 使用 useRouter 获取路由实例
const selectedKeys = ref<string[]>(['1']);  // 默认选中 "首页"

// 路由跳转方法
const goHome = () => {
  router.push('/');  // 跳转到首页
};
const goChecking = () => {
  router.push('/checking');  // 跳转到检测
};
const goMyData = () => {
  router.push('/mydata');  // 跳转到我的数据
};
const goReport = () => {
  router.push('/report');  // 跳转到报告
};


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
