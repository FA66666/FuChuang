<template>
    <a-row class="report-container" gutter={20}>
        <!-- 左侧部分 -->
        <a-col span="16" class="left-panel">
            <!-- 圆环图部分 -->
            <a-card class="chart-container">
                <div class="chart-title">基础环图</div>
                <div class="chart-content">
                    <!-- 模拟一个图表 -->
                    <p>这里是一个环形图区域（可以用 ECharts 等图表库替换）</p>
                </div>
            </a-card>

            <!-- 表格部分 -->
            <a-card class="table-container">
                <div class="table-title">图片名称</div>
                <a-table :columns="columns" :data-source="tableData" :pagination="false" />
            </a-card>
        </a-col>

        <!-- 右侧部分 -->
        <a-col span="8" class="right-panel">
            <a-card class="report-title">检测报告 (By 大模型)</a-card>
            <a-card class="report-content">
                <p>报告内容将在此显示...</p>
                <!-- 选择任务按钮 -->
                <a-button type="primary" @click="showModal">选择任务</a-button>
                <p v-if="selectedTask">当前任务为：{{ selectedTask.name }}</p> <!-- 显示当前任务名称 -->
            </a-card>
        </a-col>
    </a-row>

    <!-- 选择任务的 Modal，使用单选框 -->
    <a-modal v-model:visible="isModalVisible" title="选择任务" @ok="handleOk" @cancel="handleCancel">
        <a-radio-group v-model:value="selectedTaskId">
            <a-radio v-for="task in taskStore.taskCards" :key="task.id" :value="task.id">
                {{ task.name }}
            </a-radio>
        </a-radio-group>
    </a-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useTaskStore } from '../store/index';
import { Button, Modal, Card, Table, Row, Col, Radio } from 'ant-design-vue';

const taskStore = useTaskStore();

// 控制 Modal 显示和隐藏
const isModalVisible = ref(false);

// 当前选中的任务（完整任务对象）
const selectedTask = ref<{ id: number; name: string; content: string } | null>(null);

// 用于单选框绑定的任务 ID
const selectedTaskId = ref<number | null>(null);

// 显示 Modal
const showModal = () => {
    isModalVisible.value = true;
};

// 取消选择
const handleCancel = () => {
    isModalVisible.value = false;
    selectedTaskId.value = null;
};

// 点击确定按钮时，根据选中的任务 ID 查找任务，并更新 selectedTask
const handleOk = () => {
    if (selectedTaskId.value !== null) {
        selectedTask.value = taskStore.taskCards.find(task => task.id === selectedTaskId.value) || null;
    } else {
        selectedTask.value = null;
    }
    isModalVisible.value = false;
};

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
    // 其他数据行...
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
</style>