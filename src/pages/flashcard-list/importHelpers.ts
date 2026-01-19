export type ParsedFlashcard = {
  front: string
  back: string
  tags?: string[]
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
        const flashcard: ParsedFlashcard = {
          front: parsed.front,
          back: parsed.back,
        }

        if (Array.isArray(parsed.tags)) {
          const parsedTags = parsed.tags.filter((tag: unknown) => typeof tag === 'string')
          if (parsedTags.length > 0) {
            flashcard.tags = parsedTags
          }
        }

        items.push(flashcard)
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  return items
}
