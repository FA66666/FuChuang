import { app, shell, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import express from 'express'
import cors from 'cors'
import icon from '../../resources/icon.png?asset'
import path from 'path'
import fs from 'fs'

interface SaveImageParams {
  name: string
  data: Uint8Array
}

// ================= 安全存储配置 =================
const TOKEN_DIR = app.getPath('userData')
const createSecureStorage = (filename: string) => ({
  save: (token: string): void => {
    const encrypted = safeStorage.encryptString(token)
    fs.writeFileSync(path.join(TOKEN_DIR, filename), encrypted)
  },
  load: (): string | null => {
    try {
      const encrypted = fs.readFileSync(path.join(TOKEN_DIR, filename))
      return safeStorage.decryptString(encrypted)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`读取 ${filename} 失败:`, error)
      }
      return null
    }
  },
  clear: (): void => {
    const filePath = path.join(TOKEN_DIR, filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
})

const tokenStore = {
  accessToken: createSecureStorage('access-token.enc'),
  refreshToken: createSecureStorage('refresh-token.enc')
}

// ================= 窗口管理 =================
function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    icon: process.platform === 'linux' ? icon : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  // 加载页面逻辑
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// ================= 应用初始化 =================
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // 创建主窗口
  const mainWindow = createWindow()

  // ================= IPC 通信处理 =================
  // Token 管理
  ipcMain.handle('token:get', (_, type: 'access' | 'refresh') => tokenStore[type].load())
  ipcMain.handle('token:set', (_, type: 'access' | 'refresh', token: string) => {
    tokenStore[type].save(token)
    return true
  })
  ipcMain.handle('token:clear', () => {
    tokenStore.accessToken.clear()
    tokenStore.refreshToken.clear()
  })

  // 文件操作
  ipcMain.handle('file:save-image', async (_, params: SaveImageParams) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '保存图片',
      defaultPath: path.join(app.getPath('pictures'), params.name),
      filters: [{ name: '图片文件', extensions: ['png', 'jpg', 'jpeg'] }]
    })
    if (!filePath) throw new Error('用户取消操作')
    await fs.promises.writeFile(filePath, Buffer.from(params.data))
    return filePath
  })
  // ================== 主进程需要添加的 IPC 处理 ==================
  // 在 src/main/index.ts 中添加：
  ipcMain.handle('get-is-packaged', () => app.isPackaged)

  // 窗口管理
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
