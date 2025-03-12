<template>
  <div class="login-container">
    <div class="login-background"></div>
    <a-row
      type="flex"
      justify="center"
      align="middle"
      style="min-height: 100vh; position: relative"
    >
      <a-col :xs="22" :sm="16" :md="12" :lg="8" :xl="6">
        <div class="login-card-wrapper" :class="{ 'register-mode': !isLoginMode }">
          <a-card class="login-card" :bordered="false">
            <div class="login-header">
              <h1 class="login-title">{{ isLoginMode ? '欢迎回来' : '创建账号' }}</h1>
              <p class="login-subtitle">{{ isLoginMode ? '很高兴再次见到您' : '开始您的旅程' }}</p>
            </div>

            <a-form
              :model="formState"
              name="basic"
              autocomplete="off"
              @finish="handleSubmit"
              layout="vertical"
            >
              <a-form-item
                label="用户名"
                name="username"
                :rules="[
                  { required: true, message: '请输入用户名!' },
                  { min: 4, max: 16, message: '用户名长度4-16位' }
                ]"
              >
                <a-input v-model:value="formState.username" size="large">
                  <template #prefix>
                    <user-outlined class="input-icon" />
                  </template>
                </a-input>
              </a-form-item>

              <a-form-item
                label="密码"
                name="password"
                :rules="[
                  { required: true, message: '请输入密码!' },
                  { min: 6, max: 18, message: '密码长度6-18位' }
                ]"
              >
                <a-input-password v-model:value="formState.password" size="large">
                  <template #prefix>
                    <lock-outlined class="input-icon" />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-form-item
                v-if="!isLoginMode"
                label="确认密码"
                name="confirmPassword"
                :rules="[
                  { required: true, message: '请再次输入密码!' },
                  { validator: validateConfirmPassword }
                ]"
              >
                <a-input-password v-model:value="formState.confirmPassword" size="large">
                  <template #prefix>
                    <safety-outlined class="input-icon" />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-alert
                v-if="errorMessage"
                :message="errorMessage"
                type="error"
                show-icon
                closable
                class="error-alert"
              />

              <a-form-item>
                <a-button
                  type="primary"
                  html-type="submit"
                  :loading="isSubmitting"
                  block
                  size="large"
                  class="submit-button"
                >
                  {{ isLoginMode ? '登录' : '注册' }}
                </a-button>
              </a-form-item>

              <div class="mode-switch">
                <a-typography-text type="secondary" class="mode-switch-text">
                  {{ isLoginMode ? '还没有账号？' : '已经有账号？' }}
                </a-typography-text>
                <a-button type="link" @click="toggleMode" class="mode-switch-button">
                  {{ isLoginMode ? '立即注册' : '立即登录' }}
                </a-button>
              </div>
            </a-form>
          </a-card>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/userStore'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons-vue'

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
    errorMessage.value = error instanceof Error ? error.message : '请求失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  opacity: 0.1;
  z-index: 0;
}

.login-card-wrapper {
  position: relative;
  z-index: 1;
  transform: translateY(0);
  transition: all 0.3s ease;
}

.login-card-wrapper:hover {
  transform: translateY(-5px);
}

.login-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.login-subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
}

:deep(.ant-input-affix-wrapper) {
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  transition: all 0.3s ease;
}

:deep(.ant-input-affix-wrapper:hover) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

:deep(.ant-input-affix-wrapper-focused) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.input-icon {
  color: rgba(0, 0, 0, 0.45);
}

.submit-button {
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
  border: none;
  transition: all 0.3s ease;
}

.submit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.error-alert {
  margin-bottom: 24px;
  border-radius: 8px;
}

.mode-switch {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
}

.mode-switch-text {
  font-size: 14px;
}

.mode-switch-button {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 0;
}

/* 响应式调整 */
@media (max-width: 576px) {
  .login-card {
    margin: 20px;
  }

  .login-title {
    font-size: 24px;
  }

  .login-subtitle {
    font-size: 14px;
  }
}

/* 切换动画 */
.register-mode {
  animation: cardExpand 0.3s ease-out forwards;
}

@keyframes cardExpand {
  from {
    transform: translateY(0) scale(1);
  }
  to {
    transform: translateY(0) scale(1.02);
  }
}
</style>
