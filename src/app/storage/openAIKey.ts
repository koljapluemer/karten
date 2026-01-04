const STORAGE_KEY = 'openai_api_key'

export const getOpenAIKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY)
}

export const setOpenAIKey = (key: string): void => {
  localStorage.setItem(STORAGE_KEY, key)
}

export const clearOpenAIKey = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}
