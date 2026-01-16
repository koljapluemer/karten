import { db } from '@/db/db'
import type { LearningContent } from '@/db/db'
import type { LearningContentDoc } from '../../db/LearningContent'

const buildLearningContentId = (): string => `learning-content:${crypto.randomUUID()}`

export const loadLearningContent = async (): Promise<LearningContentDoc[]> => {
  return await db.learningContent.toArray()
}

export const createLearningContent = async (
  content: string,
  relatedFlashcards: string[] = []
): Promise<LearningContentDoc> => {
  const id = buildLearningContentId()

  const entity: LearningContent = {
    id,
    content,
    relatedFlashcards: [...relatedFlashcards] // Convert to plain array
  }

  await db.learningContent.add(entity)
  return entity
}

export const updateLearningContent = async (
  id: string,
  content: string,
  relatedFlashcards: string[] = []
): Promise<void> => {
  await db.learningContent.update(id, {
    content,
    relatedFlashcards: [...relatedFlashcards] // Convert to plain array
  })
}

export const deleteLearningContent = async (id: string): Promise<void> => {
  await db.learningContent.delete(id)
}

export const getLearningContentById = async (id: string): Promise<LearningContentDoc> => {
  const content = await db.learningContent.get(id)
  if (!content) throw new Error(`Learning content ${id} not found`)
  return content
}
