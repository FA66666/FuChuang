<template>
    <div class="home">
        <h1>欢迎使用车辆零部件表面缺陷检测系统</h1>
        <p>请选择操作：</p>
        <router-link to="/checking">
            <button>开始检测</button>
        </router-link>
        <router-link to="/mydata">
            <button>我的数据</button>
        </router-link>
        <router-link to="/report">
            <button>查看报告</button>
        </router-link>
    </div>
</template>

<script setup>
// 这个页面可以作为应用的主页，展示一些基本信息和导航链接
</script>

<style scoped>
.home {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

button {
    margin: 10px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
}

button:hover {
    background-color: #45a049;
}
</style>
