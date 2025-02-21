<template>
    <div class="checking">
        <h1>表面缺陷检测</h1>
        <a-upload :before-upload="beforeUpload" :custom-request="customRequest" accept="image/*"
            show-upload-list="false">
            <a-button icon="upload">选择图片</a-button>
        </a-upload>
        <a-button type="primary" @click="startDetection" :disabled="!imageData" style="margin-top: 20px;">
            开始检测
        </a-button>

        <a-result v-if="detectionResult" status="success" title="检测完成" sub-title="无缺陷"
            extra="{[ <p>{{ detectionResult }}</p>]}" />
    </div>
</template>

<script setup>
import { useAppStore } from '@renderer/store'
import { ref } from 'vue'
import { message } from 'ant-design-vue'

const store = useAppStore()
const detectionResult = ref(null)
const imageData = ref(null)

const handleImageUpload = (event) => {
    store.setImageData(event.target.files[0])
    imageData.value = event.target.files[0] // Store the image data in local ref
}

const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
        message.error('请选择一个图片文件!')
    }
    return isImage
}

const customRequest = (option) => {
    handleImageUpload(option.file)
    option.onSuccess()
}

const startDetection = async () => {
    // 模拟检测过程
    detectionResult.value = "检测完成：无缺陷" // 临时模拟结果
    store.setDetectionResult(detectionResult.value)
}
</script>

<style scoped>
.checking {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 30px;
}

a-button {
    margin-top: 10px;
}

a-result {
    margin-top: 20px;
}
</style>
