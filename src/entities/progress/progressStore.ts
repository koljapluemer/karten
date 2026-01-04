import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as ebisu from '@/entities/ebisu'
import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type {
  DeclarativeLearningProgressDoc,
  LearningProgressDoc,
  ProceduralLearningProgressDoc
} from './LearningProgress'

const HOURS_IN_MS = 1000 * 60 * 60

const hoursSince = (isoTime: string): number => {
  const delta = Date.now() - Date.parse(isoTime)
  return Math.max(delta / HOURS_IN_MS, 0)
}

const buildProgressId = (cardId: string, type: 'declarative' | 'procedural'): string =>
  `progress:${type}:${cardId}`

const defaultModel = (): [number, number, number] => {
  const model = ebisu.defaultModel(24)
  return [model[0], model[1], model[2]]
}

export const useProgressStore = defineStore('learningProgress', () => {
  const progress = ref<LearningProgressDoc[]>([])
  const isLoaded = ref(false)

  const progressByCardId = computed<Record<string, LearningProgressDoc>>(() => {
    const map: Record<string, LearningProgressDoc> = {}
    progress.value.forEach((entry) => {
      map[entry.cardId] = entry
    })
    return map
  })

  const loadProgress = async (): Promise<void> => {
    if (isLoaded.value) return
    progress.value = await loadDocsByPrefix<LearningProgressDoc>('progress:')
    isLoaded.value = true
  }

  const updateDeclarativeProgress = async (
    cardId: string,
    score: number,
    occurredAt: string
  ): Promise<void> => {
    const existing = progressByCardId.value[cardId] as DeclarativeLearningProgressDoc | undefined
    const baseModel = existing?.model ?? defaultModel()
    const elapsedHours = existing ? hoursSince(existing.lastReviewedAt) : 1
    const updatedModel = ebisu.updateRecall(baseModel, score, 1, Math.max(elapsedHours, 0.01))

    const progressDoc: DeclarativeLearningProgressDoc = existing
      ? {
          ...existing,
          model: updatedModel,
          lastReviewedAt: occurredAt,
          totalReviews: existing.totalReviews + 1
        }
      : {
          _id: buildProgressId(cardId, 'declarative'),
          type: 'learning-progress-declarative',
          cardId,
          model: updatedModel,
          lastReviewedAt: occurredAt,
          totalReviews: 1
        }

    const result = await db.put(progressDoc)
    const stored = { ...progressDoc, _rev: result.rev }
    if (existing) {
      progress.value = progress.value.map((entry) =>
        entry.cardId === cardId ? stored : entry
      )
    } else {
      progress.value = [stored, ...progress.value]
    }
  }

  const updateProceduralProgress = async (
    cardId: string,
    updates: Pick<ProceduralLearningProgressDoc, 'isAchieved' | 'practiceNextAt'>
  ): Promise<void> => {
    const existing = progressByCardId.value[cardId] as ProceduralLearningProgressDoc | undefined
    const progressDoc: ProceduralLearningProgressDoc = existing
      ? {
          ...existing,
          isAchieved: updates.isAchieved,
          practiceNextAt: updates.practiceNextAt
        }
      : {
          _id: buildProgressId(cardId, 'procedural'),
          type: 'learning-progress-procedural',
          cardId,
          isAchieved: updates.isAchieved,
          practiceNextAt: updates.practiceNextAt
        }

    const result = await db.put(progressDoc)
    const stored = { ...progressDoc, _rev: result.rev }
    if (existing) {
      progress.value = progress.value.map((entry) =>
        entry.cardId === cardId ? stored : entry
      )
    } else {
      progress.value = [stored, ...progress.value]
    }
  }

  return {
    progress,
    isLoaded,
    progressByCardId,
    loadProgress,
    updateDeclarativeProgress,
    updateProceduralProgress
  }
})
