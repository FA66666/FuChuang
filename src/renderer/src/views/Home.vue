<template>
    <div>
        <!-- 按钮：添加任务卡片 -->
        <a-button type="primary" @click="addTaskCard">添加任务卡片</a-button>
        <br /><br />

        <!-- 显示所有任务卡片 -->
        <div class="card-container">
            <div v-for="task in taskCards" :key="task.id" class="task-card">
                <a-card :title="'任务卡片 ' + task.id" :style="{ width: '100%' }">
                    <template #extra>
                        <a href="#" @click="removeTaskCard(task.id)">删除</a>
                    </template>
                    <p>{{ task.content }}</p>
                    <p>{{ task.content }}</p>
                    <p>{{ task.content }}</p>
                </a-card>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';

export default {
    name: 'TaskCardApp',
    setup() {
        // 存储任务卡片列表
        const taskCards = ref([]);

        // 添加任务卡片的功能
        const addTaskCard = () => {
            const newId = taskCards.value.length + 1;
            taskCards.value.push({
                id: newId,    // 使用唯一ID标识每个卡片
                content: `这是新的任务卡片内容 ${newId}`
            });
        };

        // 删除任务卡片的功能
        const removeTaskCard = (id) => {
            const index = taskCards.value.findIndex(task => task.id === id);
            if (index !== -1) {
                taskCards.value.splice(index, 1); // 删除对应ID的卡片
            }
        };

        return {
            taskCards,
            addTaskCard,
            removeTaskCard
        };
    }
};
</script>

<style scoped>
/* 任务卡片容器 */
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    /* 卡片之间的间隙 */
}

/* 单个任务卡片 */
.task-card {
    flex: 0 0 calc(25% - 16px);
    /* 每行最多四个卡片 */
    box-sizing: border-box;
}

/* 可以在此添加更多样式来优化卡片 */
.a-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
}
</style>
