import JSZip from 'jszip'
import { db } from '@/db/db'

const extFromMimeType = (mimeType: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/webm': 'webm',
  }
  return map[mimeType] ?? 'bin'
}

export const exportFlashcardsAsZip = async (): Promise<void> => {
  const flashcards = await db.flashcards.toArray()

  const idToRef = new Map(flashcards.map((c, i) => [c.id, String(i + 1)]))

  const allMediaIds = new Set<string>()
  for (const card of flashcards) {
    card.frontMediaIds?.forEach(id => allMediaIds.add(id))
    card.backMediaIds?.forEach(id => allMediaIds.add(id))
  }

  const mediaRecords = await db.media.bulkGet([...allMediaIds])
  const mediaById = new Map(
    mediaRecords
      .filter((m): m is NonNullable<typeof m> => m != null)
      .map(m => [m.id, m])
  )

  const zip = new JSZip()
  const mediaIdToPath = new Map<string, string>()

  for (const [mediaId, media] of mediaById) {
    const ext = extFromMimeType(media.mimeType)
    const uuid = mediaId.replace('media:', '')
    const path = `media/${uuid}.${ext}`
    mediaIdToPath.set(mediaId, path)
    zip.file(path, media.blob)
  }

  const lines = flashcards.map(card => {
    const line: Record<string, unknown> = {
      front: card.front,
      back: card.back,
      ref: idToRef.get(card.id),
    }

    const blockedByRefs = card.blockedBy
      ?.map(id => idToRef.get(id))
      .filter((r): r is string => r != null)
    if (blockedByRefs?.length) line.blockedBy = blockedByRefs

    const befriendedRefs = card.befriendedCards
      ?.map(id => idToRef.get(id))
      .filter((r): r is string => r != null)
    if (befriendedRefs?.length) line.befriendedCards = befriendedRefs

    const frontMedia = card.frontMediaIds
      ?.map(id => mediaIdToPath.get(id))
      .filter((p): p is string => p != null)
    if (frontMedia?.length) line.frontMedia = frontMedia

    const backMedia = card.backMediaIds
      ?.map(id => mediaIdToPath.get(id))
      .filter((p): p is string => p != null)
    if (backMedia?.length) line.backMedia = backMedia

    return JSON.stringify(line)
  })

  zip.file('cards.jsonl', lines.join('\n'))

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'flashcards.zip'
  a.click()
  URL.revokeObjectURL(url)
}
