import { defineStore } from 'pinia'
import axios from '../utils/request'

export interface User {
  id: string
  username: string
  password: string
  isAdmin: boolean
  lastLogin?: string
  createTime?: string
}

export interface ApiKey {
  key: string
  name: string
  createdAt: string
}

// 后端管理员接口基础地址（保持不变）
const ADMIN_API_URL = 'http://localhost:3000/api/admin/'

// 内部转换函数（仅用于转换数据格式，不改变外部变量名）
const transformUser = (u: any): User => {
  return {
    id: String(u.id),
    username: u.username,
    password: '', // 后端不会返回密码
    isAdmin: u.role === 'admin',
    lastLogin: u.last_login,
    createTime: u.created_at
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
    users: [] as User[],
    apiKeys: [] as ApiKey[],
    initialized: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    isAdmin: (state) => state.currentUser?.isAdmin || false
  },

  actions: {
    initialize() {
      if (this.initialized) return

      window.electronAPI.getCurrentUser().then((user) => {
        if (user) {
          // 若返回数据中包含 role，则进行转换
          this.currentUser = user.role ? transformUser(user) : user
          if (this.currentUser && this.currentUser.isAdmin) {
            this.fetchUsers()
          }
        }
        this.initialized = true
      })
    },

    async register(username: string, password: string) {
      const result = await window.electronAPI.register({ username, password })
      // 注册后自动登录
      const loginResult = await window.electronAPI.login({ username, password })
      // 转换登录返回的用户数据
      const userFromBackend = loginResult.user
      this.currentUser = transformUser(userFromBackend)
      this.persistCurrentUser()
    },

    async login(username: string, password: string) {
      const result = await window.electronAPI.login({ username, password })
      const userFromBackend = result.user
      this.currentUser = transformUser(userFromBackend)
      this.persistCurrentUser()
      localStorage.setItem('authToken', result.token)
      if (this.currentUser && this.currentUser.isAdmin) {
        await this.fetchUsers()
      }
    },

    logout() {
      this.currentUser = null
      localStorage.removeItem('currentUser')
    },

    // 从后端获取用户列表（支持搜索、分页），仅管理员调用
    async fetchUsers(search: string = '', page: number = 1, limit: number = 10) {
      try {
        const response = await axios.get(`${ADMIN_API_URL}users`, {
          params: { search, page, limit }
        })
        // 将后端返回的用户列表转换为前端格式
        this.users = response.data.data.users.map((u: any) => transformUser(u))
        this.persistUsers()
      } catch (error) {
        console.error('获取用户列表失败', error)
      }
    },

    // 更新用户操作调用后端 PATCH 接口（仅管理员有效）
    async updateUser(updatedUser: User) {
      if (this.currentUser && this.currentUser.isAdmin) {
        try {
          const payload = {
            username: updatedUser.username,
            password: updatedUser.password,
            role: updatedUser.isAdmin ? 'admin' : 'operator',
            status: 1
          }
          const response = await axios.patch(`${ADMIN_API_URL}users/${updatedUser.id}`, payload)
          const updatedData = response.data.data
          const index = this.users.findIndex((u) => u.id === updatedUser.id)
          if (index >= 0) {
            // 更新时仅对 username 和 isAdmin（由 role 决定）做转换，保留原有 createTime 和 lastLogin
            this.users[index] = {
              ...this.users[index],
              username: updatedData.username,
              isAdmin: updatedData.role === 'admin'
            }
            this.persistUsers()
          }
          if (this.currentUser.id === updatedUser.id) {
            this.currentUser = {
              ...this.currentUser,
              username: updatedData.username,
              isAdmin: updatedData.role === 'admin'
            }
            this.persistCurrentUser()
          }
        } catch (error) {
          console.error('更新用户失败', error)
          throw error
        }
      } else {
        const index = this.users.findIndex((u) => u.id === updatedUser.id)
        if (index >= 0) {
          this.users[index] = updatedUser
          this.persistUsers()
          if (this.currentUser?.id === updatedUser.id) {
            this.currentUser = updatedUser
            this.persistCurrentUser()
          }
        }
      }
    },

    // 删除用户操作调用后端 DELETE 接口（仅管理员有效）
    async deleteUser(userId: string) {
      if (this.currentUser && this.currentUser.isAdmin) {
        try {
          await axios.delete(`${ADMIN_API_URL}users/${userId}`)
          this.users = this.users.filter((u) => u.id !== userId)
          this.persistUsers()
        } catch (error) {
          console.error('删除用户失败', error)
          throw error
        }
      } else {
        this.users = this.users.filter((u) => u.id !== userId)
        this.persistUsers()
      }
    },

    generateApiKey(name: string) {
      const newKey = {
        key: `sk-${Math.random().toString(36).substr(2, 24)}`,
        name,
        createdAt: new Date().toISOString()
      }
      this.apiKeys.push(newKey)
      this.persistApiKeys()
    },

    revokeApiKey(key: string) {
      this.apiKeys = this.apiKeys.filter((k) => k.key !== key)
      this.persistApiKeys()
    },

    // Helper methods保持不变
    persistUsers() {
      localStorage.setItem('users', JSON.stringify(this.users))
    },

    persistCurrentUser() {
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
    },

    persistApiKeys() {
      localStorage.setItem('apiKeys', JSON.stringify(this.apiKeys))
    }
  }
})
