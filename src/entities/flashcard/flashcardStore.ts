import { db } from '@/db/db'
import type { FlashCard } from '@/db/Flashcard'

const buildFlashcardId = (): string => `flashcard:${crypto.randomUUID()}`

export const loadFlashcards = async (): Promise<FlashCard[]> => {
  return await db.flashcards.toArray()
}

export const createFlashcard = async (
  front: string,
  back: string,
  instruction: string,
  blockedBy: string[] = []
): Promise<FlashCard> => {
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

export const getFlashcardById = async (id: string): Promise<FlashCard> => {
  const card = await db.flashcards.get(id)
  if (!card) throw new Error(`Flashcard ${id} not found`)
  return card
}
