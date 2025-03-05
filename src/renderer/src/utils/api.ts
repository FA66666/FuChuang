import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig
} from 'axios'

// 扩展 axios 类型声明
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean
  }
}

// 定义令牌接口
interface TokenPair {
  accessToken: string
  refreshToken: string
}

const baseURL = 'http://localhost:3000/' // 生产环境直连

// 创建 axios 实例
const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 刷新令牌标志
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

// 请求拦截器
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (config.url?.includes('/auth/refresh')) return config

  try {
    const token = await window.electronAPI.getToken()
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`
      } as AxiosRequestHeaders
    }
  } catch (error) {
    console.error('获取令牌失败:', error)
  }

  return config
})

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    const status = error.response?.status
    // 处理 401 未授权
    if (status === 401 && originalRequest?.url !== '/auth/refresh') {
      if (!originalRequest?._retry) {
        originalRequest!._retry = true

        try {
          const newToken = await handleTokenRefresh()
          if (newToken) {
            originalRequest!.headers!.Authorization = `Bearer ${newToken}`
            return api(originalRequest!)
          }
        } catch (refreshError) {
          console.error('令牌刷新失败:', refreshError)
          window.electronAPI.clearTokens()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      return retryOriginalRequest(originalRequest!)
    }

    // 处理其他错误状态
    handleErrorStatus(status)

    return Promise.reject(error)
  }
)

/** 处理令牌刷新 */
async function handleTokenRefresh(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push((token: string) => resolve(token))
    })
  }

  isRefreshing = true
  try {
    const refreshToken = await window.electronAPI.getRefreshToken()
    const { data } = await axios.post<TokenPair>(
      '/auth/refresh',
      { refreshToken },
      { baseURL: import.meta.env.VITE_API_URL }
    )

    await Promise.all([
      window.electronAPI.setToken(data.accessToken),
      window.electronAPI.setRefreshToken(data.refreshToken)
    ])

    notifySubscribers(data.accessToken)
    return data.accessToken
  } catch (error) {
    refreshSubscribers = []
    throw error
  } finally {
    isRefreshing = false
  }
}

/** 通知等待中的请求 */
function notifySubscribers(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

/** 重试原始请求 */
function retryOriginalRequest(originalRequest: AxiosRequestConfig) {
  return new Promise((resolve, reject) => {
    refreshSubscribers.push((token: string) => {
      originalRequest.headers!.Authorization = `Bearer ${token}`
      resolve(api(originalRequest))
    })
  })
}

/** 处理通用错误状态 */
function handleErrorStatus(status?: number): void {
  const errorHandler: Record<number, () => void> = {
    403: () => console.warn('无权访问该资源'),
    404: () => console.error('请求资源不存在'),
    500: () => (window.location.href = '/maintenance'),
    503: () => (window.location.href = '/maintenance')
  }

  if (status && errorHandler[status]) {
    errorHandler[status]()
  } else if (!status) {
    console.error('网络连接异常，请检查网络设置')
  }
}

export default api
