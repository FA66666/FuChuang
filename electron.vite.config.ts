import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['express', 'cors'] // 排除后端依赖
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['fs'] // 排除预加载不需要的模块
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@views': resolve('src/renderer/src/views'),
        '@store': resolve('src/renderer/src/store'),
        '@utils': resolve('src/renderer/src/utils')
      }
    },
    plugins: [vue()],
    build: {
      target: 'esnext', // 启用现代ES特性
      rollupOptions: {
        external: ['electron'] // 确保正确排除
      }
    },
    server: {
      proxy: {}
    }
  }
})
