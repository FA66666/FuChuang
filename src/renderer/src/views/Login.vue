<template>
    <a-row type="flex" justify="center" align="middle" style="min-height: 100vh;">
        <a-col :xs="24" :sm="20" :md="16" :lg="12" :xl="8">
            <a-card :title="state.isLoginMode ? '用户登录' : '用户注册'"
                :headStyle="{ textAlign: 'center', fontSize: '24px', fontWeight: 500 }"
                :bodyStyle="{ padding: '24px 32px' }">
                <a-form :model="state.form" name="auth-form" autocomplete="off" @finish="handleSubmit"
                    layout="vertical">
                    <!-- 用户名输入 -->
                    <a-form-item label="用户名" name="username" :rules="rules.username" :validate-status="usernameStatus"
                        :help="usernameHelp">
                        <a-input v-model:value="state.form.username" placeholder="4-16位字母、数字或下划线"
                            @blur="validateUsername">
                            <template #prefix>
                                <user-outlined style="color: rgba(0, 0, 0, 0.25)" />
                            </template>
                        </a-input>
                    </a-form-item>

                    <!-- 密码输入 -->
                    <a-form-item label="密码" name="password" :rules="rules.password" :validate-status="passwordStatus">
                        <a-input-password v-model:value="state.form.password" placeholder="至少6位，包含大小写字母和数字"
                            autocomplete="new-password">
                            <template #prefix>
                                <lock-outlined style="color: rgba(0, 0, 0, 0.25)" />
                            </template>
                        </a-input-password>
                        <div v-if="!state.isLoginMode" class="password-strength">
                            密码强度: <span :class="strengthClass">{{ passwordStrength }}</span>
                        </div>
                    </a-form-item>

                    <!-- 确认密码 -->
                    <a-form-item v-if="!state.isLoginMode" label="确认密码" name="confirmPassword"
                        :rules="[{ required: true, message: '请再次输入密码' }, { validator: validateConfirmPassword }]">
                        <a-input-password v-model:value="state.form.confirmPassword" placeholder="请确认您的密码"
                            autocomplete="new-password">
                            <template #prefix>
                                <safety-certificate-outlined style="color: rgba(0, 0, 0, 0.25)" />
                            </template>
                        </a-input-password>
                    </a-form-item>

                    <!-- 错误提示 -->
                    <a-alert v-if="state.errorMessage" :message="state.errorMessage" type="error" show-icon closable
                        banner style="margin-bottom: 24px; border-radius: 4px;" />

                    <!-- 提交按钮 -->
                    <a-form-item>
                        <a-button type="primary" html-type="submit" :loading="state.isSubmitting" block size="large"
                            :disabled="!formValid">
                            {{ state.isLoginMode ? '登 录' : '注 册' }}
                        </a-button>
                    </a-form-item>

                    <!-- 模式切换 -->
                    <div class="mode-switch">
                        <a-typography-text type="secondary">
                            {{ state.isLoginMode ? '新用户？' : '已有账户？' }}
                        </a-typography-text>
                        <a-button type="link" @click="toggleMode" style="padding-left: 8px;">
                            {{ state.isLoginMode ? '立即注册' : '立即登录' }}
                        </a-button>
                    </div>
                </a-form>
            </a-card>
        </a-col>
    </a-row>
</template>

<script lang="ts" setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/userStore'
import api from '../utils/api'
import {
    UserOutlined,
    LockOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons-vue'

interface FormState {
    username: string
    password: string
    confirmPassword?: string
}

const router = useRouter()
const userStore = useUserStore()

const state = reactive({
    isLoginMode: true,
    isSubmitting: false,
    errorMessage: '',
    form: {
        username: '',
        password: '',
        confirmPassword: ''
    } as FormState
})

// 密码正则（包含大小写字母和数字）
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,18}$/

// 增强验证规则
const rules = {
    username: [
        { required: true, message: '请输入用户名!' },
        {
            min: 4,
            max: 16,
            message: '用户名长度4-16位',
            trigger: 'blur'
        },
        {
            pattern: /^[a-zA-Z0-9_]+$/,
            message: '只能包含字母、数字和下划线',
            trigger: 'blur'
        }
    ],
    password: [
        { required: true, message: '请输入密码!' },
        {
            min: 6,
            max: 18,
            message: '密码长度6-18位',
            trigger: 'blur'
        },
        {
            pattern: PASSWORD_REGEX,
            message: '必须包含字母和数字',
            trigger: 'blur'
        }
    ]
}

// 计算属性
const usernameStatus = computed(() => {
    if (!state.form.username) return ''
    return state.form.username.length >= 4 && /^[a-zA-Z0-9_]+$/.test(state.form.username)
        ? 'success'
        : 'error'
})

const usernameHelp = computed(() => {
    if (!state.form.username) return ''
    if (state.form.username.length < 4) return '用户名至少4位'
    if (!/^[a-zA-Z0-9_]+$/.test(state.form.username)) return '包含非法字符'
    return ''
})

const passwordStatus = computed(() => {
    if (!state.form.password) return ''
    return PASSWORD_REGEX.test(state.form.password) ? 'success' : 'error'
})

const passwordStrength = computed(() => {
    if (state.form.password.length < 6) return '弱'
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(state.form.password)) return '强'
    if (/(?=.*[a-zA-Z])(?=.*\d)/.test(state.form.password)) return '中'
    return '弱'
})

const strengthClass = computed(() => ({
    weak: passwordStrength.value === '弱',
    medium: passwordStrength.value === '中',
    strong: passwordStrength.value === '强'
}))

const formValid = computed(() => {
    return (
        state.form.username.trim().length >= 4 &&
        state.form.password.length >= 6 &&
        (state.isLoginMode || state.form.password === state.form.confirmPassword)
    )
})

// 方法
const toggleMode = () => {
    state.isLoginMode = !state.isLoginMode
    state.errorMessage = ''
    state.form.confirmPassword = ''
}

const validateConfirmPassword = () => {
    if (state.form.password !== state.form.confirmPassword) {
        return Promise.reject('两次输入的密码不一致!')
    }
    return Promise.resolve()
}

const validateUsername = () => {
    if (!state.form.username) return
    if (!/^[a-zA-Z0-9_]+$/.test(state.form.username)) {
        state.errorMessage = '用户名包含非法字符'
    }
}

const handleSubmit = async () => {
    state.isSubmitting = true
    state.errorMessage = ''

    try {
        if (state.isLoginMode) {
            await handleLogin()
        } else {
            await handleRegister()
        }
    } catch (error) {
        handleError(error)
    } finally {
        state.isSubmitting = false
    }
}

const handleLogin = async () => {
    try {
        const { data } = await api.post('/auth/login', {
            username: state.form.username,
            password: state.form.password
        })

        await Promise.all([
            window.electronAPI.setToken(data.accessToken),
            window.electronAPI.setRefreshToken(data.refreshToken)
        ])

        // 更新用户状态（根据最新 store 定义）
        userStore.login(state.form.username, state.form.password)

        message.success('登录成功!')
        router.replace('/dashboard')
    } catch (error: any) {
        throw new Error(`登录失败: ${error.response?.data?.message || '服务器错误'}`)
    }
}

const handleRegister = async () => {
    try {
        await api.post('/auth/register', {
            username: state.form.username,
            password: state.form.password
        })

        message.success('注册成功，请登录!')
        state.form.password = ''
        state.form.confirmPassword = ''
        state.isLoginMode = true
    } catch (error: any) {
        const msg = error.response?.data?.message || '注册失败'
        throw new Error(msg.includes('Duplicate') ? '用户名已存在' : msg)
    }
}

const handleError = (error: unknown) => {
    state.errorMessage = error instanceof Error
        ? error.message
        : '系统繁忙，请稍后再试'

    setTimeout(() => {
        state.errorMessage = ''
    }, 5000)
}
</script>
<style scoped>
.mode-switch {
    text-align: center;
    margin-top: 16px;
}

.password-strength {
    margin-top: 8px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.65);

    span {
        margin-left: 4px;
        font-weight: 500;

        &.weak {
            color: #ff4d4f;
        }

        &.medium {
            color: #faad14;
        }

        &.strong {
            color: #52c41a;
        }
    }
}

:deep(.ant-form-item-label) {
    font-weight: 500;
}

:deep(.ant-input-affix-wrapper) {
    border-radius: 4px;
}
</style>