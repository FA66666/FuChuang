<template>
    <a-menu v-model:selectedKeys="current" mode="horizontal" :items="items" />
</template>

<script lang="ts" setup>
import { h, ref } from 'vue';
import { MailOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { MenuProps } from 'ant-design-vue';
const current = ref<string[]>(['mail']);
const items = ref<MenuProps['items']>([
    {
        key: 'mail',
        icon: () => h(MailOutlined),
        label: '选择任务',
        title: 'Select Task',
    },
    {
        key: 'app',
        icon: () => h(AppstoreOutlined),
        label: '可视化分析',
        title: 'Visual Analysis',
    },
    {
        key: 'sub1',
        icon: () => h(SettingOutlined),
        label: 'AI分析',
        title: 'AI Analysis',
        // children: [
        //     {
        //         type: 'group',
        //         label: 'Item 1',
        //         children: [
        //             {
        //                 label: 'Option 1',
        //                 key: 'setting:1',
        //             },
        //             {
        //                 label: 'Option 2',
        //                 key: 'setting:2',
        //             },
        //         ],
        //     },
        //     {
        //         type: 'group',
        //         label: 'Item 2',
        //         children: [
        //             {
        //                 label: 'Option 3',
        //                 key: 'setting:3',
        //             },
        //             {
        //                 label: 'Option 4',
        //                 key: 'setting:4',
        //             },
        //         ],
        //     },
        // ],
    }
]);
</script>

<style scoped>
.report {
    display: flex;
    flex-direction: column;
    align-items: center;
}

button {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
}

button:hover {
    background-color: #45a049;
}
</style>
