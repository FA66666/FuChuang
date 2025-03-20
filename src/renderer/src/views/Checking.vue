<template>
  <div class="checking-page">
    <div class="main-layout">
      <!-- 左侧面板：白色背景 -->
      <div class="left-panel">
        <div class="panel-title">缺陷检测入口</div>

        <!-- 导入图片卡片 -->
        <a-card class="function-card" hoverable @click="showImportImageModal">
          <template #cover>
            <div class="card-cover image-import">
              <picture-outlined />
            </div>
          </template>
          <a-card-meta title="从我的数据导入" />
        </a-card>

        <!-- 导入项目卡片 -->
        <a-card class="function-card" hoverable @click="showImportTaskModal">
          <template #cover>
            <div class="card-cover task-import">
              <folder-outlined />
            </div>
          </template>
          <a-card-meta title="从我的任务导入" />
        </a-card>

        <!-- 开始运行按钮 -->
        <a-button type="primary" block class="start-run-button" @click="handleStartRun">
          开始运行
        </a-button>
      </div>

      <!-- 右侧检测结果展示区 -->
      <div class="right-panel">
        <!-- 中部区域：示意检测结果图像 -->
        <div class="detection-view">
          <div class="detection-image-area">
            <!-- 这里可以放置检测后的图像、标注框等，示意： -->
            <div class="fake-image">检测结果图像区域</div>
          </div>

          <!-- 右下角若有统计信息或置信度，可在此放置 -->
          <div class="detection-info" v-if="detectionResult">
            <a-result status="success" title="检测完成" sub-title="下方为检测结果" class="detection-result">
              <template #extra>
                <div class="result-details">
                  <p>{{ detectionResult }}</p>
                </div>
              </template>
            </a-result>
          </div>
        </div>

        <!-- 底部区域：检测结果表格(示例) -->
        <div class="result-table">
          <a-table :columns="resultColumns" :data-source="resultData"
            :pagination="{ pageSize: 5, showSizeChanger: false }" />
        </div>
      </div>
    </div>

    <!-- 从我的数据中导入图片的模态框 -->
    <a-modal v-model:visible="isImportImageModalVisible" title="选择图片" @ok="handleImportImage" @cancel="handleCancel"
      class="import-modal" :width="800">
      <a-row :gutter="[8, 8]">
        <!-- 将 :span="12" 改为 :span="6" 以实现一行4列 -->
        <a-col v-for="(image, index) in myImages" :key="image.id" :span="6">
          <div class="detail-image-item" @click="toggleSelectImage(image.id)">
            <div class="detail-image-wrapper">
              <img :src="image.preview" class="detail-preview-image" />
              <!-- 选中时显示半透明覆盖层及图标 -->
              <div class="image-overlay" v-if="selectedImageIds.includes(image.id)">
                <check-outlined style="font-size: 20px; color: #fff" />
              </div>
            </div>
            <div class="detail-image-name">{{ image.name }}</div>
          </div>
        </a-col>
      </a-row>
    </a-modal>

    <!-- 从我的任务中导入项目的模态框 -->
    <a-modal v-model:visible="isImportTaskModalVisible" title="选择任务" @ok="handleImportTask" @cancel="handleCancel"
      class="task-modal" :width="600">
      <div class="task-list">
        <a-radio-group v-model:value="selectedTaskId" class="task-radio-group">
          <a-radio v-for="task in taskStore.taskCards" :key="task.id" :value="task.id" class="task-radio">
            {{ task.name }}
          </a-radio>
        </a-radio-group>
      </div>
    </a-modal>

    <!-- 确认传输的模态框 -->
    <a-modal v-model:visible="isConfirmModalVisible" title="确认传输" @ok="handleConfirm" @cancel="handleCancel"
      class="confirm-modal">
      <div class="confirm-content">
        <check-circle-outlined class="confirm-icon" />
        <div class="confirm-details">
          <h3>即将开始检测</h3>
          <p>{{ transferContent }}</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  PictureOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  CheckOutlined
} from '@ant-design/icons-vue'
import { useAppStore } from '@renderer/store'
import { useTaskStore } from '../store/index'

const store = useAppStore()
const taskStore = useTaskStore()

// 检测结果示例
const detectionResult = ref(null)

// 控制模态框显示
const isImportImageModalVisible = ref(false)
const isImportTaskModalVisible = ref(false)
const isConfirmModalVisible = ref(false)

// 存储导入信息（如图片或任务名称）
const transferContent = ref('')

// 当前选择的任务ID
const selectedTaskId = ref(null)

// 从后端加载的“我的数据”图片列表
const myImages = ref([])

// 已选中的图片ID
const selectedImageIds = ref([])

// --------------- 获取真实图片 ---------------
async function fetchMyImages() {
  try {
    const token = localStorage.getItem('authToken') || ''
    const response = await axios.get('http://localhost:3000/api/images', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const { images } = response.data.data
    myImages.value = images.map((img) => ({
      id: img.id,
      name: img.original_filename,
      preview: `http://localhost:3000/api/processed/${img.filename}`
    }))
  } catch (error) {
    console.error('获取我的图片失败:', error)
    message.error('获取我的图片失败')
  }
}

// --------------- 打开“从我的数据导入”模态框 ---------------
function showImportImageModal() {
  selectedImageIds.value = []
  fetchMyImages()
  isImportImageModalVisible.value = true
}

// --------------- 切换选中状态 ---------------
function toggleSelectImage(imageId) {
  const idx = selectedImageIds.value.indexOf(imageId)
  if (idx === -1) {
    selectedImageIds.value.push(imageId)
  } else {
    selectedImageIds.value.splice(idx, 1)
  }
}

// --------------- 导入图片 ---------------
function handleImportImage() {
  if (!selectedImageIds.value.length) {
    message.error('请先选择图片')
    return
  }
  transferContent.value = `已选择 ${selectedImageIds.value.length} 张图片`
  // 关闭图片模态框后再显示确认模态框
  isImportImageModalVisible.value = false
  isConfirmModalVisible.value = true
}

// --------------- 打开“从我的任务导入”模态框 ---------------
function showImportTaskModal() {
  selectedTaskId.value = null
  isImportTaskModalVisible.value = true
}

// --------------- 导入任务 ---------------
function handleImportTask() {
  if (selectedTaskId.value === null) {
    message.error('请先选择一个任务')
    return
  }
  const task = taskStore.taskCards.find((t) => t.id === selectedTaskId.value)
  if (task) {
    transferContent.value = `任务名称: ${task.name}\n任务内容: ${task.content || '无描述'}`
    isImportTaskModalVisible.value = false
    isConfirmModalVisible.value = true
  }
}

// --------------- 确认传输 ---------------
function handleConfirm() {
  console.log('正在传输内容:', transferContent.value)
  message.success('任务/图片传输成功')
  handleCancel()
}

// --------------- 关闭模态框 ---------------
function handleCancel() {
  isImportImageModalVisible.value = false
  isImportTaskModalVisible.value = false
  isConfirmModalVisible.value = false
  selectedTaskId.value = null
  selectedImageIds.value = []
  transferContent.value = ''
}

// --------------- 点击“开始运行”按钮 ---------------
function handleStartRun() {
  console.log('开始运行检测逻辑...')
  message.info('开始运行，请稍候...')
}

// ------------------ 演示用检测结果表格 ------------------
const resultColumns = [
  { title: '序号', dataIndex: 'id', key: 'id' },
  { title: '缺陷类型', dataIndex: 'type', key: 'type' },
  { title: '置信度', dataIndex: 'confidence', key: 'confidence' },
  { title: '位置', dataIndex: 'location', key: 'location' }
]

const resultData = [
  {
    id: 1,
    type: 'patches',
    confidence: 0.86,
    location: 'x:12,y:15,w:30,h:50'
  },
  {
    id: 2,
    type: 'patches',
    confidence: 0.9,
    location: 'x:45,y:40,w:20,h:20'
  }
]
</script>

<style scoped>
/* 整体容器，使用100vh且不出现滚动条 */
.checking-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* 主体布局：左右两栏 */
.main-layout {
  flex: 1;
  display: flex;
  padding: 8px;
  gap: 8px;
}

/* 左侧面板 */
.left-panel {
  width: 240px;
  background-color: #fff;
  color: #333;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.function-card {
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  color: #333;
}

.function-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card-cover {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #fff;
}

.image-import {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.task-import {
  background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
}

.start-run-button {
  margin-top: auto;
}

/* 右侧区域 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detection-view {
  flex: 1;
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.detection-image-area {
  flex: 3;
  background: #fff;
  border-radius: 8px;
  min-height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fake-image {
  width: 80%;
  height: 80%;
  border: 1px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.detection-info {
  flex: 2;
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}

.result-table {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}

:deep(.ant-result-title) {
  font-size: 16px;
  color: #1f2937;
}

:deep(.ant-result-subtitle) {
  font-size: 12px;
  color: #6b7280;
}

.result-details {
  margin-top: 8px;
  background: #f9fafb;
  padding: 8px;
  border-radius: 8px;
  color: #4b5563;
}

/* 模态框样式 */
.import-modal,
.task-modal,
.confirm-modal {
  :deep(.ant-modal-content) {
    border-radius: 8px;
  }
}

.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.confirm-icon {
  font-size: 20px;
  color: #52c41a;
}

.confirm-details h3 {
  margin: 0 0 4px;
  font-size: 14px;
}

.confirm-details p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* 图片网格样式 */
.detail-image-item {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.detail-image-item:hover {
  transform: translateY(-2px);
}

.detail-image-wrapper {
  position: relative;
  width: 100%;
  /* 调整此处的 padding-top，缩小图片显示区域 */
  padding-top: 60%;
  overflow: hidden;
}

.detail-preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.detail-image-item:hover .detail-preview-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(24, 144, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image-name {
  padding: 4px;
  font-size: 10px;
  color: #666;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式处理 */
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
    padding: 4px;
  }

  .left-panel {
    width: 100%;
    padding: 8px;
  }

  .start-run-button {
    margin-top: 8px;
  }

  .right-panel {
    padding: 4px;
  }

  .detection-view {
    flex-direction: column;
  }

  .detection-image-area {
    min-height: 150px;
  }
}
</style>
