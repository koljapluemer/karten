import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { FlashCardDoc } from './FlashCard'

const buildFlashcardId = (): string => `flashcard:${crypto.randomUUID()}`

export const useFlashcardsStore = defineStore('flashcards', () => {
  const flashcards = ref<FlashCardDoc[]>([])
  const isLoaded = ref(false)

  const loadFlashcards = async (): Promise<void> => {
    if (isLoaded.value) return
    flashcards.value = await loadDocsByPrefix<FlashCardDoc>('flashcard:')
    isLoaded.value = true
  }

  const createFlashcard = async (front: string, back: string): Promise<FlashCardDoc> => {
    const now = new Date().toISOString()
    const card: FlashCardDoc = {
      _id: buildFlashcardId(),
      type: 'flashcard',
      front,
      back,
      createdAt: now,
      updatedAt: now
    }

    const result = await db.put(card)
    const stored = { ...card, _rev: result.rev }
    flashcards.value = [stored, ...flashcards.value]
    return stored
  }

  const updateFlashcard = async (
    cardId: string,
    updates: Partial<Pick<FlashCardDoc, 'front' | 'back'>>
  ): Promise<void> => {
    const current = flashcards.value.find((entry) => entry._id === cardId)
    if (!current) return
    const updated: FlashCardDoc = {
      ...current,
      front: updates.front ?? current.front,
      back: updates.back ?? current.back,
      updatedAt: new Date().toISOString()
    }
    const result = await db.put(updated)
    flashcards.value = flashcards.value.map((entry) =>
      entry._id === cardId ? { ...updated, _rev: result.rev } : entry
    )
  }

  const deleteFlashcard = async (cardId: string): Promise<void> => {
    const current = flashcards.value.find((entry) => entry._id === cardId)
    if (!current || !current._rev) return
    await db.put({ ...current, _deleted: true } as FlashCardDoc & { _deleted: boolean })
    flashcards.value = flashcards.value.filter((entry) => entry._id !== cardId)
  }

  return {
    flashcards,
    isLoaded,
    loadFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard
  }
})
