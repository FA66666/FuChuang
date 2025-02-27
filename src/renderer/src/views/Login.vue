<template>
    <a-row type="flex" justify="center" align="middle" style="min-height: 100vh">
        <a-col :span="8">
            <a-card :title="isLoginMode ? '用户登录' : '用户注册'" style="width: 100%">
                <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
                    <a-form-item label="用户名" name="username" :rules="[
                        { required: true, message: '请输入用户名!' },
                        { min: 4, max: 16, message: '用户名长度4-16位' },
                    ]">
                        <a-input v-model:value="formState.username" />
                    </a-form-item>

                    <a-form-item label="密码" name="password" :rules="[
                        { required: true, message: '请输入密码!' },
                        { min: 6, max: 18, message: '密码长度6-18位' },
                    ]">
                        <a-input-password v-model:value="formState.password" />
                    </a-form-item>

                    <a-form-item v-if="!isLoginMode" label="确认密码" name="confirmPassword" :rules="[
                        { required: true, message: '请再次输入密码!' },
                        { validator: validateConfirmPassword },
                    ]">
                        <a-input-password v-model:value="formState.confirmPassword" />
                    </a-form-item>

                    <a-alert v-if="errorMessage" :message="errorMessage" type="error" show-icon closable
                        style="margin-bottom: 16px" />

                    <a-form-item>
                        <a-button type="primary" html-type="submit" :loading="isSubmitting" block>
                            {{ isLoginMode ? '登录' : '注册' }}
                        </a-button>
                    </a-form-item>

                    <div class="mode-switch">
                        <a-typography-text type="secondary">
                            {{ isLoginMode ? '没有账号？' : '已有账号？' }}
                        </a-typography-text>
                        <a-button type="link" @click="toggleMode">
                            {{ isLoginMode ? '立即注册' : '立即登录' }}
                        </a-button>
                    </div>
                </a-form>
            </a-card>
        </a-col>
    </a-row>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/userStore'

interface FormState {
    username: string
    password: string
    confirmPassword?: string
}

const router = useRouter()
const userStore = useUserStore()

const isLoginMode = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const formState = reactive<FormState>({
    username: '',
    password: '',
    confirmPassword: ''
})

const toggleMode = () => {
    isLoginMode.value = !isLoginMode.value
    errorMessage.value = ''
    formState.confirmPassword = ''
}

const validateConfirmPassword = () => {
    if (formState.password !== formState.confirmPassword) {
        return Promise.reject('两次输入的密码不一致!')
    }
    return Promise.resolve()
}

const handleSubmit = async () => {
    isSubmitting.value = true
    errorMessage.value = ''

    try {
        if (isLoginMode.value) {
            await userStore.login(formState.username, formState.password)
            message.success('登录成功!')
            router.replace('/')
        } else {
            await userStore.register(formState.username, formState.password)
            message.success('注册成功!')
            toggleMode()
        }
    } catch (error) {
        errorMessage.value = (error instanceof Error)
            ? error.message
            : '请求失败，请稍后重试'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.mode-switch {
    text-align: center;
    margin-top: 16px;
}
</style>