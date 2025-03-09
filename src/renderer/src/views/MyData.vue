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
                <template v-else-if="column.dataIndex === 'action'">
                    <a-button type="danger" @click="handleDelete(record.id)">删除</a-button>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { useTaskStore } from '../store/index'
import request from '../utils/request'

interface ImageItem {
    key: string
    name: string
    preview: string
    modified: Date
    file?: File
    id: number
    original_filename: string // 添加 original_filename
}

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
    },
    {
        title: '操作',
        dataIndex: 'action',
        width: 100
    }
]

const data = ref<ImageItem[]>([])

const state = reactive<{
    selectedRowKeys: string[]
}>({
    selectedRowKeys: []
})

const previewVisible = ref(false)
const currentPreview = ref('')

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
    const formData = new FormData();
    formData.append('image', file);
    const imageInfo = {
        filename: file.name, // 上传时的原始文件名
        status: 'pending'
    };
    formData.append('imageInfo', JSON.stringify(imageInfo));

    try {
        const response = await request.post('http://localhost:3000/api/images/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const uploadedImage = response.data.image;
        const newItem: ImageItem = {
            key: uploadedImage.id.toString(),
            name: uploadedImage.original_filename, // 使用原始文件名显示
            preview: `http://localhost:3000/uploads/processed/${uploadedImage.filename}`, // 使用唯一文件名预览
            modified: new Date(uploadedImage.upload_time),
            id: uploadedImage.id,
            original_filename: uploadedImage.original_filename // 确保包含
        };
        data.value = [newItem, ...data.value];
        message.success('图片上传成功');
    } catch (error) {
        message.error('图片上传失败');
        console.error(error);
    }
};

const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

const handlePreview = (record: ImageItem) => {
    currentPreview.value = record.preview
    previewVisible.value = true
}

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

const confirmJoin = async () => {
    const selectedData = data.value.filter(item =>
        state.selectedRowKeys.includes(item.key)
    )
    const imageIds = selectedData.map(item => item.id)

    if (selectedTaskId.value !== null) {
        try {
            const response = await request.post(`http://localhost:3000/api/images/task/${selectedTaskId.value}/add`, { imageIds })
            const { data: { success, failed } } = response.data

            if (success > 0) {
                message.success(`成功添加 ${success} 张图片`)
            } else {
                message.error('没有图片被添加到任务')
            }

            if (failed > 0) {
                message.warn(`有 ${failed} 张图片添加失败`)
            }

            // 更新 taskStore 如果需要
        } catch (error) {
            message.error('添加图片到任务失败')
            console.error(error)
        }
    }

    state.selectedRowKeys = []
    selectedTaskId.value = null
    isModalVisible.value = false
}

const handleDelete = async (id: number) => {
    try {
        await request.delete(`http://localhost:3000/api/images/${id}`)
        message.success('图片删除成功')
        // 刷新图片列表
        const response = await request.get('http://localhost:3000/api/images/')
        const images = response.data.data.images
        data.value = images.map(img => ({
            key: img.id.toString(),
            name: img.original_filename,
            preview: `http://localhost:3000/uploads/processed/${img.filename}`,
            modified: new Date(img.upload_time),
            id: img.id,
            original_filename: img.original_filename
        }))
    } catch (error) {
        message.error('图片删除失败')
        console.error(error)
    }
}

const onSelectChange = (selectedRowKeys: string[]) => {
    state.selectedRowKeys = selectedRowKeys
}

onMounted(async () => {
    try {
        const response = await request.get('http://localhost:3000/api/images/')
        const images = response.data.data.images
        data.value = images.map(img => ({
            key: img.id.toString(),
            name: img.original_filename, // 使用原始文件名显示
            preview: `http://localhost:3000/uploads/processed/${img.filename}`, // 使用唯一文件名预览
            modified: new Date(img.upload_time),
            id: img.id,
            original_filename: img.original_filename // 确保包含
        }))
    } catch (error) {
        message.error('获取图片失败')
        console.error(error)
    }
})
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