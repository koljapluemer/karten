const STORAGE_KEY = 'karten:openai-key'

export const getOpenAIKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY)
}

export const setOpenAIKey = (value: string): void => {
  localStorage.setItem(STORAGE_KEY, value)
}

export const clearOpenAIKey = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}
