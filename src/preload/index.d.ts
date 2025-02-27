import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electronAPI: {
      readImage: (file: File) => Promise<string> // 返回Data URL
    }
    electron: ElectronAPI
    api: unknown
  }
}
