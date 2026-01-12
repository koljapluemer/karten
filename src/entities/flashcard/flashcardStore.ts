import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { FlashCardDoc } from './Flashcard'

const buildFlashcardId = (): string => `flashcard:${crypto.randomUUID()}`

export const loadFlashcards = async (): Promise<FlashCardDoc[]> => {
  return await loadDocsByPrefix<FlashCardDoc>('flashcard:')
}

export const createFlashcard = async (
  front: string,
  back: string,
  instruction: string,
  blockedBy: string[] = []
): Promise<FlashCardDoc> => {
  const doc: FlashCardDoc = {
    _id: buildFlashcardId(),
    docType: 'F',
    front,
    back,
    instruction,
    blockedBy
  }

  const result = await db.put(doc)
  return { ...doc, _rev: result.rev }
}

export const updateFlashcard = async (
  id: string,
  front: string,
  back: string,
  instruction: string,
  blockedBy: string[] = []
): Promise<void> => {
  const current = await db.get<FlashCardDoc>(id)
  const updated: FlashCardDoc = {
    ...current,
    front,
    back,
    instruction,
    blockedBy
  }
  await db.put(updated)
}

export const deleteFlashcard = async (id: string): Promise<void> => {
  const current = await db.get<FlashCardDoc>(id)
  await db.put({ ...current, _deleted: true } as FlashCardDoc & { _deleted: boolean })
}

export const getFlashcardById = async (id: string): Promise<FlashCardDoc> => {
  return await db.get<FlashCardDoc>(id)
}
