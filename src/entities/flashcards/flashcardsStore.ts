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

  return {
    flashcards,
    isLoaded,
    loadFlashcards,
    createFlashcard
  }
})
