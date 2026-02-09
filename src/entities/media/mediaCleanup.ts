import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import { loadLearningContent } from '@/entities/learning-content/learningContentStore'
import { deleteMediaByIds } from './mediaStore'

export async function cleanupOrphanedMedia(mediaIds: string[]): Promise<void> {
  if (mediaIds.length === 0) return

  const [flashcards, learningContent] = await Promise.all([
    loadFlashcards(),
    loadLearningContent()
  ])

  const referencedIds = new Set<string>()

  for (const fc of flashcards) {
    for (const id of fc.frontMediaIds ?? []) referencedIds.add(id)
    for (const id of fc.backMediaIds ?? []) referencedIds.add(id)
  }

  for (const lc of learningContent) {
    for (const id of lc.mediaIds ?? []) referencedIds.add(id)
  }

  const orphaned = mediaIds.filter((id) => !referencedIds.has(id))

  if (orphaned.length > 0) {
    await deleteMediaByIds(orphaned)
  }
}
