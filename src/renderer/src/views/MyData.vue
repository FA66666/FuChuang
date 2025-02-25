<template>
    <div>
        <div style="margin-bottom: 16px">
            <a-button type="primary" :disabled="!hasSelected" @click="openModal">
                加入任务
            </a-button>
            <span style="margin-left: 8px">
                <template v-if="hasSelected">
                    {{ `已选择 ${state.selectedRowKeys.length} 个图片` }}
                </template>
            </span>
        </div>
        <a-table :row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }"
            :columns="columns" :data-source="data" row-key="key" />
        <!-- 模态框：列出现有的任务卡片 -->
        <a-modal title="选择任务卡片" v-model:open="isModalVisible" :ok-disabled="!selectedTaskId" @ok="confirmJoin"
            @cancel="cancelJoin">
            <!-- 注意这里使用 v-model:value 绑定 selectedTaskId -->
            <a-radio-group v-model:value="selectedTaskId">
                <a-radio v-for="task in taskStore.taskCards" :key="task.id" :value="task.id">
                    {{ task.name }}
                </a-radio>
            </a-radio-group>
        </a-modal>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { useTaskStore } from '../store/index'  // 请根据实际路径调整

// 定义数据类型
type Key = string | number
interface DataType {
    key: Key
    name: string
    address: string
}

// 表格列配置
const columns = [
    {
        title: '图片名称',
        dataIndex: 'name'
    },
    {
        title: '修改时间',
        dataIndex: 'address',
        render: (text: string) => {
            const date = new Date(text)
            return `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
        }
    }
]

// 构造模拟数据（45条）
const data: DataType[] = []
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
const state = reactive<{
    selectedRowKeys: Key[]
}>({
    selectedRowKeys: []
})

const hasSelected = computed(() => state.selectedRowKeys.length > 0)

// 引入任务卡片的 store
const taskStore = useTaskStore()

// 控制模态框显示及选中的任务卡片 ID
const isModalVisible = ref(false)
const selectedTaskId = ref<number | null>(null)

// 打开模态框
const openModal = () => {
    isModalVisible.value = true
}

// 取消加入任务
const cancelJoin = () => {
    isModalVisible.value = false
    selectedTaskId.value = null
}

// 确认加入任务：将选中的图片数据格式化后，更新选中的任务卡片内容
const confirmJoin = () => {
    // 根据选中的 key，从 data 中筛选出对应的图片数据
    const selectedData = data.filter(item => state.selectedRowKeys.includes(item.key))
    // 将每条数据格式化为“图片名称（修改时间）”的形式，并以逗号隔开
    const newContent = selectedData
        .map(item => `${item.name} (${item.address})`)
        .join('，')

    if (selectedTaskId.value !== null) {
        // 查找选中任务卡片，获取当前任务名称
        const task = taskStore.taskCards.find(task => task.id === selectedTaskId.value)
        const currentName = task ? task.name : ''
        // 更新选中任务卡片的内容和名称
        taskStore.updateTask(selectedTaskId.value, newContent, currentName)
    }

    // 清空表格选中状态并关闭模态框
    state.selectedRowKeys = []
    selectedTaskId.value = null
    isModalVisible.value = false
}

// 表格行选择变化
const onSelectChange = (selectedRowKeys: Key[]) => {
    console.log('selectedRowKeys changed: ', selectedRowKeys)
    state.selectedRowKeys = selectedRowKeys
}
</script>
