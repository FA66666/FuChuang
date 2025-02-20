<template>
    <div class="report">
        <h1>检测报告</h1>
        <div v-if="reportData">
            <p>报告数据：</p>
            <p>{{ reportData }}</p>
        </div>
        <button @click="downloadReport">下载报告</button>
    </div>
</template>

<script setup>
import { useAppStore } from '@renderer/store'

const store = useAppStore()
const reportData = ref("检测报告内容将在此显示...") // 模拟报告内容

const downloadReport = () => {
    // 这里可以实现生成和下载报告的功能
    alert("报告下载中...")
}
</script>

<style scoped>
.report {
    display: flex;
    flex-direction: column;
    align-items: center;
}

button {
    margin-top: 20px;
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
