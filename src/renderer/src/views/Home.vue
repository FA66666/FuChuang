<template>
    <div>
        <!-- 添加任务卡片按钮 -->
        <a-button type="primary" @click="showModal">
            添加任务卡片
        </a-button>
        <br /><br />

        <!-- 显示所有任务卡片 -->
        <div class="card-container">
            <div v-for="task in tasks" :key="task.id" class="task-card">
                <a-card :title="task.name" class="task-card">
                    <template #extra>
                        <!-- 下拉菜单 -->
                        <a-dropdown>
                            <a class="ant-dropdown-link" @click.stop.prevent> <!-- 阻止事件冒泡 -->
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
                    <div @click="openTaskDetail(task.id)" class="card-content"> <!-- 添加点击区域 -->
                        <p>{{ task.content }}</p>
                        <div class="preview-images">
                            <a-tooltip v-for="(img, index) in task.images" :key="img.id" :title="img.name">
                                <img :src="img.preview" class="thumbnail" />
                                <span v-if="index === 2 && task.images.length > 3" class="more-count">
                                    +{{ task.images.length - 3 }}
                                </span>
                            </a-tooltip>
                        </div>
                    </div>
                </a-card>
            </div>
        </div>

        <!-- 任务详情模态框 -->
        <a-modal v-model:visible="taskDetailVisible" :title="selectedTask?.name" width="80%"
            @ok="taskDetailVisible = false" :ok-button-props="{ style: { display: 'none' } }">
            <div class="image-manager">
                <a-row :gutter="[16, 16]">
                    <a-col v-for="(image, index) in selectedTask?.images" :key="index" :span="6">
                        <div class="image-item">
                            <img :src="image.preview" class="preview-image" />
                            <a-button type="danger" shape="circle" class="delete-btn" @click="removeImage(index)">
                                <DeleteOutlined />
                            </a-button>
                        </div>
                    </a-col>
                </a-row>

                <a-upload :before-upload="beforeUpload" :custom-request="handleUpload" :show-upload-list="false"
                    accept="image/*">
                    <a-button type="dashed" block style="margin-top: 16px">
                        <UploadOutlined /> 添加图片（最大 5MB）
                    </a-button>
                </a-upload>
            </div>
        </a-modal>

        <!-- 新建任务 Modal -->
        <a-modal v-model:visible="isModalVisible" title="请输入任务名称" @ok="createTask" @cancel="handleCancel">
            <a-input v-model:value="taskName" placeholder="输入任务名称" @keydown.enter="createTask" :maxlength="20"
                show-count />
        </a-modal>

        <!-- 重命名 Modal -->
        <a-modal v-model:visible="isRenameModalVisible" title="重命名任务" @ok="renameTask" @cancel="handleRenameCancel">
            <a-input v-model:value="newTaskName" placeholder="输入新任务名称" :maxlength="20" show-count />
        </a-modal>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { DownOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { useTaskStore } from '../store/index';
import api from '../utils/api'; // 假设你已经有 axios 实例
import type { Task } from '../store/index';

const taskStore = useTaskStore();

const tasks = ref<Task[]>([]); // 存储任务列表

// 状态管理
const isModalVisible = ref(false);
const isRenameModalVisible = ref(false);
const taskName = ref('');
const newTaskName = ref('');
const currentTaskId = ref<number | null>(null);
const taskDetailVisible = ref(false);
const selectedTask = ref<Task | null>(null);

// 图片上传配置
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 获取任务列表
const getTasks = async () => {
    try {
        const response = await api.get('/tasks');
        tasks.value = response.data.data.tasks;
    } catch (error) {
        message.error('获取任务列表失败');
        console.error('Error fetching tasks:', error);
    }
};

// 任务卡片点击处理
const openTaskDetail = (taskId: number) => {
    selectedTask.value = taskStore.taskCards.find(t => t.id === taskId) || null;
    taskDetailVisible.value = true;
};

// 删除图片
const removeImage = async (index: number) => {
    if (!selectedTask.value) return;

    Modal.confirm({
        title: '确认删除图片？',
        content: '此操作不可恢复',
        onOk: () => {
            taskStore.removeTaskImage(selectedTask.value!.id, index);
            message.success('图片删除成功');
        },
    });
};

// 图片上传处理
const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isValidSize = file.size <= MAX_FILE_SIZE;

    if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
    }

    if (!isValidSize) {
        message.error('图片大小不能超过5MB！');
        return false;
    }

    return true;
};

const handleUpload = async ({ file }: { file: File }) => {
    try {
        if (!selectedTask.value) return;

        // 读取文件为Data URL
        const dataUrl = await window.electronAPI.readImage(file);

        // 直接存储Data URL
        taskStore.addTaskImage(selectedTask.value.id, dataUrl);
        message.success('图片上传成功');
    } catch (error) {
        message.error('图片上传失败');
        console.error('Upload error:', error);
    }
};

// 任务管理功能
const showModal = () => {
    isModalVisible.value = true;
    taskName.value = '';
};

const handleCancel = () => {
    isModalVisible.value = false;
    taskName.value = '';
};

// 创建任务
const createTask = async () => {
    const name = taskName.value.trim() || `任务${taskStore.taskCards.length + 1}`;
    try {
        const response = await api.post('/tasks', { name });
        tasks.value.push(response.data.data);
        isModalVisible.value = false;
        taskName.value = '';
        message.success('任务创建成功');
    } catch (error) {
        message.error('创建任务失败');
        console.error('Error creating task:', error);
    }
};

const showRenameModal = (id: number) => {
    currentTaskId.value = id;
    const task = tasks.value.find(task => task.id === id);
    newTaskName.value = task?.name || '';
    isRenameModalVisible.value = true;
};

// 重命名任务
const renameTask = async () => {
    if (!newTaskName.value.trim()) {
        message.error('任务名称不能为空');
        return;
    }

    if (currentTaskId.value !== null) {
        try {
            const response = await api.patch(`/tasks/${currentTaskId.value}/rename`, {
                name: newTaskName.value,
            });
            const updatedTask = response.data.data;
            const index = tasks.value.findIndex(task => task.id === currentTaskId.value);
            if (index !== -1) {
                tasks.value[index] = updatedTask;
            }
            isRenameModalVisible.value = false;
            message.success('任务重命名成功');
        } catch (error) {
            message.error('重命名任务失败');
            console.error('Error renaming task:', error);
        }
    }
};

const handleRenameCancel = () => {
    isRenameModalVisible.value = false;
    newTaskName.value = '';
};

// 删除任务
const removeTaskCard = async (id: number) => {
    Modal.confirm({
        title: '确定删除该任务？',
        content: '所有关联数据将被永久删除',
        onOk: async () => {
            try {
                await api.delete(`/tasks/${id}`);
                tasks.value = tasks.value.filter(task => task.id !== id);
                message.success('任务删除成功');
            } catch (error) {
                message.error('删除任务失败');
                console.error('Error deleting task:', error);
            }
        },
    });
};

const handleMenuClick = (id: number, command: string) => {
    if (command === 'rename') {
        showRenameModal(id);
    } else if (command === 'delete') {
        removeTaskCard(id);
    }
};

// 初始化任务列表
onMounted(() => {
    getTasks();
});
</script>
