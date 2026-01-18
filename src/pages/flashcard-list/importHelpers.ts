export type ParsedFlashcard = {
  front: string
  back: string
}

export const parseFlashcardsFromJsonl = async (file: File): Promise<ParsedFlashcard[]> => {
  const text = await file.text()
  const lines = text.split('\n')
  const items: ParsedFlashcard[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    try {
      const parsed = JSON.parse(trimmed)
      if (
        typeof parsed.front === 'string' &&
        typeof parsed.back === 'string'
      ) {
        items.push({
          front: parsed.front,
          back: parsed.back,
        })
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  return items
}
