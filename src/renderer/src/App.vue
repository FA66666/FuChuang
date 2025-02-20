<template>
  <div id="app">
    <!-- 导航栏 -->
    <div class="sidebar">
      <router-link to="/" class="menu-item">首页</router-link>
      <router-link to="/checking" class="menu-item">检测</router-link>
      <router-link to="/mydata" class="menu-item">我的数据</router-link>
      <router-link to="/report" class="menu-item">报告</router-link>
    </div>
    <!-- 这里渲染路由的内容 -->
    <router-view class="main-content"></router-view>
  </div>
</template>

<script setup>
// 这里可以进行一些初始化操作
</script>

<style scoped>
#app {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
}

/* 侧边栏样式 */
.sidebar {
  width: 200px;
  background-color: #2f3b52;
  color: white;
  padding-top: 20px;
}

.menu-item {
  display: block;
  padding: 10px 20px;
  color: white;
  text-decoration: none;
}

.menu-item:hover {
  background-color: #4f5b67;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f4f4f4;
}
</style>
