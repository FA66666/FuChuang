import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electronAPI: {
      /**
       * 读取图片文件并返回 Data URL
       * @param file 要读取的图片文件对象
       * @returns 图片的Data URL字符串
       */
      readImage: (file: File) => Promise<string>

      /**
       * 获取存储的访问令牌
       * @returns 访问令牌字符串或 null
       */
      getToken: () => Promise<string | null>

      /**
       * 存储新的访问令牌
       * @param token JWT访问令牌字符串
       * @returns 操作是否成功
       */
      setToken: (token: string) => Promise<boolean>

      /**
       * 获取存储的刷新令牌
       * @returns 刷新令牌字符串或 null
       */
      getRefreshToken: () => Promise<string | null>

      /**
       * 存储新的刷新令牌
       * @param token JWT刷新令牌字符串
       * @returns 操作是否成功
       */
      setRefreshToken: (token: string) => Promise<boolean>

      /**
       * 清除所有存储的令牌
       * @returns 操作是否成功
       */
      clearTokens: () => Promise<boolean>

      /**
       * 检测是否为生产环境
       * @returns Promise解析为boolean（true表示生产环境）
       */
      isProduction: () => Promise<boolean>
    }

    /** Electron 官方 API */
    electron: ElectronAPI

    /** 预留扩展 API */
    api: {
      // 可在此添加其他API方法
    }
  }
}
