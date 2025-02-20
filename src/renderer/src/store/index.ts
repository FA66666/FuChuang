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
