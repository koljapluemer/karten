import JSZip from 'jszip'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'

export type ParsedMaterial = {
  content: string
  format: 'text' | 'markdown'
  filename: string
}

export type ParsedFlashcard = {
  cardType: FlashCardDoc['cardType']
  front: string
  back: string
  instruction?: string
  requiresLearning?: string[]
  overlapping?: string[]
  filename: string
}

export const parseMaterialsFromZip = async (file: File): Promise<ParsedMaterial[]> => {
  const zip = await JSZip.loadAsync(file)
  const materials: ParsedMaterial[] = []

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue

    const lowerName = filename.toLowerCase()
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      const content = await zipEntry.async('text')
      const format = lowerName.endsWith('.md') ? 'markdown' : 'text'
      materials.push({ content, format, filename })
    }
  }

  return materials
}

export const parseFlashcardsFromZip = async (file: File): Promise<ParsedFlashcard[]> => {
  const zip = await JSZip.loadAsync(file)
  const flashcards: ParsedFlashcard[] = []

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue

    const lowerName = filename.toLowerCase()
    if (lowerName.endsWith('.json')) {
      const content = await zipEntry.async('text')
      try {
        const data = JSON.parse(content)

        if (!data.cardType || !data.front || !data.back) {
          console.warn(`Skipping ${filename}: missing required fields (cardType, front, back)`)
          continue
        }

        if (data.cardType !== 'declaritive' && data.cardType !== 'procedural') {
          console.warn(`Skipping ${filename}: invalid cardType "${data.cardType}"`)
          continue
        }

        flashcards.push({
          cardType: data.cardType,
          front: data.front,
          back: data.back,
          instruction: data.instruction || '',
          requiresLearning: data.requiresLearning || [],
          overlapping: data.overlapping || [],
          filename
        })
      } catch (err) {
        console.warn(`Skipping ${filename}: invalid JSON`, err)
      }
    }
  }

  return flashcards
}
