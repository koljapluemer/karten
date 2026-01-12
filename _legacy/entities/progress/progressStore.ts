import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type {
  DeclarativeLearningProgressDoc,
  LearningProgressDoc,
  ProceduralLearningProgressDoc
} from './LearningProgress'
import { createEmptyCard, fsrs, Rating, type Card, type CardInput, type Grade } from 'ts-fsrs'

const fsrsEngine = fsrs()

const buildProgressId = (cardId: string, type: 'declarative' | 'procedural'): string =>
  `progress:${type}:${cardId}`

const toStoredCard = (card: Card): CardInput => ({
  ...card,
  due: card.due.toISOString(),
  last_review: card.last_review ? card.last_review.toISOString() : null
})

const createStoredCard = (now: Date): CardInput =>
  createEmptyCard(now, (card) => toStoredCard(card))

const normalizeCard = (card: CardInput | undefined, now: Date): CardInput => {
  if (!card) return createStoredCard(now)
  return {
    ...card,
    last_review: card.last_review ?? null
  }
}

const scoreToRating = (score: number): Grade => {
  if (score <= 0.1) return Rating.Again
  if (score <= 0.6) return Rating.Hard
  if (score <= 0.8) return Rating.Good
  return Rating.Easy
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
    const now = new Date(occurredAt)
    const baseCard = normalizeCard(existing?.card, now)
    const rating = scoreToRating(score)
    const { card: updatedCard } = fsrsEngine.next(baseCard, now, rating)
    const storedCard = toStoredCard(updatedCard)

    const progressDoc: DeclarativeLearningProgressDoc = existing
      ? {
          ...existing,
          card: storedCard,
          totalReviews: updatedCard.reps
        }
      : {
          _id: buildProgressId(cardId, 'declarative'),
          type: 'learning-progress-declarative',
          cardId,
          card: storedCard,
          totalReviews: updatedCard.reps
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
