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
    const docs = await loadDocsByPrefix<FlashCardDoc>('flashcard:')
    flashcards.value = docs.map((doc) => ({
      ...doc,
      cardType: doc.cardType ?? 'declaritive',
      requiresLearning: doc.requiresLearning ?? [],
      overlapping: doc.overlapping ?? [],
      logs: doc.logs ?? {}
    }))
    isLoaded.value = true
  }

  const createFlashcard = async (
    front: string,
    back: string,
    cardType: FlashCardDoc['cardType'] = 'declaritive',
    requiresLearning: string[] = [],
    overlapping: string[] = []
  ): Promise<FlashCardDoc> => {
    const now = new Date().toISOString()
    const card: FlashCardDoc = {
      _id: buildFlashcardId(),
      type: 'flashcard',
      cardType,
      front,
      back,
      requiresLearning,
      overlapping,
      logs: {},
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
    updates: Partial<Pick<FlashCardDoc, 'front' | 'back' | 'overlapping' | 'requiresLearning' | 'cardType' | 'logs'>>
  ): Promise<void> => {
    const current = flashcards.value.find((entry) => entry._id === cardId)
    if (!current) return
    const updated: FlashCardDoc = {
      ...current,
      front: updates.front ?? current.front,
      back: updates.back ?? current.back,
      cardType: updates.cardType ?? current.cardType,
      requiresLearning: updates.requiresLearning ?? current.requiresLearning,
      overlapping: updates.overlapping ?? current.overlapping,
      logs: updates.logs ?? current.logs,
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
    const overlappingCards = flashcards.value.filter((entry) => entry.overlapping.includes(cardId))
    for (const other of overlappingCards) {
      const updated: FlashCardDoc = {
        ...other,
        overlapping: other.overlapping.filter((id) => id !== cardId),
        updatedAt: new Date().toISOString()
      }
      const result = await db.put(updated)
      flashcards.value = flashcards.value.map((entry) =>
        entry._id === other._id ? { ...updated, _rev: result.rev } : entry
      )
    }
    const requiredCards = flashcards.value.filter((entry) => entry.requiresLearning.includes(cardId))
    for (const other of requiredCards) {
      const updated: FlashCardDoc = {
        ...other,
        requiresLearning: other.requiresLearning.filter((id) => id !== cardId),
        updatedAt: new Date().toISOString()
      }
      const result = await db.put(updated)
      flashcards.value = flashcards.value.map((entry) =>
        entry._id === other._id ? { ...updated, _rev: result.rev } : entry
      )
    }
    await db.put({ ...current, _deleted: true } as FlashCardDoc & { _deleted: boolean })
    flashcards.value = flashcards.value.filter((entry) => entry._id !== cardId)
  }

  const addOverlapping = async (cardId: string, otherId: string): Promise<void> => {
    if (cardId === otherId) return
    const card = flashcards.value.find((entry) => entry._id === cardId)
    const other = flashcards.value.find((entry) => entry._id === otherId)
    if (!card || !other) return
    if (card.overlapping.includes(otherId) && other.overlapping.includes(cardId)) return

    const updatedCard: FlashCardDoc = {
      ...card,
      overlapping: Array.from(new Set([...card.overlapping, otherId])),
      updatedAt: new Date().toISOString()
    }
    const updatedOther: FlashCardDoc = {
      ...other,
      overlapping: Array.from(new Set([...other.overlapping, cardId])),
      updatedAt: new Date().toISOString()
    }

    const [cardResult, otherResult] = await Promise.all([
      db.put(updatedCard),
      db.put(updatedOther)
    ])

    flashcards.value = flashcards.value.map((entry) => {
      if (entry._id === cardId) return { ...updatedCard, _rev: cardResult.rev }
      if (entry._id === otherId) return { ...updatedOther, _rev: otherResult.rev }
      return entry
    })
  }

  const removeOverlapping = async (cardId: string, otherId: string): Promise<void> => {
    const card = flashcards.value.find((entry) => entry._id === cardId)
    const other = flashcards.value.find((entry) => entry._id === otherId)
    if (!card || !other) return

    const updatedCard: FlashCardDoc = {
      ...card,
      overlapping: card.overlapping.filter((id) => id !== otherId),
      updatedAt: new Date().toISOString()
    }
    const updatedOther: FlashCardDoc = {
      ...other,
      overlapping: other.overlapping.filter((id) => id !== cardId),
      updatedAt: new Date().toISOString()
    }

    const [cardResult, otherResult] = await Promise.all([
      db.put(updatedCard),
      db.put(updatedOther)
    ])

    flashcards.value = flashcards.value.map((entry) => {
      if (entry._id === cardId) return { ...updatedCard, _rev: cardResult.rev }
      if (entry._id === otherId) return { ...updatedOther, _rev: otherResult.rev }
      return entry
    })
  }

  const addLog = async (cardId: string, event: string, occurredAt = new Date().toISOString()): Promise<void> => {
    const current = flashcards.value.find((entry) => entry._id === cardId)
    if (!current) return
    const logs = { ...(current.logs ?? {}), [occurredAt]: event }
    const updated: FlashCardDoc = {
      ...current,
      logs,
      updatedAt: new Date().toISOString()
    }
    const result = await db.put(updated)
    flashcards.value = flashcards.value.map((entry) =>
      entry._id === cardId ? { ...updated, _rev: result.rev } : entry
    )
  }

  return {
    flashcards,
    isLoaded,
    loadFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    addOverlapping,
    removeOverlapping,
    addLog
  }
})
