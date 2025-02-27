<template>
    <div class="user-center">
        <a-page-header title="用户中心" :sub-title="userStore.isAdmin ? '管理员控制面板' : '个人中心'">
            <template #extra>
                <a-button v-if="userStore.isAdmin" type="primary" @click="showApiKeyModal">
                    <template #icon>
                        <KeyOutlined />
                    </template>
                    生成API密钥
                </a-button>
            </template>
        </a-page-header>

        <!-- 基本信息 -->
        <a-card title="个人信息" style="margin-top: 20px">
            <a-descriptions bordered>
                <a-descriptions-item label="用户名">{{ currentUser.username }}</a-descriptions-item>
                <a-descriptions-item label="身份">
                    <a-tag :color="userStore.isAdmin ? 'green' : 'default'">
                        {{ userStore.isAdmin ? '管理员' : '普通用户' }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="注册时间">{{ formatDate(currentUser.createTime) }}</a-descriptions-item>
                <a-descriptions-item label="最后登录">{{ formatDate(currentUser.lastLogin) || '--' }}</a-descriptions-item>
            </a-descriptions>
        </a-card>

        <!-- 管理员面板 -->
        <template v-if="userStore.isAdmin">
            <!-- 用户管理 -->
            <a-card title="用户管理" style="margin-top: 20px">
                <div class="user-management-toolbar">
                    <a-input-search v-model:value="searchQuery" placeholder="搜索用户..." style="width: 300px" />
                    <a-button type="primary" @click="showUserModal">
                        <template #icon>
                            <PlusOutlined />
                        </template>
                        新建用户
                    </a-button>
                </div>

                <a-table :columns="userColumns" :data-source="filteredUsers" :pagination="{ pageSize: 8 }"
                    :rowKey="record => record.id" :rowClassName="setRowClass">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.dataIndex === 'isAdmin'">
                            <a-switch :checked="record.isAdmin" :disabled="record.id === currentUser.id"
                                @change="checked => handlePermissionChange(record, checked)" />
                        </template>
                        <template v-else-if="column.dataIndex === 'actions'">
                            <a-button type="link" @click="editUser(record)">编辑</a-button>
                            <a-popconfirm title="确定删除此用户？" @confirm="deleteUser(record.id)">
                                <a-button type="link" danger>删除</a-button>
                            </a-popconfirm>
                        </template>
                    </template>
                </a-table>
            </a-card>

            <!-- API密钥管理 -->
            <a-card title="API密钥管理" style="margin-top: 20px">
                <a-alert type="warning" message="安全提醒" description="请妥善保管您的API密钥，泄露密钥可能导致安全风险" show-icon
                    style="margin-bottom: 16px" />

                <a-list :data-source="userStore.apiKeys" bordered>
                    <template #renderItem="{ item }">
                        <a-list-item>
                            <template #actions>
                                <a-button type="link" danger @click="revokeKey(item.key)">撤销</a-button>
                            </template>
                            <a-list-item-meta :description="`创建时间: ${formatDate(item.createdAt)}`">
                                <template #title>
                                    <span style="margin-right: 12px">{{ item.name }}</span>
                                    <a-tag color="blue">{{ item.key }}</a-tag>
                                </template>
                            </a-list-item-meta>
                        </a-list-item>
                    </template>
                </a-list>
            </a-card>
        </template>

        <!-- 用户编辑模态框 -->
        <a-modal v-model:visible="userModal.visible" :title="userModal.isEditing ? '编辑用户' : '新建用户'"
            @ok="handleUserSubmit" @cancel="closeUserModal">
            <a-form :model="userForm" layout="vertical">
                <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
                    <a-input v-model:value="userForm.username" />
                </a-form-item>

                <a-form-item label="密码" name="password" :rules="[{ required: !userModal.isEditing, message: '请输入密码' }]">
                    <a-input-password v-model:value="userForm.password" />
                </a-form-item>

                <a-form-item label="管理员权限" name="isAdmin">
                    <a-switch v-model:checked="userForm.isAdmin" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- API密钥生成模态框 -->
        <a-modal v-model:visible="apiKeyModal.visible" title="生成API密钥" @ok="generateApiKey" @cancel="closeApiKeyModal">
            <a-form layout="vertical">
                <a-form-item label="密钥名称" :rules="[{ required: true, message: '请输入密钥名称' }]">
                    <a-input v-model:value="apiKeyModal.name" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { KeyOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '../store/userStore'
import type { User, ApiKey } from '../store/userStore'

const userStore = useUserStore()
const currentUser = computed(() => userStore.currentUser!)

// 用户管理相关状态
const searchQuery = ref('')
const userModal = reactive({
    visible: false,
    isEditing: false
})
const userForm = reactive({
    id: '',
    username: '',
    password: '',
    isAdmin: false
})

// API密钥相关状态
const apiKeyModal = reactive({
    visible: false,
    name: ''
})

// 表格列配置
const userColumns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '管理员', dataIndex: 'isAdmin' },
    { title: '注册时间', dataIndex: 'createTime' },
    { title: '操作', dataIndex: 'actions' }
]

// 计算属性
const filteredUsers = computed(() =>
    userStore.users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
)

// 方法
const showUserModal = (user?: User) => {
    if (user) {
        userForm.id = user.id
        userForm.username = user.username
        userForm.isAdmin = user.isAdmin
        userModal.isEditing = true
    } else {
        resetUserForm()
        userModal.isEditing = false
    }
    userModal.visible = true
}

const handleUserSubmit = () => {
    try {
        if (userModal.isEditing) {
            userStore.updateUser({ ...userForm })
            message.success('用户信息已更新')
        } else {
            userStore.register(userForm.username, userForm.password, userForm.isAdmin)
            message.success('用户创建成功')
        }
        closeUserModal()
    } catch (error) {
        message.error(error instanceof Error ? error.message : '操作失败')
    }
}

const deleteUser = (userId: string) => {
    try {
        userStore.deleteUser(userId)
        message.success('用户已删除')
    } catch (error) {
        message.error(error instanceof Error ? error.message : '删除失败')
    }
}

const editUser = (user: User): void => {
    showUserModal(user)
}

const handlePermissionChange = (user: User, isAdmin: boolean) => {
    Modal.confirm({
        title: '确认修改权限',
        content: `确定要将用户 ${user.username} 设为${isAdmin ? '管理员' : '普通用户'}吗？`,
        onOk: () => {
            try {
                userStore.updateUser({ ...user, isAdmin })
                message.success('权限已更新')
            } catch (error) {
                message.error(error instanceof Error ? error.message : '操作失败')
            }
        }
    })
}

const showApiKeyModal = () => {
    apiKeyModal.visible = true
}

const generateApiKey = () => {
    if (!apiKeyModal.name.trim()) {
        message.error('请输入密钥名称')
        return
    }

    try {
        userStore.generateApiKey(apiKeyModal.name)
        message.success('API密钥已生成')
        closeApiKeyModal()
    } catch (error) {
        message.error(error instanceof Error ? error.message : '生成失败')
    }
}

const revokeKey = (key: string) => {
    Modal.confirm({
        title: '确认撤销密钥',
        content: '此操作不可恢复，确定要撤销此API密钥吗？',
        onOk: () => {
            try {
                userStore.revokeApiKey(key)
                message.success('密钥已撤销')
            } catch (error) {
                message.error(error instanceof Error ? error.message : '操作失败')
            }
        }
    })
}

// 辅助方法
const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleString() : '--'
}

const setRowClass = (record: User) => {
    return record.id === currentUser.value.id ? 'current-user-row' : ''
}

const resetUserForm = () => {
    userForm.id = ''
    userForm.username = ''
    userForm.password = ''
    userForm.isAdmin = false
}

const closeUserModal = () => {
    userModal.visible = false
    resetUserForm()
}

const closeApiKeyModal = () => {
    apiKeyModal.visible = false
    apiKeyModal.name = ''
}
</script>

<style scoped>
.user-center {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

.user-management-toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}

.current-user-row {
    background-color: #fafafa;
}

:deep(.current-user-row) .ant-switch-disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>