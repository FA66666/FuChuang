<template>
    <div>
        <div style="margin-bottom: 16px">
            <!-- 添加图片上传按钮 -->
            <a-upload :before-upload="beforeUpload" :custom-request="handleUpload" :show-upload-list="false"
                accept="image/*">
                <a-button type="primary">
                    <UploadOutlined /> 上传新图片
                </a-button>
            </a-upload>

            <a-button type="primary" :disabled="!hasSelected" @click="openModal" style="margin-left: 8px">
                加入任务
            </a-button>
            <span style="margin-left: 8px">
                <template v-if="hasSelected">
                    {{ `已选择 ${state.selectedRowKeys.length} 个图片` }}
                </template>
            </span>
        </div>

        <a-table :row-selection="{
            selectedRowKeys: state.selectedRowKeys,
            onChange: onSelectChange
        }" :columns="columns" :data-source="data" row-key="key" bordered>
            <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'preview'">
                    <img :src="record.preview" class="preview-image" @click="handlePreview(record)" />
                </template>
                <template v-else-if="column.dataIndex === 'name'">
                    {{ record.name }}
                </template>
                <template v-else-if="column.dataIndex === 'modified'">
                    {{ formatDate(record.modified) }}
                </template>
            </template>
        </a-table>

        <!-- 图片预览模态框 -->
        <a-modal :visible="previewVisible" :footer="null" @cancel="previewVisible = false" width="80%">
            <img class="full-preview" :src="currentPreview" />
        </a-modal>

        <!-- 任务选择模态框 -->
        <a-modal title="选择任务卡片" v-model:open="isModalVisible" :ok-disabled="!selectedTaskId" @ok="confirmJoin"
            @cancel="cancelJoin">
            <a-radio-group v-model:value="selectedTaskId">
                <a-radio v-for="task in taskStore.taskCards" :key="task.id" :value="task.id">
                    {{ task.name }}
                </a-radio>
            </a-radio-group>
        </a-modal>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { useTaskStore } from '../store/index'

interface ImageItem {
    key: string
    name: string
    preview: string  // base64或图片URL
    modified: Date
    file?: File
}

// 表格列配置
const columns = [
    {
        title: '图片预览',
        dataIndex: 'preview',
        width: 150
    },
    {
        title: '图片名称',
        dataIndex: 'name',
        sorter: (a: ImageItem, b: ImageItem) => a.name.localeCompare(b.name)
    },
    {
        title: '修改时间',
        dataIndex: 'modified',
        sorter: (a: ImageItem, b: ImageItem) => a.modified.getTime() - b.modified.getTime()
    }
]

// 图片数据（初始化示例）
const data = ref<ImageItem[]>([
    {
        key: '1',
        name: '示例图片1.jpg',
        preview: 'https://picsum.photos/200/150?random=1',
        modified: new Date()
    },
    {
        key: '2',
        name: '示例图片2.png',
        preview: 'https://picsum.photos/200/150?random=2',
        modified: new Date(Date.now() - 86400000)
    }
])

// 表格选中状态
const state = reactive<{
    selectedRowKeys: string[]
}>({
    selectedRowKeys: []
})

// 图片预览相关状态
const previewVisible = ref(false)
const currentPreview = ref('')

// 上传处理
const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!isImage) {
        message.error('只能上传图片文件!')
        return false
    }

    if (file.size > maxSize) {
        message.error('图片大小不能超过5MB!')
        return false
    }

    return true
}

const handleUpload = async ({ file }: { file: File }) => {
    const reader = new FileReader()

    reader.onload = (e) => {
        const newItem: ImageItem = {
            key: Date.now().toString(),
            name: file.name,
            preview: e.target?.result as string,
            modified: new Date(),
            file: file
        }

        data.value = [newItem, ...data.value]
        message.success('图片上传成功')
    }

    reader.readAsDataURL(file)
}

// 日期格式化
const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 图片预览处理
const handlePreview = (record: ImageItem) => {
    currentPreview.value = record.preview
    previewVisible.value = true
}

// 其他原有逻辑保持不变...
const hasSelected = computed(() => state.selectedRowKeys.length > 0)
const taskStore = useTaskStore()
const isModalVisible = ref(false)
const selectedTaskId = ref<number | null>(null)

const openModal = () => {
    isModalVisible.value = true
}

const cancelJoin = () => {
    isModalVisible.value = false
    selectedTaskId.value = null
}

const confirmJoin = () => {
    const selectedData = data.value.filter(item =>
        state.selectedRowKeys.includes(item.key)
    )

    if (selectedTaskId.value !== null) {
        const task = taskStore.taskCards.find(task => task.id === selectedTaskId.value)
        if (task) {
            // 将选中的图片对象添加到任务
            selectedData.forEach(img => {
                task.images.push({
                    id: img.key,
                    name: img.name,
                    preview: img.preview,
                    modified: img.modified
                })
            })
            message.success(`成功添加 ${selectedData.length} 张图片`)
        }
    }

    state.selectedRowKeys = []
    selectedTaskId.value = null
    isModalVisible.value = false
}

const onSelectChange = (selectedRowKeys: string[]) => {
    state.selectedRowKeys = selectedRowKeys
}
</script>

<style scoped>
.preview-image {
    width: 120px;
    height: 90px;
    object-fit: cover;
    cursor: pointer;
    border-radius: 4px;
    transition: transform 0.2s;
}

.preview-image:hover {
    transform: scale(1.05);
}

.full-preview {
    width: 100%;
    max-height: 80vh;
    object-fit: contain;
}

.ant-table-cell {
    vertical-align: middle;
}
</style>