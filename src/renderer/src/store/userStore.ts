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
  // 添加 export
  key: string
  name: string
  createdAt: string
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

      // Load users
      const savedUsers = localStorage.getItem('users')
      this.users = savedUsers ? JSON.parse(savedUsers) : []

      // Load current user
      const savedUser = localStorage.getItem('currentUser')
      this.currentUser = savedUser ? JSON.parse(savedUser) : null

      // Load API keys
      const savedKeys = localStorage.getItem('apiKeys')
      this.apiKeys = savedKeys ? JSON.parse(savedKeys) : []

      this.initialized = true
    },

    register(
      username: string,
      password: string,
      isAdmin: boolean = false // 添加管理员参数
    ) {
      if (this.users.some((u) => u.username === username)) {
        throw new Error('用户名已存在')
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        password,
        isAdmin, // 设置管理员状态
        createTime: new Date().toISOString()
      }

      this.users.push(newUser)
      this.persistUsers()
    },

    login(username: string, password: string) {
      this.initialize()

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
      if (index >= 0) {
        this.users[index] = updatedUser
        this.persistUsers()

        // Update current user if editing self
        if (this.currentUser?.id === updatedUser.id) {
          this.currentUser = updatedUser
          this.persistCurrentUser()
        }
      }
    },

    deleteUser(userId: string) {
      this.users = this.users.filter((u) => u.id !== userId)
      this.persistUsers()
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

    // Helper methods
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
