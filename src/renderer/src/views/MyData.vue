<template>
    <div>
        <div style="margin-bottom: 16px">
            <a-button type="primary" :disabled="!hasSelected" :loading="state.loading" @click="start">
                加入任务
            </a-button>
            <span style="margin-left: 8px">
                <template v-if="hasSelected">
                    {{ `已选择 ${state.selectedRowKeys.length} 个图片` }}
                </template>
            </span>
        </div>
        <a-table :row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }"
            :columns="columns" :data-source="data" />
    </div>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';

type Key = string | number;

interface DataType {
    key: Key;
    name: string;
    address: string;
}

const columns = [
    {
        title: '图片名称',
        dataIndex: 'name',
    },
    {
        title: '修改时间',
        dataIndex: 'address',
        // 使用自定义渲染格式化时间
        render: (text: string) => {
            const date = new Date(text);
            // 格式化日期为 年-月-日
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        }
    },
];

const data: DataType[] = [];
for (let i = 1; i < 46; i++) {
    // 模拟时间数据，给每个图片添加一个时间
    const date = new Date();
    date.setDate(date.getDate() - i); // 每个图片的时间递减
    data.push({
        key: i,
        name: `图片${i}`,
        address: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`, // 格式化为年-月-日
    });
}

const state = reactive<{
    selectedRowKeys: Key[];
    loading: boolean;
}>({
    selectedRowKeys: [], // Check here to configure the default column
    loading: false,
});
const hasSelected = computed(() => state.selectedRowKeys.length > 0);

const start = () => {
    state.loading = true;
    // ajax request after empty completing
    setTimeout(() => {
        state.loading = false;
        state.selectedRowKeys = [];
    }, 1000);
};
const onSelectChange = (selectedRowKeys: Key[]) => {
    console.log('selectedRowKeys changed: ', selectedRowKeys);
    state.selectedRowKeys = selectedRowKeys;
};
</script>
