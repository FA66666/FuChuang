<template>
    <a-row class="report-container" gutter={20}>
        <!-- 左侧部分 -->
        <a-col span="16" class="left-panel">
            <!-- 圆环图部分 -->
            <a-card class="chart-container">
                <div class="chart-title">基础环图</div>
                <div class="chart-content">
                    <!-- 你可以在这里嵌入实际的图表组件 -->
                    <p>图表内容（可以用chart库如ECharts展示）</p>
                </div>
            </a-card>

            <!-- 表格部分 -->
            <a-card class="table-container">
                <div class="table-title">图片名称</div>
                <a-table :columns="columns" :data-source="tableData" pagination={false} />
            </a-card>
        </a-col>

        <!-- 右侧部分 -->
        <a-col span="8" class="right-panel">
            <a-card class="report-title">检测报告 (By 大模型)</a-card>
            <a-card class="report-content">
                <p>报告内容将在此显示...</p>
                <!-- 选择任务按钮 -->
                <a-button type="primary" @click="showModal">选择任务</a-button>
                <p v-if="selectedTask">当前任务为：{{ selectedTask.content }}</p> <!-- 显示当前任务 -->
            </a-card>
        </a-col>
    </a-row>

    <!-- 选择任务的 Modal -->
    <a-modal v-model:visible="isModalVisible" title="选择任务" @ok="handleOk" @cancel="handleCancel">
        <div class="task-container">
            <div v-for="task in taskStore.taskCards" :key="task.id" class="task-card">
                <a-card :title="'任务卡片 ' + task.id" :style="{ width: '100%' }">
                    <template #extra>
                        <a href="#" @click="removeTaskCard(task.id)">删除</a>
                    </template>
                    <a-checkbox v-model:checked="selectedTasks[task.id]" :value="task.id"
                        @change="handleCheckboxChange(task)">
                        {{ task.content }}
                    </a-checkbox>
                </a-card>
            </div>
        </div>
    </a-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTaskStore } from '../store/index';
import { Button, Modal, Card, Table, Row, Col, Checkbox } from 'ant-design-vue';

const router = useRouter();
const taskStore = useTaskStore();

// 控制Modal显示和隐藏
const isModalVisible = ref(false);

// 当前选中的任务
const selectedTask = ref<{ id: number; content: string } | null>(null);

// 保存所有复选框选择的任务
const selectedTasks = ref<{ [key: number]: boolean }>({});

// 显示Modal
const showModal = () => {
    isModalVisible.value = true;
};

// 隐藏Modal
const handleCancel = () => {
    isModalVisible.value = false;
};

// 点击确定按钮时的处理
const handleOk = () => {
    // 获取被选中的任务
    const selectedTaskIds = Object.keys(selectedTasks.value)
        .filter((key) => selectedTasks.value[parseInt(key)]);

    if (selectedTaskIds.length > 0) {
        const taskId = parseInt(selectedTaskIds[0]); // 只选择一个任务
        selectedTask.value = taskStore.taskCards.find(task => task.id === taskId) || null;
    } else {
        selectedTask.value = null;
    }

    isModalVisible.value = false;
};

// 选择任务的处理
const handleCheckboxChange = (task: { id: number; content: string }) => {
    console.log('选择了任务:', task);
};

const removeTaskCard = (id: number) => {
    taskStore.removeTask(id);
}

// 表格数据和列
const columns = [
    {
        title: '图片名称',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: '缺陷类型',
        dataIndex: 'defect',
        key: 'defect',
    },
    {
        title: '量信度',
        dataIndex: 'confidence',
        key: 'confidence',
    },
];

const tableData = [
    {
        key: '1',
        name: '示例图片1',
        defect: '类型A',
        confidence: '95%',
    },
    {
        key: '2',
        name: '示例图片2',
        defect: '类型B',
        confidence: '92%',
    },
    // 其他数据行
];
</script>

<style scoped>
.report-container {
    padding: 20px;
}

.left-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.right-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.chart-title,
.table-title {
    font-weight: bold;
    margin-bottom: 10px;
}

.report-title {
    font-size: 18px;
    font-weight: bold;
}

.report-content {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 5px;
}

.task-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.task-card {
    flex: 0 0 calc(25% - 16px);
    box-sizing: border-box;
}

.a-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
}
</style>
