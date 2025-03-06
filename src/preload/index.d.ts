import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electronAPI: {
      readImage: (file: File) => Promise<string> // 返回Data URL
      register: (userData: {
        username: string
        password: string
      }) => Promise<{ success: boolean; message?: string }>
      login: (credentials: { username: string; password: string }) => Promise<{
        user?: User
        token?: string
      }>
      getCurrentUser: () => Promise<User | null>
    }
    electron: ElectronAPI
    api: unknown
  }
}
