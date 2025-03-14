<template>
  <div class="data-container">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">我的数据</h1>
        <p class="page-subtitle">管理您的图片数据和采集新的图片</p>
      </div>
      <div class="header-actions">
        <!-- 拍摄按钮 -->
        <a-button type="primary" class="capture-btn" @click="showCaptureModal">
          <template #icon><camera-outlined /></template>
          实时拍摄
        </a-button>
        <!-- 上传按钮 -->
        <a-upload
          :before-upload="beforeUpload"
          :custom-request="handleUpload"
          :show-upload-list="false"
          accept="image/*"
        >
          <a-button type="primary" class="upload-btn">
            <template #icon><upload-outlined /></template>
            上传图片
          </a-button>
        </a-upload>
        <!-- 加入任务按钮 -->
        <a-button type="primary" :disabled="!hasSelected" @click="openModal" class="join-task-btn">
          <template #icon><plus-outlined /></template>
          加入任务
          <span v-if="hasSelected" class="selected-count">
            ({{ state.selectedRowKeys.length }})
          </span>
        </a-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <a-table
        :row-selection="{
          selectedRowKeys: state.selectedRowKeys,
          onChange: onSelectChange,
          columnWidth: '60px'
        }"
        :columns="columns"
        :data-source="data"
        row-key="key"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条数据`
        }"
        class="data-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'preview'">
            <div class="image-preview-cell">
              <div class="image-preview-wrapper" @click.stop="handlePreview(record)">
                <img :src="record.preview" class="preview-image" />
                <div class="image-hover-overlay">
                  <eye-outlined />
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'name'">
            <span class="image-name">{{ record.name }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'modified'">
            <span class="date-text">{{ formatDate(record.modified) }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'task'">
            <a-tag :color="record.task ? 'blue' : 'default'" class="task-tag">
              {{ record.task ? record.task.name : '无任务' }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a-button type="text" danger @click="handleDelete(record.id)" class="delete-btn">
              <template #icon><delete-outlined /></template>
            </a-button>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 图片预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      width="80%"
      class="preview-modal"
      :closable="true"
      :maskClosable="true"
    >
      <template #closeIcon>
        <close-outlined class="close-icon" />
      </template>
      <div class="preview-container">
        <img :src="currentPreview" class="full-preview" />
      </div>
    </a-modal>

    <!-- 任务选择模态框 -->
    <a-modal
      title="选择任务卡片"
      v-model:open="isModalVisible"
      :ok-disabled="!selectedTaskId"
      @ok="confirmJoin"
      @cancel="cancelJoin"
      class="task-select-modal"
    >
      <div class="task-list">
        <a-radio-group v-model:value="selectedTaskId" class="task-radio-group">
          <a-radio
            v-for="task in taskStore.taskCards"
            :key="task.id"
            :value="task.id"
            class="task-radio"
          >
            {{ task.name }}
          </a-radio>
        </a-radio-group>
      </div>
    </a-modal>

    <!-- 拍摄模态框 -->
    <a-modal
      v-model:open="captureVisible"
      title="实时拍摄"
      width="800px"
      @ok="handleCapture"
      @cancel="closeCaptureModal"
      :okText="'拍摄'"
      :cancelText="'关闭'"
      class="capture-modal"
    >
      <div class="capture-container">
        <div class="video-container">
          <video ref="videoRef" class="capture-video" autoplay playsinline></video>
          <canvas ref="canvasRef" style="display: none"></canvas>
        </div>
        <div class="capture-controls">
          <a-select v-model:value="selectedCamera" class="camera-select">
            <a-select-option
              v-for="device in cameras"
              :key="device.deviceId"
              :value="device.deviceId"
            >
              {{ device.label }}
            </a-select-option>
          </a-select>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  CameraOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { useTaskStore } from '../store/index'
import request from '../utils/request'

interface ImageItem {
  key: string
  name: string
  preview: string
  modified: Date
  file?: File
  id: number
  original_filename: string
  task?: { id: number; name: string } // 添加任务信息
}

const columns = [
  {
    title: '图片预览',
    dataIndex: 'preview',
    width: 150,
    fixed: 'left'
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
    width: 100,
    fixed: 'right'
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

// 新增分页相关变量
const currentPage = ref(1)
const pageSize = ref(6)
const total = ref(0)

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
  const formData = new FormData()
  formData.append('image', file)
  const imageInfo = {
    filename: file.name,
    status: 'pending'
  }
  formData.append('imageInfo', JSON.stringify(imageInfo))

  try {
    const response = await request.post('http://localhost:3000/api/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const uploadedImage = response.data.image
    const newItem: ImageItem = {
      key: uploadedImage.id.toString(),
      name: uploadedImage.original_filename,
      preview: `http://localhost:3000/api/processed/${uploadedImage.filename}`,
      modified: new Date(uploadedImage.upload_time),
      id: uploadedImage.id,
      original_filename: uploadedImage.original_filename,
      task: uploadedImage.task ? { id: uploadedImage.task.id, name: uploadedImage.task.name } : null
    }
    // 将新上传的图片添加到当前页面数据中
    data.value = [newItem, ...data.value]
    message.success('图片上传成功')
    fetchImages()
  } catch (error) {
    message.error('图片上传失败')
    console.error(error)
  }
}

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

const handlePreview = (record: ImageItem) => {
  currentPreview.value = record.preview
  previewVisible.value = true
}

const handleDelete = async (id: number) => {
  try {
    await request.delete(`http://localhost:3000/api/images/${id}`)
    message.success('图片删除成功')
    // 刷新图片列表
    await fetchImages()
  } catch (error) {
    message.error('图片删除失败')
    console.error(error)
  }
}

const fetchImages = async () => {
  try {
    const response = await request.get('http://localhost:3000/api/images/', {
      params: {
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    const images = response.data.data.images
    // 更新分页总数（后端返回 pagination.total）
    total.value = response.data.data.pagination.total
    data.value = images.map((img) => ({
      key: img.id.toString(),
      name: img.original_filename,
      preview: `http://localhost:3000/api/processed/${img.filename}`,
      modified: new Date(img.upload_time),
      id: img.id,
      original_filename: img.original_filename,
      task: img.task ? { id: img.task.id, name: img.task.name } : null
    }))
  } catch (error) {
    message.error('获取图片失败')
    console.error(error)
  }
}

const handlePageChange = (page: number, pageSizeValue: number) => {
  currentPage.value = page
  pageSize.value = pageSizeValue
  fetchImages()
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
  const selectedData = data.value.filter((item) => state.selectedRowKeys.includes(item.key))
  const imageIds = selectedData.map((item) => item.id)

  if (selectedTaskId.value !== null) {
    try {
      const response = await request.post(
        `http://localhost:3000/api/images/task/${selectedTaskId.value}/add`,
        { imageIds }
      )
      const {
        data: { success, failed }
      } = response.data

      if (success > 0) {
        message.success(`成功添加 ${success} 张图片`)
        await fetchImages() // 自动刷新图片列表
      } else {
        message.error('没有图片被添加到任务')
      }

      if (failed > 0) {
        message.warn(`有 ${failed} 张图片添加失败`)
      }
    } catch (error) {
      message.error('添加图片到任务失败')
      console.error(error)
    }
  }

  state.selectedRowKeys = []
  selectedTaskId.value = null
  isModalVisible.value = false
}

const onSelectChange = (selectedRowKeys: string[]) => {
  state.selectedRowKeys = selectedRowKeys
}

// 拍摄相关的状态
const captureVisible = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cameras = ref<MediaDeviceInfo[]>([])
const selectedCamera = ref('')
let mediaStream: MediaStream | null = null

// 显示拍摄模态框
const showCaptureModal = async () => {
  captureVisible.value = true
  await getCameras()
  if (cameras.value.length > 0) {
    selectedCamera.value = cameras.value[0].deviceId
    await startCamera()
  }
}

// 获取可用摄像头列表
const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    cameras.value = devices.filter((device) => device.kind === 'videoinput')
  } catch (error) {
    message.error('获取摄像头列表失败')
    console.error(error)
  }
}

// 启动摄像头
const startCamera = async () => {
  try {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selectedCamera.value
      }
    })
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
  } catch (error) {
    message.error('启动摄像头失败')
    console.error(error)
  }
}

// 拍摄照片
const handleCapture = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const context = canvas.getContext('2d')
  if (!context) return

  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  // 将图片转换为文件
  canvas.toBlob(async (blob) => {
    if (!blob) return
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
    // 调用上传函数
    await handleUpload({ file })
  }, 'image/jpeg')

  closeCaptureModal()
}

// 关闭拍摄模态框
const closeCaptureModal = () => {
  captureVisible.value = false
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
  }
})

onMounted(async () => {
  await fetchImages()
})
</script>

<style scoped>
.data-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
  position: relative;
  z-index: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  position: relative;
  z-index: 5;
}

.header-left {
  flex: 1;
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

.page-subtitle {
  margin-top: 16px;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.capture-btn,
.upload-btn,
.join-task-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.capture-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
}

.capture-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.selected-count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.table-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

.image-preview-cell {
  padding: 4px;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.image-preview-wrapper {
  position: relative;
  width: 100px;
  height: 75px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  z-index: 2;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  display: block;
}

.image-hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.image-preview-wrapper:hover {
  .image-hover-overlay {
    opacity: 1;
  }

  .preview-image {
    transform: scale(1.1);
  }
}

.image-hover-overlay .anticon {
  color: white;
  font-size: 20px;
}

.image-name {
  color: #1f2937;
  font-weight: 500;
}

.date-text {
  color: #6b7280;
  font-size: 13px;
}

.task-tag {
  border-radius: 4px;
  padding: 2px 8px;
}

.delete-btn {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.delete-btn:hover {
  opacity: 1;
}

/* 预览模态框样式 */
.preview-modal {
  :deep(.ant-modal-content) {
    background: rgba(0, 0, 0, 0.85);
    padding: 0;
  }

  :deep(.ant-modal-close) {
    position: fixed;
    top: 24px;
    right: 24px;
    color: white;
    z-index: 1001;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    padding: 8px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.4);
    }
  }

  :deep(.close-icon) {
    font-size: 20px;
    color: #fff;
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(90deg);
    }
  }

  z-index: 1000;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  max-height: calc(90vh - 100px);
  background: transparent;
  position: relative;
  padding: 40px;
}

.full-preview {
  max-width: calc(100% - 80px);
  max-height: calc(90vh - 140px);
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 拍摄模态框样式 */
.capture-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-container {
  width: 100%;
  height: 400px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.capture-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.capture-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.camera-select {
  width: 300px;
}

/* 任务选择模态框样式 */
.task-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.task-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-radio {
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.task-radio:hover {
  background: #f5f7fa;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .capture-btn,
  .upload-btn,
  .join-task-btn {
    flex: 1;
    min-width: 120px;
  }
}

/* 添加动画 */
.data-container {
  animation: fadeIn 0.3s ease;
}

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

/* 修改表格相关样式 */
.data-table {
  :deep(.ant-table) {
    border-radius: 8px;
    overflow: hidden;
  }

  /* 调整选择框列的样式 */
  :deep(.ant-table-selection-column) {
    padding-right: 0 !important;
    width: 60px !important;
    min-width: 60px !important;
    background: white;
  }

  /* 确保选择框在最上层 */
  :deep(.ant-checkbox-wrapper) {
    z-index: 10;
    position: relative;
  }
}

/* 调整表格行的选中状态 */
:deep(.ant-table-row-selected) > td {
  background: #e6f7ff !important;
  position: relative;
}

/* 确保选择框列的背景色 */
:deep(.ant-table-cell) {
  &.ant-table-selection-column {
    background: white !important;
  }
}

/* 优化表格hover效果 */
:deep(.ant-table-row:hover) > td {
  background: #fafafa !important;
}

:deep(.ant-table-row-selected:hover) > td {
  background: #e6f7ff !important;
}

/* 确保固定列的层级正确 */
:deep(.ant-table-cell-fix-left),
:deep(.ant-table-cell-fix-right) {
  z-index: 3 !important;
}

/* 修改表格滚动容器样式 */
:deep(.ant-table-content) {
  overflow: auto;
  position: relative;
  z-index: 1;
}

/* 确保表格头部固定且层级正确 */
:deep(.ant-table-header) {
  position: sticky;
  top: 0;
  z-index: 4;
  background: white;
}

/* 调整页面容器样式 */
.data-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
  position: relative;
  z-index: 0;
}

/* 确保头部操作栏在正确的层级 */
.page-header {
  position: relative;
  z-index: 5;
  margin-bottom: 32px;
}

/* 调整模态框层级 */
:deep(.ant-modal-mask),
:deep(.ant-modal-wrap) {
  z-index: 1001;
}

/* 添加表格滚动阴影效果 */
.table-container::after {
  content: '';
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  height: 24px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), transparent);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 2;
}

.table-container.scrolled::after {
  opacity: 1;
}
</style>
