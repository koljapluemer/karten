import { ref } from 'vue'

export type Toast = {
  id: string
  message: string
  type?: 'info' | 'success' | 'error'
}

const toasts = ref<Toast[]>([])

export const useToasts = () => toasts

export const showToast = (message: string, type: Toast['type'] = 'info'): void => {
  const id = crypto.randomUUID()
  toasts.value = [...toasts.value, { id, message, type }]

  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3000)
}

export const dismissToast = (id: string): void => {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}
