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
                        <a href="#" @click="removeTaskCard(task.id)">删除</a>
                    </template>
                    <p>{{ task.content }}</p>
                </a-card>
            </div>
        </div>

        <!-- 新建任务的 Modal -->
        <a-modal v-model:visible="isModalVisible" title="请输入任务名称" @ok="createTask" @cancel="handleCancel">
            <!-- 使用 v-model 绑定 taskName -->
            <a-input v-model:value="taskName" placeholder="输入任务名称" />
        </a-modal>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useTaskStore } from '../store/index'  // 根据实际路径调整
import { Modal, Input, Button } from 'ant-design-vue'

const taskStore = useTaskStore()

// 控制 Modal 显示与隐藏
const isModalVisible = ref(false)
// 使用 ref 来绑定 taskName
const taskName = ref('')

// 显示 Modal
const showModal = () => {
    isModalVisible.value = true
}

// 取消 Modal 显示
const handleCancel = () => {
    isModalVisible.value = false
    taskName.value = '' // 清空任务名称
}

// 创建任务卡片
const createTask = () => {
    if (taskName.value.trim() === '') {
        Modal.error({
            title: '任务名称不能为空'
        })
    } else {
        taskStore.addTask(taskName.value, '')  // 任务名称添加到任务中，内容初始为空
        isModalVisible.value = false
        taskName.value = ''  // 清空输入框
    }
}

// 删除任务卡片
const removeTaskCard = (id: number) => {
    taskStore.removeTask(id)
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
