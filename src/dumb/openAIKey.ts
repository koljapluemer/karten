const STORAGE_KEY = 'openai-api-key'

export function getOpenAIKey(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setOpenAIKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key)
}

export function clearOpenAIKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}
