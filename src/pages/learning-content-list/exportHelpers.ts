import JSZip from 'jszip'
import { getMediaByIds } from '@/entities/media/mediaStore'
import { db } from '@/db/db'
import type { LearningContent } from '@/db/LearningContent'
import type { FlashCard } from '@/db/Flashcard'
import type { Media } from '@/db/Media'

const buildMediaPath = (media: Media): string => {
  const id = media.id.replace(/[^a-zA-Z0-9-]/g, '_')
  return `media/${id}_${media.filename}`
}

const addMediaToZip = (
  zip: JSZip,
  mediaIds: string[],
  mediaById: Map<string, Media>
): string[] => {
  const paths: string[] = []
  for (const mediaId of mediaIds) {
    const media = mediaById.get(mediaId)
    if (!media) continue
    const path = buildMediaPath(media)
    zip.file(path, media.blob)
    paths.push(path)
  }
  return paths
}

export const exportLearningContentAsZip = async (items: LearningContent[]): Promise<void> => {
  const zip = new JSZip()

  const allFlashcardIds = [...new Set(items.flatMap(item => item.relatedFlashcards ?? []))]
  const flashcardResults = await db.flashcards.bulkGet(allFlashcardIds)
  const flashcardsById = new Map(
    flashcardResults
      .filter((f): f is FlashCard => f !== undefined)
      .map(f => [f.id, f])
  )

  const allMediaIds = [...new Set([
    ...items.flatMap(item => item.mediaIds ?? []),
    ...flashcardResults.flatMap(f => f ? [...(f.frontMediaIds ?? []), ...(f.backMediaIds ?? [])] : [])
  ])]
  const mediaList = await getMediaByIds(allMediaIds)
  const mediaById = new Map(mediaList.map(m => [m.id, m]))

  const lines: string[] = []

  for (const item of items) {
    const mediaPaths = addMediaToZip(zip, item.mediaIds ?? [], mediaById)

    const record: Record<string, unknown> = { content: item.content }
    if (mediaPaths.length > 0) record.media = mediaPaths

    const flashcards = (item.relatedFlashcards ?? [])
      .map(id => flashcardsById.get(id))
      .filter((f): f is FlashCard => f !== undefined)

    if (flashcards.length > 0) {
      record.flashcards = flashcards.map(f => {
        const card: Record<string, unknown> = { front: f.front, back: f.back }
        const frontMedia = addMediaToZip(zip, f.frontMediaIds ?? [], mediaById)
        const backMedia = addMediaToZip(zip, f.backMediaIds ?? [], mediaById)
        if (frontMedia.length > 0) card.frontMedia = frontMedia
        if (backMedia.length > 0) card.backMedia = backMedia
        return card
      })
    }

    lines.push(JSON.stringify(record))
  }

  zip.file('content.jsonl', lines.join('\n'))

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'learning-content.zip'
  a.click()
  URL.revokeObjectURL(url)
}
