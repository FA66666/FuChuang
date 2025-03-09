<template>
    <div>
        <!-- 添加任务卡片按钮 -->
        <a-button type="primary" @click="showModal">
            添加任务卡片
        </a-button>
        <br /><br />

        <!-- 显示所有任务卡片 -->
        <div class="card-container">
            <div v-for="task in taskStore.taskCards" :key="task.id" class="task-card">
                <a-card :title="task.name" class="task-card">
                    <template #extra>
                        <!-- 下拉菜单 -->
                        <a-dropdown>
                            <a class="ant-dropdown-link" @click.stop.prevent>
                                更多
                                <DownOutlined />
                            </a>
                            <template #overlay>
                                <a-menu>
                                    <a-menu-item @click="handleMenuClick(task.id, 'rename')">
                                        重命名任务
                                    </a-menu-item>
                                    <a-menu-item @click="handleMenuClick(task.id, 'delete')">
                                        删除任务
                                    </a-menu-item>
                                </a-menu>
                            </template>
                        </a-dropdown>
                    </template>
                    <!-- 点击任务卡片时，调用 openTaskDetail -->
                    <div @click="openTaskDetail(task.id)" class="card-content">
                        <p>{{ task.content }}</p>
                        <div class="preview-images">
                            <a-tooltip v-for="(img, index) in task.images" :key="img.id" :title="img.name">
                                <img :src="img.preview" class="thumbnail" />
                                <span v-if="index === 2 && task.images.length > 3" class="more-count">
                                    +{{ task.images.length - 3 }}
                                </span>
                            </a-tooltip>
                        </div>
                    </div>
                </a-card>
            </div>
        </div>

        <!-- 任务详情模态框（内容展示模态框） -->
        <a-modal v-model:visible="taskDetailVisible" :title="selectedTask?.name" width="80%"
            @ok="taskDetailVisible = false" :ok-button-props="{ style: { display: 'none' } }">
            <div class="image-manager">
                <!-- 显示任务中已有图片 -->
                <a-row :gutter="[16, 16]">
                    <a-col v-for="(image, index) in selectedTask?.images" :key="image.id" :span="6">
                        <div class="image-item">
                            <img :src="image.preview" class="preview-image" />
                            <a-button type="danger" shape="circle" class="delete-btn" @click="removeImage(index)">
                                <DeleteOutlined />
                            </a-button>
                        </div>
                    </a-col>
                </a-row>
                <!-- 新增：导入图片按钮 -->
                <div style="margin-top: 16px; text-align: center;">
                    <a-button type="dashed" @click="openImportModal">
                        <UploadOutlined /> 导入图片
                    </a-button>
                </div>
            </div>
        </a-modal>

        <!-- 新建任务 Modal -->
        <a-modal v-model:visible="isModalVisible" title="请输入任务名称" @ok="createTask" @cancel="handleCancel">
            <a-input v-model:value="taskName" placeholder="输入任务名称" @keydown.enter="createTask" :maxlength="20"
                show-count />
        </a-modal>

        <!-- 重命名 Modal -->
        <a-modal v-model:visible="isRenameModalVisible" title="重命名任务" @ok="renameTask" @cancel="handleRenameCancel">
            <a-input v-model:value="newTaskName" placeholder="输入新任务名称" :maxlength="20" show-count />
        </a-modal>

        <!-- 图片选择模态框（用于选择“我的数据”中的图片加入任务），带分页 -->
        <a-modal v-model:open="isImageSelectModalVisible" title="选择图片加入任务" @ok="confirmImageSelection"
            @cancel="cancelImageSelection" width="80%">
            <a-table :row-selection="{
                selectedRowKeys: selectedImageKeys,
                onChange: onSelectImageChange
            }" :columns="imageColumns" :data-source="myImages" row-key="key" bordered :pagination="{
                current: previewCurrentPage,
                pageSize: previewPageSize,
                total: previewTotal,
                onChange: handlePreviewPageChange
            }">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'preview'">
                        <img :src="record.preview" class="preview-image" />
                    </template>
                    <template v-else>
                        {{ record[column.dataIndex] }}
                    </template>
                </template>
            </a-table>
        </a-modal>
    </div>
</template>

<script lang="ts" setup>
import axios from 'axios'
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { DownOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { useTaskStore } from '../store/index'
import type { Task } from '../store/index'
import request from '../utils/request'

const taskStore = useTaskStore()

// 任务相关状态（保持原有不变）
const isModalVisible = ref(false)
const isRenameModalVisible = ref(false)
const taskName = ref('')
const newTaskName = ref('')
const currentTaskId = ref<number | null>(null)
const taskDetailVisible = ref(false)
const selectedTask = ref<Task | null>(null)

// 新增：图片选择模态框相关状态
const isImageSelectModalVisible = ref(false)
const myImages = ref<any[]>([]) // 与 ImageItem 结构相同
const selectedImageKeys = ref<string[]>([])

// 新增：图片选择分页相关变量
const previewCurrentPage = ref(1)
const previewPageSize = ref(5)
const previewTotal = ref(0)

// 图片上传配置（保持不变）
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// 修改：点击任务卡片时，打开任务详情模态框并加载该任务的图片
const openTaskDetail = (taskId: number) => {
    selectedTask.value = taskStore.taskCards.find(t => t.id === taskId) || null
    taskDetailVisible.value = true
    fetchTaskImagesForTask(taskId)
}

// 新增：加载指定任务中已有的图片，并更新该任务的 images 属性
const fetchTaskImagesForTask = async (taskId: number) => {
    try {
        const token = localStorage.getItem('authToken') || ''
        const response = await axios.get(
            `http://localhost:3000/api/images/task/${taskId}/images`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        const { images } = response.data.data
        // 找到对应的任务卡片，并更新其 images 数组
        const task = taskStore.taskCards.find(t => t.id === taskId)
        if (task) {
            task.images = images.map((img: any) => ({
                id: img.id,
                name: img.original_filename,
                preview: `http://localhost:3000/api/processed/${img.filename}`,
                modified: new Date(img.upload_time)
            }))
        }
    } catch (error) {
        console.error('获取任务图片失败:', error)
        message.error('获取任务图片失败')
    }
}

// 新增：点击“导入图片”按钮，打开图片选择模态框
const openImportModal = () => {
    fetchMyImages()
    isImageSelectModalVisible.value = true
}

// 删除图片（保持原有任务详情模态框功能不变）
const removeImage = async (index: number) => {
    if (!selectedTask.value) return

    Modal.confirm({
        title: '确认删除图片？',
        content: '此操作不可恢复',
        onOk: () => {
            taskStore.removeTaskImage(selectedTask.value!.id, index)
            message.success('图片删除成功')
        }
    })
}

// 图片上传处理（保持原有任务详情模态框功能不变）
const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isValidSize = file.size <= MAX_FILE_SIZE

    if (!isImage) {
        message.error('只能上传图片文件！')
        return false
    }

    if (!isValidSize) {
        message.error('图片大小不能超过5MB！')
        return false
    }

    return true
}

const handleUpload = async ({ file }: { file: File }) => {
    try {
        if (!selectedTask.value) return

        // 读取文件为Data URL
        const dataUrl = await window.electronAPI.readImage(file)

        // 构造符合 TaskImage 接口的对象
        const newTaskImage = {
            id: Date.now().toString(),
            name: file.name,
            preview: dataUrl,
            modified: new Date()
        }
        taskStore.addTaskImage(selectedTask.value.id, newTaskImage)
        message.success('图片上传成功')
        // 新增：导入图片后刷新该任务图片列表
        fetchTaskImagesForTask(selectedTask.value.id)
    } catch (error) {
        message.error('图片上传失败')
        console.error('Upload error:', error)
    }
}

// 原有任务管理功能（保持不变）
const showModal = () => {
    isModalVisible.value = true
    taskName.value = ''
}

const handleCancel = () => {
    isModalVisible.value = false
    taskName.value = ''
}

const createTask = async () => {
    const name = taskName.value.trim() || `任务${taskStore.taskCards.length + 1}`
    try {
        const token = localStorage.getItem('authToken') || ''
        const response = await axios.post(
            'http://localhost:3000/api/tasks',
            { name },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        const createdTask = response.data.data
        // 原有功能：添加任务卡片
        taskStore.addTask(createdTask.name, createdTask.content || '')
        // 覆盖生成的 id 为后端返回的 id
        taskStore.taskCards[taskStore.taskCards.length - 1].id = createdTask.id
        message.success('任务创建成功')
    } catch (error: any) {
        message.error(error.response?.data?.message || '任务创建失败')
    } finally {
        isModalVisible.value = false
        taskName.value = ''
    }
}

const showRenameModal = (id: number) => {
    currentTaskId.value = id
    const task = taskStore.taskCards.find(task => task.id === id)
    newTaskName.value = task?.name || ''
    isRenameModalVisible.value = true
}

const renameTask = async () => {
    if (!newTaskName.value.trim()) {
        message.error('任务名称不能为空')
        return
    }

    if (currentTaskId.value !== null) {
        try {
            const token = localStorage.getItem('authToken') || ''
            await axios.patch(
                `http://localhost:3000/api/tasks/${currentTaskId.value}/rename`,
                { name: newTaskName.value },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            taskStore.updateTask(currentTaskId.value, '', newTaskName.value)
            message.success('任务重命名成功')
        } catch (error: any) {
            message.error(error.response?.data?.message || '任务重命名失败')
        } finally {
            isRenameModalVisible.value = false
            newTaskName.value = ''
        }
    }
}

const handleRenameCancel = () => {
    isRenameModalVisible.value = false
    newTaskName.value = ''
}

const removeTaskCard = (id: number) => {
    Modal.confirm({
        title: '确定删除该任务？',
        content: '所有关联数据将被永久删除',
        onOk: async () => {
            try {
                const token = localStorage.getItem('authToken') || ''
                await axios.delete(`http://localhost:3000/api/tasks/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                taskStore.removeTask(id)
                message.success('任务删除成功')
            } catch (error: any) {
                message.error(error.response?.data?.message || '任务删除失败')
            }
        }
    })
}

const handleMenuClick = (id: number, command: string) => {
    if (command === 'rename') {
        showRenameModal(id)
    } else if (command === 'delete') {
        removeTaskCard(id)
    }
}

// 新增：从后端加载当前用户“我的数据”图片（带分页）
const fetchMyImages = async () => {
    try {
        const response = await request.get('http://localhost:3000/api/images/', {
            params: {
                page: previewCurrentPage.value,
                limit: previewPageSize.value
            }
        })
        const images = response.data.data.images
        previewTotal.value = response.data.data.pagination.total
        myImages.value = images.map(img => ({
            key: img.id.toString(),
            name: img.original_filename,
            preview: `http://localhost:3000/api/processed/${img.filename}`,
            modified: new Date(img.upload_time),
            id: img.id,
            original_filename: img.original_filename,
            task: img.task ? { id: img.task.id, name: img.task.name } : null
        }))
    } catch (error) {
        message.error('获取我的图片失败')
        console.error(error)
    }
}

// 新增：处理图片选择变化
const onSelectImageChange = (selectedKeys: string[]) => {
    selectedImageKeys.value = selectedKeys
}

// 新增：分页切换处理函数
const handlePreviewPageChange = (page: number, pageSizeValue: number) => {
    previewCurrentPage.value = page
    previewPageSize.value = pageSizeValue
    fetchMyImages()
}

// 新增：确认选中图片加入任务，并在成功后刷新该任务的图片列表
const confirmImageSelection = async () => {
    if (!selectedTask.value) return
    const selectedImages = myImages.value.filter(img =>
        selectedImageKeys.value.includes(img.key)
    )
    const imageIds = selectedImages.map(img => img.id)
    try {
        const response = await request.post(
            `http://localhost:3000/api/images/task/${selectedTask.value.id}/add`,
            { imageIds }
        )
        const { data: { success, failed } } = response.data
        if (success > 0) {
            message.success(`成功添加 ${success} 张图片`)
        } else {
            message.error('没有图片被添加到任务')
        }
        if (failed > 0) {
            message.warn(`有 ${failed} 张图片添加失败`)
        }
        // 新增：导入图片后刷新该任务的图片列表
        fetchTaskImagesForTask(selectedTask.value.id)
    } catch (error) {
        message.error('添加图片到任务失败')
        console.error(error)
    } finally {
        selectedImageKeys.value = []
        isImageSelectModalVisible.value = false
    }
}

// 新增：取消图片选择
const cancelImageSelection = () => {
    selectedImageKeys.value = []
    isImageSelectModalVisible.value = false
}

// 新增：定义图片表格列（用于图片选择模态框）
const imageColumns = [
    {
        title: '图片预览',
        dataIndex: 'preview',
        width: 150
    },
    {
        title: '图片名称',
        dataIndex: 'name'
    },
    {
        title: '修改时间',
        dataIndex: 'modified',
        sorter: (a: any, b: any) =>
            new Date(a.modified).getTime() - new Date(b.modified).getTime()
    }
]

// 新增：加载任务时（原有加载任务逻辑保持不变），并在加载完任务后对所有任务调用 fetchTaskImagesForTask
onMounted(async () => {
    const token = localStorage.getItem('authToken') || ''
    if (token) {
        axios
            .get('http://localhost:3000/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(async response => {
                const tasksFromServer = response.data.data.tasks || []
                // 清空本地任务列表
                taskStore.taskCards = []
                tasksFromServer.forEach((serverTask: any) => {
                    taskStore.addTask(serverTask.name, serverTask.content || '')
                    // 覆盖本地生成的 id 为后端返回的 id
                    taskStore.taskCards[taskStore.taskCards.length - 1].id = serverTask.id
                })
                // 对所有任务卡片调用 fetchTaskImagesForTask 获取图片列表
                for (const task of taskStore.taskCards) {
                    await fetchTaskImagesForTask(task.id)
                }
            })
            .catch(err => {
                console.error('加载任务失败', err)
                message.error('加载任务失败')
            })
    }
})
</script>

<style scoped>
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.task-card {
    flex: 0 0 calc(25% - 16px);
    box-sizing: border-box;
    cursor: pointer;
    transition: transform 0.2s;
}

.task-card:hover {
    transform: translateY(-2px);
}

.card-content {
    padding: 12px;
}

.preview-images {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.thumbnail {
    width: 40px;
    height: 30px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #ddd;
}

.image-manager {
    max-height: 60vh;
    overflow-y: auto;
}

.preview-image {
    width: 80px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #ddd;
}

.image-item {
    position: relative;
    transition: transform 0.2s;
}

.image-item:hover {
    transform: scale(0.98);
}

.delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0.7;
}

.delete-btn:hover {
    opacity: 1;
}

.thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 8px;
    border: 1px solid #f0f0f0;
}

.more-count {
    background: rgba(0, 0, 0, 0.65);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
}
</style>
