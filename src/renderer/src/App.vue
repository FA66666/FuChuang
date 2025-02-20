<template>
    <div id="app">
        <router-view></router-view> <!-- 路由视图会根据当前路径加载不同的页面 -->
    </div>
</template>

<script setup>
// 如果需要全局配置或引入全局逻辑，可以在这里进行设置
import { defineComponent, onMounted } from 'vue'

// 你可以在这里执行一些全局初始化，比如设置标题、语言、主题等
onMounted(() => {
    document.title = "车辆零部件表面缺陷检测系统"
})
</script>

<style scoped>
/* 这里你可以放置针对整个应用的样式 */
#app {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background-color: #fafafa;
}

/* 为了全局使用，推荐在此引用外部样式库或其他全局样式 */
@import './assets/styles/global.css';
/* 假设你有一个全局样式文件 */
</style>
