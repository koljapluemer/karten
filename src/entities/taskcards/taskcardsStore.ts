import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { TaskCardDoc } from './TaskCard'

const buildTaskcardId = (): string => `taskcard:${crypto.randomUUID()}`

export const useTaskcardsStore = defineStore('taskcards', () => {
  const taskcards = ref<TaskCardDoc[]>([])
  const isLoaded = ref(false)

  const loadTaskcards = async (): Promise<void> => {
    if (isLoaded.value) return
    taskcards.value = await loadDocsByPrefix<TaskCardDoc>('taskcard:')
    isLoaded.value = true
  }

  const createTaskcard = async (front: string, back: string): Promise<TaskCardDoc> => {
    const now = new Date().toISOString()
    const card: TaskCardDoc = {
      _id: buildTaskcardId(),
      type: 'taskcard',
      front,
      back,
      createdAt: now,
      updatedAt: now
    }

    const result = await db.put(card)
    const stored = { ...card, _rev: result.rev }
    taskcards.value = [stored, ...taskcards.value]
    return stored
  }

  return {
    taskcards,
    isLoaded,
    loadTaskcards,
    createTaskcard
  }
})
