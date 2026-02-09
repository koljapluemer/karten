import { db } from '@/db/db'
import type { LearningContent } from '@/db/LearningContent'

const buildLearningContentId = (): string => `learning-content:${crypto.randomUUID()}`

export const loadLearningContent = async (): Promise<LearningContent[]> => {
  return await db.learningContent.toArray()
}

export const createLearningContent = async (
  content: string,
  relatedFlashcards: string[] = [],
  tags: string[] = [],
  mediaIds: string[] = []
): Promise<LearningContent> => {
  const id = buildLearningContentId()

  const entity: LearningContent = {
    id,
    content,
    relatedFlashcards: [...relatedFlashcards],
    tags: [...tags],
    mediaIds: [...mediaIds]
  }

  await db.learningContent.add(entity)
  return entity
}

export const updateLearningContent = async (
  id: string,
  content: string,
  relatedFlashcards: string[] = [],
  tags: string[] = [],
  mediaIds: string[] = []
): Promise<void> => {
  await db.learningContent.update(id, {
    content,
    relatedFlashcards: [...relatedFlashcards],
    tags: [...tags],
    mediaIds: [...mediaIds]
  })
}

export const deleteLearningContent = async (id: string): Promise<void> => {
  await db.learningContent.delete(id)
}

export const getLearningContentById = async (id: string): Promise<LearningContent> => {
  const content = await db.learningContent.get(id)
  if (!content) throw new Error(`Learning content ${id} not found`)
  return content
}
