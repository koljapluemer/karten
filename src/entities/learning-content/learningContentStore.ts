import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { MaterialDoc } from './LearningContent'

const buildLearningContentId = (): string => `learning-content:${crypto.randomUUID()}`

export const loadLearningContent = async (): Promise<MaterialDoc[]> => {
  return await loadDocsByPrefix<MaterialDoc>('learning-content:')
}

export const createLearningContent = async (content: string): Promise<MaterialDoc> => {
  const doc: MaterialDoc = {
    _id: buildLearningContentId(),
    docType: 'L',
    content
  }

  const result = await db.put(doc)
  return { ...doc, _rev: result.rev }
}

export const updateLearningContent = async (id: string, content: string): Promise<void> => {
  const current = await db.get<MaterialDoc>(id)
  const updated: MaterialDoc = {
    ...current,
    content
  }
  await db.put(updated)
}

export const deleteLearningContent = async (id: string): Promise<void> => {
  const current = await db.get<MaterialDoc>(id)
  await db.put({ ...current, _deleted: true } as MaterialDoc & { _deleted: boolean })
}

export const getLearningContentById = async (id: string): Promise<MaterialDoc> => {
  return await db.get<MaterialDoc>(id)
}
