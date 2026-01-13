import { db } from '@/app/storage/db'
import type { FlashCard } from '@/app/storage/db'
import type { FlashCardDoc } from './Flashcard'

const buildFlashcardId = (): string => `flashcard:${crypto.randomUUID()}`

export const loadFlashcards = async (): Promise<FlashCardDoc[]> => {
  return await db.flashcards.toArray()
}

export const createFlashcard = async (
  front: string,
  back: string,
  instruction: string,
  blockedBy: string[] = []
): Promise<FlashCardDoc> => {
  const id = buildFlashcardId()
  const card: FlashCard = {
    id,
    front,
    back,
    instruction,
    blockedBy: [...blockedBy] // Convert to plain array
  }

  await db.flashcards.add(card)
  return card
}

export const updateFlashcard = async (
  id: string,
  front: string,
  back: string,
  instruction: string,
  blockedBy: string[] = []
): Promise<void> => {
  await db.flashcards.update(id, {
    front,
    back,
    instruction,
    blockedBy: [...blockedBy] // Convert to plain array
  })
}

export const deleteFlashcard = async (id: string): Promise<void> => {
  await db.flashcards.delete(id)
}

export const getFlashcardById = async (id: string): Promise<FlashCardDoc> => {
  const card = await db.flashcards.get(id)
  if (!card) throw new Error(`Flashcard ${id} not found`)
  return card
}
