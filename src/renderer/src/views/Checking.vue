<template>
    <div class="checking">
        <h1>表面缺陷检测</h1>

        <!-- 导入图片按钮 -->
        <a-button type="primary" @click="showImportImageModal">
            从我的数据中导入图片
        </a-button>

        <!-- 导入项目按钮 -->
        <a-button type="primary" @click="showImportTaskModal" style="margin-top: 10px;">
            从我的任务中导入项目
        </a-button>

        <!-- 从我的数据中导入图片的模态框 -->
        <a-modal v-model:visible="isImportImageModalVisible" title="选择图片" @ok="handleImportImage"
            @cancel="handleCancel">
            <!-- 图片选择表格 -->
            <a-table :row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }"
                :columns="columns" :data-source="data" row-key="key" />
        </a-modal>

        <!-- 从我的任务中导入项目的模态框 -->
        <a-modal v-model:visible="isImportTaskModalVisible" title="选择任务" @ok="handleImportTask" @cancel="handleCancel">
            <a-radio-group v-model:value="selectedTaskId">
                <a-radio v-for="task in taskStore.taskCards" :key="task.id" :value="task.id">
                    {{ task.name }}
                </a-radio>
            </a-radio-group>
        </a-modal>

        <a-result v-if="detectionResult" status="success" title="检测完成" sub-title="无缺陷"
            extra="{[ <p>{{ detectionResult }}</p>]}" />
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAppStore } from '@renderer/store'
import { useTaskStore } from '../store/index'
import { message } from 'ant-design-vue'

const store = useAppStore()
const taskStore = useTaskStore()

const detectionResult = ref(null)
const imageData = ref(null)
const selectedTaskId = ref(null)

const isImportImageModalVisible = ref(false)
const isImportTaskModalVisible = ref(false)

const columns = [
    {
        title: '图片名称',
        dataIndex: 'name'
    },
    {
        title: '修改时间',
        dataIndex: 'address',
        render: (text) => {
            const date = new Date(text)
            return `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
        }
    }
]

// 模拟数据（45条）
const data = []
for (let i = 1; i < 46; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    data.push({
        key: i,
        name: `图片${i}`,
        address: `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    })
}

// 表格选中行的状态
const state = reactive({
    selectedRowKeys: []
})

const hasSelected = computed(() => state.selectedRowKeys.length > 0)

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

// 打开“从我的数据中导入图片”的模态框
const showImportImageModal = () => {
    isImportImageModalVisible.value = true
}

// 打开“从我的任务中导入项目”的模态框
const showImportTaskModal = () => {
    isImportTaskModalVisible.value = true
}

// 关闭模态框
const handleCancel = () => {
    isImportImageModalVisible.value = false
    isImportTaskModalVisible.value = false
    selectedTaskId.value = null
    imageData.value = null
}

// 导入图片
const handleImportImage = () => {
    if (imageData.value) {
        console.log('上传图片:', imageData.value)
        message.success('图片导入成功')
        isImportImageModalVisible.value = false
    } else {
        message.error('请先选择图片')
    }
}

// 导入任务
const handleImportTask = () => {
    if (selectedTaskId.value !== null) {
        const task = taskStore.taskCards.find((task) => task.id === selectedTaskId.value)
        if (task) {
            console.log('导入任务:', task.name)
            console.log('任务中的图片:', task.content)
            message.success('项目导入成功')
            isImportTaskModalVisible.value = false
        }
    } else {
        message.error('请先选择一个任务')
    }
}

// 表格选中行变化
const onSelectChange = (selectedRowKeys) => {
    console.log('selectedRowKeys changed: ', selectedRowKeys)
    state.selectedRowKeys = selectedRowKeys
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
