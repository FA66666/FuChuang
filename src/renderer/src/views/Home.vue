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
                <a-card :title="task.name" :style="{ width: '100%' }">
                    <template #extra>
                        <!-- 下拉菜单 -->
                        <a-dropdown>
                            <a class="ant-dropdown-link" @click.prevent>
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
                    <p>{{ task.content }}</p>
                </a-card>
            </div>
        </div>

        <!-- 新建任务的 Modal -->
        <a-modal v-model:visible="isModalVisible" title="请输入任务名称" @ok="createTask" @cancel="handleCancel">
            <a-input v-model:value="taskName" placeholder="输入任务名称" @keydown.enter="createTask" />
        </a-modal>

        <!-- 重命名任务的 Modal -->
        <a-modal v-model:visible="isRenameModalVisible" title="重命名任务" @ok="renameTask" @cancel="handleRenameCancel">
            <a-input v-model:value="newTaskName" placeholder="输入新任务名称" />
        </a-modal>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useTaskStore } from '../store/index'  // 根据实际路径调整
import { Modal, Input, Button } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'

const taskStore = useTaskStore()

// 控制 Modal 显示与隐藏
const isModalVisible = ref(false)
const isRenameModalVisible = ref(false)
const taskName = ref('')
const newTaskName = ref('')  // 用于重命名任务时存储新名称
const currentTaskId = ref<number | null>(null)  // 当前正在编辑的任务 ID

// 显示新建任务 Modal
const showModal = () => {
    isModalVisible.value = true
}

// 取消新建任务 Modal 显示
const handleCancel = () => {
    isModalVisible.value = false
    taskName.value = '' // 清空任务名称
}

// 创建任务卡片
const createTask = () => {
    const taskNameToUse = taskName.value.trim() === '' ? `任务${taskStore.taskCards.length + 1}` : taskName.value;

    taskStore.addTask(taskNameToUse, '')  // 使用用户输入的名称或默认名称
    isModalVisible.value = false
    taskName.value = ''  // 清空输入框
}

// 显示重命名任务的 Modal
const showRenameModal = (id: number) => {
    currentTaskId.value = id
    const task = taskStore.taskCards.find(task => task.id === id)
    if (task) {
        newTaskName.value = task.name
    }
    isRenameModalVisible.value = true
}

// 重命名任务
const renameTask = () => {
    if (newTaskName.value.trim() === '') {
        Modal.error({
            title: '任务名称不能为空'
        })
    } else if (currentTaskId.value !== null) {
        taskStore.updateTask(currentTaskId.value, '', newTaskName.value)  // 更新任务名称
        isRenameModalVisible.value = false
        newTaskName.value = ''  // 清空输入框
    }
}

// 取消重命名 Modal 显示
const handleRenameCancel = () => {
    isRenameModalVisible.value = false
    newTaskName.value = ''
}

// 删除任务卡片
const removeTaskCard = (id: number) => {
    Modal.confirm({
        title: '确定删除该任务?',
        onOk() {
            taskStore.removeTask(id)
        },
    })
}

// 处理下拉菜单点击事件
const handleMenuClick = (id: number, command: string) => {
    if (command === 'rename') {
        showRenameModal(id)  // 显示重命名任务的 Modal
    } else if (command === 'delete') {
        removeTaskCard(id)  // 删除任务
    }
}
</script>

<style scoped>
/* 任务卡片容器 */
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

/* 单个任务卡片 */
.task-card {
    flex: 0 0 calc(25% - 16px);
    box-sizing: border-box;
}

/* 卡片样式 */
.a-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
}
</style>
