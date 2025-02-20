<template>
    <div class="mydata">
        <h1>我的数据</h1>
        <p>查看和管理上传的数据：</p>
        <div v-if="uploadedImages.length">
            <ul>
                <li v-for="(image, index) in uploadedImages" :key="index">
                    <img :src="image" alt="Uploaded Image" width="100" />
                </li>
            </ul>
        </div>
        <div v-else>
            <p>没有上传的数据</p>
        </div>
    </div>
</template>

<script setup>
import { useAppStore } from '@renderer/store'

const store = useAppStore()
const uploadedImages = ref([])

onMounted(() => {
    // 模拟获取已上传的数据
    if (store.imageData) {
        uploadedImages.value.push(URL.createObjectURL(store.imageData))
    }
})
</script>

<style scoped>
.mydata {
    display: flex;
    flex-direction: column;
    align-items: center;
}

img {
    margin-top: 10px;
    border-radius: 5px;
}
</style>
