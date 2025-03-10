<template>
    <div>
        <!-- 任务卡片添加按钮 -->
        <a-button type="primary" @click="showModal">
            添加任务卡片
        </a-button>
        <br /><br />

        <!-- 显示所有任务卡片列表 -->
        <div class="card-container">
            <div v-for="task in taskStore.taskCards" :key="task.id" class="task-card">
                <a-card :title="task.name" class="task-card">
                    <template #extra>
                        <!-- 操作下拉菜单 -->
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
                    <!-- 点击卡片区域触发任务详情展示 -->
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

        <!-- 任务详情模态框：展示任务图片及管理操作 -->
        <a-modal v-model:visible="taskDetailVisible" :title="selectedTask?.name" width="80%"
            @ok="taskDetailVisible = false" :ok-button-props="{ style: { display: 'none' } }">
            <div class="image-manager">
                <!-- 展示任务中已存在的图片 -->
                <a-row :gutter="[16, 16]">
                    <a-col v-for="(image, index) in selectedTask?.images" :key="image.id" :span="6">
                        <div class="image-item">
                            <img :src="image.preview" class="preview-image" />
                            <div class="image-name">{{ image.name }}</div>
                            <a-button type="danger" shape="circle" class="delete-btn" @click="removeImage(index)">
                                <DeleteOutlined />
                            </a-button>
                        </div>
                    </a-col>
                </a-row>
                <!-- 按钮：导入图片 -->
                <div class="import-btn-container">
                    <a-button type="dashed" @click="openImportModal">
                        <UploadOutlined /> 导入图片
                    </a-button>
                </div>
            </div>
        </a-modal>

        <!-- 新建任务模态框 -->
        <a-modal v-model:visible="isModalVisible" title="请输入任务名称" @ok="createTask" @cancel="handleCancel">
            <a-input v-model:value="taskName" placeholder="输入任务名称" @keydown.enter="createTask" :maxlength="20"
                show-count />
        </a-modal>

        <!-- 任务重命名模态框 -->
        <a-modal v-model:visible="isRenameModalVisible" title="重命名任务" @ok="renameTask" @cancel="handleRenameCancel">
            <a-input v-model:value="newTaskName" placeholder="输入新任务名称" :maxlength="20" show-count />
        </a-modal>

        <!-- 图片选择模态框：从“我的数据”中选择图片并支持分页 -->
        <a-modal v-model:open="isImageSelectModalVisible" title="选择图片加入任务" @ok="confirmImageSelection"
            @cancel="cancelImageSelection" width="80%" :bodyStyle="{ maxHeight: '400px', overflowY: 'auto' }">
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
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { DownOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { useTaskStore } from '../store/index'
import type { Task } from '../store/index'
import request from '../utils/request'

const taskStore = useTaskStore()

// 状态变量：管理任务相关的显示状态和输入内容
const isModalVisible = ref(false)             // 新建任务模态框显示状态
const isRenameModalVisible = ref(false)         // 重命名任务模态框显示状态
const taskName = ref('')                        // 新任务名称输入内容
const newTaskName = ref('')                     // 重命名时的新任务名称
const currentTaskId = ref<number | null>(null)  // 当前操作任务的ID
const taskDetailVisible = ref(false)            // 任务详情模态框显示状态
const selectedTask = ref<Task | null>(null)      // 当前选中的任务对象

// 状态变量：管理图片选择模态框相关状态
const isImageSelectModalVisible = ref(false)    // 图片选择模态框显示状态
const myImages = ref<any[]>([])                 // “我的数据”中的图片列表
const selectedImageKeys = ref<string[]>([])     // 当前选中图片的键集合

// 分页状态：用于图片选择模态框的分页控制
const previewCurrentPage = ref(1)               // 当前图片预览页码
const previewPageSize = ref(5)                  // 每页显示的图片数量
const previewTotal = ref(0)                     // 图片总数
// 处理点击任务卡片：显示任务详情并加载对应图片
const openTaskDetail = (taskId: number) => {
    selectedTask.value = taskStore.taskCards.find((t) => t.id === taskId) || null
    taskDetailVisible.value = true
    fetchTaskImagesForTask(taskId)
}

// 加载指定任务的图片，并更新任务的 images 数组
const fetchTaskImagesForTask = async (taskId: number) => {
    try {
        const token = localStorage.getItem('authToken') || ''
        const response = await axios.get(
            `http://localhost:3000/api/images/task/${taskId}/images`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        const { images } = response.data.data
        // 更新对应任务卡片的图片列表
        const task = taskStore.taskCards.find((t) => t.id === taskId)
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

// 打开导入图片模态框：加载“我的数据”图片后显示模态框
const openImportModal = () => {
    fetchMyImages()
    isImageSelectModalVisible.value = true
}

// 删除任务详情中的图片
const removeImage = async (index: number) => {
    if (!selectedTask.value) return;

    const taskId = selectedTask.value.id;
    const imageId = selectedTask.value.images[index].id;

    Modal.confirm({
        title: '确认删除图片？',
        content: '此操作不可恢复',
        async onOk() {
            try {
                await request.post(
                    `http://localhost:3000/api/images/task/${taskId}/remove`,
                    { imageIds: [imageId] }
                );
                message.success('图片删除成功');
                await fetchTaskImagesForTask(taskId);
            } catch (error) {
                message.error('图片删除失败');
                console.error(error);
            }
        }
    });
};


// 显示新建任务模态框并重置输入内容
const showModal = () => {
    isModalVisible.value = true
    taskName.value = ''
}

// 关闭新建任务模态框并重置输入
const handleCancel = () => {
    isModalVisible.value = false
    taskName.value = ''
}

// 创建新任务：发送请求创建任务并更新任务列表
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
        // 将新任务添加到任务列表中
        taskStore.addTask(createdTask.name, createdTask.content || '')
        // 使用后端返回的任务ID更新本地数据
        taskStore.taskCards[taskStore.taskCards.length - 1].id = createdTask.id
        message.success('任务创建成功')
    } catch (error: any) {
        message.error(error.response?.data?.message || '任务创建失败')
    } finally {
        isModalVisible.value = false
        taskName.value = ''
    }
}

// 打开重命名模态框，并预填当前任务名称
const showRenameModal = (id: number) => {
    currentTaskId.value = id
    const task = taskStore.taskCards.find((task) => task.id === id)
    newTaskName.value = task?.name || ''
    isRenameModalVisible.value = true
}

// 执行任务重命名操作
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

// 取消重命名操作并关闭模态框
const handleRenameCancel = () => {
    isRenameModalVisible.value = false
    newTaskName.value = ''
}

// 删除任务：请求后端删除任务，并更新任务列表
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

// 根据菜单命令执行对应操作：重命名或删除任务
const handleMenuClick = (id: number, command: string) => {
    if (command === 'rename') {
        showRenameModal(id)
    } else if (command === 'delete') {
        removeTaskCard(id)
    }
}

// 加载“我的数据”图片：从后端获取当前用户图片数据（支持分页）
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
        myImages.value = images.map((img: any) => ({
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

// 处理图片选择变化：更新选中图片的键值列表
const onSelectImageChange = (selectedKeys: string[]) => {
    selectedImageKeys.value = selectedKeys
}

// 处理分页切换：更新页码及每页图片数量，并重新加载数据
const handlePreviewPageChange = (page: number, pageSizeValue: number) => {
    previewCurrentPage.value = page
    previewPageSize.value = pageSizeValue
    fetchMyImages()
}

// 确认选中图片加入当前任务，并刷新任务的图片列表
const confirmImageSelection = async () => {
    if (!selectedTask.value) return
    const selectedImages = myImages.value.filter((img: any) =>
        selectedImageKeys.value.includes(img.key)
    )
    const imageIds = selectedImages.map((img: any) => img.id)
    try {
        const response = await request.post(
            `http://localhost:3000/api/images/task/${selectedTask.value.id}/add`,
            { imageIds }
        )
        const {
            data: { success, failed }
        } = response.data
        if (success > 0) {
            message.success(`成功添加 ${success} 张图片`)
        } else {
            message.error('没有图片被添加到任务')
        }
        if (failed > 0) {
            message.warn(`有 ${failed} 张图片添加失败`)
        }
        // 添加图片后刷新当前任务的图片列表
        fetchTaskImagesForTask(selectedTask.value.id)
    } catch (error) {
        message.error('添加图片到任务失败')
        console.error(error)
    } finally {
        selectedImageKeys.value = []
        isImageSelectModalVisible.value = false
    }
}

// 取消图片选择：重置选中状态并关闭模态框
const cancelImageSelection = () => {
    selectedImageKeys.value = []
    isImageSelectModalVisible.value = false
}

// 定义图片表格列配置（用于图片选择模态框）
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

// 页面加载时：从后端加载任务数据，并为每个任务加载对应图片
onMounted(async () => {
    const token = localStorage.getItem('authToken') || ''
    if (token) {
        axios
            .get('http://localhost:3000/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(async (response) => {
                const tasksFromServer = response.data.data.tasks || []
                // 清空本地任务列表
                taskStore.taskCards = []
                tasksFromServer.forEach((serverTask: any) => {
                    taskStore.addTask(serverTask.name, serverTask.content || '')
                    // 使用后端返回的任务ID更新本地数据
                    taskStore.taskCards[taskStore.taskCards.length - 1].id = serverTask.id
                })
                // 为每个任务加载对应的图片列表
                for (const task of taskStore.taskCards) {
                    await fetchTaskImagesForTask(task.id)
                }
            })
            .catch((err) => {
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

/* 图片管理区域样式 */
.image-manager {
    padding: 16px;
    background-color: #f7f7f7;
    border-radius: 8px;
    max-height: 60vh;
    overflow-y: auto;
}

.image-item {
    position: relative;
    padding: 12px;
    background-color: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    text-align: center;
    transition: box-shadow 0.3s ease;
}

.image-item:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.preview-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 4px;
}

.image-name {
    margin-top: 8px;
    font-size: 16px;
    color: #333;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0.8;
    transition: opacity 0.3s ease;
}

.delete-btn:hover {
    opacity: 1;
}

.import-btn-container {
    margin-top: 16px;
    text-align: center;
}

.more-count {
    background: rgba(0, 0, 0, 0.65);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
}

.thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 8px;
    border: 1px solid #f0f0f0;
}
</style>
