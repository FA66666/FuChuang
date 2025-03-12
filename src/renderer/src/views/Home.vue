<template>
  <div class="home-container">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h1 class="page-title">我的任务</h1>
      <a-button type="primary" @click="showModal" class="add-task-btn">
        <template #icon><plus-outlined /></template>
        添加任务卡片
      </a-button>
    </div>

    <!-- 任务卡片列表 -->
    <div class="card-container">
      <div v-for="task in taskStore.taskCards" :key="task.id" class="task-card-wrapper">
        <a-card :title="task.name" class="task-card" :bordered="false">
          <template #extra>
            <a-dropdown>
              <a class="ant-dropdown-link" @click.stop.prevent>
                <more-outlined class="more-icon" />
              </a>
              <template #overlay>
                <a-menu class="task-menu">
                  <a-menu-item @click="handleMenuClick(task.id, 'rename')" class="menu-item">
                    <template #icon><edit-outlined /></template>
                    重命名任务
                  </a-menu-item>
                  <a-menu-item @click="handleMenuClick(task.id, 'delete')" class="menu-item danger">
                    <template #icon><delete-outlined /></template>
                    删除任务
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
          <div @click="openTaskDetail(task.id)" class="card-content">
            <p class="task-description">{{ task.content || '暂无描述' }}</p>
            <div class="preview-images">
              <a-tooltip
                v-for="(img, index) in task.images.slice(0, 3)"
                :key="img.id"
                :title="img.name"
              >
                <div class="image-wrapper">
                  <img :src="img.preview" class="thumbnail" />
                </div>
              </a-tooltip>
              <div v-if="task.images.length > 3" class="more-images">
                <span class="more-count">+{{ task.images.length - 3 }}</span>
              </div>
            </div>
            <div class="task-footer">
              <span class="image-count">
                <picture-outlined /> {{ task.images.length }} 张图片
              </span>
              <span class="view-detail">查看详情 <right-outlined /></span>
            </div>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 任务详情模态框：展示任务图片及管理操作 -->
    <a-modal
      v-model:visible="taskDetailVisible"
      :title="selectedTask?.name"
      width="80%"
      @ok="taskDetailVisible = false"
      :ok-button-props="{ style: { display: 'none' } }"
    >
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
          <a-button type="dashed" @click="openImportModal"> <UploadOutlined /> 导入图片 </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 新建任务模态框 -->
    <a-modal
      v-model:visible="isModalVisible"
      title="请输入任务名称"
      @ok="createTask"
      @cancel="handleCancel"
    >
      <a-input
        v-model:value="taskName"
        placeholder="输入任务名称"
        @keydown.enter="createTask"
        :maxlength="20"
        show-count
      />
    </a-modal>

    <!-- 任务重命名模态框 -->
    <a-modal
      v-model:visible="isRenameModalVisible"
      title="重命名任务"
      @ok="renameTask"
      @cancel="handleRenameCancel"
    >
      <a-input
        v-model:value="newTaskName"
        placeholder="输入新任务名称"
        :maxlength="20"
        show-count
      />
    </a-modal>

    <!-- 图片选择模态框：从"我的数据"中选择图片并支持分页 -->
    <a-modal
      v-model:open="isImageSelectModalVisible"
      title="选择图片加入任务"
      @ok="confirmImageSelection"
      @cancel="cancelImageSelection"
      width="80%"
      :bodyStyle="{ maxHeight: '400px', overflowY: 'auto' }"
    >
      <a-table
        :row-selection="{
          selectedRowKeys: selectedImageKeys,
          onChange: onSelectImageChange
        }"
        :columns="imageColumns"
        :data-source="myImages"
        row-key="key"
        bordered
        :pagination="{
          current: previewCurrentPage,
          pageSize: previewPageSize,
          total: previewTotal,
          onChange: handlePreviewPageChange
        }"
      >
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
import {
  DownOutlined,
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  PictureOutlined,
  RightOutlined
} from '@ant-design/icons-vue'
import { useTaskStore } from '../store/index'
import type { Task } from '../store/index'
import request from '../utils/request'

const taskStore = useTaskStore()

// 状态变量：管理任务相关的显示状态和输入内容
const isModalVisible = ref(false) // 新建任务模态框显示状态
const isRenameModalVisible = ref(false) // 重命名任务模态框显示状态
const taskName = ref('') // 新任务名称输入内容
const newTaskName = ref('') // 重命名时的新任务名称
const currentTaskId = ref<number | null>(null) // 当前操作任务的ID
const taskDetailVisible = ref(false) // 任务详情模态框显示状态
const selectedTask = ref<Task | null>(null) // 当前选中的任务对象

// 状态变量：管理图片选择模态框相关状态
const isImageSelectModalVisible = ref(false) // 图片选择模态框显示状态
const myImages = ref<any[]>([]) // "我的数据"中的图片列表
const selectedImageKeys = ref<string[]>([]) // 当前选中图片的键集合

// 分页状态：用于图片选择模态框的分页控制
const previewCurrentPage = ref(1) // 当前图片预览页码
const previewPageSize = ref(5) // 每页显示的图片数量
const previewTotal = ref(0) // 图片总数

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
    const response = await axios.get(`http://localhost:3000/api/images/task/${taskId}/images`, {
      headers: { Authorization: `Bearer ${token}` }
    })
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

// 打开导入图片模态框：加载"我的数据"图片后显示模态框
const openImportModal = () => {
  fetchMyImages()
  isImageSelectModalVisible.value = true
}

// 删除任务详情中的图片
const removeImage = async (index: number) => {
  if (!selectedTask.value) return

  const taskId = selectedTask.value.id
  const imageId = selectedTask.value.images[index].id

  Modal.confirm({
    title: '确认删除图片？',
    content: '此操作不可恢复',
    async onOk() {
      try {
        await request.post(`http://localhost:3000/api/images/task/${taskId}/remove`, {
          imageIds: [imageId]
        })
        message.success('图片删除成功')
        await fetchTaskImagesForTask(taskId)
      } catch (error) {
        message.error('图片删除失败')
        console.error(error)
      }
    }
  })
}

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

// 加载"我的数据"图片：从后端获取当前用户图片数据（支持分页）
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
    sorter: (a: any, b: any) => new Date(a.modified).getTime() - new Date(b.modified).getTime()
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
.home-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  position: relative;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background: #1890ff;
  border-radius: 2px;
}

.add-task-btn {
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  transition: all 0.3s ease;
}

.add-task-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 8px;
}

.task-card-wrapper {
  transition: all 0.3s ease;
}

.task-card-wrapper:hover {
  transform: translateY(-4px);
}

.task-card {
  border-radius: 12px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background: white;
  height: 100%;
}

.task-card:hover {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px;
  min-height: 56px;
}

:deep(.ant-card-head-title) {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.more-icon {
  font-size: 18px;
  color: #9ca3af;
  transition: color 0.3s ease;
}

.more-icon:hover {
  color: #1890ff;
}

.card-content {
  padding: 16px 20px;
  cursor: pointer;
}

.task-description {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  min-height: 44px;
}

.preview-images {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.image-wrapper {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  background: #f4f4f4;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-wrapper:hover .thumbnail {
  transform: scale(1.1);
}

.more-images {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e5e7eb;
}

.image-count {
  color: #6b7280;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-detail {
  color: #1890ff;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.task-card:hover .view-detail {
  opacity: 1;
  transform: translateX(0);
}

/* 任务菜单样式 */
:deep(.task-menu) {
  border-radius: 8px;
  padding: 4px;
}

:deep(.menu-item) {
  padding: 8px 16px;
  margin: 2px 0;
  border-radius: 4px;
}

:deep(.menu-item.danger) {
  color: #ff4d4f;
}

:deep(.menu-item.danger:hover) {
  background: #fff1f0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-container {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .add-task-btn {
    width: 100%;
  }
}

/* 添加动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.task-card-wrapper {
  animation: fadeIn 0.5s ease forwards;
  animation-delay: calc(var(--index, 0) * 0.1s);
}
</style>
