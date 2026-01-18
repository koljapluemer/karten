type PromptContext = 'previous-knowledge' | 'learning-content'

const getStorageKey = (context: PromptContext): string => {
  return `last-selected-prompt-${context}`
}

export const getLastSelectedPromptId = (context: PromptContext): string | null => {
  return localStorage.getItem(getStorageKey(context))
}

export const setLastSelectedPromptId = (context: PromptContext, id: string): void => {
  localStorage.setItem(getStorageKey(context), id)
}
