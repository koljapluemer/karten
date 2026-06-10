import { ref } from 'vue'

const focusFilter = ref<string | null>(null)

export function useFocusFilter() {
  return { focusFilter }
}
