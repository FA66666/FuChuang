import { defineStore } from 'pinia'

export interface User {
  id: string
  username: string
  password: string
  isAdmin: boolean
  lastLogin?: string
}

export interface ApiKey {
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

      // 改为从主进程获取
      window.electronAPI.getCurrentUser().then((user) => {
        this.currentUser = user
        this.initialized = true
      })
    },

    async register(username: string, password: string) {
      const result = await window.electronAPI.register({ username, password })

      // 注册后自动登录
      const loginResult = await window.electronAPI.login({ username, password })

      this.currentUser = loginResult.user
      this.persistCurrentUser()
    },

    async login(username: string, password: string) {
      const result = await window.electronAPI.login({ username, password })

      this.currentUser = result.user
      this.persistCurrentUser()
      localStorage.setItem('authToken', result.token)
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
