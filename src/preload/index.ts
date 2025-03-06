import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
const api = {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
contextBridge.exposeInMainWorld('electronAPI', {
  // 读图片
  readImage: (file: File) =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(file)
    }),
  // 注册
  register: (userData: { username: string; password: string }) =>
    ipcRenderer.invoke('register-user', userData),
  // 登录
  login: (credentials) => ipcRenderer.invoke('login-user', credentials),
  // 获得当前用户
  getCurrentUser: () => ipcRenderer.invoke('get-current-user')
})
