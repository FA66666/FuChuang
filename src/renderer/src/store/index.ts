import { defineStore } from 'pinia'

export interface Task {
  id: number
  name: string
  content: string
  images: string[] // 新增图片数组字段
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
    taskCards: [] as { id: number; name: string; content: string; images: string[] }[] // 新增 name 属性
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
    addTaskImage(id: number, dataUrl: string) {
      const task = this.taskCards.find((t) => t.id === id)
      if (task) {
        task.images.push(dataUrl)
      }
    },
    removeTaskImage(id: number, imageIndex: number) {
      const task = this.taskCards.find((t) => t.id === id)
      if (task) {
        task.images.splice(imageIndex, 1)
      }
    }
  }
})
