import { defineStore } from 'pinia'

export interface User {
  id: string
  username: string
  password: string
  isAdmin: boolean
  createTime?: string
  lastLogin?: string
}

export interface ApiKey {
  key: string
  name: string
  createdAt: string
}

interface UserState {
  currentUser: User | null
  users: User[]
  apiKeys: ApiKey[]
  initialized: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    users: [],
    apiKeys: [],
    initialized: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    isAdmin: (state) => state.currentUser?.isAdmin ?? false,
    getUserById: (state) => (userId: string) => state.users.find((u) => u.id === userId)
  },

  actions: {
    initialize() {
      if (this.initialized) return

      try {
        this.users = JSON.parse(localStorage.getItem('users') || '[]')
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
        this.apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '[]')
      } catch (error) {
        console.error('初始化用户存储失败:', error)
        this.clearStorage()
      } finally {
        this.initialized = true
      }
    },

    register(username: string, password: string, isAdmin: boolean = false) {
      this.initializeIfNeeded()

      if (this.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error(`用户 ${username} 已存在`)
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        username,
        password,
        isAdmin,
        createTime: new Date().toISOString()
      }

      this.users.push(newUser)
      this.persistUsers()
    },

    login(username: string, password: string) {
      this.initializeIfNeeded()

      const user = this.users.find((u) => u.username === username && u.password === password)

      if (!user) throw new Error('用户名或密码错误')

      this.currentUser = {
        ...user,
        lastLogin: new Date().toISOString()
      }
      this.persistCurrentUser()
    },

    logout() {
      this.currentUser = null
      localStorage.removeItem('currentUser')
    },

    updateUser(updatedUser: User) {
      const index = this.users.findIndex((u) => u.id === updatedUser.id)
      if (index === -1) return

      this.users.splice(index, 1, updatedUser)
      this.persistUsers()

      if (this.currentUser?.id === updatedUser.id) {
        this.currentUser = updatedUser
        this.persistCurrentUser()
      }
    },

    deleteUser(userId: string) {
      this.users = this.users.filter((u) => u.id !== userId)
      if (this.currentUser?.id === userId) this.logout()
      this.persistUsers()
    },

    generateApiKey(name: string): ApiKey {
      const newKey: ApiKey = {
        key: `sk-${crypto.randomUUID().replace(/-/g, '')}`,
        name,
        createdAt: new Date().toISOString()
      }

      this.apiKeys.push(newKey)
      this.persistApiKeys()
      return newKey
    },

    revokeApiKey(key: string) {
      this.apiKeys = this.apiKeys.filter((k) => k.key !== key)
      this.persistApiKeys()
    },

    // 私有方法
    initializeIfNeeded() {
      if (!this.initialized) this.initialize()
    },

    persistUsers() {
      localStorage.setItem('users', JSON.stringify(this.users))
    },

    persistCurrentUser() {
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
    },

    persistApiKeys() {
      localStorage.setItem('apiKeys', JSON.stringify(this.apiKeys))
    },

    clearStorage() {
      localStorage.removeItem('users')
      localStorage.removeItem('currentUser')
      localStorage.removeItem('apiKeys')
      this.$reset()
    }
  }
})
