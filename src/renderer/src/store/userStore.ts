import { defineStore } from 'pinia'

interface User {
  id: string
  username: string
  password: string // 实际项目应加密
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
    users: [] as User[],
    initialized: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.currentUser
  },

  actions: {
    initialize() {
      if (this.initialized) return

      // 从 localStorage 加载数据
      const savedUsers = localStorage.getItem('users')
      if (savedUsers) {
        this.users = JSON.parse(savedUsers)
      }

      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser)
      }

      this.initialized = true
    },

    register(username: string, password: string) {
      this.initialize()

      if (this.users.some((u) => u.username === username)) {
        throw new Error('用户名已存在')
      }

      const newUser = {
        id: Date.now().toString(),
        username,
        password
      }

      this.users.push(newUser)
      localStorage.setItem('users', JSON.stringify(this.users))
    },

    login(username: string, password: string) {
      this.initialize()

      const user = this.users.find((u) => u.username === username && u.password === password)

      if (!user) {
        throw new Error('用户名或密码错误')
      }

      this.currentUser = user
      localStorage.setItem('currentUser', JSON.stringify(user))
    },

    logout() {
      this.currentUser = null
      localStorage.removeItem('currentUser')
    }
  }
})
