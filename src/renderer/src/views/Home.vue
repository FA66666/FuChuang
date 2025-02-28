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
                            <a class="ant-dropdown-link" @click.stop.prevent> <!-- 阻止事件冒泡 -->
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
                    <div @click="openTaskDetail(task.id)" class="card-content"> <!-- 添加点击区域 -->
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

        <!-- 任务详情模态框 -->
        <a-modal v-model:visible="taskDetailVisible" :title="selectedTask?.name" width="80%"
            @ok="taskDetailVisible = false" :ok-button-props="{ style: { display: 'none' } }">
            <div class="image-manager">
                <a-row :gutter="[16, 16]">
                    <a-col v-for="(image, index) in selectedTask?.images" :key="index" :span="6">
                        <div class="image-item">
                            <img :src="image" class="preview-image" />
                            <a-button type="danger" shape="circle" class="delete-btn" @click="removeImage(index)">
                                <DeleteOutlined />
                            </a-button>
                        </div>
                    </a-col>
                </a-row>

                <a-upload :before-upload="beforeUpload" :custom-request="handleUpload" :show-upload-list="false"
                    accept="image/*">
                    <a-button type="dashed" block style="margin-top: 16px">
                        <UploadOutlined /> 添加图片（最大 5MB）
                    </a-button>
                </a-upload>
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
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { DownOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { useTaskStore } from '../store/index'
import type { Task } from '../store/index'

const taskStore = useTaskStore()

// 状态管理
const isModalVisible = ref(false)
const isRenameModalVisible = ref(false)
const taskName = ref('')
const newTaskName = ref('')
const currentTaskId = ref<number | null>(null)
const taskDetailVisible = ref(false)
const selectedTask = ref<Task | null>(null)

// 图片上传配置
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// 任务卡片点击处理
const openTaskDetail = (taskId: number) => {
    selectedTask.value = taskStore.taskCards.find(t => t.id === taskId) || null
    taskDetailVisible.value = true
}

// 删除图片
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

// 图片上传处理
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

        // 直接存储Data URL
        taskStore.addTaskImage(selectedTask.value.id, dataUrl)
        message.success('图片上传成功')
    } catch (error) {
        message.error('图片上传失败')
        console.error('Upload error:', error)
    }
}

// 任务管理功能
const showModal = () => {
    isModalVisible.value = true
    taskName.value = ''
}

const handleCancel = () => {
    isModalVisible.value = false
    taskName.value = ''
}

const createTask = () => {
    const name = taskName.value.trim() || `任务${taskStore.taskCards.length + 1}`
    taskStore.addTask(name, '')
    isModalVisible.value = false
    taskName.value = ''
    message.success('任务创建成功')
}

const showRenameModal = (id: number) => {
    currentTaskId.value = id
    const task = taskStore.taskCards.find(task => task.id === id)
    newTaskName.value = task?.name || ''
    isRenameModalVisible.value = true
}

const renameTask = () => {
    if (!newTaskName.value.trim()) {
        message.error('任务名称不能为空')
        return
    }

    if (currentTaskId.value !== null) {
        taskStore.updateTask(currentTaskId.value, '', newTaskName.value)
        isRenameModalVisible.value = false
        message.success('任务重命名成功')
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
        onOk: () => {
            taskStore.removeTask(id)
            message.success('任务删除成功')
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
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #ddd;
}

.image-manager {
    max-height: 60vh;
    overflow-y: auto;
}

.preview-image {
    width: 100%;
    height: 200px;
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