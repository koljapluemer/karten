import JSZip from 'jszip'

export type ParsedFlashcard = {
  front: string
  back: string
  tags?: string[]
  ref?: string
  blockedBy?: string[]
  frontMedia?: string[]
  backMedia?: string[]
}

const parseFlashcardLine = (trimmed: string): ParsedFlashcard | null => {
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

      if (typeof parsed.ref === 'string') {
        flashcard.ref = parsed.ref
      }

      if (Array.isArray(parsed.blockedBy)) {
        const parsedBlockedBy = parsed.blockedBy.filter((ref: unknown) => typeof ref === 'string')
        if (parsedBlockedBy.length > 0) {
          flashcard.blockedBy = parsedBlockedBy
        }
      }

      if (Array.isArray(parsed.frontMedia)) {
        const paths = parsed.frontMedia.filter((p: unknown) => typeof p === 'string')
        if (paths.length > 0) {
          flashcard.frontMedia = paths
        }
      }

      if (Array.isArray(parsed.backMedia)) {
        const paths = parsed.backMedia.filter((p: unknown) => typeof p === 'string')
        if (paths.length > 0) {
          flashcard.backMedia = paths
        }
      }

      return flashcard
    }
  } catch {
    // Skip invalid JSON lines
  }
  return null
}

export const parseFlashcardsFromJsonl = async (file: File): Promise<ParsedFlashcard[]> => {
  const text = await file.text()
  const lines = text.split('\n')
  const items: ParsedFlashcard[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const flashcard = parseFlashcardLine(trimmed)
    if (flashcard) {
      items.push(flashcard)
    }
  }

  return items
}

export const parseFlashcardsFromZip = async (
  file: File
): Promise<{ cards: ParsedFlashcard[], zip: JSZip }> => {
  const zip = await JSZip.loadAsync(file)

  const jsonlEntry = zip.file('cards.jsonl')
  if (!jsonlEntry) {
    throw new Error('ZIP file must contain a cards.jsonl file')
  }

  const text = await jsonlEntry.async('text')
  const lines = text.split('\n')
  const cards: ParsedFlashcard[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const flashcard = parseFlashcardLine(trimmed)
    if (flashcard) {
      cards.push(flashcard)
    }
  }

  return { cards, zip }
}
