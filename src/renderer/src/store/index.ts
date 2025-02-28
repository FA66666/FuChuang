import { defineStore } from 'pinia'
const MAX_IMAGES_PER_TASK = 50 // 限制每个任务最大图片数
export interface Task {
  id: number
  name: string
  content: string
  images: TaskImage[] // 改为对象数组存储完整图片信息
}

export interface TaskImage {
  id: string
  name: string
  preview: string // base64或图片路径
  modified: Date
}
export const useAppStore = defineStore('app', {
  state: () => ({
    imageData: null as File | null, // 允许 imageData 为 File 类型或者 null
    detectionResult: null // 可以保持为 null，或者根据实际情况定义类型
  }),
  actions: {
    setImageData(image: File) {
      this.imageData = image
    },
    setDetectionResult(result: any) {
      this.detectionResult = result
    }
  }
})

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    taskCards: [] as Task[]
  }),
  actions: {
    addTask(name: string, content: string) {
      // 修改 addTask 方法，增加任务名称
      const newId = this.taskCards.length + 1
      this.taskCards.push({
        id: newId,
        name, // 任务名称
        content,
        images: []
      })
    },
    updateTask(id: number, newContent: string, newName: string) {
      // 修改 updateTask 方法，允许更新任务名称
      const task = this.taskCards.find((task) => task.id === id)
      if (task) {
        task.content = newContent
        task.name = newName // 更新任务名称
      }
    },
    removeTask(id: number) {
      const index = this.taskCards.findIndex((t) => t.id === id)
      if (index > -1) {
        // 释放内存
        this.taskCards[index].images = []
        this.taskCards.splice(index, 1)
      }
    },
    addTaskImage(id: number, image: TaskImage) {
      const task = this.taskCards.find((t) => t.id === id)
      if (task) {
        if (task.images.length >= MAX_IMAGES_PER_TASK) {
          throw new Error('单个任务最多添加50张图片')
        }
        task.images.push(image)
      }
    },
    removeTaskImage(id: number, imageIndex: number) {
      const task = this.taskCards.find((t) => t.id === id)
      if (task) {
        task.images.splice(imageIndex, 1)
      }
    },
    persistTasks() {
      localStorage.setItem('tasks', JSON.stringify(this.taskCards))
    },
    // 添加自动保存
    plugins: [
      (store) => {
        store.$subscribe(() => {
          store.persistTasks()
        })
      }
    ]
  }
})
