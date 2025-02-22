<template>
    <div>
        <!-- 添加任务卡片按钮 -->
        <a-button type="primary" @click="createTaskCard">
            添加任务卡片
        </a-button>
        <br /><br />

        <!-- 显示所有任务卡片 -->
        <div class="card-container">
            <div v-for="task in taskStore.taskCards" :key="task.id" class="task-card">
                <a-card :title="'任务卡片 ' + task.id" :style="{ width: '100%' }">
                    <template #extra>
                        <a href="#" @click="removeTaskCard(task.id)">删除</a>
                    </template>
                    <!-- 任务内容会被 MyData.vue 导入的数据更新 -->
                    <p>{{ task.content }}</p>
                </a-card>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useTaskStore } from '../store/index'  // 根据实际路径调整
const taskStore = useTaskStore()

// 创建新的任务卡片（初始内容为空）
const createTaskCard = () => {
    taskStore.addTask('')
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
