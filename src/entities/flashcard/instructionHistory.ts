const STORAGE_KEY = 'flashcard-instruction-history'
const MAX_HISTORY = 10

export function getInstructionHistory(): string[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function addInstructionToHistory(instruction: string): void {
  if (!instruction.trim()) return

  const history = getInstructionHistory()
  const filtered = history.filter(i => i !== instruction)
  const updated = [instruction, ...filtered].slice(0, MAX_HISTORY)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
