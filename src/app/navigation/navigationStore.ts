import { ref } from 'vue'

interface NavigationHistoryEntry {
  path: string
  timestamp: number
  metadata?: Record<string, unknown>
}

const MAX_HISTORY = 50
const history = ref<NavigationHistoryEntry[]>([])

export function pushNavigationHistory(path: string, metadata?: Record<string, unknown>) {
  history.value.unshift({
    path,
    timestamp: Date.now(),
    metadata
  })

  if (history.value.length > MAX_HISTORY) {
    history.value = history.value.slice(0, MAX_HISTORY)
  }
}

export function getNavigationHistory(): NavigationHistoryEntry[] {
  return history.value
}

export function getPreviousPath(): string | null {
  return history.value[1]?.path ?? null
}

export function clearNavigationHistory() {
  history.value = []
}
