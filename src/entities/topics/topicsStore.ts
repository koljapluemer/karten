import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { TopicDoc } from './Topic'

const buildTopicId = (): string => `topic:${crypto.randomUUID()}`

const normalizeNameParts = (name: string[]): string[] =>
  name.map((part) => part.trim()).filter((part) => part.length > 0)

export const useTopicsStore = defineStore('topics', () => {
  const topics = ref<TopicDoc[]>([])
  const isLoaded = ref(false)

  const loadTopics = async (): Promise<void> => {
    if (isLoaded.value) return
    topics.value = await loadDocsByPrefix<TopicDoc>('topic:')
    isLoaded.value = true
  }

  const createTopic = async (name: string[]): Promise<TopicDoc> => {
    const now = new Date().toISOString()
    const topic: TopicDoc = {
      _id: buildTopicId(),
      type: 'topic',
      name: normalizeNameParts(name),
      materials: [],
      levels: [],
      createdAt: now,
      updatedAt: now
    }
    const result = await db.put(topic)
    const stored = { ...topic, _rev: result.rev }
    topics.value = [stored, ...topics.value]
    return stored
  }

  const updateTopic = async (topicId: string, updates: Partial<Omit<TopicDoc, '_id' | 'type' | '_rev'>>): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current) return
    const updated: TopicDoc = {
      ...current,
      name: updates.name ? normalizeNameParts(updates.name) : current.name,
      materials: updates.materials ?? current.materials,
      levels: updates.levels ?? current.levels,
      updatedAt: new Date().toISOString()
    }
    const result = await db.put(updated)
    topics.value = topics.value.map((entry) =>
      entry._id === topicId ? { ...updated, _rev: result.rev } : entry
    )
  }

  const deleteTopic = async (topicId: string): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current || !current._rev) return
    await db.put({ ...current, _deleted: true } as TopicDoc & { _deleted: boolean })
    topics.value = topics.value.filter((entry) => entry._id !== topicId)
  }

  const addMaterial = async (topicId: string, content: string): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current) return
    const materials = [...current.materials, content]
    await updateTopic(topicId, { materials })
  }

  const updateMaterial = async (topicId: string, index: number, content: string): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current) return
    const materials = current.materials.map((item, i) => (i === index ? content : item))
    await updateTopic(topicId, { materials })
  }

  const removeMaterial = async (topicId: string, index: number): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current) return
    const materials = current.materials.filter((_item, i) => i !== index)
    await updateTopic(topicId, { materials })
  }

  const insertLevel = async (topicId: string, index: number): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current) return
    const levels = [...current.levels]
    levels.splice(index, 0, [])
    await updateTopic(topicId, { levels })
  }

  const removeLevel = async (topicId: string, index: number): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current) return
    const levels = current.levels.filter((_level, i) => i !== index)
    await updateTopic(topicId, { levels })
  }

  const addCardToLevel = async (topicId: string, levelIndex: number, cardId: string): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current) return
    const levels = current.levels.map((level) => level.filter((id) => id !== cardId))
    const target = levels[levelIndex] ?? []
    levels[levelIndex] = [...target, cardId]
    await updateTopic(topicId, { levels })
  }

  const removeCardFromLevels = async (topicId: string, cardId: string): Promise<void> => {
    const current = topics.value.find((entry) => entry._id === topicId)
    if (!current) return
    const levels = current.levels.map((level) => level.filter((id) => id !== cardId))
    await updateTopic(topicId, { levels })
  }

  const moveCardToLevel = async (topicId: string, cardId: string, levelIndex: number): Promise<void> => {
    await addCardToLevel(topicId, levelIndex, cardId)
  }

  return {
    topics,
    isLoaded,
    loadTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    addMaterial,
    updateMaterial,
    removeMaterial,
    insertLevel,
    removeLevel,
    addCardToLevel,
    removeCardFromLevels,
    moveCardToLevel
  }
})
