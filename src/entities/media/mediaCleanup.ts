import { db } from '@/db/db'
import { deleteMediaByIds } from './mediaStore'

export async function cleanupOrphanedMedia(mediaIds: string[]): Promise<void> {
  if (mediaIds.length === 0) return

  const flashcards = await db.flashcards.toArray()

  const referencedIds = new Set<string>()

  for (const fc of flashcards) {
    for (const id of fc.frontMediaIds ?? []) referencedIds.add(id)
    for (const id of fc.backMediaIds ?? []) referencedIds.add(id)
  }

  const orphaned = mediaIds.filter((id) => !referencedIds.has(id))

  if (orphaned.length > 0) {
    await deleteMediaByIds(orphaned)
  }
}
