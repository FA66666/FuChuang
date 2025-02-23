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
    taskCards: [] as { id: number; name: string; content: string }[] // 新增 name 属性
  }),
  actions: {
    addTask(name: string, content: string) {
      // 修改 addTask 方法，增加任务名称
      const newId = this.taskCards.length + 1
      this.taskCards.push({
        id: newId,
        name, // 任务名称
        content
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
      this.taskCards = this.taskCards.filter((task) => task.id !== id)
    }
  }
})
