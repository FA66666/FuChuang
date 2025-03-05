import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const isProduction = () => ipcRenderer.invoke('get-is-packaged')

const api = {
  readImage: (file: File) =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(file)
    }),
  getToken: () => ipcRenderer.invoke('get-token'),
  setToken: (token: string) => ipcRenderer.invoke('set-token', token),
  clearToken: () => ipcRenderer.invoke('clear-token'),
  getRefreshToken: () => ipcRenderer.invoke('get-refresh-token'),
  setRefreshToken: (token: string) => ipcRenderer.invoke('set-refresh-token', token),
  isProduction // 暴露新方法
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('上下文隔离暴露失败:', error)
  }
} else {
  // @ts-ignore
  window.electron = { ...electronAPI, ...api }
}
