import { defineStore } from 'pinia'

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
    taskCards: [] as { id: number; content: string }[]
  }),
  actions: {
    addTask(content: string) {
      const newId = this.taskCards.length + 1
      this.taskCards.push({
        id: newId,
        content
      })
    },
    updateTask(id: number, newContent: string) {
      const task = this.taskCards.find((task) => task.id === id)
      if (task) {
        task.content = newContent
      }
    },
    removeTask(id: number) {
      this.taskCards = this.taskCards.filter((task) => task.id !== id)
    }
  }
})
