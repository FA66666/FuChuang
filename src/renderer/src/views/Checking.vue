<template>
  <div class="checking-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">表面缺陷检测</h1>
        <p class="page-subtitle">选择图片或项目进行智能缺陷检测分析</p>
      </div>
    </div>

    <div class="main-content">
      <div class="action-cards">
        <!-- 导入图片卡片 -->
        <a-card class="action-card" hoverable @click="showImportImageModal">
          <template #cover>
            <div class="card-cover image-import">
              <picture-outlined />
            </div>
          </template>
          <a-card-meta title="从我的数据导入">
            <template #description>选择已上传的图片进行检测</template>
          </a-card-meta>
        </a-card>

        <!-- 导入项目卡片 -->
        <a-card class="action-card" hoverable @click="showImportTaskModal">
          <template #cover>
            <div class="card-cover task-import">
              <folder-outlined />
            </div>
          </template>
          <a-card-meta title="从我的任务导入">
            <template #description>选择已有任务项目进行检测</template>
          </a-card-meta>
        </a-card>
      </div>

      <!-- 检测结果展示 -->
      <div class="result-section" v-if="detectionResult">
        <a-result status="success" title="检测完成" sub-title="无缺陷" class="detection-result">
          <template #extra>
            <div class="result-details">
              <p>{{ detectionResult }}</p>
            </div>
          </template>
        </a-result>
      </div>
    </div>

    <!-- 从我的数据中导入图片的模态框 -->
    <a-modal
      v-model:visible="isImportImageModalVisible"
      title="选择图片"
      @ok="handleImportImage"
      @cancel="handleCancel"
      class="import-modal"
      :width="800"
    >
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
          pageSize: 8,
          showSizeChanger: false
        }"
      />
    </a-modal>

    <!-- 从我的任务中导入项目的模态框 -->
    <a-modal
      v-model:visible="isImportTaskModalVisible"
      title="选择任务"
      @ok="handleImportTask"
      @cancel="handleCancel"
      class="task-modal"
      :width="600"
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

    <!-- 确认传输的模态框 -->
    <a-modal
      v-model:visible="isConfirmModalVisible"
      title="确认传输"
      @ok="handleConfirm"
      @cancel="handleCancel"
      class="confirm-modal"
    >
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
import { ref, reactive, computed } from 'vue'
import { useAppStore } from '@renderer/store'
import { useTaskStore } from '../store/index'
import { message } from 'ant-design-vue'
import { PictureOutlined, FolderOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'

const store = useAppStore()
const taskStore = useTaskStore()

const detectionResult = ref(null)
const imageData = ref(null)
const selectedTaskId = ref(null)

const isImportImageModalVisible = ref(false)
const isImportTaskModalVisible = ref(false)
const isConfirmModalVisible = ref(false) // 控制确认模态框的显示
const transferContent = ref('') // 存储传输的内容

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

// 打开"从我的数据中导入图片"的模态框
const showImportImageModal = () => {
  isImportImageModalVisible.value = true
}

// 打开"从我的任务中导入项目"的模态框
const showImportTaskModal = () => {
  isImportTaskModalVisible.value = true
}

// 关闭模态框
const handleCancel = () => {
  isImportImageModalVisible.value = false
  isImportTaskModalVisible.value = false
  isConfirmModalVisible.value = false
  selectedTaskId.value = null
  imageData.value = null
}

// 导入图片
const handleImportImage = () => {
  if (imageData.value) {
    console.log('上传图片:', imageData.value)
    transferContent.value = `图片名称: ${imageData.value.name}` // 设置传输内容
    isConfirmModalVisible.value = true // 显示确认传输模态框
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
      transferContent.value = `任务名称: ${task.name}\n任务内容: ${task.content}` // 设置传输内容
      isConfirmModalVisible.value = true // 显示确认传输模态框
    }
  } else {
    message.error('请先选择一个任务')
  }
}

// 确认传输
const handleConfirm = () => {
  console.log('正在传输内容:', transferContent.value)
  message.success('任务/图片传输成功')
  handleCancel() // 关闭所有模态框
}

// 表格选中行变化
const onSelectChange = (selectedRowKeys) => {
  console.log('selectedRowKeys changed: ', selectedRowKeys)
  state.selectedRowKeys = selectedRowKeys
}
</script>

<style scoped>
.checking-container {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 40px;
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

.main-content {
  max-width: 1200px;
  margin: 0 auto;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.action-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-cover {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
}

.image-import {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.task-import {
  background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
}

:deep(.ant-card-meta-title) {
  font-size: 18px;
  margin-bottom: 8px !important;
}

:deep(.ant-card-meta-description) {
  color: #6b7280;
  font-size: 14px;
}

.result-section {
  margin-top: 40px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.detection-result {
  :deep(.ant-result-title) {
    font-size: 24px;
    color: #1f2937;
  }

  :deep(.ant-result-subtitle) {
    font-size: 16px;
    color: #6b7280;
  }
}

.result-details {
  margin-top: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  color: #4b5563;
}

/* 模态框样式 */
.import-modal,
.task-modal,
.confirm-modal {
  :deep(.ant-modal-content) {
    border-radius: 12px;
    overflow: hidden;
  }

  :deep(.ant-modal-header) {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.ant-modal-body) {
    padding: 24px;
  }

  :deep(.ant-modal-footer) {
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
  }
}

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
  transition: background-color 0.3s ease;

  &:hover {
    background: #f5f7fa;
  }
}

.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
}

.confirm-icon {
  font-size: 24px;
  color: #52c41a;
}

.confirm-details {
  flex: 1;

  h3 {
    margin: 0 0 8px;
    color: #1f2937;
    font-size: 16px;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .checking-container {
    padding: 16px;
  }

  .action-cards {
    grid-template-columns: 1fr;
  }

  .card-cover {
    height: 120px;
    font-size: 36px;
  }
}

/* 添加动画 */
.checking-container {
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
</style>
