import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { LearningContentDoc } from './LearningContent'

const buildLearningContentId = (): string => `learning-content:${crypto.randomUUID()}`

const normalizeLearningContent = (doc: LearningContentDoc): LearningContentDoc => ({
  ...doc,
  relatedFlashcards: doc.relatedFlashcards ?? []
})

export const loadLearningContent = async (): Promise<LearningContentDoc[]> => {
  const docs = await loadDocsByPrefix<LearningContentDoc>('learning-content:')
  return docs.map(normalizeLearningContent)
}

export const createLearningContent = async (
  content: string,
  relatedFlashcards: string[] = []
): Promise<LearningContentDoc> => {
  const doc: LearningContentDoc = {
    _id: buildLearningContentId(),
    docType: 'L',
    content,
    relatedFlashcards
  }

  const result = await db.put(doc)
  return normalizeLearningContent({ ...doc, _rev: result.rev })
}

export const updateLearningContent = async (
  id: string,
  content: string,
  relatedFlashcards: string[] = []
): Promise<void> => {
  const current = await db.get<LearningContentDoc>(id)
  const updated: LearningContentDoc = {
    ...current,
    content,
    relatedFlashcards
  }
  await db.put(updated)
}

export const deleteLearningContent = async (id: string): Promise<void> => {
  const current = await db.get<LearningContentDoc>(id)
  await db.put({ ...current, _deleted: true } as LearningContentDoc & { _deleted: boolean })
}

export const getLearningContentById = async (id: string): Promise<LearningContentDoc> => {
  const doc = await db.get<LearningContentDoc>(id)
  return normalizeLearningContent(doc)
}
