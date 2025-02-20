<template>
    <div class="checking">
        <h1>表面缺陷检测</h1>
        <div>
            <input type="file" @change="handleImageUpload" />
            <button @click="startDetection">开始检测</button>
        </div>
        <div v-if="detectionResult">
            <h2>检测结果：</h2>
            <p>{{ detectionResult }}</p>
        </div>
    </div>
</template>

<script setup>
import { useAppStore } from '@renderer/store'
import { ref } from 'vue'

const store = useAppStore()
const detectionResult = ref(null)

const handleImageUpload = (event) => {
    store.setImageData(event.target.files[0])
}

const startDetection = async () => {
    // 这里模拟一个检测过程，实际项目中会发起请求进行缺陷检测
    detectionResult.value = "检测完成：无缺陷" // 临时模拟结果
    store.setDetectionResult(detectionResult.value)
}
</script>

<style scoped>
.checking {
    display: flex;
    flex-direction: column;
    align-items: center;
}

button {
    margin-top: 10px;
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
