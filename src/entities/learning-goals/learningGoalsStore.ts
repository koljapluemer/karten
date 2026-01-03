import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { LearningGoalDoc } from './LearningGoal'

const buildLearningGoalId = (): string => `learning-goal:${crypto.randomUUID()}`

export const useLearningGoalsStore = defineStore('learningGoals', () => {
  const learningGoals = ref<LearningGoalDoc[]>([])
  const isLoaded = ref(false)

  const loadLearningGoals = async (): Promise<void> => {
    if (isLoaded.value) return
    learningGoals.value = await loadDocsByPrefix<LearningGoalDoc>('learning-goal:')
    isLoaded.value = true
  }

  const createLearningGoal = async (
    title: string,
    content?: string,
    parentId?: string
  ): Promise<LearningGoalDoc> => {
    const now = new Date().toISOString()
    const goal: LearningGoalDoc = {
      _id: buildLearningGoalId(),
      type: 'learning-goal',
      title,
      content: content?.trim() ? content : undefined,
      requiresLearning: [],
      flashcards: [],
      tasks: [],
      createdAt: now,
      updatedAt: now
    }

    const result = await db.put(goal)
    const stored = { ...goal, _rev: result.rev }
    learningGoals.value = [stored, ...learningGoals.value]

    if (parentId) {
      await addChildGoal(parentId, stored._id)
    }

    return stored
  }

  const addChildGoal = async (parentId: string, childId: string): Promise<void> => {
    const parent = learningGoals.value.find((entry) => entry._id === parentId)
    if (!parent) return
    if (parent.requiresLearning.includes(childId)) return
    const updated: LearningGoalDoc = {
      ...parent,
      requiresLearning: [...parent.requiresLearning, childId],
      updatedAt: new Date().toISOString()
    }
    const result = await db.put(updated)
    learningGoals.value = learningGoals.value.map((entry) =>
      entry._id === parentId ? { ...updated, _rev: result.rev } : entry
    )
  }

  const updateLearningGoal = async (
    goalId: string,
    updates: Partial<Pick<LearningGoalDoc, 'title' | 'content' | 'requiresLearning'>>
  ): Promise<void> => {
    const current = learningGoals.value.find((entry) => entry._id === goalId)
    if (!current) return
    const updated: LearningGoalDoc = {
      ...current,
      title: updates.title ?? current.title,
      content: updates.content ?? current.content,
      requiresLearning: updates.requiresLearning ?? current.requiresLearning,
      updatedAt: new Date().toISOString()
    }
    const result = await db.put(updated)
    learningGoals.value = learningGoals.value.map((entry) =>
      entry._id === goalId ? { ...updated, _rev: result.rev } : entry
    )
  }

  const removeChildGoal = async (parent: LearningGoalDoc, childId: string): Promise<void> => {
    const updated: LearningGoalDoc = {
      ...parent,
      requiresLearning: parent.requiresLearning.filter((id) => id !== childId),
      updatedAt: new Date().toISOString()
    }
    const result = await db.put(updated)
    learningGoals.value = learningGoals.value.map((entry) =>
      entry._id === parent._id ? { ...updated, _rev: result.rev } : entry
    )
  }

  const deleteLearningGoal = async (goalId: string): Promise<void> => {
    const current = learningGoals.value.find((entry) => entry._id === goalId)
    if (!current || !current._rev) return
    await db.put({ ...current, _deleted: true } as LearningGoalDoc & { _deleted: boolean })
    const parents = learningGoals.value.filter((entry) => entry.requiresLearning.includes(goalId))
    for (const parent of parents) {
      await removeChildGoal(parent, goalId)
    }
    learningGoals.value = learningGoals.value.filter((entry) => entry._id !== goalId)
  }

  return {
    learningGoals,
    isLoaded,
    loadLearningGoals,
    createLearningGoal,
    addChildGoal,
    updateLearningGoal,
    deleteLearningGoal
  }
})
